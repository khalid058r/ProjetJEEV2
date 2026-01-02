import httpx
import asyncio

async def test():
    print("Test connexion Java...")
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get("http://localhost:8080/api/products?page=0&size=1")
            print(f"Status: {response.status_code}")
            print(f"Response: {response.text[:200]}")
    except Exception as e:
        print(f"Erreur: {e}")

asyncio.run(test())