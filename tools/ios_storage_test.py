"""Teste l'avertissement « données effacées après 7 jours » : iPhone dans Safari (bandeau) vs application installée (pas de bandeau)."""
import subprocess, sys, time
from pathlib import Path
from playwright.sync_api import sync_playwright
WWW = Path(__file__).resolve().parents[1] / "app" / "assets" / "www"
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("shots"); OUT.mkdir(parents=True, exist_ok=True)
UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"
srv = subprocess.Popen([sys.executable, "-m", "http.server", "8766", "-d", str(WWW)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1); errs = []; ok = True
try:
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        # 1) Safari (onglet)
        ctx = b.new_context(user_agent=UA, viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, locale="fr-FR")
        pg = ctx.new_page(); pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto("http://localhost:8766/index.html"); pg.wait_for_timeout(500)
        b1 = pg.locator("#storeBanner").is_visible(); conseil = pg.locator("text=installez d'abord l'application").count() > 0
        pg.screenshot(path=OUT / "ios-safari-accueil.png")
        pg.click("#demo"); pg.wait_for_timeout(300)
        pg.goto("http://localhost:8766/index.html#/profil"); pg.wait_for_timeout(300)
        pg.click("text=Où sont mes données"); pg.wait_for_timeout(200)
        info = pg.locator(".data-info").inner_text()
        pg.screenshot(path=OUT / "ios-safari-profil.png", full_page=True)
        pg.click("#sbLater"); pg.wait_for_timeout(200)
        b2 = pg.locator("#storeBanner").is_visible()
        pg.reload(); pg.wait_for_timeout(300); b3 = pg.locator("#storeBanner").is_visible()
        ctx.close()
        # 2) Application installée (standalone)
        ctx = b.new_context(user_agent=UA, viewport={"width": 390, "height": 844}, is_mobile=True, locale="fr-FR")
        ctx.add_init_script("Object.defineProperty(navigator,'standalone',{get:()=>true})")
        pg = ctx.new_page(); pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto("http://localhost:8766/index.html"); pg.wait_for_timeout(400)
        s1 = pg.locator("#storeBanner").is_visible()
        pg.click("#demo"); pg.wait_for_timeout(300); pg.goto("http://localhost:8766/index.html#/profil"); pg.wait_for_timeout(300)
        pg.click("text=Où sont mes données"); info2 = pg.locator(".data-info").inner_text()
        ctx.close(); b.close()
    print("Safari : bandeau", b1, "| conseil accueil", conseil, "| après « Plus tard »", b2, "| après rechargement (même session)", b3)
    print("Safari, texte 7 jours présent:", "7 jours" in info, "| 'cookies' nié:", "ni compte ni cookies" in info)
    print("Installée : bandeau", s1, "| message conservation:", "ne sont pas effacées" in info2)
    print("ERREURS:", errs or "aucune")
    ok = b1 and conseil and not b2 and not b3 and "7 jours" in info and not s1 and "ne sont pas effacées" in info2 and not errs
finally:
    srv.terminate()
sys.exit(0 if ok else 1)
