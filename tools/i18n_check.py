"""Vérifie une traduction de recettes : python3 tools/i18n_check.py <src.json> <traduction.json>"""
import json, sys
src = {r["id"]: r for r in json.load(open(sys.argv[1]))}
tr = json.load(open(sys.argv[2]))
err = []
for rid, r in src.items():
    t = tr.get(rid)
    if not t:
        err.append(f"{rid}: manquante"); continue
    if not isinstance(t.get("t"), str) or not t["t"].strip(): err.append(f"{rid}: titre vide")
    if len(t.get("i", [])) != len(r["i"]): err.append(f"{rid}: {len(t.get('i', []))} ingrédients au lieu de {len(r['i'])}")
    if len(t.get("s", [])) != len(r["s"]): err.append(f"{rid}: {len(t.get('s', []))} étapes au lieu de {len(r['s'])}")
    if not isinstance(t.get("p"), str): err.append(f"{rid}: astuce manquante")
    for k in ("i", "s"):
        if any(not isinstance(x, str) or not x.strip() for x in t.get(k, [])): err.append(f"{rid}: texte vide dans {k}")
extra = set(tr) - set(src)
print(f"{len(src)} recettes source, {len(tr)} traduites, {len(err)} erreurs, {len(extra)} ids en trop")
for e in err[:30]: print(" ✗", e)
sys.exit(1 if err or extra else 0)
