from groq import Groq
from config import Config
from datetime import datetime
import time

# Imports des modules d'amélioration
try:
    from cache import chatbot_cache
    CACHE_AVAILABLE = True
except ImportError:
    CACHE_AVAILABLE = False

try:
    from logger import chatbot_logger
    LOGGER_AVAILABLE = True
except ImportError:
    LOGGER_AVAILABLE = False

try:
    from fallback import fallback_responder
    FALLBACK_AVAILABLE = True
except ImportError:
    FALLBACK_AVAILABLE = False

class GroqClient:
    def __init__(self):
        self.client = Groq(api_key=Config.GROQ_API_KEY)
        self.model = Config.GROQ_MODEL
        self.conversation_history = {}
        self.max_history_length = 15  # Augmenté pour plus de contexte
        self.is_online = True  # Flag pour le mode fallback
        self.last_error_time = None
        self.retry_after_seconds = 30  # Réessayer après 30s en cas d'erreur

    def get_system_prompt(self, role='user', context=None):
        """Genere le prompt systeme base sur le role de l'utilisateur"""
        current_date = datetime.now().strftime("%d/%m/%Y %H:%M")

        base_prompt = f"""Tu es SALESBOT, un Assistant BI/Analytics EXPERT ULTRA-INTELLIGENT dedie EXCLUSIVEMENT a:
"Plateforme de Gestion & Analyse des Ventes - SalesManager"

📅 Date actuelle: {current_date}

=== TA PERSONNALITE ===
Tu es un Conseiller Business Intelligence Senior avec 15 ans d'experience. Tu combines:
- Expert en analyse de donnees et statistiques avancees
- Consultant strategique en ventes et performance commerciale
- Specialiste en optimisation des stocks et supply chain
- Coach en performance pour les equipes de vente
- Analyste predictif capable d'anticiper les tendances

=== TES SUPER-POUVOIRS ===
1. ANALYSE PREDICTIVE: Tu identifies les tendances et anticipes les problemes avant qu'ils arrivent
2. DIAGNOSTIC INTELLIGENT: Tu detectes les anomalies, patterns et opportunites cachees
3. RECOMMANDATIONS ACTIONNABLES: Tu proposes des actions concretes avec ROI estime et priorite
4. COMPARAISONS CONTEXTUELLES: Tu compares les performances dans le temps et entre entites
5. ALERTES PROACTIVES: Tu signales les risques avant qu'ils deviennent critiques
6. SEGMENTATION AVANCEE: Tu analyses par categorie, vendeur, periode, produit
7. OPTIMISATION CONTINUE: Tu suggeres des ameliorations basees sur les donnees

=== CAPACITES D'ANALYSE AVANCEES ===
Tu peux analyser:
- 📊 Tendances de ventes (jour, semaine, mois, trimestre, annee)
- 📦 Rotation des stocks et gestion d'inventaire
- 💰 Marges et rentabilite par produit/categorie
- 👥 Performance individuelle et collective des vendeurs
- 🔮 Previsions et projections de ventes
- 🎯 KPIs et objectifs de performance
- ⚡ Produits a rotation rapide/lente
- 🚨 Alertes et risques (rupture, baisse CA, etc.)

=== REGLES D'OR (INVIOLABLES) ===
1. DONNEES REELLES UNIQUEMENT: Chaque chiffre doit venir du contexte fourni
2. ZERO INVENTION: Si une info manque, dis-le clairement avec ❌
3. CALCULS TRANSPARENTS: Montre comment tu arrives a tes conclusions
4. NOMS EXACTS: Utilise les vrais noms (vendeurs, produits, categories) du systeme
5. PRECISION: Montants en MAD, pourcentages a 1 decimale, dates exactes
6. ACTIONNABLE: Chaque analyse doit mener a une action concrete

=== CE QUE TU DOIS FAIRE ===
✅ Analyser les donnees en profondeur avec des insights uniques
✅ Calculer variations, moyennes, medianes, tendances, correlations
✅ Comparer: jour/jour, semaine/semaine, mois/mois, vendeur/vendeur
✅ Identifier les TOP performers ET les moins performants
✅ Detecter les anomalies (pics, chutes, patterns inhabituels)
✅ Proposer des actions avec impact estime (ex: "Reactiver produit X = +500 MAD/mois potentiel")
✅ Alerter sur les risques (rupture stock, baisse CA, vendeur inactif)
✅ Feliciter les bonnes performances avec les chiffres exacts
✅ Prioriser les recommandations par impact et urgence

=== CE QUE TU NE FAIS JAMAIS ===
❌ Inventer des chiffres ou statistiques
❌ Conseils generiques sans chiffres (jamais "augmentez les ventes de 20%")
❌ Benchmarks externes ou moyennes sectorielles inventees
❌ Reponses vagues sans donnees precises
❌ Supposer des informations non fournies
❌ Ignorer les alertes critiques

=== FORMAT REPONSES ===
- Francais clair et professionnel
- Emojis strategiques: 📊💰📈📉⚠️✅❌🎯🏆💡🔥🚨⭐
- Montants: X,XXX.XX MAD (avec separateurs)
- Pourcentages: X.X% (1 decimale)
- Structure: titres, listes, tableaux Markdown quand utile
- Longueur: Concis mais complet - pas de blabla inutile

=== STYLE DE REPONSE ===
Quand tu analyses, suis ce pattern:
1. 📊 CONSTAT: Les faits et chiffres cles (quoi?)
2. 💡 ANALYSE: Ce que ca signifie (pourquoi?)
3. 🎯 ACTION: Ce qu'il faut faire avec impact estime (comment?)
4. ⚠️ ALERTE: Les risques a surveiller (si pertinent)
5. 🔮 PROJECTION: Ce qui pourrait arriver si rien n'est fait (optionnel)
"""

        role_prompts = {
            'ADMIN': """
=== ROLE: ADMINISTRATEUR SYSTEME ===
Tu assistes le DIRECTEUR/ADMIN du systeme SalesManager. Tu es son bras droit strategique.

🎯 TES MISSIONS PRIORITAIRES:
1. VISION 360°: Vue complete du business en temps reel avec KPIs
2. PERFORMANCE EQUIPE: Analyse de CHAQUE vendeur par nom avec comparaisons et ecarts
3. ALERTES CRITIQUES: Stock faible, ruptures, vendeurs inactifs, anomalies, baisses CA
4. TENDANCES: Evolution CA semaine/mois avec variations en % et projections
5. DECISIONS: Recommandations strategiques avec ROI estime et priorite
6. OPPORTUNITES: Produits a forte marge, categories en croissance
7. RISQUES: Detection precoce des problemes (chute ventes, stock mort, vendeur absent)
8. BENCHMARKING: Comparaison des performances entre vendeurs, categories, periodes

💬 TON STYLE:
- Parle comme un conseiller strategique de confiance
- Sois direct et factuel avec les chiffres
- Propose toujours des actions concretes avec priorite
- Compare les vendeurs entre eux (classement, ecarts, evolution)
- Signale les records et contre-performances
- Anticipe les problemes avant qu'ils arrivent
""",
            'VENDEUR': """
=== ROLE: VENDEUR / COMMERCIAL ===
Tu assistes un VENDEUR sur le terrain. Tu es son coach de vente personnel.

🎯 TES MISSIONS PRIORITAIRES:
1. BEST-SELLERS: Quels produits recommander aux clients (les plus vendus cette semaine)
2. STOCK: Alerter sur les ruptures avant qu'elles arrivent
3. MA PERFORMANCE: Mes ventes vs objectifs vs autres vendeurs (motivation)
4. TENDANCES: Ce qui se vend bien en ce moment (opportunites)
5. TIPS: Conseils pour augmenter son panier moyen
6. PRODUITS COMPLEMENTAIRES: Suggestions de cross-sell basees sur les donnees

💬 TON STYLE:
- Parle comme un mentor commercial bienveillant et motivant
- Encourage avec les reussites chiffrees
- Donne des astuces pratiques basees sur les donnees
- Compare sa performance de maniere constructive (jamais blessante)
- Motive avec des objectifs atteignables et realistes
- Celebre les victoires meme petites
""",
            'ANALYSTE': """
=== ROLE: ANALYSTE DATA / BI ===
Tu assistes un ANALYSTE de donnees. Tu es son copilote analytique expert.

🎯 TES MISSIONS PRIORITAIRES:
1. DEEP ANALYSIS: Statistiques avancees, correlations, patterns, anomalies
2. SEGMENTATION: Analyse par categorie, vendeur, periode, produit, region
3. COMPARAISONS: Multi-criteres avec calculs detailles et significativite
4. KPIs: Suivi des indicateurs cles avec evolution et projections
5. INSIGHTS: Decouvrir ce que les donnees cachent (tendances, correlations)
6. REPORTING: Structure pour rapports et dashboards
7. PREVISIONS: Projections basees sur les tendances historiques

💬 TON STYLE:
- Parle comme un collegue data scientist senior
- Montre TOUS tes calculs et formules
- Propose des hypotheses a valider avec tests
- Suggere des axes d'analyse supplementaires
- Utilise des termes techniques (variance, correlation, regression, etc.)
- Structure tes analyses de facon methodique
""",
            'INVESTISSEUR': """
=== ROLE: INVESTISSEUR / STAKEHOLDER ===
Tu assistes un INVESTISSEUR ou partenaire strategique.

🎯 TES MISSIONS PRIORITAIRES:
1. SANTE FINANCIERE: CA total, croissance, rentabilite, marges
2. CROISSANCE: Evolution mois/mois, trimestre/trimestre avec projections
3. RISQUES: Facteurs pouvant impacter le business (stock, concurrence, saisonnalite)
4. POTENTIEL: Opportunites de developpement et expansion
5. BENCHMARKS: Performance vs historique et objectifs
6. ROI: Retour sur investissement par categorie/produit

💬 TON STYLE:
- Parle comme un CFO ou directeur financier experimente
- Focus sur les metriques financieres cles
- Synthetise avec les chiffres essentiels
- Projete les tendances de croissance avec prudence
- Sois transparent sur les risques et opportunites
- Presente les donnees de facon executive
"""
        }

        prompt = base_prompt + role_prompts.get(role.upper(), role_prompts['VENDEUR'])

        if context:
            prompt += f"\n\n{context}"

        return prompt

    def create_context_from_data(self, data):
        """Cree un contexte textuel COMPLET et STRUCTURE a partir des donnees"""
        if not data:
            return ""

        context_parts = []
        context_parts.append("=" * 60)
        context_parts.append("DONNEES REELLES DU SYSTEME SALESMANAGER - TEMPS REEL")
        context_parts.append("=" * 60)

        # ============ NOUVEAU: PRODUITS RECHERCHES/TROUVES ============
        if 'searched_products' in data and data['searched_products']:
            context_parts.append("\n🔍 PRODUITS TROUVES (Recherche utilisateur)")
            context_parts.append("-" * 40)
            context_parts.append(f"✅ {len(data['searched_products'])} produit(s) correspondant(s):")
            for i, p in enumerate(data['searched_products'][:10], 1):
                context_parts.append(f"\n{i}. **{p.get('title', 'N/A')}**")
                context_parts.append(f"   ID: {p.get('id', 'N/A')}")
                context_parts.append(f"   ASIN: {p.get('asin', 'N/A')}")
                context_parts.append(f"   Prix: {p.get('price', 0):,.2f} MAD")
                context_parts.append(f"   Stock disponible: {p.get('stock', 0)} unites")
                context_parts.append(f"   Categorie: {p.get('category_name', 'N/A')}")
                if p.get('rating'):
                    context_parts.append(f"   Note: {p.get('rating')}/5 ({p.get('review_count', 0)} avis)")
                if p.get('total_sold'):
                    context_parts.append(f"   Total vendu: {p.get('total_sold', 0)} unites")
                if p.get('total_revenue'):
                    context_parts.append(f"   Revenu genere: {p.get('total_revenue', 0):,.2f} MAD")

        # ============ NOUVEAU: PRODUIT COURANT (Detail) ============
        if 'current_product' in data and data['current_product']:
            p = data['current_product']
            context_parts.append("\n📦 PRODUIT EN COURS D'ANALYSE")
            context_parts.append("-" * 40)
            context_parts.append(f"Titre: {p.get('title', 'N/A')}")
            context_parts.append(f"ID: {p.get('id')} | ASIN: {p.get('asin', 'N/A')}")
            context_parts.append(f"Prix: {p.get('price', 0):,.2f} MAD")
            context_parts.append(f"Stock: {p.get('stock', 0)} unites")
            context_parts.append(f"Categorie: {p.get('category_name', 'N/A')}")

        # ============ NOUVEAU: DONNEES LIVE (Dashboard temps reel) ============
        if 'live_data' in data:
            live = data['live_data']
            
            # Stats d'aujourd'hui
            if 'today' in live and live['today']:
                today = live['today']
                context_parts.append("\n📊 AUJOURD'HUI (Temps Reel)")
                context_parts.append("-" * 40)
                context_parts.append(f"• Ventes aujourd'hui: {today.get('ventes_aujourdhui', 0)}")
                context_parts.append(f"• CA aujourd'hui: {today.get('ca_aujourdhui', 0):,.2f} MAD")
                context_parts.append(f"• Vendeurs actifs: {today.get('vendeurs_actifs', 0)}")
            
            # Compteurs globaux
            if 'counts' in live and live['counts']:
                counts = live['counts']
                context_parts.append("\n📈 COMPTEURS GLOBAUX")
                context_parts.append("-" * 40)
                context_parts.append(f"• Total produits: {counts.get('total_products', 0)}")
                context_parts.append(f"• Total categories: {counts.get('total_categories', 0)}")
                context_parts.append(f"• Total vendeurs: {counts.get('total_vendors', 0)}")
                context_parts.append(f"• Total transactions: {counts.get('total_sales', 0)}")

        # ============ NOUVEAU: VENTES DU JOUR ============
        if 'today_sales' in data and data['today_sales']:
            context_parts.append("\n🕐 VENTES D'AUJOURD'HUI")
            context_parts.append("-" * 40)
            for t in data['today_sales'][:10]:
                context_parts.append(f"• Transaction #{t.get('id')} - {t.get('vendeur', 'N/A')}")
                context_parts.append(f"  Montant: {t.get('total_amount', 0):,.2f} MAD | {t.get('total_items', 0)} articles")

        # ============ NOUVEAU: TOUS LES PRODUITS (si demande) ============
        if 'all_products' in data and data['all_products']:
            context_parts.append(f"\n📦 CATALOGUE PRODUITS COMPLET ({data.get('product_count', len(data['all_products']))} produits)")
            context_parts.append("-" * 40)
            for p in data['all_products'][:30]:  # Limiter pour les tokens
                stock_status = "🔴 RUPTURE" if p.get('stock', 0) == 0 else "🟡 Faible" if p.get('stock', 0) < 10 else "✅"
                context_parts.append(f"• ID:{p.get('id')} | {p.get('title', 'N/A')[:35]}")
                context_parts.append(f"  Prix: {p.get('price', 0):,.2f} MAD | Stock: {p.get('stock', 0)} {stock_status}")

        # ============ NOUVEAU: CATEGORIES ============
        if 'categories' in data and data['categories']:
            context_parts.append("\n🏷️ TOUTES LES CATEGORIES")
            context_parts.append("-" * 40)
            for c in data['categories']:
                context_parts.append(f"• {c.get('name', 'N/A')}: {c.get('nb_products', 0)} produits, stock: {c.get('total_stock', 0)}")

        # ============ NOUVEAU: VENDEURS ============
        if 'vendors' in data and data['vendors']:
            context_parts.append("\n👥 TOUS LES VENDEURS")
            context_parts.append("-" * 40)
            for v in data['vendors']:
                context_parts.append(f"• {v.get('username', 'N/A')}: {v.get('nb_sales', 0)} ventes, CA: {v.get('total_revenue', 0):,.2f} MAD")

        # 1. APERCU GLOBAL DES VENTES
        if 'overview' in data or 'sales_overview' in data:
            overview = data.get('overview') or data.get('sales_overview', {})
            context_parts.append("\n📊 APERCU GLOBAL DES VENTES")
            context_parts.append("-" * 40)
            context_parts.append(f"• Nombre total de transactions: {overview.get('total_sales', 0)}")
            context_parts.append(f"• Chiffre d'affaires TOTAL: {overview.get('total_revenue', 0):,.2f} MAD")
            context_parts.append(f"• Panier moyen: {overview.get('avg_order_value', 0):,.2f} MAD")
            context_parts.append(f"• Jours d'activite: {overview.get('active_days', 0)}")
            if overview.get('total_sales', 0) > 0 and overview.get('active_days', 0) > 0:
                ventes_par_jour = overview.get('total_sales', 0) / overview.get('active_days', 1)
                ca_par_jour = overview.get('total_revenue', 0) / overview.get('active_days', 1)
                context_parts.append(f"• Moyenne ventes/jour: {ventes_par_jour:.1f}")
                context_parts.append(f"• CA moyen/jour: {ca_par_jour:,.2f} MAD")

        # 2. TENDANCES ET COMPARAISONS
        if 'trends' in data:
            trends = data['trends']
            context_parts.append("\n📈 TENDANCES ET COMPARAISONS")
            context_parts.append("-" * 40)

            # Semaine
            ca_sem_act = trends.get('ca_semaine_actuelle', 0)
            ca_sem_prec = trends.get('ca_semaine_precedente', 0)
            ventes_sem_act = trends.get('ventes_semaine_actuelle', 0)
            ventes_sem_prec = trends.get('ventes_semaine_precedente', 0)

            context_parts.append("SEMAINE ACTUELLE vs PRECEDENTE:")
            context_parts.append(f"  • CA cette semaine: {ca_sem_act:,.2f} MAD")
            context_parts.append(f"  • CA semaine precedente: {ca_sem_prec:,.2f} MAD")
            if ca_sem_prec > 0:
                var_ca_sem = ((ca_sem_act - ca_sem_prec) / ca_sem_prec) * 100
                tendance = "📈 HAUSSE" if var_ca_sem > 0 else "📉 BAISSE"
                context_parts.append(f"  • Variation CA: {var_ca_sem:+.1f}% ({tendance})")

            context_parts.append(f"  • Ventes cette semaine: {ventes_sem_act}")
            context_parts.append(f"  • Ventes semaine precedente: {ventes_sem_prec}")
            if ventes_sem_prec > 0:
                var_ventes_sem = ((ventes_sem_act - ventes_sem_prec) / ventes_sem_prec) * 100
                context_parts.append(f"  • Variation ventes: {var_ventes_sem:+.1f}%")

            # Mois
            ca_mois_act = trends.get('ca_mois_actuel', 0)
            ca_mois_prec = trends.get('ca_mois_precedent', 0)
            ventes_mois_act = trends.get('ventes_mois_actuel', 0)
            ventes_mois_prec = trends.get('ventes_mois_precedent', 0)

            context_parts.append("\nMOIS ACTUEL vs PRECEDENT:")
            context_parts.append(f"  • CA ce mois: {ca_mois_act:,.2f} MAD")
            context_parts.append(f"  • CA mois precedent: {ca_mois_prec:,.2f} MAD")
            if ca_mois_prec > 0:
                var_ca_mois = ((ca_mois_act - ca_mois_prec) / ca_mois_prec) * 100
                tendance = "📈 HAUSSE" if var_ca_mois > 0 else "📉 BAISSE"
                context_parts.append(f"  • Variation CA mensuel: {var_ca_mois:+.1f}% ({tendance})")

        # 3. INVENTAIRE
        if 'inventory' in data:
            inv = data['inventory']
            context_parts.append("\n📦 ETAT DE L'INVENTAIRE")
            context_parts.append("-" * 40)
            total_prod = inv.get('total_products', 0)
            context_parts.append(f"• Total produits en catalogue: {total_prod}")
            context_parts.append(f"• Produits en stock normal: {inv.get('in_stock', 0)}")
            context_parts.append(f"• Produits en STOCK FAIBLE (<10): {inv.get('low_stock', 0)} ⚠️")
            context_parts.append(f"• Produits en RUPTURE: {inv.get('out_of_stock', 0)} 🔴")
            context_parts.append(f"• Valeur totale inventaire: {inv.get('inventory_value', 0):,.2f} MAD")

            if total_prod > 0:
                pct_rupture = (inv.get('out_of_stock', 0) / total_prod) * 100
                pct_faible = (inv.get('low_stock', 0) / total_prod) * 100
                if pct_rupture > 5:
                    context_parts.append(f"⚠️ ALERTE: {pct_rupture:.1f}% des produits en rupture!")
                if pct_faible > 10:
                    context_parts.append(f"⚠️ ATTENTION: {pct_faible:.1f}% des produits en stock faible!")

        # 4. TOP PRODUITS VENDUS
        if 'top_products' in data and data['top_products']:
            context_parts.append("\n🏆 TOP PRODUITS LES PLUS VENDUS")
            context_parts.append("-" * 40)
            for i, p in enumerate(data['top_products'][:5], 1):
                context_parts.append(f"{i}. {p.get('title', 'N/A')[:40]}")
                context_parts.append(f"   Categorie: {p.get('category', 'N/A')}")
                context_parts.append(f"   Quantite vendue: {p.get('quantite_vendue', 0)} unites")
                context_parts.append(f"   CA genere: {p.get('ca_produit', 0):,.2f} MAD")
                context_parts.append(f"   Stock restant: {p.get('stock', 0)}")

        # 5. PERFORMANCE PAR VENDEUR
        if 'vendor_performance' in data and data['vendor_performance']:
            context_parts.append("\n👥 PERFORMANCE DES VENDEURS")
            context_parts.append("-" * 40)
            total_ca_vendeurs = sum(v.get('ca_total', 0) for v in data['vendor_performance'])
            for i, v in enumerate(data['vendor_performance'], 1):
                ca_vendeur = v.get('ca_total', 0)
                pct_ca = (ca_vendeur / total_ca_vendeurs * 100) if total_ca_vendeurs > 0 else 0
                context_parts.append(f"{i}. {v.get('vendeur', 'N/A')}")
                context_parts.append(f"   Nombre de ventes: {v.get('nb_ventes', 0)}")
                context_parts.append(f"   CA total: {ca_vendeur:,.2f} MAD ({pct_ca:.1f}% du total)")
                context_parts.append(f"   Panier moyen: {v.get('panier_moyen', 0):,.2f} MAD")

        # 6. ANALYSE PAR CATEGORIE
        if 'category_analysis' in data and data['category_analysis']:
            context_parts.append("\n🏷️ ANALYSE PAR CATEGORIE")
            context_parts.append("-" * 40)
            total_ca_cat = sum(c.get('ca_categorie', 0) for c in data['category_analysis'])
            for c in data['category_analysis'][:5]:
                ca_cat = c.get('ca_categorie', 0)
                pct_ca = (ca_cat / total_ca_cat * 100) if total_ca_cat > 0 else 0
                context_parts.append(f"• {c.get('category', 'N/A')}")
                context_parts.append(f"  Produits: {c.get('nb_produits', 0)} | Vendus: {c.get('quantite_vendue', 0)}")
                context_parts.append(f"  CA: {ca_cat:,.2f} MAD ({pct_ca:.1f}%)")
                context_parts.append(f"  Prix moyen: {c.get('prix_moyen', 0):,.2f} MAD")

        # 7. TRANSACTIONS RECENTES
        if 'recent_transactions' in data and data['recent_transactions']:
            context_parts.append("\n🕐 TRANSACTIONS RECENTES")
            context_parts.append("-" * 40)
            for t in data['recent_transactions'][:5]:
                context_parts.append(f"• Transaction #{t.get('id')} - {t.get('sale_date', 'N/A')}")
                context_parts.append(f"  Vendeur: {t.get('vendeur', 'N/A')}")
                context_parts.append(f"  Montant: {t.get('total_amount', 0):,.2f} MAD")
                context_parts.append(f"  Articles: {t.get('total_items', 0)} items")

        # 8. PERFORMANCE JOURNALIERE
        if 'daily_performance' in data and data['daily_performance']:
            context_parts.append("\n📅 PERFORMANCE DES 7 DERNIERS JOURS")
            context_parts.append("-" * 40)
            for d in data['daily_performance']:
                context_parts.append(f"• {d.get('date', 'N/A')}: {d.get('nb_transactions', 0)} ventes | {d.get('ca_jour', 0):,.2f} MAD")

        # 9. PRODUITS JAMAIS VENDUS
        if 'products_never_sold' in data and data['products_never_sold']:
            context_parts.append("\n⚠️ PRODUITS JAMAIS VENDUS")
            context_parts.append("-" * 40)
            for p in data['products_never_sold'][:5]:
                context_parts.append(f"• {p.get('title', 'N/A')[:40]}")
                context_parts.append(f"  Prix: {p.get('price', 0):,.2f} MAD | Stock: {p.get('stock', 0)}")

        # 10. PRODUITS EN STOCK FAIBLE
        if 'low_stock' in data and data['low_stock']:
            context_parts.append("\n🔴 PRODUITS EN STOCK FAIBLE (< 10 unites)")
            context_parts.append("-" * 40)
            for p in data['low_stock'][:5]:
                context_parts.append(f"• {p.get('title', 'N/A')[:40]} - Stock: {p.get('stock', 0)} unites")

        # 11. LISTE COMPLETE DES TRANSACTIONS
        if 'all_transactions' in data and data['all_transactions']:
            context_parts.append("\n📋 LISTE COMPLETE DES TRANSACTIONS")
            context_parts.append("-" * 40)
            for t in data['all_transactions']:
                context_parts.append(f"• Transaction #{t.get('transaction_id')} | {t.get('sale_date', 'N/A')}")
                context_parts.append(f"  Vendeur: {t.get('vendeur', 'N/A')} | Montant: {t.get('total_amount', 0):,.2f} MAD")
                context_parts.append(f"  Articles: {t.get('total_articles', 0)} | Produits: {t.get('produits_vendus', 'N/A')[:60]}")

        # 12. TOUS LES PRODUITS AVEC LEURS VENTES
        if 'all_products_sales' in data and data['all_products_sales']:
            context_parts.append("\n📦 CATALOGUE PRODUITS AVEC VENTES")
            context_parts.append("-" * 40)
            for p in data['all_products_sales'][:20]:
                context_parts.append(f"• ID:{p.get('id')} | {p.get('title', 'N/A')[:35]}")
                context_parts.append(f"  Prix: {p.get('price', 0):,.2f} MAD | Stock: {p.get('stock', 0)}")
                context_parts.append(f"  Vendu: {p.get('total_vendu', 0)} unites | CA: {p.get('ca_genere', 0):,.2f} MAD")

        # 13. DETAILS D'UNE TRANSACTION SPECIFIQUE
        if 'transaction_details' in data and data['transaction_details']:
            t = data['transaction_details']
            context_parts.append("\n🔍 DETAILS TRANSACTION SPECIFIQUE")
            context_parts.append("-" * 40)
            context_parts.append(f"Transaction #{t.get('transaction_id')}")
            context_parts.append(f"Date: {t.get('sale_date', 'N/A')}")
            context_parts.append(f"Vendeur: {t.get('vendeur', 'N/A')} ({t.get('vendeur_email', 'N/A')})")
            context_parts.append(f"Montant total: {t.get('total_amount', 0):,.2f} MAD")
            context_parts.append(f"Nombre d'articles: {t.get('nb_articles', 0)}")
            if 'lignes' in t and t['lignes']:
                context_parts.append("Produits achetes:")
                for l in t['lignes']:
                    context_parts.append(f"  - {l.get('product_name', 'N/A')[:40]}")
                    context_parts.append(f"    Qte: {l.get('quantity', 0)} x {l.get('unit_price', 0):,.2f} MAD = {l.get('line_total', 0):,.2f} MAD")

        # 14. INSIGHTS INTELLIGENTS (ALERTES, OPPORTUNITES, ACHIEVEMENTS)
        if 'smart_insights' in data:
            insights = data['smart_insights']

            if insights.get('alerts'):
                context_parts.append("\n🚨 ALERTES CRITIQUES")
                context_parts.append("-" * 40)
                for alert in insights['alerts']:
                    severity_icon = "🔴" if alert.get('severity') == 'HIGH' else "🟡"
                    context_parts.append(f"{severity_icon} {alert.get('message', '')}")
                    if alert.get('action'):
                        context_parts.append(f"   ➡️ Action: {alert['action']}")

            if insights.get('achievements'):
                context_parts.append("\n🏆 REUSSITES & PERFORMANCES")
                context_parts.append("-" * 40)
                for ach in insights['achievements']:
                    context_parts.append(f"✨ {ach.get('message', '')}")

            if insights.get('opportunities'):
                context_parts.append("\n💡 OPPORTUNITES DETECTEES")
                context_parts.append("-" * 40)
                for opp in insights['opportunities']:
                    context_parts.append(f"🎯 {opp.get('message', '')}")
                    if opp.get('action'):
                        context_parts.append(f"   ➡️ {opp['action']}")

        # 15. COMPARAISON VENDEURS
        if 'vendor_comparison' in data and data['vendor_comparison']:
            vc = data['vendor_comparison']
            context_parts.append("\n📊 COMPARAISON VENDEURS")
            context_parts.append("-" * 40)
            context_parts.append(f"Total vendeurs: {vc.get('nb_vendeurs', 0)}")
            context_parts.append(f"CA total equipe: {vc.get('total_ca', 0):,.2f} MAD")
            context_parts.append(f"Moyenne CA/vendeur: {vc.get('moyenne_ca_par_vendeur', 0):,.2f} MAD")
            if vc.get('top_vendeur'):
                context_parts.append(f"🏆 Champion: {vc['top_vendeur']} ({vc.get('top_ca', 0):,.2f} MAD)")

            if vc.get('vendeurs'):
                context_parts.append("\nClassement:")
                for i, v in enumerate(vc['vendeurs'][:5], 1):
                    medal = ['🥇', '🥈', '🥉'][i-1] if i <= 3 else f"{i}."
                    context_parts.append(f"{medal} {v.get('vendeur')}: {v.get('ca_total', 0):,.2f} MAD ({v.get('part_marche', 0):.1f}% du CA)")

        # 16. METRIQUES CALCULEES
        if 'calculated_metrics' in data:
            cm = data['calculated_metrics']
            context_parts.append("\n📐 METRIQUES CALCULEES")
            context_parts.append("-" * 40)
            context_parts.append(f"CA moyen par jour: {cm.get('ca_par_jour', 0):,.2f} MAD")
            context_parts.append(f"Ventes moyennes par jour: {cm.get('ventes_par_jour', 0):.1f}")
            context_parts.append(f"CA moyen par transaction: {cm.get('ca_par_transaction', 0):,.2f} MAD")

        # 17. MATRICE PRODUITS (BCG simplifiee)
        if 'product_matrix' in data and data['product_matrix']:
            stars = [p for p in data['product_matrix'] if p.get('classification') == 'STAR']
            cash_cows = [p for p in data['product_matrix'] if p.get('classification') == 'CASH_COW']
            questions = [p for p in data['product_matrix'] if p.get('classification') == 'QUESTION']
            dogs = [p for p in data['product_matrix'] if p.get('classification') == 'DOG']

            context_parts.append("\n⭐ MATRICE PRODUITS (BCG)")
            context_parts.append("-" * 40)
            context_parts.append(f"🌟 STARS (ventes elevees, stock eleve): {len(stars)} produits")
            context_parts.append(f"💰 CASH COWS (ventes elevees, stock faible): {len(cash_cows)} produits")
            context_parts.append(f"❓ QUESTIONS (ventes faibles, stock eleve): {len(questions)} produits")
            context_parts.append(f"🐕 DOGS (ventes faibles, stock faible): {len(dogs)} produits")

        # Anciens formats pour compatibilite
        if 'products' in data:
            products = data['products']
            if isinstance(products, list) and len(products) > 0:
                context_parts.append(f"\n📦 Produits trouves ({len(products)}):")
                for p in products[:5]:
                    context_parts.append(f"  - {p.get('title', 'N/A')[:50]} | Prix: {p.get('price', 0):.2f} MAD | Stock: {p.get('stock', 0)}")

        if 'global_stats' in data:
            stats = data['global_stats']
            if 'products' in stats:
                p = stats['products']
                context_parts.append(f"\n📈 Statistiques produits:")
                context_parts.append(f"  - Nombre total: {p.get('total', 0)}")
                context_parts.append(f"  - Prix moyen: {p.get('avg_price', 0):.2f} MAD")
                context_parts.append(f"  - Note moyenne: {p.get('avg_rating', 0):.1f}/5")
            if 'sales' in stats:
                s = stats['sales']
                context_parts.append(f"\n🛒 Statistiques ventes:")
                context_parts.append(f"  - Transactions totales: {s.get('total', 0)}")
                context_parts.append(f"  - Revenue total: {s.get('revenue', 0):.2f} MAD")
            if 'users' in stats:
                u = stats['users']
                context_parts.append(f"\n👥 Utilisateurs:")
                context_parts.append(f"  - Total actifs: {u.get('total', 0)}")
                context_parts.append(f"  - Vendeurs: {u.get('vendors', 0)}")
                context_parts.append(f"  - Admins: {u.get('admins', 0)}")

        context_parts.append("\n" + "=" * 60)
        context_parts.append("FIN DES DONNEES - UTILISE UNIQUEMENT CES INFORMATIONS")
        context_parts.append("=" * 60)

        return '\n'.join(context_parts)

    def chat(self, user_id, message, role='user', data_context=None, intent=None, entities=None):
        """Envoie un message et obtient une reponse via Groq avec cache et fallback"""
        start_time = time.time()
        
        # Log la requête
        if LOGGER_AVAILABLE:
            chatbot_logger.log_request(user_id, message, role)
        
        # ============ VÉRIFIER LE CACHE ============
        if CACHE_AVAILABLE:
            cached_response = chatbot_cache.get_llm_response(message, role)
            if cached_response:
                if LOGGER_AVAILABLE:
                    chatbot_logger.log_cache_hit(f"{role}:{message[:30]}")
                return {
                    'success': True,
                    'message': cached_response,
                    'model': self.model,
                    'cached': True
                }
            else:
                if LOGGER_AVAILABLE:
                    chatbot_logger.log_cache_miss(f"{role}:{message[:30]}")
        
        # ============ VÉRIFIER SI ON PEUT RÉESSAYER APRÈS UNE ERREUR ============
        if not self.is_online and self.last_error_time:
            elapsed = time.time() - self.last_error_time
            if elapsed < self.retry_after_seconds:
                # Utiliser le fallback
                if FALLBACK_AVAILABLE and intent:
                    if LOGGER_AVAILABLE:
                        chatbot_logger.log_llm_error("LLM offline - using fallback", fallback_used=True)
                    return fallback_responder.generate_response(intent, message, entities or {}, role)
            else:
                # Réessayer
                self.is_online = True

        # Initialise l'historique pour cet utilisateur si necessaire
        if user_id not in self.conversation_history:
            self.conversation_history[user_id] = []

        # Construit le contexte
        context = self.create_context_from_data(data_context) if data_context else None
        system_prompt = self.get_system_prompt(role, context)

        # Ajoute le message utilisateur a l'historique
        self.conversation_history[user_id].append({
            'role': 'user',
            'content': message
        })

        # Limite l'historique pour eviter les tokens excessifs
        history = self.conversation_history[user_id][-self.max_history_length:]

        # Prepare les messages pour Groq
        messages = [{'role': 'system', 'content': system_prompt}] + history

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.25,  # Plus bas pour des reponses plus precises et coherentes
                max_tokens=2000,  # Plus de tokens pour des analyses detaillees
                top_p=0.85,
                frequency_penalty=0.1,  # Eviter les repetitions
            )

            assistant_message = response.choices[0].message.content
            duration_ms = (time.time() - start_time) * 1000

            # Ajoute la reponse a l'historique
            self.conversation_history[user_id].append({
                'role': 'assistant',
                'content': assistant_message
            })
            
            # ============ CACHER LA RÉPONSE ============
            if CACHE_AVAILABLE:
                chatbot_cache.cache_llm_response(message, role, assistant_message)
            
            # ============ LOG LE SUCCÈS ============
            if LOGGER_AVAILABLE:
                chatbot_logger.log_llm_call(self.model, duration_ms=duration_ms)
                chatbot_logger.log_response(user_id, intent or 'unknown', duration_ms, True)
            
            # Marquer comme en ligne
            self.is_online = True

            return {
                'success': True,
                'message': assistant_message,
                'model': self.model
            }

        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            error_msg = str(e)
            
            # Marquer comme hors ligne
            self.is_online = False
            self.last_error_time = time.time()
            
            # Log l'erreur
            if LOGGER_AVAILABLE:
                chatbot_logger.log_llm_error(error_msg, fallback_used=FALLBACK_AVAILABLE)
                chatbot_logger.log_response(user_id, intent or 'unknown', duration_ms, False)
            
            # ============ UTILISER LE FALLBACK ============
            if FALLBACK_AVAILABLE and intent:
                return fallback_responder.generate_response(intent, message, entities or {}, role)
            
            return {
                'success': False,
                'error': error_msg,
                'message': f"Desole, je n'ai pas pu traiter votre demande. Erreur: {error_msg}"
            }

    def clear_history(self, user_id):
        """Efface l'historique de conversation d'un utilisateur"""
        if user_id in self.conversation_history:
            self.conversation_history[user_id] = []
        return {'success': True, 'message': 'Historique efface'}

    def get_quick_response(self, prompt, context=None):
        """Obtient une reponse rapide sans historique (pour les analyses)"""
        system_prompt = """Tu es un assistant d'analyse de donnees EXPERT.

REGLES STRICTES:
- Analyse UNIQUEMENT les donnees fournies
- Ne donne JAMAIS de conseils generiques
- Tous les chiffres doivent venir des donnees
- Calcule les variations et pourcentages
- Identifie les tendances specifiques
- Donne des recommandations CONCRETES basees sur les chiffres reels

FORMAT:
- Reponds en francais
- Utilise des emojis
- Formate les montants en MAD
- Sois concis mais precis"""

        if context:
            system_prompt += f"\n\nDONNEES A ANALYSER:\n{context}"

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user', 'content': prompt}
                ],
                temperature=0.3,
                max_tokens=800
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"Erreur d'analyse: {str(e)}"

    def check_connection(self):
        """Verifie la connexion a Groq"""
        try:
            # Test simple avec un message court
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{'role': 'user', 'content': 'test'}],
                max_tokens=5
            )
            return {
                'connected': True,
                'model': self.model,
                'provider': 'Groq Cloud'
            }
        except Exception as e:
            return {
                'connected': False,
                'error': str(e)
            }

# Instance globale
groq_client = GroqClient()
