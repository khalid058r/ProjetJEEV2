"""
Service Chatbot Intelligent avec LLM Open Source
Assistant conversationnel pour les produits e-commerce
"""
import logging
import re
import uuid
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime

from app.config import settings
from app.models.schemas import (
    ChatRequest, ChatResponse, ChatMessage, ChatIntent,
    SearchQuery, SearchResult, ConversationHistory
)
from app.services.search_service import search_service

logger = logging.getLogger(__name__)

# Import LLM
LLM_AVAILABLE = False
try:
    from app.services.llm_service import llm_service
    LLM_AVAILABLE = True
except ImportError:
    logger.warning("Service LLM non disponible")


class ChatbotService:
    """Service de chatbot intelligent"""
    
    def __init__(self):
        self.conversations: Dict[str, ConversationHistory] = {}
        self.use_llm = False
        self.llm_initialized = False
        
        # Patterns d'intention
        self.intent_patterns = {
            ChatIntent.SEARCH_PRODUCT: [
                r"cherche[rz]?\s+(.+)",
                r"trouve[rz]?\s+(.+)",
                r"recherche[rz]?\s+(.+)",
                r"montre[rz]?\s+(.+)",
                r"je veux\s+(.+)",
                r"j'?ai besoin\s+(.+)",
                r"où trouver\s+(.+)"
            ],
            ChatIntent.PRODUCT_INFO: [
                r"(?:c'est quoi|qu'est[- ]ce que?)\s+(.+)",
                r"info(?:rmation)?s?\s+(?:sur\s+)?(.+)",
                r"détails?\s+(?:sur\s+)?(.+)",
                r"parle[rz]?\s+(?:moi\s+)?(?:de\s+)?(.+)"
            ],
            ChatIntent.PRICE_COMPARISON: [
                r"prix\s+(?:de\s+)?(.+)",
                r"combien\s+(?:coûte|vaut)\s+(.+)",
                r"comparer?\s+(?:les\s+)?prix",
                r"moins\s+cher",
                r"meilleur\s+prix"
            ],
            ChatIntent.STOCK_CHECK: [
                r"stock\s+(?:de\s+)?(.+)?",
                r"disponib(?:le|ilité)",
                r"en\s+stock",
                r"rupture"
            ],
            ChatIntent.CATEGORY_BROWSE: [
                r"catégorie[s]?",
                r"liste[rz]?\s+(?:les\s+)?catégorie",
                r"quelles?\s+catégorie"
            ],
            ChatIntent.RECOMMENDATION: [
                r"recommand",
                r"conseil",
                r"suggè?r",
                r"meilleur[s]?\s+(?:produit)?",
                r"populaire[s]?",
                r"tendance"
            ],
            ChatIntent.ANALYTICS: [
                r"statistique[s]?",
                r"combien\s+(?:de\s+)?produit",
                r"total",
                r"analyse"
            ],
            ChatIntent.GREETING: [
                r"^(?:bonjour|salut|hello|hi|hey|coucou)",
                r"^(?:bonsoir|bonne\s+journée)"
            ],
            ChatIntent.GENERAL_HELP: [
                r"aide[rz]?",
                r"help",
                r"comment\s+(?:ça\s+)?(?:marche|fonctionne)",
                r"que\s+(?:peux|peut)[- ]tu\s+faire"
            ]
        }
    
    async def initialize_llm(
        self,
        use_ollama: bool = True,
        ollama_model: str = None,
        use_huggingface: bool = True,
        hf_model: str = None
    ) -> bool:
        """Initialise le LLM"""
        if not LLM_AVAILABLE:
            logger.warning("Service LLM non disponible")
            return False
        
        try:
            success = await llm_service.initialize(
                use_ollama=use_ollama,
                ollama_model=ollama_model or settings.ollama_model,
                use_huggingface=use_huggingface,
                hf_model=hf_model or settings.hf_model
            )
            
            self.use_llm = success
            self.llm_initialized = True
            
            if success:
                logger.info("✅ Chatbot LLM initialisé")
            else:
                logger.warning("⚠️ LLM non disponible, mode règles activé")
            
            return success
        except Exception as e:
            logger.error(f"Erreur init LLM: {e}")
            return False
    
    def process_message(self, request: ChatRequest) -> ChatResponse:
        """Traite un message (version synchrone)"""
        conversation_id = request.conversation_id or str(uuid.uuid4())
        
        if conversation_id not in self.conversations:
            self.conversations[conversation_id] = ConversationHistory(
                conversation_id=conversation_id,
                messages=[],
                created_at=datetime.now(),
                last_activity=datetime.now(),
                context={}
            )
        
        conversation = self.conversations[conversation_id]
        
        # Ajoute le message
        conversation.messages.append(ChatMessage(
            role="user",
            content=request.message,
            timestamp=datetime.now()
        ))
        conversation.last_activity = datetime.now()
        
        # Détecte l'intention
        intent, entities = self._detect_intent(request.message)
        
        # Recherche des produits si nécessaire
        related_products = []
        if intent in [ChatIntent.SEARCH_PRODUCT, ChatIntent.PRODUCT_INFO,
                      ChatIntent.PRICE_COMPARISON, ChatIntent.RECOMMENDATION]:
            query = entities.get("query", request.message)
            related_products = self._perform_search(query, top_k=5)
        
        # Génère la réponse
        response_text, suggestions = self._generate_response(
            intent, entities, request.message, conversation, related_products
        )
        
        # Calcule la confiance
        confidence = self._calculate_confidence(intent, entities, related_products)
        
        # Ajoute la réponse
        conversation.messages.append(ChatMessage(
            role="assistant",
            content=response_text,
            timestamp=datetime.now()
        ))
        
        if entities:
            conversation.context.update(entities)
        
        return ChatResponse(
            response=response_text,
            conversation_id=conversation_id,
            intent=intent,
            entities=entities,
            suggestions=suggestions,
            related_products=related_products[:5],
            confidence=confidence
        )
    
    async def process_message_async(self, request: ChatRequest) -> ChatResponse:
        """Traite un message avec support LLM"""
        if not self.llm_initialized and LLM_AVAILABLE:
            await self.initialize_llm()
        
        conversation_id = request.conversation_id or str(uuid.uuid4())
        
        if conversation_id not in self.conversations:
            self.conversations[conversation_id] = ConversationHistory(
                conversation_id=conversation_id,
                messages=[],
                created_at=datetime.now(),
                last_activity=datetime.now(),
                context={}
            )
        
        conversation = self.conversations[conversation_id]
        
        conversation.messages.append(ChatMessage(
            role="user",
            content=request.message,
            timestamp=datetime.now()
        ))
        conversation.last_activity = datetime.now()
        
        intent, entities = self._detect_intent(request.message)
        
        related_products = []
        if intent in [ChatIntent.SEARCH_PRODUCT, ChatIntent.PRODUCT_INFO,
                      ChatIntent.PRICE_COMPARISON, ChatIntent.RECOMMENDATION]:
            query = entities.get("query", request.message)
            related_products = self._perform_search(query, top_k=5)
        
        # Essaie le LLM
        response_text = None
        if self.use_llm:
            response_text = await self._generate_llm_response(
                request.message,
                {"products": [{"title": p.title, "price": p.price, "rating": p.rating, "stock": p.stock}
                             for p in related_products]},
                conversation
            )
        
        # Fallback
        if not response_text:
            response_text, suggestions = self._generate_response(
                intent, entities, request.message, conversation, related_products
            )
        else:
            suggestions = self._get_suggestions(intent, related_products)
        
        confidence = self._calculate_confidence(intent, entities, related_products)
        if self.use_llm:
            confidence = min(confidence + 0.1, 1.0)
        
        conversation.messages.append(ChatMessage(
            role="assistant",
            content=response_text,
            timestamp=datetime.now()
        ))
        
        return ChatResponse(
            response=response_text,
            conversation_id=conversation_id,
            intent=intent,
            entities=entities,
            suggestions=suggestions,
            related_products=related_products[:5],
            confidence=confidence
        )
    
    async def _generate_llm_response(
        self,
        message: str,
        context: Dict[str, Any],
        conversation: ConversationHistory
    ) -> Optional[str]:
        """Génère une réponse avec le LLM"""
        if not self.use_llm or not LLM_AVAILABLE:
            return None
        
        try:
            llm_context = {
                "products": context.get("products", []),
                "history": [
                    {"role": msg.role, "content": msg.content}
                    for msg in conversation.messages[-6:]
                ]
            }
            
            system_prompt = """Tu es un assistant e-commerce intelligent et amical.
Tu aides les utilisateurs à trouver des produits, comparer les prix, et obtenir des informations.

Règles:
- Réponds en français, de manière concise et utile
- Si des produits sont fournis, utilise ces informations
- Si tu ne sais pas, dis-le honnêtement
- Utilise des emojis avec modération"""
            
            response = await llm_service.generate(
                prompt=message,
                system_prompt=system_prompt,
                context=llm_context,
                temperature=0.7,
                max_tokens=500
            )
            
            return response
        except Exception as e:
            logger.error(f"Erreur LLM: {e}")
            return None
    
    def _detect_intent(self, message: str) -> Tuple[ChatIntent, Dict[str, Any]]:
        """Détecte l'intention et extrait les entités"""
        message_lower = message.lower().strip()
        entities = {}
        
        for intent, patterns in self.intent_patterns.items():
            for pattern in patterns:
                match = re.search(pattern, message_lower, re.IGNORECASE)
                if match:
                    if match.groups():
                        entities["query"] = match.group(1).strip()
                    return intent, entities
        
        if len(message_lower) > 3:
            entities["query"] = message
            return ChatIntent.SEARCH_PRODUCT, entities
        
        return ChatIntent.UNKNOWN, entities
    
    def _perform_search(self, query: str, top_k: int = 5) -> List[SearchResult]:
        """Effectue une recherche"""
        if not search_service.is_ready:
            return []
        
        try:
            search_query = SearchQuery(query=query, top_k=top_k)
            result = search_service.search(search_query)
            return result.results
        except Exception as e:
            logger.error(f"Erreur recherche: {e}")
            return []
    
    def _generate_response(
        self,
        intent: ChatIntent,
        entities: Dict[str, Any],
        message: str,
        conversation: ConversationHistory,
        products: List[SearchResult]
    ) -> Tuple[str, List[str]]:
        """Génère une réponse basée sur les règles"""
        suggestions = []
        
        if intent == ChatIntent.GREETING:
            response = "Bonjour ! 👋 Je suis votre assistant produits. Comment puis-je vous aider ?\n\n"
            response += "Je peux:\n"
            response += "• 🔍 Rechercher des produits\n"
            response += "• 💰 Comparer les prix\n"
            response += "• 📦 Vérifier les stocks\n"
            response += "• ⭐ Faire des recommandations"
            suggestions = ["Chercher un produit", "Voir les catégories", "Recommandations"]
        
        elif intent == ChatIntent.SEARCH_PRODUCT:
            if products:
                response = f"🔍 J'ai trouvé {len(products)} produit(s) pour '{entities.get('query', message)}':\n\n"
                for i, p in enumerate(products[:5], 1):
                    response += f"{i}. **{p.title[:60]}**\n"
                    response += f"   💰 {p.price}€"
                    if p.rating:
                        response += f" | ⭐ {p.rating}/5"
                    if p.stock:
                        response += f" | 📦 {p.stock} en stock"
                    response += "\n"
                suggestions = ["Plus de détails", "Comparer les prix", "Produits similaires"]
            else:
                response = f"❌ Je n'ai pas trouvé de produits pour '{entities.get('query', message)}'.\n"
                response += "Essayez avec d'autres termes ou vérifiez l'orthographe."
                suggestions = ["Voir les catégories", "Aide"]
        
        elif intent == ChatIntent.PRICE_COMPARISON:
            if products:
                sorted_products = sorted(products, key=lambda x: x.price)
                response = "💰 **Comparaison des prix:**\n\n"
                for p in sorted_products[:5]:
                    response += f"• {p.title[:50]} - **{p.price}€**\n"
                
                if len(sorted_products) > 1:
                    cheapest = sorted_products[0]
                    response += f"\n✅ Meilleur prix: **{cheapest.title[:40]}** à {cheapest.price}€"
                suggestions = ["Voir les détails", "Autre recherche"]
            else:
                response = "Je n'ai pas de produits à comparer. Recherchez d'abord des produits."
                suggestions = ["Chercher un produit"]
        
        elif intent == ChatIntent.STOCK_CHECK:
            if products:
                in_stock = [p for p in products if p.stock and p.stock > 0]
                out_of_stock = [p for p in products if not p.stock or p.stock <= 0]
                
                response = "📦 **État des stocks:**\n\n"
                if in_stock:
                    response += f"✅ {len(in_stock)} produit(s) disponible(s):\n"
                    for p in in_stock[:3]:
                        response += f"• {p.title[:40]} ({p.stock} en stock)\n"
                if out_of_stock:
                    response += f"\n❌ {len(out_of_stock)} produit(s) en rupture"
                suggestions = ["Produits en stock", "Notifications"]
            else:
                response = "Recherchez d'abord des produits pour vérifier les stocks."
                suggestions = ["Chercher un produit"]
        
        elif intent == ChatIntent.RECOMMENDATION:
            if products:
                top_rated = sorted(products, key=lambda x: x.rating or 0, reverse=True)
                response = "⭐ **Mes recommandations:**\n\n"
                for p in top_rated[:5]:
                    response += f"• **{p.title[:50]}**\n"
                    response += f"  {p.price}€ | ⭐ {p.rating or 'N/A'}/5\n"
                suggestions = ["Plus de détails", "Autre catégorie"]
            else:
                response = "Je n'ai pas assez de données pour faire des recommandations."
                suggestions = ["Voir les catégories", "Chercher un produit"]
        
        elif intent == ChatIntent.CATEGORY_BROWSE:
            if search_service.is_ready:
                categories = {}
                for p in search_service.products_data:
                    cat = p.get('category_name') or p.get('category', 'Autre')
                    categories[cat] = categories.get(cat, 0) + 1
                
                response = "📂 **Catégories disponibles:**\n\n"
                for cat, count in sorted(categories.items(), key=lambda x: x[1], reverse=True)[:10]:
                    response += f"• {cat} ({count} produits)\n"
                suggestions = [f"Voir {cat}" for cat in list(categories.keys())[:3]]
            else:
                response = "Les catégories ne sont pas encore chargées."
                suggestions = ["Aide"]
        
        elif intent == ChatIntent.ANALYTICS:
            if search_service.is_ready:
                total = len(search_service.products_data)
                prices = [p.get('price', 0) for p in search_service.products_data if p.get('price')]
                
                response = f"📊 **Statistiques du catalogue:**\n\n"
                response += f"• Total produits: {total}\n"
                if prices:
                    response += f"• Prix moyen: {sum(prices)/len(prices):.2f}€\n"
                    response += f"• Prix min: {min(prices):.2f}€\n"
                    response += f"• Prix max: {max(prices):.2f}€"
                suggestions = ["Voir les catégories", "Recommandations"]
            else:
                response = "Les statistiques ne sont pas disponibles."
                suggestions = ["Aide"]
        
        elif intent == ChatIntent.GENERAL_HELP:
            response = "🤖 **Comment puis-je vous aider?**\n\n"
            response += "**Commandes disponibles:**\n"
            response += "• `cherche [produit]` - Rechercher un produit\n"
            response += "• `prix de [produit]` - Voir les prix\n"
            response += "• `stock` - Vérifier la disponibilité\n"
            response += "• `recommandations` - Obtenir des suggestions\n"
            response += "• `catégories` - Voir les catégories\n"
            response += "• `statistiques` - Infos sur le catalogue"
            suggestions = ["Chercher un produit", "Catégories", "Recommandations"]
        
        else:
            if products:
                response = f"J'ai trouvé des produits qui pourraient correspondre:\n\n"
                for p in products[:3]:
                    response += f"• {p.title[:50]} - {p.price}€\n"
                suggestions = ["Plus de détails", "Autre recherche"]
            else:
                response = "Je ne suis pas sûr de comprendre. Pouvez-vous reformuler?\n"
                response += "Tapez `aide` pour voir ce que je peux faire."
                suggestions = ["Aide", "Chercher un produit"]
        
        return response, suggestions
    
    def _get_suggestions(self, intent: ChatIntent, products: List[SearchResult]) -> List[str]:
        """Génère des suggestions contextuelles"""
        suggestions = []
        
        if products:
            suggestions.append("Voir les détails")
            suggestions.append("Comparer les prix")
            categories = set(p.category_name for p in products[:5] if p.category_name)
            for cat in list(categories)[:2]:
                suggestions.append(f"Voir {cat}")
        else:
            suggestions.append("Chercher un produit")
            suggestions.append("Voir les catégories")
        
        return suggestions[:5]
    
    def _calculate_confidence(
        self,
        intent: ChatIntent,
        entities: Dict[str, Any],
        products: List[SearchResult]
    ) -> float:
        """Calcule la confiance de la réponse"""
        confidence = 0.5
        
        if intent != ChatIntent.UNKNOWN:
            confidence += 0.2
        
        if entities:
            confidence += 0.1
        
        if products:
            confidence += 0.1
            if len(products) >= 3:
                confidence += 0.1
        
        return min(confidence, 1.0)
    
    def get_conversation(self, conversation_id: str) -> Optional[ConversationHistory]:
        """Récupère une conversation"""
        return self.conversations.get(conversation_id)
    
    def clear_conversation(self, conversation_id: str):
        """Efface une conversation"""
        if conversation_id in self.conversations:
            del self.conversations[conversation_id]
    
    def get_suggestions(self, partial_input: str) -> List[str]:
        """Suggestions d'autocomplétion"""
        suggestions = []
        partial_lower = partial_input.lower()
        
        if partial_lower.startswith("ch"):
            suggestions.extend(["chercher", "chercher un produit"])
        if partial_lower.startswith("pr"):
            suggestions.extend(["prix de", "produits populaires"])
        if partial_lower.startswith("st"):
            suggestions.extend(["stock", "statistiques"])
        if partial_lower.startswith("ca"):
            suggestions.extend(["catégories", "catalogue"])
        if partial_lower.startswith("re"):
            suggestions.extend(["recommandations", "rechercher"])
        
        return suggestions[:5]
    
    def get_llm_status(self) -> Dict[str, Any]:
        """Retourne le statut du LLM"""
        if not LLM_AVAILABLE:
            return {"available": False, "reason": "LLM service not installed"}
        
        return {
            "available": True,
            "initialized": self.llm_initialized,
            "active": self.use_llm,
            "provider": llm_service.get_status() if self.llm_initialized else None
        }


# Instance singleton
chatbot_service = ChatbotService()
