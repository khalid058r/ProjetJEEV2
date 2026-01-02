"""
Schémas Pydantic pour validation des données
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


# ============================================
# ENUMS
# ============================================

class RankCategory(str, Enum):
    TOP_10 = "top_10"
    TOP_100 = "top_100"
    TOP_1000 = "top_1000"
    TOP_5000 = "top_5000"
    BEYOND = "beyond_5000"


class PriceBucket(str, Enum):
    BUDGET = "budget"
    ECONOMY = "economy"
    STANDARD = "standard"
    PREMIUM = "premium"
    LUXURY = "luxury"


class StockStatus(str, Enum):
    OUT_OF_STOCK = "out_of_stock"
    LOW_STOCK = "low_stock"
    IN_STOCK = "in_stock"
    HIGH_STOCK = "high_stock"


class ChatIntent(str, Enum):
    SEARCH_PRODUCT = "search_product"
    PRODUCT_INFO = "product_info"
    PRICE_COMPARISON = "price_comparison"
    STOCK_CHECK = "stock_check"
    CATEGORY_BROWSE = "category_browse"
    RECOMMENDATION = "recommendation"
    ANALYTICS = "analytics"
    GENERAL_HELP = "general_help"
    GREETING = "greeting"
    UNKNOWN = "unknown"


class TrendDirection(str, Enum):
    UP = "up"
    DOWN = "down"
    STABLE = "stable"


# ============================================
# PRODUCT SCHEMAS
# ============================================

class ProductBase(BaseModel):
    """Schéma de base pour un produit"""
    asin: str = Field(..., min_length=10, max_length=10)
    title: str = Field(..., min_length=1, max_length=500)
    price: float = Field(..., ge=0)
    rating: Optional[float] = Field(None, ge=0, le=5)
    review_count: Optional[int] = Field(None, ge=0)
    rank: Optional[int] = Field(None, ge=1)
    stock: Optional[int] = Field(None, ge=0)
    category: Optional[str] = None
    category_id: Optional[int] = None
    image_url: Optional[str] = None


class ProductCreate(ProductBase):
    """Pour la création de produit"""
    pass


class ProductResponse(ProductBase):
    """Réponse produit avec ID"""
    id: Optional[int] = None
    category_name: Optional[str] = None
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class ProductClassification(BaseModel):
    """Classification d'un produit"""
    product_id: Optional[int] = None
    asin: str
    rank_category: RankCategory
    price_bucket: PriceBucket
    stock_status: StockStatus
    health_score: Optional[float] = None


# ============================================
# ETL SCHEMAS
# ============================================

class ETLValidationError(BaseModel):
    """Erreur de validation ETL"""
    row: int
    column: str
    value: Any
    error: str
    severity: str = "error"


class ETLProcessingResult(BaseModel):
    """Résultat du traitement ETL"""
    success: bool
    total_rows: int
    valid_rows: int
    invalid_rows: int
    products: List[ProductResponse] = []
    classifications: List[ProductClassification] = []
    errors: List[ETLValidationError] = []
    warnings: List[str] = []
    processing_time_ms: float
    summary: Dict[str, Any] = {}


class ETLImportResult(BaseModel):
    """Résultat de l'import vers Java"""
    success: bool
    imported_count: int
    failed_count: int
    errors: List[str] = []
    details: Dict[str, Any] = {}


# ============================================
# SEARCH SCHEMAS
# ============================================

class SearchQuery(BaseModel):
    """Requête de recherche"""
    query: str = Field(..., min_length=1)
    top_k: int = Field(10, ge=1, le=100)
    category_filter: Optional[str] = None
    price_min: Optional[float] = None
    price_max: Optional[float] = None
    min_rating: Optional[float] = Field(None, ge=0, le=5)
    in_stock_only: bool = False


class SearchResult(BaseModel):
    """Résultat de recherche"""
    product_id: int
    asin: str
    title: str
    price: float
    rating: Optional[float] = None
    review_count: Optional[int] = None
    rank: Optional[int] = None
    stock: Optional[int] = None
    category_name: Optional[str] = None
    image_url: Optional[str] = None
    similarity_score: float
    highlights: List[str] = []


class SearchResponse(BaseModel):
    """Réponse de recherche"""
    query: str
    results: List[SearchResult]
    total_found: int
    search_time_ms: float
    suggestions: List[str] = []
    filters_applied: Dict[str, Any] = {}


class IndexStatusResponse(BaseModel):
    """Statut de l'index"""
    is_ready: bool
    indexed_products: int
    embedding_model: str
    last_updated: Optional[datetime] = None
    index_size_mb: Optional[float] = None


# ============================================
# CHAT SCHEMAS
# ============================================

class ChatMessage(BaseModel):
    """Message de chat"""
    role: str
    content: str
    timestamp: datetime = Field(default_factory=datetime.now)


class ChatRequest(BaseModel):
    """Requête de chat"""
    message: str = Field(..., min_length=1, max_length=2000)
    conversation_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = None
    user_id: Optional[str] = None


class ChatResponse(BaseModel):
    """Réponse de chat"""
    response: str
    conversation_id: str
    intent: ChatIntent
    entities: Dict[str, Any] = {}
    suggestions: List[str] = []
    related_products: List[SearchResult] = []
    confidence: float = 0.0


class ConversationHistory(BaseModel):
    """Historique de conversation"""
    conversation_id: str
    messages: List[ChatMessage] = []
    created_at: datetime
    last_activity: datetime
    context: Dict[str, Any] = {}


# ============================================
# ML SCHEMAS
# ============================================

class PredictRankRequest(BaseModel):
    """Requête de prédiction de rang"""
    product_id: int
    current_rank: int = Field(..., ge=1)
    price: float = Field(..., ge=0)
    rating: float = Field(..., ge=0, le=5)
    review_count: int = Field(..., ge=0)
    category: Optional[str] = None


class PredictRankResponse(BaseModel):
    """Réponse de prédiction de rang"""
    product_id: int
    current_rank: int
    predicted_rank: int
    confidence: float
    trend: TrendDirection
    factors: Dict[str, float] = {}
    recommendation: str


class RecommendPriceRequest(BaseModel):
    """Requête de recommandation de prix"""
    product_id: int
    current_price: float = Field(..., ge=0)
    category: str
    rating: float = Field(..., ge=0, le=5)
    review_count: int = Field(0, ge=0)
    rank: Optional[int] = None
    competitor_prices: List[float] = []


class RecommendPriceResponse(BaseModel):
    """Réponse de recommandation de prix"""
    product_id: int
    current_price: float
    recommended_price: float
    price_change_percent: float
    reasoning: str
    competitor_avg_price: Optional[float] = None


class PotentialBestSeller(BaseModel):
    """Produit potentiel best-seller"""
    product_id: int
    title: str
    current_rank: int
    rating: float
    review_count: int
    price: float
    potential_score: float
    reasons: List[str] = []


class FindBestSellersResponse(BaseModel):
    """Réponse recherche best-sellers"""
    count: int
    products: List[PotentialBestSeller]
    criteria: Dict[str, Any] = {}


class ProductHealthAnalysis(BaseModel):
    """Analyse de santé d'un produit"""
    product_id: int
    health_score: float
    level: str
    issues: List[str] = []
    recommendations: List[str] = []


class MLTrainingResult(BaseModel):
    """Résultat de l'entraînement ML"""
    success: bool
    model_name: str
    metrics: Dict[str, float] = {}
    trained_at: datetime = Field(default_factory=datetime.now)
    samples_used: int = 0


# ============================================
# HEALTH SCHEMAS
# ============================================

class ServiceHealth(BaseModel):
    """Santé d'un service"""
    name: str
    status: str
    latency_ms: Optional[float] = None
    details: Dict[str, Any] = {}


class HealthResponse(BaseModel):
    """Réponse de santé globale"""
    status: str
    timestamp: datetime
    version: str
    services: List[ServiceHealth] = []
    uptime_seconds: Optional[float] = None


# ============================================
# CATEGORY SCHEMAS
# ============================================

class CategoryResponse(BaseModel):
    """Catégorie"""
    id: int
    name: str
    description: Optional[str] = None
    product_count: Optional[int] = None

    class Config:
        from_attributes = True
