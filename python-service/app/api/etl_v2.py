from fastapi import APIRouter, HTTPException
from pathlib import Path
import logging

from app.services.csv_processor_v2 import EnhancedCsvProcessor

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/etl", tags=["ETL"])

processor = EnhancedCsvProcessor(chunk_size=1000)


@router.post("/process-csv")
async def process_csv_enhanced(
    file_path: str,
    auto_fix: bool = True,
    strict_mode: bool = False
):
    """
    Traite CSV avec ETL amélioré
    
    Args:
        file_path: Chemin fichier CSV
        auto_fix: Corriger erreurs simples automatiquement
        strict_mode: Rejeter si moindre warning
    """
    try:
        result = processor.process_csv(file_path, auto_fix, strict_mode)
        
        if not result["success"]:
            raise HTTPException(status_code=500, detail=result["message"])
        
        return result
    
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    except Exception as e:
        logger.error(f"❌ Erreur traitement: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/set-categories")
async def set_categories(categories: list[str]):
    """Charge catégories depuis Java"""
    processor.set_available_categories(categories)
    return {
        "success": True,
        "count": len(categories),
        "message": f"{len(categories)} catégories chargées"
    }
