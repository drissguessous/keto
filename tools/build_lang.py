"""Assemble les traductions en un fichier par langue : app/assets/www/lang/<code>.js
(interface + programme/conseils/FAQ + recettes). Chaque fichier appelle I18N.apply(...) au chargement.

  python3 tools/build_lang.py
"""
import glob
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
I18N = ROOT / "data/i18n"
OUT = ROOT / "app/assets/www/lang"
OUT.mkdir(parents=True, exist_ok=True)
src_ids = set()
src = {}
for f in sorted(glob.glob(str(I18N / "src-[0-9]*.json"))):
    for r in json.loads(Path(f).read_text()):
        src[r["id"]] = r
        src_ids.add(r["id"])
ui_src = json.loads((I18N / "ui-strings.json").read_text())


def ok_recipe(rid, t):
    s = src.get(rid)
    return bool(s and t.get("t") and len(t.get("i", [])) == len(s["i"]) and len(t.get("s", [])) == len(s["s"]))


for lang in ("ar", "en", "es", "zgh"):
    data = {}
    uif = I18N / f"ui.{lang}.json"
    if uif.exists():
        ui = json.loads(uif.read_text())
        # on ne garde que les traductions qui conservent les repères # et {name}
        data["ui"] = {k: v for k, v in ui.items() if isinstance(v, str) and v.strip()
                      and k.count("#") == v.count("#") and k.count("{name}") == v.count("{name}")}
    cf = I18N / f"content.{lang}.json"
    if cf.exists():
        data["content"] = json.loads(cf.read_text())
    rec = {}
    for f in sorted(glob.glob(str(I18N / f"recipes.{lang}.*.json"))):
        for rid, t in json.loads(Path(f).read_text()).items():
            if ok_recipe(rid, t):
                rec[rid] = {"t": t["t"], "i": t["i"], "s": t["s"], "p": t.get("p", "")}
    if rec:
        data["recipes"] = rec
    js = "/* Traduction générée par tools/build_lang.py — ne pas modifier à la main */\nI18N.apply(" + \
        json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ");\n"
    (OUT / f"{lang}.js").write_text(js)
    print(f"{lang}: interface {len(data.get('ui', {}))}/{len(ui_src)} · contenu {'oui' if 'content' in data else 'non'} · recettes {len(rec)}/{len(src_ids)} · {len(js) // 1024} Ko")
