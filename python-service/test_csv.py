
import pandas as pd
import logging
import time
from pathlib import Path
from typing import Dict, List, Tuple, Any
from datetime import datetime

from app.models.schemas import ErrorCode
from app.utils.helpers import (
    clean_string, clean_price, clean_rating, clean_integer,
    clean_asin, clean_url, classify_rank, classify_price,
    is_valid_product_data, find_best_category_match
)

logger = logging.getLogger(__name__)


class CsvIssue:
    """Représente un problème détecté dans une ligne CSV"""
    def __init__(self, line_number: int, field: str, error_code: str, 
                 error_message: str, original_value: str = None, 
                 suggested_value: str = None, auto_fixed: bool = False):
        self.line_number = line_number
        self.field = field
        self.error_code = error_code
        self.error_message = error_message
        self.original_value = original_value
        self.suggested_value = suggested_value
        self.auto_fixed = auto_fixed
    
    def to_dict(self):
        return {
            "line_number": self.line_number,
            "field": self.field,
            "error_code": self.error_code,
            "error_message": self.error_message,
            "original_value": self.original_value,
            "suggested_value": self.suggested_value,
            "auto_fixed": self.auto_fixed
        }


class ProcessedLine:
    """Représente une ligne traitée avec son statut"""
    def __init__(self, line_number: int, data: Dict[str, Any], 
                 issues: List[CsvIssue] = None, status: str = "valid"):
        self.line_number = line_number
        self.data = data
        self.issues = issues or []
        self.status = status
    
    def to_dict(self):
        return {
            "line_number": self.line_number,
            "data": self.data,
            "issues": [issue.to_dict() for issue in self.issues],
            "status": self.status
        }


class CsvProcessorService:
    """Service de traitement et nettoyage de fichiers CSV"""
    
    def __init__(self):
        self.valid_lines = []
        self.needs_review_lines = []
        self.rejected_lines = []
        self.available_categories = []
    
    def set_available_categories(self, categories: List[str]):
        """Définit les catégories disponibles pour le matching"""
        self.available_categories = categories
        logger.info(f"📋 {len(categories)} catégories chargées")
    
    def process_csv(self, csv_path: str, auto_fix: bool = True, 
                    create_categories: bool = True) -> Dict[str, Any]:
        """Traite un fichier CSV complet"""
        start_time = time.time()
        
        try:
            # Vérifier que le fichier existe
            if not Path(csv_path).exists():
                raise FileNotFoundError(f"Fichier non trouvé: {csv_path}")
            
            # Lecture CSV
            logger.info(f"📂 Lecture CSV: {csv_path}")
            
            try:
                df = pd.read_csv(csv_path, encoding="utf-8")
            except UnicodeDecodeError:
                logger.warning("Tentative avec encoding latin-1")
                df = pd.read_csv(csv_path, encoding="latin-1")
            
            total_lines = len(df)
            logger.info(f"📊 Total lignes: {total_lines}")
            
            # Réinitialise listes
            self.valid_lines = []
            self.needs_review_lines = []
            self.rejected_lines = []
            
            # Traite chaque ligne - CORRECTION ICI
            for position, (idx, row) in enumerate(df.iterrows()):
                line_number = position + 2  # +2 car 1-indexed et header
                
                processed = self._process_line(
                    line_number, 
                    row.to_dict(), 
                    auto_fix, 
                    create_categories
                )
                
                # Classe selon statut
                if processed.status == "valid":
                    self.valid_lines.append(processed)
                elif processed.status == "needs_review":
                    self.needs_review_lines.append(processed)
                else:
                    self.rejected_lines.append(processed)
            
            # Sauvegarde CSV traités
            valid_path = self._save_valid_csv(csv_path)
            rejected_path = self._save_rejected_csv(csv_path)
            
            processing_time = time.time() - start_time
            
            # Statistiques
            summary = self._generate_summary()
            
            logger.info(f"✅ Traitement terminé en {processing_time:.2f}s")
            logger.info(f"   Valides: {len(self.valid_lines)}")
            logger.info(f"   À réviser: {len(self.needs_review_lines)}")
            logger.info(f"   Rejetées: {len(self.rejected_lines)}")
            
            return {
                "total_lines": total_lines,
                "valid_count": len(self.valid_lines),
                "needs_review_count": len(self.needs_review_lines),
                "rejected_count": len(self.rejected_lines),
                "valid_csv_path": valid_path,
                "rejected_csv_path": rejected_path,
                "processing_time_seconds": round(processing_time, 2),
                "summary": summary
            }
        
        except Exception as e:
            logger.error(f"❌ Erreur traitement CSV: {e}", exc_info=True)
            raise
    
    def _process_line(self, line_number: int, row_data: Dict[str, Any],
                     auto_fix: bool, create_categories: bool) -> ProcessedLine:
        """Traite une ligne individuelle"""
        
        issues = []
        cleaned_data = {}
        
        # ========== ASIN ==========
        asin = clean_asin(row_data.get("asin"))
        if not asin:
            issues.append(CsvIssue(
                line_number=line_number,
                field="asin",
                error_code=ErrorCode.MISSING_REQUIRED.value,
                error_message="ASIN manquant ou invalide",
                original_value=str(row_data.get("asin", "")),
                auto_fixed=False
            ))
            return ProcessedLine(line_number, row_data, issues, "rejected")
        
        cleaned_data["asin"] = asin
        
        # ========== TITLE ==========
        title = clean_string(row_data.get("title"))
        if not title:
            issues.append(CsvIssue(
                line_number=line_number,
                field="title",
                error_code=ErrorCode.MISSING_REQUIRED.value,
                error_message="Titre manquant",
                auto_fixed=False
            ))
            return ProcessedLine(line_number, row_data, issues, "rejected")
        
        cleaned_data["title"] = title
        
        # ========== PRICE ==========
        price = clean_price(row_data.get("price"))
        if price is None:
            if auto_fix:
                price = 0.0
                issues.append(CsvIssue(
                    line_number=line_number,
                    field="price",
                    error_code=ErrorCode.INVALID_PRICE.value,
                    error_message="Prix invalide, mis à 0",
                    original_value=str(row_data.get("price")),
                    suggested_value="0.0",
                    auto_fixed=True
                ))
            else:
                issues.append(CsvIssue(
                    line_number=line_number,
                    field="price",
                    error_code=ErrorCode.INVALID_PRICE.value,
                    error_message="Prix invalide",
                    original_value=str(row_data.get("price")),
                    auto_fixed=False
                ))
                return ProcessedLine(line_number, row_data, issues, "rejected")
        
        cleaned_data["price"] = price
        
        # ========== RATING ==========
        rating = clean_rating(row_data.get("rating"))
        cleaned_data["rating"] = rating
        
        # ========== REVIEWS ==========
        review_count = clean_integer(row_data.get("reviews"))
        cleaned_data["review_count"] = review_count if review_count else 0
        
        # ========== RANK ==========
        rank = clean_integer(row_data.get("rank"))
        if rank and rank > 0:
            cleaned_data["rank"] = rank
            rank_cat, rank_label = classify_rank(rank)
            cleaned_data["rank_category"] = rank_cat
            cleaned_data["rank_label"] = rank_label
        else:
            cleaned_data["rank"] = 9999 if auto_fix else None
            cleaned_data["rank_category"] = 1
            cleaned_data["rank_label"] = "Faible"
        
        # ========== STOCK ==========
        stock = clean_integer(row_data.get("stock"))
        cleaned_data["stock"] = stock if stock and stock >= 0 else 50
        
        # ========== CATEGORY ==========
        category = clean_string(row_data.get("category"))
        if not category:
            if auto_fix:
                cleaned_data["category"] = "Uncategorized"
                issues.append(CsvIssue(
                    line_number=line_number,
                    field="category",
                    error_code=ErrorCode.UNKNOWN_CATEGORY.value,
                    error_message="Catégorie manquante",
                    suggested_value="Uncategorized",
                    auto_fixed=True
                ))
            else:
                issues.append(CsvIssue(
                    line_number=line_number,
                    field="category",
                    error_code=ErrorCode.MISSING_REQUIRED.value,
                    error_message="Catégorie requise",
                    auto_fixed=False
                ))
                return ProcessedLine(line_number, row_data, issues, "rejected")
        else:
            if self.available_categories:
                best_match, score = find_best_category_match(category, self.available_categories)
                
                if score >= 0.85:
                    cleaned_data["category"] = best_match
                    if category != best_match:
                        issues.append(CsvIssue(
                            line_number=line_number,
                            field="category",
                            error_code=ErrorCode.UNKNOWN_CATEGORY.value,
                            error_message=f"Catégorie corrigée: '{category}' → '{best_match}'",
                            original_value=category,
                            suggested_value=best_match,
                            auto_fixed=True
                        ))
                else:
                    cleaned_data["category"] = category
                    if create_categories and score < 0.70:
                        issues.append(CsvIssue(
                            line_number=line_number,
                            field="category",
                            error_code=ErrorCode.UNKNOWN_CATEGORY.value,
                            error_message=f"Nouvelle catégorie: '{category}'",
                            original_value=category,
                            auto_fixed=True
                        ))
            else:
                cleaned_data["category"] = category
        
        # ========== IMAGE ==========
        img_url = clean_url(row_data.get("imgUrl"))
        if img_url:
            cleaned_data["image_url"] = img_url
        else:
            if auto_fix:
                cleaned_data["image_url"] = "placeholder.jpg"
                if row_data.get("imgUrl"):
                    issues.append(CsvIssue(
                        line_number=line_number,
                        field="imgUrl",
                        error_code=ErrorCode.IMAGE_NOT_FOUND.value,
                        error_message="URL invalide, placeholder utilisé",
                        auto_fixed=True
                    ))
            else:
                cleaned_data["image_url"] = None
        
        # Classification prix
        price_bucket, price_label = classify_price(cleaned_data["price"])
        cleaned_data["price_bucket"] = price_bucket
        cleaned_data["price_label"] = price_label
        
        # Détermine statut
        if not issues:
            status = "valid"
        elif any(not issue.auto_fixed for issue in issues):
            status = "needs_review"
        else:
            status = "valid"
        
        return ProcessedLine(line_number, cleaned_data, issues, status)
    
    def _save_valid_csv(self, original_path: str) -> str:
        """Sauvegarde CSV valides"""
        if not self.valid_lines:
            return None
        
        try:
            data = [line.data for line in self.valid_lines]
            df = pd.DataFrame(data)
            
            original = Path(original_path)
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_path = f"data/processed/{original.stem}_VALID_{timestamp}.csv"
            
            Path("data/processed").mkdir(parents=True, exist_ok=True)
            df.to_csv(output_path, index=False, encoding="utf-8")
            
            logger.info(f"✅ CSV valide: {output_path}")
            return output_path
        
        except Exception as e:
            logger.error(f"❌ Erreur sauvegarde: {e}")
            return None
    
    def _save_rejected_csv(self, original_path: str) -> str:
        """Sauvegarde CSV rejetés"""
        all_rejected = self.needs_review_lines + self.rejected_lines
        
        if not all_rejected:
            return None
        
        try:
            rows = []
            for line in all_rejected:
                row = line.data.copy()
                row["_line_number"] = line.line_number
                row["_status"] = line.status
                row["_error_count"] = len(line.issues)
                
                errors = [f"{i.field}: {i.error_message}" for i in line.issues]
                row["_errors"] = " | ".join(errors)
                
                rows.append(row)
            
            df = pd.DataFrame(rows)
            
            original = Path(original_path)
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_path = f"data/processed/{original.stem}_REJECTED_{timestamp}.csv"
            
            Path("data/processed").mkdir(parents=True, exist_ok=True)
            df.to_csv(output_path, index=False, encoding="utf-8")
            
            logger.info(f"⚠️ CSV rejeté: {output_path}")
            return output_path
        
        except Exception as e:
            logger.error(f"❌ Erreur sauvegarde: {e}")
            return None
    
    def _generate_summary(self) -> Dict[str, Any]:
        """Génère résumé"""
        error_counts = {}
        for line in self.needs_review_lines + self.rejected_lines:
            for issue in line.issues:
                code = issue.error_code
                error_counts[code] = error_counts.get(code, 0) + 1
        
        auto_fixed = sum(
            1 for line in self.valid_lines + self.needs_review_lines
            for issue in line.issues if issue.auto_fixed
        )
        
        return {
            "error_breakdown": error_counts,
            "auto_fixed_count": auto_fixed,
            "timestamp": datetime.now().isoformat()
        }
