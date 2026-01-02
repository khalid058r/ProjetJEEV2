"""
Fallback - Module de réponses de secours quand Groq/LLM est indisponible
Fournit des réponses basiques basées sur les données locales
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
from database import db, convert_to_native

class FallbackResponder:
    """
    Générateur de réponses de secours quand le LLM est hors-ligne.
    Utilise uniquement les données de la base de données.
    """
    
    def __init__(self):
        self.greeting_responses = [
            "Bonjour ! Je suis en mode hors-ligne, mais je peux toujours vous aider avec les données de base.",
            "Salut ! Le service LLM est temporairement indisponible. Je peux quand même répondre à vos questions simples.",
            "Bienvenue ! Mode simplifié actif. Je reste à votre service pour les requêtes basiques."
        ]
        
        self.error_responses = [
            "Désolé, je n'ai pas pu traiter cette demande. Essayez une question plus simple.",
            "Je suis en mode limité. Essayez de demander : 'top produits', 'ventes du jour', ou 'stock faible'.",
            "Service en mode dégradé. Questions supportées : produits, ventes, stock."
        ]
    
    def generate_response(self, intent: str, message: str, entities: Dict, role: str) -> Dict[str, Any]:
        """
        Génère une réponse de secours basée sur l'intention détectée.
        """
        try:
            # Map des handlers de fallback
            handlers = {
                'search_product': self._fallback_search_product,
                'product_details': self._fallback_product_details,
                'low_stock_products': self._fallback_low_stock,
                'top_rated_products': self._fallback_top_rated,
                'best_selling_products': self._fallback_best_selling,
                'sales_overview': self._fallback_sales_overview,
                'daily_sales': self._fallback_daily_sales,
                'global_statistics': self._fallback_global_stats,
                'inventory_status': self._fallback_inventory,
                'greeting': self._fallback_greeting,
                'help': self._fallback_help,
            }
            
            handler = handlers.get(intent, self._fallback_generic)
            return handler(message, entities)
            
        except Exception as e:
            return {
                'success': True,
                'message': f"⚠️ Mode hors-ligne. Erreur: {str(e)}",
                'fallback': True
            }
    
    # ============ Handlers de Fallback ============
    
    def _fallback_greeting(self, message: str, entities: Dict) -> Dict[str, Any]:
        """Réponse de salutation"""
        import random
        return {
            'success': True,
            'message': random.choice(self.greeting_responses),
            'fallback': True
        }
    
    def _fallback_help(self, message: str, entities: Dict) -> Dict[str, Any]:
        """Aide en mode fallback"""
        return {
            'success': True,
            'message': """⚠️ **Mode Hors-Ligne Actif**

Je peux répondre aux questions suivantes sans le LLM:

📦 **Produits:**
- "Chercher [nom produit]"
- "Top produits"
- "Stock faible"
- "Produits en rupture"

💰 **Ventes:**
- "Ventes du jour"
- "Aperçu des ventes"
- "Statistiques globales"

📊 **Inventaire:**
- "État du stock"
- "Inventaire"

_Le service complet sera restauré dès que le LLM sera disponible._""",
            'fallback': True
        }
    
    def _fallback_search_product(self, message: str, entities: Dict) -> Dict[str, Any]:
        """Recherche de produit"""
        search_term = entities.get('search_query', '')
        
        if not search_term:
            # Essayer d'extraire un terme de recherche du message
            import re
            match = re.search(r'(?:chercher?|trouver?|rechercher?)\s+(.+)', message.lower())
            if match:
                search_term = match.group(1).strip()
        
        if not search_term:
            return {
                'success': True,
                'message': "⚠️ Mode simplifié. Précisez le nom du produit à chercher.",
                'fallback': True
            }
        
        try:
            results = db.smart_search_products(search_term, limit=5)
            if results.empty:
                return {
                    'success': True,
                    'message': f"❌ Aucun produit trouvé pour '{search_term}'",
                    'fallback': True
                }
            
            lines = [f"🔍 **Résultats pour '{search_term}':**\n"]
            for _, p in results.iterrows():
                stock_status = "🔴" if p.get('stock', 0) == 0 else "🟡" if p.get('stock', 0) < 10 else "✅"
                lines.append(f"{stock_status} **{p.get('title', 'N/A')[:40]}**")
                lines.append(f"   💰 {p.get('price', 0):,.2f} MAD | 📦 Stock: {p.get('stock', 0)}")
            
            return {
                'success': True,
                'message': '\n'.join(lines),
                'data': {'products': convert_to_native(results.to_dict('records'))},
                'fallback': True
            }
        except Exception as e:
            return {
                'success': True,
                'message': f"⚠️ Erreur recherche: {str(e)}",
                'fallback': True
            }
    
    def _fallback_product_details(self, message: str, entities: Dict) -> Dict[str, Any]:
        """Détails d'un produit"""
        product_id = entities.get('product_id')
        
        if not product_id:
            import re
            match = re.search(r'\b(\d{1,6})\b', message)
            if match:
                product_id = int(match.group(1))
        
        if not product_id:
            return {
                'success': True,
                'message': "⚠️ Précisez l'ID du produit (ex: 'produit 123')",
                'fallback': True
            }
        
        try:
            product = db.get_product_by_id(product_id)
            if not product:
                return {
                    'success': True,
                    'message': f"❌ Produit #{product_id} non trouvé",
                    'fallback': True
                }
            
            stock_status = "🔴 RUPTURE" if product.get('stock', 0) == 0 else "🟡 Stock faible" if product.get('stock', 0) < 10 else "✅ En stock"
            
            msg = f"""📦 **{product.get('title', 'N/A')}**

🆔 ID: {product.get('id')}
📝 ASIN: {product.get('asin', 'N/A')}
💰 Prix: {product.get('price', 0):,.2f} MAD
📊 Stock: {product.get('stock', 0)} unités {stock_status}
🏷️ Catégorie: {product.get('category_name', 'N/A')}
⭐ Note: {product.get('rating', 'N/A')}/5"""

            return {
                'success': True,
                'message': msg,
                'data': {'product': product},
                'fallback': True
            }
        except Exception as e:
            return {
                'success': True,
                'message': f"⚠️ Erreur: {str(e)}",
                'fallback': True
            }
    
    def _fallback_low_stock(self, message: str, entities: Dict) -> Dict[str, Any]:
        """Produits en stock faible/rupture"""
        try:
            # Détecter si rupture ou stock faible
            is_rupture = any(kw in message.lower() for kw in ['rupture', 'zero', '0 stock', 'sans stock'])
            
            if is_rupture:
                products = db.get_out_of_stock_products()
                title = "🔴 PRODUITS EN RUPTURE DE STOCK"
            else:
                products = db.get_low_stock_products(threshold=10)
                title = "🟡 PRODUITS À STOCK FAIBLE (<10 unités)"
            
            if products.empty:
                return {
                    'success': True,
                    'message': f"✅ Aucun produit {'en rupture' if is_rupture else 'à stock faible'}!",
                    'fallback': True
                }
            
            lines = [f"**{title}**\n"]
            for i, (_, p) in enumerate(products.head(10).iterrows(), 1):
                lines.append(f"{i}. **{p.get('title', 'N/A')[:35]}**")
                lines.append(f"   Stock: {p.get('stock', 0)} | Prix: {p.get('price', 0):,.2f} MAD")
            
            if len(products) > 10:
                lines.append(f"\n_... et {len(products) - 10} autres produits_")
            
            return {
                'success': True,
                'message': '\n'.join(lines),
                'data': {'products': convert_to_native(products.to_dict('records')), 'count': len(products)},
                'fallback': True
            }
        except Exception as e:
            return {
                'success': True,
                'message': f"⚠️ Erreur: {str(e)}",
                'fallback': True
            }
    
    def _fallback_top_rated(self, message: str, entities: Dict) -> Dict[str, Any]:
        """Top produits par note"""
        try:
            products = db.get_top_rated_products(limit=5)
            
            if products.empty:
                return {
                    'success': True,
                    'message': "❌ Aucun produit noté trouvé",
                    'fallback': True
                }
            
            lines = ["⭐ **TOP PRODUITS PAR NOTE**\n"]
            for i, (_, p) in enumerate(products.iterrows(), 1):
                lines.append(f"{i}. **{p.get('title', 'N/A')[:35]}**")
                lines.append(f"   ⭐ {p.get('rating', 0)}/5 | 💰 {p.get('price', 0):,.2f} MAD")
            
            return {
                'success': True,
                'message': '\n'.join(lines),
                'data': {'products': convert_to_native(products.to_dict('records'))},
                'fallback': True
            }
        except Exception as e:
            return {
                'success': True,
                'message': f"⚠️ Erreur: {str(e)}",
                'fallback': True
            }
    
    def _fallback_best_selling(self, message: str, entities: Dict) -> Dict[str, Any]:
        """Meilleures ventes"""
        try:
            products = db.get_best_selling_products(limit=5)
            
            if products.empty:
                return {
                    'success': True,
                    'message': "❌ Aucune vente enregistrée",
                    'fallback': True
                }
            
            lines = ["🏆 **MEILLEURES VENTES**\n"]
            for i, (_, p) in enumerate(products.iterrows(), 1):
                lines.append(f"{i}. **{p.get('title', 'N/A')[:35]}**")
                lines.append(f"   Vendus: {p.get('total_sold', 0)} | CA: {p.get('total_revenue', 0):,.2f} MAD")
            
            return {
                'success': True,
                'message': '\n'.join(lines),
                'data': {'products': convert_to_native(products.to_dict('records'))},
                'fallback': True
            }
        except Exception as e:
            return {
                'success': True,
                'message': f"⚠️ Erreur: {str(e)}",
                'fallback': True
            }
    
    def _fallback_sales_overview(self, message: str, entities: Dict) -> Dict[str, Any]:
        """Aperçu des ventes"""
        try:
            overview = db.get_sales_overview()
            
            msg = f"""📊 **APERÇU DES VENTES**

💰 CA Total: {overview.get('total_revenue', 0):,.2f} MAD
🛒 Transactions: {overview.get('total_sales', 0)}
📦 Articles vendus: {overview.get('total_items_sold', 0)}
💵 Panier moyen: {overview.get('avg_order_value', 0):,.2f} MAD

_Mode hors-ligne - données en temps réel_"""
            
            return {
                'success': True,
                'message': msg,
                'data': {'overview': convert_to_native(overview)},
                'fallback': True
            }
        except Exception as e:
            return {
                'success': True,
                'message': f"⚠️ Erreur: {str(e)}",
                'fallback': True
            }
    
    def _fallback_daily_sales(self, message: str, entities: Dict) -> Dict[str, Any]:
        """Ventes du jour"""
        try:
            sales = db.get_today_sales_live()
            
            if not sales:
                return {
                    'success': True,
                    'message': "📊 Aucune vente aujourd'hui pour l'instant.",
                    'fallback': True
                }
            
            total = sum(s.get('total_amount', 0) for s in sales)
            
            lines = [f"📊 **VENTES D'AUJOURD'HUI** ({datetime.now().strftime('%d/%m/%Y')})\n"]
            lines.append(f"💰 CA du jour: {total:,.2f} MAD")
            lines.append(f"🛒 {len(sales)} transaction(s)\n")
            
            for s in sales[:5]:
                lines.append(f"• #{s.get('id')} - {s.get('vendeur', 'N/A')}: {s.get('total_amount', 0):,.2f} MAD")
            
            return {
                'success': True,
                'message': '\n'.join(lines),
                'data': {'sales': sales, 'total': total},
                'fallback': True
            }
        except Exception as e:
            return {
                'success': True,
                'message': f"⚠️ Erreur: {str(e)}",
                'fallback': True
            }
    
    def _fallback_global_stats(self, message: str, entities: Dict) -> Dict[str, Any]:
        """Statistiques globales"""
        try:
            live_data = db.get_live_dashboard_data()
            
            counts = live_data.get('counts', {})
            today = live_data.get('today', {})
            
            msg = f"""📊 **STATISTIQUES GLOBALES**

📦 Produits: {counts.get('total_products', 0)}
🏷️ Catégories: {counts.get('total_categories', 0)}
👥 Vendeurs: {counts.get('total_vendors', 0)}
🛒 Transactions totales: {counts.get('total_sales', 0)}

**Aujourd'hui:**
💰 CA: {today.get('ca_aujourdhui', 0):,.2f} MAD
🛒 Ventes: {today.get('ventes_aujourdhui', 0)}

_Mode hors-ligne_"""
            
            return {
                'success': True,
                'message': msg,
                'data': live_data,
                'fallback': True
            }
        except Exception as e:
            return {
                'success': True,
                'message': f"⚠️ Erreur: {str(e)}",
                'fallback': True
            }
    
    def _fallback_inventory(self, message: str, entities: Dict) -> Dict[str, Any]:
        """État de l'inventaire"""
        try:
            inventory = db.get_inventory_status()
            
            if inventory.empty:
                return {
                    'success': True,
                    'message': "❌ Impossible de récupérer l'inventaire",
                    'fallback': True
                }
            
            total_stock = inventory['stock'].sum() if 'stock' in inventory.columns else 0
            out_of_stock = len(inventory[inventory['stock'] == 0]) if 'stock' in inventory.columns else 0
            low_stock = len(inventory[(inventory['stock'] > 0) & (inventory['stock'] < 10)]) if 'stock' in inventory.columns else 0
            
            msg = f"""📦 **ÉTAT DE L'INVENTAIRE**

📊 Stock total: {total_stock:,} unités
🔴 En rupture: {out_of_stock} produits
🟡 Stock faible: {low_stock} produits
✅ Stock OK: {len(inventory) - out_of_stock - low_stock} produits

_Mode hors-ligne_"""
            
            return {
                'success': True,
                'message': msg,
                'fallback': True
            }
        except Exception as e:
            return {
                'success': True,
                'message': f"⚠️ Erreur: {str(e)}",
                'fallback': True
            }
    
    def _fallback_generic(self, message: str, entities: Dict) -> Dict[str, Any]:
        """Réponse générique quand l'intention n'est pas gérée"""
        import random
        return {
            'success': True,
            'message': random.choice(self.error_responses),
            'fallback': True
        }


# Instance globale
fallback_responder = FallbackResponder()
