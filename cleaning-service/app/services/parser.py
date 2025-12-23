import pandas as pd
from pathlib import Path


REQUIRED_COLUMNS = [
    'ASIN',
    'Category',
    'Price'
]

OPTIONAL_COLUMNS = [
    'Rating',
    'Reviews Count',
    'Rank',
    'No of Sellers',
    'Product Link',
    'name'
]

ALL_EXPECTED_COLUMNS = REQUIRED_COLUMNS + OPTIONAL_COLUMNS

def parse_csv(file_path):

    
    print(f"Lecture:  {file_path}")
    
    if not Path(file_path).exists():
        return pd.DataFrame(), {
            "valid": False,
            "error":  "Fichier introuvable"
        }
    
    try:
        df = pd.read_csv(file_path, on_bad_lines='skip')
        
        print(f"CSV lu:  {len(df)} lignes, {len(df.columns)} colonnes")
        
        validation = validate_csv_structure(df)
        
        if not validation["valid"]: 
            print(f"Structure invalide: {validation['error']}")
            return pd.DataFrame(), validation
        
        df = clean_dataframe(df)
        
        print(f"Parsing terminé:  {len(df)} lignes valides")
        
        return df, {
            "valid": True,
            "warnings": validation. get("warnings", [])
        }
        
    except Exception as e:
        print(f"Erreur:  {e}")
        return pd.DataFrame(), {
            "valid": False,
            "error": str(e)
        }


def validate_csv_structure(df):

    
    print("Validation de la structure...")
    
    csv_columns = [col. strip() for col in df.columns]
    
    missing_required = []
    for col in REQUIRED_COLUMNS:
        found = any(col.lower() == csv_col.lower() for csv_col in csv_columns)
        if not found:
            missing_required.append(col)
    
    if missing_required: 
        return {
            "valid": False,
            "error":  f"Colonnes obligatoires manquantes: {', '.join(missing_required)}"
        }
    
    warnings = []
    for col in csv_columns:
        expected = any(
            col.lower() == exp_col.lower().replace(' ', '_') or 
            col.lower() == exp_col.lower().replace(' ', '')
            for exp_col in ALL_EXPECTED_COLUMNS
        )
        
        if not expected:
            warnings.append(f"Colonne inattendue: {col}")
    
    print(" Structure valide")
    
    return {
        "valid":  True,
        "warnings": warnings
    }



def map_columns_to_standard(df):

    column_mapping = {}
    
    for col in df.columns:
        col_lower = col.strip().lower().replace(' ', '_')
        

        if 'asin' in col_lower:
            column_mapping[col] = 'asin'
        
        elif 'category' in col_lower or 'categorie' in col_lower: 
            column_mapping[col] = 'category'
        
        elif 'price' in col_lower or 'prix' in col_lower: 
            column_mapping[col] = 'price'
        
        elif 'rating' in col_lower or 'note' in col_lower: 
            column_mapping[col] = 'rating'
        
        elif 'reviews' in col_lower and ('count' in col_lower or 'nombre' in col_lower):
            column_mapping[col] = 'reviews_count'
        elif col_lower in ['reviews_count', 'reviewscount', 'reviews']: 
            column_mapping[col] = 'reviews_count'
        
        elif 'rank' in col_lower or 'rang' in col_lower:
            column_mapping[col] = 'rank'
        
        elif 'seller' in col_lower: 
            column_mapping[col] = 'no_of_sellers'
        
        elif 'link' in col_lower or 'url' in col_lower:
            column_mapping[col] = 'product_link'
        
        elif 'name' in col_lower or 'nom' in col_lower or 'title' in col_lower:
            column_mapping[col] = 'name'
        
        else:
            column_mapping[col] = col_lower
    
    df = df.rename(columns=column_mapping)
    
    print(f"Colonnes standardisées: {df.columns.tolist()}")
    
    return df



def clean_dataframe(df):
    
    df = map_columns_to_standard(df)
    
    df = df.dropna(how='all').dropna(axis=1, how='all')
    
    initial_count = len(df)
    df = df.drop_duplicates()
    removed = initial_count - len(df)
    
    if removed > 0:
        print(f"🗑️ {removed} doublons supprimés")
    
    df = df.reset_index(drop=True)
    
    return df


def get_info(df):

    return {
        "rows": len(df),
        "columns": len(df.columns),
        "column_names": df.columns.tolist(),
        "preview": df.head(5).to_dict(orient='records')
    }