"""
API Routes - Machine Learning V2
Utilise les modèles ML entraînés (.pkl) pour les prédictions
"""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/ml/v2", tags=["ML V2 - Modèles Entraînés"])


# ============================================================================
# SCHÉMAS DE REQUÊTE/RÉPONSE
# ============================================================================

class ProductInput(BaseModel):
    """Données produit pour les prédictions (compatible avec Java ProductInputDTO)"""
    id: Optional[str] = None
    name: Optional[str] = None  # Java envoie 'name'
    title: Optional[str] = None  # Pour compatibilité
    price: float = Field(default=0, ge=0)
    rating: float = Field(default=0, ge=0, le=5)
    reviews: int = Field(default=0, ge=0)  # Pour compatibilité
    reviewCount: int = Field(default=0, ge=0)  # Java envoie 'reviewCount'
    category: Optional[str] = None
    description: Optional[str] = None
    stock: int = Field(default=0, ge=0)
    rank: int = Field(default=0, ge=0)
    
    @property
    def product_name(self) -> str:
        """Retourne le nom du produit (name ou title)"""
        return self.name or self.title or "Unknown"
    
    @property
    def review_count(self) -> int:
        """Retourne le nombre de reviews (reviewCount ou reviews)"""
        return self.reviewCount or self.reviews or 0


class PricePredictionResponse(BaseModel):
    """Réponse prédiction de prix"""
    success: bool = True
    predicted_price: float = Field(alias="predictedPrice", default=0)
    confidence: float = 0.85
    confidence_interval: Optional[Dict[str, float]] = Field(alias="confidenceInterval", default=None)
    price_range: Optional[Dict[str, float]] = Field(alias="priceRange", default=None)
    model_used: str = Field(alias="modelUsed", default="RandomForest")
    features_used: List[str] = Field(alias="featuresUsed", default=[])
    recommendation: Optional[str] = None
    error: Optional[str] = None

    class Config:
        populate_by_name = True


class DemandPredictionResponse(BaseModel):
    """Réponse prédiction de demande"""
    success: bool = True
    predicted_demand: float = Field(alias="predictedDemand", default=0)
    predicted_demand_total: Optional[float] = None
    predicted_demand_daily_avg: Optional[float] = None
    daily_forecast: List[Dict[str, Any]] = Field(alias="dailyForecast", default=[])
    trend: str = "stable"
    confidence: float = 0.80
    current_stock: Optional[int] = None
    days_of_stock: Optional[float] = None
    urgency: Optional[str] = None
    recommendation: Optional[str] = None
    model_used: str = Field(alias="modelUsed", default="GradientBoosting")
    error: Optional[str] = None

    class Config:
        populate_by_name = True


class BestsellerPredictionResponse(BaseModel):
    """Réponse prédiction bestseller"""
    success: bool = True
    is_bestseller: bool = Field(alias="isBestseller", default=False)
    probability: float = 0.5
    bestseller_probability: Optional[float] = Field(alias="bestsellerProbability", default=None)
    confidence: str = "medium"
    factors: List[str] = []
    recommendation: Optional[str] = None
    model_used: str = Field(alias="modelUsed", default="RandomForest")
    error: Optional[str] = None

    class Config:
        populate_by_name = True


class SemanticSearchResult(BaseModel):
    """Résultat de recherche sémantique"""
    product_id: str
    score: float
    title: Optional[str] = None


class SemanticSearchResponse(BaseModel):
    """Réponse recherche sémantique"""
    query: str
    results: List[SemanticSearchResult]
    total_found: int
    index_used: str


class SimilarProductResponse(BaseModel):
    """Produit similaire"""
    product_id: str
    similarity_score: float
    title: Optional[str] = None


class ProductAnalysisResponse(BaseModel):
    """Analyse complète d'un produit"""
    product_id: Optional[str]
    price_prediction: Optional[Dict[str, Any]]
    demand_prediction: Optional[Dict[str, Any]]
    bestseller_prediction: Optional[Dict[str, Any]]
    similar_products: Optional[List[Dict[str, Any]]]


# ============================================================================
# INITIALISATION DU SERVICE
# ============================================================================

def get_ml_service():
    """Récupère ou initialise le service ML V2"""
    from app.services.ml_service_v2 import MLServiceV2
    return MLServiceV2()


# ============================================================================
# ENDPOINTS - PRÉDICTIONS
# ============================================================================

@router.post("/predict/price", response_model=PricePredictionResponse)
async def predict_price(product: ProductInput):
    """
    🎯 Prédit le prix optimal d'un produit
    
    Utilise un modèle RandomForest entraîné sur les données historiques.
    Retourne une prédiction avec intervalle de confiance.
    """
    try:
        ml_service = get_ml_service()
        result = ml_service.predict_price(product.model_dump())
        return result
    except Exception as e:
        logger.error(f"❌ Erreur prédiction prix: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/predict/demand", response_model=DemandPredictionResponse)
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
        ml_service = get_ml_service()
        result = ml_service.predict_demand(product.model_dump(), days=days)
        return result
    except Exception as e:
        logger.error(f"❌ Erreur prédiction demande: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/predict/bestseller", response_model=BestsellerPredictionResponse)
async def predict_bestseller(product: ProductInput):
    """
    🌟 Prédit si un produit sera un bestseller
    
    Utilise un classificateur RandomForest pour déterminer
    le potentiel bestseller avec probabilité.
    """
    try:
        ml_service = get_ml_service()
        result = ml_service.predict_bestseller(product.model_dump())
        return result
    except Exception as e:
        logger.error(f"❌ Erreur prédiction bestseller: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# ENDPOINTS - RECHERCHE SÉMANTIQUE
# ============================================================================

@router.get("/search", response_model=SemanticSearchResponse)
async def semantic_search(
    query: str = Query(..., min_length=2, description="Requête de recherche"),
    top_k: int = Query(default=10, ge=1, le=100, description="Nombre de résultats")
):
    """
    🔍 Recherche sémantique de produits
    
    Utilise FAISS et les embeddings TF-IDF pour trouver
    les produits les plus pertinents.
    """
    try:
        ml_service = get_ml_service()
        result = ml_service.semantic_search(query, top_k=top_k)
        return result
    except Exception as e:
        logger.error(f"❌ Erreur recherche: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/similar/{product_id}")
async def find_similar_products(
    product_id: str,
    top_k: int = Query(default=5, ge=1, le=20, description="Nombre de produits similaires")
):
    """
    🔗 Trouve les produits similaires
    
    Utilise la similarité vectorielle pour trouver
    les produits les plus proches.
    """
    try:
        ml_service = get_ml_service()
        result = ml_service.find_similar_products(product_id, top_k=top_k)
        return result
    except Exception as e:
        logger.error(f"❌ Erreur produits similaires: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# ENDPOINTS - ANALYSE COMPLÈTE
# ============================================================================

@router.post("/analyze", response_model=ProductAnalysisResponse)
async def analyze_product(product: ProductInput):
    """
    📊 Analyse complète d'un produit
    
    Combine toutes les prédictions:
    - Prix optimal
    - Demande prévue
    - Potentiel bestseller
    - Produits similaires
    """
    try:
        ml_service = get_ml_service()
        result = ml_service.analyze_product(product.model_dump())
        return result
    except Exception as e:
        logger.error(f"❌ Erreur analyse: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/batch-analyze")
async def batch_analyze(
    products: List[ProductInput],
    limit: int = Query(default=50, ge=1, le=100)
):
    """
    📊 Analyse en lot de plusieurs produits
    """
    try:
        ml_service = get_ml_service()
        results = []
        
        for product in products[:limit]:
            try:
                analysis = ml_service.analyze_product(product.model_dump())
                results.append(analysis)
            except Exception as e:
                logger.warning(f"Erreur analyse produit: {e}")
                continue
        
        return {
            "total_requested": len(products),
            "total_analyzed": len(results),
            "results": results
        }
    except Exception as e:
        logger.error(f"❌ Erreur batch: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# ENDPOINTS - GESTION DES MODÈLES
# ============================================================================

@router.get("/models/status")
async def get_models_status():
    """
    ℹ️ Statut des modèles ML chargés
    
    Retourne l'état de chaque modèle et de l'index FAISS.
    """
    try:
        ml_service = get_ml_service()
        return ml_service.get_status()
    except Exception as e:
        logger.error(f"❌ Erreur statut: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/models/reload")
async def reload_models():
    """
    🔄 Recharge les modèles depuis le disque
    
    Utile après un nouvel entraînement.
    """
    try:
        ml_service = get_ml_service()
        ml_service._load_models()
        ml_service._load_faiss_index()
        
        return {
            "success": True,
            "message": "Modèles rechargés",
            "status": ml_service.get_status()
        }
    except Exception as e:
        logger.error(f"❌ Erreur reload: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/train")
async def train_models(products: List[dict]):
    """
    🎓 Entraîne les modèles avec de nouvelles données
    
    Nécessite au moins 50 produits.
    """
    if len(products) < 50:
        raise HTTPException(
            status_code=400,
            detail=f"Minimum 50 produits requis ({len(products)} fournis)"
        )
    
    try:
        # Import et exécution du training
        import subprocess
        import sys
        from pathlib import Path
        
        train_script = Path(__file__).parent.parent.parent / 'train_models_v2.py'
        
        if not train_script.exists():
            raise HTTPException(
                status_code=500,
                detail="Script d'entraînement non trouvé"
            )
        
        # Exécuter l'entraînement
        result = subprocess.run(
            [sys.executable, str(train_script)],
            capture_output=True,
            text=True,
            timeout=300
        )
        
        if result.returncode != 0:
            raise HTTPException(
                status_code=500,
                detail=f"Erreur entraînement: {result.stderr}"
            )
        
        # Recharger les modèles
        ml_service = get_ml_service()
        ml_service._load_models()
        ml_service._load_faiss_index()
        
        return {
            "success": True,
            "message": "Modèles entraînés et rechargés",
            "output": result.stdout[-500:] if result.stdout else "",
            "status": ml_service.get_status()
        }
        
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=500, detail="Timeout entraînement")
    except Exception as e:
        logger.error(f"❌ Erreur train: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def ml_health_check():
    """🏥 Vérification de santé du service ML"""
    try:
        ml_service = get_ml_service()
        status = ml_service.get_status()
        
        models_loaded = sum([
            status.get('price_model_loaded', False),
            status.get('demand_model_loaded', False),
            status.get('bestseller_model_loaded', False)
        ])
        
        return {
            "status": "healthy" if models_loaded >= 2 else "degraded" if models_loaded >= 1 else "unhealthy",
            "models_loaded": models_loaded,
            "faiss_ready": status.get('faiss_ready', False),
            "details": status
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }
