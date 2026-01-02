"""
Cache - Module de cache simple en mémoire pour le chatbot
Permet d'accélérer les réponses fréquentes sans dépendance externe (pas de Redis)
"""

import time
import hashlib
from typing import Any, Optional, Dict
from collections import OrderedDict
from threading import Lock

class SimpleCache:
    """
    Cache simple en mémoire avec:
    - TTL (Time To Live) configurable
    - Limite de taille (LRU - Least Recently Used)
    - Thread-safe
    """
    
    def __init__(self, max_size: int = 500, default_ttl: int = 300):
        """
        Args:
            max_size: Nombre maximum d'entrées dans le cache
            default_ttl: Durée de vie par défaut en secondes (5 min)
        """
        self.max_size = max_size
        self.default_ttl = default_ttl
        self._cache: OrderedDict = OrderedDict()
        self._lock = Lock()
        self._stats = {'hits': 0, 'misses': 0, 'evictions': 0}
    
    def _generate_key(self, *args, **kwargs) -> str:
        """Génère une clé de cache à partir des arguments"""
        key_data = str(args) + str(sorted(kwargs.items()))
        return hashlib.md5(key_data.encode()).hexdigest()[:16]
    
    def get(self, key: str) -> Optional[Any]:
        """
        Récupère une valeur du cache.
        Retourne None si la clé n'existe pas ou est expirée.
        """
        with self._lock:
            if key not in self._cache:
                self._stats['misses'] += 1
                return None
            
            entry = self._cache[key]
            
            # Vérifie l'expiration
            if entry['expires_at'] < time.time():
                del self._cache[key]
                self._stats['misses'] += 1
                return None
            
            # Move to end (LRU)
            self._cache.move_to_end(key)
            self._stats['hits'] += 1
            return entry['value']
    
    def set(self, key: str, value: Any, ttl: int = None) -> None:
        """
        Stocke une valeur dans le cache.
        
        Args:
            key: Clé de cache
            value: Valeur à stocker
            ttl: Durée de vie en secondes (utilise default_ttl si None)
        """
        if ttl is None:
            ttl = self.default_ttl
        
        with self._lock:
            # Éviction LRU si nécessaire
            while len(self._cache) >= self.max_size:
                self._cache.popitem(last=False)
                self._stats['evictions'] += 1
            
            self._cache[key] = {
                'value': value,
                'expires_at': time.time() + ttl,
                'created_at': time.time()
            }
            self._cache.move_to_end(key)
    
    def delete(self, key: str) -> bool:
        """Supprime une entrée du cache"""
        with self._lock:
            if key in self._cache:
                del self._cache[key]
                return True
            return False
    
    def clear(self) -> None:
        """Vide complètement le cache"""
        with self._lock:
            self._cache.clear()
    
    def get_stats(self) -> Dict[str, Any]:
        """Retourne les statistiques du cache"""
        total_requests = self._stats['hits'] + self._stats['misses']
        hit_rate = (self._stats['hits'] / total_requests * 100) if total_requests > 0 else 0
        
        return {
            'size': len(self._cache),
            'max_size': self.max_size,
            'hits': self._stats['hits'],
            'misses': self._stats['misses'],
            'evictions': self._stats['evictions'],
            'hit_rate': f"{hit_rate:.1f}%"
        }
    
    def cleanup_expired(self) -> int:
        """Supprime les entrées expirées et retourne le nombre supprimé"""
        now = time.time()
        expired_keys = []
        
        with self._lock:
            for key, entry in self._cache.items():
                if entry['expires_at'] < now:
                    expired_keys.append(key)
            
            for key in expired_keys:
                del self._cache[key]
        
        return len(expired_keys)


class ChatbotCache:
    """
    Cache spécialisé pour le chatbot avec différentes catégories
    """
    
    def __init__(self):
        # Cache pour les réponses LLM (TTL court car données peuvent changer)
        self.llm_responses = SimpleCache(max_size=200, default_ttl=120)  # 2 min
        
        # Cache pour les données DB fréquentes (TTL moyen)
        self.db_queries = SimpleCache(max_size=100, default_ttl=60)  # 1 min
        
        # Cache pour les stats globales (TTL plus long)
        self.stats = SimpleCache(max_size=50, default_ttl=300)  # 5 min
        
        # Cache pour les résultats de recherche produits
        self.product_searches = SimpleCache(max_size=100, default_ttl=180)  # 3 min
    
    # ============ Méthodes pour LLM ============
    
    def get_llm_response(self, message: str, role: str) -> Optional[str]:
        """Récupère une réponse LLM cachée"""
        key = self._make_llm_key(message, role)
        return self.llm_responses.get(key)
    
    def cache_llm_response(self, message: str, role: str, response: str, ttl: int = None):
        """Cache une réponse LLM"""
        key = self._make_llm_key(message, role)
        self.llm_responses.set(key, response, ttl)
    
    def _make_llm_key(self, message: str, role: str) -> str:
        """Crée une clé pour le cache LLM"""
        # Normalise le message (lowercase, trim, premiers 100 chars)
        normalized = message.lower().strip()[:100]
        key_data = f"{role}:{normalized}"
        return hashlib.md5(key_data.encode()).hexdigest()[:16]
    
    # ============ Méthodes pour DB ============
    
    def get_db_result(self, query_name: str, params: Dict = None) -> Optional[Any]:
        """Récupère un résultat DB caché"""
        key = self._make_db_key(query_name, params)
        return self.db_queries.get(key)
    
    def cache_db_result(self, query_name: str, result: Any, params: Dict = None, ttl: int = None):
        """Cache un résultat DB"""
        key = self._make_db_key(query_name, params)
        self.db_queries.set(key, result, ttl)
    
    def _make_db_key(self, query_name: str, params: Dict = None) -> str:
        """Crée une clé pour le cache DB"""
        params_str = str(sorted(params.items())) if params else ""
        key_data = f"{query_name}:{params_str}"
        return hashlib.md5(key_data.encode()).hexdigest()[:16]
    
    # ============ Méthodes pour Stats ============
    
    def get_stats_cached(self, stat_name: str) -> Optional[Any]:
        """Récupère des stats cachées"""
        return self.stats.get(stat_name)
    
    def cache_stats(self, stat_name: str, data: Any, ttl: int = None):
        """Cache des stats"""
        self.stats.set(stat_name, data, ttl)
    
    # ============ Méthodes pour Recherche Produits ============
    
    def get_product_search(self, search_term: str) -> Optional[Any]:
        """Récupère une recherche produit cachée"""
        key = hashlib.md5(search_term.lower().strip().encode()).hexdigest()[:16]
        return self.product_searches.get(key)
    
    def cache_product_search(self, search_term: str, results: Any, ttl: int = None):
        """Cache une recherche produit"""
        key = hashlib.md5(search_term.lower().strip().encode()).hexdigest()[:16]
        self.product_searches.set(key, results, ttl)
    
    # ============ Utilitaires ============
    
    def clear_all(self):
        """Vide tous les caches"""
        self.llm_responses.clear()
        self.db_queries.clear()
        self.stats.clear()
        self.product_searches.clear()
    
    def get_all_stats(self) -> Dict[str, Any]:
        """Retourne les stats de tous les caches"""
        return {
            'llm_responses': self.llm_responses.get_stats(),
            'db_queries': self.db_queries.get_stats(),
            'stats': self.stats.get_stats(),
            'product_searches': self.product_searches.get_stats()
        }
    
    def cleanup_all(self) -> Dict[str, int]:
        """Nettoie les entrées expirées de tous les caches"""
        return {
            'llm_responses': self.llm_responses.cleanup_expired(),
            'db_queries': self.db_queries.cleanup_expired(),
            'stats': self.stats.cleanup_expired(),
            'product_searches': self.product_searches.cleanup_expired()
        }


# Instance globale
chatbot_cache = ChatbotCache()
