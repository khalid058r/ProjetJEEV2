# Python ML & ETL Service

Service Python pour l'e-commerce avec ETL, recherche sémantique, chatbot IA et prédictions ML.

## 🚀 Fonctionnalités

| Module | Description |
|--------|-------------|
| **ETL** | Traitement CSV, validation, classification, import Java |
| **Search** | Recherche sémantique avec embeddings et FAISS |
| **Chat** | Chatbot IA avec LLM open source (Ollama/HuggingFace) |
| **ML** | Prédictions de rang, recommandations prix, détection best-sellers |

## 📦 Installation

### 1. Prérequis
- Python 3.10+
- (Optionnel) Ollama pour LLM local

### 2. Installation rapide

```bash
# Cloner/Extraire le projet
cd python-service

# Créer environnement virtuel
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# Installer PyTorch (choisir une option)
pip install torch --index-url https://download.pytorch.org/whl/cpu     # CPU
# pip install torch --index-url https://download.pytorch.org/whl/cu118 # GPU NVIDIA

# Installer les dépendances
pip install -r requirements.txt
```

### 3. (Optionnel) Installer Ollama pour le chatbot IA

```bash
# Linux/Mac
curl -fsSL https://ollama.ai/install.sh | sh

# Télécharger un modèle
ollama pull mistral   # Recommandé (~4GB)
# ollama pull phi     # Plus léger (~2GB)

# Démarrer Ollama
ollama serve
```

## 🏃 Démarrage

```bash
# Démarrer le service
python run.py

# Ou directement avec uvicorn
uvicorn app.main:app --host 0.0.0.0 --port 5000 --reload
```

**URLs:**
- API: http://localhost:5000
- Documentation: http://localhost:5000/docs
- ReDoc: http://localhost:5000/redoc

## 📡 Endpoints API

### Health
```
GET  /api/health          # Santé complète
GET  /api/ping            # Simple ping
GET  /api/info            # Informations service
```

### ETL
```
POST /api/etl/upload                 # Upload et traite un CSV
POST /api/etl/import-to-java         # Importe vers Java
POST /api/etl/upload-and-import      # Upload + Import en une fois
GET  /api/etl/files                  # Liste fichiers uploadés
GET  /api/etl/classify-rank/{rank}   # Classifie un rang
GET  /api/etl/classify-price/{price} # Classifie un prix
```

### Search
```
POST /api/search                  # Recherche sémantique
GET  /api/search/quick?q=...      # Recherche rapide
POST /api/search/index            # Indexe depuis Java
GET  /api/search/similar/{id}     # Produits similaires
GET  /api/search/status           # Statut de l'index
GET  /api/search/categories       # Catégories indexées
```

### Chat
```
POST /api/chat                    # Envoyer un message
POST /api/chat/init-llm           # Initialiser le LLM
GET  /api/chat/llm-status         # Statut du LLM
GET  /api/chat/{conversation_id}  # Historique conversation
GET  /api/chat/quick-actions      # Actions rapides
```

### ML
```
POST /api/ml/predict-rank         # Prédire le rang
POST /api/ml/recommend-price      # Recommander un prix
POST /api/ml/find-bestsellers     # Trouver best-sellers potentiels
POST /api/ml/train                # Entraîner les modèles
POST /api/ml/train-from-java      # Entraîner depuis Java
POST /api/ml/analyze-product      # Analyse complète d'un produit
GET  /api/ml/status               # Statut des modèles
```

## 🔧 Configuration

Fichier `.env`:

```env
# API
API_HOST=0.0.0.0
API_PORT=5000

# Java Backend
JAVA_BACKEND_URL=http://localhost:8080

# LLM Ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=mistral

# LLM HuggingFace (fallback)
HF_MODEL=TinyLlama/TinyLlama-1.1B-Chat-v1.0

# ML
ML_N_ESTIMATORS=100
ML_MAX_DEPTH=10
```

## 📚 Exemples d'utilisation

### 1. Indexer les produits
```bash
curl -X POST "http://localhost:5000/api/search/index"
```

### 2. Rechercher un produit
```bash
curl -X GET "http://localhost:5000/api/search/quick?q=smartphone&limit=5"
```

### 3. Chatter avec l'assistant
```bash
curl -X POST "http://localhost:5000/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "Quels sont les meilleurs produits?"}'
```

### 4. Initialiser le LLM
```bash
curl -X POST "http://localhost:5000/api/chat/init-llm?use_ollama=true&ollama_model=mistral"
```

### 5. Entraîner les modèles ML
```bash
curl -X POST "http://localhost:5000/api/ml/train-from-java"
```

### 6. Analyser un produit
```bash
curl -X POST "http://localhost:5000/api/ml/analyze-product" \
  -H "Content-Type: application/json" \
  -d '{"id":1,"title":"iPhone 15","price":999,"rating":4.8,"review_count":500,"rank":15,"category":"Electronics"}'
```

### 7. Uploader un CSV
```bash
curl -X POST "http://localhost:5000/api/etl/upload" \
  -F "file=@products.csv"
```

## 🏗️ Structure du projet

```
python-service/
├── app/
│   ├── api/
│   │   ├── health.py      # Endpoints santé
│   │   ├── etl.py         # Endpoints ETL
│   │   ├── search.py      # Endpoints recherche
│   │   ├── chat.py        # Endpoints chatbot
│   │   └── ml.py          # Endpoints ML
│   ├── models/
│   │   └── schemas.py     # Schémas Pydantic
│   ├── services/
│   │   ├── java_client.py     # Client HTTP Java
│   │   ├── etl_service.py     # Service ETL
│   │   ├── search_service.py  # Service recherche
│   │   ├── chatbot_service.py # Service chatbot
│   │   ├── llm_service.py     # Service LLM
│   │   └── ml_service.py      # Service ML
│   ├── config.py          # Configuration
│   └── main.py            # Application FastAPI
├── data/
│   ├── uploads/           # Fichiers uploadés
│   ├── processed/         # Fichiers traités
│   ├── models/            # Modèles ML sauvegardés
│   └── embeddings/        # Index embeddings
├── logs/                  # Logs
├── requirements.txt
├── run.py
└── .env
```

## 🔌 Intégration avec le projet

### Backend Java Spring Boot

Le service Python communique avec le backend Java via HTTP:

```java
// ProductController.java - endpoints utilisés
GET  /api/products          // Liste produits
GET  /api/products/asin/{asin}
POST /api/products          // Créer produit
PUT  /api/products/{id}     // Modifier produit
GET  /api/categories        // Liste catégories
GET  /api/health           // Health check
```

### Frontend React/Vue

```javascript
// Exemple d'intégration frontend
const API_BASE = 'http://localhost:5000/api';

// Recherche
const search = async (query) => {
  const res = await fetch(`${API_BASE}/search/quick?q=${query}`);
  return res.json();
};

// Chat
const chat = async (message, conversationId) => {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, conversation_id: conversationId })
  });
  return res.json();
};
```

## 📊 Modèles ML

### Prédiction de Rang
- **Algorithme**: Random Forest Regressor
- **Features**: price, rating, review_count, stock
- **Output**: rang prédit, confiance, tendance

### Recommandation Prix
- **Algorithme**: Gradient Boosting Regressor
- **Features**: rating, review_count, rank
- **Output**: prix recommandé, variation, raisonnement

### Détection Best-Sellers
- **Algorithme**: Random Forest Classifier
- **Features**: rating, review_count, price
- **Output**: score de potentiel, raisons

## 🤖 LLM Supportés

| Provider | Modèle | RAM | Description |
|----------|--------|-----|-------------|
| Ollama | mistral | 8GB | Recommandé, excellent équilibre |
| Ollama | phi | 4GB | Rapide, léger |
| Ollama | llama2 | 8GB | Meta, bonne qualité |
| HuggingFace | TinyLlama | 3GB | Fallback, très léger |
| HuggingFace | Mistral-7B | 16GB | Très puissant |

## 📝 Licence

MIT License
