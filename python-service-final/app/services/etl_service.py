"""
Service ETL - Extract, Transform, Load
Traitement et validation des fichiers CSV de produits
"""
import logging
import re
import time
from typing import List, Dict, Any, Tuple, Optional
from pathlib import Path
from datetime import datetime
import chardet

from app.config import settings
from app.models.schemas import (
    ProductResponse, ProductClassification, ETLProcessingResult,
    ETLValidationError, RankCategory, PriceBucket, StockStatus
)

logger = logging.getLogger(__name__)

# Import pandas
try:
    import pandas as pd
    import numpy as np
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False
    logger.warning("Pandas non disponible")


class ETLService:
    """Service de traitement ETL pour les fichiers CSV"""
    
    # Mapping des colonnes
    COLUMN_MAPPING = {
        'asin': ['asin', 'product_id', 'sku', 'id', 'product_asin'],
        'title': ['title', 'name', 'product_name', 'product_title', 'productname'],
        'price': ['price', 'prix', 'cost', 'product_price', 'sale_price'],
        'rating': ['rating', 'stars', 'note', 'score', 'average_rating'],
        'review_count': ['reviews', 'review_count', 'reviewcount', 'num_reviews', 'review', 'reviewscount'],
        'rank': ['rank', 'sales_rank', 'bestseller_rank', 'classement', 'position'],
        'stock': ['stock', 'quantity', 'qty', 'inventory', 'disponible'],
        'category': ['category', 'categorie', 'cat', 'product_category', 'categoryname'],
        'image_url': ['image_url', 'imageurl', 'imgurl', 'image', 'img', 'picture']
    }
    
    def __init__(self):
        self.errors: List[ETLValidationError] = []
        self.warnings: List[str] = []
    
    def process_csv(
        self,
        file_path: str,
        validate: bool = True,
        clean: bool = True
    ) -> ETLProcessingResult:
        """
        Traite un fichier CSV
        
        Args:
            file_path: Chemin du fichier
            validate: Valider les données
            clean: Nettoyer les données
        """
        start_time = time.time()
        self.errors = []
        self.warnings = []
        
        if not PANDAS_AVAILABLE:
            return ETLProcessingResult(
                success=False,
                total_rows=0, valid_rows=0, invalid_rows=0,
                errors=[ETLValidationError(row=0, column="system", value=None, 
                       error="Pandas non disponible", severity="critical")],
                processing_time_ms=0
            )
        
        try:
            # Détecte l'encodage
            encoding = self._detect_encoding(file_path)
            logger.info(f"📁 Encodage détecté: {encoding}")
            
            # Charge le CSV
            df = pd.read_csv(file_path, encoding=encoding, dtype=str)
            total_rows = len(df)
            logger.info(f"📊 {total_rows} lignes chargées")
            
            # Normalise les colonnes
            df = self._normalize_columns(df)
            
            # Nettoie les données
            if clean:
                df = self._clean_data(df)
            
            # Valide les données
            if validate:
                df = self._validate_data(df)
            
            # Convertit en produits
            products, classifications = self._convert_to_products(df)
            
            valid_rows = len(products)
            invalid_rows = total_rows - valid_rows
            
            # Génère le résumé
            summary = self._generate_summary(products, classifications)
            
            processing_time = (time.time() - start_time) * 1000
            
            return ETLProcessingResult(
                success=True,
                total_rows=total_rows,
                valid_rows=valid_rows,
                invalid_rows=invalid_rows,
                products=products,
                classifications=classifications,
                errors=self.errors,
                warnings=self.warnings,
                processing_time_ms=processing_time,
                summary=summary
            )
        
        except Exception as e:
            logger.error(f"Erreur traitement CSV: {e}", exc_info=True)
            return ETLProcessingResult(
                success=False,
                total_rows=0, valid_rows=0, invalid_rows=0,
                errors=[ETLValidationError(row=0, column="file", value=str(file_path),
                       error=str(e), severity="critical")],
                processing_time_ms=(time.time() - start_time) * 1000
            )
    
    def _detect_encoding(self, file_path: str) -> str:
        """Détecte l'encodage du fichier"""
        with open(file_path, 'rb') as f:
            result = chardet.detect(f.read(10000))
            return result.get('encoding', 'utf-8') or 'utf-8'
    
    def _normalize_columns(self, df: pd.DataFrame) -> pd.DataFrame:
        """Normalise les noms de colonnes"""
        # Minuscules et supprime espaces
        df.columns = df.columns.str.lower().str.strip().str.replace(' ', '_')
        
        # Mappe vers les noms standards
        column_rename = {}
        for standard_name, variants in self.COLUMN_MAPPING.items():
            for col in df.columns:
                if col in variants or any(v in col for v in variants):
                    column_rename[col] = standard_name
                    break
        
        df = df.rename(columns=column_rename)
        
        # Log les colonnes trouvées
        found = [c for c in df.columns if c in self.COLUMN_MAPPING.keys()]
        logger.info(f"📋 Colonnes mappées: {found}")
        
        return df
    
    def _clean_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Nettoie les données"""
        # ASIN
        if 'asin' in df.columns:
            df['asin'] = df['asin'].str.strip().str.upper()
            # Génère un ASIN si manquant
            mask = df['asin'].isna() | (df['asin'] == '')
            if mask.any():
                import hashlib
                for idx in df[mask].index:
                    title = str(df.loc[idx, 'title']) if 'title' in df.columns else str(idx)
                    hash_val = hashlib.md5(title.encode()).hexdigest()[:10].upper()
                    df.loc[idx, 'asin'] = hash_val
                    self.warnings.append(f"Ligne {idx+2}: ASIN généré {hash_val}")
        
        # Title
        if 'title' in df.columns:
            df['title'] = df['title'].str.strip()
            df['title'] = df['title'].fillna('Produit sans titre')
        
        # Price
        if 'price' in df.columns:
            df['price'] = df['price'].apply(self._clean_price)
        
        # Rating
        if 'rating' in df.columns:
            df['rating'] = pd.to_numeric(df['rating'], errors='coerce')
            df['rating'] = df['rating'].clip(0, 5)
        
        # Review count
        if 'review_count' in df.columns:
            df['review_count'] = pd.to_numeric(df['review_count'], errors='coerce').fillna(0).astype(int)
        
        # Rank
        if 'rank' in df.columns:
            df['rank'] = df['rank'].apply(self._clean_rank)
        
        # Stock
        if 'stock' in df.columns:
            df['stock'] = pd.to_numeric(df['stock'], errors='coerce').fillna(0).astype(int)
            df['stock'] = df['stock'].clip(lower=0)
        
        # Image URL
        if 'image_url' in df.columns:
            df['image_url'] = df['image_url'].apply(self._clean_url)
        
        return df
    
    def _clean_price(self, value) -> float:
        """Nettoie un prix"""
        if pd.isna(value):
            return 0.0
        
        s = str(value).strip()
        s = re.sub(r'[€$£¥₹]', '', s)
        s = re.sub(r'\s+', '', s)
        
        # Gère les formats européens (1.234,56)
        if ',' in s and '.' in s:
            if s.index(',') > s.index('.'):
                s = s.replace('.', '').replace(',', '.')
            else:
                s = s.replace(',', '')
        elif ',' in s:
            s = s.replace(',', '.')
        
        try:
            return max(0.0, float(s))
        except:
            return 0.0
    
    def _clean_rank(self, value) -> Optional[int]:
        """Nettoie un rang"""
        if pd.isna(value):
            return None
        
        s = str(value).strip()
        s = re.sub(r'[#,.\s]', '', s)
        s = re.sub(r'[^\d]', '', s)
        
        try:
            rank = int(s)
            return rank if rank > 0 else None
        except:
            return None
    
    def _clean_url(self, value) -> str:
        """Nettoie une URL"""
        if pd.isna(value):
            return ""
        
        url = str(value).strip()
        if url and not url.startswith(('http://', 'https://')):
            if url.startswith('//'):
                url = 'https:' + url
            elif '.' in url:
                url = 'https://' + url
            else:
                return ""
        return url
    
    def _validate_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Valide les données"""
        valid_mask = pd.Series(True, index=df.index)
        
        # ASIN obligatoire et unique
        if 'asin' in df.columns:
            invalid_asin = df['asin'].isna() | (df['asin'].str.len() != 10)
            for idx in df[invalid_asin].index:
                self.errors.append(ETLValidationError(
                    row=idx + 2, column='asin',
                    value=df.loc[idx, 'asin'],
                    error='ASIN invalide (doit faire 10 caractères)',
                    severity='error'
                ))
            valid_mask &= ~invalid_asin
            
            # Doublons
            duplicates = df.duplicated(subset=['asin'], keep='first')
            for idx in df[duplicates].index:
                self.errors.append(ETLValidationError(
                    row=idx + 2, column='asin',
                    value=df.loc[idx, 'asin'],
                    error='ASIN en doublon',
                    severity='warning'
                ))
        
        # Title obligatoire
        if 'title' in df.columns:
            invalid_title = df['title'].isna() | (df['title'].str.len() < 3)
            for idx in df[invalid_title].index:
                self.errors.append(ETLValidationError(
                    row=idx + 2, column='title',
                    value=df.loc[idx, 'title'],
                    error='Titre manquant ou trop court',
                    severity='error'
                ))
            valid_mask &= ~invalid_title
        
        # Price > 0
        if 'price' in df.columns:
            invalid_price = df['price'] <= 0
            for idx in df[invalid_price].index:
                self.errors.append(ETLValidationError(
                    row=idx + 2, column='price',
                    value=df.loc[idx, 'price'],
                    error='Prix invalide (doit être > 0)',
                    severity='error'
                ))
            valid_mask &= ~invalid_price
        
        return df[valid_mask].reset_index(drop=True)
    
    def _convert_to_products(
        self, df: pd.DataFrame
    ) -> Tuple[List[ProductResponse], List[ProductClassification]]:
        """Convertit le DataFrame en produits"""
        products = []
        classifications = []
        
        for idx, row in df.iterrows():
            try:
                product = ProductResponse(
                    asin=str(row.get('asin', '')),
                    title=str(row.get('title', 'Sans titre')),
                    price=float(row.get('price', 0) or 0),
                    rating=float(row.get('rating', 0) or 0),
                    review_count=int(row.get('review_count', 0) or 0),
                    rank=int(row.get('rank')) if pd.notna(row.get('rank')) else None,
                    stock=int(row.get('stock', 0) or 0),
                    category=str(row.get('category', '')) if pd.notna(row.get('category')) else None,
                    image_url=str(row.get('image_url', '')) if pd.notna(row.get('image_url')) else None
                )
                products.append(product)
                
                # Classification
                classification = ProductClassification(
                    asin=product.asin,
                    rank_category=self.classify_rank(product.rank),
                    price_bucket=self.classify_price(product.price),
                    stock_status=self.classify_stock(product.stock)
                )
                classifications.append(classification)
            
            except Exception as e:
                self.errors.append(ETLValidationError(
                    row=idx + 2, column='conversion',
                    value=str(row.to_dict())[:100],
                    error=str(e),
                    severity='error'
                ))
        
        return products, classifications
    
    def _generate_summary(
        self,
        products: List[ProductResponse],
        classifications: List[ProductClassification]
    ) -> Dict[str, Any]:
        """Génère un résumé des données"""
        if not products:
            return {}
        
        prices = [p.price for p in products if p.price > 0]
        ratings = [p.rating for p in products if p.rating and p.rating > 0]
        stocks = [p.stock for p in products if p.stock is not None]
        
        # Stats par catégorie
        categories = {}
        for p in products:
            cat = p.category or 'Sans catégorie'
            categories[cat] = categories.get(cat, 0) + 1
        
        # Stats par classification
        rank_dist = {}
        for c in classifications:
            rank_dist[c.rank_category.value] = rank_dist.get(c.rank_category.value, 0) + 1
        
        price_dist = {}
        for c in classifications:
            price_dist[c.price_bucket.value] = price_dist.get(c.price_bucket.value, 0) + 1
        
        stock_dist = {}
        for c in classifications:
            stock_dist[c.stock_status.value] = stock_dist.get(c.stock_status.value, 0) + 1
        
        return {
            'price': {
                'min': min(prices) if prices else 0,
                'max': max(prices) if prices else 0,
                'avg': sum(prices) / len(prices) if prices else 0,
                'median': sorted(prices)[len(prices)//2] if prices else 0
            },
            'rating': {
                'min': min(ratings) if ratings else 0,
                'max': max(ratings) if ratings else 0,
                'avg': sum(ratings) / len(ratings) if ratings else 0
            },
            'stock': {
                'total': sum(stocks) if stocks else 0,
                'out_of_stock': len([s for s in stocks if s == 0]),
                'low_stock': len([s for s in stocks if 0 < s <= 10])
            },
            'categories': categories,
            'rank_distribution': rank_dist,
            'price_distribution': price_dist,
            'stock_distribution': stock_dist
        }
    
    # === Classification Methods ===
    
    @staticmethod
    def classify_rank(rank: Optional[int]) -> RankCategory:
        """Classifie un rang"""
        if rank is None or rank <= 0:
            return RankCategory.BEYOND
        if rank <= 10:
            return RankCategory.TOP_10
        if rank <= 100:
            return RankCategory.TOP_100
        if rank <= 1000:
            return RankCategory.TOP_1000
        if rank <= 5000:
            return RankCategory.TOP_5000
        return RankCategory.BEYOND
    
    @staticmethod
    def classify_price(price: float) -> PriceBucket:
        """Classifie un prix"""
        if price <= 0:
            return PriceBucket.BUDGET
        if price < 25:
            return PriceBucket.BUDGET
        if price < 50:
            return PriceBucket.ECONOMY
        if price < 100:
            return PriceBucket.STANDARD
        if price < 500:
            return PriceBucket.PREMIUM
        return PriceBucket.LUXURY
    
    @staticmethod
    def classify_stock(stock: Optional[int]) -> StockStatus:
        """Classifie un stock"""
        if stock is None or stock <= 0:
            return StockStatus.OUT_OF_STOCK
        if stock <= 10:
            return StockStatus.LOW_STOCK
        if stock <= 100:
            return StockStatus.IN_STOCK
        return StockStatus.HIGH_STOCK


# Instance singleton
etl_service = ETLService()
