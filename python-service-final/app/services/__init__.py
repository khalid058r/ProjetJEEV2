"""
Services Module
Contient tous les services métier de l'application
"""
from app.services.ml_service_v2 import MLServiceV2
from app.services.analytics_service import AnalyticsService
from app.services.recommendation_service import RecommendationService
from app.services.sync_service import SyncService
from app.services.validation_service import DataValidationService, validation_service

__all__ = [
    'MLServiceV2',
    'AnalyticsService', 
    'RecommendationService',
    'SyncService',
    'DataValidationService',
    'validation_service'
]