"""
Service de Recherche Sémantique
Utilise des embeddings pour la recherche de produits
"""
import logging
import time
from typing import List, Dict, Any, Optional
from pathlib import Path
from datetime import datetime
import numpy as np

from app.config import settings
from app.models.schemas import (
    SearchQuery, SearchResponse, SearchResult, IndexStatusResponse
)

logger = logging.getLogger(__name__)

# Imports conditionnels
SENTENCE_TRANSFORMERS_AVAILABLE = False
FAISS_AVAILABLE = False

try:
    from sentence_transformers import SentenceTransformer
    SENTENCE_TRANSFORMERS_AVAILABLE = True
    logger.info("[OK] Sentence Transformers disponible")
except ImportError:
    logger.warning("[WARN] Sentence Transformers non disponible")

try:
    import faiss
    FAISS_AVAILABLE = True
    logger.info("[OK] FAISS disponible")
except ImportError:
    logger.warning("[WARN] FAISS non disponible")


class SemanticSearchService:
    """Service de recherche sémantique avec embeddings"""
    
    def __init__(self):
        self.model = None
        self.index = None
        self.products_data: List[Dict[str, Any]] = []
        self.embeddings: Optional[np.ndarray] = None
        self.is_ready = False
        self.last_updated: Optional[datetime] = None
        
        self._initialize_model()
    
    def _initialize_model(self):
        """Initialise le modele d'embeddings"""
        if not SENTENCE_TRANSFORMERS_AVAILABLE:
            logger.warning("Recherche semantique desactivee (sentence-transformers manquant)")
            return
        
        try:
            logger.info(f"[LOADING] Chargement du modele {settings.embedding_model}...")
            self.model = SentenceTransformer(settings.embedding_model)
            logger.info("[OK] Modele d'embeddings charge")
        except Exception as e:
            logger.error(f"[ERROR] Erreur chargement modele: {e}")
    
    def index_products(self, products: List[Dict[str, Any]]) -> bool:
        """
        Indexe une liste de produits
        
        Args:
            products: Liste de produits (dicts)
        """
        if not self.model:
            logger.error("Modèle non initialisé")
            return False
        
        if not products:
            logger.warning("Aucun produit à indexer")
            return False
        
        try:
            logger.info(f" Indexation de {len(products)} produits...")
            start_time = time.time()
            
            # Stocke les données
            self.products_data = products
            
            # Génère les textes pour les embeddings
            texts = []
            for p in products:
                text = self._create_search_text(p)
                texts.append(text)
            
            # Génère les embeddings
            self.embeddings = self.model.encode(
                texts,
                show_progress_bar=True,
                convert_to_numpy=True
            )
            
            # Crée l'index FAISS
            if FAISS_AVAILABLE:
                dimension = self.embeddings.shape[1]
                self.index = faiss.IndexFlatIP(dimension)  # Inner Product (cosine après normalisation)
                
                # Normalise pour cosine similarity
                faiss.normalize_L2(self.embeddings)
                self.index.add(self.embeddings)
            
            self.is_ready = True
            self.last_updated = datetime.now()
            
            elapsed = time.time() - start_time
            logger.info(f"[OK]  {len(products)} produits indexés en {elapsed:.2f}s")
            
            return True
        
        except Exception as e:
            logger.error(f"[OK]  Erreur indexation: {e}", exc_info=True)
            return False
    
    def _create_search_text(self, product: Dict[str, Any]) -> str:
        """Crée le texte de recherche pour un produit"""
        parts = []
        
        # Titre (le plus important)
        title = product.get('title', '')
        if title:
            parts.append(title)
        
        # Catégorie
        category = product.get('category_name') or product.get('category', '')
        if category:
            parts.append(f"Catégorie: {category}")
        
        # Caractéristiques
        price = product.get('price', 0)
        if price:
            if price < 50:
                parts.append("prix bas économique")
            elif price < 200:
                parts.append("prix moyen")
            else:
                parts.append("prix premium haut de gamme")
        
        rating = product.get('rating', 0)
        if rating:
            if rating >= 4.5:
                parts.append("excellente note très bien noté")
            elif rating >= 4.0:
                parts.append("bonne note bien noté")
        
        return " ".join(parts)
    
    def search(self, query: SearchQuery) -> SearchResponse:
        """
        Recherche sémantique de produits
        
        Args:
            query: Requête de recherche
        """
        start_time = time.time()
        
        if not self.is_ready:
            return SearchResponse(
                query=query.query,
                results=[],
                total_found=0,
                search_time_ms=0,
                suggestions=["Index non initialisé"]
            )
        
        try:
            # Encode la requête
            query_embedding = self.model.encode([query.query], convert_to_numpy=True)
            faiss.normalize_L2(query_embedding)
            
            # Recherche
            k = min(query.top_k * 3, len(self.products_data))  # Récupère plus pour filtrage
            
            if FAISS_AVAILABLE and self.index:
                scores, indices = self.index.search(query_embedding, k)
                scores = scores[0]
                indices = indices[0]
            else:
                # Fallback: recherche manuelle
                scores = np.dot(self.embeddings, query_embedding.T).flatten()
                indices = np.argsort(scores)[::-1][:k]
                scores = scores[indices]
            
            # Construit les résultats avec filtrage
            results = []
            for i, (score, idx) in enumerate(zip(scores, indices)):
                if idx < 0 or idx >= len(self.products_data):
                    continue
                
                product = self.products_data[idx]
                
                # Applique les filtres
                if not self._passes_filters(product, query):
                    continue
                
                result = SearchResult(
                    product_id=product.get('id', idx),
                    asin=product.get('asin', ''),
                    title=product.get('title', ''),
                    price=float(product.get('price', 0) or 0),
                    rating=float(product.get('rating', 0) or 0),
                    review_count=int(product.get('review_count', 0) or 0),
                    rank=int(product.get('rank', 0) or 0) if product.get('rank') else None,
                    stock=int(product.get('stock', 0) or 0),
                    category_name=product.get('category_name') or product.get('category', ''),
                    image_url=product.get('image_url', ''),
                    similarity_score=float(score),
                    highlights=self._generate_highlights(product, query.query)
                )
                results.append(result)
                
                if len(results) >= query.top_k:
                    break
            
            search_time = (time.time() - start_time) * 1000
            
            # Génère des suggestions
            suggestions = self._generate_suggestions(query.query, results)
            
            return SearchResponse(
                query=query.query,
                results=results,
                total_found=len(results),
                search_time_ms=search_time,
                suggestions=suggestions,
                filters_applied={
                    'category': query.category_filter,
                    'price_range': [query.price_min, query.price_max],
                    'min_rating': query.min_rating,
                    'in_stock_only': query.in_stock_only
                }
            )
        
        except Exception as e:
            logger.error(f"[OK]  Erreur recherche: {e}", exc_info=True)
            return SearchResponse(
                query=query.query,
                results=[],
                total_found=0,
                search_time_ms=0,
                suggestions=[f"Erreur: {str(e)}"]
            )
    
    def _passes_filters(self, product: Dict[str, Any], query: SearchQuery) -> bool:
        """Vérifie si un produit passe les filtres"""
        # Filtre catégorie
        if query.category_filter:
            cat = product.get('category_name') or product.get('category', '')
            if query.category_filter.lower() not in cat.lower():
                return False
        
        # Filtre prix
        price = float(product.get('price', 0) or 0)
        if query.price_min and price < query.price_min:
            return False
        if query.price_max and price > query.price_max:
            return False
        
        # Filtre rating
        if query.min_rating:
            rating = float(product.get('rating', 0) or 0)
            if rating < query.min_rating:
                return False
        
        # Filtre stock
        if query.in_stock_only:
            stock = int(product.get('stock', 0) or 0)
            if stock <= 0:
                return False
        
        return True
    
    def _generate_highlights(self, product: Dict[str, Any], query: str) -> List[str]:
        """Génère des highlights pour le résultat"""
        highlights = []
        query_words = query.lower().split()
        title = product.get('title', '').lower()
        
        for word in query_words:
            if word in title:
                highlights.append(f"Contient '{word}'")
        
        # Caractéristiques notables
        rating = product.get('rating', 0)
        if rating and rating >= 4.5:
            highlights.append("⭐ Excellentes notes")
        
        stock = product.get('stock', 0)
        if stock and stock > 100:
            highlights.append(" Stock important")
        
        return highlights[:3]
    
    def _generate_suggestions(self, query: str, results: List[SearchResult]) -> List[str]:
        """Génère des suggestions"""
        suggestions = []
        
        if not results:
            suggestions.append("Essayez des termes plus généraux")
            suggestions.append("Vérifiez l'orthographe")
        else:
            # Suggère des catégories trouvées
            categories = set(r.category_name for r in results if r.category_name)
            for cat in list(categories)[:2]:
                suggestions.append(f"Voir plus dans {cat}")
        
        return suggestions
    
    def get_similar_products(self, product_id: int, top_k: int = 5) -> List[SearchResult]:
        """Trouve des produits similaires"""
        if not self.is_ready:
            return []
        
        # Trouve l'index du produit
        product_idx = None
        for i, p in enumerate(self.products_data):
            if p.get('id') == product_id:
                product_idx = i
                break
        
        if product_idx is None:
            return []
        
        # Recherche les plus similaires
        product_embedding = self.embeddings[product_idx:product_idx+1]
        
        if FAISS_AVAILABLE and self.index:
            scores, indices = self.index.search(product_embedding, top_k + 1)
            scores = scores[0]
            indices = indices[0]
        else:
            scores = np.dot(self.embeddings, product_embedding.T).flatten()
            indices = np.argsort(scores)[::-1][:top_k + 1]
            scores = scores[indices]
        
        results = []
        for score, idx in zip(scores, indices):
            if idx == product_idx:
                continue
            
            product = self.products_data[idx]
            results.append(SearchResult(
                product_id=product.get('id', idx),
                asin=product.get('asin', ''),
                title=product.get('title', ''),
                price=float(product.get('price', 0) or 0),
                rating=float(product.get('rating', 0) or 0),
                review_count=int(product.get('review_count', 0) or 0),
                rank=int(product.get('rank', 0) or 0) if product.get('rank') else None,
                stock=int(product.get('stock', 0) or 0),
                category_name=product.get('category_name') or product.get('category', ''),
                image_url=product.get('image_url', ''),
                similarity_score=float(score),
                highlights=["Produit similaire"]
            ))
        
        return results[:top_k]
    
    def add_product(self, product: Dict[str, Any]) -> bool:
        """Ajoute un produit à l'index existant"""
        if not self.model:
            return False
        
        try:
            self.products_data.append(product)
            
            text = self._create_search_text(product)
            embedding = self.model.encode([text], convert_to_numpy=True)
            faiss.normalize_L2(embedding)
            
            if self.embeddings is not None:
                self.embeddings = np.vstack([self.embeddings, embedding])
            else:
                self.embeddings = embedding
            
            if FAISS_AVAILABLE and self.index:
                self.index.add(embedding)
            
            return True
        except Exception as e:
            logger.error(f"Erreur ajout produit: {e}")
            return False
    
    def clear_index(self):
        """Vide l'index"""
        self.products_data = []
        self.embeddings = None
        self.is_ready = False
        
        if FAISS_AVAILABLE:
            self.index = None
    
    def get_status(self) -> IndexStatusResponse:
        """Retourne le statut de l'index"""
        size_mb = None
        if self.embeddings is not None:
            size_mb = self.embeddings.nbytes / (1024 * 1024)
        
        return IndexStatusResponse(
            is_ready=self.is_ready,
            indexed_products=len(self.products_data),
            embedding_model=settings.embedding_model,
            last_updated=self.last_updated,
            index_size_mb=size_mb
        )


# Instance singleton
search_service = SemanticSearchService()
