"""
Service ML Unifié - Remplace ml_service.py et ml_service_v2.py
Utilise le ModelManager singleton pour des performances optimales
"""
import logging
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
from functools import lru_cache

from app.core.model_manager import get_model_manager

logger = logging.getLogger(__name__)

# Vérifier disponibilité sklearn
SKLEARN_AVAILABLE = False
try:
    from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor, RandomForestClassifier
    from sklearn.preprocessing import StandardScaler
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
    import joblib
    SKLEARN_AVAILABLE = True
except ImportError:
    logger.warning("⚠️ Scikit-learn non disponible")


class MLService:
    """
    Service ML unifié avec:
    - Singleton ModelManager pour éviter rechargement
    - Cache LRU pour les prédictions fréquentes
    - Fallback gracieux si modèles indisponibles
    - API unifiée pour Java
    """
    
    def __init__(self):
        self._model_manager = None
    
    @property
    def model_manager(self):
        """Lazy loading du ModelManager"""
        if self._model_manager is None:
            self._model_manager = get_model_manager()
        return self._model_manager
    
    # ========== STATUS ==========
    
    def is_ready(self) -> bool:
        """Vérifie si le service est prêt"""
        return self.model_manager.is_ready()
    
    def get_status(self) -> Dict[str, Any]:
        """Retourne le statut complet du service ML"""
        return {
            "sklearn_available": SKLEARN_AVAILABLE,
            **self.model_manager.get_status()
        }
    
    # ========== PRÉDICTION DE PRIX ==========
    
    def predict_price(self, product_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Prédit le prix optimal pour un produit
        
        Args:
            product_data: {rating, reviews, category, rank, price, ...}
        
        Returns:
            {predicted_price, confidence, price_range, recommendation}
        """
        try:
            model = self.model_manager.price_model
            
            if model is None:
                return self._fallback_price_prediction(product_data)
            
            features = self._prepare_features(product_data)
            if features is None:
                return self._fallback_price_prediction(product_data)
            
            # Prédiction
            predicted_price = float(model.predict([features])[0])
            
            # Intervalle de confiance
            confidence = 0.85
            price_std = 0
            
            if hasattr(model, 'estimators_'):
                predictions = [tree.predict([features])[0] for tree in model.estimators_[:10]]
                price_std = float(np.std(predictions))
                confidence = max(0.5, 1 - (price_std / max(predicted_price, 1)))
            
            # Plage de prix
            price_min = max(0, predicted_price - 2 * price_std) if price_std > 0 else predicted_price * 0.9
            price_max = predicted_price + 2 * price_std if price_std > 0 else predicted_price * 1.1
            
            # Recommandation
            current_price = product_data.get('price', predicted_price) or predicted_price
            if current_price > 0:
                diff_pct = ((predicted_price - current_price) / current_price) * 100
                if diff_pct > 10:
                    recommendation = f"📈 Prix actuel sous-évalué de {diff_pct:.1f}%. Augmenter le prix."
                elif diff_pct < -10:
                    recommendation = f"📉 Prix actuel surévalué de {abs(diff_pct):.1f}%. Réduire le prix."
                else:
                    recommendation = "✅ Prix actuel optimal."
            else:
                recommendation = f"💰 Prix suggéré: {predicted_price:.2f}€"
            
            return {
                "success": True,
                "predictedPrice": round(predicted_price, 2),
                "predicted_price": round(predicted_price, 2),
                "confidence": round(confidence, 2),
                "confidenceInterval": {"low": round(price_min, 2), "high": round(price_max, 2)},
                "priceRange": {"min": round(price_min, 2), "max": round(price_max, 2)},
                "recommendation": recommendation,
                "modelUsed": "RandomForest",
                "model_used": "RandomForest"
            }
            
        except Exception as e:
            logger.error(f"❌ Erreur prédiction prix: {e}")
            return self._fallback_price_prediction(product_data)
    
    def _fallback_price_prediction(self, product_data: Dict) -> Dict:
        """Prédiction de prix par heuristiques si modèle indisponible"""
        rating = float(product_data.get('rating', 4.0) or 4.0)
        reviews = int(product_data.get('reviews', product_data.get('review_count', product_data.get('reviewCount', 100))) or 100)
        rank = int(product_data.get('rank', 5000) or 5000)
        
        base_price = 50
        rating_factor = rating / 5.0
        popularity_factor = min(1.5, 1 + np.log10(reviews + 1) / 5)
        rank_factor = max(0.5, 1 - np.log10(rank + 1) / 10)
        
        predicted_price = base_price * rating_factor * popularity_factor * rank_factor
        
        return {
            "success": True,
            "predictedPrice": round(predicted_price, 2),
            "predicted_price": round(predicted_price, 2),
            "confidence": 0.6,
            "confidenceInterval": {"low": round(predicted_price * 0.8, 2), "high": round(predicted_price * 1.2, 2)},
            "priceRange": {"min": round(predicted_price * 0.8, 2), "max": round(predicted_price * 1.2, 2)},
            "recommendation": "⚠️ Estimation basée sur heuristiques (modèle non chargé)",
            "modelUsed": "heuristic_fallback",
            "model_used": "heuristic_fallback"
        }
    
    # ========== PRÉDICTION DE DEMANDE ==========
    
    def predict_demand(self, product_data: Dict[str, Any], days: int = 30) -> Dict[str, Any]:
        """Prédit la demande future pour un produit"""
        try:
            model = self.model_manager.demand_model
            
            if model is None:
                return self._fallback_demand_prediction(product_data, days)
            
            features = self._prepare_features(product_data)
            if features is None:
                return self._fallback_demand_prediction(product_data, days)
            
            # Prédiction de base
            base_demand = float(model.predict([features])[0])
            
            # Génération des prévisions journalières
            daily_forecast = []
            cumulative_demand = 0
            
            for day in range(min(days, 7)):
                date = datetime.now() + timedelta(days=day)
                weekday = date.weekday()
                weekday_factor = 0.8 if weekday >= 5 else 1.0
                trend_factor = 1 + (day * 0.001)
                noise = np.random.normal(1, 0.05)
                
                daily_demand = max(0, base_demand * weekday_factor * trend_factor * noise)
                cumulative_demand += daily_demand
                
                daily_forecast.append({
                    "date": date.strftime("%Y-%m-%d"),
                    "predictedDemand": round(daily_demand, 1),
                    "cumulative": round(cumulative_demand, 1)
                })
            
            total_demand = base_demand * days
            
            # Stock et recommandation
            current_stock = int(product_data.get('stock', 0) or 0)
            days_of_stock = current_stock / base_demand if base_demand > 0 else 999
            
            if days_of_stock < 7:
                recommendation = f"🚨 Stock critique! Réapprovisionner {int(total_demand - current_stock)} unités"
                urgency = "HIGH"
            elif days_of_stock < 14:
                recommendation = f"📦 Réapprovisionner bientôt. Stock pour {int(days_of_stock)} jours"
                urgency = "MEDIUM"
            else:
                recommendation = f"✅ Stock suffisant pour {int(days_of_stock)} jours"
                urgency = "LOW"
            
            return {
                "success": True,
                "predictedDemand": round(total_demand, 1),
                "predicted_demand": round(total_demand, 1),
                "predictedDemandDailyAvg": round(base_demand, 2),
                "dailyForecast": daily_forecast,
                "trend": "up" if base_demand > 1 else "stable",
                "confidence": 0.82,
                "currentStock": current_stock,
                "daysOfStock": round(days_of_stock, 1),
                "recommendation": recommendation,
                "urgency": urgency,
                "modelUsed": "GradientBoosting"
            }
            
        except Exception as e:
            logger.error(f"❌ Erreur prédiction demande: {e}")
            return self._fallback_demand_prediction(product_data, days)
    
    def _fallback_demand_prediction(self, product_data: Dict, days: int) -> Dict:
        """Prédiction de demande par heuristiques"""
        rating = float(product_data.get('rating', 4.0) or 4.0)
        reviews = int(product_data.get('reviews', product_data.get('review_count', 100)) or 100)
        rank = int(product_data.get('rank', 5000) or 5000)
        
        base_demand = max(0.1, 10 * (rating / 5) * np.log10(reviews + 1) / np.log10(rank + 1))
        total_demand = base_demand * days
        
        return {
            "success": True,
            "predictedDemand": round(total_demand, 1),
            "predicted_demand": round(total_demand, 1),
            "predictedDemandDailyAvg": round(base_demand, 2),
            "dailyForecast": [],
            "trend": "stable",
            "confidence": 0.5,
            "recommendation": "⚠️ Estimation basée sur heuristiques",
            "urgency": "UNKNOWN",
            "modelUsed": "heuristic_fallback"
        }
    
    # ========== PRÉDICTION BESTSELLER ==========
    
    def predict_bestseller(self, product_data: Dict[str, Any]) -> Dict[str, Any]:
        """Prédit si un produit sera un bestseller"""
        try:
            model = self.model_manager.bestseller_model
            
            if model is None:
                return self._fallback_bestseller_prediction(product_data)
            
            features = self._prepare_features(product_data)
            if features is None:
                return self._fallback_bestseller_prediction(product_data)
            
            prediction = model.predict([features])[0]
            
            if hasattr(model, 'predict_proba'):
                probabilities = model.predict_proba([features])[0]
                probability = float(probabilities[1]) if len(probabilities) > 1 else float(probabilities[0])
            else:
                probability = 1.0 if prediction == 1 else 0.0
            
            factors = self._analyze_bestseller_factors(product_data)
            
            if probability >= 0.7:
                recommendation = "🌟 Fort potentiel bestseller! Augmenter le stock et la visibilité"
                confidence = "high"
            elif probability >= 0.4:
                recommendation = "📊 Potentiel modéré. Optimiser le prix et les avis"
                confidence = "medium"
            else:
                recommendation = "📉 Faible potentiel. Revoir la stratégie produit"
                confidence = "low"
            
            return {
                "success": True,
                "isBestseller": bool(prediction),
                "is_bestseller": bool(prediction),
                "probability": round(probability, 2),
                "bestsellerProbability": round(probability, 2),
                "confidence": confidence,
                "factors": factors,
                "recommendation": recommendation,
                "modelUsed": "RandomForestClassifier"
            }
            
        except Exception as e:
            logger.error(f"❌ Erreur prédiction bestseller: {e}")
            return self._fallback_bestseller_prediction(product_data)
    
    def _fallback_bestseller_prediction(self, product_data: Dict) -> Dict:
        """Prédiction bestseller par heuristiques"""
        rating = float(product_data.get('rating', 4.0) or 4.0)
        reviews = int(product_data.get('reviews', product_data.get('review_count', 100)) or 100)
        rank = int(product_data.get('rank', 5000) or 5000)
        
        score = (rating / 5) * 0.3 + min(1, reviews / 1000) * 0.4 + max(0, 1 - rank / 10000) * 0.3
        
        return {
            "success": True,
            "isBestseller": score >= 0.6,
            "is_bestseller": score >= 0.6,
            "probability": round(score, 2),
            "bestsellerProbability": round(score, 2),
            "confidence": "medium" if 0.4 <= score < 0.7 else ("high" if score >= 0.7 else "low"),
            "factors": self._analyze_bestseller_factors(product_data),
            "recommendation": "⚠️ Estimation basée sur heuristiques",
            "modelUsed": "heuristic_fallback"
        }
    
    def _analyze_bestseller_factors(self, product_data: Dict) -> List[str]:
        """Analyse les facteurs qui influencent le statut bestseller"""
        factors = []
        
        rating = float(product_data.get('rating', 0) or 0)
        if rating >= 4.7:
            factors.append(f"⭐ Excellent rating ({rating}/5)")
        elif rating >= 4.5:
            factors.append(f"⭐ Très bon rating ({rating}/5)")
        
        reviews = int(product_data.get('reviews', product_data.get('review_count', 0)) or 0)
        if reviews >= 500:
            factors.append(f"💬 Très populaire ({reviews} avis)")
        elif reviews >= 100:
            factors.append(f"💬 Populaire ({reviews} avis)")
        
        rank = int(product_data.get('rank', 99999) or 99999)
        if rank <= 100:
            factors.append("🏆 Excellent classement")
        elif 100 < rank <= 500:
            factors.append("📈 Position prometteuse")
        
        return factors
    
    # ========== PRÉDICTION DE RANG ==========
    
    def predict_rank(self, product_data: Dict[str, Any]) -> Dict[str, Any]:
        """Prédit l'évolution du rang d'un produit"""
        try:
            model = self.model_manager.rank_model
            current_rank = int(product_data.get('current_rank', product_data.get('rank', 5000)) or 5000)
            
            if model is None:
                predicted_rank, confidence = self._heuristic_rank_predict(product_data)
            else:
                features = self._prepare_features(product_data)
                if features is None:
                    predicted_rank, confidence = self._heuristic_rank_predict(product_data)
                else:
                    predicted_rank = int(max(1, model.predict([features])[0]))
                    confidence = 0.75
            
            # Déterminer la tendance
            if predicted_rank < current_rank * 0.8:
                trend = "UP"
                recommendation = "📈 Fort potentiel d'amélioration du classement"
            elif predicted_rank > current_rank * 1.2:
                trend = "DOWN"
                recommendation = "⚠️ Risque de baisse, optimisez prix et visibilité"
            else:
                trend = "STABLE"
                recommendation = "✅ Position stable attendue"
            
            return {
                "success": True,
                "productId": product_data.get('product_id', product_data.get('id')),
                "currentRank": current_rank,
                "predictedRank": predicted_rank,
                "confidence": confidence,
                "trend": trend,
                "factors": {},
                "recommendation": recommendation
            }
            
        except Exception as e:
            logger.error(f"❌ Erreur prédiction rang: {e}")
            return {
                "success": False,
                "error": str(e),
                "currentRank": product_data.get('current_rank', 5000),
                "predictedRank": product_data.get('current_rank', 5000),
                "confidence": 0,
                "trend": "UNKNOWN"
            }
    
    def _heuristic_rank_predict(self, product_data: Dict) -> Tuple[int, float]:
        """Fallback heuristique pour prédiction de rang"""
        current_rank = int(product_data.get('current_rank', product_data.get('rank', 5000)) or 5000)
        rating = float(product_data.get('rating', 0) or 0)
        reviews = int(product_data.get('review_count', product_data.get('reviews', 0)) or 0)
        
        score = (rating * np.log1p(reviews)) / np.log1p(current_rank)
        
        if score > 10:
            predicted = int(current_rank * 0.5)
        elif score > 5:
            predicted = int(current_rank * 0.7)
        else:
            predicted = current_rank
        
        return max(1, predicted), 0.5
    
    # ========== RECHERCHE SÉMANTIQUE ==========
    
    def semantic_search(self, query: str, top_k: int = 10) -> Dict[str, Any]:
        """Recherche sémantique de produits"""
        try:
            df = self.model_manager.products_df
            
            if df is None:
                return {"success": False, "error": "Données non chargées", "results": []}
            
            query_lower = query.lower()
            
            if 'title' in df.columns:
                mask = df['title'].fillna('').str.lower().str.contains(query_lower, regex=False)
                results_df = df[mask].head(top_k)
            else:
                results_df = df.head(top_k)
            
            results = []
            for i, (_, row) in enumerate(results_df.iterrows()):
                product = row.to_dict()
                product['similarity_score'] = round(1 - (i * 0.1), 2)
                product['rank_position'] = i + 1
                results.append(product)
            
            return {
                "success": True,
                "query": query,
                "results": results,
                "totalFound": len(results),
                "searchType": "keyword_search"
            }
            
        except Exception as e:
            logger.error(f"❌ Erreur recherche: {e}")
            return {"success": False, "error": str(e), "results": []}
    
    # ========== PRODUITS SIMILAIRES ==========
    
    def find_similar_products(self, product_id: str, top_k: int = 5) -> Dict[str, Any]:
        """Trouve des produits similaires"""
        try:
            df = self.model_manager.products_df
            
            if df is None:
                return {"success": False, "error": "Données non chargées"}
            
            # Trouver le produit source
            if 'asin' in df.columns:
                source = df[df['asin'] == product_id]
            else:
                try:
                    source = df.iloc[[int(product_id)]]
                except:
                    source = pd.DataFrame()
            
            if source.empty:
                return {"success": False, "error": "Produit non trouvé"}
            
            source_product = source.iloc[0].to_dict()
            return self._find_similar_by_features(source_product, product_id, df, top_k)
            
        except Exception as e:
            logger.error(f"❌ Erreur produits similaires: {e}")
            return {"success": False, "error": str(e)}
    
    def _find_similar_by_features(self, source_product: Dict, source_id: str, df: pd.DataFrame, top_k: int) -> Dict:
        """Trouve des produits similaires par features"""
        source_price = float(source_product.get('price', 0) or 0)
        source_rating = float(source_product.get('rating', 0) or 0)
        source_category = source_product.get('category', '')
        
        df = df.copy()
        
        if 'asin' in df.columns:
            df = df[df['asin'] != source_id]
        
        # Scores
        if 'price' in df.columns and source_price > 0:
            df['price_score'] = 1 - np.abs(df['price'].fillna(0) - source_price) / (source_price + 1)
        else:
            df['price_score'] = 0.5
        
        if 'rating' in df.columns:
            df['rating_score'] = 1 - np.abs(df['rating'].fillna(0) - source_rating) / 5
        else:
            df['rating_score'] = 0.5
        
        if 'category' in df.columns:
            df['category_score'] = (df['category'] == source_category).astype(float)
        else:
            df['category_score'] = 0.5
        
        df['similarity_score'] = (
            df['price_score'] * 0.3 + 
            df['rating_score'] * 0.3 + 
            df['category_score'] * 0.4
        )
        
        similar = df.nlargest(top_k, 'similarity_score')
        
        return {
            "success": True,
            "sourceProduct": source_product,
            "similarProducts": similar.to_dict('records'),
            "similarityMethod": "feature_based"
        }
    
    # ========== ANALYSE COMPLÈTE ==========
    
    def analyze_product(self, product_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyse complète d'un produit avec tous les modèles"""
        results = {
            "success": True,
            "product": product_data,
            "analysisTimestamp": datetime.now().isoformat()
        }
        
        results["priceAnalysis"] = self.predict_price(product_data)
        results["demandForecast"] = self.predict_demand(product_data)
        results["bestsellerPrediction"] = self.predict_bestseller(product_data)
        results["rankPrediction"] = self.predict_rank(product_data)
        
        if 'asin' in product_data or 'id' in product_data:
            product_id = product_data.get('asin', product_data.get('id'))
            results["similarProducts"] = self.find_similar_products(str(product_id))
        
        # Recommandations consolidées
        recommendations = []
        for key in ['priceAnalysis', 'demandForecast', 'bestsellerPrediction', 'rankPrediction']:
            if key in results and results[key].get('recommendation'):
                recommendations.append(results[key]['recommendation'])
        results["recommendations"] = recommendations
        
        return results
    
    # ========== ENTRAÎNEMENT ==========
    
    def train_all(self, products: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Entraîne tous les modèles sur les données fournies"""
        if not SKLEARN_AVAILABLE:
            return {"error": "Scikit-learn non disponible"}
        
        if len(products) < 50:
            return {"error": f"Minimum 50 produits requis ({len(products)} fournis)"}
        
        logger.info(f"🎯 Entraînement sur {len(products)} produits...")
        
        results = {}
        
        # Entraînement modèle de prix
        try:
            results['price'] = self._train_price_model(products)
        except Exception as e:
            results['price'] = {"error": str(e)}
        
        # Entraînement modèle de rang
        try:
            results['rank'] = self._train_rank_model(products)
        except Exception as e:
            results['rank'] = {"error": str(e)}
        
        # Entraînement modèle bestseller
        try:
            results['bestseller'] = self._train_bestseller_model(products)
        except Exception as e:
            results['bestseller'] = {"error": str(e)}
        
        # Recharger les modèles
        self.model_manager.reload_models()
        
        logger.info("✅ Entraînement terminé")
        return results
    
    def _train_price_model(self, products: List[Dict]) -> Dict:
        """Entraîne le modèle de prix"""
        X, y = [], []
        for p in products:
            price = p.get('price', 0)
            if price and price > 0:
                X.append([
                    p.get('rating', 0) or 0,
                    np.log1p(p.get('review_count', p.get('reviews', 0)) or 0),
                    np.log1p(p.get('rank', 5000) or 5000)
                ])
                y.append(price)
        
        if len(X) < 20:
            return {"error": "Pas assez de données avec prix valide"}
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        model = GradientBoostingRegressor(n_estimators=100, max_depth=5, random_state=42)
        model.fit(X_train, y_train)
        
        y_pred = model.predict(X_test)
        metrics = {
            "rmse": float(np.sqrt(mean_squared_error(y_test, y_pred))),
            "mae": float(mean_absolute_error(y_test, y_pred)),
            "r2": float(r2_score(y_test, y_pred)),
            "samples": len(X)
        }
        
        self.model_manager.save_model("price_predictor", model, metrics)
        
        return {"success": True, "metrics": metrics}
    
    def _train_rank_model(self, products: List[Dict]) -> Dict:
        """Entraîne le modèle de rang"""
        X, y = [], []
        for p in products:
            rank = p.get('rank')
            if rank and 0 < rank < 100000:
                X.append([
                    p.get('price', 0) or 0,
                    p.get('rating', 0) or 0,
                    np.log1p(p.get('review_count', p.get('reviews', 0)) or 0),
                    p.get('stock', 0) or 0
                ])
                y.append(rank)
        
        if len(X) < 20:
            return {"error": "Pas assez de données avec rang valide"}
        
        scaler = StandardScaler()
        X = scaler.fit_transform(X)
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        model = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42, n_jobs=-1)
        model.fit(X_train, y_train)
        
        y_pred = model.predict(X_test)
        metrics = {
            "rmse": float(np.sqrt(mean_squared_error(y_test, y_pred))),
            "r2": float(r2_score(y_test, y_pred)),
            "samples": len(X)
        }
        
        self.model_manager.save_model("rank_model", {"model": model, "scaler": scaler, "metrics": metrics})
        
        return {"success": True, "metrics": metrics}
    
    def _train_bestseller_model(self, products: List[Dict], threshold: int = 100) -> Dict:
        """Entraîne le modèle de détection bestseller"""
        X, y = [], []
        for p in products:
            rank = p.get('rank', 9999) or 9999
            if rank > 0:
                X.append([
                    p.get('rating', 0) or 0,
                    np.log1p(p.get('review_count', p.get('reviews', 0)) or 0),
                    p.get('price', 0) or 0
                ])
                y.append(1 if rank <= threshold else 0)
        
        if len(X) < 30 or sum(y) < 5:
            return {"error": "Pas assez de bestsellers dans les données"}
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
        
        model = RandomForestClassifier(n_estimators=100, max_depth=8, class_weight='balanced', random_state=42)
        model.fit(X_train, y_train)
        
        accuracy = model.score(X_test, y_test)
        
        self.model_manager.save_model("bestseller_classifier", model)
        
        return {"success": True, "accuracy": float(accuracy), "bestsellers_count": sum(y)}
    
    # ========== HELPERS ==========
    
    def _prepare_features(self, product_data: Dict) -> Optional[np.ndarray]:
        """Prépare les features pour la prédiction"""
        try:
            feature_columns = self.model_manager.feature_columns
            label_encoders = self.model_manager.label_encoders
            scaler = self.model_manager.scaler
            
            if feature_columns:
                features = []
                for col in feature_columns:
                    if col == 'rating':
                        features.append(float(product_data.get('rating', 4.0) or 4.0))
                    elif col in ['reviews', 'review_count', 'reviewCount']:
                        features.append(int(product_data.get('reviews', product_data.get('review_count', product_data.get('reviewCount', 100))) or 100))
                    elif col == 'category_encoded':
                        category = product_data.get('category', 'Unknown')
                        if label_encoders and 'category' in label_encoders:
                            try:
                                cat_encoded = label_encoders['category'].transform([str(category)])[0]
                            except ValueError:
                                cat_encoded = 0
                        else:
                            cat_encoded = 0
                        features.append(cat_encoded)
                    elif col == 'rank':
                        features.append(int(product_data.get('rank', 5000) or 5000))
                    elif col == 'price':
                        features.append(float(product_data.get('price', 100) or 100))
                    else:
                        features.append(0)
            else:
                features = [
                    float(product_data.get('rating', 4.0) or 4.0),
                    int(product_data.get('reviews', product_data.get('review_count', 100)) or 100),
                    0
                ]
            
            features = np.array(features)
            
            if scaler is not None:
                features = scaler.transform(features.reshape(1, -1)).flatten()
            
            return features
            
        except Exception as e:
            logger.warning(f"Erreur préparation features: {e}")
            return None


# Instance singleton
ml_service = MLService()
