from fastapi import APIRouter
import time
import httpx
import logging
from datetime import datetime

from app.models.schemas import HealthResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Health"])

start_time = time.time()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check du service Python"""
    uptime = time.time() - start_time
    
    # Teste connexion Java backend
    java_accessible = False
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            response = await client.get("http://localhost:8080/api/products")
            java_accessible = response.status_code == 200
    except:
        java_accessible = False
    
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        uptime_seconds=round(uptime, 2),
        java_backend_accessible=java_accessible
    )


@router.get("/ping")
async def ping():
    """Simple ping endpoint"""
    return {
        "message": "pong",
        "timestamp": datetime.now().isoformat()
    }
