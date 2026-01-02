"""
API Routes - Health Check
"""
from fastapi import APIRouter
from datetime import datetime
import logging

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
    
    # Service ML
    try:
        from app.services.ml_service import ml_service, SKLEARN_AVAILABLE
        services.append(ServiceHealth(
            name="ml",
            status="healthy" if SKLEARN_AVAILABLE else "degraded",
            details=ml_service.get_status()
        ))
    except Exception as e:
        services.append(ServiceHealth(name="ml", status="unhealthy", details={"error": str(e)}))
    
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
    overall_status = "unhealthy" if unhealthy else "healthy"
    
    uptime = (datetime.now() - START_TIME).total_seconds()
    
    return HealthResponse(
        status=overall_status,
        timestamp=datetime.now(),
        version="2.0.0",
        services=services,
        uptime_seconds=uptime
    )


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
