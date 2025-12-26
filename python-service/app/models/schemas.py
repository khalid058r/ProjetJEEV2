from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum


# ============ ENUMS ============

class ErrorCode(str, Enum):
    UNKNOWN_CATEGORY = "UNKNOWN_CATEGORY"
    IMAGE_NOT_FOUND = "IMAGE_NOT_FOUND"
    DUPLICATE_ASIN = "DUPLICATE_ASIN"
    INVALID_PRICE = "INVALID_PRICE"
    INVALID_RATING = "INVALID_RATING"
    MISSING_REQUIRED = "MISSING_REQUIRED"
    INVALID_FORMAT = "INVALID_FORMAT"


class RankCategory(int, Enum):
    EXCELLENT = 5
    VERY_GOOD = 4
    GOOD = 3
    AVERAGE = 2
    POOR = 1


class TrendDirection(str, Enum):
    UP = "UP"
    DOWN = "DOWN"
    STABLE = "STABLE"


# ============ ETL REQUESTS ============

class ProcessCsvRequest(BaseModel):
    file_path: str = Field(..., description="Chemin du fichier CSV à traiter")
    auto_fix: bool = Field(default=True, description="Corriger automatiquement les erreurs simples")
    create_categories: bool = Field(default=True, description="Créer nouvelles catégories si inconnues")


# ============ ETL RESPONSES ============

class ProcessCsvResponse(BaseModel):
    total_lines: int
    valid_count: int
    needs_review_count: int
    rejected_count: int
    valid_csv_path: Optional[str] = None
    rejected_csv_path: Optional[str] = None
    processing_time_seconds: float
    summary: Dict[str, Any] = {}


class ClassifyRankRequest(BaseModel):
    rank: int = Field(..., ge=1, description="Classement du produit")


class ClassifyRankResponse(BaseModel):
    rank: int
    category: RankCategory
    category_label: str
    percentile: Optional[float] = None


class ClassifyPriceRequest(BaseModel):
    price: float = Field(..., ge=0, description="Prix du produit")
    category: Optional[str] = None


class ClassifyPriceResponse(BaseModel):
    price: float
    bucket: str
    bucket_label: str
    category_average: Optional[float] = None


# ============ MACHINE LEARNING ============

class PredictRankRequest(BaseModel):
    product_id: int
    current_rank: int
    price: float
    rating: float
    review_count: int
    category: str


class PredictRankResponse(BaseModel):
    product_id: int
    current_rank: int
    predicted_rank: int
    confidence: float = Field(..., ge=0, le=1)
    trend: TrendDirection
    factors: Dict[str, Any] = {}
    recommendation: str


class RecommendPriceRequest(BaseModel):
    product_id: int
    current_price: float
    category: str
    rank: int
    rating: float
    review_count: int


class RecommendPriceResponse(BaseModel):
    product_id: int
    current_price: float
    recommended_price: float
    price_change_percent: float
    expected_sales_increase: Optional[float] = None
    reasoning: str
    competitor_avg_price: Optional[float] = None


class PotentialBestSeller(BaseModel):
    product_id: int
    title: str
    current_rank: int
    rating: float
    review_count: int
    price: float
    potential_score: float
    reasons: List[str]


class FindBestSellersResponse(BaseModel):
    count: int
    products: List[PotentialBestSeller]
    criteria: Dict[str, Any]


# ============ HEALTH CHECK ============

class HealthResponse(BaseModel):
    status: str
    version: str
    uptime_seconds: float
    java_backend_accessible: bool
