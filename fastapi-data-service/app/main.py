from fastapi import FastAPI
from app.api.etl import router as etl_router

app = FastAPI(
    title="Data & ML Service",
    description="ETL and Data Processing Service",
    version="1.0.0"
)

app.include_router(etl_router)

@app.get("/")
def health():
    return {"status": "ok"}
