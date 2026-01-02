from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from config import Config
import pandas as pd
import numpy as np
import re

def convert_to_native(obj):
    """Convertit les types numpy/pandas en types Python natifs pour la sérialisation JSON"""
    if isinstance(obj, dict):
        return {k: convert_to_native(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_to_native(item) for item in obj]
    elif isinstance(obj, (np.integer, np.int64, np.int32)):
        return int(obj)
    elif isinstance(obj, (np.floating, np.float64, np.float32)):
        return float(obj)
    elif isinstance(obj, np.bool_):
        return bool(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif pd.isna(obj):
        return None
    else:
        return obj

class DatabaseManager:
    def __init__(self):
        self.engine = create_engine(Config.get_db_url())
        self.Session = sessionmaker(bind=self.engine)
        # Cache pour les données fréquentes (rafraîchi à chaque requête)
        self._products_cache = None
        self._categories_cache = None

    def execute_query(self, query, params=None):
        """Execute une requête SQL et retourne les résultats"""
        with self.engine.connect() as conn:
            result = conn.execute(text(query), params or {})
            return result.fetchall()

    def get_dataframe(self, query, params=None):
        """Execute une requête et retourne un DataFrame pandas"""
        try:
            return pd.read_sql(text(query), self.engine, params=params)
        except Exception as e:
            print(f"Erreur SQL: {e}")
            return pd.DataFrame()

    def df_to_dict(self, df, orient='records'):
        """Convertit un DataFrame en dict avec types Python natifs"""
        return convert_to_native(df.to_dict(orient))

    # ============ ACCÈS COMPLET AUX DONNÉES (LIVE) ============
    
    def get_all_products_full(self):
        """Récupère TOUS les produits avec leurs détails complets - LIVE"""
        query = """
            SELECT p.id, p.asin, p.title, p.price, p.stock, p.rating, p.review_count,
                   p.rank, p.image_url, c.name as category_name, c.id as category_id,
                   COALESCE(SUM(lv.quantity), 0) as total_sold,
                   COALESCE(SUM(lv.line_total), 0) as total_revenue,
                   COUNT(DISTINCT lv.sale_id) as nb_transactions
            FROM product p
            LEFT JOIN category c ON p.category_id = c.id
            LEFT JOIN ligne_vente lv ON p.id = lv.product_id
            LEFT JOIN sale s ON lv.sale_id = s.id AND s.status != 'CANCELLED'
            GROUP BY p.id, p.asin, p.title, p.price, p.stock, p.rating, 
                     p.review_count, p.rank, p.image_url, c.name, c.id
            ORDER BY p.title
        """
        return self.get_dataframe(query)
    
    def get_all_categories(self):
        """Récupère toutes les catégories avec stats"""
        query = """
            SELECT c.id, c.name, 
                   COUNT(p.id) as nb_products,
                   COALESCE(SUM(p.stock), 0) as total_stock,
                   COALESCE(AVG(p.price), 0) as avg_price
            FROM category c
            LEFT JOIN product p ON c.id = p.category_id
            GROUP BY c.id, c.name
            ORDER BY c.name
        """
        return self.get_dataframe(query)
    
    def get_all_vendors(self):
        """Récupère tous les vendeurs avec leurs stats"""
        query = """
            SELECT u.id, u.username, u.email, u.role, u.active,
                   COUNT(s.id) as nb_sales,
                   COALESCE(SUM(s.total_amount), 0) as total_revenue,
                   COALESCE(AVG(s.total_amount), 0) as avg_sale,
                   MAX(s.sale_date) as last_sale
            FROM users u
            LEFT JOIN sale s ON u.id = s.user_id AND s.status != 'CANCELLED'
            WHERE u.role = 'VENDEUR'
            GROUP BY u.id, u.username, u.email, u.role, u.active
            ORDER BY total_revenue DESC
        """
        return self.get_dataframe(query)

    def smart_search_products(self, search_term: str, limit: int = 20):
        """
        Recherche INTELLIGENTE de produits avec:
        - Recherche exacte par ID
        - Recherche par ASIN
        - Recherche fuzzy par titre
        - Recherche par catégorie
        - Tri par pertinence
        """
        # Nettoyer le terme de recherche
        search_term = search_term.strip()
        
        # Vérifier si c'est un ID numérique
        is_numeric = search_term.isdigit()
        
        query = """
            WITH search_results AS (
                SELECT p.id, p.asin, p.title, p.price, p.stock, p.rating, p.review_count,
                       c.name as category_name,
                       COALESCE(SUM(lv.quantity), 0) as total_sold,
                       CASE 
                           WHEN p.id::text = :exact_term THEN 100
                           WHEN LOWER(p.asin) = LOWER(:exact_term) THEN 95
                           WHEN LOWER(p.title) = LOWER(:exact_term) THEN 90
                           WHEN LOWER(p.title) LIKE LOWER(:start_term) THEN 80
                           WHEN LOWER(p.asin) LIKE LOWER(:start_term) THEN 75
                           WHEN LOWER(p.title) LIKE LOWER(:contains_term) THEN 60
                           WHEN LOWER(p.asin) LIKE LOWER(:contains_term) THEN 55
                           WHEN LOWER(c.name) LIKE LOWER(:contains_term) THEN 40
                           ELSE 10
                       END as relevance_score
                FROM product p
                LEFT JOIN category c ON p.category_id = c.id
                LEFT JOIN ligne_vente lv ON p.id = lv.product_id
                WHERE p.id::text = :exact_term
                   OR LOWER(p.asin) LIKE LOWER(:contains_term)
                   OR LOWER(p.title) LIKE LOWER(:contains_term)
                   OR LOWER(c.name) LIKE LOWER(:contains_term)
                GROUP BY p.id, p.asin, p.title, p.price, p.stock, p.rating, 
                         p.review_count, c.name
            )
            SELECT * FROM search_results
            ORDER BY relevance_score DESC, total_sold DESC
            LIMIT :limit
        """
        
        params = {
            'exact_term': search_term,
            'start_term': f'{search_term}%',
            'contains_term': f'%{search_term}%',
            'limit': limit
        }
        
        return self.get_dataframe(query, params)

    def get_product_by_id(self, product_id):
        """Récupère un produit spécifique par ID avec détails complets"""
        try:
            pid = int(product_id)
        except (ValueError, TypeError):
            return None
            
        query = """
            SELECT p.id, p.asin, p.title, p.price, p.stock, p.rating, p.review_count,
                   p.rank, p.image_url, c.name as category_name,
                   COALESCE(SUM(lv.quantity), 0) as total_sold,
                   COALESCE(SUM(lv.line_total), 0) as total_revenue,
                   COUNT(DISTINCT s.id) as nb_transactions,
                   MIN(s.sale_date) as first_sale,
                   MAX(s.sale_date) as last_sale
            FROM product p
            LEFT JOIN category c ON p.category_id = c.id
            LEFT JOIN ligne_vente lv ON p.id = lv.product_id
            LEFT JOIN sale s ON lv.sale_id = s.id AND s.status != 'CANCELLED'
            WHERE p.id = :id
            GROUP BY p.id, p.asin, p.title, p.price, p.stock, p.rating, 
                     p.review_count, p.rank, p.image_url, c.name
        """
        df = self.get_dataframe(query, {'id': pid})
        return self.df_to_dict(df)[0] if not df.empty else None

    def get_product_by_asin(self, asin):
        """Récupère un produit par ASIN"""
        query = """
            SELECT p.id, p.asin, p.title, p.price, p.stock, p.rating, p.review_count,
                   c.name as category_name,
                   COALESCE(SUM(lv.quantity), 0) as total_sold
            FROM product p
            LEFT JOIN category c ON p.category_id = c.id
            LEFT JOIN ligne_vente lv ON p.id = lv.product_id
            WHERE LOWER(p.asin) = LOWER(:asin)
            GROUP BY p.id, p.asin, p.title, p.price, p.stock, p.rating, 
                     p.review_count, c.name
        """
        df = self.get_dataframe(query, {'asin': asin})
        return self.df_to_dict(df)[0] if not df.empty else None

    def get_today_sales_live(self):
        """Ventes d'aujourd'hui EN TEMPS RÉEL"""
        query = """
            SELECT s.id, s.sale_date, s.total_amount, s.status,
                   u.username as vendeur,
                   COUNT(lv.id) as nb_lignes,
                   SUM(lv.quantity) as total_items,
                   STRING_AGG(LEFT(p.title, 30), ', ') as produits
            FROM sale s
            LEFT JOIN users u ON s.user_id = u.id
            LEFT JOIN ligne_vente lv ON s.id = lv.sale_id
            LEFT JOIN product p ON lv.product_id = p.id
            WHERE DATE(s.sale_date) = CURRENT_DATE
              AND s.status != 'CANCELLED'
            GROUP BY s.id, s.sale_date, s.total_amount, s.status, u.username
            ORDER BY s.sale_date DESC
        """
        return self.get_dataframe(query)

    def get_live_dashboard_data(self):
        """Données LIVE pour le dashboard complet du chatbot"""
        data = {}
        
        # Stats temps réel
        try:
            today_query = """
                SELECT 
                    COUNT(DISTINCT s.id) as ventes_aujourdhui,
                    COALESCE(SUM(s.total_amount), 0) as ca_aujourdhui,
                    COUNT(DISTINCT s.user_id) as vendeurs_actifs
                FROM sale s
                WHERE DATE(s.sale_date) = CURRENT_DATE AND s.status != 'CANCELLED'
            """
            today_df = self.get_dataframe(today_query)
            data['today'] = self.df_to_dict(today_df)[0] if not today_df.empty else {}
        except:
            data['today'] = {}

        # Stats globales
        try:
            data['overview'] = self.get_sales_overview()
        except:
            data['overview'] = {}

        # Inventaire
        try:
            data['inventory'] = self.get_inventory_status()
        except:
            data['inventory'] = {}

        # Tendances
        try:
            data['trends'] = self.get_sales_trends()
        except:
            data['trends'] = {}

        # Nombre total de produits et catégories
        try:
            counts_query = """
                SELECT 
                    (SELECT COUNT(*) FROM product) as total_products,
                    (SELECT COUNT(*) FROM category) as total_categories,
                    (SELECT COUNT(*) FROM users WHERE role = 'VENDEUR') as total_vendors,
                    (SELECT COUNT(*) FROM sale WHERE status != 'CANCELLED') as total_sales
            """
            counts_df = self.get_dataframe(counts_query)
            data['counts'] = self.df_to_dict(counts_df)[0] if not counts_df.empty else {}
        except:
            data['counts'] = {}

        return data

    def build_full_context_for_message(self, message: str):
        """
        Construit un contexte COMPLET basé sur le message de l'utilisateur.
        Cette méthode analyse le message et récupère les données pertinentes.
        """
        context = {}
        message_lower = message.lower()
        
        # 1. TOUJOURS inclure les données de base
        context['live_data'] = self.get_live_dashboard_data()
        
        # 2. Recherche de produits mentionnés
        product_refs = self._extract_product_references(message)
        if product_refs:
            context['searched_products'] = []
            for ref in product_refs:
                # Essayer par ID
                if ref.isdigit():
                    product = self.get_product_by_id(int(ref))
                    if product:
                        context['searched_products'].append(product)
                        continue
                
                # Essayer par recherche
                results = self.smart_search_products(ref, limit=5)
                if not results.empty:
                    context['searched_products'].extend(self.df_to_dict(results))
        
        # 3. Si question sur les prix/stock, inclure la liste des produits
        if any(word in message_lower for word in ['prix', 'cout', 'coute', 'combien', 'tarif', 'stock', 'disponible', 'quantite']):
            products_df = self.get_all_products_full()
            context['all_products'] = self.df_to_dict(products_df.head(50))
            context['product_count'] = len(products_df)
        
        # 4. Si question sur les catégories
        if any(word in message_lower for word in ['categorie', 'type', 'famille', 'rayon']):
            context['categories'] = self.df_to_dict(self.get_all_categories())
        
        # 5. Si question sur les vendeurs
        if any(word in message_lower for word in ['vendeur', 'commercial', 'equipe', 'employe']):
            context['vendors'] = self.df_to_dict(self.get_all_vendors())
        
        # 6. Si question sur les ventes/transactions
        if any(word in message_lower for word in ['vente', 'transaction', 'commande', 'vendu', 'aujourd']):
            context['today_sales'] = self.df_to_dict(self.get_today_sales_live())
            context['recent_transactions'] = self.df_to_dict(self.get_recent_transactions(10))
        
        # 7. Si question sur les top/meilleur
        if any(word in message_lower for word in ['top', 'meilleur', 'best', 'premier', 'plus vendu']):
            context['top_products'] = self.df_to_dict(self.get_best_selling_products(10))
            context['top_rated'] = self.df_to_dict(self.get_top_rated_products(10))
        
        # 8. Si question sur les alertes/problèmes
        if any(word in message_lower for word in ['alerte', 'probleme', 'rupture', 'faible', 'critique', 'urgent']):
            context['low_stock'] = self.df_to_dict(self.get_low_stock_products(15))
            try:
                context['smart_insights'] = self.get_smart_insights()
            except:
                context['smart_insights'] = {}
        
        return context

    def _extract_product_references(self, message: str) -> list:
        """Extrait les références de produits du message utilisateur"""
        refs = []
        
        # IDs numériques (4+ chiffres)
        ids = re.findall(r'\b(\d{4,})\b', message)
        refs.extend(ids)
        
        # Texte entre guillemets
        quoted = re.findall(r'"([^"]+)"', message)
        refs.extend(quoted)
        quoted_single = re.findall(r"'([^']+)'", message)
        refs.extend(quoted_single)
        
        # Après "produit", "article", "ref", etc.
        after_keywords = re.findall(
            r'(?:produit|article|ref|référence|id)\s+[#]?(\w+)',
            message.lower()
        )
        refs.extend(after_keywords)
        
        # Codes ASIN (B0xxxxxxxx)
        asins = re.findall(r'\b(B0[A-Z0-9]{8,})\b', message.upper())
        refs.extend(asins)
        
        return list(set(refs))  # Dédupliquer

    # ============ PRODUITS (LEGACY) ============
    def search_products(self, search_term, limit=10):
        """Recherche des produits par titre, ASIN ou catégorie"""
        query = """
            SELECT p.id, p.asin, p.title, p.price, p.stock, p.rating, p.review_count,
                   c.name as category_name
            FROM product p
            LEFT JOIN category c ON p.category_id = c.id
            WHERE LOWER(p.title) LIKE LOWER(:search)
               OR LOWER(p.asin) LIKE LOWER(:search)
               OR LOWER(c.name) LIKE LOWER(:search)
            ORDER BY p.rating DESC NULLS LAST
            LIMIT :limit
        """
        return self.get_dataframe(query, {'search': f'%{search_term}%', 'limit': limit})

    def get_product_details(self, product_id):
        """Obtient les détails complets d'un produit"""
        query = """
            SELECT p.*, c.name as category_name,
                   (SELECT COUNT(*) FROM ligne_vente lv WHERE lv.product_id = p.id) as total_sales,
                   (SELECT COALESCE(SUM(lv.line_total), 0) FROM ligne_vente lv WHERE lv.product_id = p.id) as total_revenue
            FROM product p
            LEFT JOIN category c ON p.category_id = c.id
            WHERE p.id = :id
        """
        df = self.get_dataframe(query, {'id': product_id})
        return self.df_to_dict(df)[0] if not df.empty else None

    def get_products_by_category(self, category_name, limit=20):
        """Obtient les produits d'une catégorie"""
        query = """
            SELECT p.id, p.title, p.price, p.stock, p.rating, c.name as category
            FROM product p
            JOIN category c ON p.category_id = c.id
            WHERE LOWER(c.name) LIKE LOWER(:category)
            ORDER BY p.rating DESC NULLS LAST
            LIMIT :limit
        """
        return self.get_dataframe(query, {'category': f'%{category_name}%', 'limit': limit})

    def get_low_stock_products(self, threshold=10):
        """Produits avec stock faible (< threshold) OU en rupture (stock = 0)"""
        query = """
            SELECT p.id, p.title, p.stock, p.price, c.name as category,
                   CASE WHEN p.stock = 0 THEN 'RUPTURE' 
                        WHEN p.stock < 5 THEN 'CRITIQUE'
                        ELSE 'FAIBLE' END as status_stock,
                   p.stock * p.price as valeur_bloquee
            FROM product p
            LEFT JOIN category c ON p.category_id = c.id
            WHERE p.stock < :threshold
            ORDER BY p.stock ASC, p.price DESC
        """
        return self.get_dataframe(query, {'threshold': threshold})

    def get_out_of_stock_products(self, limit=50):
        """Produits en RUPTURE DE STOCK (stock = 0)"""
        query = """
            SELECT p.id, p.title, p.price, c.name as category,
                   p.rating, p.review_count,
                   COALESCE(SUM(lv.quantity), 0) as historique_ventes
            FROM product p
            LEFT JOIN category c ON p.category_id = c.id
            LEFT JOIN ligne_vente lv ON p.id = lv.product_id
            WHERE p.stock = 0
            GROUP BY p.id, p.title, p.price, c.name, p.rating, p.review_count
            ORDER BY historique_ventes DESC
            LIMIT :limit
        """
        return self.get_dataframe(query, {'limit': limit})

    def get_top_rated_products(self, limit=10):
        """Produits les mieux notés"""
        query = """
            SELECT p.id, p.title, p.price, p.rating, p.review_count, c.name as category
            FROM product p
            LEFT JOIN category c ON p.category_id = c.id
            WHERE p.rating IS NOT NULL
            ORDER BY p.rating DESC, p.review_count DESC
            LIMIT :limit
        """
        return self.get_dataframe(query, {'limit': limit})

    def get_best_selling_products(self, limit=10):
        """Produits les plus vendus"""
        query = """
            SELECT p.id, p.title, p.price, c.name as category,
                   COUNT(lv.id) as sales_count,
                   COALESCE(SUM(lv.quantity), 0) as total_quantity,
                   COALESCE(SUM(lv.line_total), 0) as total_revenue
            FROM product p
            LEFT JOIN category c ON p.category_id = c.id
            LEFT JOIN ligne_vente lv ON p.id = lv.product_id
            GROUP BY p.id, p.title, p.price, c.name
            ORDER BY total_quantity DESC
            LIMIT :limit
        """
        return self.get_dataframe(query, {'limit': limit})

    # ============ ANALYTICS ============
    def get_sales_overview(self):
        """Vue d'ensemble des ventes"""
        query = """
            SELECT
                COUNT(DISTINCT s.id) as total_sales,
                COALESCE(SUM(s.total_amount), 0) as total_revenue,
                COALESCE(AVG(s.total_amount), 0) as avg_order_value,
                COUNT(DISTINCT DATE(s.sale_date)) as active_days
            FROM sale s
            WHERE s.status != 'CANCELLED'
        """
        df = self.get_dataframe(query)
        return self.df_to_dict(df)[0] if not df.empty else {}

    def get_daily_sales(self, days=30):
        """Ventes journalières des X derniers jours"""
        query = """
            SELECT DATE(s.sale_date) as date,
                   COUNT(*) as sales_count,
                   SUM(s.total_amount) as revenue
            FROM sale s
            WHERE s.status != 'CANCELLED'
              AND s.sale_date >= CURRENT_DATE - INTERVAL ':days days'
            GROUP BY DATE(s.sale_date)
            ORDER BY date DESC
        """
        return self.get_dataframe(query.replace(':days', str(days)))

    def get_monthly_sales(self, months=12):
        """Ventes mensuelles des X derniers mois"""
        query = """
            SELECT TO_CHAR(s.sale_date, 'YYYY-MM') as month,
                   COUNT(*) as sales_count,
                   SUM(s.total_amount) as revenue
            FROM sale s
            WHERE s.status != 'CANCELLED'
              AND s.sale_date >= CURRENT_DATE - INTERVAL ':months months'
            GROUP BY TO_CHAR(s.sale_date, 'YYYY-MM')
            ORDER BY month DESC
        """
        return self.get_dataframe(query.replace(':months', str(months)))

    def get_category_performance(self):
        """Performance par catégorie"""
        query = """
            SELECT c.name as category,
                   COUNT(DISTINCT p.id) as product_count,
                   COALESCE(AVG(p.price), 0) as avg_price,
                   COALESCE(AVG(p.rating), 0) as avg_rating,
                   COALESCE(SUM(lv.quantity), 0) as total_sold,
                   COALESCE(SUM(lv.line_total), 0) as total_revenue
            FROM category c
            LEFT JOIN product p ON c.id = p.category_id
            LEFT JOIN ligne_vente lv ON p.id = lv.product_id
            GROUP BY c.id, c.name
            ORDER BY total_revenue DESC
        """
        return self.get_dataframe(query)

    def get_inventory_status(self):
        """Status de l'inventaire"""
        query = """
            SELECT
                COUNT(*) as total_products,
                SUM(CASE WHEN stock = 0 THEN 1 ELSE 0 END) as out_of_stock,
                SUM(CASE WHEN stock > 0 AND stock < 10 THEN 1 ELSE 0 END) as low_stock,
                SUM(CASE WHEN stock >= 10 THEN 1 ELSE 0 END) as in_stock,
                COALESCE(SUM(stock * price), 0) as inventory_value
            FROM product
        """
        df = self.get_dataframe(query)
        return self.df_to_dict(df)[0] if not df.empty else {}

    # ============ USERS & VENDORS ============
    def get_vendor_performance(self, limit=10):
        """Performance des vendeurs"""
        query = """
            SELECT u.id, u.username, u.email,
                   COUNT(s.id) as sales_count,
                   COALESCE(SUM(s.total_amount), 0) as total_revenue,
                   COALESCE(AVG(s.total_amount), 0) as avg_sale_value
            FROM users u
            LEFT JOIN sale s ON u.id = s.user_id AND s.status != 'CANCELLED'
            WHERE u.role = 'VENDEUR'
            GROUP BY u.id, u.username, u.email
            ORDER BY total_revenue DESC
            LIMIT :limit
        """
        return self.get_dataframe(query, {'limit': limit})

    def get_user_stats(self, user_id):
        """Statistiques d'un utilisateur spécifique"""
        query = """
            SELECT u.username, u.role,
                   COUNT(s.id) as total_sales,
                   COALESCE(SUM(s.total_amount), 0) as total_revenue,
                   MAX(s.sale_date) as last_sale_date
            FROM users u
            LEFT JOIN sale s ON u.id = s.user_id
            WHERE u.id = :user_id
            GROUP BY u.id, u.username, u.role
        """
        df = self.get_dataframe(query, {'user_id': user_id})
        return self.df_to_dict(df)[0] if not df.empty else None

    # ============ ALERTS ============
    def get_recent_alerts(self, limit=10):
        """Alertes récentes"""
        query = """
            SELECT id, type, title, message, priority, created_at as createdAt, is_read
            FROM alert
            ORDER BY created_at DESC
            LIMIT :limit
        """
        try:
            return self.get_dataframe(query, {'limit': limit})
        except Exception as e:
            # Si la table alert n'existe pas, retourne un DataFrame vide
            import pandas as pd
            return pd.DataFrame()

    def get_unread_alerts_count(self):
        """Nombre d'alertes non lues"""
        query = "SELECT COUNT(*) as count FROM alert WHERE is_read = false"
        df = self.get_dataframe(query)
        return int(df['count'].iloc[0]) if not df.empty else 0

    # ============ GLOBAL STATS ============
    def get_global_statistics(self):
        """Statistiques globales du système"""
        stats = {}

        # Produits
        product_query = """
            SELECT COUNT(*) as total,
                   COALESCE(AVG(price), 0) as avg_price,
                   COALESCE(AVG(rating), 0) as avg_rating,
                   SUM(stock) as total_stock
            FROM product
        """
        stats['products'] = self.df_to_dict(self.get_dataframe(product_query))[0]

        # Catégories
        category_query = "SELECT COUNT(*) as total FROM category"
        stats['categories'] = int(self.get_dataframe(category_query)['total'].iloc[0])

        # Ventes
        sales_query = """
            SELECT COUNT(*) as total,
                   COALESCE(SUM(total_amount), 0) as revenue
            FROM sale WHERE status != 'CANCELLED'
        """
        stats['sales'] = self.df_to_dict(self.get_dataframe(sales_query))[0]

        # Utilisateurs
        user_query = """
            SELECT COUNT(*) as total,
                   SUM(CASE WHEN role = 'VENDEUR' THEN 1 ELSE 0 END) as vendors,
                   SUM(CASE WHEN role = 'ADMIN' THEN 1 ELSE 0 END) as admins
            FROM users WHERE active = true
        """
        stats['users'] = self.df_to_dict(self.get_dataframe(user_query))[0]

        return stats

    # ============ ADVANCED ANALYTICS FOR AI ============
    def get_recent_transactions(self, limit=10):
        """Obtient les transactions recentes avec details"""
        query = """
            SELECT s.id, s.sale_date, s.total_amount, s.status,
                   u.username as vendeur,
                   COUNT(lv.id) as nb_lignes,
                   SUM(lv.quantity) as total_items
            FROM sale s
            LEFT JOIN users u ON s.user_id = u.id
            LEFT JOIN ligne_vente lv ON s.id = lv.sale_id
            WHERE s.status != 'CANCELLED'
            GROUP BY s.id, s.sale_date, s.total_amount, s.status, u.username
            ORDER BY s.sale_date DESC
            LIMIT :limit
        """
        return self.get_dataframe(query, {'limit': limit})

    def get_sales_by_vendor(self):
        """Ventes par vendeur avec details"""
        query = """
            SELECT u.username as vendeur,
                   COUNT(s.id) as nb_ventes,
                   COALESCE(SUM(s.total_amount), 0) as ca_total,
                   COALESCE(AVG(s.total_amount), 0) as panier_moyen,
                   MIN(s.sale_date) as premiere_vente,
                   MAX(s.sale_date) as derniere_vente
            FROM users u
            LEFT JOIN sale s ON u.id = s.user_id AND s.status != 'CANCELLED'
            WHERE u.role = 'VENDEUR'
            GROUP BY u.id, u.username
            ORDER BY ca_total DESC
        """
        return self.get_dataframe(query)

    def get_top_selling_products_detailed(self, limit=10):
        """Top produits vendus avec analyse complete"""
        query = """
            SELECT p.id, p.title, p.price, p.stock, c.name as category,
                   COUNT(DISTINCT s.id) as nb_transactions,
                   COALESCE(SUM(lv.quantity), 0) as quantite_vendue,
                   COALESCE(SUM(lv.line_total), 0) as ca_produit,
                   COALESCE(AVG(lv.unit_price), p.price) as prix_moyen_vente
            FROM product p
            LEFT JOIN category c ON p.category_id = c.id
            LEFT JOIN ligne_vente lv ON p.id = lv.product_id
            LEFT JOIN sale s ON lv.sale_id = s.id AND s.status != 'CANCELLED'
            GROUP BY p.id, p.title, p.price, p.stock, c.name
            HAVING SUM(lv.quantity) > 0
            ORDER BY quantite_vendue DESC
            LIMIT :limit
        """
        return self.get_dataframe(query, {'limit': limit})

    def get_products_never_sold(self, limit=20):
        """Produits jamais vendus"""
        query = """
            SELECT p.id, p.title, p.price, p.stock, c.name as category,
                   p.stock * p.price as valeur_stock
            FROM product p
            LEFT JOIN category c ON p.category_id = c.id
            LEFT JOIN ligne_vente lv ON p.id = lv.product_id
            WHERE lv.id IS NULL
            ORDER BY p.price DESC
            LIMIT :limit
        """
        return self.get_dataframe(query, {'limit': limit})

    def get_sales_trends(self):
        """Tendances de ventes (comparaison periodes)"""
        query = """
            WITH current_week AS (
                SELECT COALESCE(SUM(total_amount), 0) as revenue,
                       COUNT(*) as nb_ventes
                FROM sale
                WHERE status != 'CANCELLED'
                  AND sale_date >= CURRENT_DATE - INTERVAL '7 days'
            ),
            previous_week AS (
                SELECT COALESCE(SUM(total_amount), 0) as revenue,
                       COUNT(*) as nb_ventes
                FROM sale
                WHERE status != 'CANCELLED'
                  AND sale_date >= CURRENT_DATE - INTERVAL '14 days'
                  AND sale_date < CURRENT_DATE - INTERVAL '7 days'
            ),
            current_month AS (
                SELECT COALESCE(SUM(total_amount), 0) as revenue,
                       COUNT(*) as nb_ventes
                FROM sale
                WHERE status != 'CANCELLED'
                  AND sale_date >= DATE_TRUNC('month', CURRENT_DATE)
            ),
            previous_month AS (
                SELECT COALESCE(SUM(total_amount), 0) as revenue,
                       COUNT(*) as nb_ventes
                FROM sale
                WHERE status != 'CANCELLED'
                  AND sale_date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'
                  AND sale_date < DATE_TRUNC('month', CURRENT_DATE)
            )
            SELECT
                cw.revenue as ca_semaine_actuelle,
                cw.nb_ventes as ventes_semaine_actuelle,
                pw.revenue as ca_semaine_precedente,
                pw.nb_ventes as ventes_semaine_precedente,
                cm.revenue as ca_mois_actuel,
                cm.nb_ventes as ventes_mois_actuel,
                pm.revenue as ca_mois_precedent,
                pm.nb_ventes as ventes_mois_precedent
            FROM current_week cw, previous_week pw, current_month cm, previous_month pm
        """
        df = self.get_dataframe(query)
        return self.df_to_dict(df)[0] if not df.empty else {}

    def get_category_analysis(self):
        """Analyse detaillee par categorie"""
        query = """
            SELECT c.name as category,
                   COUNT(DISTINCT p.id) as nb_produits,
                   COALESCE(AVG(p.price), 0) as prix_moyen,
                   COALESCE(MIN(p.price), 0) as prix_min,
                   COALESCE(MAX(p.price), 0) as prix_max,
                   COALESCE(SUM(p.stock), 0) as stock_total,
                   COALESCE(SUM(lv.quantity), 0) as quantite_vendue,
                   COALESCE(SUM(lv.line_total), 0) as ca_categorie,
                   CASE WHEN COUNT(DISTINCT p.id) > 0
                        THEN ROUND(COALESCE(SUM(lv.quantity), 0)::numeric / COUNT(DISTINCT p.id), 2)
                        ELSE 0 END as ventes_par_produit
            FROM category c
            LEFT JOIN product p ON c.id = p.category_id
            LEFT JOIN ligne_vente lv ON p.id = lv.product_id
            LEFT JOIN sale s ON lv.sale_id = s.id AND s.status != 'CANCELLED'
            GROUP BY c.id, c.name
            ORDER BY ca_categorie DESC
        """
        return self.get_dataframe(query)

    def get_daily_performance(self, days=7):
        """Performance journaliere detaillee"""
        query = """
            SELECT DATE(s.sale_date) as date,
                   COUNT(DISTINCT s.id) as nb_transactions,
                   SUM(s.total_amount) as ca_jour,
                   AVG(s.total_amount) as panier_moyen,
                   COUNT(DISTINCT s.user_id) as vendeurs_actifs,
                   SUM(lv.quantity) as articles_vendus
            FROM sale s
            LEFT JOIN ligne_vente lv ON s.id = lv.sale_id
            WHERE s.status != 'CANCELLED'
              AND s.sale_date >= CURRENT_DATE - INTERVAL ':days days'
            GROUP BY DATE(s.sale_date)
            ORDER BY date DESC
        """
        return self.get_dataframe(query.replace(':days', str(days)))

    def get_comprehensive_context(self):
        """Recupere un contexte complet pour l'IA avec gestion d'erreurs"""
        context = {}
        
        # Chaque appel est protégé par try-except pour éviter les échecs en cascade
        try:
            context['overview'] = self.get_sales_overview()
        except Exception as e:
            context['overview'] = {'error': str(e)}
        
        try:
            context['inventory'] = self.get_inventory_status()
        except Exception as e:
            context['inventory'] = {'error': str(e)}
        
        try:
            context['trends'] = self.get_sales_trends()
        except Exception as e:
            context['trends'] = {'error': str(e)}
        
        try:
            context['top_products'] = self.df_to_dict(self.get_top_selling_products_detailed(5))
        except Exception as e:
            context['top_products'] = []
        
        try:
            context['category_analysis'] = self.df_to_dict(self.get_category_analysis())
        except Exception as e:
            context['category_analysis'] = []
        
        try:
            context['recent_transactions'] = self.df_to_dict(self.get_recent_transactions(5))
        except Exception as e:
            context['recent_transactions'] = []
        
        try:
            context['vendor_performance'] = self.df_to_dict(self.get_sales_by_vendor())
        except Exception as e:
            context['vendor_performance'] = []
        
        try:
            context['daily_performance'] = self.df_to_dict(self.get_daily_performance(7))
        except Exception as e:
            context['daily_performance'] = []
        
        try:
            context['products_never_sold'] = self.df_to_dict(self.get_products_never_sold(5))
        except Exception as e:
            context['products_never_sold'] = []
        
        try:
            context['low_stock'] = self.df_to_dict(self.get_low_stock_products(5))
        except Exception as e:
            context['low_stock'] = []
        
        return context

    # ============ DETAILED TRANSACTION DATA FOR AI ============
    def get_transaction_details(self, sale_id):
        """Obtient les details complets d'une transaction specifique"""
        query = """
            SELECT s.id as transaction_id, s.sale_date, s.total_amount, s.status,
                   u.username as vendeur, u.email as vendeur_email
            FROM sale s
            LEFT JOIN users u ON s.user_id = u.id
            WHERE s.id = :sale_id
        """
        df = self.get_dataframe(query, {'sale_id': sale_id})
        if df.empty:
            return None

        transaction = self.df_to_dict(df)[0]

        # Recupere les lignes de vente
        lines_query = """
            SELECT lv.id as line_id, lv.quantity, lv.unit_price, lv.line_total,
                   p.id as product_id, p.title as product_name, p.asin,
                   c.name as category
            FROM ligne_vente lv
            JOIN product p ON lv.product_id = p.id
            LEFT JOIN category c ON p.category_id = c.id
            WHERE lv.sale_id = :sale_id
        """
        lines_df = self.get_dataframe(lines_query, {'sale_id': sale_id})
        transaction['lignes'] = self.df_to_dict(lines_df)
        transaction['nb_articles'] = len(lines_df)
        transaction['total_quantite'] = int(lines_df['quantity'].sum()) if not lines_df.empty else 0

        return transaction

    def get_all_transactions_detailed(self, limit=50):
        """Obtient toutes les transactions avec leurs details"""
        query = """
            SELECT s.id as transaction_id, s.sale_date, s.total_amount, s.status,
                   u.username as vendeur,
                   COUNT(lv.id) as nb_lignes,
                   SUM(lv.quantity) as total_articles,
                   STRING_AGG(DISTINCT LEFT(p.title, 30), ', ') as produits_vendus
            FROM sale s
            LEFT JOIN users u ON s.user_id = u.id
            LEFT JOIN ligne_vente lv ON s.id = lv.sale_id
            LEFT JOIN product p ON lv.product_id = p.id
            WHERE s.status != 'CANCELLED'
            GROUP BY s.id, s.sale_date, s.total_amount, s.status, u.username
            ORDER BY s.sale_date DESC
            LIMIT :limit
        """
        return self.get_dataframe(query, {'limit': limit})

    def get_product_sales_history(self, product_id):
        """Historique des ventes d'un produit specifique"""
        query = """
            SELECT p.id, p.title, p.price as prix_actuel, p.stock,
                   COUNT(lv.id) as nb_ventes,
                   COALESCE(SUM(lv.quantity), 0) as quantite_totale_vendue,
                   COALESCE(SUM(lv.line_total), 0) as ca_total,
                   COALESCE(AVG(lv.unit_price), 0) as prix_moyen_vente,
                   MIN(s.sale_date) as premiere_vente,
                   MAX(s.sale_date) as derniere_vente
            FROM product p
            LEFT JOIN ligne_vente lv ON p.id = lv.product_id
            LEFT JOIN sale s ON lv.sale_id = s.id AND s.status != 'CANCELLED'
            WHERE p.id = :product_id
            GROUP BY p.id, p.title, p.price, p.stock
        """
        df = self.get_dataframe(query, {'product_id': product_id})
        return self.df_to_dict(df)[0] if not df.empty else None

    def search_transactions(self, search_term):
        """Recherche dans les transactions par vendeur, date ou montant"""
        query = """
            SELECT s.id as transaction_id, s.sale_date, s.total_amount, s.status,
                   u.username as vendeur,
                   COUNT(lv.id) as nb_lignes,
                   SUM(lv.quantity) as total_articles
            FROM sale s
            LEFT JOIN users u ON s.user_id = u.id
            LEFT JOIN ligne_vente lv ON s.id = lv.sale_id
            WHERE s.status != 'CANCELLED'
              AND (
                  LOWER(u.username) LIKE LOWER(:search)
                  OR CAST(s.id AS TEXT) LIKE :search
                  OR CAST(s.sale_date AS TEXT) LIKE :search
              )
            GROUP BY s.id, s.sale_date, s.total_amount, s.status, u.username
            ORDER BY s.sale_date DESC
            LIMIT 20
        """
        return self.get_dataframe(query, {'search': f'%{search_term}%'})

    def get_sales_by_date_range(self, start_date, end_date):
        """Ventes dans une periode specifique"""
        query = """
            SELECT s.id as transaction_id, s.sale_date, s.total_amount,
                   u.username as vendeur,
                   COUNT(lv.id) as nb_lignes,
                   SUM(lv.quantity) as total_articles
            FROM sale s
            LEFT JOIN users u ON s.user_id = u.id
            LEFT JOIN ligne_vente lv ON s.id = lv.sale_id
            WHERE s.status != 'CANCELLED'
              AND s.sale_date BETWEEN :start_date AND :end_date
            GROUP BY s.id, s.sale_date, s.total_amount, u.username
            ORDER BY s.sale_date DESC
        """
        return self.get_dataframe(query, {'start_date': start_date, 'end_date': end_date})

    def get_vendor_transactions(self, vendor_name):
        """Toutes les transactions d'un vendeur specifique"""
        query = """
            SELECT s.id as transaction_id, s.sale_date, s.total_amount, s.status,
                   u.username as vendeur,
                   COUNT(lv.id) as nb_lignes,
                   SUM(lv.quantity) as total_articles,
                   STRING_AGG(DISTINCT LEFT(p.title, 25), ', ') as produits
            FROM sale s
            JOIN users u ON s.user_id = u.id
            LEFT JOIN ligne_vente lv ON s.id = lv.sale_id
            LEFT JOIN product p ON lv.product_id = p.id
            WHERE s.status != 'CANCELLED'
              AND LOWER(u.username) LIKE LOWER(:vendor)
            GROUP BY s.id, s.sale_date, s.total_amount, s.status, u.username
            ORDER BY s.sale_date DESC
        """
        return self.get_dataframe(query, {'vendor': f'%{vendor_name}%'})

    def get_full_context_for_ai(self):
        """Contexte COMPLET avec toutes les transactions pour l'IA"""
        context = self.get_comprehensive_context()

        # Ajoute TOUTES les transactions avec details
        try:
            all_transactions = self.df_to_dict(self.get_all_transactions_detailed(30))
            context['all_transactions'] = all_transactions
            context['transaction_stats'] = {
                'total_transactions': len(all_transactions),
                'transactions_list': all_transactions
            }
        except Exception as e:
            context['all_transactions'] = []
            context['transaction_stats'] = {'total_transactions': 0, 'transactions_list': [], 'error': str(e)}

        # Statistiques supplementaires
        # Liste complete des produits avec leurs ventes
        try:
            products_query = """
                SELECT p.id, p.title, p.price, p.stock, c.name as category,
                       COALESCE(SUM(lv.quantity), 0) as total_vendu,
                       COALESCE(SUM(lv.line_total), 0) as ca_genere,
                       COUNT(DISTINCT s.id) as nb_transactions
                FROM product p
                LEFT JOIN category c ON p.category_id = c.id
                LEFT JOIN ligne_vente lv ON p.id = lv.product_id
                LEFT JOIN sale s ON lv.sale_id = s.id AND s.status != 'CANCELLED'
                GROUP BY p.id, p.title, p.price, p.stock, c.name
                ORDER BY ca_genere DESC
                LIMIT 50
            """
            context['all_products_sales'] = self.df_to_dict(self.get_dataframe(products_query))
        except Exception as e:
            context['all_products_sales'] = []

        return context

    # ============ ADVANCED INTELLIGENT ANALYTICS ============
    def get_smart_insights(self):
        """Genere des insights intelligents automatiques"""
        insights = {
            'alerts': [],
            'opportunities': [],
            'achievements': [],
            'recommendations': []
        }

        # 1. ALERTES CRITIQUES
        # Produits en rupture
        rupture_query = """
            SELECT COUNT(*) as count FROM product WHERE stock = 0
        """
        rupture = int(self.get_dataframe(rupture_query)['count'].iloc[0])
        if rupture > 0:
            insights['alerts'].append({
                'type': 'RUPTURE_STOCK',
                'severity': 'HIGH',
                'message': f"🔴 {rupture} produit(s) en RUPTURE DE STOCK",
                'action': "Reapprovisionner immediatement"
            })

        # Produits stock critique
        low_stock_query = """
            SELECT COUNT(*) as count FROM product WHERE stock > 0 AND stock < 5
        """
        low = int(self.get_dataframe(low_stock_query)['count'].iloc[0])
        if low > 0:
            insights['alerts'].append({
                'type': 'STOCK_CRITIQUE',
                'severity': 'MEDIUM',
                'message': f"🟡 {low} produit(s) avec stock CRITIQUE (< 5 unites)",
                'action': "Planifier reapprovisionnement"
            })

        # Tendance CA negative
        trends = self.get_sales_trends()
        if trends:
            ca_sem_act = trends.get('ca_semaine_actuelle', 0)
            ca_sem_prec = trends.get('ca_semaine_precedente', 0)
            if ca_sem_prec > 0:
                var = ((ca_sem_act - ca_sem_prec) / ca_sem_prec) * 100
                if var < -10:
                    insights['alerts'].append({
                        'type': 'BAISSE_CA',
                        'severity': 'HIGH',
                        'message': f"📉 CA en BAISSE de {abs(var):.1f}% cette semaine",
                        'current': ca_sem_act,
                        'previous': ca_sem_prec,
                        'action': "Analyser les causes et activer des promotions"
                    })
                elif var > 10:
                    insights['achievements'].append({
                        'type': 'HAUSSE_CA',
                        'message': f"📈 CA en HAUSSE de {var:.1f}% cette semaine!",
                        'current': ca_sem_act,
                        'previous': ca_sem_prec
                    })

        # 2. OPPORTUNITES
        # Produits jamais vendus avec stock
        never_sold_query = """
            SELECT p.title, p.price, p.stock
            FROM product p
            LEFT JOIN ligne_vente lv ON p.id = lv.product_id
            WHERE lv.id IS NULL AND p.stock > 0
            ORDER BY p.price DESC
            LIMIT 5
        """
        never_sold_df = self.get_dataframe(never_sold_query)
        if not never_sold_df.empty:
            total_value = float((never_sold_df['price'] * never_sold_df['stock']).sum())
            insights['opportunities'].append({
                'type': 'STOCK_DORMANT',
                'message': f"💰 {len(never_sold_df)} produits en stock jamais vendus",
                'value': total_value,
                'action': f"Valeur bloquee: {total_value:,.2f} MAD - Lancer promotion"
            })

        # Top produit qui pourrait etre en rupture bientot
        hot_product_query = """
            SELECT p.title, p.stock, SUM(lv.quantity) as ventes_recentes
            FROM product p
            JOIN ligne_vente lv ON p.id = lv.product_id
            JOIN sale s ON lv.sale_id = s.id
            WHERE s.sale_date >= CURRENT_DATE - INTERVAL '7 days'
              AND s.status != 'CANCELLED'
            GROUP BY p.id, p.title, p.stock
            HAVING p.stock < SUM(lv.quantity) * 2
            ORDER BY ventes_recentes DESC
            LIMIT 3
        """
        hot_df = self.get_dataframe(hot_product_query)
        if not hot_df.empty:
            for _, row in hot_df.iterrows():
                insights['alerts'].append({
                    'type': 'RISQUE_RUPTURE',
                    'severity': 'MEDIUM',
                    'message': f"⚠️ '{row['title'][:30]}' risque rupture (stock: {row['stock']}, ventes/sem: {row['ventes_recentes']})",
                    'action': "Commander rapidement"
                })

        # 3. RECOMMANDATIONS
        # Meilleur vendeur
        top_vendor_query = """
            SELECT u.username, SUM(s.total_amount) as ca
            FROM users u
            JOIN sale s ON u.id = s.user_id
            WHERE s.status != 'CANCELLED'
              AND s.sale_date >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY u.id, u.username
            ORDER BY ca DESC
            LIMIT 1
        """
        top_vendor_df = self.get_dataframe(top_vendor_query)
        if not top_vendor_df.empty:
            top = top_vendor_df.iloc[0]
            insights['achievements'].append({
                'type': 'TOP_VENDEUR',
                'message': f"🏆 Meilleur vendeur du mois: {top['username']} ({float(top['ca']):,.2f} MAD)"
            })

        # Categorie en croissance
        cat_growth_query = """
            WITH current_period AS (
                SELECT c.name as category, COALESCE(SUM(lv.line_total), 0) as ca
                FROM category c
                LEFT JOIN product p ON c.id = p.category_id
                LEFT JOIN ligne_vente lv ON p.id = lv.product_id
                LEFT JOIN sale s ON lv.sale_id = s.id AND s.status != 'CANCELLED'
                    AND s.sale_date >= CURRENT_DATE - INTERVAL '7 days'
                GROUP BY c.id, c.name
            ),
            previous_period AS (
                SELECT c.name as category, COALESCE(SUM(lv.line_total), 0) as ca
                FROM category c
                LEFT JOIN product p ON c.id = p.category_id
                LEFT JOIN ligne_vente lv ON p.id = lv.product_id
                LEFT JOIN sale s ON lv.sale_id = s.id AND s.status != 'CANCELLED'
                    AND s.sale_date >= CURRENT_DATE - INTERVAL '14 days'
                    AND s.sale_date < CURRENT_DATE - INTERVAL '7 days'
                GROUP BY c.id, c.name
            )
            SELECT cp.category, cp.ca as ca_actuel, pp.ca as ca_precedent,
                   CASE WHEN pp.ca > 0 THEN ((cp.ca - pp.ca) / pp.ca * 100) ELSE 0 END as variation
            FROM current_period cp
            JOIN previous_period pp ON cp.category = pp.category
            WHERE pp.ca > 0
            ORDER BY variation DESC
            LIMIT 3
        """
        cat_growth_df = self.get_dataframe(cat_growth_query)
        if not cat_growth_df.empty:
            for _, row in cat_growth_df.iterrows():
                if row['variation'] > 20:
                    insights['opportunities'].append({
                        'type': 'CATEGORIE_CROISSANCE',
                        'message': f"🚀 Categorie '{row['category']}' en croissance: +{float(row['variation']):.1f}%",
                        'action': "Renforcer le stock de cette categorie"
                    })

        return insights

    def get_vendor_comparison(self):
        """Compare les performances des vendeurs entre eux"""
        query = """
            SELECT u.username as vendeur,
                   COUNT(s.id) as nb_ventes,
                   COALESCE(SUM(s.total_amount), 0) as ca_total,
                   COALESCE(AVG(s.total_amount), 0) as panier_moyen,
                   COALESCE(SUM(lv.quantity), 0) as articles_vendus,
                   COUNT(DISTINCT DATE(s.sale_date)) as jours_actifs
            FROM users u
            LEFT JOIN sale s ON u.id = s.user_id AND s.status != 'CANCELLED'
            LEFT JOIN ligne_vente lv ON s.id = lv.sale_id
            WHERE u.role = 'VENDEUR'
            GROUP BY u.id, u.username
            ORDER BY ca_total DESC
        """
        df = self.get_dataframe(query)
        if df.empty:
            return {}

        total_ca = df['ca_total'].sum()
        result = {
            'vendeurs': self.df_to_dict(df),
            'total_ca': float(total_ca),
            'nb_vendeurs': len(df),
            'moyenne_ca_par_vendeur': float(total_ca / len(df)) if len(df) > 0 else 0,
            'top_vendeur': df.iloc[0]['vendeur'] if len(df) > 0 else None,
            'top_ca': float(df.iloc[0]['ca_total']) if len(df) > 0 else 0
        }

        # Calcul des parts de marche
        for v in result['vendeurs']:
            v['part_marche'] = round((v['ca_total'] / total_ca * 100), 1) if total_ca > 0 else 0

        return result

    def get_product_performance_matrix(self):
        """Matrice de performance des produits (ventes vs stock vs prix)"""
        query = """
            SELECT p.id, p.title, p.price, p.stock, c.name as category,
                   COALESCE(SUM(lv.quantity), 0) as total_vendu,
                   COALESCE(SUM(lv.line_total), 0) as ca_genere,
                   COALESCE(AVG(lv.unit_price), p.price) as prix_moyen_vente,
                   COUNT(DISTINCT s.id) as nb_transactions,
                   CASE
                       WHEN SUM(lv.quantity) > 10 AND p.stock > 20 THEN 'STAR'
                       WHEN SUM(lv.quantity) > 10 AND p.stock <= 20 THEN 'CASH_COW'
                       WHEN COALESCE(SUM(lv.quantity), 0) <= 10 AND p.stock > 20 THEN 'QUESTION'
                       WHEN COALESCE(SUM(lv.quantity), 0) <= 10 AND p.stock <= 20 THEN 'DOG'
                       ELSE 'UNKNOWN'
                   END as classification
            FROM product p
            LEFT JOIN category c ON p.category_id = c.id
            LEFT JOIN ligne_vente lv ON p.id = lv.product_id
            LEFT JOIN sale s ON lv.sale_id = s.id AND s.status != 'CANCELLED'
            GROUP BY p.id, p.title, p.price, p.stock, c.name
            ORDER BY ca_genere DESC
        """
        return self.df_to_dict(self.get_dataframe(query))

    def get_hourly_sales_pattern(self):
        """Pattern des ventes par heure de la journee"""
        query = """
            SELECT EXTRACT(HOUR FROM s.sale_date) as heure,
                   COUNT(*) as nb_ventes,
                   SUM(s.total_amount) as ca
            FROM sale s
            WHERE s.status != 'CANCELLED'
              AND s.sale_date >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY EXTRACT(HOUR FROM s.sale_date)
            ORDER BY heure
        """
        return self.df_to_dict(self.get_dataframe(query))

    def get_ai_ready_context(self):
        """Contexte ULTRA-COMPLET optimise pour l'IA avec insights"""
        context = self.get_full_context_for_ai()

        # Ajoute les insights intelligents avec gestion d'erreurs
        try:
            context['smart_insights'] = self.get_smart_insights()
        except Exception as e:
            context['smart_insights'] = {'alerts': [], 'opportunities': [], 'achievements': [], 'recommendations': [], 'error': str(e)}

        # Ajoute la comparaison vendeurs
        try:
            context['vendor_comparison'] = self.get_vendor_comparison()
        except Exception as e:
            context['vendor_comparison'] = {}

        # Ajoute la matrice produits
        try:
            context['product_matrix'] = self.get_product_performance_matrix()
        except Exception as e:
            context['product_matrix'] = []

        # Calculs supplementaires
        try:
            if context.get('overview') and not context['overview'].get('error'):
                ov = context['overview']
                if ov.get('total_sales', 0) > 0 and ov.get('active_days', 0) > 0:
                    context['calculated_metrics'] = {
                        'ca_par_jour': float(ov.get('total_revenue', 0) / max(ov.get('active_days', 1), 1)),
                        'ventes_par_jour': float(ov.get('total_sales', 0) / max(ov.get('active_days', 1), 1)),
                        'ca_par_transaction': float(ov.get('total_revenue', 0) / max(ov.get('total_sales', 1), 1))
                    }
        except Exception as e:
            context['calculated_metrics'] = {}

        return context

    # ============ NOUVELLES ANALYSES AVANCÉES ============

    def get_weekly_sales(self, weeks=4):
        """Ventes hebdomadaires des X dernières semaines"""
        query = """
            SELECT DATE_TRUNC('week', s.sale_date) as semaine,
                   COUNT(*) as nb_ventes,
                   SUM(s.total_amount) as ca,
                   AVG(s.total_amount) as panier_moyen,
                   COUNT(DISTINCT s.user_id) as vendeurs_actifs
            FROM sale s
            WHERE s.status != 'CANCELLED'
              AND s.sale_date >= CURRENT_DATE - INTERVAL ':weeks weeks'
            GROUP BY DATE_TRUNC('week', s.sale_date)
            ORDER BY semaine DESC
        """
        return self.get_dataframe(query.replace(':weeks', str(weeks)))

    def get_profit_analysis(self):
        """Analyse de la marge et rentabilité par produit"""
        query = """
            SELECT p.id, p.title, p.price as prix_vente, c.name as category,
                   COALESCE(SUM(lv.quantity), 0) as quantite_vendue,
                   COALESCE(SUM(lv.line_total), 0) as ca_brut,
                   p.price * 0.7 as cout_estime,
                   COALESCE(SUM(lv.line_total), 0) * 0.3 as marge_estimee,
                   CASE WHEN COALESCE(SUM(lv.line_total), 0) > 0 
                        THEN 30.0 
                        ELSE 0 END as taux_marge
            FROM product p
            LEFT JOIN category c ON p.category_id = c.id
            LEFT JOIN ligne_vente lv ON p.id = lv.product_id
            LEFT JOIN sale s ON lv.sale_id = s.id AND s.status != 'CANCELLED'
            GROUP BY p.id, p.title, p.price, c.name
            HAVING COALESCE(SUM(lv.quantity), 0) > 0
            ORDER BY marge_estimee DESC
            LIMIT 20
        """
        return self.get_dataframe(query)

    def get_product_rotation_analysis(self):
        """Analyse de la rotation des stocks"""
        query = """
            WITH product_sales AS (
                SELECT p.id, p.title, p.stock, p.price, c.name as category,
                       COALESCE(SUM(lv.quantity), 0) as total_vendu,
                       COUNT(DISTINCT DATE(s.sale_date)) as jours_vente,
                       MIN(s.sale_date) as premiere_vente,
                       MAX(s.sale_date) as derniere_vente
                FROM product p
                LEFT JOIN category c ON p.category_id = c.id
                LEFT JOIN ligne_vente lv ON p.id = lv.product_id
                LEFT JOIN sale s ON lv.sale_id = s.id AND s.status != 'CANCELLED'
                GROUP BY p.id, p.title, p.stock, p.price, c.name
            )
            SELECT *,
                   CASE WHEN jours_vente > 0 
                        THEN ROUND(total_vendu::numeric / jours_vente, 2)
                        ELSE 0 END as ventes_par_jour,
                   CASE WHEN total_vendu > 0 AND stock > 0
                        THEN ROUND(stock::numeric / (total_vendu::numeric / GREATEST(jours_vente, 1)), 0)
                        ELSE 999 END as jours_stock_restant,
                   CASE 
                       WHEN total_vendu > 0 AND jours_vente > 0 AND (total_vendu::numeric / jours_vente) > 2 THEN 'RAPIDE'
                       WHEN total_vendu > 0 AND jours_vente > 0 AND (total_vendu::numeric / jours_vente) > 0.5 THEN 'NORMAL'
                       WHEN total_vendu > 0 THEN 'LENT'
                       ELSE 'DORMANT'
                   END as vitesse_rotation
            FROM product_sales
            ORDER BY ventes_par_jour DESC
        """
        return self.get_dataframe(query)

    def get_slow_moving_products(self, days=30, limit=20):
        """Produits à rotation lente"""
        query = """
            SELECT p.id, p.title, p.price, p.stock, c.name as category,
                   COALESCE(SUM(lv.quantity), 0) as total_vendu,
                   p.stock * p.price as valeur_stock,
                   CURRENT_DATE - MAX(s.sale_date)::date as jours_depuis_derniere_vente
            FROM product p
            LEFT JOIN category c ON p.category_id = c.id
            LEFT JOIN ligne_vente lv ON p.id = lv.product_id
            LEFT JOIN sale s ON lv.sale_id = s.id AND s.status != 'CANCELLED'
            WHERE p.stock > 0
            GROUP BY p.id, p.title, p.price, p.stock, c.name
            HAVING COALESCE(SUM(lv.quantity), 0) < 5 OR MAX(s.sale_date) < CURRENT_DATE - INTERVAL ':days days'
            ORDER BY jours_depuis_derniere_vente DESC NULLS FIRST, total_vendu ASC
            LIMIT :limit
        """
        return self.get_dataframe(query.replace(':days', str(days)).replace(':limit', str(limit)))

    def get_fast_moving_products(self, limit=20):
        """Produits à rotation rapide"""
        query = """
            SELECT p.id, p.title, p.price, p.stock, c.name as category,
                   SUM(lv.quantity) as total_vendu,
                   SUM(lv.line_total) as ca_genere,
                   COUNT(DISTINCT s.id) as nb_transactions,
                   COUNT(DISTINCT DATE(s.sale_date)) as jours_vente,
                   ROUND(SUM(lv.quantity)::numeric / GREATEST(COUNT(DISTINCT DATE(s.sale_date)), 1), 2) as ventes_par_jour
            FROM product p
            LEFT JOIN category c ON p.category_id = c.id
            JOIN ligne_vente lv ON p.id = lv.product_id
            JOIN sale s ON lv.sale_id = s.id AND s.status != 'CANCELLED'
            WHERE s.sale_date >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY p.id, p.title, p.price, p.stock, c.name
            HAVING SUM(lv.quantity) >= 5
            ORDER BY ventes_par_jour DESC
            LIMIT :limit
        """
        return self.get_dataframe(query.replace(':limit', str(limit)))

    def get_forecast_data(self):
        """Données pour la prévision des ventes"""
        query = """
            SELECT DATE(s.sale_date) as date,
                   EXTRACT(DOW FROM s.sale_date) as jour_semaine,
                   EXTRACT(DAY FROM s.sale_date) as jour_mois,
                   EXTRACT(MONTH FROM s.sale_date) as mois,
                   COUNT(*) as nb_ventes,
                   SUM(s.total_amount) as ca,
                   AVG(s.total_amount) as panier_moyen,
                   SUM(lv.quantity) as articles_vendus
            FROM sale s
            LEFT JOIN ligne_vente lv ON s.id = lv.sale_id
            WHERE s.status != 'CANCELLED'
              AND s.sale_date >= CURRENT_DATE - INTERVAL '90 days'
            GROUP BY DATE(s.sale_date), EXTRACT(DOW FROM s.sale_date), 
                     EXTRACT(DAY FROM s.sale_date), EXTRACT(MONTH FROM s.sale_date)
            ORDER BY date DESC
        """
        return self.get_dataframe(query)

    def get_kpi_summary(self):
        """Résumé des KPIs principaux"""
        # KPIs actuels
        current_query = """
            SELECT 
                COUNT(DISTINCT s.id) as transactions,
                COALESCE(SUM(s.total_amount), 0) as ca_total,
                COALESCE(AVG(s.total_amount), 0) as panier_moyen,
                COUNT(DISTINCT s.user_id) as vendeurs_actifs,
                COALESCE(SUM(lv.quantity), 0) as articles_vendus
            FROM sale s
            LEFT JOIN ligne_vente lv ON s.id = lv.sale_id
            WHERE s.status != 'CANCELLED'
              AND s.sale_date >= DATE_TRUNC('month', CURRENT_DATE)
        """
        current_df = self.get_dataframe(current_query)
        current = self.df_to_dict(current_df)[0] if not current_df.empty else {}

        # KPIs mois précédent pour comparaison
        previous_query = """
            SELECT 
                COUNT(DISTINCT s.id) as transactions,
                COALESCE(SUM(s.total_amount), 0) as ca_total,
                COALESCE(AVG(s.total_amount), 0) as panier_moyen,
                COUNT(DISTINCT s.user_id) as vendeurs_actifs,
                COALESCE(SUM(lv.quantity), 0) as articles_vendus
            FROM sale s
            LEFT JOIN ligne_vente lv ON s.id = lv.sale_id
            WHERE s.status != 'CANCELLED'
              AND s.sale_date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'
              AND s.sale_date < DATE_TRUNC('month', CURRENT_DATE)
        """
        previous_df = self.get_dataframe(previous_query)
        previous = self.df_to_dict(previous_df)[0] if not previous_df.empty else {}

        # Calcul des variations
        def calc_variation(current_val, previous_val):
            if previous_val and previous_val > 0:
                return round(((current_val - previous_val) / previous_val) * 100, 1)
            return 0

        return {
            'current': current,
            'previous': previous,
            'variations': {
                'transactions': calc_variation(current.get('transactions', 0), previous.get('transactions', 0)),
                'ca_total': calc_variation(current.get('ca_total', 0), previous.get('ca_total', 0)),
                'panier_moyen': calc_variation(current.get('panier_moyen', 0), previous.get('panier_moyen', 0)),
                'articles_vendus': calc_variation(current.get('articles_vendus', 0), previous.get('articles_vendus', 0)),
            }
        }

    def get_daily_report_data(self, date=None):
        """Données pour le rapport journalier"""
        date_filter = "CURRENT_DATE" if not date else f"'{date}'::date"
        query = f"""
            SELECT 
                COUNT(DISTINCT s.id) as transactions,
                COALESCE(SUM(s.total_amount), 0) as ca_total,
                COALESCE(AVG(s.total_amount), 0) as panier_moyen,
                COUNT(DISTINCT s.user_id) as vendeurs_actifs,
                COALESCE(SUM(lv.quantity), 0) as articles_vendus
            FROM sale s
            LEFT JOIN ligne_vente lv ON s.id = lv.sale_id
            WHERE s.status != 'CANCELLED'
              AND DATE(s.sale_date) = {date_filter}
        """
        day_data = self.get_dataframe(query)
        
        # Top produits du jour
        top_products_query = f"""
            SELECT p.title, SUM(lv.quantity) as qte, SUM(lv.line_total) as ca
            FROM product p
            JOIN ligne_vente lv ON p.id = lv.product_id
            JOIN sale s ON lv.sale_id = s.id
            WHERE s.status != 'CANCELLED' AND DATE(s.sale_date) = {date_filter}
            GROUP BY p.id, p.title
            ORDER BY ca DESC
            LIMIT 5
        """
        top_products = self.get_dataframe(top_products_query)
        
        # Top vendeurs du jour
        top_vendors_query = f"""
            SELECT u.username, COUNT(s.id) as ventes, SUM(s.total_amount) as ca
            FROM users u
            JOIN sale s ON u.id = s.user_id
            WHERE s.status != 'CANCELLED' AND DATE(s.sale_date) = {date_filter}
            GROUP BY u.id, u.username
            ORDER BY ca DESC
            LIMIT 5
        """
        top_vendors = self.get_dataframe(top_vendors_query)
        
        return {
            'summary': self.df_to_dict(day_data)[0] if not day_data.empty else {},
            'top_products': self.df_to_dict(top_products),
            'top_vendors': self.df_to_dict(top_vendors)
        }

    def get_executive_summary(self):
        """Résumé exécutif complet pour la direction"""
        summary = {
            'kpis': self.get_kpi_summary(),
            'trends': self.get_sales_trends(),
            'inventory': self.get_inventory_status(),
            'vendor_comparison': self.get_vendor_comparison(),
            'category_analysis': self.df_to_dict(self.get_category_analysis()[:5]),
            'alerts': self.get_smart_insights().get('alerts', []),
            'opportunities': self.get_smart_insights().get('opportunities', []),
        }
        
        # Ajouter les scores de santé
        inventory = summary['inventory']
        if inventory:
            total = inventory.get('total_products', 1)
            out_of_stock = inventory.get('out_of_stock', 0)
            low_stock = inventory.get('low_stock', 0)
            summary['health_scores'] = {
                'inventory_health': round(100 - ((out_of_stock + low_stock * 0.5) / total * 100), 1) if total > 0 else 100,
                'sales_trend': 'UP' if summary['trends'].get('ca_semaine_actuelle', 0) > summary['trends'].get('ca_semaine_precedente', 0) else 'DOWN',
            }
        
        return summary

    def get_vendor_ranking(self, period='month', limit=10):
        """Classement des vendeurs par période"""
        period_filter = {
            'day': "CURRENT_DATE",
            'week': "CURRENT_DATE - INTERVAL '7 days'",
            'month': "DATE_TRUNC('month', CURRENT_DATE)",
            'year': "DATE_TRUNC('year', CURRENT_DATE)"
        }.get(period, "DATE_TRUNC('month', CURRENT_DATE)")
        
        query = f"""
            SELECT 
                ROW_NUMBER() OVER (ORDER BY SUM(s.total_amount) DESC) as rang,
                u.username as vendeur,
                COUNT(s.id) as nb_ventes,
                COALESCE(SUM(s.total_amount), 0) as ca_total,
                COALESCE(AVG(s.total_amount), 0) as panier_moyen,
                COALESCE(SUM(lv.quantity), 0) as articles_vendus
            FROM users u
            LEFT JOIN sale s ON u.id = s.user_id AND s.status != 'CANCELLED' 
                AND s.sale_date >= {period_filter}
            LEFT JOIN ligne_vente lv ON s.id = lv.sale_id
            WHERE u.role = 'VENDEUR'
            GROUP BY u.id, u.username
            HAVING COALESCE(SUM(s.total_amount), 0) > 0
            ORDER BY ca_total DESC
            LIMIT :limit
        """
        return self.get_dataframe(query.replace(':limit', str(limit)))

# Instance globale
db = DatabaseManager()
