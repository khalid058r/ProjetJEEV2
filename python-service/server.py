"""
Démarrage du service Python FastAPI
"""
import sys
import os
from pathlib import Path

# Ajoute le répertoire actuel au PYTHONPATH
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

# Change le répertoire de travail
os.chdir(current_dir)

if __name__ == "__main__":
    import uvicorn
    from dotenv import load_dotenv
    
    # Charge les variables d environnement
    load_dotenv()
    
    # Configuration
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", "5000"))
    
    print("=" * 60)
    print("🚀 DÉMARRAGE SERVICE PYTHON")
    print("=" * 60)
    print(f"📍 URL: http://localhost:{port}")
    print(f"📝 Docs: http://localhost:{port}/docs")
    print("=" * 60)
    
    # Démarre le serveur
    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=True,
        log_level="info"
    )
