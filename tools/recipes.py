"""Validation et fusion des lots de recettes.

  python3 tools/recipes.py check data/recipes/lot-03.json   # valide un lot, calcule les macros
  python3 tools/recipes.py build                            # fusionne data/recipes/*.json -> app/assets/www/recipes.js

Les macros par portion sont TOUJOURS calculées à partir de data/ingredients.json
(champ "g" = grammes réellement utilisés pour toute la recette).
"""
import glob
import json
import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ING = {k: v for k, v in json.loads((ROOT / "data/ingredients.json").read_text()).items() if not k.startswith("_")}
CATS = {"petit-dej", "dejeuner", "diner", "collation", "dessert", "boisson", "accompagnement"}
UNITS = {"g", "ml", "c. à s.", "c. à c.", "pièce(s)", "pincée", "tranche(s)", "gousse(s)", "botte", "poignée", ""}
MAX_CARBS = {"dessert": 10, "boisson": 8}


def norm(s):
    s = unicodedata.normalize("NFD", s.lower())
    return re.sub(r"[^a-z0-9]+", " ", "".join(c for c in s if unicodedata.category(c) != "Mn")).strip()


PRICES = {}
for f in sorted(glob.glob(str(ROOT / "data/prix-*.json"))):
    if "prix-input" in f:
        continue
    PRICES.update(json.loads(Path(f).read_text()))


def ing_cost(i):
    """Coût en MAD de la quantité de l'ingrédient utilisée (None si prix inconnu)."""
    pr = PRICES.get(i["ing"])
    return None if pr is None else i["g"] / 1000 * pr["mad_kg"]


def macros(r):
    t = [0.0, 0.0, 0.0, 0.0]
    for i in r["ingredients"]:
        v = ING[i["ing"]]
        for j in range(4):
            t[j] += v[1 + j] * i["g"] / 100
    s = r["servings"]
    return {"kcal": round(t[0] / s), "fat": round(t[1] / s), "protein": round(t[2] / s), "carbs": round(t[3] / s, 1)}


def check(r):
    e = []
    for k, typ in [("id", str), ("title", str), ("category", str), ("emoji", str), ("prep", int), ("cook", int),
                   ("servings", int), ("difficulty", str), ("tags", list), ("ingredients", list), ("steps", list), ("tips", str)]:
        if not isinstance(r.get(k), typ):
            e.append(f"champ {k} manquant ou mauvais type")
    if e:
        return e
    if r["category"] not in CATS:
        e.append(f"catégorie inconnue {r['category']}")
    if r["difficulty"] not in ("Facile", "Moyen"):
        e.append("difficulty doit être Facile ou Moyen")
    if not 1 <= r["servings"] <= 12:
        e.append("servings hors 1..12")
    if not 3 <= len(r["ingredients"]) <= 18:
        e.append("3 à 18 ingrédients attendus")
    if not 4 <= len(r["steps"]) <= 10:
        e.append("4 à 10 étapes attendues")
    for i in r["ingredients"]:
        if i.get("ing") not in ING:
            e.append(f"ingrédient inconnu '{i.get('ing')}' (utiliser un id de data/ingredients.json)")
        if not isinstance(i.get("g"), (int, float)) or i["g"] < 0:
            e.append(f"g invalide pour {i.get('ing')}")
        if i.get("unit", "") not in UNITS:
            e.append(f"unité inconnue '{i.get('unit')}'")
        if not i.get("name"):
            e.append(f"name manquant pour {i.get('ing')}")
    if e:
        return e
    m = macros(r)
    lim = MAX_CARBS.get(r["category"], 10)
    if m["carbs"] > lim:
        e.append(f"glucides nets {m['carbs']} g/portion > {lim}")
    lo = 3 if r["category"] == "boisson" else 40
    if not lo <= m["kcal"] <= 950:
        e.append(f"kcal/portion {m['kcal']} hors {lo}..950 (vérifier les grammes)")
    if r["category"] in ("dejeuner", "diner") and m["protein"] < 15:
        e.append(f"plat principal trop pauvre en protéines ({m['protein']} g)")
    return e


SPOON = {"c. à s.": 25, "c. à c.": 8}


def display(i):
    """Affiche en grammes une cuillère trop « bombée » pour rester cohérent avec les macros."""
    qty, unit = i.get("qty"), i.get("unit", "")
    if qty and unit in SPOON and i["g"] / qty > SPOON[unit]:
        return round(i["g"]), "g"
    return qty, unit


def load(path):
    data = json.loads(Path(path).read_text())
    return data if isinstance(data, list) else data["recipes"]


def cmd_check(path):
    rs = load(path)
    bad = 0
    seen = set()
    for r in rs:
        errs = check(r)
        key = norm(r.get("title", ""))
        if key in seen:
            errs.append("titre en double dans le lot")
        seen.add(key)
        if errs:
            bad += 1
            print(f"✗ {r.get('id')}: " + " ; ".join(errs))
    print(f"{len(rs)} recettes, {bad} en erreur")
    return bad


def cmd_build():
    out, seen_t, seen_id, dropped = [], set(), set(), []
    exf = ROOT / "data/exclude.json"
    seen_t.update(norm(t) for t in (json.loads(exf.read_text()) if exf.exists() else []))  # quasi-doublons écartés
    for f in sorted(glob.glob(str(ROOT / "data/recipes/*.json"))):
        for r in load(f):
            if check(r):
                dropped.append((Path(f).name, r.get("id"), "invalide"))
                continue
            key = norm(r["title"])
            if key in seen_t:
                dropped.append((Path(f).name, r["id"], "doublon"))
                continue
            rid = r["id"]
            n = 2
            while rid in seen_id:
                rid = f"{r['id']}-{n}"; n += 1
            seen_t.add(key); seen_id.add(rid)
            out.append({
                "id": rid, "title": r["title"], "category": r["category"], "emoji": r["emoji"],
                "prep": r["prep"], "cook": r["cook"], "servings": r["servings"], "difficulty": r["difficulty"],
                "tags": r["tags"], "macros": macros(r),
                **({"cost": round(sum(ing_cost(i) for i in r["ingredients"]) / r["servings"], 1)} if PRICES and all(ing_cost(i) is not None for i in r["ingredients"]) else {}),
                "ingredients": [dict(zip(("qty", "unit"), display(i)), name=i["name"], ing=i["ing"], g=i["g"], **({"c": round(ing_cost(i), 2)} if ing_cost(i) is not None else {})) for i in r["ingredients"]],
                "steps": r["steps"], "tips": r["tips"],
            })
    palette = {k: [v[5], v[6]] for k, v in ING.items()}
    js = "window.RECIPES=" + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";\n"
    if PRICES:
        srcs = sorted({v.get("source") for v in PRICES.values() if v.get("source") and not v.get("estime")})
        info = {"updated": "novembre 2026", "sourced": sum(1 for v in PRICES.values() if not v.get("estime")),
                "estimated": sum(1 for v in PRICES.values() if v.get("estime")), "sources": srcs}
        js += "window.PRICE_INFO=" + json.dumps(info, ensure_ascii=False) + ";\n"
        base = {k: [v["mad_kg"], 1 if v.get("estime") else 0] for k, v in PRICES.items()}
        js += "window.PRICES=" + json.dumps(base, separators=(",", ":")) + ";\n"
        js += "window.ING_NAMES=" + json.dumps({k: v[0] for k, v in ING.items()}, ensure_ascii=False, separators=(",", ":")) + ";\n"
    js += "window.ING_LOOK=" + json.dumps(palette, ensure_ascii=False, separators=(",", ":")) + ";\n"
    (ROOT / "app/assets/www/recipes.js").write_text(js)
    from collections import Counter
    print(len(out), "recettes ->", dict(Counter(r["category"] for r in out)))
    for d in dropped:
        print("écartée:", *d)


if __name__ == "__main__":
    if sys.argv[1] == "check":
        sys.exit(1 if cmd_check(sys.argv[2]) else 0)
    cmd_build()
