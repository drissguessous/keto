"""Parcourt l'app dans une langue traduite et liste les textes d'interface restés en français
(hors contenu des recettes). Ajoute les modèles manquants à data/i18n/ui-strings.json et les écrit dans data/i18n/ui-missing.json."""
import json, re, sys
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT = Path(__file__).resolve().parents[1]; W = (ROOT / "app/assets/www/index.html").as_uri()
LG = sys.argv[1] if len(sys.argv) > 1 else "en"
FRW = re.compile(r"[éèêàùçôîœ]|\b(les|des|du|une|avec|pour|vous|votre|vos|jour|jours|recette|recettes|glucides|repas|semaine|ajouter|données|profil|prix|par|sur|dans|plus|pas|mon|mes|ce|cette|aucun|toutes?|restantes?|personnes?|portion|minutes?|heures?)\b", re.I)
JS = r"""() => { const out = new Set(); const walk = (n) => { if (n.nodeType === 3) { const t = n.nodeValue.trim(); if (t && I18N.t(t) == null) out.add(t); return; }
  if (n.nodeType !== 1 || n.tagName === 'SCRIPT' || n.tagName === 'STYLE' || n.tagName === 'TEXTAREA' || n.closest('svg') || n.hasAttribute('data-notr')) return;
  ['placeholder','aria-label','title','alt'].forEach(a => { const v = n.getAttribute(a); if (v && I18N.t(v) == null) out.add(v.trim()); });
  n.childNodes.forEach(walk); }; walk(document.body); return Array.from(out); }"""
found = set()
with sync_playwright() as pw:
    b = pw.chromium.launch(); pg = b.new_page(viewport={"width": 390, "height": 844})
    pg.add_init_script(f"try{{localStorage.setItem('ketofamille_lang','{LG}')}}catch(e){{}}")
    grab = lambda: found.update(pg.evaluate(JS))
    T = lambda ms=200: pg.wait_for_timeout(ms)
    def safe(f):
        try: f()
        except Exception: pass
    pg.goto(W); T(400); grab()
    safe(lambda: pg.click("#pform button[type=submit]")); T(); grab()
    safe(lambda: pg.click("#demo")); T(400)
    for r in ["aujourdhui", "programme", "recettes", "suivi", "profil", "prix", "journal"]:
        pg.goto(W + "#/" + r); T(300); safe(lambda: [d.click() for d in pg.locator("summary").all()[:12]]); grab()
    pg.goto(W + "#/aujourdhui"); T(300)
    for s in ["[data-swap=diner]", "#quickAdd"]:
        safe(lambda: pg.click(s)); T(); grab(); safe(lambda: pg.go_back()); T()
    pg.goto(W + "#/programme"); T(300); safe(lambda: pg.click("#shop")); T(); grab(); safe(lambda: pg.go_back()); T()
    pg.goto(W + "#/recettes"); T(300); safe(lambda: pg.click("#more")); T(); grab()
    safe(lambda: pg.click("#advBtn")); T(); grab(); safe(lambda: pg.click("#advApply")); T()
    safe(lambda: pg.click(".recipe-item")); T(300); safe(lambda: pg.click("text=/Détail|Detail|تفاصيل|Detalle/")); grab()
    safe(lambda: pg.click("#eat")); T(); grab(); safe(lambda: pg.go_back()); T()
    pg.goto(W + "#/journal"); T(300); safe(lambda: pg.click("#addFree")); T(); grab(); safe(lambda: pg.go_back()); T()
    pg.goto(W + "#/prix"); T(300); safe(lambda: pg.click(".price-row")); T(); grab(); safe(lambda: pg.go_back()); T()
    pg.goto(W + "#/profil"); T(300)
    for s in ["#export", "#import", "#del", "#profileChip"]:
        safe(lambda: pg.click(s)); T(); grab(); safe(lambda: pg.go_back()); T()
    recipe_txt = set(pg.evaluate("(() => { const s = new Set(); RECIPES.forEach(r => { s.add(r.title); r.steps.forEach(x => s.add(x)); s.add(r.tips); r.ingredients.forEach(i => s.add(i.name)); }); return Array.from(s); })()"))
    names = pg.evaluate("I18N.names")
    b.close()
miss = set()
for s in found:
    s = re.sub(r"\s+", " ", s).strip()
    if s in recipe_txt or any(s in t for t in recipe_txt if len(s) > 20):
        continue
    for n in names: s = s.replace(n, "{name}")
    if not FRW.search(s.replace("{name}", "")):
        continue
    miss.add(re.sub(r"\d+(?:[.,]\d+)?", "#", s))
miss = sorted(miss)
ui = json.loads((ROOT / "data/i18n/ui-strings.json").read_text())
new = [m for m in miss if m not in ui]
(ROOT / "data/i18n/ui-missing.json").write_text(json.dumps(new, ensure_ascii=False, indent=0))
print(len(new), "textes manquants"); print("\n".join(new[:40]))
