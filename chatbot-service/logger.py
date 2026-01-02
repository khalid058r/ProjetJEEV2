"""
Logger - Module de logging avancé pour le chatbot
Fournit des logs structurés avec niveaux, couleurs et rotation des fichiers
"""

import logging
import os
from datetime import datetime
from logging.handlers import RotatingFileHandler

# Codes couleurs ANSI pour le terminal
class Colors:
    RESET = '\033[0m'
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    PURPLE = '\033[95m'
    CYAN = '\033[96m'
    GRAY = '\033[90m'

class ColoredFormatter(logging.Formatter):
    """Formatter avec couleurs pour le terminal"""
    
    COLORS = {
        logging.DEBUG: Colors.GRAY,
        logging.INFO: Colors.GREEN,
        logging.WARNING: Colors.YELLOW,
        logging.ERROR: Colors.RED,
        logging.CRITICAL: Colors.PURPLE,
    }
    
    def format(self, record):
        color = self.COLORS.get(record.levelno, Colors.RESET)
        record.levelname = f"{color}{record.levelname}{Colors.RESET}"
        record.msg = f"{color}{record.msg}{Colors.RESET}"
        return super().format(record)

def setup_logger(name: str = 'chatbot', log_level: str = 'INFO') -> logging.Logger:
    """
    Configure et retourne un logger avec:
    - Sortie console colorée
    - Fichier de log avec rotation
    - Format structuré avec timestamp
    """
    logger = logging.getLogger(name)
    
    # Éviter les doublons si déjà configuré
    if logger.handlers:
        return logger
    
    logger.setLevel(getattr(logging, log_level.upper(), logging.INFO))
    
    # Format pour les logs
    log_format = '%(asctime)s | %(levelname)-8s | %(name)s | %(message)s'
    date_format = '%Y-%m-%d %H:%M:%S'
    
    # Handler Console avec couleurs
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.DEBUG)
    console_formatter = ColoredFormatter(log_format, datefmt=date_format)
    console_handler.setFormatter(console_formatter)
    logger.addHandler(console_handler)
    
    # Handler Fichier avec rotation
    log_dir = os.path.join(os.path.dirname(__file__), 'logs')
    os.makedirs(log_dir, exist_ok=True)
    
    log_file = os.path.join(log_dir, f'{name}.log')
    file_handler = RotatingFileHandler(
        log_file,
        maxBytes=5*1024*1024,  # 5MB par fichier
        backupCount=5,  # Garder 5 fichiers de backup
        encoding='utf-8'
    )
    file_handler.setLevel(logging.DEBUG)
    file_formatter = logging.Formatter(log_format, datefmt=date_format)
    file_handler.setFormatter(file_formatter)
    logger.addHandler(file_handler)
    
    return logger

class ChatbotLogger:
    """
    Logger spécialisé pour le chatbot avec méthodes métier
    """
    
    def __init__(self):
        self.logger = setup_logger('chatbot')
        self.request_logger = setup_logger('chatbot.requests')
        self.db_logger = setup_logger('chatbot.database')
        self.llm_logger = setup_logger('chatbot.llm')
    
    def info(self, message: str):
        """Log info général"""
        self.logger.info(message)
    
    def error(self, message: str, exc_info: bool = False):
        """Log erreur"""
        self.logger.error(message, exc_info=exc_info)
    
    def warning(self, message: str):
        """Log avertissement"""
        self.logger.warning(message)
    
    def debug(self, message: str):
        """Log debug"""
        self.logger.debug(message)
    
    # ============ Logs Métier ============
    
    def log_request(self, user_id: str, message: str, role: str):
        """Log une requête utilisateur"""
        self.request_logger.info(
            f"[REQUEST] User:{user_id} Role:{role} Message:'{message[:100]}...'" if len(message) > 100 
            else f"[REQUEST] User:{user_id} Role:{role} Message:'{message}'"
        )
    
    def log_response(self, user_id: str, intent: str, response_time_ms: float, success: bool):
        """Log une réponse"""
        status = "✅" if success else "❌"
        self.request_logger.info(
            f"[RESPONSE] {status} User:{user_id} Intent:{intent} Time:{response_time_ms:.0f}ms"
        )
    
    def log_intent(self, message: str, intent: str, confidence: float = None):
        """Log la classification d'intention"""
        conf_str = f" Confidence:{confidence:.2f}" if confidence else ""
        self.logger.debug(f"[INTENT] '{message[:50]}...' -> {intent}{conf_str}")
    
    def log_db_query(self, query_type: str, duration_ms: float, row_count: int = None):
        """Log une requête DB"""
        rows_str = f" Rows:{row_count}" if row_count is not None else ""
        self.db_logger.debug(f"[DB] {query_type} Time:{duration_ms:.0f}ms{rows_str}")
    
    def log_llm_call(self, model: str, tokens_used: int = None, duration_ms: float = None):
        """Log un appel LLM"""
        tokens_str = f" Tokens:{tokens_used}" if tokens_used else ""
        time_str = f" Time:{duration_ms:.0f}ms" if duration_ms else ""
        self.llm_logger.info(f"[LLM] Model:{model}{tokens_str}{time_str}")
    
    def log_llm_error(self, error: str, fallback_used: bool = False):
        """Log une erreur LLM"""
        fallback_str = " (Fallback activé)" if fallback_used else ""
        self.llm_logger.error(f"[LLM ERROR] {error}{fallback_str}")
    
    def log_cache_hit(self, cache_key: str):
        """Log un hit de cache"""
        self.logger.debug(f"[CACHE HIT] Key:{cache_key}")
    
    def log_cache_miss(self, cache_key: str):
        """Log un miss de cache"""
        self.logger.debug(f"[CACHE MISS] Key:{cache_key}")
    
    def log_startup(self, port: int, groq_status: bool, db_status: bool):
        """Log le démarrage du service"""
        groq_str = "✅ Groq OK" if groq_status else "❌ Groq OFFLINE"
        db_str = "✅ DB OK" if db_status else "❌ DB OFFLINE"
        self.logger.info(f"🚀 Chatbot démarré sur port {port} | {groq_str} | {db_str}")

# Instance globale
chatbot_logger = ChatbotLogger()
