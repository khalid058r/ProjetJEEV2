from flask import Flask, request, jsonify
from flask_cors import CORS
from config import Config
from chatbot_engine import chatbot
from groq_client import groq_client
from database import db, convert_to_native

# Import des modules d'amélioration
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

app = Flask(__name__)
CORS(app, origins=['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'])

# ============ HEALTH CHECK ============

@app.route('/api/health', methods=['GET'])
def health_check():
    """Vérifie l'état du service"""
    groq_status = groq_client.check_connection()
    try:
        db.execute_query("SELECT 1")
        db_status = {'connected': True}
    except Exception as e:
        db_status = {'connected': False, 'error': str(e)}
    
    # Stats du cache si disponible
    cache_stats = chatbot_cache.get_all_stats() if CACHE_AVAILABLE else {'available': False}

    return jsonify({
        'status': 'healthy' if groq_status['connected'] and db_status['connected'] else 'degraded',
        'ollama': groq_status,
        'database': db_status,
        'cache': cache_stats
    })

# ============ CACHE ENDPOINTS ============

@app.route('/api/cache/stats', methods=['GET'])
def cache_stats():
    """Retourne les statistiques du cache"""
    if not CACHE_AVAILABLE:
        return jsonify({'success': False, 'error': 'Cache non disponible'})
    
    return jsonify({
        'success': True,
        'stats': chatbot_cache.get_all_stats()
    })

@app.route('/api/cache/clear', methods=['POST'])
def cache_clear():
    """Vide le cache"""
    if not CACHE_AVAILABLE:
        return jsonify({'success': False, 'error': 'Cache non disponible'})
    
    chatbot_cache.clear_all()
    if LOGGER_AVAILABLE:
        chatbot_logger.info("Cache vidé manuellement")
    
    return jsonify({
        'success': True,
        'message': 'Cache vidé avec succès'
    })

# ============ CHAT ENDPOINTS ============

@app.route('/api/chat', methods=['POST'])
def chat():
    """Endpoint principal du chatbot"""
    data = request.json

    if not data or 'message' not in data:
        return jsonify({
            'success': False,
            'error': 'Le message est requis'
        }), 400

    user_id = data.get('userId', 'anonymous')
    user_role = data.get('userRole', 'VENDEUR').upper()
    message = data['message']

    # Traite le message
    result = chatbot.process_message(user_id, message, user_role)

    return jsonify(result)

@app.route('/api/chat/clear', methods=['POST'])
def clear_history():
    """Efface l'historique de conversation"""
    data = request.json
    user_id = data.get('userId', 'anonymous')

    result = groq_client.clear_history(user_id)
    return jsonify(result)

# ============ QUICK ACTIONS ============

@app.route('/api/quick/search', methods=['GET'])
def quick_search():
    """Recherche rapide de produits"""
    query = request.args.get('q', '')
    limit = int(request.args.get('limit', 5))

    if not query:
        return jsonify({'success': False, 'error': 'Query parameter "q" is required'}), 400

    products = db.search_products(query, limit=limit)
    return jsonify({
        'success': True,
        'products': convert_to_native(products.to_dict('records')),
        'count': len(products)
    })

@app.route('/api/quick/product/<int:product_id>', methods=['GET'])
def quick_product_details(product_id):
    """Détails rapides d'un produit"""
    product = db.get_product_details(product_id)
    if not product:
        return jsonify({'success': False, 'error': 'Product not found'}), 404

    return jsonify({
        'success': True,
        'product': product
    })

@app.route('/api/quick/top-products', methods=['GET'])
def quick_top_products():
    """Top produits"""
    limit = int(request.args.get('limit', 5))
    sort_by = request.args.get('sort', 'sales')  # 'sales' or 'rating'

    if sort_by == 'rating':
        products = db.get_top_rated_products(limit=limit)
    else:
        products = db.get_best_selling_products(limit=limit)

    return jsonify({
        'success': True,
        'products': convert_to_native(products.to_dict('records')),
        'sortedBy': sort_by
    })

@app.route('/api/quick/low-stock', methods=['GET'])
def quick_low_stock():
    """Produits en stock faible"""
    threshold = int(request.args.get('threshold', 10))
    products = db.get_low_stock_products(threshold=threshold)

    return jsonify({
        'success': True,
        'products': convert_to_native(products.to_dict('records')),
        'count': len(products),
        'threshold': threshold
    })

# ============ ANALYTICS ENDPOINTS ============

@app.route('/api/analytics/overview', methods=['GET'])
def analytics_overview():
    """Vue d'ensemble analytique"""
    return jsonify({
        'success': True,
        'data': {
            'sales': db.get_sales_overview(),
            'inventory': db.get_inventory_status(),
            'stats': db.get_global_statistics()
        }
    })

@app.route('/api/analytics/sales/daily', methods=['GET'])
def analytics_daily_sales():
    """Ventes journalières"""
    days = int(request.args.get('days', 30))
    sales = db.get_daily_sales(days=days)

    return jsonify({
        'success': True,
        'data': convert_to_native(sales.to_dict('records'))
    })

@app.route('/api/analytics/sales/monthly', methods=['GET'])
def analytics_monthly_sales():
    """Ventes mensuelles"""
    months = int(request.args.get('months', 12))
    sales = db.get_monthly_sales(months=months)

    return jsonify({
        'success': True,
        'data': convert_to_native(sales.to_dict('records'))
    })

@app.route('/api/analytics/categories', methods=['GET'])
def analytics_categories():
    """Performance des catégories"""
    categories = db.get_category_performance()

    return jsonify({
        'success': True,
        'data': convert_to_native(categories.to_dict('records'))
    })

@app.route('/api/analytics/vendors', methods=['GET'])
def analytics_vendors():
    """Performance des vendeurs"""
    limit = int(request.args.get('limit', 10))
    vendors = db.get_vendor_performance(limit=limit)

    return jsonify({
        'success': True,
        'data': convert_to_native(vendors.to_dict('records'))
    })

# ============ ALERTS ============

@app.route('/api/alerts', methods=['GET'])
def get_alerts():
    """Récupère les alertes"""
    limit = int(request.args.get('limit', 10))
    alerts = db.get_recent_alerts(limit=limit)
    unread = db.get_unread_alerts_count()

    return jsonify({
        'success': True,
        'alerts': convert_to_native(alerts.to_dict('records')),
        'unreadCount': unread
    })

# ============ AI ANALYSIS ============

@app.route('/api/ai/analyze', methods=['POST'])
def ai_analyze():
    """Analyse AI personnalisée"""
    data = request.json
    prompt = data.get('prompt', '')
    context_type = data.get('contextType', 'general')

    if not prompt:
        return jsonify({'success': False, 'error': 'Prompt is required'}), 400

    # Récupère le contexte selon le type
    context_data = {}
    if context_type == 'sales':
        context_data = {
            'overview': db.get_sales_overview(),
            'monthly': convert_to_native(db.get_monthly_sales(6).to_dict('records'))
        }
    elif context_type == 'inventory':
        context_data = {
            'status': db.get_inventory_status(),
            'lowStock': convert_to_native(db.get_low_stock_products(10).to_dict('records'))
        }
    elif context_type == 'categories':
        context_data = {
            'performance': convert_to_native(db.get_category_performance().to_dict('records'))
        }
    else:
        context_data = db.get_global_statistics()

    # Génère l'analyse
    context_str = str(context_data)
    analysis = groq_client.get_quick_response(prompt, context_str)

    return jsonify({
        'success': True,
        'analysis': analysis,
        'contextData': context_data
    })

# ============ SUGGESTIONS ============

@app.route('/api/suggestions', methods=['GET'])
def get_suggestions():
    """Suggestions contextuelles pour le chatbot"""
    user_role = request.args.get('role', 'VENDEUR').upper()

    suggestions = {
        'ADMIN': [
            "📊 Résumé exécutif",
            "👥 Classement des vendeurs",
            "🚨 Alertes critiques",
            "📈 Tendances de ventes",
            "💰 KPIs du mois",
            "📦 Rotation des stocks",
            "🔮 Prévisions de ventes"
        ],
        'VENDEUR': [
            "🔍 Rechercher un produit",
            "📊 Mes statistiques",
            "🏆 Top ventes du jour",
            "📈 Produits à forte rotation",
            "⚠️ Produits bientôt en rupture"
        ],
        'ANALYSTE': [
            "📊 Analyse des tendances",
            "💰 Analyse des marges",
            "📦 Rotation des stocks",
            "🏷️ Performance catégories",
            "🔮 Prévisions de ventes",
            "📉 Produits à rotation lente"
        ],
        'INVESTISSEUR': [
            "📊 Résumé exécutif",
            "💰 Performance financière",
            "📈 Croissance du CA",
            "🎯 KPIs principaux",
            "📈 Tendances mensuelles"
        ]
    }

    return jsonify({
        'success': True,
        'suggestions': suggestions.get(user_role, suggestions['VENDEUR'])
    })

# ============ ADVANCED ANALYTICS ENDPOINTS ============

@app.route('/api/analytics/trends', methods=['GET'])
def analytics_trends():
    """Tendances de ventes"""
    trends = db.get_sales_trends()
    return jsonify({
        'success': True,
        'data': convert_to_native(trends)
    })

@app.route('/api/analytics/kpis', methods=['GET'])
def analytics_kpis():
    """KPIs Summary"""
    kpis = db.get_kpi_summary()
    return jsonify({
        'success': True,
        'data': convert_to_native(kpis)
    })

@app.route('/api/analytics/vendor-ranking', methods=['GET'])
def analytics_vendor_ranking():
    """Classement des vendeurs"""
    period = request.args.get('period', 'month')
    limit = int(request.args.get('limit', 10))
    ranking = db.get_vendor_ranking(period=period, limit=limit)
    return jsonify({
        'success': True,
        'data': convert_to_native(ranking.to_dict('records')),
        'period': period
    })

@app.route('/api/analytics/rotation', methods=['GET'])
def analytics_rotation():
    """Analyse de rotation des stocks"""
    rotation = db.get_product_rotation_analysis()
    return jsonify({
        'success': True,
        'data': convert_to_native(rotation.to_dict('records'))
    })

@app.route('/api/analytics/slow-moving', methods=['GET'])
def analytics_slow_moving():
    """Produits à rotation lente"""
    days = int(request.args.get('days', 30))
    limit = int(request.args.get('limit', 20))
    products = db.get_slow_moving_products(days=days, limit=limit)
    return jsonify({
        'success': True,
        'data': convert_to_native(products.to_dict('records')),
        'days': days
    })

@app.route('/api/analytics/fast-moving', methods=['GET'])
def analytics_fast_moving():
    """Produits à rotation rapide"""
    limit = int(request.args.get('limit', 20))
    products = db.get_fast_moving_products(limit=limit)
    return jsonify({
        'success': True,
        'data': convert_to_native(products.to_dict('records'))
    })

@app.route('/api/analytics/profit', methods=['GET'])
def analytics_profit():
    """Analyse des profits"""
    profit = db.get_profit_analysis()
    return jsonify({
        'success': True,
        'data': convert_to_native(profit.to_dict('records'))
    })

@app.route('/api/analytics/weekly', methods=['GET'])
def analytics_weekly_sales():
    """Ventes hebdomadaires"""
    weeks = int(request.args.get('weeks', 4))
    sales = db.get_weekly_sales(weeks=weeks)
    return jsonify({
        'success': True,
        'data': convert_to_native(sales.to_dict('records'))
    })

@app.route('/api/analytics/forecast', methods=['GET'])
def analytics_forecast():
    """Données de prévision"""
    forecast = db.get_forecast_data()
    return jsonify({
        'success': True,
        'data': convert_to_native(forecast.to_dict('records'))
    })

@app.route('/api/analytics/executive-summary', methods=['GET'])
def analytics_executive_summary():
    """Résumé exécutif complet"""
    summary = db.get_executive_summary()
    return jsonify({
        'success': True,
        'data': convert_to_native(summary)
    })

@app.route('/api/analytics/daily-report', methods=['GET'])
def analytics_daily_report():
    """Rapport journalier"""
    date = request.args.get('date')
    report = db.get_daily_report_data(date)
    return jsonify({
        'success': True,
        'data': convert_to_native(report)
    })

@app.route('/api/analytics/insights', methods=['GET'])
def analytics_insights():
    """Insights intelligents"""
    insights = db.get_smart_insights()
    return jsonify({
        'success': True,
        'data': convert_to_native(insights)
    })

# ============ TRANSACTIONS ENDPOINTS ============

@app.route('/api/transactions/recent', methods=['GET'])
def transactions_recent():
    """Transactions récentes"""
    limit = int(request.args.get('limit', 20))
    transactions = db.get_recent_transactions(limit=limit)
    return jsonify({
        'success': True,
        'data': convert_to_native(transactions.to_dict('records'))
    })

@app.route('/api/transactions/<int:transaction_id>', methods=['GET'])
def transaction_details(transaction_id):
    """Détails d'une transaction"""
    transaction = db.get_transaction_details(transaction_id)
    if not transaction:
        return jsonify({'success': False, 'error': 'Transaction not found'}), 404
    return jsonify({
        'success': True,
        'data': convert_to_native(transaction)
    })

@app.route('/api/transactions/vendor/<string:vendor_name>', methods=['GET'])
def transactions_by_vendor(vendor_name):
    """Transactions d'un vendeur"""
    transactions = db.get_vendor_transactions(vendor_name)
    return jsonify({
        'success': True,
        'data': convert_to_native(transactions.to_dict('records')),
        'vendor': vendor_name
    })

# ============ MAIN ============

if __name__ == '__main__':
    # Vérifier les connexions au démarrage
    groq_ok = groq_client.check_connection().get('connected', False)
    try:
        db.execute_query("SELECT 1")
        db_ok = True
    except:
        db_ok = False
    
    # Logger le démarrage
    if LOGGER_AVAILABLE:
        chatbot_logger.log_startup(Config.PORT, groq_ok, db_ok)
    
    print(f"\n{'='*50}")
    print(f"🤖 Chatbot Service démarré sur le port {Config.PORT}")
    print(f"{'='*50}")
    print(f"📡 Groq Model: {Config.GROQ_MODEL} {'✅' if groq_ok else '❌ OFFLINE'}")
    print(f"🗃️  Database: {'✅ Connectée' if db_ok else '❌ OFFLINE'}")
    print(f"💾 Cache: {'✅ Activé' if CACHE_AVAILABLE else '❌ Désactivé'}")
    print(f"📝 Logger: {'✅ Activé' if LOGGER_AVAILABLE else '❌ Désactivé'}")
    print(f"🔗 Backend API: {Config.BACKEND_API_URL}")
    print(f"{'='*50}\n")
    
    app.run(debug=Config.DEBUG, port=Config.PORT, host='0.0.0.0')
