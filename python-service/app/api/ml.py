from fastapi import APIRouter, HTTPException
from typing import List
import logging

from app.models.schemas import (
    PredictRankRequest, PredictRankResponse,
    RecommendPriceRequest, RecommendPriceResponse,
    FindBestSellersResponse
)
from app.services.predictor import PredictorService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ml", tags=["Machine Learning"])

predictor = PredictorService()


@router.post("/predict-rank", response_model=PredictRankResponse)
async def predict_rank(request: PredictRankRequest):
    """Prédit le rank futur d un produit"""
    try:
        logger.info(f"🔮 Prédiction rank pour produit {request.product_id}")
        result = predictor.predict_rank(request)
        return result
    
    except Exception as e:
        logger.error(f"❌ Erreur prédiction: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/recommend-price", response_model=RecommendPriceResponse)
async def recommend_price(request: RecommendPriceRequest):
    """Recommande un prix optimal pour un produit"""
    try:
        logger.info(f"💰 Recommandation prix pour produit {request.product_id}")
        result = predictor.recommend_price(request)
        return result
    
    except Exception as e:
        logger.error(f"❌ Erreur recommandation: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/find-bestsellers", response_model=FindBestSellersResponse)
async def find_potential_bestsellers(products_data: List[dict], top_n: int = 20):
    """Identifie produits avec potentiel best-seller"""
    try:
        logger.info(f"🌟 Recherche best-sellers dans {len(products_data)} produits")
        result = predictor.find_potential_bestsellers(products_data, top_n)
        return result
    
    except Exception as e:
        logger.error(f"❌ Erreur recherche best-sellers: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
async def get_ml_stats():
    """Statistiques du service ML"""
    try:
        return {
            "predictions_count": len(predictor.predictions_cache),
            "models_loaded": ["heuristic_rank", "heuristic_price"],
            "status": "operational"
        }
    
    except Exception as e:
        logger.error(f"❌ Erreur stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))
