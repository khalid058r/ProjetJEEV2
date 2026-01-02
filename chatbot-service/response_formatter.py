"""
Response Formatter - Module de formatage des réponses pour le chatbot
Produit des réponses parfaitement formatées et professionnelles
"""

from typing import Dict, Any, List, Optional, Union
from datetime import datetime
import re

class ResponseFormatter:
    """
    Formateur de réponses professionnelles pour le chatbot.
    Produit des réponses claires, structurées et visuellement attrayantes.
    """
    
    def __init__(self):
        self.currency = "MAD"
        self.locale = "fr-FR"
    
    # ============ FORMATAGE DES NOMBRES ============
    
    def format_currency(self, amount: float, show_decimals: bool = True) -> str:
        """Formate un montant en devise"""
        if amount is None:
            return "0 " + self.currency
        
        if abs(amount) >= 1_000_000:
            return f"{amount/1_000_000:,.2f}M {self.currency}"
        elif abs(amount) >= 1_000:
            if show_decimals:
                return f"{amount:,.2f} {self.currency}"
            return f"{amount:,.0f} {self.currency}"
        else:
            return f"{amount:,.2f} {self.currency}"
    
    def format_number(self, num: Union[int, float], decimals: int = 0) -> str:
        """Formate un nombre avec séparateurs de milliers"""
        if num is None:
            return "0"
        
        if decimals > 0:
            return f"{num:,.{decimals}f}"
        return f"{num:,.0f}"
    
    def format_percent(self, value: float, with_sign: bool = True) -> str:
        """Formate un pourcentage"""
        if value is None:
            return "0%"
        
        if with_sign and value > 0:
            return f"+{value:.1f}%"
        return f"{value:.1f}%"
    
    def format_compact(self, num: float) -> str:
        """Formate un nombre en notation compacte (1K, 1M, etc.)"""
        if num is None:
            return "0"
        
        if abs(num) >= 1_000_000:
            return f"{num/1_000_000:.1f}M"
        elif abs(num) >= 1_000:
            return f"{num/1_000:.1f}K"
        return str(int(num))
    
    # ============ INDICATEURS VISUELS ============
    
    def trend_indicator(self, value: float, invert: bool = False) -> str:
        """Retourne un indicateur de tendance"""
        if value is None:
            value = 0
        
        if invert:
            value = -value
        
        if value > 5:
            return "📈 ↑"
        elif value > 0:
            return "📊 ↗"
        elif value < -5:
            return "📉 ↓"
        elif value < 0:
            return "📊 ↘"
        return "➡️"
    
    def stock_indicator(self, stock: int) -> str:
        """Retourne un indicateur de stock"""
        if stock is None:
            stock = 0
        
        if stock == 0:
            return "🔴 RUPTURE"
        elif stock < 10:
            return "🟡 Faible"
        elif stock < 50:
            return "🟢 Normal"
        return "✅ Élevé"
    
    def rating_stars(self, rating: float) -> str:
        """Retourne des étoiles pour une note"""
        if rating is None:
            return "☆☆☆☆☆"
        
        full_stars = int(rating)
        half_star = 1 if rating - full_stars >= 0.5 else 0
        empty_stars = 5 - full_stars - half_star
        
        return "★" * full_stars + "½" * half_star + "☆" * empty_stars
    
    def progress_bar(self, value: float, max_value: float, width: int = 10) -> str:
        """Crée une barre de progression textuelle"""
        if max_value == 0:
            pct = 0
        else:
            pct = min(value / max_value, 1.0)
        
        filled = int(pct * width)
        empty = width - filled
        
        return f"[{'█' * filled}{'░' * empty}] {pct*100:.0f}%"
    
    # ============ FORMATAGE DES TABLEAUX ============
    
    def format_table(self, data: List[Dict], columns: List[str], headers: List[str] = None) -> str:
        """Formate des données en tableau Markdown"""
        if not data:
            return "_Aucune donnée_"
        
        if headers is None:
            headers = columns
        
        lines = []
        
        # En-tête
        lines.append("| " + " | ".join(headers) + " |")
        lines.append("|" + "|".join(["---"] * len(columns)) + "|")
        
        # Données
        for row in data[:10]:  # Limiter à 10 lignes
            values = []
            for col in columns:
                val = row.get(col, "N/A")
                if isinstance(val, float):
                    val = f"{val:,.2f}"
                elif isinstance(val, int):
                    val = f"{val:,}"
                values.append(str(val)[:30])  # Tronquer
            lines.append("| " + " | ".join(values) + " |")
        
        if len(data) > 10:
            lines.append(f"_... et {len(data) - 10} autres lignes_")
        
        return "\n".join(lines)
    
    # ============ FORMATAGE DES KPIs ============
    
    def format_kpi_card(self, title: str, value: str, subtitle: str = None, 
                        trend: float = None, icon: str = "📊") -> str:
        """Formate une carte KPI"""
        lines = [f"{icon} **{title}**"]
        lines.append(f"   {value}")
        
        if trend is not None:
            indicator = self.trend_indicator(trend)
            lines.append(f"   {indicator} {self.format_percent(trend)}")
        
        if subtitle:
            lines.append(f"   _{subtitle}_")
        
        return "\n".join(lines)
    
    def format_kpi_row(self, label: str, value: Any, unit: str = "", icon: str = "•") -> str:
        """Formate une ligne de KPI"""
        if isinstance(value, float):
            if unit == "MAD" or unit == self.currency:
                formatted_value = self.format_currency(value)
            elif unit == "%":
                formatted_value = self.format_percent(value, with_sign=False)
            else:
                formatted_value = f"{value:,.2f} {unit}".strip()
        elif isinstance(value, int):
            formatted_value = f"{value:,} {unit}".strip()
        else:
            formatted_value = f"{value} {unit}".strip()
        
        return f"{icon} {label}: **{formatted_value}**"
    
    # ============ FORMATAGE DES PRODUITS ============
    
    def format_product(self, product: Dict, index: int = None) -> str:
        """Formate un produit pour l'affichage"""
        lines = []
        
        prefix = f"{index}. " if index else ""
        title = product.get('title', 'N/A')[:45]
        lines.append(f"{prefix}📦 **{title}**")
        
        # Détails sur une ligne
        details = []
        if product.get('price'):
            details.append(f"💰 {self.format_currency(product['price'])}")
        if product.get('stock') is not None:
            details.append(f"📊 Stock: {product['stock']} {self.stock_indicator(product['stock'])}")
        if product.get('rating'):
            details.append(f"⭐ {product['rating']:.1f}/5")
        
        if details:
            lines.append("   " + " | ".join(details))
        
        # Catégorie
        if product.get('category_name'):
            lines.append(f"   🏷️ {product['category_name']}")
        
        return "\n".join(lines)
    
    def format_product_list(self, products: List[Dict], max_items: int = 5, 
                           title: str = None) -> str:
        """Formate une liste de produits"""
        if not products:
            return "❌ Aucun produit trouvé"
        
        lines = []
        if title:
            lines.append(f"**{title}** ({len(products)} résultats)\n")
        
        for i, product in enumerate(products[:max_items], 1):
            lines.append(self.format_product(product, i))
        
        if len(products) > max_items:
            lines.append(f"\n_... et {len(products) - max_items} autres produits_")
        
        return "\n\n".join(lines)
    
    # ============ FORMATAGE DES VENTES ============
    
    def format_sale(self, sale: Dict, index: int = None) -> str:
        """Formate une vente pour l'affichage"""
        lines = []
        
        prefix = f"{index}. " if index else ""
        sale_id = sale.get('id', 'N/A')
        amount = self.format_currency(sale.get('total_amount', 0))
        
        lines.append(f"{prefix}🧾 **Transaction #{sale_id}**")
        lines.append(f"   💰 Montant: {amount}")
        
        if sale.get('vendeur') or sale.get('username'):
            lines.append(f"   👤 Vendeur: {sale.get('vendeur') or sale.get('username')}")
        
        if sale.get('total_items') or sale.get('nb_items'):
            items = sale.get('total_items') or sale.get('nb_items', 0)
            lines.append(f"   📦 Articles: {items}")
        
        if sale.get('sale_date'):
            lines.append(f"   📅 Date: {sale.get('sale_date')}")
        
        return "\n".join(lines)
    
    # ============ FORMATAGE DES VENDEURS ============
    
    def format_vendor(self, vendor: Dict, rank: int = None) -> str:
        """Formate un vendeur pour l'affichage"""
        lines = []
        
        # Médaille selon le rang
        if rank == 1:
            medal = "🥇"
        elif rank == 2:
            medal = "🥈"
        elif rank == 3:
            medal = "🥉"
        else:
            medal = f"#{rank}" if rank else "👤"
        
        name = vendor.get('username', 'N/A')
        lines.append(f"{medal} **{name}**")
        
        if vendor.get('total_revenue') or vendor.get('revenue'):
            revenue = vendor.get('total_revenue') or vendor.get('revenue', 0)
            lines.append(f"   💰 CA: {self.format_currency(revenue)}")
        
        if vendor.get('total_sales') or vendor.get('nb_sales'):
            sales = vendor.get('total_sales') or vendor.get('nb_sales', 0)
            lines.append(f"   🛒 Ventes: {sales}")
        
        if vendor.get('avg_basket'):
            lines.append(f"   🛍️ Panier moyen: {self.format_currency(vendor['avg_basket'])}")
        
        return "\n".join(lines)
    
    # ============ FORMATAGE DES ALERTES ============
    
    def format_alert(self, alert: Dict) -> str:
        """Formate une alerte"""
        alert_type = alert.get('type', 'info')
        
        if alert_type == 'critical':
            icon = "🔴"
        elif alert_type == 'warning':
            icon = "🟡"
        else:
            icon = "ℹ️"
        
        message = alert.get('message', 'Alerte')
        return f"{icon} {message}"
    
    # ============ SECTIONS COMPLÈTES ============
    
    def format_sales_overview(self, data: Dict) -> str:
        """Formate un aperçu complet des ventes"""
        lines = ["📊 **APERÇU DES VENTES**\n"]
        
        if data.get('total'):
            total = data['total']
            lines.append(self.format_kpi_row("CA Total", total.get('revenue', 0), "MAD", "💰"))
            lines.append(self.format_kpi_row("Transactions", total.get('transactions', 0), "", "🛒"))
            lines.append(self.format_kpi_row("Panier moyen", total.get('avg_basket', 0), "MAD", "🛍️"))
        
        if data.get('current_month'):
            current = data['current_month']
            lines.append(f"\n📅 **Ce mois:**")
            lines.append(self.format_kpi_row("CA", current.get('revenue', 0), "MAD", "  •"))
            lines.append(self.format_kpi_row("Croissance", current.get('growth_rate', 0), "%", "  •"))
        
        if data.get('today'):
            today = data['today']
            lines.append(f"\n🕐 **Aujourd'hui:**")
            lines.append(self.format_kpi_row("CA", today.get('revenue', 0), "MAD", "  •"))
            lines.append(self.format_kpi_row("Transactions", today.get('transactions', 0), "", "  •"))
        
        return "\n".join(lines)
    
    def format_stock_overview(self, data: Dict) -> str:
        """Formate un aperçu du stock"""
        lines = ["📦 **ÉTAT DES STOCKS**\n"]
        
        stock = data.get('stock', {})
        
        lines.append(self.format_kpi_row("Total unités", stock.get('total_units', 0), "", "📊"))
        lines.append(self.format_kpi_row("En rupture", stock.get('out_of_stock', 0), "", "🔴"))
        lines.append(self.format_kpi_row("Stock faible", stock.get('low_stock', 0), "", "🟡"))
        lines.append(self.format_kpi_row("Stock OK", 
                     stock.get('medium_stock', 0) + stock.get('high_stock', 0), "", "✅"))
        
        if stock.get('out_of_stock_pct'):
            lines.append(f"\n⚠️ {stock['out_of_stock_pct']}% des produits sont en rupture")
        
        return "\n".join(lines)
    
    def format_vendor_ranking(self, vendors: List[Dict]) -> str:
        """Formate un classement des vendeurs"""
        if not vendors:
            return "❌ Aucun vendeur trouvé"
        
        lines = ["🏆 **CLASSEMENT VENDEURS**\n"]
        
        for i, vendor in enumerate(vendors[:5], 1):
            lines.append(self.format_vendor(vendor, i))
            if i < len(vendors[:5]):
                lines.append("")  # Ligne vide entre vendeurs
        
        return "\n".join(lines)
    
    def format_category_distribution(self, categories: List[Dict]) -> str:
        """Formate la distribution par catégorie"""
        if not categories:
            return "❌ Aucune catégorie"
        
        lines = ["🏷️ **PERFORMANCE PAR CATÉGORIE**\n"]
        
        total = sum(c.get('revenue', 0) for c in categories)
        
        for cat in categories[:6]:
            name = cat.get('name', 'N/A')
            revenue = cat.get('revenue', 0)
            pct = (revenue / total * 100) if total > 0 else 0
            
            bar = self.progress_bar(pct, 100, 8)
            lines.append(f"**{name}**")
            lines.append(f"  {bar} {self.format_currency(revenue)}")
        
        return "\n".join(lines)
    
    # ============ RÉPONSE COMPLÈTE ============
    
    def format_full_dashboard(self, kpis: Dict) -> str:
        """Formate un dashboard complet"""
        sections = []
        
        # Header
        sections.append("═" * 40)
        sections.append("📊 **TABLEAU DE BORD COMPLET**")
        sections.append(f"_Mis à jour: {datetime.now().strftime('%d/%m/%Y %H:%M')}_")
        sections.append("═" * 40)
        
        # Ventes
        if kpis.get('sales'):
            sections.append("\n" + self.format_sales_overview(kpis['sales']))
        
        # Produits
        if kpis.get('products'):
            sections.append("\n" + self.format_stock_overview(kpis['products']))
        
        # Vendeurs
        if kpis.get('vendors', {}).get('top_vendors'):
            sections.append("\n" + self.format_vendor_ranking(kpis['vendors']['top_vendors']))
        
        # Catégories
        if kpis.get('categories', {}).get('distribution'):
            sections.append("\n" + self.format_category_distribution(kpis['categories']['distribution']))
        
        # Alertes
        if kpis.get('alerts', {}).get('alerts'):
            sections.append("\n🚨 **ALERTES**")
            for alert in kpis['alerts']['alerts'][:3]:
                sections.append(self.format_alert(alert))
        
        sections.append("\n" + "═" * 40)
        
        return "\n".join(sections)


# Instance globale
response_formatter = ResponseFormatter()
