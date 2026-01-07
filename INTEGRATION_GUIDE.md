# 🔗 Guide d'Intégration - Projet E-Commerce ML

Ce document décrit l'intégration complète entre les trois composants du projet :
- **Backend Java** (Spring Boot) - Port 8080
- **Service Python ML** (FastAPI) - Port 5000
- **Frontend React** (Vite) - Port 5173

## 📋 Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React Front   │────►│   Java Backend  │────►│   Python ML     │
│   (Port 5173)   │     │   (Port 8080)   │     │   (Port 5000)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                                                │
        └────────────── Direct Access ───────────────────┘
```

## 🚀 Démarrage

### 1. Service Python ML
```bash
cd python-service-final
python run.py
# ➜ http://localhost:5000
# ➜ Docs: http://localhost:5000/docs
```

### 2. Backend Java
```bash
cd backend/sallesMangement
./mvnw spring-boot:run
# ➜ http://localhost:8080
```

### 3. Frontend React
```bash
cd new_frontend
npm run dev
# ➜ http://localhost:5173
```

---

## 📡 Endpoints Disponibles

### Via Java Backend (`/api/ml/*`)

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/ml/predict/price` | POST | Prédiction prix optimal |
| `/api/ml/predict/demand` | POST | Prédiction demande |
| `/api/ml/predict/bestseller` | POST | Prédiction bestseller |
| `/api/ml/predict/price/{id}` | GET | Prédiction prix par ID produit |
| `/api/ml/predict/demand/{id}` | GET | Prédiction demande par ID |
| `/api/ml/predict/bestseller/{id}` | GET | Prédiction bestseller par ID |
| `/api/ml/predict/all/{id}` | GET | Toutes prédictions pour un produit |
| `/api/ml/analyze/{id}` | GET | Analyse complète par ID |
| `/api/ml/analyze` | POST | Analyse avec données directes |
| `/api/ml/search` | GET | Recherche sémantique |
| `/api/ml/status` | GET | Statut des modèles ML |
| `/api/ml/ready` | GET | Health check readiness |
| `/api/ml/metrics` | GET | Métriques du service |
| `/api/ml/reload` | POST | Recharger les modèles |
| `/api/ml/train` | POST | Entraîner depuis données Java |
| `/api/ml/health` | GET | Vérification disponibilité |

### Appels Directs Python (`http://localhost:5000/api/*`)

| Catégorie | Endpoints |
|-----------|-----------|
| **ML** | `/api/ml/predict/price`, `/api/ml/predict/demand`, `/api/ml/search`, etc. |
| **ETL** | `/api/etl/upload`, `/api/etl/validate`, `/api/etl/process-and-import` |
| **Chat** | `/api/chat`, `/api/chat/history/{id}`, `/api/chat/clear/{id}` |
| **Sync** | `/api/sync/full`, `/api/sync/products`, `/api/sync/status` |
| **Health** | `/api/health`, `/api/health/ready`, `/api/health/live`, `/api/metrics` |

---

## 💻 Utilisation Frontend

### APIs disponibles dans `src/api/index.js`

```javascript
import { 
  mlApi,           // Via Java Backend
  mlDirectApi,     // Direct Python
  searchApi,       // Recherche sémantique
  recommendationsApi,
  etlApi,          // Import CSV
  chatbotApi,      // Assistant IA
  syncApi          // Synchronisation
} from './api'
```

### Exemples d'utilisation

#### 1. Prédiction via Java
```javascript
// Via Java Backend (recommandé pour la cohérence des données)
const response = await mlApi.predictPriceById(productId)
const { predicted_price, confidence } = response.data
```

#### 2. Prédiction directe Python
```javascript
// Direct Python (plus rapide, moins de latence)
const result = await mlDirectApi.predictPrice({
  name: "Produit Test",
  price: 29.99,
  rating: 4.5,
  reviews: 150,
  category: "Electronics"
})
```

#### 3. Recherche sémantique
```javascript
// Recherche par sémantique (IA)
const results = await searchApi.semantic("écouteurs sans fil bluetooth", 10)
console.log(results.results) // Produits similaires
```

#### 4. Chatbot IA
```javascript
// Assistant conversationnel
const response = await chatbotApi.sendMessage(
  "Quel est le produit le plus vendu?",
  "user-123"
)
console.log(response.response)
```

#### 5. Import CSV
```javascript
// Upload et traitement de fichier
const result = await etlApi.processAndImport(file, {
  skipDuplicates: true,
  updateExisting: false
})
```

#### 6. Monitoring
```javascript
// Vérifier la santé du service
const health = await mlDirectApi.getHealth()
const metrics = await mlDirectApi.getMetrics()

if (!health.ready) {
  console.warn("Service ML non prêt")
}
```

---

## ⚙️ Configuration

### Frontend (`.env`)
```env
VITE_API_URL=http://localhost:8080/api
VITE_PYTHON_ML_URL=http://localhost:5000
```

### Backend Java (`application.properties`)
```properties
python.ml.service.url=http://localhost:5000
python.ml.service.timeout=30000
```

### Python (`.env`)
```env
API_HOST=0.0.0.0
API_PORT=5000
JAVA_BACKEND_URL=http://localhost:8080
```

---

## 🔄 Flux de Données

### Prédiction ML (via Java)
```
Frontend → Java Backend → Python ML → Java Backend → Frontend
   │           │              │            │           │
   │     Validation      Prédiction   Enrichir      Réponse
   │     Auth/CORS       avec ML     avec DB       formatée
```

### Prédiction ML (direct)
```
Frontend → Python ML → Frontend
   │           │          │
   │      Prédiction   Réponse
   │       directe     brute
```

### Import ETL
```
Frontend → Python ML → Java Backend → BDD
   │          │             │          │
   │       Parse        Insert     Persiste
   │       CSV         produits
```

---

## 🔒 Sécurité

- **CORS** : Configuré pour localhost en dev
- **Auth** : Les endpoints Java sont protégés par JWT
- **Les appels directs Python** : À utiliser côté serveur ou avec précaution

---

## 📊 Monitoring

### Endpoints de santé

| Service | Endpoint | Description |
|---------|----------|-------------|
| Python | `GET /api/health` | Health basique |
| Python | `GET /api/health/ready` | Readiness (modèles chargés) |
| Python | `GET /api/health/live` | Liveness (service vivant) |
| Python | `GET /api/metrics` | Métriques détaillées |
| Java | `GET /api/ml/health` | Vérifie Python via Java |

### Exemple de réponse `/api/metrics`
```json
{
  "service": "python-ml-service",
  "version": "2.1.0",
  "uptime_seconds": 3600,
  "system": {
    "memory_mb": 256,
    "cpu_percent": 5.2
  },
  "ml": {
    "ready": true,
    "models_loaded": 4,
    "load_time_ms": 554
  }
}
```

---

## 🐛 Dépannage

### Le service ML ne répond pas
```bash
# Vérifier que le service tourne
curl http://localhost:5000/api/health

# Vérifier les logs
cat python-service-final/logs/app.log
```

### Modèles non chargés
```bash
# Recharger les modèles
curl -X POST http://localhost:5000/api/ml/reload

# Vérifier le statut
curl http://localhost:5000/api/ml/status
```

### Erreurs de prédiction
1. Vérifier que les données ont le bon format
2. Vérifier que les modèles sont entraînés
3. Entraîner avec: `POST /api/ml/train-from-java`

---

## 📦 Structure des Données

### ProductInput (pour les prédictions)
```typescript
interface ProductInput {
  id?: string
  name?: string
  title?: string
  price: number
  rating: number
  reviews: number       // alias: reviewCount
  category?: string
  description?: string
  stock: number
  rank: number
}
```

### Réponse Prédiction Prix
```typescript
interface PricePredictionResponse {
  success: boolean
  predicted_price: number
  confidence: number
  price_range: {
    min: number
    max: number
  }
  factors: string[]
}
```

---

## 🎯 Best Practices

1. **Utilisez mlApi via Java** pour les opérations qui nécessitent la cohérence avec la BDD
2. **Utilisez mlDirectApi** pour les previews rapides ou les fonctionnalités temps réel
3. **Cachez les résultats** de recherche sémantique côté frontend
4. **Monitorer** régulièrement `/api/health/ready`
5. **Re-entraîner** les modèles après import massif de données

---

*Dernière mise à jour: Janvier 2026*
