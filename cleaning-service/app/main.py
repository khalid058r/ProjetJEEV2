from fastapi import FastAPI
from app.services.amazon_client import fetch_product_from_asin

from dotenv import load_dotenv
load_dotenv()

app = FastAPI(title="Cleaning Service API")

import os
print("🔑 SERPAPI_KEY =", os.getenv("SERPAPI_KEY"))
@app.get("/test/amazon-title")
def test_amazon_title(asin: str):

    print(f"▶️ Test ASIN : {asin}")

    data = fetch_product_from_asin(asin)

    print("📦 Data reçue :", data)

    if not data:
        return {
            "success": False,
            "asin": asin,
            "message": "Aucune donnée récupérée"
        }

    return {
        "success": True,
        "asin": asin,
        **data
    }
