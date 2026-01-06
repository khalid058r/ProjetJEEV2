"""
Cache Manager - Gestion centralisée du cache
"""
import logging
import time
from typing import Any, Optional, Dict, Callable
from functools import wraps
import threading
import hashlib
import json

logger = logging.getLogger(__name__)


class LRUCache:
    """Cache LRU simple et thread-safe"""
    
    def __init__(self, maxsize: int = 100, ttl: int = 300):
        self.maxsize = maxsize
        self.ttl = ttl  # Time to live en secondes
        self._cache: Dict[str, tuple] = {}  # key -> (value, timestamp)
        self._lock = threading.Lock()
    
    def get(self, key: str) -> Optional[Any]:
        """Récupère une valeur du cache"""
        with self._lock:
            if key in self._cache:
                value, timestamp = self._cache[key]
                if time.time() - timestamp < self.ttl:
                    # Move to end (most recently used)
                    del self._cache[key]
                    self._cache[key] = (value, timestamp)
                    return value
                else:
                    # Expired
                    del self._cache[key]
            return None
    
    def set(self, key: str, value: Any) -> None:
        """Stocke une valeur dans le cache"""
        with self._lock:
            if len(self._cache) >= self.maxsize:
                # Remove oldest entry
                oldest_key = next(iter(self._cache))
                del self._cache[oldest_key]
            
            self._cache[key] = (value, time.time())
    
    def clear(self) -> None:
        """Vide le cache"""
        with self._lock:
            self._cache.clear()
    
    def stats(self) -> Dict[str, Any]:
        """Retourne les statistiques du cache"""
        with self._lock:
            valid_count = sum(
                1 for _, (_, ts) in self._cache.items()
                if time.time() - ts < self.ttl
            )
            return {
                "size": len(self._cache),
                "valid_entries": valid_count,
                "maxsize": self.maxsize,
                "ttl_seconds": self.ttl
            }


class CacheManager:
    """Gestionnaire centralisé des caches"""
    
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        
        # Différents caches pour différents usages
        self.prediction_cache = LRUCache(maxsize=500, ttl=300)   # 5 min
        self.search_cache = LRUCache(maxsize=100, ttl=60)        # 1 min
        self.embedding_cache = LRUCache(maxsize=1000, ttl=3600)  # 1 heure
        
        self._initialized = True
        logger.info("✅ CacheManager initialisé")
    
    def get_prediction(self, key: str) -> Optional[Any]:
        return self.prediction_cache.get(key)
    
    def set_prediction(self, key: str, value: Any) -> None:
        self.prediction_cache.set(key, value)
    
    def get_search(self, key: str) -> Optional[Any]:
        return self.search_cache.get(key)
    
    def set_search(self, key: str, value: Any) -> None:
        self.search_cache.set(key, value)
    
    def clear_all(self) -> None:
        """Vide tous les caches"""
        self.prediction_cache.clear()
        self.search_cache.clear()
        self.embedding_cache.clear()
    
    def stats(self) -> Dict[str, Any]:
        """Retourne les statistiques de tous les caches"""
        return {
            "prediction_cache": self.prediction_cache.stats(),
            "search_cache": self.search_cache.stats(),
            "embedding_cache": self.embedding_cache.stats()
        }


# Instance singleton
cache_manager = CacheManager()


def get_cache_manager() -> CacheManager:
    return cache_manager


def cache_key(*args, **kwargs) -> str:
    """Génère une clé de cache à partir des arguments"""
    key_data = json.dumps({"args": args, "kwargs": kwargs}, sort_keys=True, default=str)
    return hashlib.md5(key_data.encode()).hexdigest()


def cached_prediction(func: Callable) -> Callable:
    """Décorateur pour cacher les résultats de prédiction"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        key = f"{func.__name__}:{cache_key(*args[1:], **kwargs)}"  # Skip self
        
        cached = cache_manager.get_prediction(key)
        if cached is not None:
            logger.debug(f"Cache hit: {func.__name__}")
            return cached
        
        result = func(*args, **kwargs)
        cache_manager.set_prediction(key, result)
        return result
    
    return wrapper
