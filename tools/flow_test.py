import sys
from pathlib import Path
from playwright.sync_api import sync_playwright
WWW = Path("/home/claude/ketofamille/app/assets/www/index.html").as_uri()
OUT = Path(sys.argv[1]); errs=[]
with sync_playwright() as pw:
    b = pw.chromium.launch(); pg = b.new_page(viewport={"width":390,"height":844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(WWW)
    pg.fill("input[name=name]","Lalla"); pg.fill("input[name=age]","72"); pg.fill("input[name=height]","158")
    pg.fill("input[name=weight]","74,5"); pg.fill("input[name=goalWeight]","80")
    pg.click("#pform button[type=submit]"); pg.wait_for_timeout(200)
    print("erreur formulaire:", pg.locator("#pformErr").inner_text())
    pg.screenshot(path=OUT/"12-validation.png")
    pg.fill("input[name=goalWeight]","68"); pg.click("#pform button[type=submit]"); pg.wait_for_timeout(300)
    print("profil poids:", pg.evaluate("JSON.parse(localStorage.ketofamille_v1).profiles[JSON.parse(localStorage.ketofamille_v1).current].weight"))
    pg.click("[data-swap=diner]"); pg.wait_for_timeout(200)
    pg.go_back(); pg.wait_for_timeout(300)
    print("feuille fermée par Retour:", pg.locator("#sheet").is_hidden(), "| écran:", pg.locator("#title").inner_text())
    pg.click("#quickAdd"); pg.wait_for_timeout(200); pg.screenshot(path=OUT/"13-ajout-rapide.png")
    pg.click("#qaFree"); pg.fill("#ff input[name=name]","Amandes"); pg.fill("#ff input[name=carbs]","2,5"); pg.click("#ff button[type=submit]"); pg.wait_for_timeout(300)
    n1 = pg.evaluate("Object.values(JSON.parse(localStorage.ketofamille_v1).profiles)[0].log"); 
    pg.click("#toast button"); pg.wait_for_timeout(200)
    k=list(n1.keys())[0]
    print("annuler ok:", len(n1[k]["meals"]), "->", len(pg.evaluate("Object.values(JSON.parse(localStorage.ketofamille_v1).profiles)[0].log")[k]["meals"]))
    print("historique après feuilles, titre:", pg.locator("#title").inner_text())
    pg.goto(WWW+"#/suivi"); pg.wait_for_timeout(200); pg.fill("#wIn","73,9"); pg.click("#wSave"); pg.wait_for_timeout(200)
    pg.screenshot(path=OUT/"14-suivi-saisie.png")
    pg.click("#profileChip"); pg.click("#addP"); pg.wait_for_timeout(400)
    print("ajout membre, écran:", pg.locator("#title").inner_text(), "| feuille cachée:", pg.locator("#sheet").is_hidden())
    pg.goto(WWW+"#/recettes"); pg.wait_for_timeout(200); pg.fill("#q","zzzz"); pg.wait_for_timeout(400)
    pg.screenshot(path=OUT/"15-recherche-vide.png")
    b.close()
print("ERREURS:", errs or "aucune"); sys.exit(1 if errs else 0)
