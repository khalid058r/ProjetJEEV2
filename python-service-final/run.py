#!/usr/bin/env python3
"""
Script de démarrage du service Python ML & ETL
"""
import sys
import os
from pathlib import Path

# Ajoute le répertoire courant au PYTHONPATH
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))
os.chdir(current_dir)

if __name__ == "__main__":
    import uvicorn
    from dotenv import load_dotenv
    
    # Charge les variables d'environnement
    load_dotenv()
    
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", "5000"))
    reload = os.getenv("API_RELOAD", "True").lower() == "true"
    
    print("=" * 70)
    print("🚀 DÉMARRAGE SERVICE PYTHON ML & ETL")
    print("=" * 70)
    print(f"📍 URL: http://localhost:{port}")
    print(f"📝 Documentation: http://localhost:{port}/docs")
    print(f"🔗 Backend Java: {os.getenv('JAVA_BACKEND_URL', 'http://localhost:8080')}")
    print(f"🤖 Ollama: {os.getenv('OLLAMA_MODEL', 'mistral')}")
    print("=" * 70)
    print()
    print("💡 Pour initialiser le LLM: POST /api/chat/init-llm")
    print("💡 Pour indexer les produits: POST /api/search/index")
    print("💡 Pour entraîner les modèles: POST /api/ml/train-from-java")
    print()
    
    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=reload,
        log_level="info"
    )
