"""Teste le chargement des photos réelles avec une réponse Wikimedia Commons simulée
(le réseau est simulé : vérifie la logique d'affichage, de cache et de crédit)."""
import json
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

WWW = Path(__file__).resolve().parents[1] / "app" / "assets" / "www"
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("shots")
OUT.mkdir(parents=True, exist_ok=True)
calls, errors = [], []
FAKE = {"query": {"pages": {"1": {"index": 1, "imageinfo": [{
    "mime": "image/jpeg", "width": 1200, "height": 800,
    "url": "https://upload.wikimedia.org/fake.jpg", "thumburl": "https://upload.wikimedia.org/fake.jpg",
    "extmetadata": {"Artist": {"value": "<a href='#'>Jean Dupont</a>"}, "LicenseShortName": {"value": "CC BY-SA 4.0"}}}]}}}}

with sync_playwright() as pw:
    b = pw.chromium.launch()
    pg = b.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2)
    pg.on("pageerror", lambda e: errors.append(str(e)))

    def api(route):
        calls.append(route.request.url)
        route.fulfill(status=200, content_type="application/json", body=json.dumps(FAKE),
                      headers={"Access-Control-Allow-Origin": "*"})
    pg.route("https://commons.wikimedia.org/**", api)
    pg.route("https://upload.wikimedia.org/**", lambda r: r.fulfill(status=200, content_type="image/png",
             body=(WWW / "icon-512.png").read_bytes(), headers={"Access-Control-Allow-Origin": "*"}))
    pg.goto((WWW / "index.html").as_uri())
    pg.click("#demo"); pg.wait_for_timeout(300)
    pg.goto((WWW / "index.html").as_uri() + "#/recettes"); pg.wait_for_timeout(1500)
    n_list = pg.locator(".recipe-item img.photo").count()
    pg.click(".recipe-item"); pg.wait_for_timeout(1200)
    credit = pg.locator(".r-illus .credit").inner_text()
    pg.screenshot(path=OUT / "photo-recette.png")
    before = len(calls)
    pg.go_back(); pg.wait_for_timeout(800)
    b.close()

print("requêtes API:", before, "| photos dans la liste:", n_list, "| crédit:", credit)
print("nouvelles requêtes au retour (doit être 0 grâce au cache):", len(calls) - before)
print("ERREURS:", errors or "aucune")
ok = n_list > 0 and "Jean Dupont" in credit and "CC BY-SA" in credit and len(calls) == before and not errors
sys.exit(0 if ok else 1)
