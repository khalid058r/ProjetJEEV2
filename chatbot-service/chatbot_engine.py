from typing import Dict, Any, Optional, List
from intent_classifier import Intent, intent_classifier
from database import db, convert_to_native
from groq_client import groq_client
from smart_assistant import smart_assistant
import pandas as pd

# Import des modules d'amélioration
try:
    from kpi_engine import kpi_engine
    KPI_AVAILABLE = True
except ImportError:
    KPI_AVAILABLE = False

try:
    from response_formatter import response_formatter
    FORMATTER_AVAILABLE = True
except ImportError:
    FORMATTER_AVAILABLE = False

class ChatbotEngine:
    """Moteur principal du chatbot qui orchestre les intentions et les réponses"""

    def __init__(self):
        self.smart = smart_assistant  # Assistant intelligent
        self.kpi = kpi_engine if KPI_AVAILABLE else None
        self.formatter = response_formatter if FORMATTER_AVAILABLE else None
        self.intent_handlers = {
            # Produits
            Intent.SEARCH_PRODUCT: self._handle_search_product,
            Intent.PRODUCT_DETAILS: self._handle_product_details,
            Intent.PRODUCTS_BY_CATEGORY: self._handle_products_by_category,
            Intent.TOP_RATED_PRODUCTS: self._handle_top_rated,
            Intent.BEST_SELLING_PRODUCTS: self._handle_best_selling,
            Intent.LOW_STOCK_PRODUCTS: self._handle_low_stock,
            Intent.SLOW_MOVING_PRODUCTS: self._handle_slow_moving,
            Intent.FAST_MOVING_PRODUCTS: self._handle_fast_moving,
            Intent.PRODUCT_ROTATION: self._handle_product_rotation,
            Intent.PRODUCT_PROFITABILITY: self._handle_product_profitability,
            Intent.PRODUCT_COMPARISON: self._handle_product_comparison,
            
            # Ventes et Transactions
            Intent.SALES_OVERVIEW: self._handle_sales_overview,
            Intent.DAILY_SALES: self._handle_daily_sales,
            Intent.WEEKLY_SALES: self._handle_weekly_sales,
            Intent.MONTHLY_SALES: self._handle_monthly_sales,
            Intent.TRANSACTION_DETAILS: self._handle_transaction_details,
            Intent.TRANSACTION_LIST: self._handle_transaction_list,
            Intent.RECENT_TRANSACTIONS: self._handle_recent_transactions,
            Intent.VENDOR_TRANSACTIONS: self._handle_vendor_transactions,
            
            # Analytics avancées
            Intent.CATEGORY_PERFORMANCE: self._handle_category_performance,
            Intent.INVENTORY_STATUS: self._handle_inventory_status,
            Intent.GLOBAL_STATISTICS: self._handle_global_stats,
            Intent.PROFIT_ANALYSIS: self._handle_profit_analysis,
            Intent.FORECAST_SALES: self._handle_forecast_sales,
            Intent.KPI_TRACKING: self._handle_kpi_tracking,
            Intent.TRENDS_ANALYSIS: self._handle_trends_analysis,
            Intent.COMPARE_PERIODS: self._handle_compare_periods,
            Intent.SEASONALITY_ANALYSIS: self._handle_seasonality_analysis,
            Intent.REVENUE_BREAKDOWN: self._handle_revenue_breakdown,
            Intent.GOAL_PROGRESS: self._handle_goal_progress,
            Intent.PERFORMANCE_SUMMARY: self._handle_performance_summary,
            
            # Vendeurs
            Intent.VENDOR_PERFORMANCE: self._handle_vendor_performance,
            Intent.VENDOR_RANKING: self._handle_vendor_ranking,
            Intent.VENDOR_COMPARISON: self._handle_vendor_comparison,
            Intent.MY_STATS: self._handle_my_stats,
            
            # Alertes et Insights
            Intent.RECENT_ALERTS: self._handle_alerts,
            Intent.CRITICAL_ALERTS: self._handle_critical_alerts,
            Intent.SMART_INSIGHTS: self._handle_smart_insights,
            Intent.RECOMMENDATIONS: self._handle_recommendations,
            
            # Rapports
            Intent.DAILY_REPORT: self._handle_daily_report,
            Intent.WEEKLY_REPORT: self._handle_weekly_report,
            Intent.MONTHLY_REPORT: self._handle_monthly_report,
            Intent.EXECUTIVE_SUMMARY: self._handle_executive_summary,
            
            # Général
            Intent.GREETING: self._handle_greeting,
            Intent.HELP: self._handle_help,
            Intent.GENERAL_QUESTION: self._handle_general_question,
            Intent.UNKNOWN: self._handle_unknown,
        }

    def process_message(self, user_id: str, message: str, user_role: str = 'VENDEUR') -> Dict[str, Any]:
        """
        Traite un message utilisateur et génère une réponse INTELLIGENTE.
        Cette méthode:
        1. Classifie l'intention du message
        2. Extrait les entités (produits, dates, etc.)
        3. Récupère les données pertinentes en temps réel
        4. Génère une réponse enrichie avec le contexte complet
        """

        # Classifie l'intention
        intent, entities = intent_classifier.classify(message)
        
        # ============ NOUVEAU: Recherche intelligente de produits ============
        # Si le message mentionne un produit, on le cherche dans la BDD
        if entities.get('product_references'):
            found_products = []
            for ref in entities['product_references']:
                # Recherche par ID si numérique
                if ref.isdigit():
                    product = db.get_product_by_id(int(ref))
                    if product:
                        found_products.append(product)
                        continue
                
                # Recherche intelligente par nom/ASIN
                results = db.smart_search_products(ref, limit=5)
                if not results.empty:
                    found_products.extend(db.df_to_dict(results))
            
            if found_products:
                entities['found_products'] = found_products
        
        # ============ NOUVEAU: Contexte complet pour le LLM ============
        # Récupère les données live pertinentes selon le message
        live_context = db.build_full_context_for_message(message)
        entities['live_context'] = live_context

        # Récupère le handler approprié
        handler = self.intent_handlers.get(intent, self._handle_unknown)

        # Exécute le handler avec le contexte enrichi
        try:
            result = handler(user_id, message, entities, user_role)
            result['intent'] = intent.value
            result['entities'] = {k: v for k, v in entities.items() if k != 'live_context'}  # Ne pas renvoyer tout le contexte
            return result
        except Exception as e:
            # En cas d'erreur, on essaie quand même de répondre intelligemment
            return self._handle_error_with_ai(user_id, message, entities, user_role, str(e), intent=intent.value)

    def _format_products_list(self, df: pd.DataFrame, max_items: int = 5) -> str:
        """Formate une liste de produits pour l'affichage"""
        if df.empty:
            return "Aucun produit trouvé."

        lines = []
        for i, row in df.head(max_items).iterrows():
            title = row.get('title', 'N/A')[:40]
            price = row.get('price', 0)
            stock = row.get('stock', 0)
            rating = row.get('rating', None)

            line = f"📦 **{title}**"
            if price:
                line += f" | 💰 {price:.2f} MAD"
            if stock is not None:
                line += f" | 📊 Stock: {stock}"
            if rating:
                line += f" | ⭐ {rating:.1f}"
            lines.append(line)

        if len(df) > max_items:
            lines.append(f"\n... et {len(df) - max_items} autres produits")

        return '\n'.join(lines)

    # ============ HANDLERS ============

    def _handle_error_with_ai(self, user_id: str, message: str, entities: Dict, role: str, error: str, intent: str = None) -> Dict:
        """Gère les erreurs en utilisant l'IA pour générer une réponse utile"""
        try:
            context = entities.get('live_context', {})
            response = groq_client.chat(
                user_id,
                f"L'utilisateur a demandé: '{message}'. Une erreur technique s'est produite ({error}). "
                "Réponds de manière utile avec les données disponibles.",
                role,
                context,
                intent=intent,
                entities=entities
            )
            return {
                'success': True,
                'message': response.get('message', response) if isinstance(response, dict) else response,
                'data': {},
                'had_error': True
            }
        except:
            return {
                'success': False,
                'message': f"❌ Une erreur s'est produite: {error}",
                'error': error
            }

    def _handle_search_product(self, user_id: str, message: str, entities: Dict, role: str) -> Dict:
        """Recherche de produits - AMÉLIORÉ avec recherche intelligente"""
        
        # 1. Vérifier si des produits ont déjà été trouvés
        if entities.get('found_products'):
            products = entities['found_products']
            lines = []
            for i, p in enumerate(products[:10]):
                title = p.get('title', 'N/A')[:40]
                price = p.get('price', 0)
                stock = p.get('stock', 0)
                lines.append(f"📦 **{title}**\n   💰 {price:.2f} MAD | 📊 Stock: {stock}")
            
            formatted = '\n'.join(lines)
            return {
                'success': True,
                'message': f"🔍 **{len(products)} produit(s) trouvé(s):**\n\n{formatted}",
                'data': {'products': products}
            }
        
        # 2. Sinon, faire une recherche intelligente
        query = entities.get('query', '')
        if not query:
            # Extraire de product_references
            refs = entities.get('product_references', [])
            if refs:
                query = refs[0]
            else:
                # Extraire les mots clés du message
                query = message
        
        if not query:
            return {
                'success': True,
                'message': "🔍 Que recherchez-vous ? Donnez-moi un nom de produit, une catégorie ou un ASIN."
            }

        # Recherche intelligente
        products_df = db.smart_search_products(query, limit=15)

        if products_df.empty:
            # Utiliser l'IA pour suggérer des alternatives
            context = entities.get('live_context', {})
            context['search_query'] = query
            context['search_failed'] = True
            
            ai_response = groq_client.chat(
                user_id,
                f"L'utilisateur cherche '{query}' mais aucun produit n'a été trouvé. "
                "Suggère des alternatives ou demande plus de précisions.",
                role,
                context
            )
            return {
                'success': True,
                'message': ai_response,
                'data': {'products': [], 'query': query}
            }

        products_list = convert_to_native(products_df.to_dict('records'))
        formatted = self._format_products_list(products_df, max_items=10)

        return {
            'success': True,
            'message': f"🔍 **Résultats pour \"{query}\"** ({len(products_df)} trouvés):\n\n{formatted}",
            'data': {'products': products_list, 'query': query}
        }

    def _handle_product_details(self, user_id: str, message: str, entities: Dict, role: str) -> Dict:
        """Détails d'un produit spécifique - AMÉLIORÉ"""
        
        # 1. Vérifier si des produits ont été trouvés
        found_products = entities.get('found_products', [])
        if found_products:
            product = found_products[0]
            return self._format_product_details_response(product, entities, user_id, role)
        
        # 2. Chercher par ID
        product_id = entities.get('product_id')
        if product_id:
            product = db.get_product_by_id(product_id)
            if product:
                return self._format_product_details_response(product, entities, user_id, role)
        
        # 3. Chercher par références
        refs = entities.get('product_references', [])
        for ref in refs:
            if ref.isdigit():
                product = db.get_product_by_id(int(ref))
                if product:
                    return self._format_product_details_response(product, entities, user_id, role)
            
            # Recherche par nom
            results = db.smart_search_products(ref, limit=1)
            if not results.empty:
                product = db.df_to_dict(results)[0]
                return self._format_product_details_response(product, entities, user_id, role)
        
        # 4. Aucun produit trouvé - utiliser l'IA pour aider
        context = entities.get('live_context', {})
        ai_response = groq_client.chat(
            user_id,
            f"L'utilisateur demande les détails d'un produit: '{message}'. "
            "Aucun produit correspondant n'a été trouvé. Aide-le à trouver ce qu'il cherche.",
            role,
            context
        )
        return {
            'success': True,
            'message': ai_response,
            'data': {}
        }

    def _format_product_details_response(self, product: Dict, entities: Dict, user_id: str, role: str) -> Dict:
        """Formate la réponse détaillée d'un produit avec analyse IA"""
        pid = product.get('id', 'N/A')
        
        response = f"""📦 **Détails du produit #{pid}**

**{product.get('title', 'N/A')}**

📋 **Informations:**
- ASIN: `{product.get('asin', 'N/A')}`
- Catégorie: {product.get('category_name', 'Non catégorisé')}
- Prix: **{product.get('price', 0):,.2f} MAD**
- Stock: **{product.get('stock', 0)}** unités

⭐ **Évaluations:**
- Note: {product.get('rating', 'N/A')} / 5
- Avis: {product.get('review_count', 0)}

📊 **Performance ventes:**
- Quantité vendue: {product.get('total_sold', 0)} unités
- Revenu généré: {product.get('total_revenue', 0):,.2f} MAD
- Transactions: {product.get('nb_transactions', 0)}
"""
        
        # Ajouter des alertes si pertinent
        stock = product.get('stock', 0)
        if stock == 0:
            response += "\n🔴 **ALERTE:** Ce produit est en RUPTURE DE STOCK!"
        elif stock < 10:
            response += f"\n🟡 **ATTENTION:** Stock faible ({stock} unités restantes)"
        
        # Ajouter analyse IA si contexte disponible
        try:
            context = entities.get('live_context', {})
            context['current_product'] = product
            ai_insight = groq_client.get_quick_response(
                f"Donne un insight rapide (2-3 phrases) sur ce produit: {product.get('title')}. "
                f"Prix: {product.get('price')} MAD, Stock: {stock}, Vendu: {product.get('total_sold', 0)}",
                context
            )
            if ai_insight and len(ai_insight) < 500:
                response += f"\n\n💡 **Insight:** {ai_insight}"
        except:
            pass
        
        return {
            'success': True,
            'message': response,
            'data': {'product': product}
        }

    def _handle_products_by_category(self, user_id: str, message: str, entities: Dict, role: str) -> Dict:
        """Produits par catégorie"""
        category = entities.get('category') or entities.get('query', '')
        if not category:
            # Liste les catégories disponibles
            cats = db.get_category_performance()
            cat_list = '\n'.join([f"- {c['category']}" for c in convert_to_native(cats.to_dict('records'))[:10]])
            return {
                'success': True,
                'message': f"🏷️ **Catégories disponibles:**\n\n{cat_list}\n\n💡 Dites-moi quelle catégorie vous intéresse."
            }

        products_df = db.get_products_by_category(category, limit=10)
        if products_df.empty:
            return {
                'success': True,
                'message': f"❌ Aucun produit trouvé dans la catégorie \"{category}\"."
            }

        formatted = self._format_products_list(products_df)
        return {
            'success': True,
            'message': f"🏷️ **Produits - {category}** ({len(products_df)}):\n\n{formatted}",
            'data': {'products': convert_to_native(products_df.to_dict('records')), 'category': category}
        }

    def _handle_top_rated(self, user_id: str, message: str, entities: Dict, role: str) -> Dict:
        """Produits les mieux notés"""
        limit = entities.get('limit', 10)
        products_df = db.get_top_rated_products(limit=limit)

        if products_df.empty:
            return {'success': True, 'message': "Aucun produit noté trouvé."}

        lines = []
        for i, row in products_df.iterrows():
            medal = ['🥇', '🥈', '🥉'][i] if i < 3 else f"{i+1}."
            lines.append(f"{medal} **{row['title'][:35]}** | ⭐ {row['rating']:.1f} ({row['review_count']} avis)")

        return {
            'success': True,
            'message': f"⭐ **Top {limit} - Produits les mieux notés:**\n\n" + '\n'.join(lines),
            'data': {'products': convert_to_native(products_df.to_dict('records'))}
        }

    def _handle_best_selling(self, user_id: str, message: str, entities: Dict, role: str) -> Dict:
        """Produits les plus vendus"""
        limit = entities.get('limit', 10)
        products_df = db.get_best_selling_products(limit=limit)

        if products_df.empty:
            return {'success': True, 'message': "Aucune vente enregistrée."}

        lines = []
        for i, row in products_df.iterrows():
            medal = ['🥇', '🥈', '🥉'][i] if i < 3 else f"{i+1}."
            lines.append(f"{medal} **{row['title'][:35]}** | {row['total_quantity']:.0f} vendus | {row['total_revenue']:.2f} MAD")

        return {
            'success': True,
            'message': f"🏆 **Top {limit} - Meilleures ventes:**\n\n" + '\n'.join(lines),
            'data': {'products': convert_to_native(products_df.to_dict('records'))}
        }

    def _handle_low_stock(self, user_id: str, message: str, entities: Dict, role: str) -> Dict:
        """Produits en stock faible OU en rupture"""
        message_lower = message.lower()
        
        # Détecter si l'utilisateur demande spécifiquement les ruptures
        is_rupture_request = any(word in message_lower for word in ['rupture', 'epuise', 'épuisé', 'plus de stock', '0 stock', 'zero stock'])
        
        if is_rupture_request:
            # Produits EN RUPTURE uniquement (stock = 0)
            products_df = db.get_out_of_stock_products(limit=30)
            
            if products_df.empty:
                return {
                    'success': True,
                    'message': "✅ **Excellente nouvelle!** Aucun produit n'est en rupture de stock. Tous les produits sont disponibles."
                }
            
            lines = []
            total_lost_sales = 0
            for _, row in products_df.head(15).iterrows():
                hist_ventes = row.get('historique_ventes', 0)
                lines.append(f"🔴 **{row['title'][:40]}**")
                lines.append(f"   Prix: {row.get('price', 0):,.2f} MAD | Catégorie: {row.get('category', 'N/A')}")
                if hist_ventes > 0:
                    lines.append(f"   📊 Historique: {hist_ventes} ventes passées")
            
            response = f"🚨 **PRODUITS EN RUPTURE DE STOCK ({len(products_df)} produits)**\n\n"
            response += '\n'.join(lines)
            
            if len(products_df) > 15:
                response += f"\n\n... et {len(products_df) - 15} autres produits en rupture"
            
            response += "\n\n⚠️ **Action requise:** Ces produits nécessitent un réapprovisionnement urgent!"
            
            return {
                'success': True,
                'message': response,
                'data': {'products': convert_to_native(products_df.to_dict('records')), 'type': 'rupture'}
            }
        
        else:
            # Stock faible (incluant les ruptures)
            threshold = entities.get('numbers', [10])[0] if entities.get('numbers') else 10
            products_df = db.get_low_stock_products(threshold=threshold)

            if products_df.empty:
                return {
                    'success': True,
                    'message': f"✅ Aucun produit avec un stock inférieur à {threshold}. Tout va bien !"
                }

            # Séparer ruptures et stock faible
            ruptures = [p for p in products_df.to_dict('records') if p.get('stock', 0) == 0]
            low = [p for p in products_df.to_dict('records') if p.get('stock', 0) > 0]
            
            response = f"⚠️ **ALERTES STOCK ({len(products_df)} produits)**\n\n"
            
            if ruptures:
                response += f"🔴 **EN RUPTURE ({len(ruptures)}):**\n"
                for p in ruptures[:5]:
                    response += f"   • {p['title'][:35]} - {p.get('price', 0):,.2f} MAD\n"
                if len(ruptures) > 5:
                    response += f"   ... et {len(ruptures) - 5} autres\n"
            
            if low:
                response += f"\n🟡 **STOCK FAIBLE ({len(low)}):**\n"
                for p in low[:5]:
                    response += f"   • {p['title'][:35]} - Stock: {p['stock']}\n"
                if len(low) > 5:
                    response += f"   ... et {len(low) - 5} autres\n"

            return {
                'success': True,
                'message': response,
                'data': {'products': convert_to_native(products_df.to_dict('records')), 'threshold': threshold}
            }

    def _handle_sales_overview(self, user_id: str, message: str, entities: Dict, role: str) -> Dict:
        """Aperçu des ventes avec analyse intelligente - AMÉLIORÉ avec KPI Engine"""
        
        # ============ NOUVEAU: Utiliser le KPI Engine ============
        if self.kpi and self.formatter:
            try:
                sales_kpis = self.kpi.get_sales_kpis()
                trend_kpis = self.kpi.get_trend_kpis()
                f = self.formatter
                
                response = f"""📊 **APERÇU DES VENTES**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 **PERFORMANCE GLOBALE**
┌─────────────────────────────────────────
│ 📈 Chiffre d'Affaires Total: {f.format_currency(sales_kpis.get('total_revenue', 0))}
│ 🛒 Nombre de Transactions: {f.format_number(sales_kpis.get('total_transactions', 0))}
│ 🛍️ Panier Moyen: {f.format_currency(sales_kpis.get('average_basket', 0))}
│ 📊 CA Journalier Moyen: {f.format_currency(sales_kpis.get('daily_average', 0))}
│ 📅 Jours d'Activité: {f.format_number(sales_kpis.get('active_days', 0))}
└─────────────────────────────────────────

📈 **CE MOIS**
┌─────────────────────────────────────────
│ 💵 Revenue: {f.format_currency(sales_kpis.get('current_month_revenue', 0))}
│ 📆 Mois Précédent: {f.format_currency(sales_kpis.get('previous_month_revenue', 0))}
│ {f.trend_indicator(sales_kpis.get('growth_rate', 0))} Croissance: {f.format_percent(sales_kpis.get('growth_rate', 0))}
└─────────────────────────────────────────

⚡ **AUJOURD'HUI**
┌─────────────────────────────────────────
│ 💰 Ventes: {f.format_currency(sales_kpis.get('today_sales', 0))}
│ 🛒 Transactions: {f.format_number(sales_kpis.get('today_transactions', 0))}
└─────────────────────────────────────────

📅 **TENDANCES HEBDOMADAIRES**
┌─────────────────────────────────────────
│ Cette Semaine: {f.format_currency(trend_kpis.get('current_week_revenue', 0))}
│ Semaine Précédente: {f.format_currency(trend_kpis.get('previous_week_revenue', 0))}
│ {f.trend_indicator(trend_kpis.get('week_growth', 0))} Variation: {f.format_percent(trend_kpis.get('week_growth', 0))}
└─────────────────────────────────────────
"""
                # Analyse IA
                context_data = {'sales': sales_kpis, 'trends': trend_kpis}
                ai_response = groq_client.chat(
                    user_id,
                    "Analyse ces données de ventes et donne des insights précis avec les chiffres réels.",
                    role,
                    context_data
                )
                
                if ai_response['success']:
                    response += f"\n💡 **Analyse IA:**\n{ai_response['message']}"
                
                return {
                    'success': True,
                    'message': response,
                    'data': {'sales': sales_kpis, 'trends': trend_kpis}
                }
            except Exception as e:
                pass
        
        # ============ Méthode originale (fallback) ============
        # Recupere le contexte complet pour une analyse intelligente
        context_data = db.get_comprehensive_context()

        overview = context_data.get('overview', {})
        trends = context_data.get('trends', {})

        response = f"""📊 **Aperçu des Ventes**

💰 **Chiffre d'affaires total:** {overview.get('total_revenue', 0):,.2f} MAD
🛒 **Nombre de ventes:** {overview.get('total_sales', 0):,}
📈 **Panier moyen:** {overview.get('avg_order_value', 0):.2f} MAD
📅 **Jours actifs:** {overview.get('active_days', 0)}
"""

        # Ajoute les tendances si disponibles
        if trends:
            ca_sem_act = trends.get('ca_semaine_actuelle', 0)
            ca_sem_prec = trends.get('ca_semaine_precedente', 0)
            if ca_sem_prec > 0:
                var_sem = ((ca_sem_act - ca_sem_prec) / ca_sem_prec) * 100
                tendance = "📈" if var_sem > 0 else "📉"
                response += f"\n{tendance} **Tendance semaine:** {var_sem:+.1f}% vs semaine précédente"

        # Analyse intelligente avec contexte complet
        ai_response = groq_client.chat(
            user_id,
            "Analyse ces données de ventes et donne des insights précis avec les chiffres réels.",
            role,
            context_data
        )

        if ai_response['success']:
            response += f"\n\n💡 **Analyse IA:**\n{ai_response['message']}"

        return {
            'success': True,
            'message': response,
            'data': context_data
        }

    def _handle_daily_sales(self, user_id: str, message: str, entities: Dict, role: str) -> Dict:
        """Ventes journalières"""
        days = entities.get('numbers', [7])[0] if entities.get('numbers') else 7
        sales_df = db.get_daily_sales(days=days)

        if sales_df.empty:
            return {'success': True, 'message': f"Aucune vente ces {days} derniers jours."}

        total_revenue = sales_df['revenue'].sum()
        total_sales = sales_df['sales_count'].sum()

        lines = []
        for _, row in sales_df.head(7).iterrows():
            lines.append(f"📅 {row['date']} | {row['sales_count']:.0f} ventes | {row['revenue']:.2f} MAD")

        return {
            'success': True,
            'message': f"📆 **Ventes - {days} derniers jours:**\n\nTotal: {total_sales:.0f} ventes | {total_revenue:.2f} MAD\n\n" + '\n'.join(lines),
            'data': {'daily_sales': convert_to_native(sales_df.to_dict('records'))}
        }

    def _handle_monthly_sales(self, user_id: str, message: str, entities: Dict, role: str) -> Dict:
        """Ventes mensuelles"""
        months = entities.get('numbers', [6])[0] if entities.get('numbers') else 6
        sales_df = db.get_monthly_sales(months=months)

        if sales_df.empty:
            return {'success': True, 'message': "Aucune vente enregistrée."}

        lines = []
        for _, row in sales_df.iterrows():
            lines.append(f"📅 {row['month']} | {row['sales_count']:.0f} ventes | {row['revenue']:.2f} MAD")

        return {
            'success': True,
            'message': f"📊 **Ventes Mensuelles ({months} mois):**\n\n" + '\n'.join(lines),
            'data': {'monthly_sales': convert_to_native(sales_df.to_dict('records'))}
        }

    def _handle_transaction_details(self, user_id: str, message: str, entities: Dict, role: str) -> Dict:
        """Détails d'une transaction spécifique"""
        transaction_id = entities.get('transaction_id')
        if not transaction_id:
            return {
                'success': True,
                'message': "🔍 Quel numéro de transaction voulez-vous consulter ? (ex: transaction #25)"
            }

        transaction = db.get_transaction_details(transaction_id)
        if not transaction:
            return {
                'success': True,
                'message': f"❌ Transaction #{transaction_id} non trouvée."
            }

        response = f"""🧾 **Détails Transaction #{transaction_id}**

📅 **Date:** {transaction.get('sale_date', 'N/A')}
👤 **Vendeur:** {transaction.get('vendeur', 'N/A')}
📧 **Email:** {transaction.get('vendeur_email', 'N/A')}
💰 **Montant total:** {transaction.get('total_amount', 0):,.2f} MAD
📊 **Status:** {transaction.get('status', 'N/A')}

📦 **Produits achetés ({transaction.get('nb_articles', 0)} articles):**
"""
        if transaction.get('lignes'):
            for i, ligne in enumerate(transaction['lignes'], 1):
                response += f"\n{i}. **{ligne.get('product_name', 'N/A')[:40]}**"
                response += f"\n   Qté: {ligne.get('quantity', 0)} × {ligne.get('unit_price', 0):,.2f} MAD = **{ligne.get('line_total', 0):,.2f} MAD**"
                response += f"\n   Catégorie: {ligne.get('category', 'N/A')}"

        # Ajoute l'analyse IA
        context_data = {'transaction_details': transaction}
        ai_response = groq_client.chat(
            user_id,
            f"Analyse cette transaction #{transaction_id} et donne des insights.",
            role,
            context_data
        )

        if ai_response['success']:
            response += f"\n\n💡 **Analyse:**\n{ai_response['message']}"

        return {
            'success': True,
            'message': response,
            'data': {'transaction': transaction}
        }

    def _handle_transaction_list(self, user_id: str, message: str, entities: Dict, role: str) -> Dict:
        """Liste des transactions"""
        limit = entities.get('limit', 20)
        transactions_df = db.get_all_transactions_detailed(limit=limit)

        if transactions_df.empty:
            return {'success': True, 'message': "Aucune transaction trouvée."}

        transactions = convert_to_native(transactions_df.to_dict('records'))

        response = f"📋 **Liste des Transactions** ({len(transactions)} dernières)\n\n"

        for t in transactions[:15]:
            response += f"🧾 **#{t.get('transaction_id')}** | {t.get('sale_date', 'N/A')}\n"
            response += f"   👤 {t.get('vendeur', 'N/A')} | 💰 {t.get('total_amount', 0):,.2f} MAD | 📦 {t.get('total_articles', 0)} articles\n"
            if t.get('produits_vendus'):
                response += f"   📝 {t.get('produits_vendus', '')[:50]}...\n"

        if len(transactions) > 15:
            response += f"\n... et {len(transactions) - 15} autres transactions"

        # Ajoute l'analyse IA avec le contexte complet
        context_data = db.get_full_context_for_ai()
        ai_response = groq_client.chat(
            user_id,
            "Analyse ces transactions et donne un résumé des tendances.",
            role,
            context_data
        )

        if ai_response['success']:
            response += f"\n\n💡 **Analyse:**\n{ai_response['message']}"

        return {
            'success': True,
            'message': response,
            'data': {'transactions': transactions}
        }

    def _handle_vendor_transactions(self, user_id: str, message: str, entities: Dict, role: str) -> Dict:
        """Transactions d'un vendeur spécifique"""
        vendor_name = entities.get('vendor_name') or entities.get('query', '')
        if not vendor_name:
            return {
                'success': True,
                'message': "👤 Quel vendeur voulez-vous consulter ? (ex: transactions de Ahmed)"
            }

        transactions_df = db.get_vendor_transactions(vendor_name)

        if transactions_df.empty:
            return {
                'success': True,
                'message': f"❌ Aucune transaction trouvée pour le vendeur '{vendor_name}'."
            }

        transactions = convert_to_native(transactions_df.to_dict('records'))
        total_ca = sum(t.get('total_amount', 0) for t in transactions)
        total_articles = sum(t.get('total_articles', 0) or 0 for t in transactions)

        response = f"""👤 **Transactions de {vendor_name}**

📊 **Résumé:**
- Nombre de ventes: {len(transactions)}
- CA total: {total_ca:,.2f} MAD
- Articles vendus: {total_articles}
- Panier moyen: {total_ca/len(transactions):,.2f} MAD

📋 **Détails des transactions:**
"""
        for t in transactions[:10]:
            response += f"\n🧾 **#{t.get('transaction_id')}** | {t.get('sale_date', 'N/A')}"
            response += f"\n   💰 {t.get('total_amount', 0):,.2f} MAD | 📦 {t.get('total_articles', 0)} articles"
            if t.get('produits'):
                response += f"\n   📝 {t.get('produits', '')[:40]}..."

        if len(transactions) > 10:
            response += f"\n\n... et {len(transactions) - 10} autres transactions"

        return {
            'success': True,
            'message': response,
            'data': {'vendor_transactions': transactions, 'vendor': vendor_name}
        }

    def _handle_category_performance(self, user_id: str, message: str, entities: Dict, role: str) -> Dict:
        """Performance des catégories"""
        cats_df = db.get_category_performance()

        if cats_df.empty:
            return {'success': True, 'message': "Aucune catégorie trouvée."}

        lines = []
        for i, row in cats_df.head(10).iterrows():
            medal = ['🥇', '🥈', '🥉'][i] if i < 3 else f"{i+1}."
            lines.append(f"{medal} **{row['category']}** | {row['product_count']:.0f} produits | {row['total_revenue']:.2f} MAD | ⭐ {row['avg_rating']:.1f}")

        return {
            'success': True,
            'message': f"🏷️ **Performance par Catégorie:**\n\n" + '\n'.join(lines),
            'data': {'categories': convert_to_native(cats_df.to_dict('records'))}
        }

    def _handle_inventory_status(self, user_id: str, message: str, entities: Dict, role: str) -> Dict:
        """État de l'inventaire - AMÉLIORÉ avec KPI Engine"""
        
        # ============ NOUVEAU: Utiliser le KPI Engine ============
        if self.kpi and self.formatter:
            try:
                product_kpis = self.kpi.get_product_kpis()
                f = self.formatter
                
                # Calculer les pourcentages
                total = product_kpis.get('total_products', 1)
                in_stock_pct = (product_kpis.get('in_stock', 0) / total) * 100
                low_stock_pct = (product_kpis.get('low_stock', 0) / total) * 100
                out_stock_pct = (product_kpis.get('out_of_stock', 0) / total) * 100
                
                response = f"""📦 **ÉTAT DE L'INVENTAIRE**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 **RÉSUMÉ GLOBAL**
┌─────────────────────────────────────────
│ 📋 Total Produits: {f.format_number(product_kpis.get('total_products', 0))}
│ 💵 Valeur Inventaire: {f.format_currency(product_kpis.get('inventory_value', 0))}
│ 📈 Prix Moyen: {f.format_currency(product_kpis.get('average_price', 0))}
│ ⭐ Note Moyenne: {f.rating_stars(product_kpis.get('average_rating', 0))} ({product_kpis.get('average_rating', 0):.1f}/5)
└─────────────────────────────────────────

📈 **RÉPARTITION DES STOCKS**
┌─────────────────────────────────────────
│ ✅ En Stock: {f.format_number(product_kpis.get('in_stock', 0))} ({in_stock_pct:.1f}%)
│    {f.progress_bar(in_stock_pct)}
│
│ ⚠️ Stock Faible: {f.format_number(product_kpis.get('low_stock', 0))} ({low_stock_pct:.1f}%)
│    {f.progress_bar(low_stock_pct)}
│
│ 🔴 Rupture: {f.format_number(product_kpis.get('out_of_stock', 0))} ({out_stock_pct:.1f}%)
│    {f.progress_bar(out_stock_pct)}
└─────────────────────────────────────────
"""
                # Ajouter les meilleures ventes
                if product_kpis.get('best_sellers'):
                    response += "\n🏆 **TOP 5 MEILLEURES VENTES**\n"
                    for i, p in enumerate(product_kpis['best_sellers'][:5]):
                        medal = ['🥇', '🥈', '🥉'][i] if i < 3 else f"{i+1}."
                        response += f"{medal} {p.get('title', 'N/A')[:35]} - {f.format_number(p.get('total_quantity', 0))} vendus\n"
                
                # Alertes
                if product_kpis.get('out_of_stock', 0) > 0:
                    response += f"\n⚠️ **ALERTE:** {product_kpis.get('out_of_stock', 0)} produits en rupture de stock nécessitent un réapprovisionnement!"
                
                return {
                    'success': True,
                    'message': response,
                    'data': {'inventory': product_kpis}
                }
            except Exception as e:
                pass
        
        # ============ Méthode originale (fallback) ============
        inventory = db.get_inventory_status()

        response = f"""📦 **État de l'Inventaire**

📊 **Total produits:** {inventory.get('total_products', 0):,}
✅ **En stock:** {inventory.get('in_stock', 0):,}
🟡 **Stock faible:** {inventory.get('low_stock', 0):,}
🔴 **Rupture:** {inventory.get('out_of_stock', 0):,}

💰 **Valeur inventaire:** {inventory.get('inventory_value', 0):,.2f} MAD
"""
        # Alertes
        if inventory.get('out_of_stock', 0) > 0:
            response += f"\n⚠️ Attention: {inventory.get('out_of_stock', 0)} produits en rupture de stock!"

        return {
            'success': True,
            'message': response,
            'data': {'inventory': inventory}
        }

    def _handle_global_stats(self, user_id: str, message: str, entities: Dict, role: str) -> Dict:
        """Statistiques globales avec analyse complete et insights intelligents - AMÉLIORÉ avec KPI Engine"""
        
        # ============ NOUVEAU: Utiliser le KPI Engine si disponible ============
        if self.kpi and self.formatter:
            try:
                all_kpis = self.kpi.get_all_kpis()
                
                # Formatage professionnel avec le ResponseFormatter
                response = self.formatter.format_full_dashboard(all_kpis)
                
                # Ajouter le contexte intelligent
                context_data = db.get_ai_ready_context()
                insights = context_data.get('smart_insights', {})
                
                # Alertes critiques
                if insights.get('alerts'):
                    response += "\n\n🚨 **Alertes Critiques:**"
                    for alert in insights['alerts'][:3]:
                        response += f"\n• {alert.get('message', '')}"
                
                # Opportunités
                if insights.get('opportunities'):
                    response += "\n\n💡 **Opportunités:**"
                    for opp in insights['opportunities'][:2]:
                        response += f"\n• {opp.get('message', '')}"
                
                # Analyse IA
                ai_response = groq_client.chat(
                    user_id,
                    "Donne un résumé exécutif concis (3-4 points clés) avec les recommandations prioritaires basées sur les données et alertes.",
                    role,
                    all_kpis
                )
                
                if ai_response['success']:
                    response += f"\n\n🤖 **Analyse SALESBOT:**\n{ai_response['message']}"
                
                return {
                    'success': True,
                    'message': response,
                    'data': all_kpis
                }
            except Exception as e:
                # Fallback vers l'ancienne méthode si erreur
                pass
        
        # ============ Méthode originale (fallback) ============
        # Recupere le contexte ULTRA-COMPLET avec insights
        context_data = db.get_ai_ready_context()

        overview = context_data.get('overview', {})
        inventory = context_data.get('inventory', {})
        trends = context_data.get('trends', {})
        vendor_comp = context_data.get('vendor_comparison', {})
        category_analysis = context_data.get('category_analysis', [])
        insights = context_data.get('smart_insights', {})
        metrics = context_data.get('calculated_metrics', {})

        response = f"""📊 **Tableau de Bord Intelligent - SalesManager**

💰 **Performance Commerciale:**
- Transactions totales: {overview.get('total_sales', 0):,}
- Chiffre d'affaires: {overview.get('total_revenue', 0):,.2f} MAD
- Panier moyen: {overview.get('avg_order_value', 0):,.2f} MAD
- CA/jour: {metrics.get('ca_par_jour', 0):,.2f} MAD
- Ventes/jour: {metrics.get('ventes_par_jour', 0):.1f}

📦 **Inventaire:**
- Produits en catalogue: {inventory.get('total_products', 0):,}
- En stock: {inventory.get('in_stock', 0)} | Stock faible: {inventory.get('low_stock', 0)} | Rupture: {inventory.get('out_of_stock', 0)}
- Valeur inventaire: {inventory.get('inventory_value', 0):,.2f} MAD
"""

        # Tendances
        if trends:
            ca_sem_act = trends.get('ca_semaine_actuelle', 0)
            ca_sem_prec = trends.get('ca_semaine_precedente', 0)
            if ca_sem_prec > 0:
                var = ((ca_sem_act - ca_sem_prec) / ca_sem_prec) * 100
                icon = "📈" if var > 0 else "📉"
                response += f"\n{icon} **Tendance semaine:** {var:+.1f}% ({ca_sem_act:,.2f} MAD vs {ca_sem_prec:,.2f} MAD)"

        # Top vendeur avec part de marché
        if vendor_comp and vendor_comp.get('vendeurs'):
            top = vendor_comp['vendeurs'][0]
            response += f"\n\n🏆 **Champion des ventes:** {top.get('vendeur', 'N/A')}"
            response += f"\n   CA: {top.get('ca_total', 0):,.2f} MAD ({top.get('part_marche', 0):.1f}% du CA total)"
            response += f"\n   Ventes: {top.get('nb_ventes', 0)} | Panier moyen: {top.get('panier_moyen', 0):,.2f} MAD"

        # Top categorie
        if category_analysis:
            top_cat = category_analysis[0]
            response += f"\n\n🏷️ **Meilleure catégorie:** {top_cat.get('category', 'N/A')} ({top_cat.get('ca_categorie', 0):,.2f} MAD)"

        # Alertes critiques
        if insights.get('alerts'):
            response += "\n\n🚨 **Alertes:**"
            for alert in insights['alerts'][:3]:
                response += f"\n• {alert.get('message', '')}"

        # Opportunités
        if insights.get('opportunities'):
            response += "\n\n💡 **Opportunités:**"
            for opp in insights['opportunities'][:2]:
                response += f"\n• {opp.get('message', '')}"

        # Réussites
        if insights.get('achievements'):
            response += "\n\n✨ **Réussites:**"
            for ach in insights['achievements'][:2]:
                response += f"\n• {ach.get('message', '')}"

        # Analyse IA
        ai_response = groq_client.chat(
            user_id,
            "Donne un résumé exécutif concis (3-4 points clés) avec les recommandations prioritaires basées sur les données et alertes.",
            role,
            context_data
        )

        if ai_response['success']:
            response += f"\n\n🤖 **Analyse SALESBOT:**\n{ai_response['message']}"

        return {
            'success': True,
            'message': response,
            'data': context_data
        }

    def _handle_vendor_performance(self, user_id: str, message: str, entities: Dict, role: str) -> Dict:
        """Performance des vendeurs"""
        if role not in ['ADMIN', 'ANALYSTE']:
            return {
                'success': False,
                'message': "🔒 Cette information est réservée aux administrateurs et analystes."
            }

        limit = entities.get('limit', 10)
        vendors_df = db.get_vendor_performance(limit=limit)

        if vendors_df.empty:
            return {'success': True, 'message': "Aucun vendeur trouvé."}

        lines = []
        for i, row in vendors_df.iterrows():
            medal = ['🥇', '🥈', '🥉'][i] if i < 3 else f"{i+1}."
            lines.append(f"{medal} **{row['username']}** | {row['sales_count']:.0f} ventes | {row['total_revenue']:.2f} MAD")

        return {
            'success': True,
            'message': f"👥 **Top {limit} Vendeurs:**\n\n" + '\n'.join(lines),
            'data': {'vendors': convert_to_native(vendors_df.to_dict('records'))}
        }

    # ============ NOUVEAUX HANDLERS AVANCÉS ============

    def _handle_weekly_sales(self, user_id: str, message: str, entities: Dict, role: str) -> Dict:
        """Ventes hebdomadaires"""
        weeks = entities.get('numbers', [4])[0] if entities.get('numbers') else 4
        sales_df = db.get_weekly_sales(weeks=weeks)

        if sales_df.empty:
            return {'success': True, 'message': f"Aucune vente ces {weeks} dernières semaines."}

        total_revenue = sales_df['ca'].sum()
        total_sales = sales_df['nb_ventes'].sum()

        lines = []
        for _, row in sales_df.iterrows():
            semaine_str = str(row['semaine'])[:10] if row['semaine'] else 'N/A'
            lines.append(f"📅 Semaine {semaine_str} | {row['nb_ventes']:.0f} ventes | {row['ca']:.2f} MAD | Panier: {row['panier_moyen']:.2f} MAD")

        return {
            'success': True,
            'message': f"📆 **Ventes Hebdomadaires ({weeks} semaines):**\n\nTotal: {total_sales:.0f} ventes | {total_revenue:.2f} MAD\n\n" + '\n'.join(lines),
            'data': {'weekly_sales': convert_to_native(sales_df.to_dict('records'))}
        }

    def _handle_recent_transactions(self, user_id: str, message: str, entities: Dict, role: str) -> Dict:
        """Transactions récentes"""
        limit = entities.get('limit', 10)
        transactions_df = db.get_recent_transactions(limit=limit)

        if transactions_df.empty:
            return {'success': True, 'message': "Aucune transaction récente."}

        response = f"🕐 **{limit} Transactions les plus récentes:**\n\n"
        for _, t in transactions_df.iterrows():
            response += f"🧾 **#{t['id']}** | {str(t['sale_date'])[:16]}\n"
            response += f"   👤 {t.get('vendeur', 'N/A')} | 💰 {t['total_amount']:,.2f} MAD | 📦 {t.get('total_items', 0)} articles\n\n"

        return {
            'success': True,
            'message': response,
            'data': {'transactions': convert_to_native(transactions_df.to_dict('records'))}
        }

    def _handle_slow_moving(self, user_id: str, message: str, entities: Dict, role: str) -> Dict:
        """Produits à rotation lente"""
        days = entities.get('numbers', [30])[0] if entities.get('numbers') else 30
        products_df = db.get_slow_moving_products(days=days)

        if products_df.empty:
            return {'success': True, 'message': "✅ Tous les produits ont une bonne rotation!"}

        total_value = products_df['valeur_stock'].sum()
        response = f"🐌 **Produits à Rotation Lente** (< 5 ventes en {days} jours)\n\n"
        response += f"⚠️ Valeur stock bloqué: **{total_value:,.2f} MAD**\n\n"

        for _, row in products_df.head(10).iterrows():
            jours = row.get('jours_depuis_derniere_vente', 'N/A')
            response += f"📦 **{row['title'][:35]}**\n"
            response += f"   Stock: {row['stock']} | Vendus: {row['total_vendu']} | Valeur: {row['valeur_stock']:,.2f} MAD\n"
            if jours and jours != 'N/A':
                response += f"   ⏰ {jours} jours depuis dernière vente\n"

        return {
            'success': True,
            'message': response,
            'data': {'slow_products': convert_to_native(products_df.to_dict('records'))}
        }

    def _handle_fast_moving(self, user_id: str, message: str, entities: Dict, role: str) -> Dict:
        """Produits à rotation rapide"""
        products_df = db.get_fast_moving_products()

        if products_df.empty:
            return {'success': True, 'message': "Aucun produit à forte rotation identifié."}

        response = "🚀 **Produits à Rotation Rapide** (Top performers)\n\n"
        for i, row in products_df.head(10).iterrows():
            medal = ['🥇', '🥈', '🥉'][i] if i < 3 else f"{i+1}."
            response += f"{medal} **{row['title'][:35]}**\n"
            response += f"   📊 {row['ventes_par_jour']:.1f} ventes/jour | Total: {row['total_vendu']} | CA: {row['ca_genere']:,.2f} MAD\n"
            if row['stock'] < row['ventes_par_jour'] * 7:
                response += f"   ⚠️ Stock: {row['stock']} (risque rupture < 7j)\n"

        return {
            'success': True,
            'message': response,
            'data': {'fast_products': convert_to_native(products_df.to_dict('records'))}
        }

    def _handle_product_rotation(self, user_id: str, message: str, entities: Dict, role: str) -> Dict:
        """Analyse de rotation des stocks"""
        rotation_df = db.get_product_rotation_analysis()

        if rotation_df.empty:
            return {'success': True, 'message': "Aucune donnée de rotation disponible."}

        # Comptage par catégorie
        rapide = len(rotation_df[rotation_df['vitesse_rotation'] == 'RAPIDE'])
        normal = len(rotation_df[rotation_df['vitesse_rotation'] == 'NORMAL'])
        lent = len(rotation_df[rotation_df['vitesse_rotation'] == 'LENT'])
        dormant = len(rotation_df[rotation_df['vitesse_rotation'] == 'DORMANT'])

        response = f"""📊 **Analyse de Rotation des Stocks**

🚀 **Rotation Rapide:** {rapide} produits (> 2 ventes/jour)
✅ **Rotation Normale:** {normal} produits (0.5-2 ventes/jour)
🐌 **Rotation Lente:** {lent} produits (< 0.5 ventes/jour)
😴 **Stock Dormant:** {dormant} produits (aucune vente)

📈 **Top 5 Rotation Rapide:**
"""
        for _, row in rotation_df[rotation_df['vitesse_rotation'] == 'RAPIDE'].head(5).iterrows():
            response += f"• {row['title'][:30]} | {row['ventes_par_jour']:.1f}/jour | Stock: {row['stock']}\n"

        response += "\n⚠️ **Produits à Surveiller (stock < 7 jours):**\n"
        for _, row in rotation_df[rotation_df['jours_stock_restant'] < 7].head(5).iterrows():
            response += f"• {row['title'][:30]} | ~{row['jours_stock_restant']:.0f} jours de stock\n"

        return {
            'success': True,
            'message': response,
            'data': {'rotation_analysis': convert_to_native(rotation_df.to_dict('records'))}
        }

    def _handle_profit_analysis(self, user_id: str, message: str, entities: Dict, role: str) -> Dict:
        """Analyse des marges et profits"""
        profit_df = db.get_profit_analysis()

        if profit_df.empty:
            return {'success': True, 'message': "Aucune donnée de profit disponible."}

        total_ca = profit_df['ca_brut'].sum()
        total_marge = profit_df['marge_estimee'].sum()

        response = f"""💰 **Analyse des Marges et Profits**

📊 **Résumé Global:**
- CA Brut Total: **{total_ca:,.2f} MAD**
- Marge Estimée: **{total_marge:,.2f} MAD**
- Taux de Marge Moyen: **30%** (estimé)

🏆 **Top 10 Produits les Plus Rentables:**
"""
        for i, row in profit_df.head(10).iterrows():
            medal = ['🥇', '🥈', '🥉'][i] if i < 3 else f"{i+1}."
            response += f"{medal} **{row['title'][:30]}**\n"
            response += f"   CA: {row['ca_brut']:,.2f} MAD | Marge: {row['marge_estimee']:,.2f} MAD | Qté: {row['quantite_vendue']}\n"

        return {
            'success': True,
            'message': response,
            'data': {'profit_analysis': convert_to_native(profit_df.to_dict('records'))}
        }

    def _handle_product_profitability(self, user_id: str, message: str, entities: Dict, role: str) -> Dict:
        """Rentabilité des produits"""
        return self._handle_profit_analysis(user_id, message, entities, role)

    def _handle_forecast_sales(self, user_id: str, message: str, entities: Dict, role: str) -> Dict:
        """Prévision des ventes"""
        forecast_df = db.get_forecast_data()
        trends = db.get_sales_trends()

        if forecast_df.empty:
            return {'success': True, 'message': "Pas assez de données pour une prévision."}

        # Calcul de moyennes
        avg_daily_ca = forecast_df['ca'].mean()
        avg_daily_sales = forecast_df['nb_ventes'].mean()

        # Prévision simple basée sur tendance
        ca_sem_act = trends.get('ca_semaine_actuelle', 0)
        ca_sem_prec = trends.get('ca_semaine_precedente', 1)
        trend_factor = ca_sem_act / ca_sem_prec if ca_sem_prec > 0 else 1

        prev_semaine = avg_daily_ca * 7 * trend_factor
        prev_mois = avg_daily_ca * 30 * trend_factor

        response = f"""🔮 **Prévisions de Ventes**

📊 **Moyennes Historiques (90 derniers jours):**
- CA moyen/jour: **{avg_daily_ca:,.2f} MAD**
- Ventes moyennes/jour: **{avg_daily_sales:.1f}**

📈 **Tendance Actuelle:** {"📈 Hausse" if trend_factor > 1 else "📉 Baisse"} ({(trend_factor - 1) * 100:+.1f}%)

🎯 **Prévisions (basées sur tendance):**
- Semaine prochaine: ~**{prev_semaine:,.2f} MAD** (~{avg_daily_sales * 7 * trend_factor:.0f} ventes)
- Mois prochain: ~**{prev_mois:,.2f} MAD** (~{avg_daily_sales * 30 * trend_factor:.0f} ventes)

💡 *Note: Prévisions basées sur les tendances récentes. Peuvent varier selon la saisonnalité.*
"""
        return {
            'success': True,
            'message': response,
            'data': {'forecast': {'prev_semaine': prev_semaine, 'prev_mois': prev_mois, 'trend_factor': trend_factor}}
        }

    def _handle_kpi_tracking(self, user_id: str, message: str, entities: Dict, role: str) -> Dict:
        """Suivi des KPIs - AMÉLIORÉ avec KPI Engine complet"""
        
        # ============ NOUVEAU: Utiliser le KPI Engine ============
        if self.kpi and self.formatter:
            try:
                # Récupérer tous les KPIs
                sales_kpis = self.kpi.get_sales_kpis()
                product_kpis = self.kpi.get_product_kpis()
                vendor_kpis = self.kpi.get_vendor_kpis()
                trend_kpis = self.kpi.get_trend_kpis()
                alert_kpis = self.kpi.get_alert_kpis()
                
                # Formatage professionnel
                f = self.formatter
                
                response = f"""📊 **TABLEAU DE BORD KPIs COMPLET**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 **PERFORMANCE COMMERCIALE**
┌─────────────────────────────────────────
│ 📈 Chiffre d'Affaires Total: {f.format_currency(sales_kpis.get('total_revenue', 0))}
│ 📅 Ce Mois: {f.format_currency(sales_kpis.get('current_month_revenue', 0))}
│ 📆 Mois Précédent: {f.format_currency(sales_kpis.get('previous_month_revenue', 0))}
│ {f.trend_indicator(sales_kpis.get('growth_rate', 0))} Croissance: {f.format_percent(sales_kpis.get('growth_rate', 0))}
│
│ 🛒 Transactions Totales: {f.format_number(sales_kpis.get('total_transactions', 0))}
│ 🛍️ Panier Moyen: {f.format_currency(sales_kpis.get('average_basket', 0))}
│ 📊 CA Journalier Moyen: {f.format_currency(sales_kpis.get('daily_average', 0))}
│ ⚡ Ventes Aujourd'hui: {f.format_currency(sales_kpis.get('today_sales', 0))}
└─────────────────────────────────────────

📦 **INVENTAIRE & PRODUITS**
┌─────────────────────────────────────────
│ 📋 Total Produits: {f.format_number(product_kpis.get('total_products', 0))}
│ ✅ En Stock: {f.format_number(product_kpis.get('in_stock', 0))}
│ ⚠️ Stock Faible: {f.format_number(product_kpis.get('low_stock', 0))}
│ 🔴 Rupture: {f.format_number(product_kpis.get('out_of_stock', 0))}
│
│ 💵 Valeur Inventaire: {f.format_currency(product_kpis.get('inventory_value', 0))}
│ 📊 Prix Moyen: {f.format_currency(product_kpis.get('average_price', 0))}
│ ⭐ Note Moyenne: {f.rating_stars(product_kpis.get('average_rating', 0))} ({product_kpis.get('average_rating', 0):.1f}/5)
└─────────────────────────────────────────

👥 **VENDEURS**
┌─────────────────────────────────────────
│ 👤 Total Vendeurs: {f.format_number(vendor_kpis.get('total_vendors', 0))}
│ ✅ Actifs ce Mois: {f.format_number(vendor_kpis.get('active_this_month', 0))}
"""
                # Ajouter le top 3 vendeurs
                if vendor_kpis.get('top_vendors'):
                    response += "│\n│ 🏆 **Top 3 Vendeurs:**\n"
                    for i, v in enumerate(vendor_kpis['top_vendors'][:3]):
                        medal = ['🥇', '🥈', '🥉'][i]
                        response += f"│    {medal} {v.get('username', 'N/A')}: {f.format_currency(v.get('total_revenue', 0))}\n"
                
                response += "└─────────────────────────────────────────\n"
                
                # Tendances
                response += f"""
📈 **TENDANCES**
┌─────────────────────────────────────────
│ 📅 Semaine Actuelle: {f.format_currency(trend_kpis.get('current_week_revenue', 0))}
│ 📆 Semaine Précédente: {f.format_currency(trend_kpis.get('previous_week_revenue', 0))}
│ {f.trend_indicator(trend_kpis.get('week_growth', 0))} Var. Hebdo: {f.format_percent(trend_kpis.get('week_growth', 0))}
│
│ 📈 Mois Actuel: {f.format_currency(trend_kpis.get('current_month_revenue', 0))}
│ {f.trend_indicator(trend_kpis.get('month_growth', 0))} Var. Mensuelle: {f.format_percent(trend_kpis.get('month_growth', 0))}
"""
                # Meilleurs jours
                if trend_kpis.get('best_days'):
                    response += "│\n│ 📅 **Meilleurs Jours:**\n"
                    jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
                    for d in trend_kpis['best_days'][:3]:
                        jour_nom = jours[d.get('jour', 0)] if d.get('jour', 0) < 7 else f"Jour {d.get('jour', 0)}"
                        response += f"│    • {jour_nom}: {f.format_currency(d.get('ca', 0))} ({d.get('nb_ventes', 0)} ventes)\n"
                
                response += "└─────────────────────────────────────────\n"
                
                # Alertes
                if alert_kpis.get('critical_alerts') or alert_kpis.get('warnings'):
                    response += "\n🚨 **ALERTES**\n"
                    if alert_kpis.get('critical_alerts'):
                        response += f"🔴 Critiques: {alert_kpis['critical_alerts']}\n"
                    if alert_kpis.get('warnings'):
                        response += f"🟡 Avertissements: {alert_kpis['warnings']}\n"
                
                return {
                    'success': True,
                    'message': response,
                    'data': {
                        'sales': sales_kpis,
                        'products': product_kpis,
                        'vendors': vendor_kpis,
                        'trends': trend_kpis,
                        'alerts': alert_kpis
                    }
                }
            except Exception as e:
                # Fallback vers l'ancienne méthode si erreur
                pass
        
        # ============ Méthode originale (fallback) ============
        kpis = db.get_kpi_summary()

        current = kpis.get('current', {})
        variations = kpis.get('variations', {})

        def trend_icon(var):
            if var > 5: return "📈 +"
            elif var < -5: return "📉 "
            else: return "➡️ "

        response = f"""📊 **Tableau de Bord KPIs**

🎯 **Ce Mois (vs mois précédent):**

💰 **Chiffre d'Affaires:**
   {current.get('ca_total', 0):,.2f} MAD {trend_icon(variations.get('ca_total', 0))}{variations.get('ca_total', 0):.1f}%

🛒 **Transactions:**
   {current.get('transactions', 0):,} {trend_icon(variations.get('transactions', 0))}{variations.get('transactions', 0):.1f}%

🛍️ **Panier Moyen:**
   {current.get('panier_moyen', 0):,.2f} MAD {trend_icon(variations.get('panier_moyen', 0))}{variations.get('panier_moyen', 0):.1f}%

📦 **Articles Vendus:**
   {current.get('articles_vendus', 0):,} {trend_icon(variations.get('articles_vendus', 0))}{variations.get('articles_vendus', 0):.1f}%

👥 **Vendeurs Actifs:** {current.get('vendeurs_actifs', 0)}
"""
        return {
            'success': True,
            'message': response,
            'data': {'kpis': kpis}
        }

    def _handle_trends_analysis(self, user_id: str, message: str, entities: Dict, role: str) -> Dict:
        """Analyse des tendances - AMÉLIORÉ avec KPI Engine"""
        
        # ============ NOUVEAU: Utiliser le KPI Engine ============
        if self.kpi and self.formatter:
            try:
                trend_kpis = self.kpi.get_trend_kpis()
                category_kpis = self.kpi.get_category_kpis()
                f = self.formatter
                
                response = f"""📈 **ANALYSE DES TENDANCES**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 **PERFORMANCE HEBDOMADAIRE**
┌─────────────────────────────────────────
│ Cette Semaine: {f.format_currency(trend_kpis.get('current_week_revenue', 0))}
│ Semaine Précédente: {f.format_currency(trend_kpis.get('previous_week_revenue', 0))}
│ {f.trend_indicator(trend_kpis.get('week_growth', 0))} Variation: {f.format_percent(trend_kpis.get('week_growth', 0))}
│
│ Transactions: {f.format_number(trend_kpis.get('current_week_sales', 0))} vs {f.format_number(trend_kpis.get('previous_week_sales', 0))}
└─────────────────────────────────────────

📆 **PERFORMANCE MENSUELLE**
┌─────────────────────────────────────────
│ Ce Mois: {f.format_currency(trend_kpis.get('current_month_revenue', 0))}
│ Mois Précédent: {f.format_currency(trend_kpis.get('previous_month_revenue', 0))}
│ {f.trend_indicator(trend_kpis.get('month_growth', 0))} Variation: {f.format_percent(trend_kpis.get('month_growth', 0))}
│
│ Transactions: {f.format_number(trend_kpis.get('current_month_sales', 0))} vs {f.format_number(trend_kpis.get('previous_month_sales', 0))}
└─────────────────────────────────────────
"""
                # Tendance globale
                week_trend = trend_kpis.get('week_growth', 0)
                month_trend = trend_kpis.get('month_growth', 0)
                if week_trend > 0 and month_trend > 0:
                    trend_status = "📈 **CROISSANCE**"
                    trend_msg = "Les ventes sont en hausse sur toutes les périodes!"
                elif week_trend < 0 and month_trend < 0:
                    trend_status = "📉 **DÉCLIN**"
                    trend_msg = "Les ventes sont en baisse. Une action corrective est recommandée."
                else:
                    trend_status = "➡️ **STABLE**"
                    trend_msg = "Les ventes sont stables avec des variations mixtes."
                
                response += f"\n🎯 **TENDANCE GLOBALE:** {trend_status}\n{trend_msg}\n"
                
                # Meilleurs jours
                if trend_kpis.get('best_days'):
                    jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
                    response += "\n📅 **MEILLEURS JOURS DE VENTE**\n┌─────────────────────────────────────────\n"
                    for d in trend_kpis['best_days'][:5]:
                        jour_idx = d.get('jour', 0)
                        jour_nom = jours[jour_idx] if jour_idx < 7 else f"Jour {jour_idx}"
                        response += f"│ {jour_nom}: {f.format_currency(d.get('ca', 0))} ({d.get('nb_ventes', 0)} ventes)\n"
                    response += "└─────────────────────────────────────────\n"
                
                # Heures de pointe
                if trend_kpis.get('peak_hours'):
                    response += "\n⏰ **HEURES DE POINTE**\n┌─────────────────────────────────────────\n"
                    for h in trend_kpis['peak_hours'][:5]:
                        heure = h.get('heure', 0)
                        response += f"│ {heure:02d}h00: {f.format_currency(h.get('ca', 0))} ({h.get('nb_ventes', 0)} ventes)\n"
                    response += "└─────────────────────────────────────────\n"
                
                # Meilleure catégorie
                if category_kpis.get('best_category'):
                    best_cat = category_kpis['best_category']
                    response += f"\n🏷️ **MEILLEURE CATÉGORIE:** {best_cat.get('category', 'N/A')} ({f.format_currency(best_cat.get('ca_categorie', 0))})\n"
                
                # Analyse IA
                context_data = {'trends': trend_kpis, 'categories': category_kpis}
                ai_response = groq_client.chat(
                    user_id,
                    "Analyse ces tendances et donne 2-3 insights clés avec recommandations.",
                    role,
                    context_data
                )
                
                if ai_response['success']:
                    response += f"\n💡 **Analyse IA:**\n{ai_response['message']}"
                
                return {
                    'success': True,
                    'message': response,
                    'data': {'trends': trend_kpis, 'categories': category_kpis}
                }
            except Exception as e:
                pass
        
        # ============ Méthode originale (fallback) ============
        trends = db.get_sales_trends()
        
        if not trends:
            return {'success': True, 'message': "Pas assez de données pour analyser les tendances."}

        # Calculs des variations
        ca_sem_var = ((trends.get('ca_semaine_actuelle', 0) - trends.get('ca_semaine_precedente', 1)) / 
                      max(trends.get('ca_semaine_precedente', 1), 1) * 100)
        ca_mois_var = ((trends.get('ca_mois_actuel', 0) - trends.get('ca_mois_precedent', 1)) / 
                       max(trends.get('ca_mois_precedent', 1), 1) * 100)
        ventes_sem_var = ((trends.get('ventes_semaine_actuelle', 0) - trends.get('ventes_semaine_precedente', 1)) / 
                          max(trends.get('ventes_semaine_precedente', 1), 1) * 100)

        response = f"""📈 **Analyse des Tendances**

📅 **SEMAINE en Cours vs Précédente:**
- CA: {trends.get('ca_semaine_actuelle', 0):,.2f} MAD vs {trends.get('ca_semaine_precedente', 0):,.2f} MAD
  {"📈" if ca_sem_var > 0 else "📉"} Variation: **{ca_sem_var:+.1f}%**
- Ventes: {trends.get('ventes_semaine_actuelle', 0)} vs {trends.get('ventes_semaine_precedente', 0)}
  {"📈" if ventes_sem_var > 0 else "📉"} Variation: **{ventes_sem_var:+.1f}%**

📆 **MOIS en Cours vs Précédent:**
- CA: {trends.get('ca_mois_actuel', 0):,.2f} MAD vs {trends.get('ca_mois_precedent', 0):,.2f} MAD
  {"📈" if ca_mois_var > 0 else "📉"} Variation: **{ca_mois_var:+.1f}%**
- Ventes: {trends.get('ventes_mois_actuel', 0)} vs {trends.get('ventes_mois_precedent', 0)}

🎯 **Tendance Globale:** {"📈 CROISSANCE" if ca_sem_var > 0 and ca_mois_var > 0 else "📉 BAISSE" if ca_sem_var < 0 and ca_mois_var < 0 else "➡️ STABLE"}
"""
        # Analyse IA des tendances
        context_data = {'trends': trends}
        ai_response = groq_client.chat(
            user_id,
            "Analyse ces tendances et donne 2-3 insights clés avec recommandations.",
            role,
            context_data
        )

        if ai_response['success']:
            response += f"\n💡 **Analyse:**\n{ai_response['message']}"

        return {
            'success': True,
            'message': response,
            'data': {'trends': trends}
        }

    def _handle_compare_periods(self, user_id: str, message: str, entities: Dict, role: str) -> Dict:
        """Comparaison de périodes"""
        return self._handle_trends_analysis(user_id, message, entities, role)

    def _handle_vendor_ranking(self, user_id: str, message: str, entities: Dict, role: str) -> Dict:
        """Classement des vendeurs"""
        period = entities.get('period', 'month')
        limit = entities.get('limit', 10)
        ranking_df = db.get_vendor_ranking(period=period, limit=limit)

        if ranking_df.empty:
            return {'success': True, 'message': "Aucun vendeur avec des ventes sur cette période."}

        period_label = {'day': 'Aujourd\'hui', 'week': 'Cette Semaine', 'month': 'Ce Mois', 'year': 'Cette Année'}.get(period, 'Ce Mois')

        response = f"🏆 **Classement des Vendeurs - {period_label}**\n\n"
        for _, row in ranking_df.iterrows():
            rang = int(row['rang'])
            medal = ['🥇', '🥈', '🥉'][rang-1] if rang <= 3 else f"{rang}."
            response += f"{medal} **{row['vendeur']}**\n"
            response += f"   💰 {row['ca_total']:,.2f} MAD | 🛒 {row['nb_ventes']:.0f} ventes | 🛍️ Panier: {row['panier_moyen']:,.2f} MAD\n"

        return {
            'success': True,
            'message': response,
            'data': {'vendor_ranking': convert_to_native(ranking_df.to_dict('records'))}
        }

    def _handle_vendor_comparison(self, user_id: str, message: str, entities: Dict, role: str) -> Dict:
        """Comparaison des vendeurs"""
        comparison = db.get_vendor_comparison()

        if not comparison or not comparison.get('vendeurs'):
            return {'success': True, 'message': "Aucune donnée de comparaison disponible."}

        response = f"""👥 **Comparaison des Vendeurs**

📊 **Résumé Équipe:**
- Nombre de vendeurs: {comparison.get('nb_vendeurs', 0)}
- CA Total Équipe: {comparison.get('total_ca', 0):,.2f} MAD
- Moyenne CA/vendeur: {comparison.get('moyenne_ca_par_vendeur', 0):,.2f} MAD

🏆 **Champion:** {comparison.get('top_vendeur', 'N/A')} ({comparison.get('top_ca', 0):,.2f} MAD)

📈 **Répartition:**
"""
        for v in comparison.get('vendeurs', [])[:10]:
            bar_length = int(v.get('part_marche', 0) / 5)  # 1 block = 5%
            bar = '█' * bar_length + '░' * (20 - bar_length)
            response += f"\n{v.get('vendeur', 'N/A')}: {bar} {v.get('part_marche', 0):.1f}%"
            response += f"\n   CA: {v.get('ca_total', 0):,.2f} MAD | Ventes: {v.get('nb_ventes', 0)}"

        return {
            'success': True,
            'message': response,
            'data': {'vendor_comparison': comparison}
        }

    def _handle_critical_alerts(self, user_id: str, message: str, entities: Dict, role: str) -> Dict:
        """Alertes critiques seulement"""
        insights = db.get_smart_insights()
        high_alerts = [a for a in insights.get('alerts', []) if a.get('severity') == 'HIGH']

        if not high_alerts:
            return {'success': True, 'message': "✅ Aucune alerte critique en ce moment!"}

        response = "🚨 **ALERTES CRITIQUES**\n\n"
        for alert in high_alerts:
            response += f"🔴 **{alert.get('type', 'ALERTE')}**\n"
            response += f"   {alert.get('message', '')}\n"
            if alert.get('action'):
                response += f"   ➡️ Action: {alert['action']}\n"
            response += "\n"

        return {
            'success': True,
            'message': response,
            'data': {'critical_alerts': high_alerts}
        }

    def _handle_smart_insights(self, user_id: str, message: str, entities: Dict, role: str) -> Dict:
        """Insights intelligents"""
        insights = db.get_smart_insights()

        response = "💡 **Insights Intelligents**\n\n"

        if insights.get('achievements'):
            response += "🏆 **Réussites:**\n"
            for ach in insights['achievements'][:3]:
                response += f"  ✨ {ach.get('message', '')}\n"
            response += "\n"

        if insights.get('opportunities'):
            response += "🎯 **Opportunités:**\n"
            for opp in insights['opportunities'][:3]:
                response += f"  💰 {opp.get('message', '')}\n"
                if opp.get('action'):
                    response += f"     ➡️ {opp['action']}\n"
            response += "\n"

        if insights.get('alerts'):
            response += "⚠️ **Points d'Attention:**\n"
            for alert in insights['alerts'][:3]:
                severity_icon = "🔴" if alert.get('severity') == 'HIGH' else "🟡"
                response += f"  {severity_icon} {alert.get('message', '')}\n"

        return {
            'success': True,
            'message': response,
            'data': {'insights': insights}
        }

    def _handle_recommendations(self, user_id: str, message: str, entities: Dict, role: str) -> Dict:
        """Recommandations personnalisées"""
        context_data = db.get_ai_ready_context()

        ai_response = groq_client.chat(
            user_id,
            "Basé sur les données actuelles, donne-moi 5 recommandations concrètes et actionnables pour améliorer les performances. Chaque recommandation doit avoir un impact estimé.",
            role,
            context_data
        )

        response = "🎯 **Recommandations Personnalisées**\n\n"
        if ai_response['success']:
            response += ai_response['message']
        else:
            response += "Impossible de générer des recommandations pour le moment."

        return {
            'success': True,
            'message': response,
            'data': context_data
        }

    def _handle_daily_report(self, user_id: str, message: str, entities: Dict, role: str) -> Dict:
        """Rapport journalier"""
        report = db.get_daily_report_data()
        summary = report.get('summary', {})

        response = f"""📅 **Rapport du Jour**

💰 **Performance:**
- CA: {summary.get('ca_total', 0):,.2f} MAD
- Transactions: {summary.get('transactions', 0)}
- Panier moyen: {summary.get('panier_moyen', 0):,.2f} MAD
- Articles vendus: {summary.get('articles_vendus', 0)}

🏆 **Top Produits du Jour:**
"""
        for p in report.get('top_products', [])[:5]:
            response += f"• {p.get('title', 'N/A')[:30]} | {p.get('qte', 0)} vendus | {p.get('ca', 0):,.2f} MAD\n"

        response += "\n👥 **Top Vendeurs du Jour:**\n"
        for v in report.get('top_vendors', [])[:5]:
            response += f"• {v.get('username', 'N/A')} | {v.get('ventes', 0)} ventes | {v.get('ca', 0):,.2f} MAD\n"

        return {
            'success': True,
            'message': response,
            'data': {'daily_report': report}
        }

    def _handle_weekly_report(self, user_id: str, message: str, entities: Dict, role: str) -> Dict:
        """Rapport hebdomadaire"""
        weekly_sales = db.get_weekly_sales(weeks=1)
        trends = db.get_sales_trends()
        vendor_ranking = db.get_vendor_ranking(period='week')

        if weekly_sales.empty:
            return {'success': True, 'message': "Aucune donnée pour cette semaine."}

        week_data = weekly_sales.iloc[0] if not weekly_sales.empty else {}

        response = f"""📊 **Rapport Hebdomadaire**

💰 **Performance Semaine:**
- CA: {week_data.get('ca', 0):,.2f} MAD
- Transactions: {week_data.get('nb_ventes', 0):.0f}
- Panier moyen: {week_data.get('panier_moyen', 0):,.2f} MAD
- Vendeurs actifs: {week_data.get('vendeurs_actifs', 0):.0f}

📈 **vs Semaine Précédente:**
"""
        ca_var = ((trends.get('ca_semaine_actuelle', 0) - trends.get('ca_semaine_precedente', 1)) / 
                  max(trends.get('ca_semaine_precedente', 1), 1) * 100)
        response += f"- CA: {'📈' if ca_var > 0 else '📉'} {ca_var:+.1f}%\n"

        response += "\n🏆 **Top 3 Vendeurs:**\n"
        for _, v in vendor_ranking.head(3).iterrows():
            response += f"• {v['vendeur']} | {v['ca_total']:,.2f} MAD\n"

        return {
            'success': True,
            'message': response,
            'data': {'weekly_report': convert_to_native(weekly_sales.to_dict('records'))}
        }

    def _handle_monthly_report(self, user_id: str, message: str, entities: Dict, role: str) -> Dict:
        """Rapport mensuel"""
        kpis = db.get_kpi_summary()
        current = kpis.get('current', {})
        variations = kpis.get('variations', {})
        vendor_ranking = db.get_vendor_ranking(period='month')
        category_perf = db.get_category_analysis()

        response = f"""📆 **Rapport Mensuel**

💰 **Résumé Financier:**
- CA Total: {current.get('ca_total', 0):,.2f} MAD ({variations.get('ca_total', 0):+.1f}% vs mois précédent)
- Transactions: {current.get('transactions', 0)} ({variations.get('transactions', 0):+.1f}%)
- Panier moyen: {current.get('panier_moyen', 0):,.2f} MAD
- Articles vendus: {current.get('articles_vendus', 0)}

🏆 **Top 5 Vendeurs:**
"""
        for i, (_, v) in enumerate(vendor_ranking.head(5).iterrows()):
            medal = ['🥇', '🥈', '🥉'][i] if i < 3 else f"{i+1}."
            response += f"{medal} {v['vendeur']} | {v['ca_total']:,.2f} MAD\n"

        response += "\n📊 **Top 5 Catégories:**\n"
        for _, c in category_perf.head(5).iterrows():
            response += f"• {c['category']} | {c.get('ca_categorie', 0):,.2f} MAD\n"

        return {
            'success': True,
            'message': response,
            'data': {'kpis': kpis}
        }

    def _handle_executive_summary(self, user_id: str, message: str, entities: Dict, role: str) -> Dict:
        """Résumé exécutif complet"""
        summary = db.get_executive_summary()
        kpis = summary.get('kpis', {})
        current = kpis.get('current', {})
        variations = kpis.get('variations', {})
        health = summary.get('health_scores', {})

        response = f"""📊 **RÉSUMÉ EXÉCUTIF**

🎯 **Indicateurs Clés:**
- 💰 CA: {current.get('ca_total', 0):,.2f} MAD ({variations.get('ca_total', 0):+.1f}%)
- 🛒 Transactions: {current.get('transactions', 0)} ({variations.get('transactions', 0):+.1f}%)
- 🛍️ Panier Moyen: {current.get('panier_moyen', 0):,.2f} MAD

📈 **Tendance:** {health.get('sales_trend', 'N/A')}
📦 **Santé Inventaire:** {health.get('inventory_health', 0):.0f}%

🏆 **Champion du Mois:** {summary.get('vendor_comparison', {}).get('top_vendeur', 'N/A')}
   ({summary.get('vendor_comparison', {}).get('top_ca', 0):,.2f} MAD)
"""

        if summary.get('alerts'):
            response += "\n🚨 **Alertes:**\n"
            for alert in summary['alerts'][:2]:
                response += f"• {alert.get('message', '')}\n"

        if summary.get('opportunities'):
            response += "\n💡 **Opportunités:**\n"
            for opp in summary['opportunities'][:2]:
                response += f"• {opp.get('message', '')}\n"

        return {
            'success': True,
            'message': response,
            'data': {'executive_summary': summary}
        }

    def _handle_my_stats(self, user_id: str, message: str, entities: Dict, role: str) -> Dict:
        """Statistiques personnelles"""
        stats = db.get_user_stats(user_id)

        if not stats:
            return {
                'success': True,
                'message': "❌ Impossible de récupérer vos statistiques."
            }

        response = f"""📊 **Vos Statistiques - {stats.get('username', 'Utilisateur')}**

👤 **Rôle:** {stats.get('role', 'N/A')}
🛒 **Ventes totales:** {stats.get('total_sales', 0)}
💰 **Revenu généré:** {stats.get('total_revenue', 0):.2f} MAD
📅 **Dernière vente:** {stats.get('last_sale_date', 'Aucune')}
"""
        return {
            'success': True,
            'message': response,
            'data': {'user_stats': stats}
        }

    def _handle_alerts(self, user_id: str, message: str, entities: Dict, role: str) -> Dict:
        """Alertes récentes"""
        alerts_df = db.get_recent_alerts(limit=5)
        unread_count = db.get_unread_alerts_count()

        if alerts_df.empty:
            return {'success': True, 'message': "✅ Aucune alerte en ce moment."}

        lines = []
        priority_icons = {'HIGH': '🔴', 'MEDIUM': '🟡', 'LOW': '🟢'}
        for _, row in alerts_df.iterrows():
            icon = priority_icons.get(row['priority'], '⚪')
            status = '' if row['is_read'] else '🆕'
            lines.append(f"{icon} {status} **{row['title']}**\n   {row['message'][:60]}...")

        response = f"🔔 **Alertes** ({unread_count} non lues):\n\n" + '\n\n'.join(lines)

        return {
            'success': True,
            'message': response,
            'data': {'alerts': convert_to_native(alerts_df.to_dict('records')), 'unread': unread_count}
        }

    def _handle_greeting(self, user_id: str, message: str, entities: Dict, role: str) -> Dict:
        """Salutations intelligentes avec résumé du jour"""
        # Récupère les insights pour un résumé rapide
        try:
            insights = db.get_smart_insights()
            overview = db.get_sales_overview()
            trends = db.get_sales_trends()
        except:
            insights = {}
            overview = {}
            trends = {}

        base_greetings = {
            'ADMIN': "👋 **Bonjour Admin!** Je suis SALESBOT, votre assistant BI intelligent.",
            'VENDEUR': "👋 **Bonjour!** Je suis SALESBOT, votre coach de vente personnel.",
            'ANALYSTE': "👋 **Bonjour!** Je suis SALESBOT, votre copilote analytique.",
            'INVESTISSEUR': "👋 **Bonjour!** Je suis SALESBOT, votre conseiller financier."
        }

        response = base_greetings.get(role.upper(), base_greetings['VENDEUR'])

        # Ajoute un résumé rapide du jour
        if overview:
            response += f"\n\n📊 **Situation du jour:**"
            response += f"\n• CA total: {overview.get('total_revenue', 0):,.2f} MAD"
            response += f"\n• Transactions: {overview.get('total_sales', 0)}"

        # Tendance
        if trends:
            ca_sem_act = trends.get('ca_semaine_actuelle', 0)
            ca_sem_prec = trends.get('ca_semaine_precedente', 0)
            if ca_sem_prec > 0:
                var = ((ca_sem_act - ca_sem_prec) / ca_sem_prec) * 100
                icon = "📈" if var > 0 else "📉"
                response += f"\n• Tendance: {icon} {var:+.1f}% cette semaine"

        # Alertes importantes
        if insights.get('alerts'):
            high_alerts = [a for a in insights['alerts'] if a.get('severity') == 'HIGH']
            if high_alerts:
                response += f"\n\n🚨 **Attention:** {len(high_alerts)} alerte(s) critique(s)"
                response += f"\n• {high_alerts[0].get('message', '')}"

        response += "\n\n💬 Comment puis-je vous aider aujourd'hui?"

        return {
            'success': True,
            'message': response
        }

    def _handle_help(self, user_id: str, message: str, entities: Dict, role: str) -> Dict:
        """Aide - AMÉLIORÉ avec toutes les fonctionnalités KPI"""
        help_text = """🤖 **SALESBOT - Assistant Commercial Intelligent**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 **TABLEAUX DE BORD & KPIs:**
- "Dashboard" / "Tableau de bord" - Vue complète
- "KPIs" / "Indicateurs" - Tous les indicateurs clés
- "Statistiques globales" - Analyse complète
- "Aperçu des ventes" - Performance commerciale

📈 **ANALYSES & TENDANCES:**
- "Tendances" / "Analyse des tendances"
- "Ventes du jour/semaine/mois"
- "Comparaison des périodes"
- "Évolution du CA"

💰 **VENTES & TRANSACTIONS:**
- "Ventes aujourd'hui" / "CA du jour"
- "Dernières transactions"
- "Transaction #25" (détails)
- "Panier moyen"

📦 **INVENTAIRE & PRODUITS:**
- "État du stock" / "Inventaire"
- "Produits en rupture"
- "Stock faible"
- "Meilleurs produits"
- "Top 10 ventes"

🔍 **RECHERCHE:**
- "Cherche [produit]"
- "Catégorie [nom]"
- "Produits chers/pas chers"

👥 **VENDEURS (Admin):**
- "Top vendeurs"
- "Performance vendeurs"
- "Classement vendeurs"
- "Vendeur du mois"

🚨 **ALERTES & INSIGHTS:**
- "Alertes" / "Alertes critiques"
- "Recommandations"
- "Insights"

💡 **QUESTIONS LIBRES:**
Posez n'importe quelle question sur vos données !
Exemples:
- "Quel est le CA ce mois?"
- "Combien de produits en rupture?"
- "Qui est le meilleur vendeur?"

"""
        if role == 'ADMIN':
            help_text += """
👑 **FONCTIONS ADMIN:**
- Accès à tous les KPIs
- Performance de l'équipe
- Analyses avancées
- Rapports complets
"""
        elif role == 'ANALYSTE':
            help_text += """
📊 **FONCTIONS ANALYSTE:**
- Toutes les analyses
- Tendances détaillées
- Rapports personnalisés
"""
        
        return {'success': True, 'message': help_text}

    def _handle_general_question(self, user_id: str, message: str, entities: Dict, role: str) -> Dict:
        """Question générale - utilise Groq avec contexte ULTRA-COMPLET et insights intelligents"""
        # Récupère le contexte ULTRA-COMPLET avec insights, alertes et recommandations
        context_data = db.get_ai_ready_context()

        response = groq_client.chat(user_id, message, role, context_data)
        return {
            'success': response['success'],
            'message': response['message'],
            'data': context_data
        }

    def _handle_unknown(self, user_id: str, message: str, entities: Dict, role: str) -> Dict:
        """Intention inconnue - utilise Groq avec le contexte ULTRA-COMPLET et insights intelligents"""
        # Toujours fournir le contexte ULTRA-COMPLET avec insights pour reponses intelligentes
        context_data = db.get_ai_ready_context()

        response = groq_client.chat(user_id, message, role, context_data)
        return {
            'success': response['success'],
            'message': response['message'],
            'data': context_data
        }

    # ============ NOUVEAUX HANDLERS AJOUTÉS ============

    def _handle_product_comparison(self, user_id: str, message: str, entities: Dict, role: str) -> Dict:
        """Comparaison de produits - Compare plusieurs produits entre eux"""
        # Extraire les produits mentionnés
        product_refs = entities.get('product_references', [])
        found_products = entities.get('found_products', [])
        
        # Si pas assez de produits, chercher les top produits pour comparaison
        if len(found_products) < 2:
            # Chercher les 3 meilleurs produits
            best_sellers = db.get_best_selling_products(limit=3)
            if not best_sellers.empty:
                found_products = db.df_to_dict(best_sellers)
        
        if len(found_products) < 2:
            return {
                'success': True,
                'message': "⚠️ Je n'ai pas trouvé assez de produits à comparer. Précisez les noms des produits ou demandez 'compare les meilleurs produits'."
            }
        
        # Formater la comparaison
        f = self.formatter if self.formatter else None
        
        response = "📊 **COMPARAISON DE PRODUITS**\n"
        response += "═" * 40 + "\n\n"
        
        # En-tête du tableau
        response += "| Critère | "
        for i, p in enumerate(found_products[:3]):
            name = p.get('title', 'Produit')[:15]
            response += f"{name}... | "
        response += "\n" + "|" + "---|" * (len(found_products[:3]) + 1) + "\n"
        
        # Prix
        response += "| 💰 **Prix** | "
        for p in found_products[:3]:
            price = p.get('price', 0)
            if f:
                response += f"{f.format_currency(price)} | "
            else:
                response += f"{price:,.2f} MAD | "
        response += "\n"
        
        # Stock
        response += "| 📦 **Stock** | "
        for p in found_products[:3]:
            stock = p.get('stock', 0)
            indicator = "✅" if stock > 10 else "⚠️" if stock > 0 else "🔴"
            response += f"{indicator} {stock} | "
        response += "\n"
        
        # Rating
        response += "| ⭐ **Note** | "
        for p in found_products[:3]:
            rating = p.get('rating', 0) or 0
            if f:
                response += f"{f.rating_stars(rating)} | "
            else:
                response += f"{rating:.1f}/5 | "
        response += "\n"
        
        # Ventes (si disponible)
        response += "| 🛒 **Ventes** | "
        for p in found_products[:3]:
            sales = p.get('total_quantity', p.get('sales_count', 'N/A'))
            response += f"{sales} | "
        response += "\n"
        
        # Catégorie
        response += "| 🏷️ **Catégorie** | "
        for p in found_products[:3]:
            cat = p.get('category', 'N/A')[:10]
            response += f"{cat} | "
        response += "\n\n"
        
        # Recommandation IA
        context_data = {'products_to_compare': found_products[:3]}
        ai_response = groq_client.chat(
            user_id,
            "Compare ces produits et donne une recommandation claire sur lequel choisir et pourquoi.",
            role,
            context_data
        )
        
        if ai_response['success']:
            response += f"💡 **Recommandation IA:**\n{ai_response['message']}"
        
        return {
            'success': True,
            'message': response,
            'data': {'compared_products': found_products[:3]}
        }

    def _handle_seasonality_analysis(self, user_id: str, message: str, entities: Dict, role: str) -> Dict:
        """Analyse de saisonnalité - Patterns de ventes par période"""
        # Récupérer les tendances
        if self.kpi:
            trend_kpis = self.kpi.get_trend_kpis()
        else:
            trend_kpis = {}
        
        # Récupérer les patterns journaliers
        daily_patterns = db.get_daily_sales_pattern() if hasattr(db, 'get_daily_sales_pattern') else None
        monthly_sales = db.get_monthly_sales(months=12) if hasattr(db, 'get_monthly_sales') else None
        
        f = self.formatter if self.formatter else None
        
        response = "📅 **ANALYSE DE SAISONNALITÉ**\n"
        response += "═" * 40 + "\n\n"
        
        # Meilleurs jours de la semaine
        jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
        
        if trend_kpis.get('best_days'):
            response += "📊 **PERFORMANCE PAR JOUR DE LA SEMAINE**\n"
            response += "┌─────────────────────────────────────────\n"
            for d in trend_kpis['best_days']:
                jour_idx = d.get('jour', 0)
                jour_nom = jours[jour_idx] if jour_idx < 7 else f"Jour {jour_idx}"
                ca = d.get('ca', 0)
                ventes = d.get('nb_ventes', 0)
                
                # Barre de progression
                max_ca = max(x.get('ca', 1) for x in trend_kpis['best_days'])
                bar_len = int((ca / max_ca) * 15) if max_ca > 0 else 0
                bar = '█' * bar_len + '░' * (15 - bar_len)
                
                if f:
                    response += f"│ {jour_nom:10} {bar} {f.format_currency(ca)} ({ventes} ventes)\n"
                else:
                    response += f"│ {jour_nom:10} {bar} {ca:,.2f} MAD ({ventes} ventes)\n"
            response += "└─────────────────────────────────────────\n\n"
        
        # Heures de pointe
        if trend_kpis.get('peak_hours'):
            response += "⏰ **HEURES DE POINTE**\n"
            response += "┌─────────────────────────────────────────\n"
            for h in trend_kpis['peak_hours'][:5]:
                heure = h.get('heure', 0)
                ca = h.get('ca', 0)
                ventes = h.get('nb_ventes', 0)
                
                if f:
                    response += f"│ {heure:02d}h00 - {(heure+1)%24:02d}h00: {f.format_currency(ca)} ({ventes} ventes)\n"
                else:
                    response += f"│ {heure:02d}h00 - {(heure+1)%24:02d}h00: {ca:,.2f} MAD ({ventes} ventes)\n"
            response += "└─────────────────────────────────────────\n\n"
        
        # Analyse mensuelle
        if monthly_sales is not None and not monthly_sales.empty:
            response += "📆 **ÉVOLUTION MENSUELLE**\n"
            response += "┌─────────────────────────────────────────\n"
            for _, row in monthly_sales.head(6).iterrows():
                mois = row.get('month', 'N/A')
                ca = row.get('revenue', 0)
                if f:
                    response += f"│ {mois}: {f.format_currency(ca)}\n"
                else:
                    response += f"│ {mois}: {ca:,.2f} MAD\n"
            response += "└─────────────────────────────────────────\n\n"
        
        # Insights
        response += "💡 **INSIGHTS SAISONNIERS:**\n"
        
        if trend_kpis.get('best_days'):
            best_day = trend_kpis['best_days'][0] if trend_kpis['best_days'] else None
            worst_day = trend_kpis['best_days'][-1] if trend_kpis['best_days'] else None
            if best_day and worst_day:
                best_jour = jours[best_day.get('jour', 0)] if best_day.get('jour', 0) < 7 else 'N/A'
                worst_jour = jours[worst_day.get('jour', 0)] if worst_day.get('jour', 0) < 7 else 'N/A'
                response += f"• 🏆 Meilleur jour: **{best_jour}**\n"
                response += f"• 📉 Jour le plus faible: **{worst_jour}**\n"
        
        if trend_kpis.get('peak_hours'):
            peak = trend_kpis['peak_hours'][0] if trend_kpis['peak_hours'] else None
            if peak:
                response += f"• ⏰ Heure de pointe: **{peak.get('heure', 0)}h00**\n"
        
        return {
            'success': True,
            'message': response,
            'data': {'seasonality': trend_kpis}
        }

    def _handle_revenue_breakdown(self, user_id: str, message: str, entities: Dict, role: str) -> Dict:
        """Répartition du chiffre d'affaires par catégorie/vendeur/période"""
        # Récupérer les KPIs
        if self.kpi:
            sales_kpis = self.kpi.get_sales_kpis()
            category_kpis = self.kpi.get_category_kpis()
            vendor_kpis = self.kpi.get_vendor_kpis()
        else:
            sales_kpis = db.get_sales_overview() if hasattr(db, 'get_sales_overview') else {}
            category_kpis = {}
            vendor_kpis = {}
        
        f = self.formatter if self.formatter else None
        
        total_revenue = sales_kpis.get('total_revenue', 0)
        
        response = "💰 **RÉPARTITION DU CHIFFRE D'AFFAIRES**\n"
        response += "═" * 40 + "\n\n"
        
        # CA Total
        if f:
            response += f"📊 **CA TOTAL:** {f.format_currency(total_revenue)}\n\n"
        else:
            response += f"📊 **CA TOTAL:** {total_revenue:,.2f} MAD\n\n"
        
        # Par catégorie
        if category_kpis.get('category_distribution'):
            response += "🏷️ **PAR CATÉGORIE**\n"
            response += "┌─────────────────────────────────────────\n"
            for cat in category_kpis['category_distribution'][:7]:
                cat_name = cat.get('category', 'N/A')[:20]
                ca = cat.get('ca_categorie', 0)
                pct = (ca / total_revenue * 100) if total_revenue > 0 else 0
                
                bar_len = int(pct / 5)
                bar = '█' * bar_len + '░' * (20 - bar_len)
                
                if f:
                    response += f"│ {cat_name:20} {bar} {f.format_currency(ca)} ({pct:.1f}%)\n"
                else:
                    response += f"│ {cat_name:20} {bar} {ca:,.2f} MAD ({pct:.1f}%)\n"
            response += "└─────────────────────────────────────────\n\n"
        
        # Par vendeur (top 5)
        if vendor_kpis.get('top_vendors'):
            response += "👥 **PAR VENDEUR (Top 5)**\n"
            response += "┌─────────────────────────────────────────\n"
            for i, v in enumerate(vendor_kpis['top_vendors'][:5]):
                medal = ['🥇', '🥈', '🥉'][i] if i < 3 else f"{i+1}."
                name = v.get('username', 'N/A')[:15]
                ca = v.get('total_revenue', 0)
                pct = (ca / total_revenue * 100) if total_revenue > 0 else 0
                
                if f:
                    response += f"│ {medal} {name:15} {f.format_currency(ca)} ({pct:.1f}%)\n"
                else:
                    response += f"│ {medal} {name:15} {ca:,.2f} MAD ({pct:.1f}%)\n"
            response += "└─────────────────────────────────────────\n\n"
        
        # Par période
        response += "📅 **PAR PÉRIODE**\n"
        response += "┌─────────────────────────────────────────\n"
        
        today = sales_kpis.get('today_sales', 0)
        this_week = sales_kpis.get('current_week_revenue', 0) if 'current_week_revenue' in sales_kpis else 0
        this_month = sales_kpis.get('current_month_revenue', 0)
        
        if f:
            response += f"│ Aujourd'hui:  {f.format_currency(today)}\n"
            if this_week > 0:
                response += f"│ Cette semaine: {f.format_currency(this_week)}\n"
            response += f"│ Ce mois:      {f.format_currency(this_month)}\n"
            response += f"│ Total:        {f.format_currency(total_revenue)}\n"
        else:
            response += f"│ Aujourd'hui:  {today:,.2f} MAD\n"
            if this_week > 0:
                response += f"│ Cette semaine: {this_week:,.2f} MAD\n"
            response += f"│ Ce mois:      {this_month:,.2f} MAD\n"
            response += f"│ Total:        {total_revenue:,.2f} MAD\n"
        
        response += "└─────────────────────────────────────────\n"
        
        return {
            'success': True,
            'message': response,
            'data': {'sales': sales_kpis, 'categories': category_kpis, 'vendors': vendor_kpis}
        }

    def _handle_goal_progress(self, user_id: str, message: str, entities: Dict, role: str) -> Dict:
        """Suivi de la progression vers les objectifs"""
        # Récupérer les KPIs actuels
        if self.kpi:
            sales_kpis = self.kpi.get_sales_kpis()
            vendor_kpis = self.kpi.get_vendor_kpis()
        else:
            sales_kpis = db.get_sales_overview() if hasattr(db, 'get_sales_overview') else {}
            vendor_kpis = {}
        
        f = self.formatter if self.formatter else None
        
        # Objectifs par défaut (à terme, devrait venir de la config)
        # Ces valeurs devraient être configurables
        monthly_target = 500000  # 500K MAD objectif mensuel
        daily_target = monthly_target / 30
        transactions_target = 1000  # 1000 transactions/mois
        avg_basket_target = 500  # 500 MAD panier moyen cible
        
        current_month_revenue = sales_kpis.get('current_month_revenue', 0)
        today_sales = sales_kpis.get('today_sales', 0)
        total_transactions = sales_kpis.get('total_transactions', 0)
        avg_basket = sales_kpis.get('average_basket', 0)
        
        response = "🎯 **PROGRESSION VERS LES OBJECTIFS**\n"
        response += "═" * 40 + "\n\n"
        
        # Objectif CA Mensuel
        month_progress = (current_month_revenue / monthly_target * 100) if monthly_target > 0 else 0
        month_bar = int(month_progress / 5)
        month_bar_str = '█' * min(month_bar, 20) + '░' * max(20 - month_bar, 0)
        
        response += "💰 **OBJECTIF CA MENSUEL**\n"
        response += "┌─────────────────────────────────────────\n"
        if f:
            response += f"│ Objectif: {f.format_currency(monthly_target)}\n"
            response += f"│ Réalisé:  {f.format_currency(current_month_revenue)}\n"
        else:
            response += f"│ Objectif: {monthly_target:,.2f} MAD\n"
            response += f"│ Réalisé:  {current_month_revenue:,.2f} MAD\n"
        response += f"│ Progress: {month_bar_str} {month_progress:.1f}%\n"
        
        if month_progress >= 100:
            response += "│ ✅ **OBJECTIF ATTEINT!**\n"
        elif month_progress >= 75:
            response += "│ 🟢 En bonne voie\n"
        elif month_progress >= 50:
            response += "│ 🟡 À surveiller\n"
        else:
            response += "│ 🔴 Effort supplémentaire requis\n"
        response += "└─────────────────────────────────────────\n\n"
        
        # Objectif Ventes Aujourd'hui
        day_progress = (today_sales / daily_target * 100) if daily_target > 0 else 0
        day_bar = int(day_progress / 5)
        day_bar_str = '█' * min(day_bar, 20) + '░' * max(20 - day_bar, 0)
        
        response += "📅 **OBJECTIF JOURNALIER**\n"
        response += "┌─────────────────────────────────────────\n"
        if f:
            response += f"│ Objectif: {f.format_currency(daily_target)}\n"
            response += f"│ Réalisé:  {f.format_currency(today_sales)}\n"
        else:
            response += f"│ Objectif: {daily_target:,.2f} MAD\n"
            response += f"│ Réalisé:  {today_sales:,.2f} MAD\n"
        response += f"│ Progress: {day_bar_str} {day_progress:.1f}%\n"
        response += "└─────────────────────────────────────────\n\n"
        
        # Objectif Panier Moyen
        basket_progress = (avg_basket / avg_basket_target * 100) if avg_basket_target > 0 else 0
        basket_bar = int(basket_progress / 5)
        basket_bar_str = '█' * min(basket_bar, 20) + '░' * max(20 - basket_bar, 0)
        
        response += "🛒 **OBJECTIF PANIER MOYEN**\n"
        response += "┌─────────────────────────────────────────\n"
        if f:
            response += f"│ Objectif: {f.format_currency(avg_basket_target)}\n"
            response += f"│ Actuel:   {f.format_currency(avg_basket)}\n"
        else:
            response += f"│ Objectif: {avg_basket_target:,.2f} MAD\n"
            response += f"│ Actuel:   {avg_basket:,.2f} MAD\n"
        response += f"│ Progress: {basket_bar_str} {basket_progress:.1f}%\n"
        response += "└─────────────────────────────────────────\n\n"
        
        # Résumé
        response += "📊 **RÉSUMÉ**\n"
        achieved = sum([1 for p in [month_progress, day_progress, basket_progress] if p >= 100])
        on_track = sum([1 for p in [month_progress, day_progress, basket_progress] if 50 <= p < 100])
        
        response += f"• ✅ Objectifs atteints: {achieved}/3\n"
        response += f"• 🟡 En cours: {on_track}/3\n"
        response += f"• 🔴 À améliorer: {3 - achieved - on_track}/3\n"
        
        return {
            'success': True,
            'message': response,
            'data': {'goals': {
                'monthly': {'target': monthly_target, 'current': current_month_revenue, 'progress': month_progress},
                'daily': {'target': daily_target, 'current': today_sales, 'progress': day_progress},
                'basket': {'target': avg_basket_target, 'current': avg_basket, 'progress': basket_progress}
            }}
        }

    def _handle_performance_summary(self, user_id: str, message: str, entities: Dict, role: str) -> Dict:
        """Résumé de performance global - Vue exécutive"""
        # Récupérer tous les KPIs
        if self.kpi:
            all_kpis = self.kpi.get_all_kpis()
            sales = all_kpis.get('sales', {})
            products = all_kpis.get('products', {})
            vendors = all_kpis.get('vendors', {})
            trends = all_kpis.get('trends', {})
            alerts = all_kpis.get('alerts', {})
        else:
            sales = db.get_sales_overview() if hasattr(db, 'get_sales_overview') else {}
            products = db.get_inventory_status() if hasattr(db, 'get_inventory_status') else {}
            vendors = {}
            trends = db.get_sales_trends() if hasattr(db, 'get_sales_trends') else {}
            alerts = {}
        
        f = self.formatter if self.formatter else None
        
        response = "📈 **RÉSUMÉ DE PERFORMANCE EXÉCUTIF**\n"
        response += "═" * 45 + "\n\n"
        
        # Statut global
        growth = sales.get('growth_rate', 0)
        if growth > 10:
            status = "🟢 EXCELLENTE"
        elif growth > 0:
            status = "🟡 BONNE"
        elif growth > -10:
            status = "🟠 À SURVEILLER"
        else:
            status = "🔴 CRITIQUE"
        
        response += f"🎯 **SANTÉ GLOBALE:** {status}\n\n"
        
        # KPIs Clés
        response += "📊 **INDICATEURS CLÉS**\n"
        response += "┌─────────────────────────────────────────────\n"
        
        if f:
            response += f"│ 💰 CA Total:           {f.format_currency(sales.get('total_revenue', 0))}\n"
            response += f"│ 📅 CA Ce Mois:         {f.format_currency(sales.get('current_month_revenue', 0))}\n"
            response += f"│ {f.trend_indicator(growth)} Croissance:        {f.format_percent(growth)}\n"
            response += f"│ 🛒 Transactions:       {f.format_number(sales.get('total_transactions', 0))}\n"
            response += f"│ 🛍️ Panier Moyen:       {f.format_currency(sales.get('average_basket', 0))}\n"
        else:
            response += f"│ 💰 CA Total:           {sales.get('total_revenue', 0):,.2f} MAD\n"
            response += f"│ 📅 CA Ce Mois:         {sales.get('current_month_revenue', 0):,.2f} MAD\n"
            response += f"│ {'📈' if growth > 0 else '📉'} Croissance:        {growth:+.1f}%\n"
            response += f"│ 🛒 Transactions:       {sales.get('total_transactions', 0):,}\n"
            response += f"│ 🛍️ Panier Moyen:       {sales.get('average_basket', 0):,.2f} MAD\n"
        
        response += "├─────────────────────────────────────────────\n"
        response += f"│ 📦 Produits Total:     {products.get('total_products', 0):,}\n"
        response += f"│ ✅ En Stock:           {products.get('in_stock', 0):,}\n"
        response += f"│ ⚠️ Stock Faible:       {products.get('low_stock', 0):,}\n"
        response += f"│ 🔴 En Rupture:         {products.get('out_of_stock', 0):,}\n"
        response += "├─────────────────────────────────────────────\n"
        response += f"│ 👥 Vendeurs Actifs:    {vendors.get('active_this_month', 0):,}\n"
        response += "└─────────────────────────────────────────────\n\n"
        
        # Top Performers
        if vendors.get('top_vendors'):
            response += "🏆 **TOP 3 VENDEURS**\n"
            for i, v in enumerate(vendors['top_vendors'][:3]):
                medal = ['🥇', '🥈', '🥉'][i]
                name = v.get('username', 'N/A')
                ca = v.get('total_revenue', 0)
                if f:
                    response += f"{medal} {name}: {f.format_currency(ca)}\n"
                else:
                    response += f"{medal} {name}: {ca:,.2f} MAD\n"
            response += "\n"
        
        # Alertes
        critical = alerts.get('critical_alerts', 0)
        warnings = alerts.get('warnings', 0)
        
        if critical > 0 or warnings > 0:
            response += "🚨 **ALERTES**\n"
            if critical > 0:
                response += f"🔴 {critical} alerte(s) critique(s)\n"
            if warnings > 0:
                response += f"🟡 {warnings} avertissement(s)\n"
            response += "\n"
        
        # Recommandations rapides
        response += "💡 **ACTIONS RECOMMANDÉES:**\n"
        
        if products.get('out_of_stock', 0) > 5:
            response += f"• ⚠️ {products.get('out_of_stock', 0)} produits en rupture - Réapprovisionner\n"
        
        if growth < 0:
            response += "• 📉 Croissance négative - Revoir stratégie commerciale\n"
        
        if sales.get('average_basket', 0) < 200:
            response += "• 🛒 Panier moyen faible - Promouvoir upselling\n"
        
        if not any([products.get('out_of_stock', 0) > 5, growth < 0, sales.get('average_basket', 0) < 200]):
            response += "• ✅ Aucune action urgente requise\n"
        
        return {
            'success': True,
            'message': response,
            'data': {'performance': {'sales': sales, 'products': products, 'vendors': vendors, 'trends': trends}}
        }

# Instance globale
chatbot = ChatbotEngine()
