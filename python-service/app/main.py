from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
from pathlib import Path
import os
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("logs/python-service.log"),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

from app.api import health, etl, ml

Path("data/uploads").mkdir(parents=True, exist_ok=True)
Path("data/processed").mkdir(parents=True, exist_ok=True)
Path("logs").mkdir(parents=True, exist_ok=True)

app = FastAPI(
    title="Python ML & ETL Service",
    description="""Service Python pour traitement de données et Machine Learning
    
    ## Fonctionnalités
    
    ### ETL
    - Traitement et nettoyage de fichiers CSV
    - Classification automatique (rank, prix)
    - Détection et correction d erreurs
    
    ### Machine Learning
    - Prédiction ranking futur
    - Recommandation prix optimal
    - Identification best-sellers potentiels
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173,http://localhost:8080")
allowed_origins = [origin.strip() for origin in allowed_origins_str.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(etl.router)
app.include_router(ml.router)


@app.get("/")
async def root():
    """Page d accueil"""
    return {
        "service": "Python ML & ETL Service",
        "version": "1.0.0",
        "status": "operational",
        "documentation": "/docs",
        "endpoints": {
            "health": "/api/health",
            "etl": "/api/etl/*",
            "ml": "/api/ml/*"
        }
    }


@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={
            "error": "Not Found",
            "detail": "Endpoint non trouvé",
            "path": str(request.url)
        }
    )


@app.exception_handler(500)
async def internal_error_handler(request, exc):
    logger.error(f"Erreur interne: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "detail": "Une erreur interne est survenue"
        }
    )


@app.on_event("startup")
async def startup_event():
    """Événement au démarrage"""
    logger.info("=" * 60)
    logger.info("🚀 SERVICE PYTHON DÉMARRÉ")
    logger.info("=" * 60)
    logger.info(f"📝 Documentation: http://localhost:{os.getenv('API_PORT', 5000)}/docs")
    logger.info(f"🔗 Backend Java: {os.getenv('JAVA_BACKEND_URL', 'http://localhost:8080')}")
    logger.info(f"🌐 CORS Origins: {', '.join(allowed_origins)}")
    logger.info("=" * 60)


@app.on_event("shutdown")
async def shutdown_event():
    """Événement à l arrêt"""
    logger.info("🛑 SERVICE PYTHON ARRÊTÉ")


if __name__ == "__main__":
    import uvicorn
    
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", 5000))
    reload = os.getenv("API_RELOAD", "True").lower() == "true"
    
    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=reload,
        log_level="info"
    )
