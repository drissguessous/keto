"""Teste les filtres avancés (base du repas, temps, tri) et le filtre budget."""
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright
WWW = Path(__file__).resolve().parents[1] / "app" / "assets" / "www" / "index.html"
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("shots"); OUT.mkdir(parents=True, exist_ok=True)
errs = []
with sync_playwright() as pw:
    b = pw.chromium.launch(); pg = b.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2)
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(WWW.as_uri()); pg.click("#demo"); pg.wait_for_timeout(300)
    pg.goto(WWW.as_uri() + "#/recettes"); pg.wait_for_timeout(300)
    total = pg.locator("#rcount").inner_text()
    pg.click("#advBtn"); pg.wait_for_timeout(200)
    pg.click("#sheetCard [data-k=bases][data-v=poulet]")
    pg.click("#sheetCard [data-k=time][data-v='30']")
    pg.click("#sheetCard [data-k=sort][data-v=time]")
    pg.screenshot(path=OUT / "filtres-panneau.png")
    pg.click("#advApply"); pg.wait_for_timeout(300)
    res = pg.locator("#rcount").inner_text()
    metas = pg.locator(".recipe-item .meta").all_inner_texts()[:8]
    titles = pg.locator(".recipe-item h3").all_inner_texts()[:5]
    badge = pg.locator("#advBtn .badge").inner_text()
    pg.screenshot(path=OUT / "filtres-resultats.png")
    b.close()
mins = [int(m.split(" min")[0].split("·")[-1].strip()) for m in metas]
print("total:", total, "| poulet ≤30 min trié:", res, "| badge:", badge)
print("temps:", mins, "| triés:", mins == sorted(mins), "| ≤30:", all(x <= 30 for x in mins))
print("exemples:", titles)
print("ERREURS:", errs or "aucune")
sys.exit(0 if not errs and mins == sorted(mins) and all(x <= 30 for x in mins) and badge == "3" else 1)
