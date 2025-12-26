import logging
from typing import Dict, Any, List

from app.models.schemas import (
    PredictRankRequest, PredictRankResponse,
    RecommendPriceRequest, RecommendPriceResponse,
    PotentialBestSeller, FindBestSellersResponse,
    TrendDirection
)
from app.utils.helpers import calculate_percent_change, calculate_confidence

logger = logging.getLogger(__name__)


class PredictorService:
    """Service de prédictions ML (approche heuristique pour MVP)"""
    
    def __init__(self):
        self.predictions_cache = {}
    
    def predict_rank(self, request: PredictRankRequest) -> PredictRankResponse:
        """
        Prédit le rank futur d un produit
        
        Algorithme heuristique basé sur:
        - Score popularité: (rating × review_count) / rank
        - Si score élevé → rank va améliorer
        - Si score faible → rank va décliner
        """
        logger.info(f"🔮 Prédiction rank pour produit {request.product_id}")
        
        # Calcul score popularité
        if request.current_rank == 0:
            request.current_rank = 9999
        
        popularity_score = (request.rating * request.review_count) / request.current_rank
        
        # Facteurs additionnels
        price_factor = 1.0
        if request.price < 50:
            price_factor = 1.2  # Prix bas = boost
        elif request.price > 200:
            price_factor = 0.8  # Prix élevé = pénalité
        
        rating_factor = request.rating / 5.0  # Normalise sur 1
        
        # Score composite
        composite_score = popularity_score * price_factor * rating_factor
        
        # Prédiction basée sur score
        if composite_score > 50:
            # Forte amélioration attendue
            predicted_rank = max(1, int(request.current_rank * 0.4))
            trend = TrendDirection.UP
            confidence = 0.85
            recommendation = "Excellent potentiel ! Produit très populaire."
        
        elif composite_score > 20:
            # Amélioration modérée
            predicted_rank = max(1, int(request.current_rank * 0.7))
            trend = TrendDirection.UP
            confidence = 0.70
            recommendation = "Bon potentiel d amélioration du classement."
        
        elif composite_score > 5:
            # Stabilité
            predicted_rank = request.current_rank
            trend = TrendDirection.STABLE
            confidence = 0.60
            recommendation = "Classement devrait rester stable."
        
        else:
            # Déclin attendu
            predicted_rank = min(9999, int(request.current_rank * 1.3))
            trend = TrendDirection.DOWN
            confidence = 0.65
            recommendation = "Attention: risque de baisse du classement."
        
        # Ajuste confiance selon données
        factors = {
            "review_count": request.review_count,
            "rating": request.rating,
            "rank": request.current_rank
        }
        confidence = calculate_confidence(factors)
        
        return PredictRankResponse(
            product_id=request.product_id,
            current_rank=request.current_rank,
            predicted_rank=predicted_rank,
            confidence=confidence,
            trend=trend,
            factors={
                "popularity_score": round(popularity_score, 2),
                "composite_score": round(composite_score, 2),
                "price_factor": price_factor,
                "rating_factor": round(rating_factor, 2)
            },
            recommendation=recommendation
        )
    
    def recommend_price(self, request: RecommendPriceRequest) -> RecommendPriceResponse:
        """
        Recommande un prix optimal pour un produit
        
        Stratégie:
        - Si rank élevé (mauvais) → baisser prix
        - Si rating élevé → peut maintenir prix
        - Compare avec moyenne catégorie (simulée)
        """
        logger.info(f"💰 Recommandation prix pour produit {request.product_id}")
        
        # Simule prix moyen concurrent
        competitor_avg = request.current_price * 0.95
        
        # Analyse situation
        if request.rank > 1000:
            # Mauvais rank: recommande baisse
            recommended = request.current_price * 0.85
            reasoning = "Rank élevé détecté. Baisse de prix recommandée pour améliorer compétitivité."
            expected_increase = 20.0
        
        elif request.rank > 100:
            # Rank moyen: optimisation
            if request.current_price > competitor_avg:
                recommended = competitor_avg * 0.98
                reasoning = "Prix actuel supérieur à la moyenne. Baisse légère recommandée."
                expected_increase = 10.0
            else:
                recommended = request.current_price
                reasoning = "Prix déjà compétitif. Maintenir prix actuel."
                expected_increase = 0.0
        
        else:
            # Bon rank: peut maintenir ou augmenter
            if request.rating >= 4.5:
                recommended = request.current_price * 1.05
                reasoning = "Excellent rating. Possibilité d augmenter prix légèrement."
                expected_increase = -5.0
            else:
                recommended = request.current_price
                reasoning = "Bon classement. Maintenir prix actuel."
                expected_increase = 0.0
        
        # Arrondit
        recommended = round(recommended, 2)
        price_change = calculate_percent_change(request.current_price, recommended)
        
        return RecommendPriceResponse(
            product_id=request.product_id,
            current_price=request.current_price,
            recommended_price=recommended,
            price_change_percent=round(price_change, 1),
            expected_sales_increase=expected_increase,
            reasoning=reasoning,
            competitor_avg_price=round(competitor_avg, 2)
        )
    
    def find_potential_bestsellers(
        self,
        products_data: List[Dict[str, Any]],
        top_n: int = 20
    ) -> FindBestSellersResponse:
        """
        Identifie produits avec potentiel best-seller
        
        Critères:
        - Rating >= 4.5
        - Review count >= 100
        - Rank actuel > 50 (pas déjà best-seller)
        - Score potentiel élevé
        """
        logger.info(f"🌟 Recherche best-sellers potentiels dans {len(products_data)} produits")
        
        candidates = []
        
        for product in products_data:
            # Filtres de base
            rating = product.get("rating", 0)
            review_count = product.get("review_count", 0)
            rank = product.get("rank", 9999)
            price = product.get("price", 0)
            
            if rating < 4.5:
                continue
            if review_count < 100:
                continue
            if rank <= 50:
                continue
            if price == 0:
                continue
            
            # Calcul score potentiel: (rating × reviews) / (rank × prix)
            potential_score = (rating * review_count) / (rank * price)
            
            # Raisons
            reasons = []
            if rating >= 4.8:
                reasons.append(f"Excellent rating ({rating}/5)")
            if review_count >= 500:
                reasons.append(f"Très populaire ({review_count} avis)")
            if 100 < rank < 500:
                reasons.append("Position intermédiaire avec potentiel")
            if price < 100:
                reasons.append("Prix attractif")
            
            candidates.append(PotentialBestSeller(
                product_id=product.get("id"),
                title=product.get("title", "Unknown"),
                current_rank=rank,
                rating=rating,
                review_count=review_count,
                price=price,
                potential_score=round(potential_score, 4),
                reasons=reasons
            ))
        
        # Trie par score décroissant
        candidates.sort(key=lambda x: x.potential_score, reverse=True)
        
        # Prend top N
        top_candidates = candidates[:top_n]
        
        logger.info(f"✨ {len(top_candidates)} best-sellers potentiels identifiés")
        
        return FindBestSellersResponse(
            count=len(top_candidates),
            products=top_candidates,
            criteria={
                "min_rating": 4.5,
                "min_reviews": 100,
                "min_rank": 50,
                "total_analyzed": len(products_data),
                "total_candidates": len(candidates)
            }
        )
