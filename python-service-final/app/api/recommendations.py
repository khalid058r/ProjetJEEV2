"""
API Routes - Recommandations
Produits similaires, cross-selling, up-selling, deals
"""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
import logging

from app.services.recommendation_service import recommendation_service
from app.services.java_client import java_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/recommendations", tags=["Recommendations"])


@router.post("/index")
async def index_products_for_recommendations(products: Optional[List[dict]] = None):
    """
    Indexe les produits pour les recommandations
    
    Si aucun produit fourni, récupère depuis le backend Java.
    """
    try:
        if not products:
            products = await java_client.get_all_products()
        
        if not products:
            raise HTTPException(
                status_code=400, 
                detail="Aucun produit à indexer"
            )
        
        recommendation_service.index_products(products)
        
        return {
            "success": True,
            "indexed_products": len(products),
            "categories": len(recommendation_service.category_products)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur indexation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/similar/{product_id}")
async def get_similar_products(
    product_id: int,
    limit: int = Query(10, ge=1, le=50),
    same_category: bool = True
):
    """
    Trouve des produits similaires
    
    Basé sur: catégorie, prix, rating
    """
    try:
        # Auto-index si vide
        if not recommendation_service.product_index:
            products = await java_client.get_all_products()
            if products:
                recommendation_service.index_products(products)
        
        results = recommendation_service.get_similar_products(
            product_id, 
            limit=limit,
            same_category=same_category
        )
        
        return {
            "success": True,
            "product_id": product_id,
            "count": len(results),
            "recommendations": results,
            "similar_products": results  # Backward compatibility
        }
    except Exception as e:
        logger.error(f"Erreur: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/upsell/{product_id}")
async def get_upsell_products(
    product_id: int,
    limit: int = Query(5, ge=1, le=20)
):
    """
    Trouve des alternatives premium (up-sell)
    
    Produits plus chers mais meilleurs (rating, rang)
    """
    try:
        if not recommendation_service.product_index:
            products = await java_client.get_all_products()
            if products:
                recommendation_service.index_products(products)
        
        results = recommendation_service.get_upsell_products(product_id, limit=limit)
        
        return {
            "success": True,
            "product_id": product_id,
            "count": len(results),
            "recommendations": results,
            "upsell_options": results
        }
    except Exception as e:
        logger.error(f"Erreur: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/crosssell/{product_id}")
async def get_crosssell_products(
    product_id: int,
    limit: int = Query(5, ge=1, le=20)
):
    """
    Trouve des produits complémentaires (cross-sell)
    
    Produits d'autres catégories qui se marient bien
    """
    try:
        if not recommendation_service.product_index:
            products = await java_client.get_all_products()
            if products:
                recommendation_service.index_products(products)
        
        results = recommendation_service.get_crosssell_products(product_id, limit=limit)
        
        return {
            "success": True,
            "product_id": product_id,
            "count": len(results),
            "recommendations": results,
            "crosssell_suggestions": results
        }
    except Exception as e:
        logger.error(f"Erreur: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/product/{product_id}")
async def get_all_recommendations_for_product(product_id: int):
    """
    Retourne toutes les recommandations pour un produit
    
    Inclut:
    - Produits similaires
    - Up-sell (alternatives premium)
    - Cross-sell (compléments)
    - Trending dans la catégorie
    """
    try:
        if not recommendation_service.product_index:
            products = await java_client.get_all_products()
            if products:
                recommendation_service.index_products(products)
        
        results = recommendation_service.get_comprehensive_recommendations(product_id)
        
        if "error" in results:
            raise HTTPException(status_code=404, detail=results["error"])
        
        return results
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/category/{category}")
async def get_category_recommendations(
    category: str,
    limit: int = Query(10, ge=1, le=50),
    sort_by: str = Query("rating", regex="^(rating|price|rank)$")
):
    """
    Recommandations par catégorie
    
    Tri possible par: rating, price, rank
    """
    try:
        if not recommendation_service.product_index:
            products = await java_client.get_all_products()
            if products:
                recommendation_service.index_products(products)
        
        results = recommendation_service.get_category_recommendations(
            category, 
            limit=limit, 
            sort_by=sort_by
        )
        
        return {
            "category": category,
            "sort_by": sort_by,
            "count": len(results),
            "products": results
        }
    except Exception as e:
        logger.error(f"Erreur: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/trending")
async def get_trending_products(
    limit: int = Query(20, ge=1, le=100)
):
    """
    Produits tendance
    
    Basé sur: rang, nombre d'avis, rating
    """
    try:
        if not recommendation_service.product_index:
            products = await java_client.get_all_products()
            if products:
                recommendation_service.index_products(products)
        
        results = recommendation_service.get_trending_products(limit=limit)
        
        return {
            "count": len(results),
            "trending_products": results
        }
    except Exception as e:
        logger.error(f"Erreur: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/deals")
async def get_best_deals(
    limit: int = Query(20, ge=1, le=100)
):
    """
    Meilleures affaires
    
    Produits bien notés avec prix inférieur à la médiane de la catégorie
    """
    try:
        if not recommendation_service.product_index:
            products = await java_client.get_all_products()
            if products:
                recommendation_service.index_products(products)
        
        results = recommendation_service.get_deals(limit=limit)
        
        return {
            "count": len(results),
            "deals": results
        }
    except Exception as e:
        logger.error(f"Erreur: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/categories")
async def get_available_categories():
    """
    Liste des catégories disponibles avec statistiques
    """
    try:
        if not recommendation_service.product_index:
            products = await java_client.get_all_products()
            if products:
                recommendation_service.index_products(products)
        
        categories = []
        for cat, products in recommendation_service.category_products.items():
            stats = recommendation_service.price_ranges.get(cat, {})
            categories.append({
                "name": cat,
                "product_count": len(products),
                "price_stats": stats
            })
        
        categories.sort(key=lambda x: x['product_count'], reverse=True)
        
        return {
            "count": len(categories),
            "categories": categories
        }
    except Exception as e:
        logger.error(f"Erreur: {e}")
        raise HTTPException(status_code=500, detail=str(e))
