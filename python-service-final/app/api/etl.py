"""
API Routes - ETL (Extract, Transform, Load)
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional, List
from pathlib import Path
import logging
import shutil

from app.config import settings
from app.models.schemas import ETLProcessingResult, ETLImportResult, RankCategory, PriceBucket, StockStatus
from app.services.etl_service import etl_service
from app.services.java_client import java_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/etl", tags=["ETL"])


@router.post("/upload", response_model=ETLProcessingResult)
async def upload_and_process_csv(
    file: UploadFile = File(...),
    validate: bool = Form(True),
    clean: bool = Form(True)
):
    """
    Upload et traite un fichier CSV
    
    - **file**: Fichier CSV à traiter
    - **validate**: Valider les données (défaut: True)
    - **clean**: Nettoyer les données (défaut: True)
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Le fichier doit être un CSV")
    
    # Sauvegarde le fichier
    upload_path = Path(settings.upload_dir) / file.filename
    upload_path.parent.mkdir(parents=True, exist_ok=True)
    
    try:
        with open(upload_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        logger.info(f"📁 Fichier uploadé: {upload_path}")
        
        # Traite le CSV
        result = etl_service.process_csv(
            str(upload_path),
            validate=validate,
            clean=clean
        )
        
        return result
    
    except Exception as e:
        logger.error(f"❌ Erreur traitement: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/process-csv", response_model=ETLProcessingResult)
async def process_existing_csv(
    file_path: str,
    validate: bool = True,
    clean: bool = True
):
    """
    Traite un fichier CSV existant
    
    - **file_path**: Chemin vers le fichier CSV
    - **validate**: Valider les données
    - **clean**: Nettoyer les données
    """
    path = Path(file_path)
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"Fichier non trouvé: {file_path}")
    
    try:
        result = etl_service.process_csv(str(path), validate=validate, clean=clean)
        return result
    except Exception as e:
        logger.error(f"❌ Erreur: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/import-to-java", response_model=ETLImportResult)
async def import_products_to_java(
    products: List[dict],
    update_existing: bool = True
):
    """
    Importe des produits vers le backend Java
    
    - **products**: Liste des produits à importer
    - **update_existing**: Mettre à jour les produits existants
    """
    if not products:
        raise HTTPException(status_code=400, detail="Liste de produits vide")
    
    try:
        # Vérifie la connexion Java
        if not await java_client.health_check():
            raise HTTPException(status_code=503, detail="Backend Java non disponible")
        
        result = await java_client.import_products_batch(products, update_existing)
        
        return ETLImportResult(
            success=result["failed"] == 0,
            imported_count=result["created"] + result["updated"],
            failed_count=result["failed"],
            errors=result["errors"],
            details={
                "created": result["created"],
                "updated": result["updated"]
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erreur import: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload-and-import")
async def upload_process_and_import(
    file: UploadFile = File(...),
    update_existing: bool = Form(True)
):
    """
    Upload, traite et importe directement vers Java
    """
    # Upload et traite
    process_result = await upload_and_process_csv(file, validate=True, clean=True)
    
    if not process_result.success or not process_result.products:
        return {
            "processing": process_result,
            "import": None,
            "message": "Échec du traitement, import annulé"
        }
    
    # Convertit et importe
    products_dict = [p.model_dump() for p in process_result.products]
    
    try:
        import_result = await import_products_to_java(products_dict, update_existing)
        
        return {
            "processing": process_result,
            "import": import_result,
            "message": f"✅ {import_result.imported_count} produits importés"
        }
    except HTTPException as e:
        return {
            "processing": process_result,
            "import": None,
            "message": f"Traitement OK mais import échoué: {e.detail}"
        }


@router.post("/validate")
async def validate_csv_file(file: UploadFile = File(...)):
    """
    Valide un fichier CSV sans l'importer
    
    - **file**: Fichier CSV à valider
    Returns: Résultat de validation avec preview des données
    """
    if not file.filename.endswith('.csv'):
        return {
            "valid": False,
            "errors": ["Le fichier doit être un CSV"],
            "warnings": [],
            "preview": None
        }
    
    # Sauvegarde temporaire
    upload_path = Path(settings.upload_dir) / f"temp_{file.filename}"
    upload_path.parent.mkdir(parents=True, exist_ok=True)
    
    try:
        with open(upload_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Lit le CSV pour validation
        import pandas as pd
        df = pd.read_csv(upload_path, nrows=100)  # Preview des 100 premières lignes
        
        errors = []
        warnings = []
        
        # Vérifie les colonnes requises
        required_cols = ['title', 'price']
        optional_cols = ['asin', 'category', 'rating', 'review_count', 'rank', 'stock', 'image_url']
        
        for col in required_cols:
            if col not in df.columns and col.lower() not in df.columns:
                errors.append(f"Colonne requise manquante: {col}")
        
        for col in optional_cols:
            if col not in df.columns and col.lower() not in df.columns:
                warnings.append(f"Colonne optionnelle manquante: {col}")
        
        # Preview des données
        preview = {
            "columns": list(df.columns),
            "row_count": len(df),
            "sample_rows": df.head(10).fillna("").to_dict('records')
        }
        
        # Nettoyage fichier temporaire
        upload_path.unlink(missing_ok=True)
        
        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings,
            "preview": preview,
            "stats": {
                "total_rows": len(df),
                "columns_count": len(df.columns)
            }
        }
        
    except Exception as e:
        logger.error(f"❌ Erreur validation: {e}")
        upload_path.unlink(missing_ok=True)
        return {
            "valid": False,
            "errors": [str(e)],
            "warnings": [],
            "preview": None
        }


# Jobs storage (in-memory for simplicity)
import_jobs = {}


@router.get("/jobs")
async def list_import_jobs():
    """Liste tous les jobs d'import"""
    return {
        "jobs": list(import_jobs.values()),
        "count": len(import_jobs)
    }


@router.get("/jobs/{job_id}")
async def get_job_status(job_id: str):
    """Récupère le statut d'un job d'import"""
    if job_id not in import_jobs:
        raise HTTPException(status_code=404, detail=f"Job {job_id} non trouvé")
    return import_jobs[job_id]


@router.post("/process-and-import")
async def process_and_import_csv(
    file: UploadFile = File(...),
    update_existing: bool = Form(True)
):
    """
    Traite et importe un fichier CSV vers Java (alias de upload-and-import)
    """
    import uuid
    from datetime import datetime
    
    job_id = str(uuid.uuid4())[:8]
    import_jobs[job_id] = {
        "id": job_id,
        "filename": file.filename,
        "status": "processing",
        "started_at": datetime.now().isoformat(),
        "completed_at": None,
        "imported_count": 0,
        "failed_count": 0,
        "errors": []
    }
    
    try:
        result = await upload_process_and_import(file, update_existing)
        
        import_jobs[job_id].update({
            "status": "completed" if result.get("import") else "partial",
            "completed_at": datetime.now().isoformat(),
            "imported_count": result.get("import", {}).get("imported_count", 0) if result.get("import") else 0,
            "failed_count": result.get("import", {}).get("failed_count", 0) if result.get("import") else 0,
            "processing_result": result.get("processing"),
            "import_result": result.get("import")
        })
        
        return {
            "success": result.get("import") is not None,
            "job_id": job_id,
            "imported_count": import_jobs[job_id]["imported_count"],
            "failed_count": import_jobs[job_id]["failed_count"],
            "message": result.get("message"),
            "processing": result.get("processing"),
            "import": result.get("import")
        }
        
    except Exception as e:
        import_jobs[job_id].update({
            "status": "failed",
            "completed_at": datetime.now().isoformat(),
            "errors": [str(e)]
        })
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/classify-rank/{rank}")
async def classify_rank(rank: int):
    """Classifie un rang"""
    category = etl_service.classify_rank(rank)
    return {
        "rank": rank,
        "category": category.value,
        "description": {
            "top_10": "Best-seller absolu",
            "top_100": "Excellent vendeur",
            "top_1000": "Très bon vendeur",
            "top_5000": "Bon vendeur",
            "beyond_5000": "Vendeur standard"
        }.get(category.value, "Non classé")
    }


@router.get("/classify-price/{price}")
async def classify_price(price: float):
    """Classifie un prix"""
    bucket = etl_service.classify_price(price)
    return {
        "price": price,
        "bucket": bucket.value,
        "range": {
            "budget": "< 25€",
            "economy": "25-50€",
            "standard": "50-100€",
            "premium": "100-500€",
            "luxury": "> 500€"
        }.get(bucket.value, "Non classé")
    }


@router.get("/classify-stock/{stock}")
async def classify_stock(stock: int):
    """Classifie un niveau de stock"""
    status = etl_service.classify_stock(stock)
    return {
        "stock": stock,
        "status": status.value,
        "description": {
            "out_of_stock": "Rupture de stock",
            "low_stock": "Stock faible (< 10)",
            "in_stock": "En stock",
            "high_stock": "Stock important (> 100)"
        }.get(status.value, "Non classé")
    }


@router.get("/files")
async def list_uploaded_files():
    """Liste les fichiers uploadés"""
    upload_dir = Path(settings.upload_dir)
    
    if not upload_dir.exists():
        return {"files": []}
    
    files = []
    for f in upload_dir.glob("*.csv"):
        files.append({
            "name": f.name,
            "size_kb": round(f.stat().st_size / 1024, 2),
            "path": str(f)
        })
    
    return {"files": files}
