# app/tests/test_parser.py

import sys
from pathlib import Path

# Ajouter le dossier racine au path Python
sys.path.insert(0, str(Path(__file__).parent. parent. parent))

# Maintenant l'import fonctionne
from app.services.parser import parse_csv, get_info

# Tester avec votre fichier
df, validation = parse_csv("Amazon_Best_Seller_2021_June 2.csv")

if validation["valid"]:
    print("\n✅ SUCCÈS !")
    info = get_info(df)
    print(f"Lignes: {info['rows']}")
    print(f"Colonnes: {info['columns']}")
    print(f"Noms colonnes: {info['column_names']}")
    print(f"\nAperçu:")
    print(df.head())
else:
    print(f"\n❌ ERREUR:  {validation['error']}")