"""
Threading : Exécuter plusieurs requêtes en parallèle
→ 10 threads = 10× plus rapide
→ 33 minutes → 3-4 minutes
"""

import csv
import requests
from bs4 import BeautifulSoup
import time
import random
from concurrent. futures import ThreadPoolExecutor, as_completed
from threading import Lock

# --- CONFIGURATION ---
input_file = 'Amazon_Best_Seller_2021_June 2.csv'
output_file = 'resultats_titres.csv'
MAX_WORKERS = 10  # Nombre de threads parallèles
DELAY = (1, 2)    # Délai aléatoire entre requêtes (secondes)

# Lock pour écriture fichier (éviter conflits)
write_lock = Lock()


def get_amazon_title(asin):
    """Récupère le titre Amazon pour un ASIN"""
    url = f"https://www.amazon.com/dp/{asin}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept-Language": "en-US,en;q=0.9"
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            soup = BeautifulSoup(response.content, "html.parser")
            title_tag = soup.find("span", id="productTitle")
            
            if title_tag: 
                return title_tag.get_text().strip()
        
        return "Titre non trouvé"
        
    except Exception as e:
        return f"Erreur:  {str(e)}"


def process_asin(asin, index, writer, total):
    """
    Traite un ASIN et écrit le résultat
    Fonction appelée par chaque thread
    """
    print(f"[{index}/{total}] 🔍 Traitement {asin}.. .", end="", flush=True)
    
    # Récupérer titre
    titre = get_amazon_title(asin)
    
    # Écriture thread-safe dans CSV
    with write_lock: 
        writer.writerow([asin, titre])
    
    print(f" ✅ {titre[: 50]}...")
    
    # Délai aléatoire (éviter ban)
    time.sleep(random.uniform(*DELAY))
    
    return asin, titre


def main():
    """Fonction principale avec threading"""
    
    print("="*60)
    print("🚀 EXTRACTION TITRES AMAZON (MODE PARALLÈLE)")
    print("="*60)
    
    # Lire tous les ASINs
    asins = []
    with open(input_file, 'r', encoding='utf-8', errors='replace') as f:
        reader = csv.reader(f)
        next(reader, None)  # Skip header
        
        for row in reader:
            if row and row[0]: 
                asins.append(row[0])
    
    total = len(asins)
    print(f"\n📊 Total ASINs à traiter:  {total}")
    print(f"⚡ Threads parallèles: {MAX_WORKERS}")
    print(f"⏱️ Estimation:  {(total * 2 / MAX_WORKERS) / 60:.1f} minutes\n")
    
    # Ouvrir fichier output
    with open(output_file, 'w', newline='', encoding='utf-8') as f_out:
        writer = csv.writer(f_out)
        writer.writerow(['ASIN', 'Titre Récupéré'])
        
        # Lancer threads
        start_time = time.time()
        
        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            # Soumettre toutes les tâches
            futures = {
                executor.submit(process_asin, asin, i+1, writer, total): asin 
                for i, asin in enumerate(asins)
            }
            
            # Attendre complétion
            completed = 0
            for future in as_completed(futures):
                completed += 1
                
                try:
                    asin, titre = future.result()
                except Exception as e:
                    print(f"❌ Erreur:  {e}")
        
        elapsed = time.time() - start_time
        
    print("\n" + "="*60)
    print(f"✅ TERMINÉ en {elapsed/60:.1f} minutes")
    print(f"📁 Résultats:  {output_file}")
    print(f"📊 ASINs traités: {completed}/{total}")
    print("="*60)


if __name__ == "__main__":
    main()