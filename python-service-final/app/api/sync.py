"""
API Routes - Synchronisation
Gestion de la synchronisation avec le backend Java
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
import logging

from app.services.sync_service import sync_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/sync", tags=["Synchronization"])


@router.post("/full")
async def full_synchronization(force: bool = False):
    """
    Lance une synchronisation complète
    
    Étapes:
    1. Récupération des produits du backend Java
    2. Entraînement des modèles ML
    3. Indexation pour la recherche sémantique
    4. Indexation pour les recommandations
    
    Args:
        force: Force la sync même si récente
    """
    try:
        result = await sync_service.full_sync(force=force)
        return result
    except Exception as e:
        logger.error(f"Erreur sync: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/products")
async def sync_products_only():
    """
    Synchronise uniquement les produits sans réentraîner les modèles
    
    Plus rapide que la sync complète.
    """
    try:
        result = await sync_service.sync_products_only()
        return result
    except Exception as e:
        logger.error(f"Erreur sync produits: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status")
async def get_sync_status():
    """
    Retourne le statut de synchronisation
    
    Inclut:
    - Date dernière sync
    - Nombre de produits
    - Statut des modèles ML
    - Statut de l'indexation
    """
    return sync_service.get_status()


@router.get("/products")
async def get_cached_products(
    refresh: bool = False,
    limit: int = 100,
    offset: int = 0
):
    """
    Retourne les produits en cache
    
    Args:
        refresh: Force le rechargement depuis Java
        limit: Nombre max de produits
        offset: Position de départ
    """
    try:
        products = await sync_service.get_products(force_refresh=refresh)
        
        total = len(products)
        paginated = products[offset:offset + limit]
        
        return {
            "total": total,
            "limit": limit,
            "offset": offset,
            "count": len(paginated),
            "products": paginated
        }
    except Exception as e:
        logger.error(f"Erreur récupération produits: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/background")
async def trigger_background_sync(background_tasks: BackgroundTasks):
    """
    Lance une synchronisation en arrière-plan
    
    Retourne immédiatement, la sync continue en background.
    """
    async def do_sync():
        await sync_service.full_sync(force=True)
    
    background_tasks.add_task(do_sync)
    
    return {
        "status": "started",
        "message": "Synchronisation lancée en arrière-plan. Vérifiez /api/sync/status"
    }


@router.delete("/cache")
async def clear_cache():
    """
    Vide le cache des produits
    """
    sync_service.products_cache = []
    return {"status": "cleared"}
