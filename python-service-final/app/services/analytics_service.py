"""
Service d'Analytics Avancées
Calculs de KPIs, Tendances, Prédictions
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import numpy as np

from app.config import settings

logger = logging.getLogger(__name__)

# Import conditionnel
try:
    import pandas as pd
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False


class AnalyticsService:
    """
    Service d'analytics avancées pour l'e-commerce
    
    Fonctionnalités:
    - Calcul de KPIs
    - Analyse de tendances
    - Prédiction de ventes
    - Segmentation produits
    - Détection d'anomalies
    """
    
    def __init__(self):
        self.cache = {}
        self.cache_ttl = 300  # 5 minutes
    
    # ==================== KPIs ====================
    
    def calculate_product_kpis(self, products: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Calcule les KPIs produits
        
        Args:
            products: Liste des produits avec leurs attributs
        
        Returns:
            Dictionnaire de KPIs
        """
        if not products:
            return self._empty_kpis()
        
        prices = [p.get('price', 0) or 0 for p in products]
        ratings = [p.get('rating', 0) or 0 for p in products]
        stocks = [p.get('stock', 0) or 0 for p in products]
        ranks = [p.get('rank', 0) or 0 for p in products if p.get('rank')]
        
        total_products = len(products)
        in_stock = sum(1 for s in stocks if s > 0)
        out_of_stock = sum(1 for s in stocks if s == 0)
        low_stock = sum(1 for s in stocks if 0 < s <= 10)
        
        # Valeur d'inventaire
        inventory_value = sum(p.get('price', 0) * p.get('stock', 0) for p in products)
        
        # Top performers
        sorted_by_rating = sorted(products, key=lambda x: x.get('rating', 0) or 0, reverse=True)
        sorted_by_rank = sorted([p for p in products if p.get('rank')], key=lambda x: x.get('rank', 99999))
        
        return {
            'total_products': total_products,
            'in_stock': in_stock,
            'out_of_stock': out_of_stock,
            'low_stock': low_stock,
            'stock_rate': round(in_stock / total_products * 100, 1) if total_products > 0 else 0,
            
            'price_stats': {
                'average': round(np.mean(prices), 2) if prices else 0,
                'median': round(np.median(prices), 2) if prices else 0,
                'min': round(min(prices), 2) if prices else 0,
                'max': round(max(prices), 2) if prices else 0,
                'std': round(np.std(prices), 2) if prices else 0
            },
            
            'rating_stats': {
                'average': round(np.mean(ratings), 2) if ratings else 0,
                'excellent': sum(1 for r in ratings if r >= 4.5),
                'good': sum(1 for r in ratings if 4.0 <= r < 4.5),
                'moderate': sum(1 for r in ratings if 3.0 <= r < 4.0),
                'poor': sum(1 for r in ratings if r < 3.0 and r > 0)
            },
            
            'rank_stats': {
                'average': round(np.mean(ranks), 0) if ranks else 0,
                'top_100': sum(1 for r in ranks if r <= 100),
                'top_1000': sum(1 for r in ranks if r <= 1000),
                'low_performers': sum(1 for r in ranks if r > 10000)
            },
            
            'inventory_value': round(inventory_value, 2),
            
            'top_rated': [
                {'id': p.get('id'), 'title': p.get('title', '')[:50], 'rating': p.get('rating')}
                for p in sorted_by_rating[:5]
            ],
            
            'top_ranked': [
                {'id': p.get('id'), 'title': p.get('title', '')[:50], 'rank': p.get('rank')}
                for p in sorted_by_rank[:5]
            ]
        }
    
    def calculate_sales_kpis(self, sales: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Calcule les KPIs de ventes
        """
        if not sales:
            return {
                'total_sales': 0,
                'total_revenue': 0,
                'average_order_value': 0,
                'total_items_sold': 0
            }
        
        total_sales = len(sales)
        total_revenue = sum(s.get('totalAmount', 0) or 0 for s in sales)
        total_items = sum(s.get('quantity', 1) or 1 for s in sales)
        
        return {
            'total_sales': total_sales,
            'total_revenue': round(total_revenue, 2),
            'average_order_value': round(total_revenue / total_sales, 2) if total_sales > 0 else 0,
            'total_items_sold': total_items,
            'items_per_order': round(total_items / total_sales, 2) if total_sales > 0 else 0
        }
    
    # ==================== TENDANCES ====================
    
    def analyze_trends(self, products: List[Dict[str, Any]], 
                       historical_data: Optional[List[Dict]] = None) -> Dict[str, Any]:
        """
        Analyse les tendances des produits
        
        Args:
            products: Produits actuels
            historical_data: Données historiques (optionnel)
        """
        if not products:
            return {'error': 'Pas de produits à analyser'}
        
        # Analyse par catégorie
        category_analysis = {}
        for p in products:
            cat = p.get('category') or p.get('category_name', 'Unknown')
            if cat not in category_analysis:
                category_analysis[cat] = {
                    'count': 0,
                    'total_revenue_potential': 0,
                    'avg_rating': [],
                    'avg_price': [],
                    'in_stock': 0
                }
            
            category_analysis[cat]['count'] += 1
            category_analysis[cat]['total_revenue_potential'] += (p.get('price', 0) or 0) * (p.get('stock', 0) or 0)
            if p.get('rating'):
                category_analysis[cat]['avg_rating'].append(p.get('rating'))
            category_analysis[cat]['avg_price'].append(p.get('price', 0) or 0)
            if (p.get('stock', 0) or 0) > 0:
                category_analysis[cat]['in_stock'] += 1
        
        # Calcul des moyennes
        for cat, data in category_analysis.items():
            data['avg_rating'] = round(np.mean(data['avg_rating']), 2) if data['avg_rating'] else 0
            data['avg_price'] = round(np.mean(data['avg_price']), 2) if data['avg_price'] else 0
            data['stock_rate'] = round(data['in_stock'] / data['count'] * 100, 1) if data['count'] > 0 else 0
        
        # Tri par performance
        sorted_categories = sorted(
            category_analysis.items(),
            key=lambda x: x[1]['total_revenue_potential'],
            reverse=True
        )
        
        # Identification des tendances
        trends = {
            'top_categories': [
                {
                    'name': cat,
                    'products': data['count'],
                    'avg_rating': data['avg_rating'],
                    'revenue_potential': round(data['total_revenue_potential'], 2)
                }
                for cat, data in sorted_categories[:5]
            ],
            'underperforming_categories': [
                {
                    'name': cat,
                    'products': data['count'],
                    'avg_rating': data['avg_rating'],
                    'stock_rate': data['stock_rate']
                }
                for cat, data in sorted_categories[-3:]
                if data['avg_rating'] < 4.0 or data['stock_rate'] < 50
            ],
            'insights': []
        }
        
        # Génère des insights
        total_products = len(products)
        out_of_stock = sum(1 for p in products if (p.get('stock', 0) or 0) == 0)
        low_rated = sum(1 for p in products if (p.get('rating', 0) or 0) < 3.5 and (p.get('rating', 0) or 0) > 0)
        
        if out_of_stock > total_products * 0.1:
            trends['insights'].append({
                'type': 'warning',
                'message': f"⚠️ {out_of_stock} produits ({round(out_of_stock/total_products*100, 1)}%) en rupture de stock"
            })
        
        if low_rated > total_products * 0.1:
            trends['insights'].append({
                'type': 'warning',
                'message': f"⚠️ {low_rated} produits avec notes faibles (<3.5)"
            })
        
        if sorted_categories:
            best_cat = sorted_categories[0]
            trends['insights'].append({
                'type': 'success',
                'message': f"✅ Meilleure catégorie: {best_cat[0]} ({best_cat[1]['count']} produits)"
            })
        
        return trends
    
    # ==================== PRÉDICTIONS ====================
    
    def predict_demand(self, products: List[Dict[str, Any]], 
                       days_ahead: int = 30) -> List[Dict[str, Any]]:
        """
        Prédit la demande future des produits
        
        Utilise des heuristiques basées sur:
        - Rating
        - Nombre d'avis
        - Rang actuel
        - Stock disponible
        """
        predictions = []
        
        for p in products:
            rating = p.get('rating', 0) or 0
            reviews = p.get('review_count', 0) or 0
            rank = p.get('rank', 10000) or 10000
            stock = p.get('stock', 0) or 0
            price = p.get('price', 0) or 0
            
            # Score de demande basé sur les métriques
            demand_score = 0
            
            # Impact du rating (0-30 points)
            if rating >= 4.5:
                demand_score += 30
            elif rating >= 4.0:
                demand_score += 20
            elif rating >= 3.5:
                demand_score += 10
            
            # Impact des avis (0-30 points)
            if reviews >= 1000:
                demand_score += 30
            elif reviews >= 500:
                demand_score += 25
            elif reviews >= 100:
                demand_score += 15
            elif reviews >= 50:
                demand_score += 10
            
            # Impact du rang (0-25 points)
            if rank <= 100:
                demand_score += 25
            elif rank <= 500:
                demand_score += 20
            elif rank <= 1000:
                demand_score += 15
            elif rank <= 5000:
                demand_score += 10
            
            # Impact du prix (0-15 points) - prix compétitifs
            if price > 0:
                if price < 50:
                    demand_score += 15
                elif price < 100:
                    demand_score += 10
                elif price < 200:
                    demand_score += 5
            
            # Prédiction de ventes par jour
            daily_demand = demand_score / 10  # 0-10 unités/jour
            predicted_sales = round(daily_demand * days_ahead)
            
            # Stock suffisant?
            days_until_stockout = round(stock / daily_demand) if daily_demand > 0 else float('inf')
            restock_needed = max(0, predicted_sales - stock)
            
            predictions.append({
                'product_id': p.get('id'),
                'title': p.get('title', '')[:60],
                'current_stock': stock,
                'demand_score': demand_score,
                'predicted_daily_demand': round(daily_demand, 2),
                'predicted_sales_30d': predicted_sales,
                'days_until_stockout': min(days_until_stockout, 999),
                'restock_needed': restock_needed,
                'restock_urgency': 'HIGH' if days_until_stockout < 7 else 'MEDIUM' if days_until_stockout < 30 else 'LOW'
            })
        
        # Tri par urgence de réapprovisionnement
        predictions.sort(key=lambda x: x['days_until_stockout'])
        
        return predictions
    
    # ==================== SEGMENTATION ====================
    
    def segment_products(self, products: List[Dict[str, Any]]) -> Dict[str, List[Dict]]:
        """
        Segmente les produits en catégories stratégiques
        
        Segments:
        - Stars: Haute performance, forte demande
        - Cash Cows: Revenus stables, demande modérée
        - Question Marks: Potentiel incertain
        - Dogs: Faible performance
        """
        segments = {
            'stars': [],
            'cash_cows': [],
            'question_marks': [],
            'dogs': []
        }
        
        for p in products:
            rating = p.get('rating', 0) or 0
            reviews = p.get('review_count', 0) or 0
            rank = p.get('rank', 99999) or 99999
            stock = p.get('stock', 0) or 0
            price = p.get('price', 0) or 0
            
            product_info = {
                'id': p.get('id'),
                'title': p.get('title', '')[:50],
                'price': price,
                'rating': rating,
                'rank': rank,
                'stock': stock
            }
            
            # Classification
            if rating >= 4.5 and rank <= 1000 and reviews >= 100:
                segments['stars'].append(product_info)
            elif rating >= 4.0 and rank <= 5000 and stock > 0:
                segments['cash_cows'].append(product_info)
            elif rating >= 3.5 and rank > 5000 and reviews < 50:
                segments['question_marks'].append(product_info)
            else:
                segments['dogs'].append(product_info)
        
        # Statistiques par segment
        summary = {
            'segments': {
                'stars': {
                    'count': len(segments['stars']),
                    'description': 'Haute performance, forte demande',
                    'action': 'Maintenir et promouvoir',
                    'products': segments['stars'][:10]
                },
                'cash_cows': {
                    'count': len(segments['cash_cows']),
                    'description': 'Revenus stables',
                    'action': 'Optimiser les marges',
                    'products': segments['cash_cows'][:10]
                },
                'question_marks': {
                    'count': len(segments['question_marks']),
                    'description': 'Potentiel incertain',
                    'action': 'Investir ou abandonner',
                    'products': segments['question_marks'][:10]
                },
                'dogs': {
                    'count': len(segments['dogs']),
                    'description': 'Faible performance',
                    'action': 'Liquider ou repositionner',
                    'products': segments['dogs'][:10]
                }
            },
            'total_analyzed': len(products)
        }
        
        return summary
    
    # ==================== ANOMALIES ====================
    
    def detect_anomalies(self, products: List[Dict[str, Any]]) -> Dict[str, List[Dict]]:
        """
        Détecte les anomalies dans les données produits
        
        Types d'anomalies:
        - Prix anormaux
        - Stock critique
        - Rating suspect
        - Incohérences
        """
        anomalies = {
            'price_anomalies': [],
            'stock_critical': [],
            'rating_suspicious': [],
            'data_inconsistencies': []
        }
        
        # Calcul des statistiques pour la détection
        prices = [p.get('price', 0) or 0 for p in products if p.get('price')]
        if prices:
            price_mean = np.mean(prices)
            price_std = np.std(prices)
            price_upper = price_mean + 3 * price_std
            price_lower = max(0, price_mean - 3 * price_std)
        else:
            price_mean = price_std = price_upper = price_lower = 0
        
        for p in products:
            product_id = p.get('id')
            title = p.get('title', '')[:50]
            price = p.get('price', 0) or 0
            rating = p.get('rating', 0) or 0
            reviews = p.get('review_count', 0) or 0
            stock = p.get('stock', 0) or 0
            rank = p.get('rank', 0) or 0
            
            # Prix anormaux
            if price > price_upper or (price < price_lower and price > 0):
                anomalies['price_anomalies'].append({
                    'product_id': product_id,
                    'title': title,
                    'price': price,
                    'expected_range': f"{round(price_lower, 2)} - {round(price_upper, 2)}",
                    'severity': 'HIGH' if price > price_upper * 1.5 else 'MEDIUM'
                })
            
            # Stock critique
            if stock == 0 and rank <= 1000:  # Produit populaire en rupture
                anomalies['stock_critical'].append({
                    'product_id': product_id,
                    'title': title,
                    'rank': rank,
                    'reason': 'Produit populaire en rupture',
                    'severity': 'HIGH'
                })
            elif 0 < stock <= 5 and rank <= 5000:
                anomalies['stock_critical'].append({
                    'product_id': product_id,
                    'title': title,
                    'stock': stock,
                    'rank': rank,
                    'reason': 'Stock très faible pour produit demandé',
                    'severity': 'MEDIUM'
                })
            
            # Rating suspect
            if rating == 5.0 and reviews < 10:
                anomalies['rating_suspicious'].append({
                    'product_id': product_id,
                    'title': title,
                    'rating': rating,
                    'reviews': reviews,
                    'reason': 'Rating parfait avec peu d\'avis',
                    'severity': 'LOW'
                })
            
            # Incohérences
            if rank <= 100 and (rating or 0) < 3.0 and rating > 0:
                anomalies['data_inconsistencies'].append({
                    'product_id': product_id,
                    'title': title,
                    'rank': rank,
                    'rating': rating,
                    'reason': 'Rang excellent mais rating faible',
                    'severity': 'MEDIUM'
                })
        
        # Résumé
        total_anomalies = sum(len(v) for v in anomalies.values())
        
        return {
            'total_anomalies': total_anomalies,
            'by_type': {
                'price': len(anomalies['price_anomalies']),
                'stock': len(anomalies['stock_critical']),
                'rating': len(anomalies['rating_suspicious']),
                'data': len(anomalies['data_inconsistencies'])
            },
            'details': anomalies
        }
    
    def _empty_kpis(self) -> Dict[str, Any]:
        """Retourne des KPIs vides"""
        return {
            'total_products': 0,
            'in_stock': 0,
            'out_of_stock': 0,
            'low_stock': 0,
            'stock_rate': 0,
            'price_stats': {'average': 0, 'median': 0, 'min': 0, 'max': 0, 'std': 0},
            'rating_stats': {'average': 0, 'excellent': 0, 'good': 0, 'moderate': 0, 'poor': 0},
            'rank_stats': {'average': 0, 'top_100': 0, 'top_1000': 0, 'low_performers': 0},
            'inventory_value': 0,
            'top_rated': [],
            'top_ranked': []
        }


# Instance singleton
analytics_service = AnalyticsService()
