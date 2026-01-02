"""
Client HTTP pour communiquer avec le backend Java Spring Boot
"""
import logging
from typing import List, Optional, Dict, Any
import httpx

from app.config import settings

logger = logging.getLogger(__name__)


class JavaBackendClient:
    def __init__(self):
        self.base_url = settings.java_backend_url
        self.timeout = settings.java_api_timeout
        self._client = None
    
    async def get_client(self):
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                base_url=self.base_url,
                timeout=self.timeout,
                headers={"Content-Type": "application/json"}
            )
        return self._client
    
    async def close(self):
        if self._client and not self._client.is_closed:
            await self._client.aclose()
            self._client = None
    
    async def health_check(self) -> bool:
        try:
            client = await self.get_client()
            response = await client.get("/api/products?page=0&size=1")
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False
    
    async def get_all_categories(self):
        try:
            client = await self.get_client()
            response = await client.get("/api/categories")
            data = response.json()
            if isinstance(data, list):
                return data
            return data.get("content", [])
        except Exception as e:
            logger.error(f"Get categories error: {e}")
            return []
    
    async def get_category_by_name(self, name: str):
        categories = await self.get_all_categories()
        for cat in categories:
            if cat.get("name", "").lower() == name.lower():
                return cat
        return None
    
    async def create_category(self, name: str):
        try:
            client = await self.get_client()
            payload = {"name": name, "description": f"Category {name}"}
            response = await client.post("/api/categories", json=payload)
            if response.status_code in [200, 201]:
                return response.json()
            return None
        except Exception as e:
            logger.error(f"Create category error: {e}")
            return None
    
    async def get_or_create_category(self, name: str):
        if not name:
            name = "Unknown"
        existing = await self.get_category_by_name(name)
        if existing:
            return existing.get("id")
        created = await self.create_category(name)
        return created.get("id") if created else None
    
    async def get_all_products(self, page=0, size=1000):
        try:
            client = await self.get_client()
            response = await client.get(f"/api/products?page={page}&size={size}")
            data = response.json()
            if isinstance(data, list):
                return data
            return data.get("content", [])
        except Exception as e:
            logger.error(f"Get products error: {e}")
            return []
    
    async def create_product(self, product: Dict[str, Any]):
        try:
            client = await self.get_client()
            
            category_name = product.get("category") or "Unknown"
            category_id = await self.get_or_create_category(category_name)
            
            payload = {
                "asin": product.get("asin"),
                "title": str(product.get("title", ""))[:500],
                "price": float(product.get("price", 0) or 0),
                "rating": float(product.get("rating", 0) or 0),
                "reviewCount": int(product.get("review_count", 0) or 0),
                "rank": int(product.get("rank", 0) or 0),
                "stock": int(product.get("stock", 0) or 0),
                "imageUrl": str(product.get("image_url", "")),
            }
            
            if category_id:
                payload["category"] = {"id": category_id}
            
            response = await client.post("/api/products", json=payload)
            
            if response.status_code in [200, 201]:
                return response.json()
            else:
                logger.error(f"Create product error: {response.status_code} - {response.text[:100]}")
                return None
        except Exception as e:
            logger.error(f"Create product exception: {e}")
            return None
    
    async def import_products_batch(self, products: List[Dict], update_existing=True):
        results = {"total": len(products), "created": 0, "updated": 0, "failed": 0, "errors": []}
        
        for i, product in enumerate(products):
            if i % 50 == 0:
                logger.info(f"Import progress: {i}/{len(products)}")
            
            result = await self.create_product(product)
            if result:
                results["created"] += 1
            else:
                results["failed"] += 1
        
        logger.info(f"Import done: {results['created']} created, {results['failed']} failed")
        return results


java_client = JavaBackendClient()