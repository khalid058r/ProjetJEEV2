from fastapi import APIRouter, UploadFile, File
from app.services.aws_etl import start_etl

router = APIRouter(prefix="/etl", tags=["ETL"])

@router.post("/start")
async def start_etl_job(file: UploadFile = File(...)):
    job_id = await start_etl(file)
    return {
        "job_id": job_id,
        "status": "STARTED"
    }

from app.services.job_status import get_job_status

@router.get("/status/{job_id}")
def status(job_id: str):
    return get_job_status(job_id)
