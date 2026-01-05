"""
ML Service V2 - Service de Machine Learning avec modÃ¨les entraÃ®nÃ©s
Utilise les modÃ¨les RandomForest, GradientBoosting, et FAISS pour les prÃ©dictions
"""

import os
import pickle
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
import logging
from pathlib import Path

from app.config import settings

logger = logging.getLogger(__name__)


class MLServiceV2:
    """Service ML utilisant de vrais modÃ¨les entraÃ®nÃ©s"""
    
    def __init__(self):
        self.models_dir = Path(settings.models_dir)
        self.embeddings_dir = Path("data/embeddings")
        
        # ModÃ¨les charge©s
        self.price_model = None
        self.demand_model = None
        self.bestseller_model = None
        self.scaler = None
        self.label_encoders = {}
        self.feature_columns = []
        
        # FAISS pour la recherche sÃ©mantique
        self.faiss_index = None
        self.product_ids = []
        self.product_embeddings = None
        
        # DonnÃ©es produits pour les recommandations
        self.products_df = None
        
        # Charger les modÃ¨les au dÃ©marrage
        self._load_models()
        self._load_faiss_index()
        self._load_products_data()
    
    def _load_models(self):
        """Charge tous les modÃ¨les ML entraÃ®nÃ©s"""
        try:
            # ModÃ¨le de prÃ©diction de prix
            price_model_path = self.models_dir / 'price_predictor.pkl'
            if price_model_path.exists():
                with open(price_model_path, 'rb') as f:
                    self.price_model = pickle.load(f)
                logger.info("œ… ModÃ¨le de prix charge©")
            
            # ModÃ¨le de prÃ©diction de demande
            demand_model_path = self.models_dir / 'demand_predictor.pkl'
            if demand_model_path.exists():
                with open(demand_model_path, 'rb') as f:
                    self.demand_model = pickle.load(f)
                logger.info("œ… ModÃ¨le de demande charge©")
            
            # ModÃ¨le de bestseller
            bestseller_model_path = self.models_dir / 'bestseller_classifier.pkl'
            if bestseller_model_path.exists():
                with open(bestseller_model_path, 'rb') as f:
                    self.bestseller_model = pickle.load(f)
                logger.info("œ… ModÃ¨le bestseller charge©")
            
            # Aussi charger les anciens modÃ¨les si les nouveaux n'existent pas
            if self.price_model is None:
                rank_model_path = self.models_dir / 'rank_model.pkl'
                if rank_model_path.exists():
                    with open(rank_model_path, 'rb') as f:
                        data = pickle.load(f)
                        if isinstance(data, dict):
                            self.price_model = data.get('model')
                            self.scaler = data.get('scaler')
                        else:
                            self.price_model = data
                    logger.info("œ… ModÃ¨le rank (fallback) charge©")
            
            # Scaler pour normalisation
            scaler_path = self.models_dir / 'scaler.pkl'
            if scaler_path.exists():
                with open(scaler_path, 'rb') as f:
                    self.scaler = pickle.load(f)
                logger.info("œ… Scaler charge©")
            
            # Label encoders
            encoders_path = self.models_dir / 'label_encoders.pkl'
            if encoders_path.exists():
                with open(encoders_path, 'rb') as f:
                    self.label_encoders = pickle.load(f)
                logger.info("œ… Label encoders charge©s")
            
            # Feature columns
            features_path = self.models_dir / 'feature_columns.pkl'
            if features_path.exists():
                with open(features_path, 'rb') as f:
                    self.feature_columns = pickle.load(f)
                logger.info("œ… Feature columns charge©es")
            
            logger.info(f"ðŸ“Š ModÃ¨les ML charge©s depuis {self.models_dir}")
            
        except Exception as e:
            logger.error(f"Œ Erreur chargement modÃ¨les: {e}")
    
    def _load_faiss_index(self):
        """Charge l'index FAISS pour la recherche sÃ©mantique"""
        try:
            import faiss
            
            index_path = self.embeddings_dir / 'products.index'
            ids_path = self.embeddings_dir / 'product_ids.pkl'
            embeddings_path = self.embeddings_dir / 'product_embeddings.npy'
            
            if index_path.exists():
                self.faiss_index = faiss.read_index(str(index_path))
                logger.info("œ… Index FAISS charge©")
            
            if ids_path.exists():
                with open(ids_path, 'rb') as f:
                    self.product_ids = pickle.load(f)
                logger.info(f"œ… {len(self.product_ids)} product IDs charge©s")
            
            if embeddings_path.exists():
                self.product_embeddings = np.load(embeddings_path)
                logger.info(f"œ… Embeddings shape: {self.product_embeddings.shape}")
                
        except ImportError:
            logger.warning("š ï¸ FAISS non installÃ© - recherche sÃ©mantique dÃ©sactivÃ©e")
        except Exception as e:
            logger.warning(f"š ï¸ Erreur chargement FAISS: {e}")
    
    def _load_products_data(self):
        """Charge les donnÃ©es produits pour les recommandations"""
        try:
            csv_paths = [
                Path("data/uploads/amazon_dataset.csv"),
                Path("amazon_dataset.csv"),
                Path("data/processed/products.csv"),
            ]
            
            for csv_path in csv_paths:
                if csv_path.exists():
                    self.products_df = pd.read_csv(csv_path)
                    logger.info(f"œ… {len(self.products_df)} produits charge©s depuis {csv_path}")
                    break
                    
        except Exception as e:
            logger.warning(f"š ï¸ Erreur chargement CSV: {e}")
    
    def is_ready(self) -> bool:
        """VÃ©rifie si les modÃ¨les sont prets"""
        return self.price_model is not None or self.demand_model is not None or self.bestseller_model is not None
    
    def get_models_status(self) -> Dict[str, Any]:
        """Retourne le statut de tous les modÃ¨les"""
        return {
            "price_model": self.price_model is not None,
            "demand_model": self.demand_model is not None,
            "bestseller_model": self.bestseller_model is not None,
            "scaler": self.scaler is not None,
            "faiss_index": self.faiss_index is not None,
            "products_loaded": self.products_df is not None,
            "num_products": len(self.products_df) if self.products_df is not None else 0,
            "feature_columns": len(self.feature_columns)
        }
    
    # ============================================================
    # PRÃ‰DICTION DE PRIX
    # ============================================================
    
    def predict_price(self, product_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        PrÃ©dit le prix optimal pour un produit
        
        Args:
            product_data: {rating, reviews, category, rank, ...}
        
        Returns:
            {predicted_price, confidence, price_range, recommendation}
        """
        try:
            if self.price_model is None:
                return self._fallback_price_prediction(product_data)
            
            # PrÃ©parer les features
            features = self._prepare_features(product_data)
            
            if features is None:
                return self._fallback_price_prediction(product_data)
            
            # PrÃ©diction
            predicted_price = float(self.price_model.predict([features])[0])
            
            # Intervalle de confiance
            confidence = 0.85
            price_std = 0
            
            if hasattr(self.price_model, 'estimators_'):
                predictions = [tree.predict([features])[0] for tree in self.price_model.estimators_]
                price_std = float(np.std(predictions))
                confidence = max(0.5, 1 - (price_std / max(predicted_price, 1)))
            
            # Plage de prix
            price_min = max(0, predicted_price - 2 * price_std) if price_std > 0 else predicted_price * 0.9
            price_max = predicted_price + 2 * price_std if price_std > 0 else predicted_price * 1.1
            
            # Recommandation
            current_price = product_data.get('price', predicted_price)
            if current_price and current_price > 0:
                diff_pct = ((predicted_price - current_price) / current_price) * 100
                if diff_pct > 10:
                    recommendation = f"[UP] Prix actuel sous-evalue de {diff_pct:.1f}%. Augmenter le prix."
                elif diff_pct < -10:
                    recommendation = f"[DOWN] Prix actuel surevalue de {abs(diff_pct):.1f}%. Reduire le prix."
                else:
                    recommendation = "[OK] Prix actuel optimal."
            else:
                recommendation = f"[PRICE] Prix suggere: {predicted_price:.2f}"
            
            return {
                "success": True,
                "predicted_price": round(predicted_price, 2),
                "confidence": round(confidence, 2),
                "price_range": {
                    "min": round(price_min, 2),
                    "max": round(price_max, 2)
                },
                "recommendation": recommendation,
                "model_used": "RandomForestRegressor"
            }
            
        except Exception as e:
            logger.error(f"Erreur prÃ©diction prix: {e}")
            return self._fallback_price_prediction(product_data)
    
    def _fallback_price_prediction(self, product_data: Dict) -> Dict:
        """PrÃ©diction de prix par heuristiques si modÃ¨le indisponible"""
        rating = float(product_data.get('rating', 4.0) or 4.0)
        reviews = int(product_data.get('reviews', product_data.get('review_count', 100)) or 100)
        rank = int(product_data.get('rank', 5000) or 5000)
        
        # Heuristique simple
        base_price = 100
        rating_factor = rating / 5.0
        popularity_factor = min(1.5, 1 + np.log10(reviews + 1) / 5)
        rank_factor = max(0.5, 1 - np.log10(rank + 1) / 10)
        
        predicted_price = base_price * rating_factor * popularity_factor * rank_factor
        
        return {
            "success": True,
            "predicted_price": round(predicted_price, 2),
            "confidence": 0.6,
            "price_range": {
                "min": round(predicted_price * 0.8, 2),
                "max": round(predicted_price * 1.2, 2)
            },
            "recommendation": "š ï¸ Estimation basÃ©e sur heuristiques (modÃ¨le non charge©)",
            "model_used": "heuristic_fallback"
        }
    
    # ============================================================
    # PRÃ‰DICTION DE DEMANDE
    # ============================================================
    
    def predict_demand(self, product_data: Dict[str, Any], days: int = 30) -> Dict[str, Any]:
        """
        PrÃ©dit la demande future pour un produit
        """
        try:
            if self.demand_model is None:
                return self._fallback_demand_prediction(product_data, days)
            
            features = self._prepare_features(product_data)
            
            if features is None:
                return self._fallback_demand_prediction(product_data, days)
            
            # PrÃ©diction de base
            base_demand = float(self.demand_model.predict([features])[0])
            
            # GÃ©nÃ©rer les prÃ©visions journaliÃ¨res
            daily_forecast = []
            cumulative_demand = 0
            
            for day in range(min(days, 7)):  # Limiter Ã  7 jours dans la rÃ©ponse
                date = datetime.now() + timedelta(days=day)
                weekday = date.weekday()
                weekday_factor = 0.8 if weekday >= 5 else 1.0
                trend_factor = 1 + (day * 0.001)
                noise = np.random.normal(1, 0.1)
                
                daily_demand = max(0, base_demand * weekday_factor * trend_factor * noise)
                cumulative_demand += daily_demand
                
                daily_forecast.append({
                    "date": date.strftime("%Y-%m-%d"),
                    "predicted_demand": round(daily_demand, 1),
                    "cumulative": round(cumulative_demand, 1)
                })
            
            # Total sur la pÃ©riode complÃ¨te
            total_demand = base_demand * days
            
            # Stock et recommandation
            current_stock = int(product_data.get('stock', 0) or 0)
            days_of_stock = current_stock / base_demand if base_demand > 0 else 999
            
            if days_of_stock < 7:
                recommendation = f"[URGENT] Stock critique! Reapprovisionner {int(total_demand - current_stock)} unites"
                urgency = "HIGH"
            elif days_of_stock < 14:
                recommendation = f"[STOCK] Reapprovisionner bientot. Stock pour {int(days_of_stock)} jours"
                urgency = "MEDIUM"
            else:
                recommendation = f"[OK] Stock suffisant pour {int(days_of_stock)} jours"
                urgency = "LOW"
            
            return {
                "success": True,
                "predicted_demand": round(total_demand, 1),
                "predicted_demand_total": round(total_demand, 1),
                "predicted_demand_daily_avg": round(base_demand, 2),
                "daily_forecast": daily_forecast,
                "trend": "up" if base_demand > 1 else "stable",
                "confidence": 0.82,
                "current_stock": current_stock,
                "days_of_stock": round(days_of_stock, 1),
                "recommendation": recommendation,
                "urgency": urgency,
                "model_used": "GradientBoostingRegressor"
            }
            
        except Exception as e:
            logger.error(f"Erreur prÃ©diction demande: {e}")
            return self._fallback_demand_prediction(product_data, days)
    
    def _fallback_demand_prediction(self, product_data: Dict, days: int) -> Dict:
        """PrÃ©diction de demande par heuristiques"""
        rating = float(product_data.get('rating', 4.0) or 4.0)
        reviews = int(product_data.get('reviews', product_data.get('review_count', 100)) or 100)
        rank = int(product_data.get('rank', 5000) or 5000)
        
        base_demand = max(0.1, 10 * (rating / 5) * np.log10(reviews + 1) / np.log10(rank + 1))
        total_demand = base_demand * days
        
        return {
            "success": True,
            "predicted_demand": round(total_demand, 1),
            "predicted_demand_total": round(total_demand, 1),
            "predicted_demand_daily_avg": round(base_demand, 2),
            "daily_forecast": [],
            "trend": "stable",
            "confidence": 0.5,
            "recommendation": "[FALLBACK] Estimation basee sur heuristiques",
            "urgency": "UNKNOWN",
            "model_used": "heuristic_fallback"
        }
    
    # ============================================================
    # CLASSIFICATION BESTSELLER
    # ============================================================
    
    def predict_bestseller(self, product_data: Dict[str, Any]) -> Dict[str, Any]:
        """PrÃ©dit si un produit sera un bestseller"""
        try:
            if self.bestseller_model is None:
                return self._fallback_bestseller_prediction(product_data)
            
            features = self._prepare_features(product_data)
            
            if features is None:
                return self._fallback_bestseller_prediction(product_data)
            
            prediction = self.bestseller_model.predict([features])[0]
            
            if hasattr(self.bestseller_model, 'predict_proba'):
                probabilities = self.bestseller_model.predict_proba([features])[0]
                probability = float(probabilities[1]) if len(probabilities) > 1 else float(probabilities[0])
            else:
                probability = 1.0 if prediction == 1 else 0.0
            
            factors = self._analyze_bestseller_factors(product_data)
            
            if probability >= 0.7:
                recommendation = "[BESTSELLER] Fort potentiel bestseller! Augmenter le stock et la visibilite"
            elif probability >= 0.4:
                recommendation = "[MODERATE] Potentiel modere. Optimiser le prix et les avis"
            else:
                recommendation = "[LOW] Faible potentiel. Revoir la strategie produit"
            
            return {
                "success": True,
                "is_bestseller": bool(prediction),
                "probability": round(probability, 2),
                "factors": factors,
                "recommendation": recommendation,
                "model_used": "RandomForestClassifier"
            }
            
        except Exception as e:
            logger.error(f"Erreur prÃ©diction bestseller: {e}")
            return self._fallback_bestseller_prediction(product_data)
    
    def _fallback_bestseller_prediction(self, product_data: Dict) -> Dict:
        """PrÃ©diction bestseller par heuristiques"""
        rating = float(product_data.get('rating', 4.0) or 4.0)
        reviews = int(product_data.get('reviews', product_data.get('review_count', 100)) or 100)
        rank = int(product_data.get('rank', 5000) or 5000)
        
        score = (rating / 5) * 0.3 + min(1, reviews / 1000) * 0.4 + max(0, 1 - rank / 10000) * 0.3
        
        return {
            "success": True,
            "is_bestseller": score >= 0.6,
            "probability": round(score, 2),
            "factors": self._analyze_bestseller_factors(product_data),
            "recommendation": "š ï¸ Estimation basÃ©e sur heuristiques",
            "model_used": "heuristic_fallback"
        }
    
    def _analyze_bestseller_factors(self, product_data: Dict) -> List[Dict]:
        """Analyse les facteurs qui influencent le statut bestseller"""
        factors = []
        
        rating = float(product_data.get('rating', 0) or 0)
        if rating >= 4.5:
            factors.append({"factor": "rating", "impact": "positive", "value": rating, "message": "­ Excellente note"})
        elif rating < 3.5 and rating > 0:
            factors.append({"factor": "rating", "impact": "negative", "value": rating, "message": "š ï¸ Note Ã  amÃ©liorer"})
        
        reviews = int(product_data.get('reviews', product_data.get('review_count', 0)) or 0)
        if reviews >= 500:
            factors.append({"factor": "reviews", "impact": "positive", "value": reviews, "message": "ðŸ’¬ Beaucoup d'avis"})
        elif reviews < 50:
            factors.append({"factor": "reviews", "impact": "negative", "value": reviews, "message": "ðŸ“ Peu d'avis"})
        
        rank = int(product_data.get('rank', 99999) or 99999)
        if rank <= 100:
            factors.append({"factor": "rank", "impact": "positive", "value": rank, "message": "ðŸ† Excellent classement"})
        elif rank > 5000:
            factors.append({"factor": "rank", "impact": "negative", "value": rank, "message": "ðŸ“Š Classement Ã  amÃ©liorer"})
        
        return factors
    
    # ============================================================
    # RECHERCHE SÃ‰MANTIQUE
    # ============================================================
    
    def semantic_search(self, query: str, top_k: int = 10) -> Dict[str, Any]:
        """Recherche sÃ©mantique de produits similaires"""
        try:
            if self.products_df is None:
                return {"success": False, "error": "DonnÃ©es non charge©es", "results": []}
            
            # Recherche par mots-clÃ©s dans les titres
            query_lower = query.lower()
            
            if 'title' in self.products_df.columns:
                mask = self.products_df['title'].fillna('').str.lower().str.contains(query_lower, regex=False)
                results_df = self.products_df[mask].head(top_k)
            else:
                results_df = self.products_df.head(top_k)
            
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
                "total_found": len(results),
                "search_type": "keyword_search"
            }
            
        except Exception as e:
            logger.error(f"Erreur recherche: {e}")
            return {"success": False, "error": str(e), "results": []}
    
    # ============================================================
    # PRODUITS SIMILAIRES
    # ============================================================
    
    def find_similar_products(self, product_id: str, top_k: int = 5) -> Dict[str, Any]:
        """Trouve des produits similaires"""
        try:
            if self.products_df is None:
                return {"success": False, "error": "DonnÃ©es non charge©es"}
            
            # Trouver le produit source
            if 'asin' in self.products_df.columns:
                source = self.products_df[self.products_df['asin'] == product_id]
            else:
                try:
                    source = self.products_df.iloc[[int(product_id)]]
                except:
                    source = pd.DataFrame()
            
            if source.empty:
                return {"success": False, "error": "Produit non trouvÃ©"}
            
            source_product = source.iloc[0].to_dict()
            
            return self._find_similar_by_features(source_product, product_id, top_k)
            
        except Exception as e:
            logger.error(f"Erreur produits similaires: {e}")
            return {"success": False, "error": str(e)}
    
    def _find_similar_by_features(self, source_product: Dict, source_id: str, top_k: int) -> Dict:
        """Trouve des produits similaires par features"""
        if self.products_df is None:
            return {"success": False, "error": "DonnÃ©es non charge©es"}
        
        source_price = float(source_product.get('price', 0) or 0)
        source_rating = float(source_product.get('rating', 0) or 0)
        source_category = source_product.get('category', '')
        
        df = self.products_df.copy()
        
        # Exclure le produit source
        if 'asin' in df.columns:
            df = df[df['asin'] != source_id]
        
        # Score prix
        if 'price' in df.columns and source_price > 0:
            df['price_score'] = 1 - np.abs(df['price'].fillna(0) - source_price) / (source_price + 1)
        else:
            df['price_score'] = 0.5
        
        # Score rating
        if 'rating' in df.columns:
            df['rating_score'] = 1 - np.abs(df['rating'].fillna(0) - source_rating) / 5
        else:
            df['rating_score'] = 0.5
        
        # Score catÃ©gorie
        if 'category' in df.columns:
            df['category_score'] = (df['category'] == source_category).astype(float)
        else:
            df['category_score'] = 0.5
        
        # Score global
        df['similarity_score'] = (
            df['price_score'] * 0.3 + 
            df['rating_score'] * 0.3 + 
            df['category_score'] * 0.4
        )
        
        similar = df.nlargest(top_k, 'similarity_score')
        results = similar.to_dict('records')
        
        return {
            "success": True,
            "source_product": source_product,
            "similar_products": results,
            "similarity_method": "feature_based"
        }
    
    # ============================================================
    # HELPERS
    # ============================================================
    
    def _prepare_features(self, product_data: Dict) -> Optional[np.ndarray]:
        """Prepare les features pour la prediction"""
        try:
            # Utiliser les colonnes sauvegardees lors de l'entrainement
            # Par defaut: ['rating', 'reviews', 'category_encoded']
            if self.feature_columns:
                features = []
                for col in self.feature_columns:
                    if col == 'rating':
                        features.append(float(product_data.get('rating', 4.0) or 4.0))
                    elif col == 'reviews':
                        features.append(int(product_data.get('reviews', product_data.get('review_count', 100)) or 100))
                    elif col == 'category_encoded':
                        # Encoder la categorie si disponible
                        category = product_data.get('category', 'Unknown')
                        if self.label_encoders and 'category' in self.label_encoders:
                            try:
                                cat_encoded = self.label_encoders['category'].transform([str(category)])[0]
                            except ValueError:
                                cat_encoded = 0  # Categorie inconnue
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
                # Fallback: 3 features par defaut (rating, reviews, category_encoded=0)
                features = [
                    float(product_data.get('rating', 4.0) or 4.0),
                    int(product_data.get('reviews', product_data.get('review_count', 100)) or 100),
                    0  # category_encoded par defaut
                ]
            
            features = np.array(features)
            
            # Normaliser si scaler disponible
            if self.scaler is not None:
                features = self.scaler.transform(features.reshape(1, -1)).flatten()
            
            return features
            
        except Exception as e:
            logger.error(f"Erreur preparation features: {e}")
            return None
    
    # ============================================================
    # ANALYSE GLOBALE
    # ============================================================
    
    def analyze_product(self, product_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyse complÃ¨te d'un produit avec tous les modÃ¨les"""
        results = {
            "success": True,
            "product": product_data,
            "analysis_timestamp": datetime.now().isoformat()
        }
        
        results["price_analysis"] = self.predict_price(product_data)
        results["demand_forecast"] = self.predict_demand(product_data)
        results["bestseller_prediction"] = self.predict_bestseller(product_data)
        
        if 'asin' in product_data:
            results["similar_products"] = self.find_similar_products(product_data['asin'])
        
        results["recommendations"] = self._generate_recommendations(results)
        
        return results
    
    def _generate_recommendations(self, analysis: Dict) -> List[str]:
        """GÃ©nÃ¨re des recommandations basÃ©es sur l'analyse"""
        recommendations = []
        
        price_analysis = analysis.get("price_analysis", {})
        if price_analysis.get("success"):
            recommendations.append(price_analysis.get("recommendation", ""))
        
        demand = analysis.get("demand_forecast", {})
        if demand.get("success"):
            recommendations.append(demand.get("recommendation", ""))
        
        bestseller = analysis.get("bestseller_prediction", {})
        if bestseller.get("success"):
            recommendations.append(bestseller.get("recommendation", ""))
        
        return [r for r in recommendations if r]


# Instance globale
ml_service_v2 = MLServiceV2()

