import requests
from bs4 import BeautifulSoup

asin = "B08N5WRWNW"
url = f"https://www.amazon.com/dp/{asin}"

headers = {
    "User-Agent": "Mozilla/5.0"
}

r = requests.get(url, headers=headers)
soup = BeautifulSoup(r.text, "html.parser")

title = soup.find("span", id="productTitle")
print(title.text.strip())
