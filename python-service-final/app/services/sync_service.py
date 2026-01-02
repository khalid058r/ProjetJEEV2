"""
Service de Synchronisation avec le Backend Java
Gère la communication bidirectionnelle et la cohérence des données
"""
import asyncio
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import json
from pathlib import Path

from app.config import settings
from app.services.java_client import java_client
from app.services.ml_service import ml_service
from app.services.search_service import search_service
from app.services.recommendation_service import recommendation_service

logger = logging.getLogger(__name__)


class SyncService:
    """
    Service de synchronisation entre Python ML et Java Backend
    
    Fonctionnalités:
    - Synchronisation périodique des produits
    - Auto-entraînement des modèles ML
    - Indexation automatique pour la recherche
    - Cache intelligent
    """
    
    def __init__(self):
        self.last_sync: Optional[datetime] = None
        self.sync_interval = timedelta(minutes=30)
        self.products_cache: List[Dict] = []
        self.cache_file = Path("data/cache/products_cache.json")
        self.sync_status = {
            "last_sync": None,
            "products_count": 0,
            "ml_trained": False,
            "search_indexed": False,
            "recommendations_indexed": False,
            "errors": []
        }
        self._sync_lock = asyncio.Lock()
    
    async def full_sync(self, force: bool = False) -> Dict[str, Any]:
        """
        Synchronisation complète:
        1. Récupère les produits du backend Java
        2. Entraîne les modèles ML
        3. Indexe pour la recherche sémantique
        4. Indexe pour les recommandations
        """
        async with self._sync_lock:
            start_time = datetime.now()
            results = {
                "started_at": start_time.isoformat(),
                "steps": {}
            }
            
            try:
                # Vérifie si sync nécessaire
                if not force and self.last_sync:
                    time_since_sync = datetime.now() - self.last_sync
                    if time_since_sync < self.sync_interval:
                        return {
                            "skipped": True,
                            "reason": f"Dernière sync il y a {time_since_sync.seconds}s",
                            "next_sync_in": (self.sync_interval - time_since_sync).seconds
                        }
                
                logger.info("🔄 Début synchronisation complète...")
                
                # 1. Récupération des produits
                logger.info("📥 Étape 1: Récupération des produits...")
                products = await java_client.get_all_products()
                
                if not products:
                    # Essaie de charger depuis le cache
                    products = self._load_from_cache()
                    results["steps"]["fetch"] = {
                        "status": "fallback",
                        "source": "cache",
                        "count": len(products)
                    }
                else:
                    self.products_cache = products
                    self._save_to_cache(products)
                    results["steps"]["fetch"] = {
                        "status": "success",
                        "source": "java_backend",
                        "count": len(products)
                    }
                
                if not products:
                    raise Exception("Aucun produit disponible")
                
                # 2. Entraînement ML
                logger.info("🧠 Étape 2: Entraînement ML...")
                if len(products) >= 50:
                    ml_results = ml_service.train_all(products)
                    results["steps"]["ml_training"] = {
                        "status": "success",
                        "results": ml_results
                    }
                    self.sync_status["ml_trained"] = True
                else:
                    results["steps"]["ml_training"] = {
                        "status": "skipped",
                        "reason": f"Minimum 50 produits requis ({len(products)} disponibles)"
                    }
                
                # 3. Indexation recherche
                logger.info("🔍 Étape 3: Indexation recherche sémantique...")
                try:
                    search_success = search_service.index_products(products)
                    results["steps"]["search_indexing"] = {
                        "status": "success" if search_success else "failed"
                    }
                    self.sync_status["search_indexed"] = search_success
                except Exception as e:
                    results["steps"]["search_indexing"] = {
                        "status": "error",
                        "error": str(e)
                    }
                
                # 4. Indexation recommandations
                logger.info("🎯 Étape 4: Indexation recommandations...")
                try:
                    recommendation_service.index_products(products)
                    results["steps"]["recommendations_indexing"] = {
                        "status": "success",
                        "categories": len(recommendation_service.category_products)
                    }
                    self.sync_status["recommendations_indexed"] = True
                except Exception as e:
                    results["steps"]["recommendations_indexing"] = {
                        "status": "error",
                        "error": str(e)
                    }
                
                # Mise à jour statut
                self.last_sync = datetime.now()
                self.sync_status["last_sync"] = self.last_sync.isoformat()
                self.sync_status["products_count"] = len(products)
                
                duration = (datetime.now() - start_time).total_seconds()
                results["duration_seconds"] = round(duration, 2)
                results["success"] = True
                
                logger.info(f"✅ Synchronisation terminée en {duration:.2f}s")
                
            except Exception as e:
                logger.error(f"❌ Erreur synchronisation: {e}")
                results["success"] = False
                results["error"] = str(e)
                self.sync_status["errors"].append({
                    "time": datetime.now().isoformat(),
                    "error": str(e)
                })
            
            return results
    
    async def sync_products_only(self) -> Dict[str, Any]:
        """Synchronise uniquement les produits sans réentraîner"""
        try:
            products = await java_client.get_all_products()
            
            if products:
                self.products_cache = products
                self._save_to_cache(products)
                return {
                    "success": True,
                    "count": len(products)
                }
            else:
                return {
                    "success": False,
                    "error": "Aucun produit récupéré"
                }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def get_products(self, force_refresh: bool = False) -> List[Dict]:
        """Retourne les produits (cache ou backend)"""
        if force_refresh or not self.products_cache:
            products = await java_client.get_all_products()
            if products:
                self.products_cache = products
        
        if not self.products_cache:
            self.products_cache = self._load_from_cache()
        
        return self.products_cache
    
    def get_status(self) -> Dict[str, Any]:
        """Retourne le statut de synchronisation"""
        return {
            **self.sync_status,
            "cache_size": len(self.products_cache),
            "next_sync": (
                (self.last_sync + self.sync_interval).isoformat() 
                if self.last_sync else None
            )
        }
    
    def _save_to_cache(self, products: List[Dict]) -> None:
        """Sauvegarde les produits en cache"""
        try:
            self.cache_file.parent.mkdir(parents=True, exist_ok=True)
            with open(self.cache_file, 'w', encoding='utf-8') as f:
                json.dump({
                    "saved_at": datetime.now().isoformat(),
                    "count": len(products),
                    "products": products
                }, f, ensure_ascii=False, indent=2)
            logger.debug(f"💾 Cache sauvegardé: {len(products)} produits")
        except Exception as e:
            logger.warning(f"⚠️ Erreur sauvegarde cache: {e}")
    
    def _load_from_cache(self) -> List[Dict]:
        """Charge les produits depuis le cache"""
        try:
            if self.cache_file.exists():
                with open(self.cache_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    products = data.get("products", [])
                    logger.info(f"📦 Cache chargé: {len(products)} produits")
                    return products
        except Exception as e:
            logger.warning(f"⚠️ Erreur chargement cache: {e}")
        return []


# Instance singleton
sync_service = SyncService()


async def startup_sync():
    """Synchronisation au démarrage"""
    logger.info("🚀 Synchronisation au démarrage...")
    
    # Charge depuis le cache d'abord pour un démarrage rapide
    sync_service._load_from_cache()
    
    # Planifie une sync complète en arrière-plan
    asyncio.create_task(_background_sync())


async def _background_sync():
    """Sync en arrière-plan après un délai"""
    await asyncio.sleep(5)  # Attend que le serveur soit prêt
    await sync_service.full_sync(force=True)
