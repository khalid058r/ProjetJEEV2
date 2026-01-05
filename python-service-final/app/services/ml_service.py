"""
Service ML avec modèles entraînables
Utilise scikit-learn pour les prédictions
"""
import logging
from pathlib import Path
from typing import Dict, Any, List, Tuple
import numpy as np

from app.config import settings
from app.models.schemas import (
    PredictRankRequest, PredictRankResponse,
    RecommendPriceRequest, RecommendPriceResponse,
    PotentialBestSeller, FindBestSellersResponse,
    TrendDirection
)

logger = logging.getLogger(__name__)

# Flags
SKLEARN_AVAILABLE = False

try:
    from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor, RandomForestClassifier
    from sklearn.preprocessing import StandardScaler
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
    import joblib
    SKLEARN_AVAILABLE = True
    logger.info("[OK] Scikit-learn disponible")
except ImportError:
    logger.warning("[WARN] Scikit-learn non disponible")


class RankPredictionModel:
    """Modèle de prédiction du rang"""
    
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler() if SKLEARN_AVAILABLE else None
        self.is_trained = False
        self.metrics: Dict[str, float] = {}
        self.model_path = Path(settings.models_dir) / "rank_model.pkl"
    
    def train(self, products: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Entraîne le modèle"""
        if not SKLEARN_AVAILABLE:
            return {"error": "sklearn non disponible"}
        
        logger.info(f" Entraînement modèle de rang sur {len(products)} produits...")
        
        X, y = [], []
        for p in products:
            rank = p.get('rank')
            if rank and 0 < rank < 100000:
                X.append([
                    p.get('price', 0) or 0,
                    p.get('rating', 0) or 0,
                    np.log1p(p.get('review_count', 0) or 0),
                    p.get('stock', 0) or 0
                ])
                y.append(rank)
        
        if len(X) < 20:
            return {"error": "Pas assez de données (min 20)"}
        
        X = np.array(X)
        y = np.array(y)
        
        X = self.scaler.fit_transform(X)
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        self.model = RandomForestRegressor(
            n_estimators=settings.ml_n_estimators,
            max_depth=settings.ml_max_depth,
            random_state=42,
            n_jobs=-1
        )
        self.model.fit(X_train, y_train)
        
        y_pred = self.model.predict(X_test)
        self.metrics = {
            "rmse": float(np.sqrt(mean_squared_error(y_test, y_pred))),
            "mae": float(mean_absolute_error(y_test, y_pred)),
            "r2": float(r2_score(y_test, y_pred)),
            "samples": len(X)
        }
        
        self.is_trained = True
        self._save()
        
        logger.info(f"[OK]  Modèle rang entraîné - R²: {self.metrics['r2']:.3f}")
        return {"success": True, "metrics": self.metrics}
    
    def predict(self, product: Dict[str, Any]) -> Tuple[int, float]:
        """Prédit le rang"""
        if not self.is_trained:
            self._load()
        
        if not self.is_trained:
            return self._heuristic_predict(product)
        
        features = np.array([[
            product.get('price', 0) or 0,
            product.get('rating', 0) or 0,
            np.log1p(product.get('review_count', 0) or 0),
            product.get('stock', 0) or 0
        ]])
        features = self.scaler.transform(features)
        
        predicted = self.model.predict(features)[0]
        confidence = min(0.95, max(0.3, self.metrics.get('r2', 0.5)))
        
        return int(max(1, predicted)), confidence
    
    def _heuristic_predict(self, product: Dict[str, Any]) -> Tuple[int, float]:
        """Fallback heuristique"""
        current_rank = product.get('rank', 5000) or 5000
        rating = product.get('rating', 0) or 0
        reviews = product.get('review_count', 0) or 0
        
        score = (rating * np.log1p(reviews)) / np.log1p(current_rank)
        
        if score > 10:
            predicted = int(current_rank * 0.5)
        elif score > 5:
            predicted = int(current_rank * 0.7)
        else:
            predicted = current_rank
        
        return max(1, predicted), 0.5
    
    def _save(self):
        if not SKLEARN_AVAILABLE:
            return
        self.model_path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump({'model': self.model, 'scaler': self.scaler, 'metrics': self.metrics}, self.model_path)
    
    def _load(self):
        if self.model_path.exists():
            try:
                data = joblib.load(self.model_path)
                self.model = data['model']
                self.scaler = data['scaler']
                self.metrics = data['metrics']
                self.is_trained = True
            except Exception as e:
                logger.warning(f"Erreur chargement modèle: {e}")


class PriceRecommendationModel:
    """Modèle de recommandation de prix"""
    
    def __init__(self):
        self.model = None
        self.is_trained = False
        self.category_stats: Dict[str, Dict[str, float]] = {}
        self.model_path = Path(settings.models_dir) / "price_model.pkl"
    
    def train(self, products: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Entraîne le modèle"""
        if not SKLEARN_AVAILABLE:
            return {"error": "sklearn non disponible"}
        
        logger.info(" Entraînement modèle de prix...")
        
        from collections import defaultdict
        cat_prices = defaultdict(list)
        
        for p in products:
            cat = p.get('category') or p.get('category_name', 'Unknown')
            price = p.get('price', 0)
            if price > 0:
                cat_prices[cat].append(price)
        
        for cat, prices in cat_prices.items():
            self.category_stats[cat] = {
                'mean': float(np.mean(prices)),
                'median': float(np.median(prices)),
                'std': float(np.std(prices)),
                'min': float(min(prices)),
                'max': float(max(prices))
            }
        
        X, y = [], []
        for p in products:
            if p.get('price', 0) > 0:
                X.append([
                    p.get('rating', 0) or 0,
                    np.log1p(p.get('review_count', 0) or 0),
                    np.log1p(p.get('rank', 5000) or 5000)
                ])
                y.append(p['price'])
        
        if len(X) < 20:
            return {"error": "Pas assez de données"}
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        self.model = GradientBoostingRegressor(n_estimators=100, max_depth=5, random_state=42)
        self.model.fit(X_train, y_train)
        
        self.is_trained = True
        self._save()
        
        logger.info(f"[OK]  Modèle prix entraîné - {len(self.category_stats)} catégories")
        return {"success": True, "categories": len(self.category_stats)}
    
    def recommend(self, product: Dict[str, Any]) -> Dict[str, Any]:
        """Recommande un prix"""
        current_price = product.get('price', 0)
        category = product.get('category') or product.get('category_name', 'Unknown')
        
        cat_stats = self.category_stats.get(category, {})
        avg_price = cat_stats.get('mean', current_price)
        
        if self.is_trained and self.model:
            features = [[
                product.get('rating', 0) or 0,
                np.log1p(product.get('review_count', 0) or 0),
                np.log1p(product.get('rank', 5000) or 5000)
            ]]
            recommended = self.model.predict(features)[0]
        else:
            recommended = avg_price
        
        rank = product.get('rank', 5000) or 5000
        if rank > 5000:
            recommended *= 0.9
            reasoning = "Prix réduit pour améliorer le rang"
        elif rank < 100:
            recommended *= 1.05
            reasoning = "Position premium permet un prix plus élevé"
        else:
            reasoning = "Prix optimisé selon le marché"
        
        recommended = round(max(0.01, recommended), 2)
        change = ((recommended - current_price) / current_price * 100) if current_price > 0 else 0
        
        return {
            "recommended_price": recommended,
            "price_change_percent": round(change, 1),
            "category_avg": round(avg_price, 2),
            "reasoning": reasoning
        }
    
    def _save(self):
        if not SKLEARN_AVAILABLE:
            return
        self.model_path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump({'model': self.model, 'category_stats': self.category_stats}, self.model_path)
    
    def _load(self):
        if self.model_path.exists():
            try:
                data = joblib.load(self.model_path)
                self.model = data['model']
                self.category_stats = data['category_stats']
                self.is_trained = True
            except Exception as e:
                logger.warning(f"Erreur chargement modèle prix: {e}")


class BestSellerDetector:
    """Détecteur de best-sellers potentiels"""
    
    def __init__(self):
        self.model = None
        self.is_trained = False
        self.model_path = Path(settings.models_dir) / "bestseller_model.pkl"
    
    def train(self, products: List[Dict[str, Any]], threshold: int = 100) -> Dict[str, Any]:
        """Entraîne le détecteur"""
        if not SKLEARN_AVAILABLE:
            return {"error": "sklearn non disponible"}
        
        logger.info(" Entraînement détecteur best-sellers...")
        
        X, y = [], []
        for p in products:
            rank = p.get('rank', 9999) or 9999
            if rank > 0:
                X.append([
                    p.get('rating', 0) or 0,
                    np.log1p(p.get('review_count', 0) or 0),
                    p.get('price', 0) or 0
                ])
                y.append(1 if rank <= threshold else 0)
        
        if len(X) < 30 or sum(y) < 5:
            return {"error": "Pas assez de best-sellers dans les données"}
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
        
        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=8,
            class_weight='balanced',
            random_state=42
        )
        self.model.fit(X_train, y_train)
        
        self.is_trained = True
        self._save()
        
        logger.info(f"[OK]  Détecteur entraîné - {sum(y)} best-sellers identifiés")
        return {"success": True, "bestsellers_count": sum(y)}
    
    def predict_potential(self, product: Dict[str, Any]) -> Tuple[float, List[str]]:
        """Prédit le potentiel best-seller"""
        if not self.is_trained:
            self._load()
        
        reasons = []
        rating = product.get('rating', 0) or 0
        reviews = product.get('review_count', 0) or 0
        rank = product.get('rank', 9999) or 9999
        
        if self.is_trained and self.model:
            features = [[rating, np.log1p(reviews), product.get('price', 0) or 0]]
            proba = self.model.predict_proba(features)[0][1]
        else:
            proba = 0.0
            if rating >= 4.5:
                proba += 0.3
            if reviews >= 100:
                proba += 0.3
            if rank < 1000:
                proba += 0.2
        
        if rating >= 4.7:
            reasons.append(f"⭐ Excellent rating ({rating}/5)")
        elif rating >= 4.5:
            reasons.append(f"⭐ Très bon rating ({rating}/5)")
        
        if reviews >= 500:
            reasons.append(f" Très populaire ({reviews} avis)")
        elif reviews >= 100:
            reasons.append(f" Populaire ({reviews} avis)")
        
        if 100 < rank < 500:
            reasons.append(" Position prometteuse")
        
        return float(proba), reasons
    
    def _save(self):
        if not SKLEARN_AVAILABLE:
            return
        self.model_path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump({'model': self.model}, self.model_path)
    
    def _load(self):
        if self.model_path.exists():
            try:
                self.model = joblib.load(self.model_path)['model']
                self.is_trained = True
            except Exception as e:
                logger.warning(f"Erreur chargement modèle bestseller: {e}")


class MLService:
    """Service ML unifié"""
    
    def __init__(self):
        self.rank_model = RankPredictionModel()
        self.price_model = PriceRecommendationModel()
        self.bestseller_model = BestSellerDetector()
    
    def train_all(self, products: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Entraîne tous les modèles"""
        logger.info(f" Entraînement complet sur {len(products)} produits...")
        
        results = {
            'rank': self.rank_model.train(products),
            'price': self.price_model.train(products),
            'bestseller': self.bestseller_model.train(products)
        }
        
        logger.info("[OK]  Entraînement terminé")
        return results
    
    def predict_rank(self, request: PredictRankRequest) -> PredictRankResponse:
        """Prédit le rang futur"""
        product = {
            'price': request.price,
            'rating': request.rating,
            'review_count': request.review_count,
            'rank': request.current_rank,
            'category': request.category
        }
        
        predicted_rank, confidence = self.rank_model.predict(product)
        
        if predicted_rank < request.current_rank * 0.8:
            trend = TrendDirection.UP
            recommendation = " Fort potentiel d'amélioration du classement"
        elif predicted_rank > request.current_rank * 1.2:
            trend = TrendDirection.DOWN
            recommendation = "[WARN] ️ Risque de baisse, optimisez prix et visibilité"
        else:
            trend = TrendDirection.STABLE
            recommendation = "[OK] ️ Position stable attendue"
        
        return PredictRankResponse(
            product_id=request.product_id,
            current_rank=request.current_rank,
            predicted_rank=predicted_rank,
            confidence=confidence,
            trend=trend,
            factors={},
            recommendation=recommendation
        )
    
    def recommend_price(self, request: RecommendPriceRequest) -> RecommendPriceResponse:
        """Recommande un prix optimal"""
        product = {
            'price': request.current_price,
            'rating': request.rating,
            'review_count': request.review_count,
            'rank': request.rank,
            'category': request.category
        }
        
        result = self.price_model.recommend(product)
        
        return RecommendPriceResponse(
            product_id=request.product_id,
            current_price=request.current_price,
            recommended_price=result['recommended_price'],
            price_change_percent=result['price_change_percent'],
            reasoning=result['reasoning'],
            competitor_avg_price=result.get('category_avg')
        )
    
    def find_bestsellers(self, products: List[Dict[str, Any]], top_n: int = 20) -> FindBestSellersResponse:
        """Trouve les best-sellers potentiels"""
        candidates = []
        
        for p in products:
            score, reasons = self.bestseller_model.predict_potential(p)
            
            if score >= 0.3:
                candidates.append(PotentialBestSeller(
                    product_id=p.get('id', 0),
                    title=p.get('title', 'Unknown')[:100],
                    current_rank=p.get('rank', 9999) or 9999,
                    rating=p.get('rating', 0) or 0,
                    review_count=p.get('review_count', 0) or 0,
                    price=p.get('price', 0) or 0,
                    potential_score=round(score, 4),
                    reasons=reasons
                ))
        
        candidates.sort(key=lambda x: x.potential_score, reverse=True)
        
        return FindBestSellersResponse(
            count=min(len(candidates), top_n),
            products=candidates[:top_n],
            criteria={
                "model_trained": self.bestseller_model.is_trained,
                "total_analyzed": len(products),
                "candidates_found": len(candidates)
            }
        )
    
    def get_status(self) -> Dict[str, Any]:
        """Retourne le statut des modèles"""
        return {
            "sklearn_available": SKLEARN_AVAILABLE,
            "rank_model": {
                "trained": self.rank_model.is_trained,
                "metrics": self.rank_model.metrics
            },
            "price_model": {
                "trained": self.price_model.is_trained,
                "categories": len(self.price_model.category_stats)
            },
            "bestseller_model": {
                "trained": self.bestseller_model.is_trained
            }
        }


# Instance singleton
ml_service = MLService()
