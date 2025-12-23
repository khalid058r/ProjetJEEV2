# amazon_extractor_chunked.py

"""
Extracteur de titres Amazon avec architecture par batches
Chaque thread gère un batch complet indépendamment
"""

import csv
import requests
from bs4 import BeautifulSoup
import time
import random
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Lock
from datetime import datetime
import os

# ==========================================
# CONFIGURATION
# ==========================================

# Fichiers
INPUT_FILE = 'Amazon_Best_Seller_2021_June 2.csv'
OUTPUT_FILE = 'resultats_titres2.csv'
CACHE_FILE = 'cache_progress.txt'

# Paramètres batches
BATCH_SIZE = 50              # ASINs par batch
MAX_PARALLEL_BATCHES = 3     # Nombre de batches en parallèle
PAUSE_BETWEEN_ROUNDS = 30    # Pause entre rounds (secondes)

# Paramètres requêtes
REQUEST_TIMEOUT = 10
DELAY_BETWEEN_REQUESTS = (1, 2)  # Délai aléatoire (min, max)

# User Agents (rotation)
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15"
]

# Lock pour écriture
write_lock = Lock()
progress_lock = Lock()


# ==========================================
# CLASSE BATCH
# ==========================================

class Batch:
    """Représente un batch d'ASINs à traiter"""
    
    def __init__(self, batch_id, asins):
        self.batch_id = batch_id
        self.asins = asins
        self. results = []
        self.success_count = 0
        self. error_count = 0
        self.start_time = None
        self. end_time = None
    
    def __len__(self):
        return len(self.asins)
    
    def duration(self):
        """Durée de traitement du batch"""
        if self.start_time and self.end_time:
            return self.end_time - self.start_time
        return 0


# ==========================================
# EXTRACTION TITRE
# ==========================================

def get_amazon_title(asin):
    """
    Récupère le titre Amazon pour un ASIN
    
    Returns:
        tuple: (asin, title, status)
        status: 'success' | 'not_found' | 'error' | 'blocked'
    """
    
    url = f"https://www.amazon.com/dp/{asin}"
    headers = {
        "User-Agent": random. choice(USER_AGENTS),
        "Accept-Language": "en-US,en;q=0.9",
        "Accept":  "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests":  "1"
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=REQUEST_TIMEOUT)
        
        # Vérifier si bloqué
        if response.status_code == 503:
            return asin, "BLOQUÉ PAR AMAZON", "blocked"
        
        if response.status_code == 200:
            soup = BeautifulSoup(response.content, "html.parser")
            
            # Chercher le titre
            title_tag = soup.find("span", id="productTitle")
            
            if title_tag:
                title = title_tag.get_text().strip()
                return asin, title, "success"
            else:
                return asin, "Titre non trouvé", "not_found"
        
        else:
            return asin, f"HTTP {response.status_code}", "error"
    
    except requests. Timeout:
        return asin, "Timeout", "error"
    
    except Exception as e:
        return asin, f"Erreur:  {str(e)[:50]}", "error"


# ==========================================
# TRAITEMENT D'UN BATCH (PAR THREAD)
# ==========================================

def process_batch(batch, round_num, total_rounds):
    """
    Traite un batch complet dans un thread dédié
    
    Args: 
        batch: Instance de Batch
        round_num:  Numéro du round
        total_rounds: Total de rounds
    
    Returns:
        Batch:  Batch avec résultats
    """
    
    batch.start_time = time.time()
    
    print(f"\n{'='*60}")
    print(f"🔵 BATCH #{batch.batch_id} (Round {round_num}/{total_rounds})")
    print(f"   ASINs: {len(batch)} | Thread: {id(batch) % 10000}")
    print(f"{'='*60}")
    
    for i, asin in enumerate(batch.asins, 1):
        # Extraction
        asin_id, title, status = get_amazon_title(asin)
        
        # Stocker résultat
        batch. results.append((asin_id, title, status))
        
        # Compteurs
        if status == "success":
            batch. success_count += 1
            icon = "✅"
        elif status == "blocked":
            batch.error_count += 1
            icon = "🚫"
        else: 
            batch.error_count += 1
            icon = "⚠️"
        
        # Affichage
        print(f"  [{i: 2d}/{len(batch)}] {icon} {asin}: {title[:60]}")
        
        # Délai aléatoire (éviter ban)
        if i < len(batch):  # Pas de délai après le dernier
            delay = random.uniform(*DELAY_BETWEEN_REQUESTS)
            time.sleep(delay)
    
    batch.end_time = time.time()
    
    # Résumé batch
    print(f"\n{'─'*60}")
    print(f"✅ BATCH #{batch.batch_id} TERMINÉ")
    print(f"   Durée: {batch.duration():.1f}s")
    print(f"   Succès: {batch.success_count}/{len(batch)}")
    print(f"   Erreurs: {batch.error_count}/{len(batch)}")
    print(f"{'─'*60}\n")
    
    return batch


# ==========================================
# GESTION ROUNDS
# ==========================================

def process_round(batches, round_num, total_rounds):
    """
    Traite un round (plusieurs batches en parallèle)
    
    Args:
        batches: Liste de Batch à traiter
        round_num:  Numéro du round
        total_rounds: Total de rounds
    
    Returns:
        list: Liste de Batch complétés
    """
    
    print(f"\n{'#'*60}")
    print(f"🚀 ROUND {round_num}/{total_rounds}")
    print(f"   Batches en parallèle: {len(batches)}")
    print(f"   Total ASINs ce round: {sum(len(b) for b in batches)}")
    print(f"{'#'*60}")
    
    round_start = time.time()
    completed_batches = []
    
    # Lancer les batches en parallèle
    with ThreadPoolExecutor(max_workers=len(batches)) as executor:
        # Soumettre chaque batch à un thread
        future_to_batch = {
            executor.submit(process_batch, batch, round_num, total_rounds): batch
            for batch in batches
        }
        
        # Attendre complétion
        for future in as_completed(future_to_batch):
            batch = future_to_batch[future]
            
            try:
                completed_batch = future.result()
                completed_batches.append(completed_batch)
                
            except Exception as e:
                print(f"❌ Erreur batch #{batch.batch_id}: {e}")
    
    round_duration = time.time() - round_start
    
    # Résumé round
    total_success = sum(b.success_count for b in completed_batches)
    total_errors = sum(b.error_count for b in completed_batches)
    total_processed = sum(len(b) for b in completed_batches)
    
    print(f"\n{'#'*60}")
    print(f"✅ ROUND {round_num} TERMINÉ")
    print(f"   Durée: {round_duration:.1f}s")
    print(f"   ASINs traités: {total_processed}")
    print(f"   Succès: {total_success} ({total_success/total_processed*100:.1f}%)")
    print(f"   Erreurs: {total_errors} ({total_errors/total_processed*100:.1f}%)")
    print(f"{'#'*60}\n")
    
    return completed_batches


# ==========================================
# SAUVEGARDE RÉSULTATS
# ==========================================

def save_results(all_batches, output_file):
    """Sauvegarde tous les résultats dans un CSV"""
    
    print(f"\n💾 Sauvegarde résultats dans {output_file}...")
    
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['ASIN', 'Titre', 'Statut'])
        
        for batch in all_batches: 
            for asin, title, status in batch. results:
                writer.writerow([asin, title, status])
    
    print(f"✅ {sum(len(b) for b in all_batches)} lignes sauvegardées")


# ==========================================
# FONCTION PRINCIPALE
# ==========================================

def main():
    """Pipeline complet"""
    
    print("\n" + "="*60)
    print("🚀 EXTRACTEUR TITRES AMAZON - MODE CHUNKING")
    print("="*60)
    print(f"⚙️  Configuration:")
    print(f"   - Taille batch: {BATCH_SIZE} ASINs")
    print(f"   - Batches parallèles: {MAX_PARALLEL_BATCHES}")
    print(f"   - Pause entre rounds: {PAUSE_BETWEEN_ROUNDS}s")
    print(f"   - Délai entre requêtes: {DELAY_BETWEEN_REQUESTS}s")
    print("="*60)
    
    # ÉTAPE 1 : Charger ASINs
    print(f"\n📂 Chargement {INPUT_FILE}...")
    
    asins = []
    with open(INPUT_FILE, 'r', encoding='utf-8', errors='replace') as f:
        reader = csv.reader(f)
        next(reader, None)  # Skip header
        
        for row in reader:
            if row and row[0]. strip():
                asins.append(row[0].strip())
    
    total_asins = len(asins)
    print(f"✅ {total_asins} ASINs chargés")
    
    # ÉTAPE 2 : Créer batches
    print(f"\n📦 Création des batches...")
    
    all_batches = []
    for i in range(0, total_asins, BATCH_SIZE):
        batch_id = (i // BATCH_SIZE) + 1
        batch_asins = asins[i: i+BATCH_SIZE]
        batch = Batch(batch_id, batch_asins)
        all_batches.append(batch)
    
    total_batches = len(all_batches)
    print(f"✅ {total_batches} batches créés")
    
    # ÉTAPE 3 : Créer rounds
    rounds = []
    for i in range(0, total_batches, MAX_PARALLEL_BATCHES):
        round_batches = all_batches[i:i+MAX_PARALLEL_BATCHES]
        rounds.append(round_batches)
    
    total_rounds = len(rounds)
    print(f"✅ {total_rounds} rounds planifiés")
    
    # Estimation temps
    avg_time_per_batch = (BATCH_SIZE * 1.5)  # 1.5s par ASIN
    estimated_minutes = (avg_time_per_batch * total_batches / MAX_PARALLEL_BATCHES + 
                        PAUSE_BETWEEN_ROUNDS * (total_rounds - 1)) / 60
    print(f"\n⏱️  Estimation: {estimated_minutes:.1f} minutes")
    
    input(f"\n▶️  Appuyez sur Entrée pour démarrer...")
    
    # ÉTAPE 4 :  Traiter rounds
    start_time = time.time()
    completed_batches = []
    
    for round_num, round_batches in enumerate(rounds, 1):
        # Traiter round
        round_results = process_round(round_batches, round_num, total_rounds)
        completed_batches.extend(round_results)
        
        # Pause entre rounds (sauf dernier)
        if round_num < total_rounds: 
            print(f"\n⏸️  PAUSE {PAUSE_BETWEEN_ROUNDS}s avant prochain round...")
            print(f"   Progression: {len(completed_batches)}/{total_batches} batches")
            print(f"   ASINs traités: {sum(len(b) for b in completed_batches)}/{total_asins}")
            time.sleep(PAUSE_BETWEEN_ROUNDS)
    
    total_duration = time.time() - start_time
    
    # ÉTAPE 5 : Sauvegarder
    save_results(completed_batches, OUTPUT_FILE)
    
    # STATISTIQUES FINALES
    total_success = sum(b.success_count for b in completed_batches)
    total_errors = sum(b.error_count for b in completed_batches)
    
    print("\n" + "="*60)
    print("🎉 EXTRACTION TERMINÉE")
    print("="*60)
    print(f"⏱️  Durée totale: {total_duration/60:.1f} minutes")
    print(f"📊 Résultats:")
    print(f"   - Total traité: {total_asins}")
    print(f"   - Succès: {total_success} ({total_success/total_asins*100:.1f}%)")
    print(f"   - Erreurs:  {total_errors} ({total_errors/total_asins*100:.1f}%)")
    print(f"   - Vitesse: {total_asins/(total_duration/60):.1f} ASINs/minute")
    print(f"\n📁 Fichier résultat: {OUTPUT_FILE}")
    print("="*60)


# ==========================================
# LANCEMENT
# ==========================================

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Interruption utilisateur")
        print("💾 Résultats partiels peuvent être perdus")
    except Exception as e:
        print(f"\n❌ Erreur fatale: {e}")
        import traceback
        traceback.print_exc()