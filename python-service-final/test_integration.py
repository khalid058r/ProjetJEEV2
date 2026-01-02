"""
Tests d'intégration pour le Python ML & ETL Service
Exécuter avec: pytest test_integration.py -v
"""
import pytest
import httpx
import asyncio
from typing import Dict, Any

# Configuration
BASE_URL = "http://localhost:5000"


@pytest.fixture
def sample_product() -> Dict[str, Any]:
    """Produit de test"""
    return {
        "id": 1,
        "asin": "B08N5WRWNW",
        "title": "Echo Dot (4th Gen) Smart speaker with Alexa",
        "price": 49.99,
        "rating": 4.7,
        "review_count": 25000,
        "rank": 15,
        "stock": 150,
        "category": "Electronics",
        "image_url": "https://example.com/image.jpg"
    }


@pytest.fixture
def sample_products() -> list:
    """Liste de produits de test"""
    return [
        {
            "id": i,
            "asin": f"B08N5WRW{i:02d}",
            "title": f"Product {i}",
            "price": 10 + i * 5,
            "rating": 3.5 + (i % 3) * 0.5,
            "review_count": 100 * i,
            "rank": 100 + i * 50,
            "stock": 50 + i * 10,
            "category": ["Electronics", "Home", "Sports"][i % 3]
        }
        for i in range(1, 51)
    ]


class TestHealth:
    """Tests Health Endpoints"""
    
    @pytest.mark.asyncio
    async def test_health_check(self):
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BASE_URL}/api/health")
            assert response.status_code == 200
            data = response.json()
            assert "status" in data
    
    @pytest.mark.asyncio
    async def test_ping(self):
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BASE_URL}/api/health/ping")
            assert response.status_code == 200


class TestValidation:
    """Tests Validation Endpoints"""
    
    @pytest.mark.asyncio
    async def test_validate_product(self, sample_product):
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{BASE_URL}/api/validation/product",
                json=sample_product
            )
            assert response.status_code == 200
            data = response.json()
            assert "is_valid" in data
            assert "cleaned_data" in data
            assert "enrichments" in data
    
    @pytest.mark.asyncio
    async def test_validate_product_invalid_asin(self):
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{BASE_URL}/api/validation/product",
                json={"asin": "invalid", "title": "Test", "price": 10}
            )
            assert response.status_code == 200
            data = response.json()
            assert data["is_valid"] == False
            assert any("asin" in e["field"] for e in data["errors"])
    
    @pytest.mark.asyncio
    async def test_validate_batch(self, sample_products):
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{BASE_URL}/api/validation/batch",
                json=sample_products[:10]
            )
            assert response.status_code == 200
            data = response.json()
            assert "total" in data
            assert "valid" in data
            assert "invalid" in data


class TestML:
    """Tests ML Endpoints"""
    
    @pytest.mark.asyncio
    async def test_ml_status(self):
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BASE_URL}/api/ml/status")
            assert response.status_code == 200
            data = response.json()
            assert "sklearn_available" in data
            assert "rank_model" in data
    
    @pytest.mark.asyncio
    async def test_predict_rank(self, sample_product):
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{BASE_URL}/api/ml/predict-rank",
                json={
                    "product_id": sample_product["id"],
                    "current_rank": sample_product["rank"],
                    "price": sample_product["price"],
                    "rating": sample_product["rating"],
                    "review_count": sample_product["review_count"],
                    "category": sample_product["category"]
                }
            )
            assert response.status_code == 200
            data = response.json()
            assert "predicted_rank" in data
            assert "confidence" in data
            assert "trend" in data
    
    @pytest.mark.asyncio
    async def test_recommend_price(self, sample_product):
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{BASE_URL}/api/ml/recommend-price",
                json={
                    "product_id": sample_product["id"],
                    "current_price": sample_product["price"],
                    "category": sample_product["category"],
                    "rating": sample_product["rating"],
                    "review_count": sample_product["review_count"],
                    "rank": sample_product["rank"]
                }
            )
            assert response.status_code == 200
            data = response.json()
            assert "recommended_price" in data
            assert "reasoning" in data
    
    @pytest.mark.asyncio
    async def test_analyze_product(self, sample_product):
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{BASE_URL}/api/ml/analyze-product",
                json=sample_product
            )
            assert response.status_code == 200
            data = response.json()
            assert "rank_prediction" in data
            assert "price_recommendation" in data
            assert "bestseller_potential" in data


class TestAnalytics:
    """Tests Analytics Endpoints"""
    
    @pytest.mark.asyncio
    async def test_calculate_kpis(self, sample_products):
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{BASE_URL}/api/analytics/kpis",
                json=sample_products
            )
            assert response.status_code == 200
            data = response.json()
            assert "success" in data
            assert "data" in data
            kpis = data["data"]
            assert "total_products" in kpis
            assert "price_stats" in kpis
    
    @pytest.mark.asyncio
    async def test_analyze_trends(self, sample_products):
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{BASE_URL}/api/analytics/trends",
                json=sample_products
            )
            assert response.status_code == 200
            data = response.json()
            assert "success" in data
    
    @pytest.mark.asyncio
    async def test_predict_demand(self, sample_products):
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{BASE_URL}/api/analytics/predict-demand",
                json=sample_products,
                params={"days": 30}
            )
            assert response.status_code == 200
            data = response.json()
            assert "predictions" in data
    
    @pytest.mark.asyncio
    async def test_segment_products(self, sample_products):
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{BASE_URL}/api/analytics/segments",
                json=sample_products
            )
            assert response.status_code == 200
            data = response.json()
            assert "success" in data
    
    @pytest.mark.asyncio
    async def test_detect_anomalies(self, sample_products):
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{BASE_URL}/api/analytics/anomalies",
                json=sample_products
            )
            assert response.status_code == 200
            data = response.json()
            assert "data" in data


class TestRecommendations:
    """Tests Recommendations Endpoints"""
    
    @pytest.mark.asyncio
    async def test_index_products(self, sample_products):
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{BASE_URL}/api/recommendations/index",
                json=sample_products
            )
            assert response.status_code == 200
            data = response.json()
            assert "indexed_products" in data
    
    @pytest.mark.asyncio
    async def test_similar_products(self, sample_products):
        # First index products
        async with httpx.AsyncClient() as client:
            await client.post(
                f"{BASE_URL}/api/recommendations/index",
                json=sample_products
            )
            
            # Then get similar
            response = await client.get(
                f"{BASE_URL}/api/recommendations/similar/1",
                params={"limit": 5}
            )
            assert response.status_code == 200
            data = response.json()
            assert "similar_products" in data
    
    @pytest.mark.asyncio
    async def test_trending_products(self, sample_products):
        async with httpx.AsyncClient() as client:
            await client.post(
                f"{BASE_URL}/api/recommendations/index",
                json=sample_products
            )
            
            response = await client.get(
                f"{BASE_URL}/api/recommendations/trending",
                params={"limit": 10}
            )
            assert response.status_code == 200
            data = response.json()
            assert "trending_products" in data
    
    @pytest.mark.asyncio
    async def test_deals(self, sample_products):
        async with httpx.AsyncClient() as client:
            await client.post(
                f"{BASE_URL}/api/recommendations/index",
                json=sample_products
            )
            
            response = await client.get(f"{BASE_URL}/api/recommendations/deals")
            assert response.status_code == 200
            data = response.json()
            assert "deals" in data


class TestSync:
    """Tests Sync Endpoints"""
    
    @pytest.mark.asyncio
    async def test_sync_status(self):
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BASE_URL}/api/sync/status")
            assert response.status_code == 200
            data = response.json()
            assert "last_sync" in data
            assert "products_count" in data


class TestSearch:
    """Tests Search Endpoints"""
    
    @pytest.mark.asyncio
    async def test_search_status(self):
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BASE_URL}/api/search/status")
            assert response.status_code == 200
            data = response.json()
            assert "is_ready" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
