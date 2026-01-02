"""
Script d'entraînement complet des modèles ML V2
Inclut: Price Predictor, Demand Predictor, Bestseller Classifier, FAISS Index
"""

import os
import sys
import pickle
import numpy as np
import pandas as pd
from datetime import datetime
from pathlib import Path

# Ajouter le chemin du projet
sys.path.insert(0, str(Path(__file__).parent))

# Configuration
MODELS_DIR = Path(__file__).parent / 'data' / 'models'
EMBEDDINGS_DIR = Path(__file__).parent / 'data' / 'embeddings'
DATA_DIR = Path(__file__).parent / 'data' / 'uploads'

# Créer les dossiers
MODELS_DIR.mkdir(parents=True, exist_ok=True)
EMBEDDINGS_DIR.mkdir(parents=True, exist_ok=True)


def load_data():
    """Charge les données depuis le CSV"""
    print("\n📂 Chargement des données...")
    
    csv_paths = [
        DATA_DIR / 'amazon_dataset.csv',
        Path(__file__).parent / 'amazon_dataset.csv',
        Path('amazon_dataset.csv'),
    ]
    
    df = None
    for path in csv_paths:
        if path.exists():
            df = pd.read_csv(path)
            print(f"✅ Données chargées depuis: {path}")
            print(f"   Shape: {df.shape}")
            print(f"   Colonnes: {list(df.columns)}")
            break
    
    if df is None:
        print("❌ Fichier CSV non trouvé!")
        print(f"   Chemins vérifiés: {csv_paths}")
        return None
    
    return df


def preprocess_data(df):
    """Prétraite les données pour l'entraînement"""
    print("\n🔧 Prétraitement des données...")
    
    df = df.copy()
    
    # Normaliser les noms de colonnes (lowercase)
    column_mapping = {
        'ASIN': 'asin',
        'Category': 'category',
        'Product Link': 'product_link',
        'No of Sellers': 'sellers',
        'Rank': 'rank',
        'Rating': 'rating',
        'Reviews Count': 'reviews',
        'Price': 'price',
        'Product_Name': 'title',
        'Description': 'description',
        'Image_URL': 'image_url'
    }
    df.rename(columns=column_mapping, inplace=True)
    print(f"   Colonnes normalisées: {list(df.columns)}")
    
    # Nettoyer les prix
    if 'price' in df.columns:
        df['price'] = pd.to_numeric(
            df['price'].astype(str).str.replace(r'[$,€]', '', regex=True), 
            errors='coerce'
        )
        df['price'] = df['price'].fillna(df['price'].median())
        print(f"   Prix: min={df['price'].min():.2f}, max={df['price'].max():.2f}, mean={df['price'].mean():.2f}")
    
    # Nettoyer les ratings
    if 'rating' in df.columns:
        df['rating'] = pd.to_numeric(df['rating'], errors='coerce')
        df['rating'] = df['rating'].fillna(df['rating'].median())
        df['rating'] = df['rating'].clip(0, 5)
        print(f"   Rating: min={df['rating'].min():.2f}, max={df['rating'].max():.2f}")
    
    # Nettoyer les reviews
    if 'reviews' in df.columns:
        df['reviews'] = pd.to_numeric(
            df['reviews'].astype(str).str.replace(r'[,\s]', '', regex=True), 
            errors='coerce'
        )
        df['reviews'] = df['reviews'].fillna(0).astype(int)
        print(f"   Reviews: min={df['reviews'].min()}, max={df['reviews'].max()}")
    
    # Nettoyer le rank
    if 'rank' in df.columns:
        df['rank'] = pd.to_numeric(
            df['rank'].astype(str).str.replace(r'[,\s#]', '', regex=True), 
            errors='coerce'
        )
        df['rank'] = df['rank'].fillna(df['rank'].median())
        print(f"   Rank: min={df['rank'].min():.0f}, max={df['rank'].max():.0f}")
    
    # Demande basée sur rank (inversé) et reviews
    if 'reviews' in df.columns and 'rating' in df.columns:
        reviews_series = df['reviews'].fillna(0)
        rating_series = df['rating'].fillna(4)
        df['demand'] = (reviews_series * rating_series / 100 + 1)
        df['demand'] = df['demand'].fillna(1)
    else:
        df['demand'] = 1
    print(f"   Demande: min={df['demand'].min():.1f}, max={df['demand'].max():.1f}")
    
    # Label bestseller basé sur le rank (top 20%)
    if 'rank' in df.columns:
        threshold = df['rank'].quantile(0.2)  # Top 20% = meilleurs ranks
        df['is_bestseller'] = (df['rank'] <= threshold).astype(int)
    else:
        threshold = df['demand'].quantile(0.8)
        df['is_bestseller'] = (df['demand'] >= threshold).astype(int)
    print(f"   Bestsellers: {df['is_bestseller'].sum()} / {len(df)}")
    
    # Encoder les catégories
    label_encoders = {}
    if 'category' in df.columns:
        from sklearn.preprocessing import LabelEncoder
        le = LabelEncoder()
        df['category_encoded'] = le.fit_transform(df['category'].fillna('Unknown').astype(str))
        label_encoders['category'] = le
        print(f"   Catégories: {len(le.classes_)} uniques")
    
    print(f"✅ Données prétraitées: {len(df)} lignes")
    
    return df, label_encoders


def train_price_model(df):
    """Entraîne le modèle de prédiction de prix"""
    print("\n💰 Entraînement du modèle de PRIX...")
    
    from sklearn.ensemble import RandomForestRegressor
    from sklearn.model_selection import train_test_split, cross_val_score
    from sklearn.preprocessing import StandardScaler
    from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
    
    # Features
    feature_cols = ['rating', 'reviews']
    if 'category_encoded' in df.columns:
        feature_cols.append('category_encoded')
    
    available_cols = [col for col in feature_cols if col in df.columns]
    
    if len(available_cols) < 2 or 'price' not in df.columns:
        print("⚠️ Colonnes insuffisantes pour le modèle de prix")
        return None, None, feature_cols
    
    X = df[available_cols].fillna(0)
    y = df['price']
    
    # Supprimer les valeurs aberrantes
    mask = (y > 0) & (y < y.quantile(0.99))
    X = X[mask]
    y = y[mask]
    
    print(f"   Features: {available_cols}")
    print(f"   Échantillons: {len(X)}")
    
    # Split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Scaler
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Modèle
    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=10,
        min_samples_split=5,
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X_train_scaled, y_train)
    
    # Évaluation
    y_pred = model.predict(X_test_scaled)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    print(f"   ✅ RMSE: {rmse:.2f}")
    print(f"   ✅ MAE: {mae:.2f}")
    print(f"   ✅ R²: {r2:.3f}")
    
    # Cross-validation
    cv_scores = cross_val_score(model, X_train_scaled, y_train, cv=5, scoring='r2')
    print(f"   ✅ CV R² mean: {cv_scores.mean():.3f} (+/- {cv_scores.std()*2:.3f})")
    
    return model, scaler, available_cols


def train_demand_model(df):
    """Entraîne le modèle de prédiction de demande"""
    print("\n📦 Entraînement du modèle de DEMANDE...")
    
    from sklearn.ensemble import GradientBoostingRegressor
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import mean_squared_error, r2_score
    
    feature_cols = ['price', 'rating', 'reviews']
    if 'category_encoded' in df.columns:
        feature_cols.append('category_encoded')
    
    available_cols = [col for col in feature_cols if col in df.columns]
    
    if len(available_cols) < 2 or 'demand' not in df.columns:
        print("⚠️ Colonnes insuffisantes pour le modèle de demande")
        return None
    
    X = df[available_cols].fillna(0)
    y = df['demand']
    
    print(f"   Features: {available_cols}")
    print(f"   Échantillons: {len(X)}")
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = GradientBoostingRegressor(
        n_estimators=100,
        max_depth=5,
        learning_rate=0.1,
        random_state=42
    )
    
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)
    
    print(f"   ✅ RMSE: {rmse:.2f}")
    print(f"   ✅ R²: {r2:.3f}")
    
    return model


def train_bestseller_model(df):
    """Entraîne le modèle de classification bestseller"""
    print("\n🌟 Entraînement du modèle BESTSELLER...")
    
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import accuracy_score, f1_score, classification_report
    
    feature_cols = ['price', 'rating', 'reviews']
    if 'category_encoded' in df.columns:
        feature_cols.append('category_encoded')
    
    available_cols = [col for col in feature_cols if col in df.columns]
    
    if len(available_cols) < 2 or 'is_bestseller' not in df.columns:
        print("⚠️ Colonnes insuffisantes pour le modèle bestseller")
        return None
    
    X = df[available_cols].fillna(0)
    y = df['is_bestseller']
    
    print(f"   Features: {available_cols}")
    print(f"   Échantillons: {len(X)}")
    print(f"   Distribution: {dict(y.value_counts())}")
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        min_samples_split=5,
        class_weight='balanced',
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    
    print(f"   ✅ Accuracy: {accuracy:.3f}")
    print(f"   ✅ F1 Score: {f1:.3f}")
    
    return model


def create_faiss_index(df):
    """Crée l'index FAISS pour la recherche sémantique"""
    print("\n🔍 Création de l'index FAISS...")
    
    try:
        import faiss
        from sklearn.feature_extraction.text import TfidfVectorizer
    except ImportError as e:
        print(f"⚠️ Dépendance manquante: {e}")
        return None, None, None
    
    if 'title' not in df.columns:
        print("⚠️ Colonne 'title' manquante")
        return None, None, None
    
    # Créer les embeddings TF-IDF des titres
    titles = df['title'].fillna('').astype(str).tolist()
    
    if 'asin' in df.columns:
        asins = df['asin'].tolist()
    else:
        asins = list(range(len(df)))
    
    vectorizer = TfidfVectorizer(max_features=256, stop_words='english')
    embeddings = vectorizer.fit_transform(titles).toarray().astype('float32')
    
    print(f"   Embeddings shape: {embeddings.shape}")
    
    # Créer l'index FAISS
    dimension = embeddings.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(embeddings)
    
    print(f"   ✅ Index créé avec {index.ntotal} vecteurs")
    
    return index, asins, embeddings


def save_models(price_model, scaler, demand_model, bestseller_model, label_encoders, feature_columns):
    """Sauvegarde tous les modèles"""
    print("\n💾 Sauvegarde des modèles...")
    
    if price_model:
        with open(MODELS_DIR / 'price_predictor.pkl', 'wb') as f:
            pickle.dump(price_model, f)
        print("   ✅ price_predictor.pkl")
    
    if scaler:
        with open(MODELS_DIR / 'scaler.pkl', 'wb') as f:
            pickle.dump(scaler, f)
        print("   ✅ scaler.pkl")
    
    if demand_model:
        with open(MODELS_DIR / 'demand_predictor.pkl', 'wb') as f:
            pickle.dump(demand_model, f)
        print("   ✅ demand_predictor.pkl")
    
    if bestseller_model:
        with open(MODELS_DIR / 'bestseller_classifier.pkl', 'wb') as f:
            pickle.dump(bestseller_model, f)
        print("   ✅ bestseller_classifier.pkl")
    
    if label_encoders:
        with open(MODELS_DIR / 'label_encoders.pkl', 'wb') as f:
            pickle.dump(label_encoders, f)
        print("   ✅ label_encoders.pkl")
    
    if feature_columns:
        with open(MODELS_DIR / 'feature_columns.pkl', 'wb') as f:
            pickle.dump(feature_columns, f)
        print("   ✅ feature_columns.pkl")


def save_faiss_index(index, product_ids, embeddings):
    """Sauvegarde l'index FAISS"""
    print("\n💾 Sauvegarde de l'index FAISS...")
    
    try:
        import faiss
        
        if index:
            faiss.write_index(index, str(EMBEDDINGS_DIR / 'products.index'))
            print("   ✅ products.index")
        
        if product_ids:
            with open(EMBEDDINGS_DIR / 'product_ids.pkl', 'wb') as f:
                pickle.dump(product_ids, f)
            print("   ✅ product_ids.pkl")
        
        if embeddings is not None:
            np.save(EMBEDDINGS_DIR / 'product_embeddings.npy', embeddings)
            print("   ✅ product_embeddings.npy")
            
    except Exception as e:
        print(f"⚠️ Erreur sauvegarde FAISS: {e}")


def main():
    """Point d'entrée principal"""
    print("=" * 60)
    print("🚀 ENTRAÎNEMENT DES MODÈLES ML V2")
    print(f"   Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    # 1. Charger les données
    df = load_data()
    if df is None:
        return
    
    # 2. Prétraiter
    df, label_encoders = preprocess_data(df)
    
    # 3. Entraîner les modèles
    price_model, scaler, feature_columns = train_price_model(df)
    demand_model = train_demand_model(df)
    bestseller_model = train_bestseller_model(df)
    
    # 4. Créer l'index FAISS
    faiss_index, product_ids, embeddings = create_faiss_index(df)
    
    # 5. Sauvegarder
    save_models(price_model, scaler, demand_model, bestseller_model, label_encoders, feature_columns)
    save_faiss_index(faiss_index, product_ids, embeddings)
    
    print("\n" + "=" * 60)
    print("✅ ENTRAÎNEMENT TERMINÉ AVEC SUCCÈS!")
    print("=" * 60)
    
    # Résumé
    print("\n📊 RÉSUMÉ:")
    print(f"   Modèles sauvegardés dans: {MODELS_DIR}")
    print(f"   Index FAISS dans: {EMBEDDINGS_DIR}")
    print(f"   Nombre de produits: {len(df)}")
    
    models_status = {
        "price_model": price_model is not None,
        "demand_model": demand_model is not None,
        "bestseller_model": bestseller_model is not None,
        "faiss_index": faiss_index is not None
    }
    
    for model, status in models_status.items():
        icon = "✅" if status else "❌"
        print(f"   {icon} {model}")


if __name__ == "__main__":
    main()
