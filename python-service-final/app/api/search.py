"""
API Routes - Recherche Sémantique
"""
from fastapi import APIRouter, HTTPException
from typing import Optional, List
import logging

from app.models.schemas import SearchQuery, SearchResponse, SearchResult, IndexStatusResponse
from app.services.search_service import search_service
from app.services.java_client import java_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/search", tags=["Search"])


@router.post("", response_model=SearchResponse)
async def search_products(query: SearchQuery):
    """
    Recherche sémantique de produits
    
    - **query**: Texte de recherche
    - **top_k**: Nombre de résultats (défaut: 10)
    - **category_filter**: Filtrer par catégorie
    - **price_min/price_max**: Fourchette de prix
    - **min_rating**: Note minimum
    - **in_stock_only**: Uniquement en stock
    """
    try:
        if not search_service.is_ready:
            return SearchResponse(
                query=query.query,
                results=[],
                total_found=0,
                search_time_ms=0,
                suggestions=["Index non initialisé. Utilisez POST /api/search/index"]
            )
        
        return search_service.search(query)
    except Exception as e:
        logger.error(f"❌ Erreur recherche: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/quick")
async def quick_search(
    q: str,
    limit: int = 10,
    category: Optional[str] = None,
    in_stock: bool = False
):
    """Recherche rapide simplifiée"""
    query = SearchQuery(
        query=q,
        top_k=limit,
        category_filter=category,
        in_stock_only=in_stock
    )
    return await search_products(query)


@router.post("/index")
async def index_products_from_java():
    """
    Indexe tous les produits depuis le backend Java
    """
    try:
        logger.info("📥 Récupération des produits depuis Java...")
        products = await java_client.get_all_products()
        
        if not products:
            raise HTTPException(status_code=400, detail="Aucun produit trouvé dans Java")
        
        products_data = [p.model_dump() for p in products]
        
        logger.info(f"🔄 Indexation de {len(products_data)} produits...")
        success = search_service.index_products(products_data)
        
        if success:
            # Met à jour les stats ML
            try:
                from app.services.ml_service import ml_service
                ml_service.price_model.train(products_data)
            except:
                pass
            
            return {
                "success": True,
                "indexed_count": len(products_data),
                "message": f"✅ {len(products_data)} produits indexés"
            }
        else:
            raise HTTPException(status_code=500, detail="Erreur lors de l'indexation")
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erreur: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/index-data")
async def index_products_data(products: List[dict]):
    """Indexe une liste de produits fournie directement"""
    try:
        if not products:
            raise HTTPException(status_code=400, detail="Liste vide")
        
        success = search_service.index_products(products)
        
        if success:
            return {
                "success": True,
                "indexed_count": len(products),
                "message": f"✅ {len(products)} produits indexés"
            }
        else:
            raise HTTPException(status_code=500, detail="Erreur indexation")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/similar/{product_id}", response_model=List[SearchResult])
async def get_similar_products(product_id: int, top_k: int = 5):
    """Trouve des produits similaires"""
    if not search_service.is_ready:
        raise HTTPException(status_code=400, detail="Index non initialisé")
    
    return search_service.get_similar_products(product_id, top_k)


@router.get("/status", response_model=IndexStatusResponse)
async def get_index_status():
    """Statut de l'index"""
    return search_service.get_status()


@router.delete("/clear")
async def clear_index():
    """Vide l'index"""
    search_service.clear_index()
    return {"success": True, "message": "Index vidé"}


@router.get("/autocomplete")
async def autocomplete(q: str, limit: int = 5):
    """Suggestions d'autocomplétion"""
    if not q or len(q) < 2 or not search_service.is_ready:
        return {"suggestions": []}
    
    query = SearchQuery(query=q, top_k=limit * 2)
    results = search_service.search(query)
    
    suggestions = []
    seen = set()
    
    for r in results.results:
        words = r.title.split()[:5]
        suggestion = " ".join(words)
        
        if suggestion.lower() not in seen:
            suggestions.append(suggestion)
            seen.add(suggestion.lower())
        
        if len(suggestions) >= limit:
            break
    
    return {"suggestions": suggestions}


@router.get("/categories")
async def get_indexed_categories():
    """Catégories présentes dans l'index"""
    if not search_service.is_ready:
        return {"categories": []}
    
    categories = {}
    for product in search_service.products_data:
        cat = product.get("category_name") or product.get("category", "Unknown")
        categories[cat] = categories.get(cat, 0) + 1
    
    sorted_cats = sorted(categories.items(), key=lambda x: x[1], reverse=True)
    
    return {"categories": [{"name": n, "count": c} for n, c in sorted_cats]}


@router.get("/stats")
async def get_search_stats():
    """Statistiques sur l'index"""
    if not search_service.is_ready:
        return {"status": "not_ready", "indexed_products": 0}
    
    products = search_service.products_data
    prices = [p.get("price", 0) for p in products if p.get("price")]
    ratings = [p.get("rating", 0) for p in products if p.get("rating")]
    
    return {
        "status": "ready",
        "indexed_products": len(products),
        "price_stats": {
            "min": min(prices) if prices else 0,
            "max": max(prices) if prices else 0,
            "avg": round(sum(prices) / len(prices), 2) if prices else 0
        },
        "rating_stats": {
            "avg": round(sum(ratings) / len(ratings), 2) if ratings else 0
        }
    }
