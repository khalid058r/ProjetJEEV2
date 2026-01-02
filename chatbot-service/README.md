# Chatbot Service - Assistant IA pour SalesManager

Ce service fournit un chatbot intelligent base sur **Groq Cloud** (LLM gratuit et rapide).

## Avantages de Groq

- GRATUIT - Pas besoin de payer
- Rapide - Reponses en moins de 1 seconde
- Puissant - Utilise Llama 3.3 70B
- Cloud - Pas d installation locale requise

## Pre-requis

1. Python 3.10+
2. PostgreSQL (la meme base que le backend Spring Boot)
3. Cle API Groq (gratuite)

## Obtenir une cle API Groq (GRATUIT)

1. Allez sur https://console.groq.com/keys
2. Creez un compte (gratuit)
3. Generez une nouvelle cle API
4. Copiez la cle dans le fichier .env

## Installation

```bash
cd chatbot-service
python -m venv venv
.\venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

## Configuration

Modifiez le fichier .env avec votre cle API Groq:

```
GROQ_API_KEY=gsk_votre_cle_api_ici
GROQ_MODEL=llama-3.3-70b-versatile
```

## Demarrage

```bash
python app.py
```

Le service sera accessible sur http://localhost:5001

## Modeles Groq disponibles

- llama-3.3-70b-versatile (recommande)
- llama-3.1-8b-instant (plus rapide)
- mixtral-8x7b-32768
- gemma2-9b-it

## Endpoints API

- POST /api/chat - Envoyer un message
- POST /api/chat/clear - Effacer historique
- GET /api/quick/search?q=query - Recherche produits
- GET /api/health - Status du service
