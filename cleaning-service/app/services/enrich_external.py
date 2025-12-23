import pandas as pd
import time
from app.services.amazon_client import fetch_product_from_asin


def enrich_external(df: pd.DataFrame, limit: int = 20) -> pd.DataFrame:
    """
    Enrichit un DataFrame avec données externes Amazon
    Limité pour éviter explosion quota
    """

    if "asin" not in df.columns:
        print("❌ Colonne ASIN manquante")
        return df

    enriched_rows = []

    for i, row in df.head(limit).iterrows():
        asin = row["asin"]

        print(f"🔍 Enrichissement ASIN : {asin}")

        data = fetch_product_from_asin(asin)

        for key, value in data.items():
            df.at[i, key] = value

        time.sleep(1)  # Respect quota / throttling

    return df
