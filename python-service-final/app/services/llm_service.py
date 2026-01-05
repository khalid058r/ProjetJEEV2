"""
Service LLM Open Source
Utilise Ollama (Mistral, Llama) ou HuggingFace Transformers
"""
import logging
import asyncio
from typing import Optional, Dict, Any, List
from abc import ABC, abstractmethod
import json
import re

from app.config import settings

logger = logging.getLogger(__name__)

# Flags de disponibilité
TRANSFORMERS_AVAILABLE = False
HTTPX_AVAILABLE = False

try:
    from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline
    import torch
    TRANSFORMERS_AVAILABLE = True
    logger.info("[OK] Transformers disponible")
except ImportError:
    logger.warning("[WARN] Transformers non disponible")

try:
    import httpx
    HTTPX_AVAILABLE = True
except ImportError:
    logger.warning("[WARN] ️ httpx non disponible")


class BaseLLMProvider(ABC):
    """Interface pour les providers LLM"""
    
    @abstractmethod
    async def generate(self, prompt: str, system_prompt: str = None, **kwargs) -> str:
        pass
    
    @abstractmethod
    async def is_available(self) -> bool:
        pass
    
    @abstractmethod
    def get_model_info(self) -> Dict[str, Any]:
        pass


class OllamaProvider(BaseLLMProvider):
    """
    Provider Ollama pour modèles locaux
    
    Installation: https://ollama.ai
    Puis: ollama pull mistral
    """
    
    def __init__(
        self,
        base_url: str = None,
        model: str = None,
        timeout: int = 120
    ):
        self.base_url = base_url or settings.ollama_url
        self.model = model or settings.ollama_model
        self.timeout = timeout
        self._client: Optional[httpx.AsyncClient] = None
    
    async def get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                base_url=self.base_url,
                timeout=self.timeout
            )
        return self._client
    
    async def is_available(self) -> bool:
        """Vérifie si Ollama est disponible"""
        if not HTTPX_AVAILABLE:
            return False
        
        try:
            client = await self.get_client()
            response = await client.get("/api/tags")
            if response.status_code == 200:
                models = response.json().get("models", [])
                available_models = [m.get("name", "").split(":")[0] for m in models]
                return self.model in available_models
            return False
        except Exception as e:
            logger.debug(f"Ollama non disponible: {e}")
            return False
    
    async def generate(
        self,
        prompt: str,
        system_prompt: str = None,
        temperature: float = None,
        max_tokens: int = None,
        **kwargs
    ) -> str:
        """Génère une réponse avec Ollama"""
        try:
            client = await self.get_client()
            
            # Construit le prompt
            if system_prompt:
                full_prompt = f"<|system|>\n{system_prompt}\n<|user|>\n{prompt}\n<|assistant|>\n"
            else:
                full_prompt = prompt
            
            payload = {
                "model": self.model,
                "prompt": full_prompt,
                "stream": False,
                "options": {
                    "temperature": temperature or settings.llm_temperature,
                    "num_predict": max_tokens or settings.llm_max_tokens
                }
            }
            
            response = await client.post("/api/generate", json=payload)
            response.raise_for_status()
            
            result = response.json()
            return result.get("response", "").strip()
        
        except Exception as e:
            logger.error(f"Erreur Ollama: {e}")
            raise
    
    def get_model_info(self) -> Dict[str, Any]:
        return {
            "provider": "ollama",
            "model": self.model,
            "base_url": self.base_url,
            "type": "local"
        }
    
    async def close(self):
        if self._client and not self._client.is_closed:
            await self._client.aclose()


class HuggingFaceProvider(BaseLLMProvider):
    """
    Provider HuggingFace Transformers
    
    Modèles recommandés:
    - TinyLlama/TinyLlama-1.1B-Chat-v1.0 (léger)
    - microsoft/phi-2 (équilibré)
    - mistralai/Mistral-7B-Instruct-v0.2 (puissant)
    """
    
    def __init__(
        self,
        model_name: str = None,
        device: str = "auto"
    ):
        self.model_name = model_name or settings.hf_model
        self.device = device
        self.model = None
        self.tokenizer = None
        self.pipe = None
        self._loaded = False
    
    def _load_model(self):
        """Charge le modèle (lazy loading)"""
        if self._loaded:
            return
        
        if not TRANSFORMERS_AVAILABLE:
            raise RuntimeError("Transformers non installé")
        
        logger.info(f" Chargement de {self.model_name}...")
        
        try:
            # Détermine le device
            if self.device == "auto":
                device = "cuda" if torch.cuda.is_available() else "cpu"
            else:
                device = self.device
            
            # Charge le tokenizer
            self.tokenizer = AutoTokenizer.from_pretrained(
                self.model_name,
                trust_remote_code=True
            )
            
            # Config du modèle
            model_kwargs = {
                "trust_remote_code": True,
                "torch_dtype": torch.float16 if device == "cuda" else torch.float32
            }
            
            # Charge le modèle
            self.model = AutoModelForCausalLM.from_pretrained(
                self.model_name,
                device_map="auto" if device == "cuda" else None,
                **model_kwargs
            )
            
            if device == "cpu":
                self.model = self.model.to(device)
            
            # Pipeline
            self.pipe = pipeline(
                "text-generation",
                model=self.model,
                tokenizer=self.tokenizer
            )
            
            self._loaded = True
            logger.info(f"[OK]  Modèle chargé sur {device}")
        
        except Exception as e:
            logger.error(f"[OK]  Erreur chargement: {e}")
            raise
    
    async def is_available(self) -> bool:
        return TRANSFORMERS_AVAILABLE
    
    async def generate(
        self,
        prompt: str,
        system_prompt: str = None,
        temperature: float = None,
        max_tokens: int = None,
        **kwargs
    ) -> str:
        """Génère une réponse"""
        if not self._loaded:
            self._load_model()
        
        # Format du prompt
        if system_prompt:
            if "TinyLlama" in self.model_name or "zephyr" in self.model_name:
                full_prompt = f"<|system|>\n{system_prompt}</s>\n<|user|>\n{prompt}</s>\n<|assistant|>\n"
            elif "Mistral" in self.model_name:
                full_prompt = f"[INST] {system_prompt}\n\n{prompt} [/INST]"
            else:
                full_prompt = f"System: {system_prompt}\n\nUser: {prompt}\n\nAssistant:"
        else:
            full_prompt = prompt
        
        try:
            outputs = self.pipe(
                full_prompt,
                max_new_tokens=max_tokens or settings.llm_max_tokens,
                temperature=temperature or settings.llm_temperature,
                do_sample=True,
                pad_token_id=self.tokenizer.eos_token_id,
                return_full_text=False
            )
            
            response = outputs[0]["generated_text"].strip()
            return self._clean_response(response)
        
        except Exception as e:
            logger.error(f"Erreur génération: {e}")
            raise
    
    def _clean_response(self, response: str) -> str:
        """Nettoie la réponse"""
        response = re.sub(r'<\|.*?\|>', '', response)
        response = re.sub(r'\[INST\].*?\[/INST\]', '', response)
        
        for stop in ["\n\nUser:", "\n\nHuman:", "</s>"]:
            if stop in response:
                response = response.split(stop)[0]
        
        return response.strip()
    
    def get_model_info(self) -> Dict[str, Any]:
        return {
            "provider": "huggingface",
            "model": self.model_name,
            "loaded": self._loaded,
            "type": "local"
        }


class LLMService:
    """Service LLM unifié avec fallback automatique"""
    
    def __init__(self):
        self.providers: Dict[str, BaseLLMProvider] = {}
        self.active_provider: Optional[str] = None
        self._initialized = False
        
        self.default_system_prompt = """Tu es un assistant e-commerce intelligent et amical.
Tu aides les utilisateurs à trouver des produits, comparer les prix, et obtenir des informations.
Réponds de manière concise et utile en français.
Si tu ne sais pas, dis-le honnêtement."""
    
    async def initialize(
        self,
        use_ollama: bool = True,
        ollama_model: str = None,
        use_huggingface: bool = True,
        hf_model: str = None
    ) -> bool:
        """Initialise les providers disponibles"""
        
        # Ollama en premier (plus rapide)
        if use_ollama and HTTPX_AVAILABLE:
            ollama = OllamaProvider(model=ollama_model)
            if await ollama.is_available():
                self.providers["ollama"] = ollama
                self.active_provider = "ollama"
                logger.info(f"[OK]  Ollama disponible ({ollama.model})")
        
        # HuggingFace en fallback
        if use_huggingface and TRANSFORMERS_AVAILABLE:
            hf = HuggingFaceProvider(model_name=hf_model)
            if await hf.is_available():
                self.providers["huggingface"] = hf
                if not self.active_provider:
                    self.active_provider = "huggingface"
                logger.info(f"[OK]  HuggingFace disponible ({hf.model_name})")
        
        self._initialized = True
        
        if not self.providers:
            logger.warning("[WARN] ️ Aucun provider LLM disponible")
        
        return self.active_provider is not None
    
    async def generate(
        self,
        prompt: str,
        system_prompt: str = None,
        provider: str = None,
        context: Dict[str, Any] = None,
        **kwargs
    ) -> str:
        """Génère une réponse"""
        if not self._initialized:
            await self.initialize()
        
        provider_name = provider or self.active_provider
        
        if not provider_name or provider_name not in self.providers:
            return self._fallback_response(prompt)
        
        llm = self.providers[provider_name]
        
        # Enrichit le prompt
        enriched_prompt = self._enrich_prompt(prompt, context)
        system = system_prompt or self.default_system_prompt
        
        try:
            return await llm.generate(
                prompt=enriched_prompt,
                system_prompt=system,
                **kwargs
            )
        except Exception as e:
            logger.error(f"Erreur {provider_name}: {e}")
            
            # Essaie un autre provider
            for name, prov in self.providers.items():
                if name != provider_name:
                    try:
                        return await prov.generate(
                            prompt=enriched_prompt,
                            system_prompt=system,
                            **kwargs
                        )
                    except:
                        continue
            
            return self._fallback_response(prompt)
    
    def _enrich_prompt(self, prompt: str, context: Dict[str, Any] = None) -> str:
        """Enrichit le prompt avec le contexte"""
        if not context:
            return prompt
        
        enriched = prompt
        
        # Ajoute les produits
        if "products" in context and context["products"]:
            products_info = "\n\nProduits pertinents:\n"
            for p in context["products"][:5]:
                products_info += f"- {p.get('title', 'N/A')} | {p.get('price', 0)}€ | "
                products_info += f"Stock: {p.get('stock', 0)} | Note: {p.get('rating', 0)}/5\n"
            enriched = f"{products_info}\nQuestion: {prompt}"
        
        # Ajoute l'historique
        if "history" in context and context["history"]:
            history_str = "\n".join([
                f"{msg['role']}: {msg['content']}"
                for msg in context["history"][-4:]
            ])
            enriched = f"Historique:\n{history_str}\n\nNouveau message: {prompt}"
        
        return enriched
    
    def _fallback_response(self, prompt: str) -> str:
        """Réponse de fallback"""
        prompt_lower = prompt.lower()
        
        if any(w in prompt_lower for w in ["bonjour", "salut", "hello"]):
            return "Bonjour ! Je suis votre assistant produits. Comment puis-je vous aider ?"
        
        if any(w in prompt_lower for w in ["merci", "thanks"]):
            return "Je vous en prie ! N'hésitez pas si vous avez d'autres questions."
        
        if any(w in prompt_lower for w in ["cherche", "recherche", "trouver"]):
            return "Je peux vous aider à trouver des produits. Que recherchez-vous ?"
        
        return "Je suis là pour vous aider avec les produits. Que souhaitez-vous savoir ?"
    
    def is_available(self) -> bool:
        return bool(self.providers)
    
    def get_status(self) -> Dict[str, Any]:
        return {
            "initialized": self._initialized,
            "active_provider": self.active_provider,
            "providers": {
                name: prov.get_model_info()
                for name, prov in self.providers.items()
            }
        }
    
    async def close(self):
        for prov in self.providers.values():
            if hasattr(prov, "close"):
                await prov.close()


# Instance singleton
llm_service = LLMService()
