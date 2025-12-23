import os
import requests

SERPAPI_KEY = os.getenv("SERPAPI_KEY")


def fetch_product_from_asin(asin: str):
    """
    Récupère titre + image Amazon via SerpAPI
    """
    if not SERPAPI_KEY:
        print("❌ SERPAPI_KEY manquante")
        return None

    url = "https://serpapi.com/search.json"
    params = {
        "engine": "amazon",
        "amazon_domain": "amazon.com",
        "q": asin,
        "api_key": SERPAPI_KEY
    }

    try:
        response = requests.get(url, params=params, timeout=15)
        data = response.json()

        print("🔍 Clés SerpAPI :", data.keys())

        product = data.get("product_results")
        if not product:
            print(f"⚠️ Aucun produit trouvé pour {asin}")
            return None

        return {
            "title": product.get("title"),
            "image_url": product.get("main_image"),
            "rating": product.get("rating"),
            "reviews_count": product.get("reviews"),
            "price": product.get("price", {}).get("value")
        }

    except Exception as e:
        print("❌ Erreur SerpAPI :", e)
        return None
