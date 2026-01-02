"""
Smart Assistant - Module d'intelligence avancée pour le chatbot
Ce module fournit des fonctionnalités d'analyse intelligente et de génération de réponses contextuelles.
"""

import re
from typing import Dict, List, Any, Optional, Tuple
from database import db, convert_to_native
from datetime import datetime

class SmartAssistant:
    """
    Assistant intelligent qui comprend le contexte et fournit des réponses pertinentes.
    """
    
    def __init__(self):
        self.context_cache = {}
        self.last_refresh = None
    
    def understand_query(self, message: str) -> Dict[str, Any]:
        """
        Analyse intelligemment le message pour extraire:
        - L'intention principale
        - Les entités mentionnées (produits, vendeurs, dates, etc.)
        - Le contexte nécessaire
        """
        message_lower = message.lower()
        understanding = {
            'original_message': message,
            'needs_products': False,
            'needs_sales': False,
            'needs_vendors': False,
            'needs_categories': False,
            'needs_alerts': False,
            'product_references': [],
            'vendor_references': [],
            'date_references': [],
            'numbers': [],
            'keywords': []
        }
        
        # Détecter ce dont on a besoin
        product_keywords = ['produit', 'article', 'stock', 'prix', 'rupture', 'disponible', 'catalogue']
        sales_keywords = ['vente', 'transaction', 'vendu', 'achat', 'commande', 'ca', 'chiffre', 'revenu']
        vendor_keywords = ['vendeur', 'commercial', 'équipe', 'performance', 'classement']
        category_keywords = ['catégorie', 'type', 'famille', 'rayon']
        alert_keywords = ['alerte', 'rupture', 'problème', 'urgent', 'critique', 'faible']
        
        for kw in product_keywords:
            if kw in message_lower:
                understanding['needs_products'] = True
                understanding['keywords'].append(kw)
        
        for kw in sales_keywords:
            if kw in message_lower:
                understanding['needs_sales'] = True
                understanding['keywords'].append(kw)
        
        for kw in vendor_keywords:
            if kw in message_lower:
                understanding['needs_vendors'] = True
                understanding['keywords'].append(kw)
        
        for kw in category_keywords:
            if kw in message_lower:
                understanding['needs_categories'] = True
                understanding['keywords'].append(kw)
        
        for kw in alert_keywords:
            if kw in message_lower:
                understanding['needs_alerts'] = True
                understanding['keywords'].append(kw)
        
        # Extraire les références de produits
        understanding['product_references'] = self._extract_product_refs(message)
        
        # Extraire les nombres
        understanding['numbers'] = [int(n) for n in re.findall(r'\d+', message)]
        
        return understanding
    
    def _extract_product_refs(self, message: str) -> List[str]:
        """Extrait les références de produits du message"""
        refs = []
        
        # IDs numériques (4+ chiffres)
        ids = re.findall(r'\b(\d{4,})\b', message)
        refs.extend(ids)
        
        # Texte entre guillemets
        quoted = re.findall(r'"([^"]+)"', message)
        refs.extend(quoted)
        quoted_single = re.findall(r"'([^']+)'", message)
        refs.extend(quoted_single)
        
        # Après mots-clés
        patterns = [
            r'(?:produit|article|ref|id)\s+[#]?(\S+)',
            r'(?:prix|stock)\s+(?:de|du)\s+(\S+)',
        ]
        for pattern in patterns:
            matches = re.findall(pattern, message.lower())
            refs.extend(matches)
        
        # Codes ASIN
        asins = re.findall(r'\b(B0[A-Z0-9]{8,})\b', message.upper())
        refs.extend(asins)
        
        # Nettoyer et dédupliquer
        stopwords = {'le', 'la', 'les', 'un', 'une', 'de', 'du', 'des', 'et', 'ou'}
        cleaned = []
        seen = set()
        for ref in refs:
            ref_clean = ref.strip().lower()
            if ref_clean not in seen and ref_clean not in stopwords and len(ref_clean) > 1:
                seen.add(ref_clean)
                cleaned.append(ref.strip())
        
        return cleaned
    
    def get_intelligent_context(self, understanding: Dict) -> Dict[str, Any]:
        """
        Construit un contexte intelligent basé sur la compréhension du message.
        Ne récupère QUE les données pertinentes pour éviter la surcharge.
        """
        context = {}
        
        # Toujours inclure les stats de base
        try:
            context['today'] = self._get_today_summary()
        except:
            context['today'] = {}
        
        # Récupérer selon les besoins
        if understanding.get('needs_products') or understanding.get('product_references'):
            context['inventory'] = self._get_inventory_summary()
            
            # Si références spécifiques, les chercher
            if understanding.get('product_references'):
                context['searched_products'] = self._search_products(understanding['product_references'])
        
        if understanding.get('needs_sales'):
            context['sales_summary'] = self._get_sales_summary()
        
        if understanding.get('needs_vendors'):
            context['vendors'] = self._get_vendors_summary()
        
        if understanding.get('needs_categories'):
            context['categories'] = self._get_categories_summary()
        
        if understanding.get('needs_alerts'):
            context['alerts'] = self._get_alerts_summary()
        
        return context
    
    def _get_today_summary(self) -> Dict:
        """Résumé du jour"""
        try:
            query = """
                SELECT 
                    COUNT(DISTINCT s.id) as ventes,
                    COALESCE(SUM(s.total_amount), 0) as ca,
                    COUNT(DISTINCT s.user_id) as vendeurs_actifs
                FROM sale s
                WHERE DATE(s.sale_date) = CURRENT_DATE AND s.status != 'CANCELLED'
            """
            df = db.get_dataframe(query)
            return db.df_to_dict(df)[0] if not df.empty else {}
        except:
            return {}
    
    def _get_inventory_summary(self) -> Dict:
        """Résumé de l'inventaire"""
        try:
            query = """
                SELECT
                    COUNT(*) as total_products,
                    SUM(CASE WHEN stock = 0 THEN 1 ELSE 0 END) as ruptures,
                    SUM(CASE WHEN stock > 0 AND stock < 10 THEN 1 ELSE 0 END) as stock_faible,
                    SUM(CASE WHEN stock >= 10 THEN 1 ELSE 0 END) as stock_ok,
                    COALESCE(SUM(stock * price), 0) as valeur_inventaire
                FROM product
            """
            df = db.get_dataframe(query)
            return db.df_to_dict(df)[0] if not df.empty else {}
        except:
            return {}
    
    def _get_sales_summary(self) -> Dict:
        """Résumé des ventes"""
        try:
            return db.get_sales_overview()
        except:
            return {}
    
    def _get_vendors_summary(self) -> List[Dict]:
        """Résumé des vendeurs"""
        try:
            df = db.get_all_vendors()
            return db.df_to_dict(df.head(10))
        except:
            return []
    
    def _get_categories_summary(self) -> List[Dict]:
        """Résumé des catégories"""
        try:
            df = db.get_all_categories()
            return db.df_to_dict(df)
        except:
            return []
    
    def _get_alerts_summary(self) -> Dict:
        """Résumé des alertes"""
        try:
            alerts = {
                'ruptures': [],
                'stock_faible': [],
                'count_ruptures': 0,
                'count_faible': 0
            }
            
            # Ruptures
            rupture_df = db.get_out_of_stock_products(limit=10)
            if not rupture_df.empty:
                alerts['ruptures'] = db.df_to_dict(rupture_df)
                alerts['count_ruptures'] = len(rupture_df)
            
            # Stock faible
            low_df = db.get_low_stock_products(threshold=10)
            low_stock = [p for p in db.df_to_dict(low_df) if p.get('stock', 0) > 0]
            alerts['stock_faible'] = low_stock[:10]
            alerts['count_faible'] = len(low_stock)
            
            return alerts
        except:
            return {}
    
    def _search_products(self, refs: List[str]) -> List[Dict]:
        """Recherche des produits par références"""
        found = []
        for ref in refs[:5]:  # Limiter à 5 recherches
            try:
                # Par ID
                if ref.isdigit():
                    product = db.get_product_by_id(int(ref))
                    if product:
                        found.append(product)
                        continue
                
                # Par recherche
                results = db.smart_search_products(ref, limit=3)
                if not results.empty:
                    found.extend(db.df_to_dict(results))
            except:
                continue
        
        return found
    
    def generate_smart_response(self, message: str, data: Dict) -> str:
        """
        Génère une réponse intelligente basée sur les données et le message.
        À utiliser comme fallback quand le LLM n'est pas disponible.
        """
        message_lower = message.lower()
        
        # Réponses contextuelles
        if 'rupture' in message_lower:
            alerts = data.get('alerts', {})
            if alerts.get('count_ruptures', 0) > 0:
                response = f"🔴 **{alerts['count_ruptures']} produit(s) en rupture de stock:**\n\n"
                for p in alerts.get('ruptures', [])[:10]:
                    response += f"• {p.get('title', 'N/A')[:40]} - {p.get('price', 0):,.2f} MAD\n"
                return response
            else:
                return "✅ Aucun produit en rupture de stock actuellement."
        
        if 'stock faible' in message_lower or 'faible stock' in message_lower:
            alerts = data.get('alerts', {})
            if alerts.get('count_faible', 0) > 0:
                response = f"🟡 **{alerts['count_faible']} produit(s) avec stock faible:**\n\n"
                for p in alerts.get('stock_faible', [])[:10]:
                    response += f"• {p.get('title', 'N/A')[:40]} - Stock: {p.get('stock', 0)}\n"
                return response
            else:
                return "✅ Tous les produits ont un stock suffisant."
        
        # Produits trouvés
        if data.get('searched_products'):
            products = data['searched_products']
            response = f"📦 **{len(products)} produit(s) trouvé(s):**\n\n"
            for p in products[:5]:
                response += f"• **{p.get('title', 'N/A')[:40]}**\n"
                response += f"  ID: {p.get('id')} | Prix: {p.get('price', 0):,.2f} MAD | Stock: {p.get('stock', 0)}\n"
            return response
        
        # Fallback
        today = data.get('today', {})
        if today:
            return f"""📊 **Résumé du jour:**
• Ventes: {today.get('ventes', 0)}
• CA: {today.get('ca', 0):,.2f} MAD
• Vendeurs actifs: {today.get('vendeurs_actifs', 0)}

Comment puis-je vous aider?"""
        
        return "Je suis là pour vous aider avec les informations sur les produits, ventes, stocks et plus encore. Que souhaitez-vous savoir?"


# Instance globale
smart_assistant = SmartAssistant()
