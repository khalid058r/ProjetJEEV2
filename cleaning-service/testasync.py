import pandas as pd
import asyncio
import aiohttp
import random
from bs4 import BeautifulSoup

# ==========================
# CONFIGURATION
# ==========================
INPUT_CSV = "Amazon_Best_Seller_2021_June 2.csv"
OUTPUT_CSV = "amazon_output.csv"

ASIN_COLUMN = "ASIN"     # ⚠️ adapte si besoin
CHUNK_SIZE = 50
MAX_CONCURRENCY = 5

HEADERS = [
    {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Accept-Language": "en-US,en;q=0.9"
    },
    {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        "Accept-Language": "en-US,en;q=0.9"
    }
]

# ==========================
# SCRAPE UN PRODUIT
# ==========================
async def fetch_product(session, asin):
    url = f"https://www.amazon.com/dp/{asin}"
    headers = random.choice(HEADERS)

    try:
        async with session.get(url, headers=headers, timeout=15) as resp:
            status = resp.status
            html = await resp.text()

            soup = BeautifulSoup(html, "html.parser")
            title_tag = soup.select_one("#productTitle")

            title = title_tag.text.strip() if title_tag else None

            return {
                "ASIN": asin,
                "title": title,
                "status": status
            }

    except Exception as e:
        return {
            "ASIN": asin,
            "title": None,
            "status": "error"
        }

# ==========================
# TRAITER UN CHUNK
# ==========================
async def process_chunk(asins):
    connector = aiohttp.TCPConnector(limit=MAX_CONCURRENCY, ssl=False)
    async with aiohttp.ClientSession(connector=connector) as session:
        tasks = [fetch_product(session, asin) for asin in asins]
        return await asyncio.gather(*tasks)

# ==========================
# MAIN
# ==========================
async def main():
    df = pd.read_csv(INPUT_CSV)

    asins = (
        df[ASIN_COLUMN]
        .dropna()
        .astype(str)
        .unique()
        .tolist()
    )

    print(f"🔹 Total ASIN détectés : {len(asins)}")

    results = []

    for i in range(0, len(asins), CHUNK_SIZE):
        chunk = asins[i:i + CHUNK_SIZE]
        print(f"⏳ Traitement chunk {i//CHUNK_SIZE + 1}")

        chunk_results = await process_chunk(chunk)
        results.extend(chunk_results)

        await asyncio.sleep(random.uniform(3, 6))  # pause anti-blocage

    out_df = pd.DataFrame(results)
    out_df.to_csv(OUTPUT_CSV, index=False)

    print("✅ Traitement terminé")
    print(f"📁 Résultat sauvegardé dans : {OUTPUT_CSV}")

# ==========================
# LANCEMENT (JUPYTER SAFE)
# ==========================
await main()
