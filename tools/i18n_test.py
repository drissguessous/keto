"""Teste chaque langue : chargement sans erreur, sens d'écriture, et textes restés en français (estimation)."""
import re, sys
from pathlib import Path
from playwright.sync_api import sync_playwright
W = (Path(__file__).resolve().parents[1] / "app/assets/www/index.html").as_uri()
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("shots"); OUT.mkdir(parents=True, exist_ok=True)
langs = sys.argv[2:] or ["ar", "en", "es", "zgh"]
FR = re.compile(r"\b(les|des|du|une|avec|pour|vous|votre|vos|jour|recette|recettes|glucides|repas|semaine|ajouter|données|profil|prix)\b", re.I)
bad = 0
with sync_playwright() as pw:
    b = pw.chromium.launch()
    for lg in langs:
        pg = b.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2); errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.add_init_script(f"try{{localStorage.setItem('ketofamille_lang','{lg}')}}catch(e){{}}")
        pg.goto(W); pg.wait_for_timeout(400); pg.click("#demo"); pg.wait_for_timeout(400)
        left = set()
        for r in ["aujourdhui", "programme", "recettes", "suivi", "profil", "prix", "journal"]:
            pg.goto(W + "#/" + r); pg.wait_for_timeout(350)
            if r in ("aujourdhui", "recettes", "profil"): pg.screenshot(path=OUT / f"{lg}-{r}.png")
            txt = pg.evaluate("Array.from(document.querySelectorAll('#view *:not(script)')).filter(e=>e.children.length===0).map(e=>e.textContent.trim()).filter(Boolean)")
            left |= {t for t in txt if FR.search(t)}
        pg.click(".recipe-item") if False else None
        pg.goto(W + "#/recettes"); pg.wait_for_timeout(300); pg.click(".recipe-item"); pg.wait_for_timeout(400)
        pg.screenshot(path=OUT / f"{lg}-recette.png", full_page=True)
        title = pg.locator(".r-hero h2").inner_text()
        d = pg.evaluate("document.documentElement.dir")
        print(f"[{lg}] dir={d} | erreurs={errs or 'aucune'} | titre recette: {title[:50]} | textes encore en français: {len(left)}")
        for t in sorted(left)[:12]: print("    ·", t[:90])
        bad += len(errs)
        pg.close()
    b.close()
sys.exit(1 if bad else 0)
