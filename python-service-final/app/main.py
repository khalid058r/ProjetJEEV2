"""
Python ML & ETL Service - Application principale
FastAPI avec ETL, Recherche Sémantique, Chatbot LLM et ML
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
from pathlib import Path
import time

from app.config import settings


# Configuration logging
def setup_logging():
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)
    
    logging.basicConfig(
        level=getattr(logging, settings.log_level.upper()),
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=[
            logging.FileHandler(settings.log_file),
            logging.StreamHandler()
        ]
    )

setup_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Cycle de vie de l'application"""
    # Startup
    logger.info("=" * 70)
    logger.info("[START] DEMARRAGE SERVICE PYTHON ML & ETL")
    logger.info("=" * 70)
    logger.info(f"[DOCS] Documentation: http://localhost:{settings.api_port}/docs")
    logger.info(f"[JAVA] Backend Java: {settings.java_backend_url}")
    logger.info(f"[EMB] Embeddings: {settings.embedding_model}")
    logger.info(f"[LLM] Ollama: {settings.ollama_model}")
    logger.info(f"[LLM] HuggingFace: {settings.hf_model}")
    logger.info("=" * 70)
    
    # Crée les répertoires
    for dir_path in [settings.upload_dir, settings.processed_dir, settings.models_dir, "logs"]:
        Path(dir_path).mkdir(parents=True, exist_ok=True)
    
    yield
    
    # Shutdown
    logger.info("[STOP] ARRET DU SERVICE")
    from app.services.java_client import java_client
    await java_client.close()


# Application FastAPI
app = FastAPI(
    title="Python ML & ETL Service",
    description="""
## Service Python pour E-commerce

###  ETL
- Traitement CSV avec validation
- Classification automatique
- Import vers Java

###  Recherche Sémantique  
- Embeddings sentence-transformers
- Index FAISS
- Filtres avancés

###  Chatbot IA
- LLM Open Source (Ollama/HuggingFace)
- Détection d'intention
- Historique conversation

###  Machine Learning
- Prédiction de rang (Random Forest)
- Recommandation prix (Gradient Boosting)
- Détection best-sellers
    """,
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)


# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Middleware logging
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = (time.time() - start_time) * 1000
    
    if request.url.path.startswith("/api"):
        logger.info(f"{request.method} {request.url.path} - {response.status_code} - {process_time:.2f}ms")
    
    return response


# Import et inclusion des routers
from app.api import health, etl, search, chat, ml, analytics, recommendations, sync, validation
from app.api import ml_v2  # API ML avec modèles entraînés

app.include_router(health.router)
app.include_router(etl.router)
app.include_router(search.router)
app.include_router(chat.router)
app.include_router(ml.router)
app.include_router(ml_v2.router)  # ML V2 avec modèles .pkl
app.include_router(analytics.router)
app.include_router(recommendations.router)
app.include_router(sync.router)
app.include_router(validation.router)


# Route racine
@app.get("/", tags=["Root"])
async def root():
    """Page d'accueil"""
    return {
        "service": "Python ML & ETL Service",
        "version": "2.0.0",
        "status": "operational",
        "docs": "/docs",
        "endpoints": {
            "health": "/api/health",
            "etl": "/api/etl/*",
            "search": "/api/search/*",
            "chat": "/api/chat/*",
            "ml": "/api/ml/*",
            "ml_v2": "/api/ml/v2/* (modèles entraînés)",
            "analytics": "/api/analytics/*",
            "recommendations": "/api/recommendations/*",
            "sync": "/api/sync/*",
            "validation": "/api/validation/*"
        }
    }


# Gestionnaires d'erreurs
@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    return JSONResponse(status_code=404, content={"error": "Not Found", "path": str(request.url.path)})


@app.exception_handler(500)
async def internal_error_handler(request: Request, exc):
    logger.error(f"Erreur interne: {exc}", exc_info=True)
    return JSONResponse(status_code=500, content={"error": "Internal Server Error"})


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.api_reload,
        log_level=settings.log_level.lower()
    )
