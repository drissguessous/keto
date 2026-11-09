"""Collecte tous les textes affichés par l'interface (écrans, fenêtres, messages, attributs d'accessibilité)
en parcourant l'application avec Playwright. Sortie : data/i18n/ui-strings.json (modèles, nombres remplacés par #).
Les textes des recettes et de content.js sont exclus (traduits séparément)."""
import json, re, sys
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
W = (ROOT / "app/assets/www/index.html").as_uri()
OBS = r"""
window.__S = new Set();
const ATTRS = ['placeholder','aria-label','title','alt'];
function grab(n){
  if (n.nodeType === 3) { const t = n.nodeValue.trim(); if (t) __S.add(t); return; }
  if (n.nodeType !== 1) return;
  if (n.tagName === 'SCRIPT' || n.tagName === 'STYLE' || n.closest('svg')) return;
  ATTRS.forEach(a => { const v = n.getAttribute && n.getAttribute(a); if (v && v.trim()) __S.add(v.trim()); });
  n.childNodes.forEach(grab);
}
new MutationObserver(ms => ms.forEach(m => { m.addedNodes.forEach(grab); if (m.type==='characterData') grab(m.target); if (m.type==='attributes') grab(m.target); }))
  .observe(document, {subtree:true, childList:true, characterData:true, attributes:true, attributeFilter:ATTRS});
document.addEventListener('DOMContentLoaded', () => grab(document.documentElement));
"""

def run():
    with sync_playwright() as pw:
        b = pw.chromium.launch(); pg = b.new_page(viewport={"width": 390, "height": 844})
        pg.add_init_script(OBS)
        T = lambda ms=150: pg.wait_for_timeout(ms)
        def safe(fn):
            try: fn()
            except Exception as e: print("·", str(e)[:80], file=sys.stderr)
        pg.goto(W); T(400)
        # validation du formulaire puis création d'un profil
        safe(lambda: pg.click("#pform button[type=submit]")); T()
        for k, v in [("name", "Zz"), ("age", "10")]: safe(lambda: pg.fill(f"input[name={k}]", v))
        safe(lambda: pg.click("#pform button[type=submit]")); T()
        for k, v in [("age", "45"), ("height", "170"), ("weight", "80"), ("goalWeight", "90")]: safe(lambda: pg.fill(f"input[name={k}]", v))
        safe(lambda: pg.click("#pform button[type=submit]")); T()
        safe(lambda: pg.fill("input[name=goalWeight]", "70")); safe(lambda: pg.click("#pform button[type=submit]")); T(300)
        # aujourd'hui
        safe(lambda: pg.click("[data-eat]")); T(); safe(lambda: pg.click("[data-eat]")); T()
        safe(lambda: pg.click("[data-w='3']")); safe(lambda: pg.click("#wMinus")); safe(lambda: pg.click("[data-task='1']"))
        safe(lambda: pg.fill("#wIn", "abc")); safe(lambda: pg.click("#wSave")); T()
        safe(lambda: pg.fill("#wIn", "79,5")); safe(lambda: pg.click("#wSave")); T()
        safe(lambda: pg.click("[data-en='3']")); T()
        safe(lambda: pg.click("[data-swap=diner]")); T(); safe(lambda: pg.keyboard.press("Escape")); safe(lambda: pg.go_back()); T()
        safe(lambda: pg.click("#quickAdd")); T(); safe(lambda: pg.go_back()); T()
        # journal + aliment libre
        pg.goto(W + "#/journal"); T(300)
        safe(lambda: pg.click("#addFree")); T(); safe(lambda: pg.click("#sheetCard button[type=submit], #ff button")); T()
        safe(lambda: pg.fill("#ff input[name=name]", "noix")); safe(lambda: pg.click("#ff button")); T()
        # programme + courses
        pg.goto(W + "#/programme"); T(300)
        safe(lambda: [d.click() for d in pg.locator("summary").all()[:20]]); T()
        safe(lambda: pg.click("#shop")); T(); safe(lambda: pg.click("#copyList")); T(); safe(lambda: pg.go_back()); T()
        # recettes : filtres, panneau avancé, vide
        pg.goto(W + "#/recettes"); T(300)
        for c in ["fav", "dessert", "tout"]: safe(lambda: pg.click(f"#chips [data-c={c}]")); T()
        for c in ["eco", "low", "vege", ""]: safe(lambda: pg.click(f"#chips2 [data-c='{c}']")); T()
        safe(lambda: pg.fill("#q", "zzzzqq")); T(400); safe(lambda: pg.click("#resetF2")); T()
        safe(lambda: pg.click("#more")); T()
        safe(lambda: pg.click("#advBtn")); T()
        safe(lambda: pg.click("#sheetCard [data-k=bases][data-v=poulet]")); safe(lambda: pg.click("#advApply")); T()
        # fiche recette
        safe(lambda: pg.click(".recipe-item")); T(300)
        for s in ["#plus", "#minus", "#fav", "#fav"]: safe(lambda: pg.click(s)); T()
        safe(lambda: pg.click("text=Détail par ingrédient")); T()
        safe(lambda: pg.click("#eat")); T(); safe(lambda: pg.click("#sheetCard [data-n='1']")); T()
        # mes prix
        pg.goto(W + "#/prix"); T(300)
        safe(lambda: pg.click("#pchips [data-m='1']")); T(); safe(lambda: pg.click("#pchips [data-m='0']")); T()
        safe(lambda: pg.click(".price-row")); T(); safe(lambda: pg.fill("#pv", "x")); safe(lambda: pg.click("#pSave")); T()
        safe(lambda: pg.fill("#pv", "30")); safe(lambda: pg.click("#pSave")); T(300)
        safe(lambda: pg.click("#pResetAll")); T(); safe(lambda: pg.click("#no")); T()
        # suivi
        pg.goto(W + "#/suivi"); T(300)
        # profil : sauvegarde, restauration, suppression, changement de profil
        pg.goto(W + "#/profil"); T(300)
        safe(lambda: pg.click("text=Où sont mes données")); T()
        safe(lambda: pg.click("#photosToggle")); T(); safe(lambda: pg.click("#photosToggle")); T()
        safe(lambda: pg.click("#export")); T(); safe(lambda: pg.click("#cp")); T(); safe(lambda: pg.go_back()); T()
        safe(lambda: pg.click("#import")); T(); safe(lambda: pg.fill("#imp", "{bad")); safe(lambda: pg.click("#go")); T(); safe(lambda: pg.go_back()); T()
        safe(lambda: pg.click("#del")); T(); safe(lambda: pg.click("#no")); T()
        safe(lambda: pg.click("#profileChip")); T(); safe(lambda: pg.click("#addP")); T(300)
        # démo (nouvel onglet, stockage vide)
        pg.evaluate("localStorage.clear()"); pg.goto(W + "#/nouveau"); pg.reload(); T(300)
        safe(lambda: pg.click("#demo")); T(400)
        for r in ["aujourdhui", "suivi", "journal", "programme", "profil"]: pg.goto(W + "#/" + r); T(250)
        strings = pg.evaluate("Array.from(__S)")
        recipes_txt = set(pg.evaluate("""(() => { const s = new Set();
          RECIPES.forEach(r => { s.add(r.title); r.steps.forEach(x => s.add(x)); s.add(r.tips); r.ingredients.forEach(i => s.add(i.name)); });
          PROGRAM.forEach(w => { s.add(w.title); s.add(w.subtitle); s.add(w.text); w.goals.forEach(g => s.add(g)); });
          TIPS.forEach(t => s.add(t)); FAQ.forEach(([q, a]) => { s.add(q); s.add(a); });
          Object.values(FOODS).forEach(l => l.forEach(([e, n, d]) => { s.add(n); s.add(d); }));
          Object.values(window.ING_NAMES || {}).forEach(n => s.add(n));
          return Array.from(s); })()"""))
        b.close()
    out = set()
    for s in strings:
        s = re.sub(r"\s+", " ", s).strip()
        if not re.search(r"[A-Za-zÀ-ÿ]{2,}", s) or s in recipes_txt:
            continue
        if any(s in t for t in recipes_txt if len(s) > 25):
            continue
        s = s.replace("Démo Amina", "{name}").replace("Zz", "{name}")
        s = re.sub(r"\d+(?:[.,]\d+)?", "#", s)
        out.add(s)
    res = sorted(out)
    (ROOT / "data/i18n/ui-strings.json").write_text(json.dumps(res, ensure_ascii=False, indent=0))
    print(len(res), "textes d'interface")

run()
