import re
from enum import Enum
from typing import Dict, List, Tuple, Any
from datetime import datetime, timedelta

class Intent(Enum):
    # Recherche produits
    SEARCH_PRODUCT = "search_product"
    PRODUCT_DETAILS = "product_details"
    PRODUCTS_BY_CATEGORY = "products_by_category"
    TOP_RATED_PRODUCTS = "top_rated_products"
    BEST_SELLING_PRODUCTS = "best_selling_products"
    LOW_STOCK_PRODUCTS = "low_stock_products"

    # Analyse ventes
    SALES_OVERVIEW = "sales_overview"
    DAILY_SALES = "daily_sales"
    MONTHLY_SALES = "monthly_sales"
    WEEKLY_SALES = "weekly_sales"

    # Transactions detaillees
    TRANSACTION_DETAILS = "transaction_details"
    TRANSACTION_LIST = "transaction_list"
    VENDOR_TRANSACTIONS = "vendor_transactions"
    RECENT_TRANSACTIONS = "recent_transactions"

    # Analytics avancées
    CATEGORY_PERFORMANCE = "category_performance"
    INVENTORY_STATUS = "inventory_status"
    GLOBAL_STATISTICS = "global_statistics"
    PROFIT_ANALYSIS = "profit_analysis"
    REVENUE_BREAKDOWN = "revenue_breakdown"
    PRODUCT_ROTATION = "product_rotation"

    # Vendeurs
    VENDOR_PERFORMANCE = "vendor_performance"
    VENDOR_COMPARISON = "vendor_comparison"
    VENDOR_RANKING = "vendor_ranking"
    MY_STATS = "my_stats"

    # Alertes et Insights
    RECENT_ALERTS = "recent_alerts"
    SMART_INSIGHTS = "smart_insights"
    RECOMMENDATIONS = "recommendations"
    CRITICAL_ALERTS = "critical_alerts"

    # Comparaisons et Tendances
    COMPARE_PERIODS = "compare_periods"
    TRENDS_ANALYSIS = "trends_analysis"
    FORECAST_SALES = "forecast_sales"
    SEASONALITY_ANALYSIS = "seasonality_analysis"

    # Objectifs et KPIs
    KPI_TRACKING = "kpi_tracking"
    GOAL_PROGRESS = "goal_progress"
    PERFORMANCE_SUMMARY = "performance_summary"

    # Analyse produits avancée
    PRODUCT_PROFITABILITY = "product_profitability"
    SLOW_MOVING_PRODUCTS = "slow_moving_products"
    FAST_MOVING_PRODUCTS = "fast_moving_products"
    PRODUCT_COMPARISON = "product_comparison"

    # Rapports
    DAILY_REPORT = "daily_report"
    WEEKLY_REPORT = "weekly_report"
    MONTHLY_REPORT = "monthly_report"
    EXECUTIVE_SUMMARY = "executive_summary"

    # Général
    GREETING = "greeting"
    HELP = "help"
    GENERAL_QUESTION = "general_question"
    UNKNOWN = "unknown"

class IntentClassifier:
    def __init__(self):
        self.patterns = self._build_patterns()
        self.keyword_weights = self._build_keyword_weights()
        self.synonyms = self._build_synonyms()

    def _build_synonyms(self) -> Dict[str, List[str]]:
        """Construit un dictionnaire de synonymes pour améliorer la détection"""
        return {
            'vente': ['vente', 'transaction', 'commande', 'achat', 'deal', 'ordre'],
            'produit': ['produit', 'article', 'item', 'marchandise', 'stock'],
            'vendeur': ['vendeur', 'commercial', 'agent', 'employe', 'collaborateur'],
            'categorie': ['categorie', 'type', 'famille', 'groupe', 'segment'],
            'performance': ['performance', 'resultat', 'rendement', 'efficacite'],
            'revenue': ['revenue', 'ca', 'chiffre', 'recette', 'gain', 'benefice'],
            'meilleur': ['meilleur', 'top', 'best', 'premier', 'champion', 'leader'],
            'analyse': ['analyse', 'etude', 'rapport', 'bilan', 'synthese', 'diagnostic'],
            'tendance': ['tendance', 'trend', 'evolution', 'progression', 'croissance'],
            'alerte': ['alerte', 'warning', 'attention', 'probleme', 'urgent', 'critique'],
            'stock': ['stock', 'inventaire', 'reserve', 'disponible', 'quantite'],
            'rapport': ['rapport', 'report', 'bilan', 'synthese', 'resume', 'recapitulatif'],
        }

    def _build_keyword_weights(self) -> Dict[str, Dict[Intent, float]]:
        """Construit un système de poids pour les mots-clés"""
        return {
            'transaction': {Intent.TRANSACTION_LIST: 0.8, Intent.TRANSACTION_DETAILS: 0.6},
            'vente': {Intent.SALES_OVERVIEW: 0.7, Intent.TRANSACTION_LIST: 0.5},
            'ventes': {Intent.SALES_OVERVIEW: 0.8, Intent.TRANSACTION_LIST: 0.5},
            'produit': {Intent.SEARCH_PRODUCT: 0.6, Intent.PRODUCT_DETAILS: 0.5},
            'stock': {Intent.INVENTORY_STATUS: 0.8, Intent.LOW_STOCK_PRODUCTS: 0.6},
            'vendeur': {Intent.VENDOR_PERFORMANCE: 0.8, Intent.VENDOR_TRANSACTIONS: 0.6},
            'categorie': {Intent.CATEGORY_PERFORMANCE: 0.8, Intent.PRODUCTS_BY_CATEGORY: 0.6},
            'statistique': {Intent.GLOBAL_STATISTICS: 0.9},
            'stats': {Intent.GLOBAL_STATISTICS: 0.9},
            'dashboard': {Intent.GLOBAL_STATISTICS: 0.9},
            'tableau': {Intent.GLOBAL_STATISTICS: 0.7},
            'rapport': {Intent.EXECUTIVE_SUMMARY: 0.8, Intent.DAILY_REPORT: 0.6},
            'report': {Intent.EXECUTIVE_SUMMARY: 0.8},
            'kpi': {Intent.KPI_TRACKING: 0.9},
            'indicateur': {Intent.KPI_TRACKING: 0.8},
            'objectif': {Intent.GOAL_PROGRESS: 0.9},
            'goal': {Intent.GOAL_PROGRESS: 0.9},
            'tendance': {Intent.TRENDS_ANALYSIS: 0.9},
            'trend': {Intent.TRENDS_ANALYSIS: 0.9},
            'evolution': {Intent.TRENDS_ANALYSIS: 0.8, Intent.COMPARE_PERIODS: 0.6},
            'prevision': {Intent.FORECAST_SALES: 0.9},
            'prediction': {Intent.FORECAST_SALES: 0.9},
            'forecast': {Intent.FORECAST_SALES: 0.9},
            'marge': {Intent.PROFIT_ANALYSIS: 0.9},
            'profit': {Intent.PROFIT_ANALYSIS: 0.9},
            'benefice': {Intent.PROFIT_ANALYSIS: 0.8},
            'rentabilite': {Intent.PRODUCT_PROFITABILITY: 0.9},
            'rotation': {Intent.PRODUCT_ROTATION: 0.9},
            'lent': {Intent.SLOW_MOVING_PRODUCTS: 0.8},
            'rapide': {Intent.FAST_MOVING_PRODUCTS: 0.8},
            'alerte': {Intent.RECENT_ALERTS: 0.8, Intent.CRITICAL_ALERTS: 0.6},
            'urgent': {Intent.CRITICAL_ALERTS: 0.9},
            'critique': {Intent.CRITICAL_ALERTS: 0.9},
            'insight': {Intent.SMART_INSIGHTS: 0.9},
            'recommandation': {Intent.RECOMMENDATIONS: 0.9},
            'conseil': {Intent.RECOMMENDATIONS: 0.8},
            'semaine': {Intent.WEEKLY_SALES: 0.7, Intent.WEEKLY_REPORT: 0.6},
            'mois': {Intent.MONTHLY_SALES: 0.7, Intent.MONTHLY_REPORT: 0.6},
            'jour': {Intent.DAILY_SALES: 0.7, Intent.DAILY_REPORT: 0.6},
            'aujourd': {Intent.DAILY_SALES: 0.8},
            'recente': {Intent.RECENT_TRANSACTIONS: 0.8},
            'derniere': {Intent.RECENT_TRANSACTIONS: 0.7},
        }

    def _build_patterns(self) -> Dict[Intent, List[str]]:
        """Construit les patterns regex pour chaque intention"""
        return {
            Intent.SEARCH_PRODUCT: [
                r'cherch[ée]?\s+(?:un\s+)?produit',
                r'trouv[eé]r?\s+(?:un\s+)?produit',
                r'(?:où|ou)\s+(?:est|trouver)',
                r'recherch[eé]r?\s+(.+)',
                r'(?:as-tu|avez-vous)\s+(.+)',
                r'produit\s+(.+)',
                r'je\s+cherche\s+(.+)',
            ],
            Intent.PRODUCT_DETAILS: [
                r'd[ée]tails?\s+(?:du\s+)?produit',
                r'informations?\s+(?:sur\s+)?(?:le\s+)?produit',
                r'(?:montre|affiche|donne)\s+(?:moi\s+)?(?:le\s+)?produit\s+(\d+)',
                r'produit\s+(?:num[ée]ro\s+)?(\d+)',
                r'(?:c\'est\s+quoi|qu\'est-ce\s+que)\s+(.+)',
            ],
            Intent.PRODUCTS_BY_CATEGORY: [
                r'produits?\s+(?:de\s+)?(?:la\s+)?cat[ée]gorie\s+(.+)',
                r'cat[ée]gorie\s+(.+)',
                r'dans\s+(?:la\s+)?cat[ée]gorie',
                r'(?:rayon|famille)\s+(.+)',
                # NE PAS mettre de pattern générique ici pour éviter les faux positifs
            ],
            Intent.TOP_RATED_PRODUCTS: [
                r'meilleur[se]?\s+not[ée]s?',
                r'(?:mieux|bien)\s+not[ée]s?',
                r'(?:top|meilleur[se]?)\s+(?:produits?\s+)?(?:par\s+)?note',
                r'haute[s]?\s+note[s]?',
                r'5\s+[ée]toiles?',
                r'(?:les\s+)?plus\s+populaires?',
            ],
            Intent.BEST_SELLING_PRODUCTS: [
                r'(?:plus|mieux)\s+vendus?',
                r'meilleur[se]?\s+ventes?',
                r'top\s+(?:des\s+)?ventes?',
                r'best[\s-]?sellers?',
                r'produits?\s+populaires?',
            ],
            Intent.LOW_STOCK_PRODUCTS: [
                r'stock\s+faible',
                r'rupture\s+(?:de\s+)?stock',
                r'(?:peu|manque)\s+(?:de\s+)?stock',
                r'(?:produits?\s+)?[àa]\s+r[ée]approvisionner',
                r'alertes?\s+stock',
                r'stock\s+bas',
                r'(?:produits?\s+)?en\s+rupture',  # NOUVEAU
                r'(?:produits?\s+)?(?:sans|0|zero)\s+stock',  # NOUVEAU
                r'(?:qu(?:el)?s?\s+)?produits?\s+(?:sont\s+)?(?:en\s+)?rupture',  # NOUVEAU
                r'(?:qu(?:el)?s?\s+)?produits?\s+(?:n\'?\s*ont\s+)?(?:plus\s+de\s+)?stock',  # NOUVEAU
                r'(?:liste|voir|afficher?|montre)\s+(?:les?\s+)?(?:produits?\s+)?(?:en\s+)?rupture',  # NOUVEAU
            ],
            Intent.TRANSACTION_DETAILS: [
                r'transaction\s+(?:num[ée]ro\s+)?#?(\d+)',
                r'vente\s+(?:num[ée]ro\s+)?#?(\d+)',
                r'd[ée]tails?\s+(?:de\s+)?(?:la\s+)?transaction\s+#?(\d+)',
                r'd[ée]tails?\s+(?:de\s+)?(?:la\s+)?vente\s+#?(\d+)',
                r'(?:montre|affiche|donne)\s+(?:moi\s+)?(?:la\s+)?transaction\s+#?(\d+)',
                r'(?:qu\'est-ce\s+que|c\'est\s+quoi)\s+(?:la\s+)?transaction\s+#?(\d+)',
                r'commande\s+#?(\d+)',
            ],
            Intent.TRANSACTION_LIST: [
                r'(?:toutes?\s+)?(?:les\s+)?transactions',
                r'(?:liste|historique)\s+(?:des?\s+)?(?:transactions?|ventes?|commandes?)',
                r'(?:derni[èe]res?|r[ée]centes?)\s+(?:transactions?|ventes?|commandes?)',
                r'(?:toutes?\s+)?(?:les\s+)?commandes',
                r'historique\s+(?:des?\s+)?ventes?',
            ],
            Intent.VENDOR_TRANSACTIONS: [
                r'(?:transactions?|ventes?)\s+(?:de|du|par)\s+(?:le\s+)?(?:vendeur\s+)?(\w+)',
                r'(?:qu\'est-ce\s+que|quelles?)\s+(?:sont\s+)?(?:les\s+)?ventes?\s+(?:de|du)\s+(\w+)',
                r'commandes?\s+(?:de|du|par)\s+(\w+)',
            ],
            Intent.SALES_OVERVIEW: [
                r'(?:aper[çc]u|r[ée]sum[ée]|vue)\s+(?:des?\s+)?ventes?',
                r'(?:total|chiffre)\s+(?:des?\s+)?ventes?',
                r'(?:comment|combien)\s+(?:de\s+)?ventes?',
                r'performance[s]?\s+(?:des?\s+)?ventes?',
                r'chiffre\s+d\'affaires?',
                r'\brevenu[s]?\b',
                r'\bCA\b',
                r'\bventes?\b',
                r'(?:donne|montre|affiche|voir)(?:r|z)?(?:\s+moi)?(?:\s+les?)?\s+ventes?',
            ],
            Intent.DAILY_SALES: [
                r'ventes?\s+(?:d\')?aujourd\'hui',
                r'ventes?\s+(?:du\s+)?jour',
                r'ventes?\s+journali[èe]res?',
                r'ventes?\s+quotidiennes?',
                r'(?:aujourd\'hui|ce\s+jour)',
            ],
            Intent.MONTHLY_SALES: [
                r'ventes?\s+(?:du\s+)?mois',
                r'ventes?\s+mensuel(?:le)?s?',
                r'(?:ce|le)\s+mois',
                r'mois\s+(?:en\s+)?cours',
            ],
            Intent.CATEGORY_PERFORMANCE: [
                r'performance[s]?\s+(?:des?\s+)?cat[ée]gories?',
                r'cat[ée]gories?\s+(?:les\s+)?(?:plus|mieux)',
                r'(?:quelle|meilleure)\s+cat[ée]gorie',
                r'analyse\s+(?:des?\s+)?cat[ée]gories?',
                r'comparaison\s+cat[ée]gories?',
            ],
            Intent.INVENTORY_STATUS: [
                r'[ée]tat\s+(?:du\s+)?stock',
                r'(?:status?|situation)\s+(?:du\s+)?stock',
                r'inventaire',
                r'(?:niveau|niveaux)\s+(?:de\s+)?stock',
                r'gestion\s+(?:du\s+)?stock',
            ],
            Intent.GLOBAL_STATISTICS: [
                r'\bstatistiques?\b',
                r'\bstats?\b',
                r'(?:r[ée]sum[ée]|vue)\s+d\'ensemble',
                r'\bdashboard\b',
                r'tableau\s+de\s+bord',
                r'(?:tous?\s+les|toutes?\s+les)\s+(?:chiffres?|donn[ée]es?)',
                r'\bKPIs?\b',
                r'\bindicateurs?\b',
                r'donn[ée]e?s?\s+(?:du\s+)?(?:projet|syst[eè]me)',
                r'(?:donne|montre|affiche|voir)(?:r|z)?(?:\s+moi)?(?:\s+les?)?(?:\s+statistiques?|\s+stats?|\s+donn[ée]es?|\s+chiffres?)',
                r'(?:quelles?\s+sont)\s+les',
                r'information[s]?\s+(?:sur|du)',
                r'(?:combien|quel)\s+(?:de|est)',
                r'r[ée]sum[ée]',
                r'bilan',
                r'(?:situation|[ée]tat)\s+(?:actuel|global)',
            ],
            Intent.VENDOR_PERFORMANCE: [
                r'performance[s]?\s+(?:des?\s+)?vendeurs?',
                r'(?:top|meilleur[se]?)\s+vendeurs?',
                r'classement\s+(?:des?\s+)?vendeurs?',
                r'vendeurs?\s+(?:les\s+)?(?:plus|mieux)',
            ],
            Intent.MY_STATS: [
                r'mes?\s+(?:statistiques?|stats?|chiffres?)',
                r'ma\s+performance',
                r'mes?\s+ventes?',
                r'(?:comment|combien)\s+(?:j\'ai|ai-je)',
                r'mon\s+(?:r[ée]sum[ée]|bilan)',
            ],
            Intent.RECENT_ALERTS: [
                r'alertes?',
                r'notifications?',
                r'(?:quoi\s+de\s+)?nouveau',
                r'avertissements?',
                r'probl[èe]mes?',
            ],
            Intent.SMART_INSIGHTS: [
                r'insights?',
                r'analyse\s+(?:intelligente|auto)',
                r'(?:qu(?:\'|e)\s*)?(?:est-ce\s+)?(?:que\s+)?(?:tu\s+)?(?:remarques?|vois?|detectes?)',
                r'diagnostic',
                r'(?:quels?\s+sont)?\s*(?:les\s+)?points?\s+(?:forts?|faibles?)',
                r'opportunit[ée]s?',
                r'(?:qu\s*)?(?:est-ce\s+)?(?:qu\s*)?il\s+(?:y\s+)?a\s+(?:de\s+)?(?:nouveau|interessant)',
            ],
            Intent.RECOMMENDATIONS: [
                r'recommandations?',
                r'conseils?',
                r'suggestions?',
                r'(?:que\s+)?(?:dois|devr|faut|peux)(?:[-\s])?(?:je|on|nous)',
                r'(?:qu(?:\'|e)\s*)?(?:est-ce\s+)?(?:que\s+)?(?:tu\s+)?(?:suggeres?|recommandes?|conseilles?)',
                r'(?:quoi|que)\s+faire',
                r'actions?\s+(?:à|a)\s+(?:prendre|faire)',
                r'priorit[ée]s?',
            ],
            Intent.VENDOR_COMPARISON: [
                r'compar(?:e|aison|er)\s+(?:les\s+)?vendeurs?',
                r'(?:qui|quel)\s+(?:est\s+)?(?:le\s+)?(?:meilleur|top)\s+vendeur',
                r'classement\s+(?:des?\s+)?vendeurs?',
                r'vendeurs?\s+(?:vs|versus|contre)',
                r'performance\s+(?:des?\s+)?(?:chaque|tous?\s+les?)\s+vendeurs?',
            ],
            Intent.COMPARE_PERIODS: [
                r'compar(?:e|aison|er)\s+(?:les?\s+)?(?:p[ée]riodes?|mois|semaines?)',
                r'(?:cette|la)\s+semaine\s+(?:vs|versus|contre|par\s+rapport)',
                r'(?:ce|le)\s+mois\s+(?:vs|versus|contre|par\s+rapport)',
                r'[ée]volution',
                r'progress(?:ion)?',
            ],
            Intent.TRENDS_ANALYSIS: [
                r'tendances?',
                r'(?:ça|ca)\s+(?:monte|baisse|augmente|diminue)',
                r'(?:hausse|baisse)\s+(?:de|des?)',
                r'croissance',
                r'd[ée]clin',
                r'(?:comment\s+)?(?:ça|ca)\s+(?:se\s+)?passe',
                r'(?:comment\s+)?(?:ça|ca)\s+(?:va|marche)',
                r'[ée]volution\s+(?:des?\s+)?(?:ventes?|ca|chiffre)',
                r'trend',
            ],
            # Nouveaux patterns pour les nouvelles intentions
            Intent.WEEKLY_SALES: [
                r'ventes?\s+(?:de\s+)?(?:la\s+)?semaine',
                r'ventes?\s+hebdomadaires?',
                r'cette\s+semaine',
                r'semaine\s+(?:en\s+)?cours',
            ],
            Intent.RECENT_TRANSACTIONS: [
                r'(?:derni[èe]res?|r[ée]centes?)\s+(?:transactions?|ventes?|commandes?)',
                r'transactions?\s+(?:r[ée]centes?|derni[èe]res?)',
                r'(?:les?\s+)?nouvelles?\s+(?:transactions?|ventes?)',
            ],
            Intent.FORECAST_SALES: [
                r'pr[ée]vision[s]?\s+(?:de\s+)?(?:ventes?|ca)',
                r'pr[ée]dire\s+(?:les?\s+)?ventes?',
                r'forecast',
                r'(?:qu(?:\'|e)\s*)?(?:est-ce\s+)?(?:qu\s*)?on\s+(?:va\s+)?vendre',
                r'(?:combien|quel)\s+(?:on\s+)?va\s+(?:vendre|faire)',
                r'estimation[s]?\s+(?:de\s+)?(?:ventes?|ca)',
            ],
            Intent.PROFIT_ANALYSIS: [
                r'(?:analyse\s+)?(?:de\s+)?(?:la\s+)?marge[s]?',
                r'(?:analyse\s+)?(?:du\s+)?profit[s]?',
                r'(?:analyse\s+)?(?:du\s+)?b[ée]n[ée]fice[s]?',
                r'rentabilit[ée]',
                r'(?:quel(?:le)?s?\s+)?(?:sont\s+)?(?:les?\s+)?produits?\s+(?:les?\s+)?plus\s+rentables?',
            ],
            Intent.PRODUCT_ROTATION: [
                r'rotation\s+(?:du\s+)?(?:stock|produit)',
                r'vitesse\s+(?:de\s+)?(?:vente|rotation)',
                r'(?:quel(?:le)?s?\s+)?produits?\s+(?:se\s+)?vend(?:ent)?\s+(?:le\s+)?(?:plus\s+)?(?:vite|rapidement)',
            ],
            Intent.SLOW_MOVING_PRODUCTS: [
                r'produits?\s+(?:qui\s+)?(?:se\s+)?vend(?:ent)?\s+(?:pas|peu|mal|lentement)',
                r'produits?\s+(?:à\s+)?(?:rotation\s+)?lente',
                r'(?:stock\s+)?dormant',
                r'invendus?',
                r'produits?\s+(?:sans|avec\s+peu\s+de)\s+ventes?',
            ],
            Intent.FAST_MOVING_PRODUCTS: [
                r'produits?\s+(?:qui\s+)?(?:se\s+)?vend(?:ent)?\s+(?:bien|vite|rapidement)',
                r'produits?\s+(?:à\s+)?(?:rotation\s+)?rapide',
                r'(?:best|top)\s*sellers?',
            ],
            Intent.KPI_TRACKING: [
                r'\bkpis?\b',
                r'\bindicateurs?\s+(?:cl[ée]s?|performance)\b',
                r'(?:suivi|tracking)\s+(?:des?\s+)?(?:indicateurs?|performance)',
                r'm[ée]triques?',
            ],
            Intent.EXECUTIVE_SUMMARY: [
                r'(?:r[ée]sum[ée]|synth[èe]se)\s+(?:ex[ée]cutif?|direction|g[ée]n[ée]ral)',
                r'rapport\s+(?:de\s+)?direction',
                r'(?:vue|aper[çc]u)\s+(?:d\')?ensemble\s+(?:complet|global)',
                r'bilan\s+(?:complet|global|g[ée]n[ée]ral)',
            ],
            Intent.DAILY_REPORT: [
                r'rapport\s+(?:du\s+)?jour(?:nalier)?',
                r'bilan\s+(?:du\s+)?jour',
                r'(?:r[ée]sum[ée]|synth[èe]se)\s+(?:du\s+)?jour',
            ],
            Intent.WEEKLY_REPORT: [
                r'rapport\s+(?:de\s+)?(?:la\s+)?semaine',
                r'bilan\s+(?:de\s+)?(?:la\s+)?semaine',
                r'(?:r[ée]sum[ée]|synth[èe]se)\s+hebdomadaire',
            ],
            Intent.MONTHLY_REPORT: [
                r'rapport\s+(?:du\s+)?mois',
                r'bilan\s+(?:du\s+)?mois',
                r'(?:r[ée]sum[ée]|synth[èe]se)\s+mensuel(?:le)?',
            ],
            Intent.CRITICAL_ALERTS: [
                r'alertes?\s+(?:critiques?|urgentes?)',
                r'(?:probl[èe]mes?|urgences?)\s+(?:critiques?|graves?)',
                r'(?:qu(?:\'|e)\s*)?(?:est-ce\s+)?(?:qu\s*)?il\s+y\s+a\s+(?:un\s+)?probl[èe]me',
            ],
            Intent.VENDOR_RANKING: [
                r'classement\s+(?:des?\s+)?vendeurs?',
                r'ranking\s+(?:des?\s+)?vendeurs?',
                r'(?:qui\s+)?(?:est\s+)?(?:le\s+)?meilleur\s+vendeur',
                r'(?:top|palmar[èe]s)\s+(?:des?\s+)?vendeurs?',
            ],
            Intent.GREETING: [
                r'^(?:bonjour|salut|hello|hi|hey|coucou|bonsoir)',
                r'^(?:ça|ca)\s+va',
                r'^comment\s+(?:vas?-tu|allez-vous)',
            ],
            Intent.HELP: [
                r'aide(?:z)?(?:-moi)?',
                r'(?:que|qu\'est-ce)\s+(?:peux-tu|pouvez-vous)\s+faire',
                r'(?:comment|quoi)\s+(?:t\'utiliser|utiliser)',
                r'fonctionnalit[ée]s?',
                r'capacit[ée]s?',
                r'(?:tes|vos)\s+(?:fonctions?|capacit[ée]s?)',
            ],
        }

    def classify(self, message: str) -> Tuple[Intent, Dict[str, Any]]:
        """Classifie l'intention d'un message et extrait les entités avec scoring avancé"""
        message_lower = message.lower().strip()
        message_normalized = self._normalize_text(message_lower)
        entities = {}

        # Ordre de priorité pour éviter les faux positifs
        # Les intentions plus spécifiques doivent être vérifiées en premier
        priority_order = [
            Intent.GREETING,
            Intent.HELP,
            # Transactions spécifiques
            Intent.TRANSACTION_DETAILS,
            Intent.VENDOR_TRANSACTIONS,
            Intent.RECENT_TRANSACTIONS,
            Intent.TRANSACTION_LIST,
            # Rapports
            Intent.EXECUTIVE_SUMMARY,
            Intent.DAILY_REPORT,
            Intent.WEEKLY_REPORT,
            Intent.MONTHLY_REPORT,
            # Produits spécifiques
            Intent.PRODUCT_DETAILS,
            Intent.PRODUCT_PROFITABILITY,
            Intent.SLOW_MOVING_PRODUCTS,
            Intent.FAST_MOVING_PRODUCTS,
            Intent.PRODUCT_ROTATION,
            Intent.LOW_STOCK_PRODUCTS,
            Intent.TOP_RATED_PRODUCTS,
            Intent.BEST_SELLING_PRODUCTS,
            Intent.PRODUCTS_BY_CATEGORY,
            # Analytics avancées
            Intent.PROFIT_ANALYSIS,
            Intent.FORECAST_SALES,
            Intent.KPI_TRACKING,
            Intent.TRENDS_ANALYSIS,
            Intent.COMPARE_PERIODS,
            # Vendeurs
            Intent.VENDOR_RANKING,
            Intent.VENDOR_COMPARISON,
            Intent.VENDOR_PERFORMANCE,
            Intent.MY_STATS,
            # Ventes temporelles
            Intent.DAILY_SALES,
            Intent.WEEKLY_SALES,
            Intent.MONTHLY_SALES,
            # Alertes
            Intent.CRITICAL_ALERTS,
            Intent.RECENT_ALERTS,
            Intent.SMART_INSIGHTS,
            Intent.RECOMMENDATIONS,
            # Catégories et inventaire
            Intent.CATEGORY_PERFORMANCE,
            Intent.INVENTORY_STATUS,
            Intent.GLOBAL_STATISTICS,
            Intent.SALES_OVERVIEW,
            Intent.SEARCH_PRODUCT,
        ]

        # D'abord essayer la classification par patterns
        for intent in priority_order:
            if intent not in self.patterns:
                continue
            patterns = self.patterns[intent]
            for pattern in patterns:
                match = re.search(pattern, message_normalized, re.IGNORECASE)
                if match:
                    if match.groups():
                        entities['query'] = match.group(1).strip() if match.lastindex else None
                    entities.update(self._extract_entities(message_normalized, intent))
                    return intent, entities

        # Si pas de match par pattern, utiliser le scoring par mots-clés
        intent_scores = self._calculate_intent_scores(message_normalized)
        if intent_scores:
            best_intent = max(intent_scores, key=intent_scores.get)
            if intent_scores[best_intent] >= 0.5:  # Seuil minimum
                entities.update(self._extract_entities(message_normalized, best_intent))
                return best_intent, entities

        # Si c'est une question générale
        if '?' in message or any(q in message_lower for q in ['comment', 'pourquoi', 'quand', 'où', 'qui', 'que', 'quel', 'combien']):
            return Intent.GENERAL_QUESTION, {'query': message}

        return Intent.UNKNOWN, {'query': message}

    def _normalize_text(self, text: str) -> str:
        """Normalise le texte en remplaçant les synonymes"""
        normalized = text
        for canonical, synonyms in self.synonyms.items():
            for synonym in synonyms:
                if synonym != canonical:
                    normalized = re.sub(r'\b' + synonym + r'\b', canonical, normalized)
        return normalized

    def _calculate_intent_scores(self, message: str) -> Dict[Intent, float]:
        """Calcule les scores pour chaque intention basés sur les mots-clés"""
        scores = {}
        words = message.split()
        
        for word in words:
            word_lower = word.lower().strip('.,!?;:')
            if word_lower in self.keyword_weights:
                for intent, weight in self.keyword_weights[word_lower].items():
                    if intent not in scores:
                        scores[intent] = 0
                    scores[intent] += weight
        
        # Normaliser les scores
        if scores:
            max_score = max(scores.values())
            if max_score > 0:
                scores = {k: v / max_score for k, v in scores.items()}
        
        return scores

    def _extract_entities(self, message: str, intent: Intent) -> Dict[str, Any]:
        """Extrait des entités supplémentaires selon l'intention"""
        entities = {}

        # ============ EXTRACTION DE RÉFÉRENCES PRODUIT ============
        product_refs = self._extract_product_references(message)
        if product_refs:
            entities['product_references'] = product_refs
            if intent == Intent.PRODUCT_DETAILS and product_refs:
                entities['product_id'] = product_refs[0]
            if intent == Intent.SEARCH_PRODUCT and product_refs:
                entities['query'] = product_refs[0]

        # Extraction de nombres
        numbers = re.findall(r'\d+', message)
        if numbers:
            entities['numbers'] = [int(n) for n in numbers]
            if intent == Intent.PRODUCT_DETAILS and 'product_id' not in entities:
                entities['product_id'] = int(numbers[0])
            if intent == Intent.TRANSACTION_DETAILS:
                entities['transaction_id'] = int(numbers[0])

        # Extraction de limites (top X, X premiers)
        limit_match = re.search(r'(?:top|premier[se]?|meilleur[se]?|derniers?|dernières?)\s*(\d+)', message)
        if limit_match:
            entities['limit'] = int(limit_match.group(1))

        # Extraction de périodes
        if 'semaine' in message:
            entities['period'] = 'week'
        elif 'mois' in message:
            entities['period'] = 'month'
        elif 'jour' in message or 'aujourd' in message:
            entities['period'] = 'day'
        elif 'année' in message or 'an' in message:
            entities['period'] = 'year'
        elif 'trimestre' in message:
            entities['period'] = 'quarter'

        # Extraction de dates spécifiques
        date_patterns = [
            (r'(\d{1,2})[/-](\d{1,2})[/-](\d{4})', 'full_date'),
            (r'(\d{1,2})[/-](\d{1,2})', 'partial_date'),
            (r'(?:janvier|fevrier|mars|avril|mai|juin|juillet|aout|septembre|octobre|novembre|decembre)', 'month_name'),
        ]
        for pattern, date_type in date_patterns:
            match = re.search(pattern, message)
            if match:
                entities['date_type'] = date_type
                entities['date_match'] = match.group(0)
                break

        # Extraction de catégories (mots après "catégorie")
        cat_match = re.search(r'cat[ée]gorie\s+(["\']?)([^"\']+)\1', message)
        if cat_match:
            entities['category'] = cat_match.group(2).strip()

        # Extraction de nom de vendeur
        vendor_match = re.search(r'(?:vendeur|de|du|par)\s+(\w+)', message)
        if vendor_match and intent in [Intent.VENDOR_TRANSACTIONS, Intent.VENDOR_PERFORMANCE]:
            entities['vendor_name'] = vendor_match.group(1).strip()

        # Extraction de comparaisons
        compare_match = re.search(r'(?:vs|versus|contre|compar[ée])\s+(.+)', message)
        if compare_match:
            entities['compare_to'] = compare_match.group(1).strip()

        # Extraction de seuils
        threshold_match = re.search(r'(?:moins|plus|sup[ée]rieur|inf[ée]rieur)\s+(?:de\s+)?(\d+)', message)
        if threshold_match:
            entities['threshold'] = int(threshold_match.group(1))

        # Extraction de métriques spécifiques
        metrics = []
        if any(word in message for word in ['ca', 'chiffre', 'revenue', 'revenu']):
            metrics.append('revenue')
        if any(word in message for word in ['quantite', 'volume', 'nombre']):
            metrics.append('quantity')
        if any(word in message for word in ['marge', 'profit', 'benefice']):
            metrics.append('profit')
        if any(word in message for word in ['note', 'rating', 'etoile', 'avis']):
            metrics.append('rating')
        if metrics:
            entities['metrics'] = metrics

        return entities

    def _extract_product_references(self, message: str) -> List[str]:
        """
        Extrait intelligemment les références de produits d'un message.
        Détecte: IDs, ASINs, noms entre guillemets, mots après 'produit', etc.
        """
        refs = []
        message_original = message  # Garder pour les noms avec casse
        message = message.lower()
        
        # 1. IDs numériques (4+ chiffres pour éviter les faux positifs)
        ids = re.findall(r'\b(\d{4,})\b', message)
        refs.extend(ids)
        
        # 2. Codes ASIN Amazon (B0xxxxxxxxx)
        asins = re.findall(r'\b(B0[A-Z0-9]{8,})\b', message_original.upper())
        refs.extend(asins)
        
        # 3. Texte entre guillemets doubles ou simples
        quoted_double = re.findall(r'"([^"]+)"', message_original)
        refs.extend(quoted_double)
        quoted_single = re.findall(r"'([^']+)'", message_original)
        refs.extend(quoted_single)
        
        # 4. Après mots-clés (produit X, article X, ref X, etc.)
        keyword_patterns = [
            r'(?:produit|article|ref|référence|reference|id|#)\s*[:#]?\s*(\S+)',
            r'(?:le|la|un|une)\s+produit\s+(\S+)',
            r'(?:prix|cout|coût|stock)\s+(?:de|du)\s+(\S+)',
            r'(?:cherche|trouve|montre|affiche)\s+(?:le\s+)?(\S+)',
        ]
        for pattern in keyword_patterns:
            matches = re.findall(pattern, message)
            for match in matches:
                # Nettoyer le match
                cleaned = match.strip('.,;:!?()[]{}')
                if cleaned and len(cleaned) > 2 and cleaned not in ['le', 'la', 'les', 'un', 'une', 'de', 'du']:
                    refs.append(cleaned)
        
        # 5. Noms composés avec tirets ou underscores
        compound_names = re.findall(r'\b([a-zA-Z0-9]+[-_][a-zA-Z0-9]+(?:[-_][a-zA-Z0-9]+)*)\b', message_original)
        refs.extend(compound_names)
        
        # Dédupliquer et nettoyer
        unique_refs = []
        seen = set()
        stopwords = {'le', 'la', 'les', 'un', 'une', 'de', 'du', 'des', 'et', 'ou', 'dans', 'pour', 'avec', 'sur'}
        for ref in refs:
            ref_clean = ref.strip().lower()
            if ref_clean not in seen and ref_clean not in stopwords and len(ref_clean) > 1:
                seen.add(ref_clean)
                unique_refs.append(ref.strip())  # Garder la casse originale
        
        return unique_refs

# Instance globale
intent_classifier = IntentClassifier()
