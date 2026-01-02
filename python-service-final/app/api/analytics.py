"""
API Routes - Analytics Avancées
KPIs, Tendances, Prédictions, Segmentation
"""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
import logging

from app.services.analytics_service import analytics_service
from app.services.java_client import java_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/kpis")
async def get_product_kpis():
    """
    Calcule et retourne les KPIs produits
    
    KPIs inclus:
    - Statistiques de stock (total, en stock, rupture, faible)
    - Statistiques de prix (moyenne, médiane, min, max)
    - Statistiques de rating
    - Statistiques de rang
    - Valeur d'inventaire
    - Top produits
    """
    try:
        # Récupère les produits du backend Java
        products = await java_client.get_all_products()
        
        if not products:
            return {
                "success": False,
                "message": "Aucun produit trouvé. Vérifiez la connexion au backend Java.",
                "data": analytics_service._empty_kpis()
            }
        
        kpis = analytics_service.calculate_product_kpis(products)
        
        return {
            "success": True,
            "products_analyzed": len(products),
            "data": kpis
        }
    except Exception as e:
        logger.error(f"Erreur calcul KPIs: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/kpis")
async def calculate_kpis_from_data(products: List[dict]):
    """
    Calcule les KPIs à partir de données fournies
    """
    try:
        kpis = analytics_service.calculate_product_kpis(products)
        return {
            "success": True,
            "products_analyzed": len(products),
            "data": kpis
        }
    except Exception as e:
        logger.error(f"Erreur calcul KPIs: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/trends")
async def analyze_trends():
    """
    Analyse les tendances des produits
    
    Retourne:
    - Top catégories par potentiel de revenus
    - Catégories sous-performantes
    - Insights automatiques
    """
    try:
        products = await java_client.get_all_products()
        
        if not products:
            return {
                "success": False,
                "message": "Aucun produit à analyser"
            }
        
        trends = analytics_service.analyze_trends(products)
        
        return {
            "success": True,
            "products_analyzed": len(products),
            "data": trends
        }
    except Exception as e:
        logger.error(f"Erreur analyse tendances: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/trends")
async def analyze_trends_from_data(products: List[dict]):
    """
    Analyse les tendances à partir de données fournies
    """
    try:
        trends = analytics_service.analyze_trends(products)
        return {
            "success": True,
            "products_analyzed": len(products),
            "data": trends
        }
    except Exception as e:
        logger.error(f"Erreur analyse tendances: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/predict-demand")
async def predict_demand(
    days: int = Query(30, ge=7, le=90, description="Nombre de jours de prédiction")
):
    """
    Prédit la demande future des produits
    
    Retourne pour chaque produit:
    - Score de demande
    - Ventes prédites sur la période
    - Jours avant rupture de stock
    - Urgence de réapprovisionnement
    """
    try:
        products = await java_client.get_all_products()
        
        if not products:
            return {
                "success": False,
                "message": "Aucun produit à analyser"
            }
        
        predictions = analytics_service.predict_demand(products, days_ahead=days)
        
        # Résumé
        urgent = sum(1 for p in predictions if p['restock_urgency'] == 'HIGH')
        medium = sum(1 for p in predictions if p['restock_urgency'] == 'MEDIUM')
        
        return {
            "success": True,
            "period_days": days,
            "products_analyzed": len(products),
            "summary": {
                "urgent_restock_needed": urgent,
                "medium_priority": medium,
                "low_priority": len(predictions) - urgent - medium
            },
            "predictions": predictions[:50]  # Top 50 plus urgents
        }
    except Exception as e:
        logger.error(f"Erreur prédiction demande: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/predict-demand")
async def predict_demand_from_data(
    products: List[dict],
    days: int = 30
):
    """
    Prédit la demande à partir de données fournies
    """
    try:
        predictions = analytics_service.predict_demand(products, days_ahead=days)
        
        urgent = sum(1 for p in predictions if p['restock_urgency'] == 'HIGH')
        medium = sum(1 for p in predictions if p['restock_urgency'] == 'MEDIUM')
        
        return {
            "success": True,
            "period_days": days,
            "products_analyzed": len(products),
            "summary": {
                "urgent_restock_needed": urgent,
                "medium_priority": medium
            },
            "predictions": predictions[:50]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/segments")
async def segment_products():
    """
    Segmente les produits selon la matrice BCG
    
    Segments:
    - Stars: Haute performance, forte demande
    - Cash Cows: Revenus stables
    - Question Marks: Potentiel incertain
    - Dogs: Faible performance
    """
    try:
        products = await java_client.get_all_products()
        
        if not products:
            return {
                "success": False,
                "message": "Aucun produit à segmenter"
            }
        
        segments = analytics_service.segment_products(products)
        
        return {
            "success": True,
            "data": segments
        }
    except Exception as e:
        logger.error(f"Erreur segmentation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/segments")
async def segment_products_from_data(products: List[dict]):
    """
    Segmente les produits fournis
    """
    try:
        segments = analytics_service.segment_products(products)
        return {
            "success": True,
            "data": segments
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/anomalies")
async def detect_anomalies():
    """
    Détecte les anomalies dans les données produits
    
    Types détectés:
    - Prix anormaux (outliers)
    - Stock critique
    - Ratings suspects
    - Incohérences de données
    """
    try:
        products = await java_client.get_all_products()
        
        if not products:
            return {
                "success": False,
                "message": "Aucun produit à analyser"
            }
        
        anomalies = analytics_service.detect_anomalies(products)
        
        return {
            "success": True,
            "products_analyzed": len(products),
            "data": anomalies
        }
    except Exception as e:
        logger.error(f"Erreur détection anomalies: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/anomalies")
async def detect_anomalies_from_data(products: List[dict]):
    """
    Détecte les anomalies dans les données fournies
    """
    try:
        anomalies = analytics_service.detect_anomalies(products)
        return {
            "success": True,
            "products_analyzed": len(products),
            "data": anomalies
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/dashboard")
async def get_full_dashboard():
    """
    Retourne un dashboard complet avec toutes les analytics
    
    Combine:
    - KPIs
    - Tendances
    - Prédictions de demande
    - Segments
    - Anomalies
    """
    try:
        products = await java_client.get_all_products()
        
        if not products:
            return {
                "success": False,
                "message": "Aucun produit disponible"
            }
        
        # Calcule toutes les analytics
        kpis = analytics_service.calculate_product_kpis(products)
        trends = analytics_service.analyze_trends(products)
        predictions = analytics_service.predict_demand(products, days_ahead=30)
        segments = analytics_service.segment_products(products)
        anomalies = analytics_service.detect_anomalies(products)
        
        return {
            "success": True,
            "generated_at": str(__import__('datetime').datetime.now()),
            "products_analyzed": len(products),
            "kpis": kpis,
            "trends": trends,
            "demand_predictions": {
                "urgent_restock": sum(1 for p in predictions if p['restock_urgency'] == 'HIGH'),
                "top_10_urgent": predictions[:10]
            },
            "segments": segments,
            "anomalies": anomalies
        }
    except Exception as e:
        logger.error(f"Erreur génération dashboard: {e}")
        raise HTTPException(status_code=500, detail=str(e))
