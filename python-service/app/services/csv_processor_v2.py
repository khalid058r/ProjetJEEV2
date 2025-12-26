import pandas as pd
import logging
import time
from pathlib import Path
from typing import Dict, List, Tuple, Any, Optional
from datetime import datetime
import traceback

from app.models.schemas import ErrorCode
from app.utils.helpers import (
    clean_string, clean_price, clean_rating, clean_integer,
    clean_asin, clean_url, classify_rank, classify_price,
    find_best_category_match
)

logger = logging.getLogger(__name__)


class ValidationError:
    """Erreur de validation structurée"""
    def __init__(self, line: int, field: str, code: str, message: str, 
                 original: str = None, suggested: str = None, severity: str = "ERROR"):
        self.line = line
        self.field = field
        self.code = code
        self.message = message
        self.original = original
        self.suggested = suggested
        self.severity = severity  # ERROR, WARNING, INFO
    
    def to_dict(self):
        return {
            "line": self.line,
            "field": self.field,
            "code": self.code,
            "message": self.message,
            "original_value": self.original,
            "suggested_value": self.suggested,
            "severity": self.severity
        }


class ProcessedProduct:
    """Produit traité avec statut"""
    def __init__(self, line_num: int, data: Dict, errors: List[ValidationError], status: str):
        self.line_num = line_num
        self.data = data
        self.errors = errors
        self.status = status  # VALID, WARNING, REJECTED
    
    def to_dict(self):
        return {
            "line": self.line_num,
            "data": self.data,
            "errors": [e.to_dict() for e in self.errors],
            "status": self.status
        }


class EnhancedCsvProcessor:
    """
    Service ETL production-ready
    
    Features:
    - Traitement par chunks (gros fichiers)
    - Mapping colonnes flexible
    - Logging complet
    - Gestion erreurs robuste
    - Validation stricte
    - Pas de création catégories (Java le fait)
    """
    
    # Mapping colonnes possibles (case-insensitive)
    COLUMN_MAPPING = {
        "asin": ["asin", "product_id", "sku"],
        "title": ["title", "name", "product_name", "product_title"],
        "price": ["price", "prix", "cost"],
        "rating": ["rating", "note", "review_rating", "stars"],
        "review_count": ["review_count", "reviews", "review_number", "nb_reviews", "reviewCount"],
        "rank": ["rank", "ranking", "best_seller_rank", "sales_rank"],
        "stock": ["stock", "inventory", "quantity", "qty"],
        "category": ["category", "categorie", "cat", "product_category"],
        "image_url": ["image_url", "imgUrl", "image", "img", "picture_url"]
    }
    
    def __init__(self, chunk_size: int = 1000):
        self.chunk_size = chunk_size
        self.available_categories = []
        self.valid_products = []
        self.warning_products = []
        self.rejected_products = []
        self.stats = {
            "total_lines": 0,
            "processed": 0,
            "valid": 0,
            "warnings": 0,
            "rejected": 0,
            "errors_by_type": {},
            "processing_time": 0
        }
    
    def set_available_categories(self, categories: List[str]):
        """Définit catégories existantes en Java"""
        self.available_categories = [c.strip().lower() for c in categories]
        logger.info(f"📋 {len(categories)} catégories chargées depuis Java")
    
    def process_csv(self, csv_path: str, auto_fix: bool = True, 
                    strict_mode: bool = False) -> Dict[str, Any]:
        """
        Traite un CSV avec gestion robuste
        
        Args:
            csv_path: Chemin fichier
            auto_fix: Corriger erreurs simples
            strict_mode: Rejeter si moindre erreur
        """
        start_time = time.time()
        
        logger.info("=" * 70)
        logger.info(f"🚀 DÉBUT TRAITEMENT CSV: {csv_path}")
        logger.info("=" * 70)
        
        # Reset état
        self.valid_products = []
        self.warning_products = []
        self.rejected_products = []
        self.stats = {k: 0 for k in self.stats}
        
        try:
            # Validation fichier
            self._validate_file(csv_path)
            
            # Détection encoding
            encoding = self._detect_encoding(csv_path)
            logger.info(f"📝 Encoding détecté: {encoding}")
            
            # Lecture et mapping colonnes
            df = self._read_csv_with_mapping(csv_path, encoding)
            
            total_lines = len(df)
            self.stats["total_lines"] = total_lines
            logger.info(f"📊 Total lignes à traiter: {total_lines}")
            
            # Traitement par chunks
            for chunk_start in range(0, total_lines, self.chunk_size):
                chunk_end = min(chunk_start + self.chunk_size, total_lines)
                chunk = df.iloc[chunk_start:chunk_end]
                
                logger.info(f"⚙️  Traitement chunk {chunk_start}-{chunk_end}...")
                
                for idx, row in chunk.iterrows():
                    line_num = int(idx) + 2  # +2 pour header et 1-indexed
                    
                    processed = self._process_line(
                        line_num, 
                        row.to_dict(),
                        auto_fix,
                        strict_mode
                    )
                    
                    self.stats["processed"] += 1
                    
                    # Classement
                    if processed.status == "VALID":
                        self.valid_products.append(processed)
                        self.stats["valid"] += 1
                    elif processed.status == "WARNING":
                        self.warning_products.append(processed)
                        self.stats["warnings"] += 1
                    else:  # REJECTED
                        self.rejected_products.append(processed)
                        self.stats["rejected"] += 1
                    
                    # Compte erreurs par type
                    for error in processed.errors:
                        code = error.code
                        self.stats["errors_by_type"][code] = \
                            self.stats["errors_by_type"].get(code, 0) + 1
            
            # Sauvegarde résultats
            valid_path = self._save_valid_csv(csv_path)
            rejected_path = self._save_rejected_csv(csv_path)
            
            processing_time = time.time() - start_time
            self.stats["processing_time"] = round(processing_time, 2)
            
            # Log final
            logger.info("=" * 70)
            logger.info("✅ TRAITEMENT TERMINÉ")
            logger.info(f"   Temps: {processing_time:.2f}s")
            logger.info(f"   ✅ Valides: {self.stats['valid']}")
            logger.info(f"   ⚠️  Warnings: {self.stats['warnings']}")
            logger.info(f"   ❌ Rejetées: {self.stats['rejected']}")
            logger.info("=" * 70)
            
            return {
                "success": True,
                "total_lines": total_lines,
                "valid_count": self.stats["valid"],
                "warning_count": self.stats["warnings"],
                "rejected_count": self.stats["rejected"],
                "valid_csv_path": valid_path,
                "rejected_csv_path": rejected_path,
                "processing_time_seconds": processing_time,
                "errors_breakdown": self.stats["errors_by_type"],
                "message": f"Traitement terminé: {self.stats['valid']} valides, {self.stats['rejected']} rejetées"
            }
        
        except Exception as e:
            logger.error(f"❌ ERREUR CRITIQUE: {e}")
            logger.error(traceback.format_exc())
            
            return {
                "success": False,
                "error": str(e),
                "error_type": type(e).__name__,
                "traceback": traceback.format_exc(),
                "message": f"Échec traitement: {str(e)}"
            }
    
    def _validate_file(self, csv_path: str):
        """Valide le fichier avant traitement"""
        path = Path(csv_path)
        
        if not path.exists():
            raise FileNotFoundError(f"Fichier introuvable: {csv_path}")
        
        if path.suffix.lower() not in ['.csv', '.txt']:
            raise ValueError(f"Format non supporté: {path.suffix}")
        
        # Taille max 100MB
        size_mb = path.stat().st_size / (1024 * 1024)
        if size_mb > 100:
            raise ValueError(f"Fichier trop gros: {size_mb:.1f}MB (max 100MB)")
        
        logger.info(f"✅ Validation fichier OK ({size_mb:.2f}MB)")
    
    def _detect_encoding(self, csv_path: str) -> str:
        """Détecte encoding du fichier"""
        encodings = ['utf-8', 'latin-1', 'iso-8859-1', 'cp1252']
        
        for enc in encodings:
            try:
                with open(csv_path, 'r', encoding=enc) as f:
                    f.read(1024)  # Lit début
                return enc
            except UnicodeDecodeError:
                continue
        
        return 'utf-8'  # Défaut
    
    def _read_csv_with_mapping(self, csv_path: str, encoding: str) -> pd.DataFrame:
        """Lit CSV et mappe colonnes automatiquement"""
        
        # Lecture brute
        df = pd.read_csv(csv_path, encoding=encoding, dtype=str)
        
        logger.info(f"📋 Colonnes CSV: {list(df.columns)}")
        
        # Mapping automatique
        column_map = {}
        for standard_name, possible_names in self.COLUMN_MAPPING.items():
            for col in df.columns:
                if col.lower().strip() in possible_names:
                    column_map[col] = standard_name
                    break
        
        if column_map:
            df = df.rename(columns=column_map)
            logger.info(f"🔄 Colonnes mappées: {column_map}")
        
        # Vérifie colonnes obligatoires
        required = ["asin", "title"]
        missing = [col for col in required if col not in df.columns]
        
        if missing:
            raise ValueError(f"Colonnes obligatoires manquantes: {missing}")
        
        return df
    
    def _process_line(self, line_num: int, row_data: Dict, 
                     auto_fix: bool, strict_mode: bool) -> ProcessedProduct:
        """Traite une ligne avec validation complète"""
        
        errors = []
        cleaned = {}
        
        # === ASIN (OBLIGATOIRE) ===
        asin = clean_asin(row_data.get("asin"))
        if not asin:
            errors.append(ValidationError(
                line_num, "asin", ErrorCode.MISSING_REQUIRED.value,
                "ASIN manquant ou invalide (10 caractères alphanumériques requis)",
                row_data.get("asin"), None, "ERROR"
            ))
            return ProcessedProduct(line_num, row_data, errors, "REJECTED")
        
        cleaned["asin"] = asin
        
        # === TITLE (OBLIGATOIRE) ===
        title = clean_string(row_data.get("title"))
        if not title or len(title) < 3:
            errors.append(ValidationError(
                line_num, "title", ErrorCode.MISSING_REQUIRED.value,
                "Titre manquant ou trop court",
                row_data.get("title"), None, "ERROR"
            ))
            return ProcessedProduct(line_num, row_data, errors, "REJECTED")
        
        cleaned["title"] = title
        
        # === PRICE (OBLIGATOIRE) ===
        price = clean_price(row_data.get("price"))
        if price is None:
            if auto_fix:
                price = 0.0
                errors.append(ValidationError(
                    line_num, "price", ErrorCode.INVALID_PRICE.value,
                    "Prix invalide, mis à 0.00",
                    row_data.get("price"), "0.00", "WARNING"
                ))
            else:
                errors.append(ValidationError(
                    line_num, "price", ErrorCode.INVALID_PRICE.value,
                    "Prix invalide ou manquant",
                    row_data.get("price"), None, "ERROR"
                ))
                return ProcessedProduct(line_num, row_data, errors, "REJECTED")
        
        cleaned["price"] = price
        
        # === RATING (OPTIONNEL) ===
        rating = clean_rating(row_data.get("rating"))
        cleaned["rating"] = rating if rating else 0.0
        
        # === REVIEW COUNT (OPTIONNEL) ===
        reviews = clean_integer(row_data.get("review_count"))
        cleaned["review_count"] = reviews if reviews and reviews > 0 else 0
        
        # === RANK (OPTIONNEL MAIS IMPORTANT) ===
        rank = clean_integer(row_data.get("rank"))
        if rank and rank > 0:
            cleaned["rank"] = rank
            rank_cat, rank_label = classify_rank(rank)
            cleaned["rank_category"] = rank_cat
            cleaned["rank_label"] = rank_label
        else:
            cleaned["rank"] = 9999
            cleaned["rank_category"] = 1
            cleaned["rank_label"] = "Non classé"
            
            if row_data.get("rank"):
                errors.append(ValidationError(
                    line_num, "rank", ErrorCode.INVALID_FORMAT.value,
                    "Rank invalide, mis à 9999 par défaut",
                    row_data.get("rank"), "9999", "WARNING"
                ))
        
        # === STOCK (OPTIONNEL) ===
        stock = clean_integer(row_data.get("stock"))
        cleaned["stock"] = stock if stock and stock >= 0 else 50
        
        # === CATEGORY (IMPORTANT) ===
        category = clean_string(row_data.get("category"))
        if not category:
            errors.append(ValidationError(
                line_num, "category", ErrorCode.MISSING_REQUIRED.value,
                "Catégorie manquante (requis pour classification)",
                None, "À définir", "ERROR"
            ))
            return ProcessedProduct(line_num, row_data, errors, "REJECTED")
        
        # Matching avec catégories Java
        if self.available_categories:
            category_lower = category.lower().strip()
            
            # Exact match
            if category_lower in self.available_categories:
                cleaned["category"] = category
            else:
                # Fuzzy match
                best_match, score = find_best_category_match(category, self.available_categories)
                
                if score >= 0.85:  # 85%+ = auto-correct
                    cleaned["category"] = best_match
                    errors.append(ValidationError(
                        line_num, "category", ErrorCode.UNKNOWN_CATEGORY.value,
                        f"Catégorie corrigée: '{category}' → '{best_match}'",
                        category, best_match, "WARNING"
                    ))
                else:
                    # Catégorie inconnue → WARNING (Java créera)
                    cleaned["category"] = category
                    errors.append(ValidationError(
                        line_num, "category", ErrorCode.UNKNOWN_CATEGORY.value,
                        f"Catégorie '{category}' inconnue, sera créée par le backend",
                        category, best_match if score > 0.5 else "Vérifier manuellement", 
                        "WARNING"
                    ))
        else:
            # Pas de catégories de référence
            cleaned["category"] = category
        
        # === IMAGE URL (OPTIONNEL) ===
        img_url = clean_url(row_data.get("image_url"))
        if img_url:
            cleaned["image_url"] = img_url
        else:
            cleaned["image_url"] = "placeholder.jpg"
            if row_data.get("image_url"):
                errors.append(ValidationError(
                    line_num, "image_url", ErrorCode.IMAGE_NOT_FOUND.value,
                    "URL image invalide, placeholder utilisé",
                    row_data.get("image_url"), "placeholder.jpg", "WARNING"
                ))
        
        # === CLASSIFICATION PRIX ===
        price_bucket, price_label = classify_price(cleaned["price"])
        cleaned["price_bucket"] = price_bucket
        cleaned["price_label"] = price_label
        
        # === DÉTERMINATION STATUT ===
        has_errors = any(e.severity == "ERROR" for e in errors)
        has_warnings = any(e.severity == "WARNING" for e in errors)
        
        if has_errors or (strict_mode and has_warnings):
            status = "REJECTED"
        elif has_warnings:
            status = "WARNING"
        else:
            status = "VALID"
        
        return ProcessedProduct(line_num, cleaned, errors, status)
    
    def _save_valid_csv(self, original_path: str) -> Optional[str]:
        """Sauvegarde CSV valides + warnings"""
        all_valid = self.valid_products + self.warning_products
        
        if not all_valid:
            return None
        
        try:
            data = [p.data for p in all_valid]
            df = pd.DataFrame(data)
            
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = Path(original_path).stem
            output_path = f"data/processed/{filename}_VALID_{timestamp}.csv"
            
            Path("data/processed").mkdir(parents=True, exist_ok=True)
            df.to_csv(output_path, index=False, encoding='utf-8')
            
            logger.info(f"✅ CSV valide sauvegardé: {output_path} ({len(data)} lignes)")
            return output_path
        
        except Exception as e:
            logger.error(f"❌ Erreur sauvegarde CSV valide: {e}")
            return None
    
    def _save_rejected_csv(self, original_path: str) -> Optional[str]:
        """Sauvegarde CSV rejetés avec diagnostics"""
        if not self.rejected_products:
            return None
        
        try:
            rows = []
            for product in self.rejected_products:
                row = product.data.copy()
                
                # Colonnes diagnostic
                row["_line_number"] = product.line_num
                row["_status"] = product.status
                row["_error_count"] = len(product.errors)
                
                # Compile erreurs
                errors_str = " | ".join([
                    f"{e.field}: {e.message}" for e in product.errors
                ])
                row["_errors"] = errors_str
                
                # Suggestions
                suggestions = [
                    f"{e.field}={e.suggested}" 
                    for e in product.errors 
                    if e.suggested
                ]
                row["_suggestions"] = " | ".join(suggestions) if suggestions else "Corriger manuellement"
                
                rows.append(row)
            
            df = pd.DataFrame(rows)
            
            # Réorganise colonnes (diagnostics à la fin)
            diag_cols = ['_line_number', '_status', '_error_count', '_errors', '_suggestions']
            data_cols = [c for c in df.columns if c not in diag_cols]
            df = df[data_cols + diag_cols]
            
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = Path(original_path).stem
            output_path = f"data/processed/{filename}_REJECTED_{timestamp}.csv"
            
            Path("data/processed").mkdir(parents=True, exist_ok=True)
            df.to_csv(output_path, index=False, encoding='utf-8')
            
            logger.info(f"⚠️ CSV rejeté sauvegardé: {output_path} ({len(rows)} lignes)")
            return output_path
        
        except Exception as e:
            logger.error(f"❌ Erreur sauvegarde CSV rejeté: {e}")
            return None
