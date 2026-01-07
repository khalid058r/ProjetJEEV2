#!/usr/bin/env python3
"""
Script de nettoyage pour les services Python
Nettoie les fichiers temporaires, cache, logs et données volumineuses
"""

import os
import shutil
from pathlib import Path
from typing import List, Tuple

class PythonServiceCleaner:
    """Nettoie les services Python du projet"""
    
    def __init__(self):
        self.project_root = Path(__file__).parent
        self.total_freed = 0
        self.items_removed = []
        
    def format_size(self, bytes: int) -> str:
        """Formate la taille en unités lisibles"""
        for unit in ['B', 'KB', 'MB', 'GB']:
            if bytes < 1024.0:
                return f"{bytes:.2f} {unit}"
            bytes /= 1024.0
        return f"{bytes:.2f} TB"
    
    def get_size(self, path: Path) -> int:
        """Calcule la taille d'un fichier ou dossier"""
        if path.is_file():
            return path.stat().st_size
        
        total = 0
        try:
            for item in path.rglob('*'):
                if item.is_file():
                    total += item.stat().st_size
        except (PermissionError, FileNotFoundError):
            pass
        return total
    
    def remove_item(self, path: Path, description: str = "") -> bool:
        """Supprime un fichier ou dossier et enregistre la taille libérée"""
        if not path.exists():
            return False
        
        size = self.get_size(path)
        
        try:
            if path.is_dir():
                shutil.rmtree(path)
            else:
                path.unlink()
            
            self.total_freed += size
            self.items_removed.append((str(path.relative_to(self.project_root)), size, description))
            return True
        except Exception as e:
            print(f"⚠️  Erreur lors de la suppression de {path}: {e}")
            return False
    
    def clean_pycache(self, service_path: Path) -> int:
        """Nettoie tous les dossiers __pycache__"""
        count = 0
        for pycache in service_path.rglob('__pycache__'):
            if self.remove_item(pycache, "Python cache"):
                count += 1
        return count
    
    def clean_pyc_files(self, service_path: Path) -> int:
        """Nettoie tous les fichiers .pyc, .pyo, .pyd"""
        count = 0
        for pattern in ['*.pyc', '*.pyo', '*.pyd']:
            for pyc_file in service_path.rglob(pattern):
                if self.remove_item(pyc_file, "Compiled Python"):
                    count += 1
        return count
    
    def clean_logs(self, service_path: Path) -> int:
        """Nettoie les dossiers de logs"""
        count = 0
        logs_dir = service_path / 'logs'
        if logs_dir.exists() and logs_dir.is_dir():
            # Supprimer tous les fichiers de logs mais garder le dossier
            for log_file in logs_dir.glob('*'):
                if log_file.is_file():
                    if self.remove_item(log_file, "Log file"):
                        count += 1
            
            # Créer .gitkeep pour garder le dossier vide
            gitkeep = logs_dir / '.gitkeep'
            gitkeep.touch(exist_ok=True)
        
        # Supprimer aussi les fichiers .log à la racine
        for log_file in service_path.glob('*.log'):
            if self.remove_item(log_file, "Log file"):
                count += 1
        
        return count
    
    def clean_python_service_final(self) -> None:
        """Nettoie le service python-service-final"""
        print("\n📦 Nettoyage de python-service-final...")
        print("="*60)
        
        service_path = self.project_root / 'python-service-final'
        if not service_path.exists():
            print("⏭️  Service non trouvé")
            return
        
        # __pycache__
        count = self.clean_pycache(service_path)
        print(f"✅ {count} dossiers __pycache__ supprimés")
        
        # .pyc files
        count = self.clean_pyc_files(service_path)
        print(f"✅ {count} fichiers .pyc/.pyo/.pyd supprimés")
        
        # Logs
        count = self.clean_logs(service_path)
        print(f"✅ {count} fichiers de logs supprimés")
        
        # Cache data
        cache_dir = service_path / 'data' / 'cache'
        if cache_dir.exists():
            for cache_file in cache_dir.glob('*'):
                if cache_file.name != '.gitkeep':
                    self.remove_item(cache_file, "Cache data")
            print(f"✅ Cache data nettoyé")
            (cache_dir / '.gitkeep').touch(exist_ok=True)
        
        # Uploads (sauf .gitkeep)
        uploads_dir = service_path / 'data' / 'uploads'
        if uploads_dir.exists():
            removed = 0
            for upload_file in uploads_dir.glob('*'):
                if upload_file.name != '.gitkeep':
                    if self.remove_item(upload_file, "Upload file"):
                        removed += 1
            print(f"✅ {removed} fichiers uploads supprimés")
            (uploads_dir / '.gitkeep').touch(exist_ok=True)
        
        # Large embeddings files
        embeddings_dir = service_path / 'data' / 'embeddings'
        if embeddings_dir.exists():
            removed = 0
            for pattern in ['*.npy', '*.index', '*.pkl', '*.joblib']:
                for emb_file in embeddings_dir.glob(pattern):
                    if self.remove_item(emb_file, "Embeddings"):
                        removed += 1
            print(f"✅ {removed} fichiers embeddings supprimés")
            (embeddings_dir / '.gitkeep').touch(exist_ok=True)
        
        # Models directory (sauf .gitkeep)
        models_dir = service_path / 'data' / 'models'
        if models_dir.exists():
            removed = 0
            for model_file in models_dir.glob('*'):
                if model_file.name != '.gitkeep':
                    if self.remove_item(model_file, "ML model"):
                        removed += 1
            if removed > 0:
                print(f"✅ {removed} fichiers de modèles supprimés")
            (models_dir / '.gitkeep').touch(exist_ok=True)
        
        # Large CSV datasets at root
        for csv_file in service_path.glob('*.csv'):
            if csv_file.stat().st_size > 1024 * 1024:  # > 1MB
                self.remove_item(csv_file, "Large dataset")
                print(f"✅ Dataset {csv_file.name} supprimé")
        
        # pytest cache
        pytest_cache = service_path / '.pytest_cache'
        if self.remove_item(pytest_cache, "Pytest cache"):
            print("✅ Pytest cache supprimé")
    
    def clean_chatbot_service(self) -> None:
        """Nettoie le service chatbot-service"""
        print("\n🤖 Nettoyage de chatbot-service...")
        print("="*60)
        
        service_path = self.project_root / 'chatbot-service'
        if not service_path.exists():
            print("⏭️  Service non trouvé")
            return
        
        # __pycache__
        count = self.clean_pycache(service_path)
        print(f"✅ {count} dossiers __pycache__ supprimés")
        
        # .pyc files
        count = self.clean_pyc_files(service_path)
        print(f"✅ {count} fichiers .pyc/.pyo/.pyd supprimés")
        
        # Logs
        count = self.clean_logs(service_path)
        print(f"✅ {count} fichiers de logs supprimés")
        
        # .env backup files
        for env_backup in service_path.glob('.env.*'):
            if env_backup.name not in ['.env', '.env.example']:
                if self.remove_item(env_backup, "Env backup"):
                    print(f"✅ {env_backup.name} supprimé")
    
    def clean_venv(self) -> None:
        """Nettoie le virtual environment (optionnel)"""
        print("\n🐍 Recherche de virtual environments...")
        print("="*60)
        
        venv_paths = [
            self.project_root / '.venv',
            self.project_root / 'venv',
            self.project_root / 'env',
            self.project_root / 'python-service-final' / 'venv',
            self.project_root / 'chatbot-service' / 'venv',
        ]
        
        found = False
        for venv_path in venv_paths:
            if venv_path.exists():
                size = self.get_size(venv_path)
                print(f"⚠️  Trouvé: {venv_path.relative_to(self.project_root)} ({self.format_size(size)})")
                found = True
        
        if found:
            print("\n💡 Pour supprimer les venvs, ajoutez l'option --venv")
        else:
            print("✅ Aucun virtual environment trouvé")
    
    def print_summary(self) -> None:
        """Affiche le résumé du nettoyage"""
        print("\n" + "="*60)
        print("📊 RÉSUMÉ DU NETTOYAGE")
        print("="*60)
        
        if not self.items_removed:
            print("ℹ️  Aucun élément à nettoyer")
            return
        
        # Grouper par type
        by_type = {}
        for path, size, desc in self.items_removed:
            if desc not in by_type:
                by_type[desc] = {'count': 0, 'size': 0, 'items': []}
            by_type[desc]['count'] += 1
            by_type[desc]['size'] += size
            by_type[desc]['items'].append(path)
        
        # Afficher par type
        for desc, info in sorted(by_type.items()):
            print(f"\n📁 {desc}:")
            print(f"   - Éléments supprimés: {info['count']}")
            print(f"   - Espace libéré: {self.format_size(info['size'])}")
        
        print(f"\n{'='*60}")
        print(f"✨ Total des éléments supprimés: {len(self.items_removed)}")
        print(f"💾 Espace total libéré: {self.format_size(self.total_freed)}")
        print(f"{'='*60}\n")
    
    def run(self, include_venv: bool = False) -> None:
        """Exécute le nettoyage complet"""
        print("\n🧹 NETTOYAGE DES SERVICES PYTHON")
        print("="*60)
        print(f"📂 Projet: {self.project_root.name}")
        print("="*60)
        
        # Nettoyer les services
        self.clean_python_service_final()
        self.clean_chatbot_service()
        
        # Vérifier les venvs
        if include_venv:
            venv_paths = [
                self.project_root / '.venv',
                self.project_root / 'venv',
                self.project_root / 'env',
            ]
            for venv_path in venv_paths:
                if venv_path.exists():
                    print(f"\n🗑️  Suppression de {venv_path.name}...")
                    if self.remove_item(venv_path, "Virtual environment"):
                        print(f"✅ {venv_path.name} supprimé")
        else:
            self.clean_venv()
        
        # Afficher le résumé
        self.print_summary()
        
        print("✅ Nettoyage terminé!\n")


def main():
    """Point d'entrée principal"""
    import sys
    
    include_venv = '--venv' in sys.argv or '-v' in sys.argv
    
    if '--help' in sys.argv or '-h' in sys.argv:
        print("""
Usage: python clean_python_services.py [OPTIONS]

Options:
  -h, --help     Affiche cette aide
  -v, --venv     Supprime aussi les virtual environments
  
Description:
  Nettoie les fichiers temporaires des services Python:
  - __pycache__ et fichiers .pyc
  - Logs
  - Cache
  - Embeddings et modèles ML
  - Fichiers uploads
  - Datasets volumineux
        """)
        return
    
    cleaner = PythonServiceCleaner()
    cleaner.run(include_venv=include_venv)


if __name__ == '__main__':
    main()
