"""Test d'interface : parcourt tous les écrans dans un Chromium mobile et vérifie l'absence d'erreurs JS."""
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

WWW = Path(__file__).resolve().parents[1] / "app" / "assets" / "www" / "index.html"
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("shots")
OUT.mkdir(parents=True, exist_ok=True)
errors = []

with sync_playwright() as pw:
    b = pw.chromium.launch()
    pg = b.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True, locale="fr-FR")
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.on("console", lambda m: m.type == "error" and errors.append(m.text))
    pg.goto(WWW.as_uri())
    pg.screenshot(path=OUT / "01-accueil.png")

    # Création d'un vrai profil
    pg.fill("input[name=name]", "Driss")
    pg.click(".seg[data-name=sex] button[data-v=h]")
    pg.fill("input[name=age]", "50"); pg.fill("input[name=height]", "178")
    pg.fill("input[name=weight]", "92"); pg.fill("input[name=goalWeight]", "82")
    pg.click("#pform button[type=submit]")
    pg.wait_for_timeout(300)
    pg.click("[data-eat]")  # j'ai mangé le petit-déj
    pg.click("[data-w='5']")
    pg.click("[data-task='0']")
    pg.fill("#wIn", "91.4"); pg.click("#wSave")
    pg.wait_for_timeout(300)
    pg.screenshot(path=OUT / "02-aujourdhui.png", full_page=True)

    pg.click("[data-swap=diner]"); pg.wait_for_timeout(200)
    pg.screenshot(path=OUT / "03-remplacer.png")
    pg.click("#sheetCard [data-r]")

    pg.goto(WWW.as_uri() + "#/programme"); pg.wait_for_timeout(200)
    pg.screenshot(path=OUT / "04-programme.png", full_page=True)
    pg.click("#shop"); pg.wait_for_timeout(200)
    pg.screenshot(path=OUT / "05-courses.png")
    pg.mouse.click(195, 30)

    pg.goto(WWW.as_uri() + "#/recettes"); pg.wait_for_timeout(200)
    pg.click("#chips [data-c=marocain]")
    pg.screenshot(path=OUT / "06-recettes.png")
    pg.click(".recipe-item")
    pg.wait_for_timeout(200)
    pg.click("#plus"); pg.click("#fav")
    pg.screenshot(path=OUT / "07-recette.png", full_page=True)
    pg.click("#eat"); pg.click("#sheetCard [data-n='1']")

    pg.goto(WWW.as_uri() + "#/journal"); pg.wait_for_timeout(200)
    pg.screenshot(path=OUT / "08-journal.png")

    # Profil démo pour le suivi
    pg.evaluate("localStorage.clear()")
    pg.goto(WWW.as_uri() + "#/nouveau"); pg.reload(); pg.wait_for_timeout(200)
    pg.click("#demo"); pg.wait_for_timeout(300)
    pg.goto(WWW.as_uri() + "#/suivi"); pg.wait_for_timeout(200)
    pg.screenshot(path=OUT / "09-suivi.png", full_page=True)
    pg.goto(WWW.as_uri() + "#/profil"); pg.wait_for_timeout(200)
    pg.screenshot(path=OUT / "10-profil.png")
    pg.click("#profileChip"); pg.wait_for_timeout(200)
    pg.screenshot(path=OUT / "11-profils.png")
    b.close()

print("ERREURS:", errors or "aucune")
sys.exit(1 if errors else 0)
