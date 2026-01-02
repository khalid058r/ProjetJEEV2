"""
API Routes - Chatbot Intelligent avec LLM
"""
from fastapi import APIRouter, HTTPException
from typing import Optional
import logging

from app.models.schemas import ChatRequest, ChatResponse, ConversationHistory
from app.services.chatbot_service import chatbot_service
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["Chatbot"])


@router.post("", response_model=ChatResponse)
async def send_message(request: ChatRequest):
    """
    Envoie un message au chatbot
    
    Le chatbot utilise un LLM open source (Ollama/HuggingFace) si disponible.
    
    - **message**: Message de l'utilisateur
    - **conversation_id**: ID de conversation (optionnel)
    """
    try:
        response = await chatbot_service.process_message_async(request)
        return response
    except Exception as e:
        logger.error(f"❌ Erreur chatbot: {e}", exc_info=True)
        # Fallback sync
        try:
            return chatbot_service.process_message(request)
        except:
            raise HTTPException(status_code=500, detail=str(e))


@router.post("/init-llm")
async def initialize_llm(
    use_ollama: bool = True,
    ollama_model: str = None,
    use_huggingface: bool = True,
    hf_model: str = None
):
    """
    Initialise le LLM pour le chatbot
    
    **Ollama** (recommandé):
    - Installation: https://ollama.ai
    - Modèles: mistral, llama2, mixtral, phi
    - Commande: `ollama pull mistral && ollama serve`
    
    **HuggingFace** (fallback):
    - TinyLlama (léger, ~3GB RAM)
    - Mistral 7B (puissant, ~16GB RAM)
    """
    try:
        success = await chatbot_service.initialize_llm(
            use_ollama=use_ollama,
            ollama_model=ollama_model or settings.ollama_model,
            use_huggingface=use_huggingface,
            hf_model=hf_model or settings.hf_model
        )
        
        return {
            "success": success,
            "llm_active": chatbot_service.use_llm,
            "status": chatbot_service.get_llm_status()
        }
    except Exception as e:
        logger.error(f"Erreur init LLM: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/llm-status")
async def get_llm_status():
    """Statut du LLM"""
    return chatbot_service.get_llm_status()


@router.get("/{conversation_id}", response_model=ConversationHistory)
async def get_conversation(conversation_id: str):
    """Récupère l'historique d'une conversation"""
    conversation = chatbot_service.get_conversation(conversation_id)
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation non trouvée")
    
    return conversation


@router.delete("/{conversation_id}")
async def delete_conversation(conversation_id: str):
    """Efface une conversation"""
    conversation = chatbot_service.get_conversation(conversation_id)
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation non trouvée")
    
    chatbot_service.clear_conversation(conversation_id)
    return {"success": True, "message": "Conversation effacée"}


@router.get("/suggestions/autocomplete")
async def get_suggestions(partial_input: str):
    """Suggestions d'autocomplétion"""
    if not partial_input or len(partial_input) < 2:
        return {"suggestions": []}
    
    return {"suggestions": chatbot_service.get_suggestions(partial_input)}


@router.get("/quick-actions")
async def get_quick_actions():
    """Actions rapides disponibles"""
    return {
        "actions": [
            {"id": "search", "label": "🔍 Rechercher", "example": "Cherche un iPhone"},
            {"id": "categories", "label": "📂 Catégories", "example": "Quelles catégories ?"},
            {"id": "recommendations", "label": "⭐ Recommandations", "example": "Meilleurs produits"},
            {"id": "price", "label": "💰 Prix", "example": "Comparer les prix"},
            {"id": "stock", "label": "📦 Stock", "example": "Produits disponibles"},
            {"id": "stats", "label": "📊 Stats", "example": "Statistiques"},
            {"id": "help", "label": "❓ Aide", "example": "Comment ça marche ?"}
        ]
    }


@router.post("/quick-action/{action_id}")
async def execute_quick_action(action_id: str, conversation_id: Optional[str] = None):
    """Exécute une action rapide"""
    action_messages = {
        "search": "Que recherchez-vous ?",
        "categories": "Quelles catégories sont disponibles ?",
        "recommendations": "Quels sont les meilleurs produits ?",
        "price": "Montrez-moi les produits les moins chers",
        "stock": "Quels produits sont en stock ?",
        "stats": "Donnez-moi les statistiques du catalogue",
        "help": "Aide"
    }
    
    message = action_messages.get(action_id)
    if not message:
        raise HTTPException(status_code=400, detail=f"Action inconnue: {action_id}")
    
    request = ChatRequest(message=message, conversation_id=conversation_id)
    return await send_message(request)


@router.get("/stats")
async def get_chatbot_stats():
    """Statistiques du chatbot"""
    return {
        "active_conversations": len(chatbot_service.conversations),
        "llm_status": chatbot_service.get_llm_status(),
        "supported_intents": [
            "search_product", "product_info", "price_comparison",
            "stock_check", "category_browse", "recommendation",
            "analytics", "greeting", "help"
        ]
    }


@router.delete("/conversations/clear-all")
async def clear_all_conversations():
    """Efface toutes les conversations"""
    count = len(chatbot_service.conversations)
    chatbot_service.conversations.clear()
    return {"success": True, "cleared_count": count}
