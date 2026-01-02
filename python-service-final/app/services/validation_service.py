"""
Service de Validation de Données Avancé
Validation, nettoyage et enrichissement des données produits
"""
import logging
import re
from typing import Dict, Any, List, Tuple, Optional
from datetime import datetime
import numpy as np

from app.config import settings

logger = logging.getLogger(__name__)


class ValidationResult:
    """Résultat de validation"""
    def __init__(self):
        self.is_valid = True
        self.errors: List[Dict] = []
        self.warnings: List[Dict] = []
        self.cleaned_data: Dict = {}
        self.enrichments: Dict = {}
    
    def add_error(self, field: str, message: str, value: Any = None):
        self.is_valid = False
        self.errors.append({
            "field": field,
            "message": message,
            "value": str(value)[:100] if value else None
        })
    
    def add_warning(self, field: str, message: str, value: Any = None):
        self.warnings.append({
            "field": field,
            "message": message,
            "value": str(value)[:100] if value else None
        })
    
    def to_dict(self) -> Dict:
        return {
            "is_valid": self.is_valid,
            "errors": self.errors,
            "warnings": self.warnings,
            "cleaned_data": self.cleaned_data,
            "enrichments": self.enrichments
        }


class DataValidationService:
    """
    Service de validation et nettoyage des données
    
    Fonctionnalités:
    - Validation des champs produits
    - Nettoyage automatique
    - Détection d'anomalies
    - Enrichissement de données
    """
    
    def __init__(self):
        # Regex patterns
        self.asin_pattern = re.compile(r'^[A-Z0-9]{10}$')
        self.url_pattern = re.compile(r'^https?://[^\s]+$')
        self.price_pattern = re.compile(r'[\$€£]?\s*(\d+(?:[.,]\d+)?)')
        
        # Statistiques de validation
        self.stats = {
            "total_validated": 0,
            "valid": 0,
            "invalid": 0,
            "auto_corrected": 0
        }
    
    def validate_product(self, product: Dict[str, Any]) -> ValidationResult:
        """
        Valide un produit complet
        """
        result = ValidationResult()
        cleaned = {}
        
        # 1. ASIN
        asin = self._validate_asin(product.get('asin'), result)
        if asin:
            cleaned['asin'] = asin
        
        # 2. Title
        title = self._validate_title(product.get('title'), result)
        cleaned['title'] = title
        
        # 3. Price
        price = self._validate_price(product.get('price'), result)
        cleaned['price'] = price
        
        # 4. Rating
        rating = self._validate_rating(product.get('rating'), result)
        cleaned['rating'] = rating
        
        # 5. Review Count
        review_count = self._validate_review_count(product.get('review_count'), result)
        cleaned['review_count'] = review_count
        
        # 6. Rank
        rank = self._validate_rank(product.get('rank'), result)
        cleaned['rank'] = rank
        
        # 7. Stock
        stock = self._validate_stock(product.get('stock'), result)
        cleaned['stock'] = stock
        
        # 8. Category
        category = self._validate_category(product.get('category'), result)
        cleaned['category'] = category
        
        # 9. Image URL
        image_url = self._validate_image_url(product.get('image_url'), result)
        cleaned['image_url'] = image_url
        
        # 10. Validations croisées
        self._cross_validate(cleaned, result)
        
        # 11. Enrichissements
        result.enrichments = self._enrich_product(cleaned)
        
        result.cleaned_data = cleaned
        
        # Stats
        self.stats["total_validated"] += 1
        if result.is_valid:
            self.stats["valid"] += 1
        else:
            self.stats["invalid"] += 1
        
        return result
    
    def validate_batch(self, products: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Valide un lot de produits
        """
        results = {
            "total": len(products),
            "valid": 0,
            "invalid": 0,
            "warnings": 0,
            "products": [],
            "summary": {
                "error_types": {},
                "warning_types": {}
            }
        }
        
        for i, product in enumerate(products):
            validation = self.validate_product(product)
            
            if validation.is_valid:
                results["valid"] += 1
            else:
                results["invalid"] += 1
            
            if validation.warnings:
                results["warnings"] += len(validation.warnings)
            
            # Agrège les types d'erreurs
            for error in validation.errors:
                error_type = error["field"]
                results["summary"]["error_types"][error_type] = \
                    results["summary"]["error_types"].get(error_type, 0) + 1
            
            for warning in validation.warnings:
                warning_type = warning["field"]
                results["summary"]["warning_types"][warning_type] = \
                    results["summary"]["warning_types"].get(warning_type, 0) + 1
            
            results["products"].append({
                "index": i,
                "is_valid": validation.is_valid,
                "cleaned_data": validation.cleaned_data,
                "errors": validation.errors,
                "warnings": validation.warnings
            })
        
        return results
    
    def _validate_asin(self, asin: Any, result: ValidationResult) -> Optional[str]:
        """Valide l'ASIN Amazon"""
        if not asin:
            result.add_error("asin", "ASIN manquant")
            return None
        
        asin_str = str(asin).strip().upper()
        
        if len(asin_str) != 10:
            result.add_error("asin", f"ASIN doit avoir 10 caractères (trouvé: {len(asin_str)})", asin)
            return None
        
        if not self.asin_pattern.match(asin_str):
            result.add_error("asin", "Format ASIN invalide", asin)
            return None
        
        return asin_str
    
    def _validate_title(self, title: Any, result: ValidationResult) -> str:
        """Valide et nettoie le titre"""
        if not title:
            result.add_error("title", "Titre manquant")
            return "Unknown Product"
        
        title_str = str(title).strip()
        
        # Nettoie les caractères spéciaux excessifs
        title_str = re.sub(r'\s+', ' ', title_str)
        title_str = title_str[:500]  # Limite la longueur
        
        if len(title_str) < 5:
            result.add_warning("title", "Titre très court", title_str)
        
        if len(title_str) > 300:
            result.add_warning("title", "Titre tronqué (trop long)")
        
        return title_str
    
    def _validate_price(self, price: Any, result: ValidationResult) -> float:
        """Valide et nettoie le prix"""
        if price is None:
            result.add_warning("price", "Prix manquant, défaut à 0")
            return 0.0
        
        try:
            if isinstance(price, str):
                # Extrait le prix d'une chaîne
                match = self.price_pattern.search(price)
                if match:
                    price = match.group(1).replace(',', '.')
                else:
                    result.add_error("price", "Format de prix invalide", price)
                    return 0.0
            
            price_float = float(price)
            
            if price_float < 0:
                result.add_error("price", "Prix négatif", price)
                return 0.0
            
            if price_float > 100000:
                result.add_warning("price", "Prix exceptionnellement élevé", price_float)
            
            return round(price_float, 2)
            
        except (ValueError, TypeError):
            result.add_error("price", "Prix non convertible", price)
            return 0.0
    
    def _validate_rating(self, rating: Any, result: ValidationResult) -> float:
        """Valide le rating"""
        if rating is None:
            return 0.0
        
        try:
            rating_float = float(rating)
            
            if rating_float < 0:
                result.add_warning("rating", "Rating négatif corrigé", rating)
                return 0.0
            
            if rating_float > 5:
                result.add_warning("rating", "Rating > 5 corrigé", rating)
                return 5.0
            
            return round(rating_float, 2)
            
        except (ValueError, TypeError):
            result.add_warning("rating", "Rating invalide, défaut à 0", rating)
            return 0.0
    
    def _validate_review_count(self, reviews: Any, result: ValidationResult) -> int:
        """Valide le nombre d'avis"""
        if reviews is None:
            return 0
        
        try:
            if isinstance(reviews, str):
                reviews = reviews.replace(',', '').replace(' ', '')
            
            reviews_int = int(float(reviews))
            
            if reviews_int < 0:
                result.add_warning("review_count", "Nombre d'avis négatif corrigé", reviews)
                return 0
            
            return reviews_int
            
        except (ValueError, TypeError):
            result.add_warning("review_count", "Nombre d'avis invalide", reviews)
            return 0
    
    def _validate_rank(self, rank: Any, result: ValidationResult) -> Optional[int]:
        """Valide le rang"""
        if rank is None:
            return None
        
        try:
            if isinstance(rank, str):
                rank = rank.replace(',', '').replace('#', '').strip()
            
            rank_int = int(float(rank))
            
            if rank_int <= 0:
                result.add_warning("rank", "Rang invalide (<= 0)", rank)
                return None
            
            if rank_int > 10000000:
                result.add_warning("rank", "Rang exceptionnellement élevé", rank)
            
            return rank_int
            
        except (ValueError, TypeError):
            result.add_warning("rank", "Rang non convertible", rank)
            return None
    
    def _validate_stock(self, stock: Any, result: ValidationResult) -> int:
        """Valide le stock"""
        if stock is None:
            return 0
        
        try:
            stock_int = int(float(stock))
            
            if stock_int < 0:
                result.add_warning("stock", "Stock négatif corrigé", stock)
                return 0
            
            return stock_int
            
        except (ValueError, TypeError):
            result.add_warning("stock", "Stock invalide", stock)
            return 0
    
    def _validate_category(self, category: Any, result: ValidationResult) -> str:
        """Valide la catégorie"""
        if not category:
            return "Unknown"
        
        category_str = str(category).strip()
        
        # Nettoie et normalise
        category_str = re.sub(r'\s+', ' ', category_str)
        category_str = category_str[:100]  # Limite
        
        if len(category_str) < 2:
            result.add_warning("category", "Catégorie très courte", category_str)
            return "Unknown"
        
        return category_str
    
    def _validate_image_url(self, url: Any, result: ValidationResult) -> Optional[str]:
        """Valide l'URL de l'image"""
        if not url:
            return None
        
        url_str = str(url).strip()
        
        if not self.url_pattern.match(url_str):
            result.add_warning("image_url", "URL d'image invalide", url_str[:50])
            return None
        
        return url_str
    
    def _cross_validate(self, product: Dict, result: ValidationResult) -> None:
        """Validations croisées entre champs"""
        
        # Rating élevé avec peu d'avis
        rating = product.get('rating', 0)
        reviews = product.get('review_count', 0)
        
        if rating >= 4.8 and reviews < 10:
            result.add_warning(
                "cross_validation",
                f"Rating excellent ({rating}) avec peu d'avis ({reviews}) - suspect"
            )
        
        # Rang très bon mais rating faible
        rank = product.get('rank')
        if rank and rank < 100 and rating < 3.5:
            result.add_warning(
                "cross_validation",
                f"Top 100 (rang {rank}) avec rating faible ({rating})"
            )
        
        # Prix à 0 avec stock
        price = product.get('price', 0)
        stock = product.get('stock', 0)
        
        if price == 0 and stock > 0:
            result.add_warning(
                "cross_validation",
                "Prix à 0 avec stock disponible - vérifier"
            )
    
    def _enrich_product(self, product: Dict) -> Dict:
        """Enrichit le produit avec des données calculées"""
        enrichments = {}
        
        price = product.get('price', 0)
        rating = product.get('rating', 0)
        reviews = product.get('review_count', 0)
        rank = product.get('rank')
        stock = product.get('stock', 0)
        
        # Score de popularité
        popularity = (rating * 20) + np.log1p(reviews) * 10
        if rank and rank < 1000:
            popularity += (1000 - rank) / 10
        enrichments['popularity_score'] = round(popularity, 2)
        
        # Classification de prix
        if price < 10:
            enrichments['price_tier'] = 'budget'
        elif price < 30:
            enrichments['price_tier'] = 'economy'
        elif price < 100:
            enrichments['price_tier'] = 'standard'
        elif price < 500:
            enrichments['price_tier'] = 'premium'
        else:
            enrichments['price_tier'] = 'luxury'
        
        # Statut de stock
        if stock == 0:
            enrichments['stock_status'] = 'out_of_stock'
        elif stock <= 5:
            enrichments['stock_status'] = 'critical'
        elif stock <= 20:
            enrichments['stock_status'] = 'low'
        elif stock <= 100:
            enrichments['stock_status'] = 'normal'
        else:
            enrichments['stock_status'] = 'high'
        
        # Score de santé produit (0-100)
        health = 50  # Base
        
        if rating >= 4.0:
            health += 15
        elif rating >= 3.5:
            health += 10
        elif rating < 3.0 and rating > 0:
            health -= 15
        
        if reviews >= 100:
            health += 10
        elif reviews >= 50:
            health += 5
        
        if rank and rank <= 1000:
            health += 15
        elif rank and rank <= 5000:
            health += 10
        elif rank and rank > 50000:
            health -= 10
        
        if stock > 10:
            health += 10
        elif stock == 0:
            health -= 20
        
        enrichments['health_score'] = min(100, max(0, health))
        
        return enrichments
    
    def get_stats(self) -> Dict:
        """Retourne les statistiques de validation"""
        return self.stats


# Instance singleton
validation_service = DataValidationService()
