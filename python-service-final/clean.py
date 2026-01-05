import os
import shutil
from pathlib import Path

def clean_project():
    """Nettoie les fichiers temporaires et cache"""
    
    # Dossiers à nettoyer
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
                print(f"✓ Supprimé: {path}")
            except Exception as e:
                print(f"✗ Erreur: {path} - {e}")
    
    print(f"\n{removed_count} fichiers/dossiers supprimés")
    
    # Fichiers volumineux à signaler
    large_files = []
    for ext in ['*.npy', '*.index', '*.pkl', '*.h5', '*.csv']:
        for path in base_path.glob(f'**/{ext}'):
            size_mb = path.stat().st_size / (1024 * 1024)
            if size_mb > 10:
                large_files.append((path, size_mb))
    
    if large_files:
        print("\n⚠️  Fichiers volumineux détectés:")
        for path, size in sorted(large_files, key=lambda x: x[1], reverse=True):
            print(f"  {size:.2f} MB - {path}")

if __name__ == "__main__":
    clean_project()