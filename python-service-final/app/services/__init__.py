"""
Services Module
Contient tous les services métier de l'application
"""
from app.services.ml_service_unified import MLService, ml_service
from app.services.analytics_service import AnalyticsService
from app.services.recommendation_service import RecommendationService
from app.services.sync_service import SyncService
from app.services.validation_service import DataValidationService, validation_service

__all__ = [
    'MLService',
    'ml_service',
    'AnalyticsService', 
    'RecommendationService',
    'SyncService',
    'DataValidationService',
    'validation_service'
]