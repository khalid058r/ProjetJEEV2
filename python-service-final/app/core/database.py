"""
Database Connection Pool - Gestion optimisée des connexions DB
"""
import logging
from typing import Optional, Dict, Any
from contextlib import contextmanager
import threading

logger = logging.getLogger(__name__)


class DatabasePool:
    """
    Pool de connexions MySQL thread-safe
    Évite de créer une nouvelle connexion à chaque requête
    """
    
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
        
        self._pool = None
        self._config = None
        self._initialized = True
    
    def initialize(self, config: Dict[str, Any]) -> bool:
        """Initialise le pool de connexions"""
        try:
            import mysql.connector.pooling
            
            self._config = {
                "pool_name": "ml_service_pool",
                "pool_size": config.get('pool_size', 5),
                "pool_reset_session": True,
                "host": config.get('host', 'localhost'),
                "port": config.get('port', 3306),
                "user": config.get('user', 'root'),
                "password": config.get('password', ''),
                "database": config.get('database', 'salles_management'),
                "charset": 'utf8mb4',
                "autocommit": True,
                "connect_timeout": config.get('timeout', 10)
            }
            
            self._pool = mysql.connector.pooling.MySQLConnectionPool(**self._config)
            logger.info(f"✅ Pool de connexions MySQL créé (taille: {self._config['pool_size']})")
            return True
            
        except ImportError:
            logger.warning("⚠️ mysql-connector-python non installé")
            return False
        except Exception as e:
            logger.error(f"❌ Erreur création pool: {e}")
            return False
    
    @contextmanager
    def get_connection(self):
        """Obtient une connexion du pool (context manager)"""
        conn = None
        try:
            if self._pool is None:
                raise RuntimeError("Pool non initialisé")
            
            conn = self._pool.get_connection()
            yield conn
        finally:
            if conn and conn.is_connected():
                conn.close()
    
    def execute_query(self, query: str, params: tuple = None) -> list:
        """Exécute une requête SELECT"""
        with self.get_connection() as conn:
            cursor = conn.cursor(dictionary=True)
            cursor.execute(query, params)
            results = cursor.fetchall()
            cursor.close()
            return results
    
    def execute_update(self, query: str, params: tuple = None) -> int:
        """Exécute une requête INSERT/UPDATE/DELETE"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            conn.commit()
            affected = cursor.rowcount
            cursor.close()
            return affected
    
    def is_healthy(self) -> bool:
        """Vérifie si le pool est fonctionnel"""
        try:
            if self._pool is None:
                return False
            
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT 1")
                cursor.fetchone()
                cursor.close()
                return True
        except:
            return False
    
    def get_stats(self) -> Dict[str, Any]:
        """Retourne les statistiques du pool"""
        return {
            "initialized": self._pool is not None,
            "pool_size": self._config.get('pool_size', 0) if self._config else 0,
            "healthy": self.is_healthy()
        }


# Instance singleton
db_pool = DatabasePool()


def get_db_pool() -> DatabasePool:
    """Retourne l'instance du pool de connexions"""
    return db_pool
