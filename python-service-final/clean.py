"""
Script de nettoyage et migration du projet Python Service
Supprime les fichiers obsolètes, nettoie le cache et affiche le guide de migration
"""
import os
import shutil
from pathlib import Path


def clean_cache():
    """Nettoie les fichiers temporaires et cache"""
    
    patterns = [
        '**/__pycache__',
        '**/*.pyc',
        '**/*.pyo',
        '**/*.pyd',
        '.pytest_cache',
        'htmlcov',
        '.coverage',
        'data/cache/*',
        'logs/*.log'
    ]
    
    base_path = Path(__file__).parent
    removed_count = 0
    
    for pattern in patterns:
        for path in base_path.glob(pattern):
            try:
                if path.is_file():
                    path.unlink()
                    removed_count += 1
                elif path.is_dir():
                    shutil.rmtree(path)
                    removed_count += 1
                print(f"✓ Cache supprimé: {path.name}")
            except Exception as e:
                print(f"✗ Erreur: {path} - {e}")
    
    return removed_count


def show_large_files():
    """Affiche les fichiers volumineux"""
    base_path = Path(__file__).parent
    large_files = []
    
    for ext in ['*.npy', '*.index', '*.pkl', '*.h5', '*.csv']:
        for path in base_path.glob(f'**/{ext}'):
            size_mb = path.stat().st_size / (1024 * 1024)
            if size_mb > 1:
                large_files.append((path.relative_to(base_path), size_mb))
    
    if large_files:
        print("\n📦 Fichiers volumineux détectés:")
        for path, size in sorted(large_files, key=lambda x: x[1], reverse=True):
            print(f"  {size:.2f} MB - {path}")


def show_structure():
    """Affiche la structure optimale du projet"""
    print("""
📁 Structure optimale du projet:
================================

python-service-final/
├── app/
│   ├── __init__.py
│   ├── config.py           # Configuration centralisée
│   ├── main.py             # Point d'entrée FastAPI
│   │
│   ├── api/                # Routes API
│   │   ├── ml_unified.py   # ✅ API ML unifiée (remplace ml.py + ml_v2.py)
│   │   ├── health.py       # Health checks améliorés
│   │   └── ...autres routes
│   │
│   ├── core/               # ✅ Composants centraux (nouveau)
│   │   ├── model_manager.py  # Singleton pour modèles ML
│   │   ├── cache.py          # Cache LRU thread-safe
│   │   └── database.py       # Connection pool DB
│   │
│   ├── services/           # Logique métier
│   │   ├── ml_service_unified.py  # ✅ Service ML unifié
│   │   └── ...autres services
│   │
│   └── models/schemas.py   # Schémas Pydantic
│
├── data/
│   ├── embeddings/         # Vecteurs FAISS
│   ├── models/             # Modèles ML (.pkl)
│   └── uploads/            # CSV importés
│
├── .env, requirements.txt, run.py
    """)


def show_migration_guide():
    """Affiche le guide de migration"""
    print("""
📋 Guide de migration v2.0 → v2.1:
===================================

1. FICHIERS CRÉÉS (nouveaux):
   ✅ app/core/model_manager.py   - Singleton pour modèles ML (charge 1 fois)
   ✅ app/core/cache.py           - Cache LRU optimisé (TTL configurable)
   ✅ app/core/database.py        - Connection pool MySQL
   ✅ app/services/ml_service_unified.py - Service ML unifié
   ✅ app/api/ml_unified.py       - API ML unifiée

2. FICHIERS OBSOLÈTES (à supprimer après test):
   ❌ app/services/ml_service.py      → Remplacé par ml_service_unified.py
   ❌ app/services/ml_service_v2.py   → Remplacé par ml_service_unified.py
   ❌ app/api/ml.py                   → Remplacé par ml_unified.py
   ❌ app/api/ml_v2.py                → Remplacé par ml_unified.py

3. AMÉLIORATIONS PERFORMANCE:
   ⚡ Modèles ML chargés 1 fois au démarrage (vs chaque requête)
   ⚡ Cache LRU pour prédictions fréquentes
   ⚡ Memory-mapped files pour embeddings
   ⚡ Connection pool pour MySQL

4. NOUVEAUX ENDPOINTS:
   GET  /api/health/ready     - Readiness probe (Kubernetes)
   GET  /api/health/live      - Liveness probe (Kubernetes)
   GET  /api/metrics          - Métriques système + ML
   POST /api/ml/reload        - Hot reload des modèles

5. COMPATIBILITÉ:
   Les anciens endpoints /api/ml/v2/* sont maintenus comme alias
    """)


def clean_project():
    """Nettoyage complet du projet"""
    print("🧹 Nettoyage du projet Python Service")
    print("=" * 50)
    
    removed = clean_cache()
    print(f"\n✅ {removed} fichiers cache supprimés")
    
    show_large_files()
    show_migration_guide()


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        if sys.argv[1] == "--structure":
            show_structure()
        elif sys.argv[1] == "--guide":
            show_migration_guide()
        elif sys.argv[1] == "--clean":
            removed = clean_cache()
            print(f"\n✅ {removed} fichiers cache supprimés")
            show_large_files()
        else:
            print("Usage: python clean.py [--clean|--structure|--guide]")
    else:
        clean_project()

if __name__ == "__main__":
    clean_project()