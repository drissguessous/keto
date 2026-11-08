"""Teste la version web/iPhone : service worker installé, puis l'app fonctionne hors ligne."""
import subprocess, sys, time
from pathlib import Path
from playwright.sync_api import sync_playwright
WWW = Path(__file__).resolve().parents[1] / "app" / "assets" / "www"
srv = subprocess.Popen([sys.executable, "-m", "http.server", "8765", "-d", str(WWW)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
try:
    with sync_playwright() as pw:
        b = pw.chromium.launch(); ctx = b.new_context(viewport={"width": 390, "height": 844}); pg = ctx.new_page()
        pg.goto("http://localhost:8765/index.html")
        pg.evaluate("navigator.serviceWorker.ready.then(()=>true)")
        pg.reload(); pg.wait_for_timeout(500)
        man = pg.evaluate("fetch('manifest.webmanifest').then(r=>r.json()).then(j=>j.display)")
        ctx.set_offline(True)
        pg.reload(); pg.wait_for_timeout(800)
        title = pg.locator("#title").inner_text()
        pg.click("#demo"); pg.wait_for_timeout(300)
        pg.goto("http://localhost:8765/index.html#/recettes"); pg.wait_for_timeout(500)
        n = pg.locator(".recipe-item").count()
        b.close()
    print("manifest display:", man, "| hors ligne, titre:", title, "| recettes affichées:", n)
    sys.exit(0 if man == "standalone" and n > 0 else 1)
finally:
    srv.terminate()
