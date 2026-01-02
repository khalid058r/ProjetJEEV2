"""
API Routes - Machine Learning
Prédictions et recommandations avec modèles entraînables
"""
from fastapi import APIRouter, HTTPException
from typing import List
import logging

from app.models.schemas import (
    PredictRankRequest, PredictRankResponse,
    RecommendPriceRequest, RecommendPriceResponse,
    FindBestSellersResponse
)
from app.services.ml_service import ml_service, SKLEARN_AVAILABLE

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ml", tags=["Machine Learning"])


@router.post("/predict-rank", response_model=PredictRankResponse)
async def predict_rank(request: PredictRankRequest):
    """
    Prédit l'évolution du rang d'un produit
    
    Utilise un modèle ML entraîné si disponible, sinon heuristiques.
    """
    try:
        return ml_service.predict_rank(request)
    except Exception as e:
        logger.error(f"❌ Erreur prédiction: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/recommend-price", response_model=RecommendPriceResponse)
async def recommend_price(request: RecommendPriceRequest):
    """
    Recommande un prix optimal
    """
    try:
        return ml_service.recommend_price(request)
    except Exception as e:
        logger.error(f"❌ Erreur recommandation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/find-bestsellers", response_model=FindBestSellersResponse)
async def find_potential_bestsellers(products_data: List[dict], top_n: int = 20):
    """
    Identifie les produits à potentiel best-seller
    """
    try:
        return ml_service.find_bestsellers(products_data, top_n)
    except Exception as e:
        logger.error(f"❌ Erreur: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/train")
async def train_models(products: List[dict]):
    """
    Entraîne les modèles ML sur vos données
    
    Minimum 50 produits requis.
    Les modèles sont sauvegardés pour réutilisation.
    """
    if not SKLEARN_AVAILABLE:
        raise HTTPException(
            status_code=400,
            detail="Scikit-learn non installé. pip install scikit-learn"
        )
    
    if len(products) < 50:
        raise HTTPException(
            status_code=400,
            detail=f"Minimum 50 produits requis ({len(products)} fournis)"
        )
    
    try:
        results = ml_service.train_all(products)
        return {
            "success": True,
            "message": "✅ Modèles entraînés",
            "products_used": len(products),
            "results": results
        }
    except Exception as e:
        logger.error(f"❌ Erreur entraînement: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/train-from-java")
async def train_from_java():
    """
    Entraîne les modèles avec les données du backend Java
    """
    if not SKLEARN_AVAILABLE:
        raise HTTPException(status_code=400, detail="Scikit-learn non disponible")
    
    try:
        from app.services.java_client import java_client
        
        products = await java_client.get_all_products()
        
        if len(products) < 50:
            raise HTTPException(
                status_code=400,
                detail=f"Seulement {len(products)} produits. Minimum 50 requis."
            )
        
        products_data = [p.model_dump() for p in products]
        results = ml_service.train_all(products_data)
        
        return {
            "success": True,
            "products_used": len(products_data),
            "results": results
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erreur: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status")
async def get_ml_status():
    """Statut des modèles ML"""
    return ml_service.get_status()


@router.post("/analyze-product")
async def analyze_product(product: dict):
    """
    Analyse complète d'un produit
    """
    try:
        # Prédiction de rang
        rank_request = PredictRankRequest(
            product_id=product.get('id', 0),
            current_rank=product.get('rank', 5000) or 5000,
            price=product.get('price', 0) or 0,
            rating=product.get('rating', 0) or 0,
            review_count=product.get('review_count', 0) or 0,
            category=product.get('category', '')
        )
        rank_prediction = ml_service.predict_rank(rank_request)
        
        # Recommandation prix
        price_request = RecommendPriceRequest(
            product_id=product.get('id', 0),
            current_price=product.get('price', 0) or 0,
            category=product.get('category', 'Unknown'),
            rating=product.get('rating', 0) or 0,
            review_count=product.get('review_count', 0) or 0,
            rank=product.get('rank')
        )
        price_recommendation = ml_service.recommend_price(price_request)
        
        # Potentiel best-seller
        bs_score, bs_reasons = ml_service.bestseller_model.predict_potential(product)
        
        return {
            "product_id": product.get('id'),
            "title": product.get('title', '')[:100],
            "rank_prediction": {
                "current": rank_prediction.current_rank,
                "predicted": rank_prediction.predicted_rank,
                "trend": rank_prediction.trend.value,
                "confidence": rank_prediction.confidence
            },
            "price_recommendation": {
                "current": price_recommendation.current_price,
                "recommended": price_recommendation.recommended_price,
                "change_percent": price_recommendation.price_change_percent,
                "reasoning": price_recommendation.reasoning
            },
            "bestseller_potential": {
                "score": round(bs_score, 3),
                "reasons": bs_reasons
            }
        }
    except Exception as e:
        logger.error(f"❌ Erreur analyse: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/batch-analyze")
async def batch_analyze(products: List[dict]):
    """Analyse plusieurs produits"""
    results = []
    
    for p in products[:50]:  # Limite à 50
        try:
            analysis = await analyze_product(p)
            results.append(analysis)
        except:
            continue
    
    return {
        "analyzed": len(results),
        "results": results
    }
