"""Teste « Mes prix » : modifier un prix recalcule le coût des recettes ; revenir au prix moyen."""
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
    rid, ing = pg.evaluate("(()=>{const r=RECIPES.find(x=>typeof x.cost==='number');const i=r.ingredients.slice().sort((a,b)=>b.c-a.c)[0];return [r.id,i.ing]})()")
    before = pg.evaluate(f"RECIPES.find(x=>x.id==='{rid}').cost")
    pg.goto(WWW.as_uri() + f"#/prix/{ing}"); pg.wait_for_timeout(300)
    base = pg.locator("#pv").input_value()
    pg.fill("#pv", "abc"); pg.click("#pSave"); err = pg.locator("#pvErr").is_visible()
    newv = float(base.replace(",", ".")) * 2
    pg.fill("#pv", str(newv).replace(".", ",")); pg.click("#pSave"); pg.wait_for_timeout(300)
    after = pg.evaluate(f"RECIPES.find(x=>x.id==='{rid}').cost")
    pg.screenshot(path=OUT / "mes-prix.png")
    pg.reload(); pg.wait_for_timeout(300)
    persisted = pg.evaluate(f"RECIPES.find(x=>x.id==='{rid}').cost")
    pg.goto(WWW.as_uri() + f"#/recette/{rid}"); pg.wait_for_timeout(300)
    pill = pg.locator(".cost-pill").first.inner_text()
    pg.goto(WWW.as_uri() + f"#/prix/{ing}"); pg.wait_for_timeout(300); pg.click("#pBack"); pg.wait_for_timeout(200)
    back = pg.evaluate(f"RECIPES.find(x=>x.id==='{rid}').cost")
    b.close()
print("recette", rid, "| ingrédient", ing, "| coût avant", before, "→ après x2 prix", after, "| après rechargement", persisted, "| retour", back)
print("pastille:", pill, "| message d'erreur sur saisie invalide:", err)
print("ERREURS:", errs or "aucune")
sys.exit(0 if not errs and after > before and persisted == after and back == before and err else 1)
