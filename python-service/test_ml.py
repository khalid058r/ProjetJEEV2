from app.services.predictor import PredictorService
from app.models.schemas import PredictRankRequest, RecommendPriceRequest

print("=" * 60)
print("🔮 TEST ML PREDICTOR SERVICE")
print("=" * 60)

predictor = PredictorService()

# Test 1: Prédiction Rank
print("\n📈 Test 1: Prédiction Rank")
print("-" * 60)
request = PredictRankRequest(
    product_id=1,
    current_rank=100,
    price=899.99,
    rating=4.5,
    review_count=1000,
    category="Electronics"
)

result = predictor.predict_rank(request)
print(f"Produit ID:      {result.product_id}")
print(f"Rank actuel:     #{result.current_rank}")
print(f"Rank prédit:     #{result.predicted_rank}")
print(f"Tendance:        {result.trend}")
print(f"Confiance:       {result.confidence * 100:.0f}%")
print(f"Recommandation:  {result.recommendation}")
print(f"Facteurs:")
for key, value in result.factors.items():
    print(f"  - {key}: {value}")

# Test 2: Recommandation Prix
print("\n💰 Test 2: Recommandation Prix")
print("-" * 60)
request2 = RecommendPriceRequest(
    product_id=1,
    current_price=899.99,
    category="Electronics",
    rank=1500,
    rating=4.2,
    review_count=500
)

result2 = predictor.recommend_price(request2)
print(f"Prix actuel:       {result2.current_price:.2f}€")
print(f"Prix recommandé:   {result2.recommended_price:.2f}€")
print(f"Changement:        {result2.price_change_percent:+.1f}%")
print(f"Impact ventes:     {result2.expected_sales_increase:+.0f}%")
print(f"Prix concurrent:   {result2.competitor_avg_price:.2f}€")
print(f"Raison:            {result2.reasoning}")

# Test 3: Best-Sellers Potentiels
print("\n🌟 Test 3: Best-Sellers Potentiels")
print("-" * 60)
products = [
    {"id": 1, "title": "iPhone 15", "rating": 4.8, "review_count": 500, "rank": 150, "price": 1199.99},
    {"id": 2, "title": "MacBook", "rating": 4.7, "review_count": 800, "rank": 250, "price": 1999.99},
    {"id": 3, "title": "AirPods", "rating": 4.6, "review_count": 1200, "rank": 80, "price": 249.99},
]

result3 = predictor.find_potential_bestsellers(products, top_n=10)
print(f"Produits analysés: {result3.criteria['total_analyzed']}")
print(f"Candidats trouvés: {result3.count}")
print("\nTop candidats:")
for p in result3.products:
    print(f"  • {p.title}")
    print(f"    Rank: #{p.current_rank} | Rating: {p.rating} | Score: {p.potential_score}")
    print(f"    Raisons: {', '.join(p.reasons)}")

print("\n✅ Tous les tests ML OK!")
