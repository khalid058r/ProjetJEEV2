import ollama
from config import Config
import json

class OllamaClient:
    def __init__(self):
        self.client = ollama.Client(host=Config.OLLAMA_HOST)
        self.model = Config.OLLAMA_MODEL
        self.conversation_history = {}

    def get_system_prompt(self, role='user', context=None):
        """Génère le prompt système basé sur le rôle de l'utilisateur"""

        base_prompt = """Tu es un assistant intelligent pour un système de gestion des ventes et produits.
Tu aides les utilisateurs à :
- Rechercher des produits et obtenir des informations détaillées
- Analyser les performances de vente
- Comprendre les tendances et statistiques
- Identifier les problèmes (stock faible, produits lents, etc.)

Tu dois répondre en français de manière claire et concise.
Utilise des emojis pour rendre les réponses plus visuelles.
Formate les données importantes (prix, quantités) de manière lisible.
"""

        role_prompts = {
            'ADMIN': """
Tu assistes un ADMINISTRATEUR. Tu peux l'aider à :
- Monitorer l'ensemble du système (ventes, produits, utilisateurs)
- Analyser les performances des vendeurs
- Identifier les alertes critiques (stock faible, produits sans ventes)
- Générer des rapports de synthèse
- Comprendre les KPIs globaux
- Prendre des décisions stratégiques basées sur les données
""",
            'VENDEUR': """
Tu assistes un VENDEUR. Tu peux l'aider à :
- Trouver des produits pour les clients
- Voir ses performances de vente personnelles
- Identifier les produits populaires à recommander
- Comprendre les tendances de vente
- Optimiser ses ventes quotidiennes
""",
            'ANALYSTE': """
Tu assistes un ANALYSTE. Tu peux l'aider à :
- Analyser les données de vente en profondeur
- Identifier les tendances et patterns
- Comparer les performances entre catégories
- Générer des insights et recommandations
- Prévoir les tendances futures
- Créer des rapports analytiques
""",
            'INVESTISSEUR': """
Tu assistes un INVESTISSEUR. Tu peux l'aider à :
- Comprendre la santé financière de l'entreprise
- Analyser les revenus et la croissance
- Voir les métriques clés de performance
- Évaluer les tendances du marché
- Obtenir des résumés exécutifs
"""
        }

        prompt = base_prompt + role_prompts.get(role.upper(), role_prompts['VENDEUR'])

        if context:
            prompt += f"\n\nContexte actuel des données:\n{context}"

        return prompt

    def create_context_from_data(self, data):
        """Crée un contexte textuel à partir des données"""
        if not data:
            return ""

        context_parts = []

        if 'products' in data:
            products = data['products']
            if isinstance(products, list) and len(products) > 0:
                context_parts.append(f"📦 Produits trouvés ({len(products)}):")
                for p in products[:5]:  # Limite à 5 pour le contexte
                    context_parts.append(f"  - {p.get('title', 'N/A')[:50]}... | Prix: {p.get('price', 0):.2f} MAD | Stock: {p.get('stock', 0)}")

        if 'sales_overview' in data:
            overview = data['sales_overview']
            context_parts.append(f"\n📊 Aperçu des ventes:")
            context_parts.append(f"  - Total ventes: {overview.get('total_sales', 0)}")
            context_parts.append(f"  - Chiffre d'affaires: {overview.get('total_revenue', 0):.2f} MAD")
            context_parts.append(f"  - Panier moyen: {overview.get('avg_order_value', 0):.2f} MAD")

        if 'inventory' in data:
            inv = data['inventory']
            context_parts.append(f"\n📦 Inventaire:")
            context_parts.append(f"  - Total produits: {inv.get('total_products', 0)}")
            context_parts.append(f"  - Rupture de stock: {inv.get('out_of_stock', 0)}")
            context_parts.append(f"  - Stock faible: {inv.get('low_stock', 0)}")

        if 'categories' in data:
            cats = data['categories']
            if isinstance(cats, list) and len(cats) > 0:
                context_parts.append(f"\n🏷️ Top catégories:")
                for c in cats[:3]:
                    context_parts.append(f"  - {c.get('category', 'N/A')}: {c.get('total_revenue', 0):.2f} MAD")

        return '\n'.join(context_parts)

    def chat(self, user_id, message, role='user', data_context=None):
        """Envoie un message et obtient une réponse"""

        # Initialise l'historique pour cet utilisateur si nécessaire
        if user_id not in self.conversation_history:
            self.conversation_history[user_id] = []

        # Construit le contexte
        context = self.create_context_from_data(data_context) if data_context else None
        system_prompt = self.get_system_prompt(role, context)

        # Ajoute le message utilisateur à l'historique
        self.conversation_history[user_id].append({
            'role': 'user',
            'content': message
        })

        # Limite l'historique à 10 messages pour éviter les tokens excessifs
        history = self.conversation_history[user_id][-10:]

        # Prépare les messages pour Ollama
        messages = [{'role': 'system', 'content': system_prompt}] + history

        try:
            response = self.client.chat(
                model=self.model,
                messages=messages,
                options={
                    'temperature': 0.7,
                    'top_p': 0.9,
                    'num_predict': 1000
                }
            )

            assistant_message = response['message']['content']

            # Ajoute la réponse à l'historique
            self.conversation_history[user_id].append({
                'role': 'assistant',
                'content': assistant_message
            })

            return {
                'success': True,
                'message': assistant_message,
                'model': self.model
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'message': f"Désolé, je n'ai pas pu traiter votre demande. Erreur: {str(e)}"
            }

    def clear_history(self, user_id):
        """Efface l'historique de conversation d'un utilisateur"""
        if user_id in self.conversation_history:
            self.conversation_history[user_id] = []
        return {'success': True, 'message': 'Historique effacé'}

    def get_quick_response(self, prompt, context=None):
        """Obtient une réponse rapide sans historique (pour les analyses)"""
        system_prompt = """Tu es un assistant d'analyse de données.
Réponds de manière concise et structurée. Utilise des emojis.
Formate les nombres et pourcentages clairement."""

        if context:
            system_prompt += f"\n\nDonnées à analyser:\n{context}"

        try:
            response = self.client.chat(
                model=self.model,
                messages=[
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user', 'content': prompt}
                ],
                options={
                    'temperature': 0.5,
                    'num_predict': 500
                }
            )
            return response['message']['content']
        except Exception as e:
            return f"Erreur d'analyse: {str(e)}"

    def check_connection(self):
        """Vérifie la connexion à Ollama"""
        try:
            models = self.client.list()
            available_models = [m['name'] for m in models.get('models', [])]
            return {
                'connected': True,
                'models': available_models,
                'current_model': self.model,
                'model_available': any(self.model in m for m in available_models)
            }
        except Exception as e:
            return {
                'connected': False,
                'error': str(e)
            }

# Instance globale
ollama_client = OllamaClient()
