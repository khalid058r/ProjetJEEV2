"""
Service de Recommandations Avancées
Recommandations personnalisées, cross-selling, up-selling
"""
import logging
from typing import Dict, Any, List, Optional, Tuple
import numpy as np
from collections import defaultdict

from app.config import settings

logger = logging.getLogger(__name__)


class RecommendationService:
    """
    Service de recommandations e-commerce avancées
    
    Fonctionnalités:
    - Produits similaires (content-based)
    - Cross-selling (achats fréquents ensemble)
    - Up-selling (alternatives premium)
    - Recommendations par catégorie
    - Recommendations personnalisées
    """
    
    def __init__(self):
        self.product_index: Dict[int, Dict] = {}
        self.category_products: Dict[str, List[Dict]] = defaultdict(list)
        self.price_ranges: Dict[str, Dict] = {}
    
    def index_products(self, products: List[Dict[str, Any]]) -> None:
        """Indexe les produits pour les recommandations"""
        self.product_index = {p.get('id', i): p for i, p in enumerate(products)}
        self.category_products.clear()
        
        for p in products:
            cat = p.get('category') or p.get('category_name', 'Unknown')
            self.category_products[cat].append(p)
        
        # Calcul des statistiques par catégorie
        for cat, prods in self.category_products.items():
            prices = [p.get('price', 0) for p in prods if p.get('price', 0) > 0]
            if prices:
                self.price_ranges[cat] = {
                    'min': min(prices),
                    'max': max(prices),
                    'median': np.median(prices),
                    'q1': np.percentile(prices, 25),
                    'q3': np.percentile(prices, 75)
                }
        
        logger.info(f"✅ {len(products)} produits indexés pour recommandations")
    
    def get_similar_products(
        self, 
        product_id: int, 
        limit: int = 10,
        same_category: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Trouve des produits similaires basés sur:
        - Catégorie
        - Prix similaire (+/- 30%)
        - Rating comparable
        """
        product = self.product_index.get(product_id)
        if not product:
            return []
        
        category = product.get('category') or product.get('category_name', 'Unknown')
        price = product.get('price', 0) or 0
        rating = product.get('rating', 0) or 0
        
        candidates = []
        
        # Cherche dans la même catégorie ou toutes
        if same_category and category in self.category_products:
            pool = self.category_products[category]
        else:
            pool = list(self.product_index.values())
        
        for p in pool:
            if p.get('id') == product_id:
                continue
            
            p_price = p.get('price', 0) or 0
            p_rating = p.get('rating', 0) or 0
            
            # Score de similarité
            price_diff = abs(p_price - price) / max(price, 1)
            rating_diff = abs(p_rating - rating)
            
            # Plus le score est bas, plus c'est similaire
            similarity_score = (price_diff * 0.4) + (rating_diff * 0.1) 
            
            # Bonus si même catégorie
            if p.get('category') == category:
                similarity_score -= 0.2
            
            # Bonus si bon rating
            if p_rating >= 4.0:
                similarity_score -= 0.1
            
            candidates.append({
                'product': p,
                'score': similarity_score,
                'reason': self._get_similarity_reason(product, p)
            })
        
        # Trie par score croissant (plus similaire en premier)
        candidates.sort(key=lambda x: x['score'])
        
        return [{
            'id': c['product'].get('id'),
            'title': c['product'].get('title', '')[:100],
            'price': c['product'].get('price', 0),
            'rating': c['product'].get('rating', 0),
            'category': c['product'].get('category', ''),
            'similarity_score': round(1 - c['score'], 3),
            'reason': c['reason']
        } for c in candidates[:limit]]
    
    def get_upsell_products(
        self, 
        product_id: int, 
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Trouve des produits premium (up-sell)
        - Prix plus élevé (20-100% plus cher)
        - Meilleur rating
        - Meilleur rang
        """
        product = self.product_index.get(product_id)
        if not product:
            return []
        
        category = product.get('category') or product.get('category_name', 'Unknown')
        price = product.get('price', 0) or 0
        rating = product.get('rating', 0) or 0
        
        candidates = []
        pool = self.category_products.get(category, list(self.product_index.values()))
        
        for p in pool:
            if p.get('id') == product_id:
                continue
            
            p_price = p.get('price', 0) or 0
            p_rating = p.get('rating', 0) or 0
            p_rank = p.get('rank', 99999) or 99999
            
            # Up-sell: prix plus élevé mais meilleur produit
            if p_price > price * 1.2 and p_price < price * 3:
                if p_rating >= rating or p_rank < product.get('rank', 99999):
                    value_score = (p_rating / max(rating, 1)) * (price / max(p_price, 1))
                    
                    candidates.append({
                        'product': p,
                        'price_increase': round((p_price - price) / max(price, 1) * 100, 1),
                        'value_score': value_score,
                        'reason': self._get_upsell_reason(product, p)
                    })
        
        # Trie par score de valeur décroissant
        candidates.sort(key=lambda x: x['value_score'], reverse=True)
        
        return [{
            'id': c['product'].get('id'),
            'title': c['product'].get('title', '')[:100],
            'price': c['product'].get('price', 0),
            'rating': c['product'].get('rating', 0),
            'price_increase_percent': c['price_increase'],
            'reason': c['reason']
        } for c in candidates[:limit]]
    
    def get_crosssell_products(
        self, 
        product_id: int, 
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Trouve des produits complémentaires (cross-sell)
        - Catégories différentes mais complémentaires
        - Prix similaires ou inférieurs
        """
        product = self.product_index.get(product_id)
        if not product:
            return []
        
        current_cat = product.get('category') or product.get('category_name', 'Unknown')
        price = product.get('price', 0) or 0
        
        # Mapping catégories complémentaires (exemple simplifié)
        complementary_categories = self._get_complementary_categories(current_cat)
        
        candidates = []
        
        for cat in complementary_categories:
            if cat in self.category_products:
                for p in self.category_products[cat][:20]:  # Limite par catégorie
                    p_price = p.get('price', 0) or 0
                    p_rating = p.get('rating', 0) or 0
                    
                    # Cross-sell: prix raisonnable, bon rating
                    if p_price < price * 1.5 and p_rating >= 3.5:
                        candidates.append({
                            'product': p,
                            'category': cat,
                            'rating': p_rating,
                            'reason': f"Complète votre achat dans {cat}"
                        })
        
        # Trie par rating
        candidates.sort(key=lambda x: x['rating'], reverse=True)
        
        return [{
            'id': c['product'].get('id'),
            'title': c['product'].get('title', '')[:100],
            'price': c['product'].get('price', 0),
            'rating': c['product'].get('rating', 0),
            'category': c['category'],
            'reason': c['reason']
        } for c in candidates[:limit]]
    
    def get_category_recommendations(
        self, 
        category: str, 
        limit: int = 10,
        sort_by: str = 'rating'  # rating, price, rank
    ) -> List[Dict[str, Any]]:
        """Recommandations par catégorie"""
        products = self.category_products.get(category, [])
        
        if sort_by == 'rating':
            products = sorted(products, key=lambda x: x.get('rating', 0), reverse=True)
        elif sort_by == 'price':
            products = sorted(products, key=lambda x: x.get('price', 0))
        elif sort_by == 'rank':
            products = sorted(products, key=lambda x: x.get('rank', 99999))
        
        return [{
            'id': p.get('id'),
            'title': p.get('title', '')[:100],
            'price': p.get('price', 0),
            'rating': p.get('rating', 0),
            'rank': p.get('rank', 0)
        } for p in products[:limit]]
    
    def get_trending_products(
        self, 
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Produits tendance basés sur:
        - Bon rang
        - Beaucoup d'avis
        - Bon rating
        """
        products = list(self.product_index.values())
        
        for p in products:
            rank = p.get('rank', 99999) or 99999
            reviews = p.get('review_count', 0) or 0
            rating = p.get('rating', 0) or 0
            
            # Score trending (plus c'est haut, mieux c'est)
            # Normalise le rang inversé + reviews + rating
            p['_trending_score'] = (
                (1 / np.log1p(rank)) * 1000 +
                np.log1p(reviews) * 2 +
                rating * 5
            )
        
        trending = sorted(products, key=lambda x: x.get('_trending_score', 0), reverse=True)
        
        return [{
            'id': p.get('id'),
            'title': p.get('title', '')[:100],
            'price': p.get('price', 0),
            'rating': p.get('rating', 0),
            'rank': p.get('rank', 0),
            'review_count': p.get('review_count', 0),
            'trending_score': round(p.get('_trending_score', 0), 2)
        } for p in trending[:limit]]
    
    def get_deals(
        self, 
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Trouve les meilleures affaires:
        - Bon rating
        - Prix inférieur à la médiane de la catégorie
        - Bon rang
        """
        deals = []
        
        for p in self.product_index.values():
            cat = p.get('category') or p.get('category_name', 'Unknown')
            price = p.get('price', 0) or 0
            rating = p.get('rating', 0) or 0
            
            cat_stats = self.price_ranges.get(cat, {})
            median_price = cat_stats.get('median', price)
            
            # C'est une bonne affaire si:
            # - Prix < médiane de la catégorie
            # - Rating >= 4.0
            if price > 0 and price < median_price * 0.8 and rating >= 4.0:
                savings = round((1 - price / median_price) * 100, 1)
                deals.append({
                    'id': p.get('id'),
                    'title': p.get('title', '')[:100],
                    'price': price,
                    'category_median': round(median_price, 2),
                    'savings_percent': savings,
                    'rating': rating,
                    'deal_score': savings * rating / 5
                })
        
        deals.sort(key=lambda x: x['deal_score'], reverse=True)
        return deals[:limit]
    
    def _get_similarity_reason(self, p1: Dict, p2: Dict) -> str:
        """Génère une raison de similarité"""
        reasons = []
        
        if p1.get('category') == p2.get('category'):
            reasons.append("même catégorie")
        
        price_diff = abs(p1.get('price', 0) - p2.get('price', 0))
        if price_diff < p1.get('price', 1) * 0.2:
            reasons.append("prix similaire")
        
        if abs(p1.get('rating', 0) - p2.get('rating', 0)) < 0.5:
            reasons.append("rating comparable")
        
        return ", ".join(reasons) if reasons else "produit alternatif"
    
    def _get_upsell_reason(self, p1: Dict, p2: Dict) -> str:
        """Génère une raison d'up-sell"""
        reasons = []
        
        if p2.get('rating', 0) > p1.get('rating', 0):
            reasons.append("meilleur rating")
        
        if p2.get('rank', 99999) < p1.get('rank', 99999):
            reasons.append("meilleur classement")
        
        if p2.get('review_count', 0) > p1.get('review_count', 0) * 1.5:
            reasons.append("plus populaire")
        
        return ", ".join(reasons) if reasons else "version premium"
    
    def _get_complementary_categories(self, category: str) -> List[str]:
        """Retourne les catégories complémentaires"""
        # Mapping simplifié - à enrichir selon votre catalogue
        complements = {
            'Electronics': ['Accessories', 'Cables', 'Cases'],
            'Computers': ['Accessories', 'Software', 'Peripherals'],
            'Phones': ['Cases', 'Chargers', 'Accessories'],
            'Clothing': ['Accessories', 'Shoes', 'Jewelry'],
            'Sports': ['Fitness', 'Outdoors', 'Clothing'],
            'Home': ['Kitchen', 'Garden', 'Decor'],
            'Books': ['Kindle', 'Audiobooks', 'Stationery'],
        }
        
        # Trouve la catégorie la plus proche
        cat_lower = category.lower()
        for key, values in complements.items():
            if key.lower() in cat_lower or cat_lower in key.lower():
                return values
        
        # Retourne des catégories différentes
        all_cats = list(self.category_products.keys())
        return [c for c in all_cats if c != category][:5]
    
    def get_comprehensive_recommendations(
        self, 
        product_id: int
    ) -> Dict[str, Any]:
        """
        Retourne toutes les recommandations pour un produit
        """
        product = self.product_index.get(product_id)
        if not product:
            return {"error": "Produit non trouvé"}
        
        return {
            "product": {
                "id": product_id,
                "title": product.get('title', '')[:100],
                "price": product.get('price', 0),
                "category": product.get('category', '')
            },
            "similar_products": self.get_similar_products(product_id, limit=5),
            "upsell_options": self.get_upsell_products(product_id, limit=3),
            "crosssell_suggestions": self.get_crosssell_products(product_id, limit=3),
            "trending_in_category": self.get_category_recommendations(
                product.get('category', ''), limit=5, sort_by='rank'
            )
        }


# Instance singleton
recommendation_service = RecommendationService()
