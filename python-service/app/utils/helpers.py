import re
import logging
from typing import Optional, Any

logger = logging.getLogger(__name__)


# ============ NETTOYAGE DONNÉES ============

def clean_string(value: Any) -> Optional[str]:
    """Nettoie et normalise une chaîne de caractères"""
    if value is None or value == "":
        return None
    
    if not isinstance(value, str):
        value = str(value)
    
    value = value.strip()
    value = value.replace('""', '"')
    
    return value if value else None


def clean_price(value: Any) -> Optional[float]:
    """Nettoie et convertit un prix"""
    if value is None or value == "":
        return None
    
    try:
        # Convertit en string
        value_str = str(value)
        
        # Enlève symboles monétaires
        value_str = re.sub(r'[€$£¥₹]', '', value_str)
        value_str = re.sub(r'\b(USD|EUR|GBP|CHF|CAD)\b', '', value_str, flags=re.IGNORECASE)
        value_str = value_str.strip()
        
        # Détection du format selon position virgule/point
        point_count = value_str.count('.')
        comma_count = value_str.count(',')
        
        if comma_count > 0 and point_count > 0:
            # Les deux présents: déterminer qui est le séparateur décimal
            last_comma_pos = value_str.rfind(',')
            last_point_pos = value_str.rfind('.')
            
            if last_comma_pos > last_point_pos:
                # Format EU: "1.199,99"
                value_str = value_str.replace('.', '')
                value_str = value_str.replace(',', '.')
            else:
                # Format US: "1,199.99"
                value_str = value_str.replace(',', '')
        
        elif comma_count > 0:
            # Seulement virgules
            # Vérifier si c'est un séparateur décimal ou milliers
            parts = value_str.split(',')
            if len(parts[-1]) <= 2 and len(parts) >= 2:
                # Probablement format EU: "1199,99" ou "1.199,99"
                value_str = value_str.replace('.', '')
                value_str = value_str.replace(',', '.')
            else:
                # Format US avec virgules milliers: "1,199"
                value_str = value_str.replace(',', '')
        
        elif point_count > 1:
            # Multiple points: probablement milliers format EU "1.199.000"
            value_str = value_str.replace('.', '')
        
        # Convertit en float
        price = float(value_str)
        
        # Validation
        if price < 0:
            logger.warning(f"Prix négatif: {price}")
            return None
        
        if price > 100000:
            logger.warning(f"Prix trop élevé: {price}")
            return None
        
        return round(price, 2)
    
    except (ValueError, AttributeError, TypeError) as e:
        logger.debug(f"Erreur conversion prix '{value}': {e}")
        return None


def clean_rating(value: Any) -> Optional[float]:
    """Nettoie et convertit une note"""
    if value is None or value == "":
        return None
    
    try:
        value_str = str(value)
        
        # Format "4.5/5"
        if "/" in value_str:
            parts = value_str.split("/")
            value_str = parts[0].strip()
        
        # Remplace virgule par point
        value_str = value_str.replace(",", ".")
        
        rating = float(value_str)
        
        # Normalise sur 5
        if rating > 5:
            rating = rating / (10 if rating <= 10 else 100) * 5
        
        if rating < 0 or rating > 5:
            logger.warning(f"Rating invalide: {rating}")
            return None
        
        return round(rating, 1)
    
    except (ValueError, AttributeError, TypeError) as e:
        logger.debug(f"Erreur conversion rating '{value}': {e}")
        return None


def clean_integer(value: Any) -> Optional[int]:
    """Nettoie et convertit un entier"""
    if value is None or value == "":
        return None
    
    try:
        value_str = str(value)
        value_str = value_str.replace(",", "").replace(" ", "").replace(".", "")
        
        return int(float(value_str))
    
    except (ValueError, AttributeError, TypeError) as e:
        logger.debug(f"Erreur conversion entier '{value}': {e}")
        return None


def clean_asin(value: Any) -> Optional[str]:
    """Nettoie et valide un ASIN Amazon"""
    asin = clean_string(value)
    
    if not asin:
        return None
    
    asin = asin.upper()
    
    if len(asin) != 10:
        return None
    
    if not re.match(r'^[A-Z0-9]{10}$', asin):
        return None
    
    return asin


def clean_url(value: Any) -> Optional[str]:
    """Nettoie et valide une URL"""
    url = clean_string(value)
    
    if not url:
        return None
    
    if not (url.startswith("http://") or url.startswith("https://")):
        return None
    
    return url


# ============ CLASSIFICATION ============

def classify_rank(rank: int) -> tuple[int, str]:
    """Classifie un rank en catégorie 1-5"""
    if rank <= 10:
        return 5, "Excellent"
    elif rank <= 100:
        return 4, "Très bon"
    elif rank <= 1000:
        return 3, "Bon"
    elif rank <= 5000:
        return 2, "Moyen"
    else:
        return 1, "Faible"


def classify_price(price: float, category_avg: Optional[float] = None) -> tuple[str, str]:
    """Classifie un prix en bucket"""
    if category_avg:
        ratio = price / category_avg
        if ratio < 0.5:
            return "very_low", "Très bas"
        elif ratio < 0.8:
            return "low", "Bas"
        elif ratio < 1.2:
            return "medium", "Moyen"
        elif ratio < 1.5:
            return "high", "Élevé"
        else:
            return "very_high", "Très élevé"
    else:
        if price < 20:
            return "very_low", "Très bas"
        elif price < 50:
            return "low", "Bas"
        elif price < 200:
            return "medium", "Moyen"
        elif price < 500:
            return "high", "Élevé"
        else:
            return "very_high", "Très élevé"


def is_valid_product_data(data: dict) -> tuple[bool, Optional[str]]:
    """Vérifie si les données produit sont valides"""
    required = ["asin", "title", "price"]
    
    for field in required:
        if field not in data or data[field] is None or data[field] == "":
            return False, f"Champ requis manquant: {field}"
    
    if isinstance(data.get("price"), (int, float)):
        if data["price"] < 0:
            return False, "Prix ne peut pas être négatif"
    
    if data.get("rating") is not None:
        if isinstance(data["rating"], (int, float)):
            if data["rating"] < 0 or data["rating"] > 5:
                return False, "Rating doit être entre 0 et 5"
    
    return True, None


def calculate_percent_change(old_value: float, new_value: float) -> float:
    """Calcule le changement en pourcentage"""
    if old_value == 0:
        return 0.0
    return ((new_value - old_value) / old_value) * 100


def calculate_confidence(factors: dict) -> float:
    """Calcule un score de confiance entre 0 et 1"""
    confidence = 1.0
    
    if factors.get("review_count", 0) < 10:
        confidence *= 0.5
    elif factors.get("review_count", 0) < 50:
        confidence *= 0.7
    
    if factors.get("rating", 5.0) < 3.0:
        confidence *= 0.8
    
    if factors.get("rank", 0) > 5000:
        confidence *= 0.6
    
    return round(min(max(confidence, 0.0), 1.0), 2)


def fuzzy_match_score(str1: str, str2: str) -> float:
    """Calcule score de similarité entre 2 chaînes (0-1)"""
    str1 = str1.lower().strip()
    str2 = str2.lower().strip()
    
    if str1 == str2:
        return 1.0
    
    max_len = max(len(str1), len(str2))
    if max_len == 0:
        return 0.0
    
    matches = sum(1 for a, b in zip(str1, str2) if a == b)
    return matches / max_len


def find_best_category_match(category_name: str, available_categories: list) -> tuple[Optional[str], float]:
    """Trouve la meilleure correspondance de catégorie"""
    if not available_categories:
        return None, 0.0
    
    best_match = None
    best_score = 0.0
    
    for cat in available_categories:
        score = fuzzy_match_score(category_name, cat)
        if score > best_score:
            best_score = score
            best_match = cat
    
    return best_match, best_score
