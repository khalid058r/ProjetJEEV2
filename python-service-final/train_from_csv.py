"""
Script pour entraîner les modèles ML depuis un CSV Amazon
Usage: python train_from_csv.py amazon_dataset.csv
"""
import sys
import pandas as pd
import numpy as np
from pathlib import Path

# Ajoute le chemin du projet
sys.path.insert(0, str(Path(__file__).parent))

def load_and_prepare_csv(csv_path: str):
    """Charge et prépare le CSV Amazon"""
    print(f"📂 Chargement de {csv_path}...")
    
    df = pd.read_csv(csv_path)
    print(f"✅ {len(df)} produits chargés")
    print(f"📋 Colonnes: {list(df.columns)}")
    
    # Mapping des colonnes Amazon vers notre format
    products = []
    
    for idx, row in df.iterrows():
        try:
            # Nettoie le prix
            price = row.get('Price', 0)
            if isinstance(price, str):
                price = float(price.replace('$', '').replace(',', '').strip())
            
            # Nettoie les reviews
            reviews = row.get('Reviews Count', 0)
            if isinstance(reviews, str):
                reviews = int(reviews.replace(',', '').strip())
            
            product = {
                'id': idx + 1,
                'asin': str(row.get('ASIN', '')),
                'title': str(row.get('Product_Name', ''))[:200],
                'price': float(price) if pd.notna(price) else 0,
                'rating': float(row.get('Rating', 0)) if pd.notna(row.get('Rating')) else 0,
                'review_count': int(reviews) if pd.notna(reviews) else 0,
                'rank': int(row.get('Rank', 9999)) if pd.notna(row.get('Rank')) else 9999,
                'category': str(row.get('Category', 'Unknown')),
                'stock': np.random.randint(10, 200),  # Stock simulé
                'image_url': str(row.get('Image_URL', ''))
            }
            products.append(product)
        except Exception as e:
            print(f"⚠️ Erreur ligne {idx}: {e}")
            continue
    
    print(f"✅ {len(products)} produits préparés")
    return products


def train_models(products: list):
    """Entraîne tous les modèles ML"""
    from app.services.ml_service import ml_service
    
    print("\n" + "="*50)
    print("🎓 ENTRAÎNEMENT DES MODÈLES ML")
    print("="*50)
    
    results = ml_service.train_all(products)
    
    print("\n📊 RÉSULTATS:")
    print("-"*50)
    
    # Modèle de rang
    if 'rank' in results:
        r = results['rank']
        if r.get('success'):
            metrics = r.get('metrics', {})
            print(f"✅ Modèle RANG:")
            print(f"   - R² Score: {metrics.get('r2', 0):.3f}")
            print(f"   - RMSE: {metrics.get('rmse', 0):.1f}")
            print(f"   - Samples: {metrics.get('samples', 0)}")
        else:
            print(f"❌ Modèle RANG: {r.get('error')}")
    
    # Modèle de prix
    if 'price' in results:
        r = results['price']
        if r.get('success'):
            print(f"✅ Modèle PRIX:")
            print(f"   - Catégories: {r.get('categories', 0)}")
        else:
            print(f"❌ Modèle PRIX: {r.get('error')}")
    
    # Modèle bestseller
    if 'bestseller' in results:
        r = results['bestseller']
        if r.get('success'):
            print(f"✅ Modèle BESTSELLER:")
            print(f"   - Best-sellers détectés: {r.get('bestsellers_count', 0)}")
        else:
            print(f"❌ Modèle BESTSELLER: {r.get('error')}")
    
    print("-"*50)
    print("💾 Modèles sauvegardés dans data/models/")
    
    return results


def index_for_search(products: list):
    """Indexe les produits pour la recherche sémantique"""
    try:
        from app.services.search_service import search_service
        
        print("\n" + "="*50)
        print("🔍 INDEXATION POUR RECHERCHE SÉMANTIQUE")
        print("="*50)
        
        success = search_service.index_products(products)
        
        if success:
            print(f"✅ {len(products)} produits indexés")
            print(f"📊 Modèle: {search_service.model}")
        else:
            print("❌ Erreur d'indexation")
        
        return success
    except Exception as e:
        print(f"⚠️ Indexation ignorée: {e}")
        return False


def test_predictions(products: list):
    """Teste les prédictions sur quelques produits"""
    from app.services.ml_service import ml_service
    from app.models.schemas import PredictRankRequest, RecommendPriceRequest
    
    print("\n" + "="*50)
    print("🧪 TEST DES PRÉDICTIONS")
    print("="*50)
    
    # Teste sur 3 produits
    for p in products[:3]:
        print(f"\n📦 {p['title'][:50]}...")
        print(f"   Prix actuel: {p['price']}$ | Rang: {p['rank']} | Rating: {p['rating']}")
        
        # Prédiction rang
        try:
            rank_req = PredictRankRequest(
                product_id=p['id'],
                current_rank=p['rank'],
                price=p['price'],
                rating=p['rating'],
                review_count=p['review_count'],
                category=p['category']
            )
            rank_pred = ml_service.predict_rank(rank_req)
            print(f"   ➜ Rang prédit: {rank_pred.predicted_rank} ({rank_pred.trend.value})")
        except Exception as e:
            print(f"   ⚠️ Erreur prédiction rang: {e}")
        
        # Recommandation prix
        try:
            price_req = RecommendPriceRequest(
                product_id=p['id'],
                current_price=p['price'],
                category=p['category'],
                rating=p['rating'],
                review_count=p['review_count'],
                rank=p['rank']
            )
            price_pred = ml_service.recommend_price(price_req)
            print(f"   ➜ Prix recommandé: {price_pred.recommended_price}$ ({price_pred.price_change_percent:+.1f}%)")
        except Exception as e:
            print(f"   ⚠️ Erreur recommandation prix: {e}")


def main():
    # Chemin du CSV
    if len(sys.argv) > 1:
        csv_path = sys.argv[1]
    else:
        csv_path = "amazon_dataset.csv"
    
    if not Path(csv_path).exists():
        print(f"❌ Fichier non trouvé: {csv_path}")
        print("Usage: python train_from_csv.py chemin/vers/amazon_dataset.csv")
        sys.exit(1)
    
    print("="*60)
    print("🚀 ENTRAÎNEMENT ML DEPUIS CSV AMAZON")
    print("="*60)
    
    # 1. Charger les données
    products = load_and_prepare_csv(csv_path)
    
    # 2. Entraîner les modèles
    train_models(products)
    
    # 3. Indexer pour la recherche (optionnel)
    try:
        index_for_search(products)
    except:
        print("⚠️ Indexation sémantique ignorée (installez sentence-transformers)")
    
    # 4. Tester les prédictions
    test_predictions(products)
    
    print("\n" + "="*60)
    print("✅ ENTRAÎNEMENT TERMINÉ!")
    print("="*60)
    print("\n💡 Démarrez le service avec: python run.py")
    print("📖 Documentation: http://localhost:5000/docs")


if __name__ == "__main__":
    main()
