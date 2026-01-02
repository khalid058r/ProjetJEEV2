"""
KPI Engine - Module de calcul et formatage des KPIs pour le chatbot
Regroupe tous les KPIs du frontend et backend avec calculs avancés
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from database import db, convert_to_native
import pandas as pd

class KPIEngine:
    """
    Moteur de calcul des KPIs - Intègre tous les indicateurs du système:
    
    📊 KPIs de Ventes:
    - Chiffre d'affaires total/mensuel/journalier
    - Nombre de transactions
    - Panier moyen
    - Taux de croissance
    - Évolution mois par mois
    
    📦 KPIs de Produits:
    - Total produits
    - Produits en rupture
    - Stock faible
    - Best-sellers
    - Slow movers
    - Rotation des stocks
    
    👥 KPIs Vendeurs:
    - Nombre de vendeurs
    - Performance par vendeur
    - Classement vendeurs
    - Vendeur du mois
    
    🏷️ KPIs Catégories:
    - Revenue par catégorie
    - Meilleure catégorie
    - Distribution des ventes
    
    📈 KPIs Tendances:
    - Croissance mensuelle
    - Comparaison période vs période
    - Projections
    """
    
    def __init__(self):
        self.cache = {}
        self.cache_ttl = 60  # 1 minute
    
    # ============ KPIs GLOBAUX ============
    
    def get_all_kpis(self) -> Dict[str, Any]:
        """Récupère TOUS les KPIs du système en une seule requête"""
        try:
            return {
                'sales': self.get_sales_kpis(),
                'products': self.get_product_kpis(),
                'vendors': self.get_vendor_kpis(),
                'categories': self.get_category_kpis(),
                'trends': self.get_trend_kpis(),
                'alerts': self.get_alert_kpis(),
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            return {'error': str(e)}
    
    # ============ KPIs DE VENTES ============
    
    def get_sales_kpis(self) -> Dict[str, Any]:
        """KPIs liés aux ventes et transactions"""
        try:
            # Requête principale ventes
            sales_query = """
                SELECT 
                    COUNT(*) as total_transactions,
                    COALESCE(SUM(total_amount), 0) as total_revenue,
                    COALESCE(AVG(total_amount), 0) as avg_basket,
                    COALESCE(MAX(total_amount), 0) as max_basket,
                    COALESCE(MIN(total_amount), 0) as min_basket,
                    COUNT(DISTINCT user_id) as unique_vendeurs,
                    COUNT(DISTINCT DATE(sale_date)) as active_days
                FROM sale
                WHERE status != 'CANCELLED'
            """
            sales_df = db.get_dataframe(sales_query)
            
            if sales_df.empty:
                return self._empty_sales_kpis()
            
            row = sales_df.iloc[0]
            
            # Ventes du mois en cours
            current_month_query = """
                SELECT 
                    COUNT(*) as transactions,
                    COALESCE(SUM(total_amount), 0) as revenue
                FROM sale
                WHERE status != 'CANCELLED'
                AND EXTRACT(MONTH FROM sale_date) = EXTRACT(MONTH FROM CURRENT_DATE)
                AND EXTRACT(YEAR FROM sale_date) = EXTRACT(YEAR FROM CURRENT_DATE)
            """
            current_month = db.get_dataframe(current_month_query).iloc[0] if not db.get_dataframe(current_month_query).empty else {}
            
            # Ventes du mois précédent (pour comparaison)
            prev_month_query = """
                SELECT 
                    COUNT(*) as transactions,
                    COALESCE(SUM(total_amount), 0) as revenue
                FROM sale
                WHERE status != 'CANCELLED'
                AND EXTRACT(MONTH FROM sale_date) = EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '1 month')
                AND EXTRACT(YEAR FROM sale_date) = EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month')
            """
            prev_month = db.get_dataframe(prev_month_query).iloc[0] if not db.get_dataframe(prev_month_query).empty else {}
            
            # Ventes d'aujourd'hui
            today_query = """
                SELECT 
                    COUNT(*) as transactions,
                    COALESCE(SUM(total_amount), 0) as revenue,
                    COALESCE(SUM(lv.quantity), 0) as items_sold
                FROM sale s
                LEFT JOIN ligne_vente lv ON s.id = lv.sale_id
                WHERE s.status != 'CANCELLED'
                AND DATE(s.sale_date) = CURRENT_DATE
            """
            today = db.get_dataframe(today_query).iloc[0] if not db.get_dataframe(today_query).empty else {}
            
            # Calcul de croissance
            current_revenue = float(current_month.get('revenue', 0) or 0)
            prev_revenue = float(prev_month.get('revenue', 0) or 0)
            growth_rate = ((current_revenue - prev_revenue) / prev_revenue * 100) if prev_revenue > 0 else 0
            
            return {
                'total': {
                    'transactions': int(row.get('total_transactions', 0) or 0),
                    'revenue': float(row.get('total_revenue', 0) or 0),
                    'avg_basket': float(row.get('avg_basket', 0) or 0),
                    'max_basket': float(row.get('max_basket', 0) or 0),
                    'min_basket': float(row.get('min_basket', 0) or 0),
                    'active_days': int(row.get('active_days', 0) or 0),
                    'unique_vendeurs': int(row.get('unique_vendeurs', 0) or 0)
                },
                'current_month': {
                    'transactions': int(current_month.get('transactions', 0) or 0),
                    'revenue': current_revenue,
                    'growth_rate': round(growth_rate, 1)
                },
                'previous_month': {
                    'transactions': int(prev_month.get('transactions', 0) or 0),
                    'revenue': prev_revenue
                },
                'today': {
                    'transactions': int(today.get('transactions', 0) or 0),
                    'revenue': float(today.get('revenue', 0) or 0),
                    'items_sold': int(today.get('items_sold', 0) or 0)
                }
            }
        except Exception as e:
            return {'error': str(e)}
    
    def _empty_sales_kpis(self) -> Dict:
        return {
            'total': {'transactions': 0, 'revenue': 0, 'avg_basket': 0, 'max_basket': 0, 'min_basket': 0, 'active_days': 0, 'unique_vendeurs': 0},
            'current_month': {'transactions': 0, 'revenue': 0, 'growth_rate': 0},
            'previous_month': {'transactions': 0, 'revenue': 0},
            'today': {'transactions': 0, 'revenue': 0, 'items_sold': 0}
        }
    
    # ============ KPIs DE PRODUITS ============
    
    def get_product_kpis(self) -> Dict[str, Any]:
        """KPIs liés aux produits et stocks"""
        try:
            query = """
                SELECT 
                    COUNT(*) as total_products,
                    COALESCE(SUM(stock), 0) as total_stock,
                    COALESCE(AVG(price), 0) as avg_price,
                    COALESCE(MAX(price), 0) as max_price,
                    COALESCE(MIN(price), 0) as min_price,
                    COALESCE(AVG(rating), 0) as avg_rating,
                    SUM(CASE WHEN stock = 0 THEN 1 ELSE 0 END) as out_of_stock,
                    SUM(CASE WHEN stock > 0 AND stock < 10 THEN 1 ELSE 0 END) as low_stock,
                    SUM(CASE WHEN stock >= 10 AND stock < 50 THEN 1 ELSE 0 END) as medium_stock,
                    SUM(CASE WHEN stock >= 50 THEN 1 ELSE 0 END) as high_stock
                FROM product
            """
            df = db.get_dataframe(query)
            
            if df.empty:
                return self._empty_product_kpis()
            
            row = df.iloc[0]
            total = int(row.get('total_products', 0) or 0)
            
            # Best sellers
            best_sellers_query = """
                SELECT p.title, COALESCE(SUM(lv.quantity), 0) as total_sold,
                       COALESCE(SUM(lv.line_total), 0) as revenue
                FROM product p
                LEFT JOIN ligne_vente lv ON p.id = lv.product_id
                GROUP BY p.id, p.title
                HAVING SUM(lv.quantity) > 0
                ORDER BY total_sold DESC
                LIMIT 5
            """
            best_sellers = db.get_dataframe(best_sellers_query)
            
            # Slow movers
            slow_movers_query = """
                SELECT p.title, p.stock, COALESCE(SUM(lv.quantity), 0) as total_sold
                FROM product p
                LEFT JOIN ligne_vente lv ON p.id = lv.product_id
                GROUP BY p.id, p.title, p.stock
                HAVING COALESCE(SUM(lv.quantity), 0) < 5
                ORDER BY total_sold ASC
                LIMIT 5
            """
            slow_movers = db.get_dataframe(slow_movers_query)
            
            return {
                'total': total,
                'stock': {
                    'total_units': int(row.get('total_stock', 0) or 0),
                    'out_of_stock': int(row.get('out_of_stock', 0) or 0),
                    'low_stock': int(row.get('low_stock', 0) or 0),
                    'medium_stock': int(row.get('medium_stock', 0) or 0),
                    'high_stock': int(row.get('high_stock', 0) or 0),
                    'out_of_stock_pct': round(int(row.get('out_of_stock', 0) or 0) / total * 100, 1) if total > 0 else 0
                },
                'price': {
                    'avg': float(row.get('avg_price', 0) or 0),
                    'max': float(row.get('max_price', 0) or 0),
                    'min': float(row.get('min_price', 0) or 0)
                },
                'rating': {
                    'avg': round(float(row.get('avg_rating', 0) or 0), 2)
                },
                'best_sellers': db.df_to_dict(best_sellers) if not best_sellers.empty else [],
                'slow_movers': db.df_to_dict(slow_movers) if not slow_movers.empty else []
            }
        except Exception as e:
            return {'error': str(e)}
    
    def _empty_product_kpis(self) -> Dict:
        return {
            'total': 0,
            'stock': {'total_units': 0, 'out_of_stock': 0, 'low_stock': 0, 'medium_stock': 0, 'high_stock': 0, 'out_of_stock_pct': 0},
            'price': {'avg': 0, 'max': 0, 'min': 0},
            'rating': {'avg': 0},
            'best_sellers': [],
            'slow_movers': []
        }
    
    # ============ KPIs VENDEURS ============
    
    def get_vendor_kpis(self) -> Dict[str, Any]:
        """KPIs liés aux vendeurs"""
        try:
            query = """
                SELECT 
                    u.id, u.username,
                    COUNT(s.id) as total_sales,
                    COALESCE(SUM(s.total_amount), 0) as total_revenue,
                    COALESCE(AVG(s.total_amount), 0) as avg_basket,
                    MAX(s.sale_date) as last_sale
                FROM users u
                LEFT JOIN sale s ON u.id = s.user_id AND s.status != 'CANCELLED'
                WHERE u.role = 'VENDEUR'
                GROUP BY u.id, u.username
                ORDER BY total_revenue DESC
            """
            df = db.get_dataframe(query)
            
            if df.empty:
                return self._empty_vendor_kpis()
            
            # Stats globales vendeurs
            total_vendeurs = len(df)
            active_vendeurs = len(df[df['total_sales'] > 0])
            total_revenue = df['total_revenue'].sum()
            avg_revenue_per_vendor = total_revenue / active_vendeurs if active_vendeurs > 0 else 0
            
            # Top 5 vendeurs
            top_vendors = df.head(5)
            
            # Vendeur du mois (plus de ventes ce mois)
            vendor_month_query = """
                SELECT u.username, COUNT(s.id) as sales_count, SUM(s.total_amount) as revenue
                FROM users u
                JOIN sale s ON u.id = s.user_id
                WHERE u.role = 'VENDEUR' AND s.status != 'CANCELLED'
                AND EXTRACT(MONTH FROM s.sale_date) = EXTRACT(MONTH FROM CURRENT_DATE)
                AND EXTRACT(YEAR FROM s.sale_date) = EXTRACT(YEAR FROM CURRENT_DATE)
                GROUP BY u.id, u.username
                ORDER BY revenue DESC
                LIMIT 1
            """
            vendor_month = db.get_dataframe(vendor_month_query)
            
            return {
                'total': total_vendeurs,
                'active': active_vendeurs,
                'inactive': total_vendeurs - active_vendeurs,
                'performance': {
                    'total_revenue': float(total_revenue),
                    'avg_revenue_per_vendor': float(avg_revenue_per_vendor)
                },
                'top_vendors': db.df_to_dict(top_vendors),
                'vendor_of_month': db.df_to_dict(vendor_month)[0] if not vendor_month.empty else None
            }
        except Exception as e:
            return {'error': str(e)}
    
    def _empty_vendor_kpis(self) -> Dict:
        return {
            'total': 0, 'active': 0, 'inactive': 0,
            'performance': {'total_revenue': 0, 'avg_revenue_per_vendor': 0},
            'top_vendors': [], 'vendor_of_month': None
        }
    
    # ============ KPIs CATÉGORIES ============
    
    def get_category_kpis(self) -> Dict[str, Any]:
        """KPIs liés aux catégories"""
        try:
            query = """
                SELECT 
                    c.id, c.name,
                    COUNT(DISTINCT p.id) as product_count,
                    COALESCE(SUM(p.stock), 0) as total_stock,
                    COALESCE(AVG(p.price), 0) as avg_price,
                    COALESCE(SUM(lv.quantity), 0) as total_sold,
                    COALESCE(SUM(lv.line_total), 0) as total_revenue
                FROM category c
                LEFT JOIN product p ON c.id = p.category_id
                LEFT JOIN ligne_vente lv ON p.id = lv.product_id
                GROUP BY c.id, c.name
                ORDER BY total_revenue DESC
            """
            df = db.get_dataframe(query)
            
            if df.empty:
                return self._empty_category_kpis()
            
            total_categories = len(df)
            total_revenue = df['total_revenue'].sum()
            
            # Meilleures catégories
            best_category = df.iloc[0] if not df.empty else None
            
            # Distribution
            distribution = []
            for _, row in df.iterrows():
                revenue = float(row.get('total_revenue', 0) or 0)
                distribution.append({
                    'name': row.get('name', 'N/A'),
                    'revenue': revenue,
                    'percentage': round(revenue / total_revenue * 100, 1) if total_revenue > 0 else 0,
                    'products': int(row.get('product_count', 0) or 0)
                })
            
            return {
                'total': total_categories,
                'best_category': {
                    'name': best_category.get('name', 'N/A') if best_category is not None else 'N/A',
                    'revenue': float(best_category.get('total_revenue', 0) or 0) if best_category is not None else 0
                },
                'distribution': distribution,
                'total_revenue': float(total_revenue)
            }
        except Exception as e:
            return {'error': str(e)}
    
    def _empty_category_kpis(self) -> Dict:
        return {'total': 0, 'best_category': None, 'distribution': [], 'total_revenue': 0}
    
    # ============ KPIs TENDANCES ============
    
    def get_trend_kpis(self) -> Dict[str, Any]:
        """KPIs de tendances et évolutions"""
        try:
            # Ventes mensuelles sur les 12 derniers mois
            monthly_query = """
                SELECT 
                    TO_CHAR(sale_date, 'YYYY-MM') as month,
                    COUNT(*) as transactions,
                    COALESCE(SUM(total_amount), 0) as revenue
                FROM sale
                WHERE status != 'CANCELLED'
                AND sale_date >= CURRENT_DATE - INTERVAL '12 months'
                GROUP BY TO_CHAR(sale_date, 'YYYY-MM')
                ORDER BY month
            """
            monthly = db.get_dataframe(monthly_query)
            
            # Ventes par jour de la semaine
            weekday_query = """
                SELECT 
                    EXTRACT(DOW FROM sale_date) as day_of_week,
                    COUNT(*) as transactions,
                    COALESCE(AVG(total_amount), 0) as avg_basket
                FROM sale
                WHERE status != 'CANCELLED'
                GROUP BY EXTRACT(DOW FROM sale_date)
                ORDER BY day_of_week
            """
            weekday = db.get_dataframe(weekday_query)
            
            # Heures de pointe
            hourly_query = """
                SELECT 
                    EXTRACT(HOUR FROM sale_date) as hour,
                    COUNT(*) as transactions
                FROM sale
                WHERE status != 'CANCELLED'
                GROUP BY EXTRACT(HOUR FROM sale_date)
                ORDER BY transactions DESC
                LIMIT 3
            """
            peak_hours = db.get_dataframe(hourly_query)
            
            # Calcul des tendances
            monthly_list = db.df_to_dict(monthly) if not monthly.empty else []
            
            # Tendance globale (croissance moyenne)
            if len(monthly_list) >= 2:
                revenues = [m['revenue'] for m in monthly_list if m.get('revenue')]
                if len(revenues) >= 2:
                    first_half = sum(revenues[:len(revenues)//2]) / (len(revenues)//2)
                    second_half = sum(revenues[len(revenues)//2:]) / (len(revenues) - len(revenues)//2)
                    trend = 'up' if second_half > first_half else 'down' if second_half < first_half else 'stable'
                    trend_pct = ((second_half - first_half) / first_half * 100) if first_half > 0 else 0
                else:
                    trend = 'stable'
                    trend_pct = 0
            else:
                trend = 'insufficient_data'
                trend_pct = 0
            
            # Jours de la semaine
            days_names = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
            weekday_stats = []
            for _, row in weekday.iterrows():
                day_idx = int(row.get('day_of_week', 0))
                weekday_stats.append({
                    'day': days_names[day_idx] if day_idx < len(days_names) else 'N/A',
                    'transactions': int(row.get('transactions', 0)),
                    'avg_basket': float(row.get('avg_basket', 0))
                })
            
            return {
                'monthly': monthly_list,
                'trend_direction': trend,
                'trend_percentage': round(trend_pct, 1),
                'weekday_pattern': weekday_stats,
                'peak_hours': db.df_to_dict(peak_hours) if not peak_hours.empty else []
            }
        except Exception as e:
            return {'error': str(e)}
    
    # ============ KPIs ALERTES ============
    
    def get_alert_kpis(self) -> Dict[str, Any]:
        """KPIs d'alertes et problèmes à surveiller"""
        try:
            # Produits en rupture
            out_of_stock = db.get_dataframe(
                "SELECT COUNT(*) as count FROM product WHERE stock = 0"
            ).iloc[0].get('count', 0)
            
            # Produits stock critique
            low_stock = db.get_dataframe(
                "SELECT COUNT(*) as count FROM product WHERE stock > 0 AND stock < 10"
            ).iloc[0].get('count', 0)
            
            # Vendeurs inactifs (pas de vente depuis 7 jours)
            inactive_vendors = db.get_dataframe("""
                SELECT COUNT(*) as count FROM users u
                WHERE u.role = 'VENDEUR' AND u.active = true
                AND u.id NOT IN (
                    SELECT DISTINCT user_id FROM sale 
                    WHERE sale_date >= CURRENT_DATE - INTERVAL '7 days'
                )
            """).iloc[0].get('count', 0)
            
            # Baisse de CA (comparer cette semaine vs semaine dernière)
            revenue_change = db.get_dataframe("""
                SELECT 
                    COALESCE(SUM(CASE WHEN sale_date >= CURRENT_DATE - INTERVAL '7 days' 
                                 THEN total_amount ELSE 0 END), 0) as this_week,
                    COALESCE(SUM(CASE WHEN sale_date >= CURRENT_DATE - INTERVAL '14 days' 
                                 AND sale_date < CURRENT_DATE - INTERVAL '7 days'
                                 THEN total_amount ELSE 0 END), 0) as last_week
                FROM sale WHERE status != 'CANCELLED'
            """)
            
            this_week = float(revenue_change.iloc[0].get('this_week', 0) or 0)
            last_week = float(revenue_change.iloc[0].get('last_week', 0) or 0)
            revenue_trend = ((this_week - last_week) / last_week * 100) if last_week > 0 else 0
            
            alerts = []
            
            if out_of_stock > 0:
                alerts.append({
                    'type': 'critical',
                    'category': 'stock',
                    'message': f"{out_of_stock} produit(s) en rupture de stock",
                    'count': int(out_of_stock)
                })
            
            if low_stock > 0:
                alerts.append({
                    'type': 'warning',
                    'category': 'stock',
                    'message': f"{low_stock} produit(s) avec stock faible (<10)",
                    'count': int(low_stock)
                })
            
            if inactive_vendors > 0:
                alerts.append({
                    'type': 'info',
                    'category': 'vendors',
                    'message': f"{inactive_vendors} vendeur(s) inactif(s) depuis 7 jours",
                    'count': int(inactive_vendors)
                })
            
            if revenue_trend < -10:
                alerts.append({
                    'type': 'warning',
                    'category': 'revenue',
                    'message': f"Baisse du CA de {abs(revenue_trend):.1f}% cette semaine",
                    'value': round(revenue_trend, 1)
                })
            
            return {
                'total_alerts': len(alerts),
                'critical': len([a for a in alerts if a['type'] == 'critical']),
                'warnings': len([a for a in alerts if a['type'] == 'warning']),
                'info': len([a for a in alerts if a['type'] == 'info']),
                'alerts': alerts,
                'revenue_trend': round(revenue_trend, 1),
                'this_week_revenue': this_week,
                'last_week_revenue': last_week
            }
        except Exception as e:
            return {'error': str(e)}
    
    # ============ FORMATAGE POUR LE CHATBOT ============
    
    def format_kpis_for_chat(self, kpis: Dict[str, Any]) -> str:
        """Formate les KPIs en texte lisible pour le chatbot"""
        try:
            lines = []
            lines.append("=" * 50)
            lines.append("📊 TABLEAU DE BORD COMPLET - KPIs EN TEMPS RÉEL")
            lines.append("=" * 50)
            
            # Ventes
            sales = kpis.get('sales', {})
            if sales and 'error' not in sales:
                lines.append("\n💰 VENTES & CHIFFRE D'AFFAIRES")
                lines.append("-" * 40)
                total = sales.get('total', {})
                lines.append(f"• CA Total: {total.get('revenue', 0):,.2f} MAD")
                lines.append(f"• Transactions: {total.get('transactions', 0):,}")
                lines.append(f"• Panier moyen: {total.get('avg_basket', 0):,.2f} MAD")
                lines.append(f"• Panier max: {total.get('max_basket', 0):,.2f} MAD")
                
                current = sales.get('current_month', {})
                lines.append(f"\n📅 CE MOIS:")
                lines.append(f"• CA: {current.get('revenue', 0):,.2f} MAD")
                lines.append(f"• Croissance: {current.get('growth_rate', 0):+.1f}%")
                
                today = sales.get('today', {})
                lines.append(f"\n🕐 AUJOURD'HUI:")
                lines.append(f"• CA: {today.get('revenue', 0):,.2f} MAD")
                lines.append(f"• Transactions: {today.get('transactions', 0)}")
            
            # Produits
            products = kpis.get('products', {})
            if products and 'error' not in products:
                lines.append("\n\n📦 PRODUITS & STOCKS")
                lines.append("-" * 40)
                lines.append(f"• Total produits: {products.get('total', 0):,}")
                
                stock = products.get('stock', {})
                lines.append(f"• Stock total: {stock.get('total_units', 0):,} unités")
                lines.append(f"• 🔴 En rupture: {stock.get('out_of_stock', 0)} ({stock.get('out_of_stock_pct', 0)}%)")
                lines.append(f"• 🟡 Stock faible: {stock.get('low_stock', 0)}")
                lines.append(f"• ✅ Stock OK: {stock.get('medium_stock', 0) + stock.get('high_stock', 0)}")
                
                price = products.get('price', {})
                lines.append(f"\n💵 Prix moyen: {price.get('avg', 0):,.2f} MAD")
                lines.append(f"⭐ Note moyenne: {products.get('rating', {}).get('avg', 0)}/5")
            
            # Vendeurs
            vendors = kpis.get('vendors', {})
            if vendors and 'error' not in vendors:
                lines.append("\n\n👥 VENDEURS")
                lines.append("-" * 40)
                lines.append(f"• Total: {vendors.get('total', 0)}")
                lines.append(f"• Actifs: {vendors.get('active', 0)}")
                lines.append(f"• CA moyen/vendeur: {vendors.get('performance', {}).get('avg_revenue_per_vendor', 0):,.2f} MAD")
                
                vendor_month = vendors.get('vendor_of_month')
                if vendor_month:
                    lines.append(f"• 🏆 Vendeur du mois: {vendor_month.get('username', 'N/A')}")
            
            # Catégories
            categories = kpis.get('categories', {})
            if categories and 'error' not in categories:
                lines.append("\n\n🏷️ CATÉGORIES")
                lines.append("-" * 40)
                lines.append(f"• Total: {categories.get('total', 0)}")
                best = categories.get('best_category', {})
                if best:
                    lines.append(f"• 🥇 Meilleure: {best.get('name', 'N/A')} ({best.get('revenue', 0):,.2f} MAD)")
            
            # Alertes
            alerts = kpis.get('alerts', {})
            if alerts and 'error' not in alerts:
                lines.append("\n\n🚨 ALERTES")
                lines.append("-" * 40)
                lines.append(f"• Critiques: {alerts.get('critical', 0)}")
                lines.append(f"• Avertissements: {alerts.get('warnings', 0)}")
                for alert in alerts.get('alerts', [])[:5]:
                    emoji = "🔴" if alert['type'] == 'critical' else "🟡" if alert['type'] == 'warning' else "ℹ️"
                    lines.append(f"  {emoji} {alert['message']}")
            
            lines.append("\n" + "=" * 50)
            
            return '\n'.join(lines)
            
        except Exception as e:
            return f"Erreur de formatage: {str(e)}"


# Instance globale
kpi_engine = KPIEngine()
