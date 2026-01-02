"""
Test des modèles ML V2
Vérifie que les modèles sont correctement chargés et fonctionnels
"""
import sys
import os
from pathlib import Path

# Ajouter le chemin du projet
sys.path.insert(0, str(Path(__file__).parent))

def test_ml_service_v2():
    """Test du service ML V2"""
    print("=" * 60)
    print("🧪 TEST DU SERVICE ML V2")
    print("=" * 60)
    
    try:
        from app.services.ml_service_v2 import MLServiceV2
        print("✅ Import MLServiceV2 réussi")
    except ImportError as e:
        print(f"❌ Erreur import: {e}")
        return False
    
    # Initialiser le service
    print("\n📦 Initialisation du service...")
    ml_service = MLServiceV2()
    
    # Vérifier le statut
    print("\n📊 Statut des modèles:")
    status = ml_service.get_status()
    for key, value in status.items():
        icon = "✅" if value else "❌"
        print(f"   {icon} {key}: {value}")
    
    # Produit de test
    test_product = {
        "id": "TEST001",
        "title": "Test Product Wireless Bluetooth Headphones",
        "price": 49.99,
        "rating": 4.2,
        "reviews": 150,
        "category": "Electronics"
    }
    
    print(f"\n🎯 Produit de test: {test_product['title']}")
    print(f"   Prix: ${test_product['price']}")
    print(f"   Rating: {test_product['rating']}")
    print(f"   Reviews: {test_product['reviews']}")
    
    # Test prédiction de prix
    print("\n💰 Test Prédiction de Prix...")
    try:
        price_result = ml_service.predict_price(test_product)
        print(f"   Prix prédit: ${price_result.get('predicted_price', 'N/A'):.2f}")
        print(f"   Confiance: {price_result.get('confidence', 0)*100:.1f}%")
        print(f"   Modèle utilisé: {price_result.get('model_used', 'N/A')}")
    except Exception as e:
        print(f"   ⚠️ Erreur: {e}")
    
    # Test prédiction de demande
    print("\n📦 Test Prédiction de Demande...")
    try:
        demand_result = ml_service.predict_demand(test_product, days=7)
        print(f"   Demande prédite: {demand_result.get('predicted_demand', 'N/A'):.1f}")
        print(f"   Tendance: {demand_result.get('trend', 'N/A')}")
        print(f"   Modèle utilisé: {demand_result.get('model_used', 'N/A')}")
    except Exception as e:
        print(f"   ⚠️ Erreur: {e}")
    
    # Test prédiction bestseller
    print("\n🌟 Test Prédiction Bestseller...")
    try:
        bs_result = ml_service.predict_bestseller(test_product)
        print(f"   Est bestseller: {bs_result.get('is_bestseller', 'N/A')}")
        print(f"   Probabilité: {bs_result.get('probability', 0)*100:.1f}%")
        print(f"   Modèle utilisé: {bs_result.get('model_used', 'N/A')}")
    except Exception as e:
        print(f"   ⚠️ Erreur: {e}")
    
    # Test recherche sémantique
    print("\n🔍 Test Recherche Sémantique...")
    try:
        search_result = ml_service.semantic_search("wireless headphones", top_k=3)
        print(f"   Requête: {search_result.get('query', 'N/A')}")
        print(f"   Résultats: {search_result.get('total_found', 0)}")
        print(f"   Index utilisé: {search_result.get('index_used', 'N/A')}")
    except Exception as e:
        print(f"   ⚠️ Erreur: {e}")
    
    # Test analyse complète
    print("\n📊 Test Analyse Complète...")
    try:
        analysis = ml_service.analyze_product(test_product)
        print(f"   Product ID: {analysis.get('product_id', 'N/A')}")
        
        if analysis.get('price_prediction'):
            print(f"   Prix prédit: ${analysis['price_prediction'].get('predicted_price', 0):.2f}")
        
        if analysis.get('demand_prediction'):
            print(f"   Demande: {analysis['demand_prediction'].get('predicted_demand', 0):.1f}")
        
        if analysis.get('bestseller_prediction'):
            print(f"   Bestseller prob: {analysis['bestseller_prediction'].get('probability', 0)*100:.1f}%")
            
    except Exception as e:
        print(f"   ⚠️ Erreur: {e}")
    
    print("\n" + "=" * 60)
    print("✅ TESTS TERMINÉS")
    print("=" * 60)
    
    return True


def test_api_endpoints():
    """Test des endpoints API"""
    print("\n\n" + "=" * 60)
    print("🌐 TEST DES ENDPOINTS API")
    print("=" * 60)
    
    try:
        from fastapi.testclient import TestClient
        from app.main import app
        
        client = TestClient(app)
        
        # Test health
        print("\n🏥 Test /api/ml/v2/health...")
        response = client.get("/api/ml/v2/health")
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   ML Status: {data.get('status', 'N/A')}")
            print(f"   Models loaded: {data.get('models_loaded', 0)}")
        
        # Test models status
        print("\n📊 Test /api/ml/v2/models/status...")
        response = client.get("/api/ml/v2/models/status")
        print(f"   Status: {response.status_code}")
        
        # Test price prediction
        print("\n💰 Test /api/ml/v2/predict/price...")
        response = client.post("/api/ml/v2/predict/price", json={
            "price": 49.99,
            "rating": 4.2,
            "reviews": 150
        })
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Predicted price: ${data.get('predicted_price', 0):.2f}")
        
        # Test search
        print("\n🔍 Test /api/ml/v2/search...")
        response = client.get("/api/ml/v2/search?query=wireless&top_k=3")
        print(f"   Status: {response.status_code}")
        
        print("\n✅ Tests API terminés")
        
    except ImportError as e:
        print(f"⚠️ TestClient non disponible: {e}")
    except Exception as e:
        print(f"⚠️ Erreur tests API: {e}")


if __name__ == "__main__":
    print("\n" + "🚀" * 30 + "\n")
    
    # Test service
    success = test_ml_service_v2()
    
    # Test API (optionnel)
    if success and "--api" in sys.argv:
        test_api_endpoints()
    
    print("\n" + "🚀" * 30 + "\n")
