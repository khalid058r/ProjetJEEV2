from fastapi import APIRouter, HTTPException, UploadFile, File
from pathlib import Path
import logging

from app.models.schemas import (
    ProcessCsvRequest, ProcessCsvResponse,
    ClassifyRankRequest, ClassifyRankResponse,
    ClassifyPriceRequest, ClassifyPriceResponse
)
from app.services.csv_processor import CsvProcessorService
from app.utils.helpers import classify_rank, classify_price

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/etl", tags=["ETL"])

csv_processor = CsvProcessorService()


@router.post("/process-csv", response_model=ProcessCsvResponse)
async def process_csv(request: ProcessCsvRequest):
    """Traite un fichier CSV avec nettoyage et classification"""
    try:
        logger.info(f"📥 Requête traitement CSV: {request.file_path}")
        
        if not Path(request.file_path).exists():
            raise HTTPException(status_code=404, detail=f"Fichier non trouvé: {request.file_path}")
        
        result = csv_processor.process_csv(
            csv_path=request.file_path,
            auto_fix=request.auto_fix,
            create_categories=request.create_categories
        )
        
        return result
    
    except FileNotFoundError as e:
        logger.error(f"❌ Fichier introuvable: {e}")
        raise HTTPException(status_code=404, detail=str(e))
    
    except Exception as e:
        logger.error(f"❌ Erreur traitement CSV: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/classify-rank", response_model=ClassifyRankResponse)
async def classify_rank_endpoint(request: ClassifyRankRequest):
    """Classifie un rank en catégorie 1-5"""
    try:
        category, label = classify_rank(request.rank)
        
        if request.rank <= 10:
            percentile = 99.9
        elif request.rank <= 100:
            percentile = 99.0
        elif request.rank <= 1000:
            percentile = 90.0
        elif request.rank <= 5000:
            percentile = 50.0
        else:
            percentile = 10.0
        
        return ClassifyRankResponse(
            rank=request.rank,
            category=category,
            category_label=label,
            percentile=percentile
        )
    
    except Exception as e:
        logger.error(f"❌ Erreur classification rank: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/classify-price", response_model=ClassifyPriceResponse)
async def classify_price_endpoint(request: ClassifyPriceRequest):
    """Classifie un prix en bucket"""
    try:
        category_avg = None
        bucket, label = classify_price(request.price, category_avg)
        
        return ClassifyPriceResponse(
            price=request.price,
            bucket=bucket,
            bucket_label=label,
            category_average=category_avg
        )
    
    except Exception as e:
        logger.error(f"❌ Erreur classification prix: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/set-categories")
async def set_available_categories(categories: list[str]):
    """Définit les catégories disponibles pour le matching"""
    try:
        csv_processor.set_available_categories(categories)
        
        return {
            "success": True,
            "count": len(categories),
            "message": f"{len(categories)} catégories chargées"
        }
    
    except Exception as e:
        logger.error(f"❌ Erreur chargement catégories: {e}")
        raise HTTPException(status_code=500, detail=str(e))
