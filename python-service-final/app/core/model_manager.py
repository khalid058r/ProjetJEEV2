"""
ModelManager - Singleton pour la gestion centralisée des modèles ML
Charge les modèles une seule fois au démarrage pour des performances optimales
"""
import logging
import pickle
import threading
from pathlib import Path
from typing import Dict, Any, Optional
from functools import lru_cache
import numpy as np

logger = logging.getLogger(__name__)


class ModelManager:
    """
    Gestionnaire singleton des modèles ML
    
    - Charge les modèles une seule fois au démarrage
    - Cache en mémoire pour accès rapide
    - Thread-safe
    - Fallback gracieux si modèle indisponible
    """
    
    _instance = None
    _lock = threading.Lock()
    _initialized = False
    
    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if ModelManager._initialized:
            return
        
        from app.config import settings
        
        self.models_dir = Path(settings.models_dir)
        self.embeddings_dir = Path("data/embeddings")
        
        # Modèles ML
        self._price_model = None
        self._demand_model = None
        self._bestseller_model = None
        self._rank_model = None
        self._scaler = None
        self._label_encoders = {}
        self._feature_columns = []
        
        # FAISS et embeddings
        self._faiss_index = None
        self._product_ids = []
        self._product_embeddings = None
        
        # Données produits (cache)
        self._products_df = None
        
        # Métriques
        self._metrics = {
            "models_loaded": 0,
            "load_time_ms": 0,
            "last_reload": None
        }
        
        # Charger au démarrage
        self._load_all()
        ModelManager._initialized = True
    
    def _load_all(self):
        """Charge tous les modèles et données au démarrage"""
        import time
        start = time.time()
        
        logger.info("🚀 Chargement des modèles ML...")
        
        self._load_ml_models()
        self._load_faiss_index()
        self._load_products_data()
        
        self._metrics["load_time_ms"] = round((time.time() - start) * 1000, 2)
        self._metrics["last_reload"] = time.strftime("%Y-%m-%d %H:%M:%S")
        
        logger.info(f"✅ {self._metrics['models_loaded']} modèles chargés en {self._metrics['load_time_ms']}ms")
    
    def _load_ml_models(self):
        """Charge les modèles ML depuis le disque"""
        model_files = {
            'price': ['price_predictor.pkl', 'price_model.pkl'],
            'demand': ['demand_predictor.pkl'],
            'bestseller': ['bestseller_classifier.pkl', 'bestseller_model.pkl'],
            'rank': ['rank_model.pkl'],
            'scaler': ['scaler.pkl'],
            'encoders': ['label_encoders.pkl'],
            'features': ['feature_columns.pkl']
        }
        
        # Prix
        for filename in model_files['price']:
            path = self.models_dir / filename
            if path.exists():
                self._price_model = self._load_pickle(path)
                if self._price_model:
                    self._metrics["models_loaded"] += 1
                    logger.info(f"  ✓ Modèle prix chargé: {filename}")
                    break
        
        # Demande
        for filename in model_files['demand']:
            path = self.models_dir / filename
            if path.exists():
                self._demand_model = self._load_pickle(path)
                if self._demand_model:
                    self._metrics["models_loaded"] += 1
                    logger.info(f"  ✓ Modèle demande chargé: {filename}")
                    break
        
        # Bestseller
        for filename in model_files['bestseller']:
            path = self.models_dir / filename
            if path.exists():
                self._bestseller_model = self._load_pickle(path)
                if self._bestseller_model:
                    self._metrics["models_loaded"] += 1
                    logger.info(f"  ✓ Modèle bestseller chargé: {filename}")
                    break
        
        # Rank
        for filename in model_files['rank']:
            path = self.models_dir / filename
            if path.exists():
                data = self._load_pickle(path)
                if isinstance(data, dict):
                    self._rank_model = data.get('model')
                    if self._scaler is None:
                        self._scaler = data.get('scaler')
                else:
                    self._rank_model = data
                if self._rank_model:
                    self._metrics["models_loaded"] += 1
                    logger.info(f"  ✓ Modèle rang chargé: {filename}")
                    break
        
        # Scaler
        for filename in model_files['scaler']:
            path = self.models_dir / filename
            if path.exists() and self._scaler is None:
                self._scaler = self._load_pickle(path)
                if self._scaler:
                    logger.info(f"  ✓ Scaler chargé: {filename}")
        
        # Label encoders
        for filename in model_files['encoders']:
            path = self.models_dir / filename
            if path.exists():
                self._label_encoders = self._load_pickle(path) or {}
                if self._label_encoders:
                    logger.info(f"  ✓ Encodeurs chargés: {filename}")
        
        # Feature columns
        for filename in model_files['features']:
            path = self.models_dir / filename
            if path.exists():
                self._feature_columns = self._load_pickle(path) or []
                if self._feature_columns:
                    logger.info(f"  ✓ Features chargées: {filename}")
    
    def _load_faiss_index(self):
        """Charge l'index FAISS et les embeddings"""
        try:
            import faiss
            
            index_path = self.embeddings_dir / 'products.index'
            ids_path = self.embeddings_dir / 'product_ids.pkl'
            embeddings_path = self.embeddings_dir / 'product_embeddings.npy'
            
            if index_path.exists():
                self._faiss_index = faiss.read_index(str(index_path))
                self._metrics["models_loaded"] += 1
                logger.info(f"  ✓ Index FAISS chargé")
            
            if ids_path.exists():
                self._product_ids = self._load_pickle(ids_path) or []
                logger.info(f"  ✓ {len(self._product_ids)} IDs produits chargés")
            
            if embeddings_path.exists():
                # Memory-mapped pour optimiser la mémoire
                self._product_embeddings = np.load(embeddings_path, mmap_mode='r')
                logger.info(f"  ✓ Embeddings chargés: {self._product_embeddings.shape}")
                
        except ImportError:
            logger.warning("⚠️ FAISS non installé - recherche sémantique désactivée")
        except Exception as e:
            logger.warning(f"⚠️ Erreur chargement FAISS: {e}")
    
    def _load_products_data(self):
        """Charge les données produits pour les recommandations"""
        try:
            import pandas as pd
            
            csv_paths = [
                Path("data/uploads/amazon_dataset.csv"),
                Path("amazon_dataset.csv"),
                Path("data/processed/products.csv"),
            ]
            
            for csv_path in csv_paths:
                if csv_path.exists():
                    self._products_df = pd.read_csv(csv_path)
                    logger.info(f"  ✓ {len(self._products_df)} produits chargés depuis {csv_path.name}")
                    break
                    
        except Exception as e:
            logger.warning(f"⚠️ Erreur chargement CSV: {e}")
    
    def _load_pickle(self, path: Path) -> Optional[Any]:
        """Charge un fichier pickle de manière sécurisée"""
        try:
            with open(path, 'rb') as f:
                return pickle.load(f)
        except Exception as e:
            logger.warning(f"Erreur chargement {path}: {e}")
            return None
    
    # ========== Propriétés (accès thread-safe) ==========
    
    @property
    def price_model(self):
        return self._price_model
    
    @property
    def demand_model(self):
        return self._demand_model
    
    @property
    def bestseller_model(self):
        return self._bestseller_model
    
    @property
    def rank_model(self):
        return self._rank_model
    
    @property
    def scaler(self):
        return self._scaler
    
    @property
    def label_encoders(self):
        return self._label_encoders
    
    @property
    def feature_columns(self):
        return self._feature_columns
    
    @property
    def faiss_index(self):
        return self._faiss_index
    
    @property
    def product_ids(self):
        return self._product_ids
    
    @property
    def product_embeddings(self):
        return self._product_embeddings
    
    @property
    def products_df(self):
        return self._products_df
    
    # ========== Méthodes publiques ==========
    
    def is_ready(self) -> bool:
        """Vérifie si au moins un modèle est disponible"""
        return any([
            self._price_model is not None,
            self._demand_model is not None,
            self._bestseller_model is not None,
            self._rank_model is not None
        ])
    
    def get_status(self) -> Dict[str, Any]:
        """Retourne le statut complet des modèles"""
        return {
            "ready": self.is_ready(),
            "models": {
                "price_model": self._price_model is not None,
                "demand_model": self._demand_model is not None,
                "bestseller_model": self._bestseller_model is not None,
                "rank_model": self._rank_model is not None,
                "scaler": self._scaler is not None,
                "faiss_index": self._faiss_index is not None,
            },
            "data": {
                "products_loaded": self._products_df is not None,
                "num_products": len(self._products_df) if self._products_df is not None else 0,
                "num_embeddings": len(self._product_embeddings) if self._product_embeddings is not None else 0,
                "feature_columns": len(self._feature_columns)
            },
            "metrics": self._metrics
        }
    
    def reload_models(self) -> Dict[str, Any]:
        """Recharge tous les modèles (hot reload)"""
        with self._lock:
            ModelManager._initialized = False
            self._metrics["models_loaded"] = 0
            self._load_all()
            return self.get_status()
    
    def save_model(self, name: str, model: Any, metadata: Dict = None) -> bool:
        """Sauvegarde un modèle entraîné"""
        try:
            path = self.models_dir / f"{name}.pkl"
            path.parent.mkdir(parents=True, exist_ok=True)
            
            data = {"model": model, "metadata": metadata} if metadata else model
            
            with open(path, 'wb') as f:
                pickle.dump(data, f)
            
            logger.info(f"✅ Modèle sauvegardé: {path}")
            return True
        except Exception as e:
            logger.error(f"❌ Erreur sauvegarde modèle: {e}")
            return False


# Fonction d'accès global
@lru_cache(maxsize=1)
def get_model_manager() -> ModelManager:
    """Retourne l'instance singleton du ModelManager"""
    return ModelManager()
