"""
API Routes - Machine Learning Unifié
Remplace ml.py et ml_v2.py avec une API cohérente et performante
"""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
import logging

from app.services.ml_service_unified import ml_service, SKLEARN_AVAILABLE

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ml", tags=["Machine Learning"])


# ============================================================================
# SCHÉMAS DE REQUÊTE/RÉPONSE (Compatible Java)
# ============================================================================

class ProductInput(BaseModel):
    """Données produit pour les prédictions (compatible avec Java ProductInputDTO)"""
    id: Optional[str] = None
    name: Optional[str] = None
    title: Optional[str] = None
    price: float = Field(default=0, ge=0)
    rating: float = Field(default=0, ge=0, le=5)
    reviews: int = Field(default=0, ge=0)
    reviewCount: int = Field(default=0, ge=0)
    category: Optional[str] = None
    description: Optional[str] = None
    stock: int = Field(default=0, ge=0)
    rank: int = Field(default=0, ge=0)
    current_rank: Optional[int] = None
    
    @property
    def product_name(self) -> str:
        return self.name or self.title or "Unknown"
    
    @property
    def review_count(self) -> int:
        return self.reviewCount or self.reviews or 0
    
    def to_dict(self) -> Dict[str, Any]:
        """Convertit en dictionnaire normalisé"""
        return {
            "id": self.id,
            "name": self.product_name,
            "title": self.title or self.name,
            "price": self.price,
            "rating": self.rating,
            "reviews": self.review_count,
            "review_count": self.review_count,
            "reviewCount": self.review_count,
            "category": self.category,
            "description": self.description,
            "stock": self.stock,
            "rank": self.rank,
            "current_rank": self.current_rank or self.rank
        }


class PredictRankRequest(BaseModel):
    """Requête prédiction de rang"""
    product_id: int = 0
    current_rank: int = 5000
    price: float = 0
    rating: float = 0
    review_count: int = 0
    category: str = ""
    stock: int = 0


class RecommendPriceRequest(BaseModel):
    """Requête recommandation de prix"""
    product_id: int = 0
    current_price: float = 0
    rating: float = 0
    review_count: int = 0
    rank: int = 5000
    category: str = ""


# ============================================================================
# ENDPOINTS - PRÉDICTIONS
# ============================================================================

@router.post("/predict/price")
async def predict_price(product: ProductInput):
    """
    🎯 Prédit le prix optimal d'un produit
    
    Utilise un modèle RandomForest entraîné sur les données historiques.
    Retourne une prédiction avec intervalle de confiance.
    """
    try:
        result = ml_service.predict_price(product.to_dict())
        return result
    except Exception as e:
        logger.error(f"❌ Erreur prédiction prix: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/predict/demand")
async def predict_demand(
    product: ProductInput,
    days: int = Query(default=30, ge=1, le=365, description="Nombre de jours à prévoir")
):
    """
    📦 Prédit la demande future d'un produit
    
    Utilise un modèle GradientBoosting pour prédire les ventes.
    Retourne une prévision quotidienne avec tendance.
    """
    try:
        result = ml_service.predict_demand(product.to_dict(), days=days)
        return result
    except Exception as e:
        logger.error(f"❌ Erreur prédiction demande: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/predict/bestseller")
async def predict_bestseller(product: ProductInput):
    """
    🌟 Prédit si un produit sera un bestseller
    
    Utilise un classificateur RandomForest pour déterminer
    le potentiel bestseller avec probabilité.
    """
    try:
        result = ml_service.predict_bestseller(product.to_dict())
        return result
    except Exception as e:
        logger.error(f"❌ Erreur prédiction bestseller: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/predict-rank")
async def predict_rank(request: PredictRankRequest):
    """
    📊 Prédit l'évolution du rang d'un produit
    
    Utilise un modèle ML entraîné si disponible, sinon heuristiques.
    """
    try:
        product_data = {
            "product_id": request.product_id,
            "current_rank": request.current_rank,
            "rank": request.current_rank,
            "price": request.price,
            "rating": request.rating,
            "review_count": request.review_count,
            "category": request.category,
            "stock": request.stock
        }
        return ml_service.predict_rank(product_data)
    except Exception as e:
        logger.error(f"❌ Erreur prédiction rang: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/recommend-price")
async def recommend_price(request: RecommendPriceRequest):
    """
    💰 Recommande un prix optimal
    """
    try:
        product_data = {
            "product_id": request.product_id,
            "price": request.current_price,
            "rating": request.rating,
            "review_count": request.review_count,
            "rank": request.rank,
            "category": request.category
        }
        return ml_service.predict_price(product_data)
    except Exception as e:
        logger.error(f"❌ Erreur recommandation prix: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# ENDPOINTS - RECHERCHE & SIMILARITÉ
# ============================================================================

@router.get("/search")
async def semantic_search(
    query: str = Query(..., min_length=2, description="Requête de recherche"),
    top_k: int = Query(default=10, ge=1, le=100, description="Nombre de résultats")
):
    """
    🔍 Recherche sémantique de produits
    """
    try:
        result = ml_service.semantic_search(query, top_k)
        return result
    except Exception as e:
        logger.error(f"❌ Erreur recherche: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/similar/{product_id}")
async def find_similar_products(
    product_id: str,
    top_k: int = Query(default=5, ge=1, le=20)
):
    """
    🔗 Trouve des produits similaires
    """
    try:
        result = ml_service.find_similar_products(product_id, top_k)
        return result
    except Exception as e:
        logger.error(f"❌ Erreur produits similaires: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# ENDPOINTS - ANALYSE COMPLÈTE
# ============================================================================

@router.post("/analyze")
async def analyze_product(product: ProductInput):
    """
    📈 Analyse complète d'un produit
    
    Combine toutes les prédictions: prix, demande, bestseller, rang.
    """
    try:
        result = ml_service.analyze_product(product.to_dict())
        return result
    except Exception as e:
        logger.error(f"❌ Erreur analyse: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze-product")
async def analyze_product_legacy(product: dict):
    """
    📈 Analyse complète d'un produit (endpoint legacy)
    """
    try:
        return ml_service.analyze_product(product)
    except Exception as e:
        logger.error(f"❌ Erreur analyse: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/find-bestsellers")
async def find_potential_bestsellers(
    products_data: List[dict],
    top_n: int = Query(default=20, ge=1, le=100)
):
    """
    🏆 Identifie les produits à potentiel best-seller
    """
    try:
        candidates = []
        for p in products_data:
            result = ml_service.predict_bestseller(p)
            if result.get('probability', 0) >= 0.3:
                candidates.append({
                    "product_id": p.get('id', 0),
                    "title": p.get('title', p.get('name', 'Unknown'))[:100],
                    "current_rank": p.get('rank', 9999),
                    "rating": p.get('rating', 0),
                    "review_count": p.get('review_count', p.get('reviews', 0)),
                    "price": p.get('price', 0),
                    "potential_score": result.get('probability', 0),
                    "factors": result.get('factors', [])
                })
        
        candidates.sort(key=lambda x: x['potential_score'], reverse=True)
        
        return {
            "count": min(len(candidates), top_n),
            "products": candidates[:top_n],
            "criteria": {
                "model_trained": ml_service.is_ready(),
                "total_analyzed": len(products_data),
                "candidates_found": len(candidates)
            }
        }
    except Exception as e:
        logger.error(f"❌ Erreur: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# ENDPOINTS - ENTRAÎNEMENT
# ============================================================================

@router.post("/train")
async def train_models(products: List[dict]):
    """
    🎓 Entraîne les modèles ML sur vos données
    
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
    🔄 Entraîne les modèles avec les données du backend Java
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
        
        products_data = [p.model_dump() if hasattr(p, 'model_dump') else p for p in products]
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


# ============================================================================
# ENDPOINTS - STATUT & ADMINISTRATION
# ============================================================================

@router.get("/status")
async def get_ml_status():
    """
    📊 Statut des modèles ML
    """
    return ml_service.get_status()


@router.post("/reload")
async def reload_models():
    """
    🔄 Recharge les modèles ML (hot reload)
    """
    try:
        from app.core.model_manager import get_model_manager
        status = get_model_manager().reload_models()
        return {
            "success": True,
            "message": "Modèles rechargés",
            "status": status
        }
    except Exception as e:
        logger.error(f"❌ Erreur reload: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# ENDPOINTS LEGACY (Compatibilité v2)
# ============================================================================

# Alias pour compatibilité avec l'ancienne API v2
@router.post("/v2/predict/price")
async def predict_price_v2(product: ProductInput):
    """Alias pour /predict/price"""
    return await predict_price(product)


@router.post("/v2/predict/demand")
async def predict_demand_v2(product: ProductInput, days: int = 30):
    """Alias pour /predict/demand"""
    return await predict_demand(product, days)


@router.post("/v2/predict/bestseller")
async def predict_bestseller_v2(product: ProductInput):
    """Alias pour /predict/bestseller"""
    return await predict_bestseller(product)


@router.get("/v2/search")
async def semantic_search_v2(query: str, top_k: int = 10):
    """Alias pour /search"""
    return await semantic_search(query, top_k)


@router.get("/v2/similar/{product_id}")
async def find_similar_v2(product_id: str, top_k: int = 5):
    """Alias pour /similar/{product_id}"""
    return await find_similar_products(product_id, top_k)


@router.post("/v2/analyze")
async def analyze_product_v2(product: ProductInput):
    """Alias pour /analyze"""
    return await analyze_product(product)


@router.get("/v2/status")
async def get_status_v2():
    """Alias pour /status"""
    return await get_ml_status()
