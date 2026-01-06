"""
API Routes - Health Check Amélioré
Vérifie tous les composants du service
"""
from fastapi import APIRouter
from datetime import datetime
import logging
import psutil
import os

from app.config import settings
from app.models.schemas import HealthResponse, ServiceHealth

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Health"])

START_TIME = datetime.now()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Check complet de santé du service"""
    services = []
    
    # Service ETL
    services.append(ServiceHealth(
        name="etl",
        status="healthy",
        details={"features": ["csv_processing", "validation", "classification"]}
    ))
    
    # Service Search
    try:
        from app.services.search_service import search_service
        services.append(ServiceHealth(
            name="search",
            status="healthy" if search_service.is_ready else "degraded",
            details={
                "indexed_products": len(search_service.products_data),
                "model": settings.embedding_model
            }
        ))
    except Exception as e:
        services.append(ServiceHealth(name="search", status="unhealthy", details={"error": str(e)}))
    
    # Service Chatbot
    try:
        from app.services.chatbot_service import chatbot_service
        services.append(ServiceHealth(
            name="chatbot",
            status="healthy",
            details={
                "conversations": len(chatbot_service.conversations),
                "llm_active": chatbot_service.use_llm
            }
        ))
    except Exception as e:
        services.append(ServiceHealth(name="chatbot", status="unhealthy", details={"error": str(e)}))
    
    # Service ML Unifié (utilise le nouveau service)
    try:
        from app.services.ml_service_unified import ml_service, SKLEARN_AVAILABLE
        ml_status = ml_service.get_status()
        services.append(ServiceHealth(
            name="ml",
            status="healthy" if ml_service.is_ready() else "degraded",
            details={
                "sklearn_available": SKLEARN_AVAILABLE,
                "models_ready": ml_status.get("ready", False),
                "models_loaded": ml_status.get("metrics", {}).get("models_loaded", 0),
                "load_time_ms": ml_status.get("metrics", {}).get("load_time_ms", 0)
            }
        ))
    except Exception as e:
        services.append(ServiceHealth(name="ml", status="unhealthy", details={"error": str(e)}))
    
    # ModelManager Status
    try:
        from app.core.model_manager import get_model_manager
        mm = get_model_manager()
        mm_status = mm.get_status()
        services.append(ServiceHealth(
            name="model_manager",
            status="healthy" if mm.is_ready() else "degraded",
            details={
                "models": mm_status.get("models", {}),
                "data": mm_status.get("data", {})
            }
        ))
    except Exception as e:
        services.append(ServiceHealth(name="model_manager", status="unavailable", details={"error": str(e)}))
    
    # Cache Status
    try:
        from app.core.cache import get_cache_manager
        cache = get_cache_manager()
        services.append(ServiceHealth(
            name="cache",
            status="healthy",
            details=cache.stats()
        ))
    except Exception as e:
        services.append(ServiceHealth(name="cache", status="unavailable", details={"error": str(e)}))
    
    # Java Backend
    try:
        from app.services.java_client import java_client
        is_available = await java_client.health_check()
        services.append(ServiceHealth(
            name="java_backend",
            status="healthy" if is_available else "unavailable",
            details={"url": settings.java_backend_url}
        ))
    except Exception as e:
        services.append(ServiceHealth(name="java_backend", status="unavailable", details={"error": str(e)}))
    
    # Status global
    unhealthy = [s for s in services if s.status == "unhealthy"]
    degraded = [s for s in services if s.status == "degraded"]
    
    if unhealthy:
        overall_status = "unhealthy"
    elif degraded:
        overall_status = "degraded"
    else:
        overall_status = "healthy"
    
    uptime = (datetime.now() - START_TIME).total_seconds()
    
    return HealthResponse(
        status=overall_status,
        timestamp=datetime.now(),
        version="2.1.0",
        services=services,
        uptime_seconds=uptime
    )


@router.get("/health/ready")
async def readiness_check():
    """
    Readiness probe - Vérifie si le service est prêt à recevoir du trafic
    Utilisé par Kubernetes/Docker pour le load balancing
    """
    try:
        from app.services.ml_service_unified import ml_service
        from app.core.model_manager import get_model_manager
        
        mm = get_model_manager()
        
        return {
            "ready": True,
            "ml_service_ready": ml_service.is_ready(),
            "models_loaded": mm.is_ready(),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "ready": False,
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }


@router.get("/health/live")
async def liveness_check():
    """
    Liveness probe - Vérifie si le service est vivant
    Utilisé par Kubernetes/Docker pour redémarrer le container si nécessaire
    """
    return {
        "alive": True,
        "uptime_seconds": (datetime.now() - START_TIME).total_seconds(),
        "timestamp": datetime.now().isoformat()
    }


@router.get("/metrics")
async def get_metrics():
    """
    Métriques du service pour monitoring
    """
    try:
        process = psutil.Process(os.getpid())
        memory_info = process.memory_info()
        
        # ML Status
        from app.services.ml_service_unified import ml_service
        ml_status = ml_service.get_status()
        
        # Cache stats
        from app.core.cache import get_cache_manager
        cache_stats = get_cache_manager().stats()
        
        return {
            "service": "python-ml-service",
            "version": "2.1.0",
            "uptime_seconds": (datetime.now() - START_TIME).total_seconds(),
            "system": {
                "memory_mb": round(memory_info.rss / 1024 / 1024, 2),
                "memory_percent": round(process.memory_percent(), 2),
                "cpu_percent": process.cpu_percent(),
                "threads": process.num_threads()
            },
            "ml": {
                "ready": ml_status.get("ready", False),
                "models_loaded": ml_status.get("metrics", {}).get("models_loaded", 0),
                "load_time_ms": ml_status.get("metrics", {}).get("load_time_ms", 0)
            },
            "cache": cache_stats,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }


@router.get("/ping")
async def ping():
    """Simple ping"""
    return {"status": "pong", "timestamp": datetime.now().isoformat()}


@router.get("/info")
async def get_info():
    """Informations sur le service"""
    return {
        "service": "Python ML & ETL Service",
        "version": "2.0.0",
        "features": [
            "CSV ETL Processing",
            "Semantic Search",
            "AI Chatbot (LLM)",
            "ML Predictions"
        ],
        "config": {
            "java_backend": settings.java_backend_url,
            "embedding_model": settings.embedding_model,
            "ollama_model": settings.ollama_model,
            "hf_model": settings.hf_model
        }
    }
