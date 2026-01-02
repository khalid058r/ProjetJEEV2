"""
Configuration du Service Python ML & ETL
"""
from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """Configuration centralisée avec variables d'environnement"""
    
    # === API ===
    api_host: str = "0.0.0.0"
    api_port: int = 5000
    api_reload: bool = True
    debug: bool = True
    
    # === Java Backend ===
    java_backend_url: str = "http://localhost:8080"
    java_api_timeout: int = 30
    
    # === CORS ===
    cors_origins: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173", 
        "http://localhost:8080",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173"
    ]
    
    # === Fichiers ===
    upload_dir: str = "data/uploads"
    processed_dir: str = "data/processed"
    models_dir: str = "data/models"
    max_upload_size: int = 50 * 1024 * 1024  # 50MB
    
    # === ML Embeddings ===
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    embedding_dimension: int = 384
    
    # === LLM Open Source ===
    ollama_url: str = "http://localhost:11434"
    ollama_model: str = "mistral"
    hf_model: str = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
    llm_temperature: float = 0.7
    llm_max_tokens: int = 512
    
    # === ML Models ===
    ml_model_type: str = "rf"  # rf ou gb
    ml_n_estimators: int = 100
    ml_max_depth: int = 10
    
    # === Logging ===
    log_level: str = "INFO"
    log_file: str = "logs/app.log"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
