"""
API Routes - Validation
Validation et nettoyage des données produits
"""
from fastapi import APIRouter, HTTPException
from typing import List
import logging

from app.services.validation_service import validation_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/validation", tags=["Validation"])


@router.post("/product")
async def validate_single_product(product: dict):
    """
    Valide un seul produit
    
    Retourne:
    - is_valid: booléen indiquant si le produit est valide
    - errors: liste des erreurs bloquantes
    - warnings: liste des avertissements
    - cleaned_data: données nettoyées et corrigées
    - enrichments: données calculées (scores, classifications)
    """
    try:
        result = validation_service.validate_product(product)
        return result.to_dict()
    except Exception as e:
        logger.error(f"Erreur validation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/batch")
async def validate_batch_products(products: List[dict]):
    """
    Valide un lot de produits
    
    Retourne:
    - total: nombre total de produits
    - valid: nombre de produits valides
    - invalid: nombre de produits invalides
    - summary: résumé des types d'erreurs
    - products: détails par produit
    """
    try:
        if not products:
            raise HTTPException(status_code=400, detail="Liste de produits vide")
        
        if len(products) > 10000:
            raise HTTPException(
                status_code=400, 
                detail="Maximum 10000 produits par lot"
            )
        
        result = validation_service.validate_batch(products)
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur validation batch: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/clean")
async def clean_product_data(product: dict):
    """
    Nettoie et enrichit un produit
    
    Retourne uniquement les données nettoyées et enrichies,
    sans les détails de validation.
    """
    try:
        result = validation_service.validate_product(product)
        
        return {
            "cleaned": result.cleaned_data,
            "enrichments": result.enrichments,
            "had_issues": len(result.errors) > 0 or len(result.warnings) > 0
        }
    except Exception as e:
        logger.error(f"Erreur nettoyage: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/clean-batch")
async def clean_batch_products(products: List[dict]):
    """
    Nettoie un lot de produits
    
    Retourne les produits nettoyés prêts pour l'import.
    """
    try:
        cleaned_products = []
        
        for product in products:
            result = validation_service.validate_product(product)
            cleaned = {
                **result.cleaned_data,
                **result.enrichments
            }
            cleaned_products.append(cleaned)
        
        return {
            "count": len(cleaned_products),
            "products": cleaned_products
        }
    except Exception as e:
        logger.error(f"Erreur nettoyage batch: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
async def get_validation_stats():
    """
    Retourne les statistiques de validation
    """
    return validation_service.get_stats()


@router.post("/reset-stats")
async def reset_validation_stats():
    """
    Réinitialise les statistiques de validation
    """
    validation_service.stats = {
        "total_validated": 0,
        "valid": 0,
        "invalid": 0,
        "auto_corrected": 0
    }
    return {"status": "reset"}
