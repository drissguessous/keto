"""Corrections de la revue qualité (v1.5) appliquées aux sources : data/recipes, ingrédients, prix, mots-clés photo.
Script idempotent : peut être relancé sans effet supplémentaire.
"""
import glob
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
log = []


def load(p):
    return json.loads(Path(p).read_text())


def dump(p, d):
    Path(p).write_text(json.dumps(d, ensure_ascii=False, indent=1) + "\n")


# ---------- Table nutritionnelle (B2, B5, M4) ----------
ing = load(ROOT / "data/ingredients.json")
ing["cacao"][4] = 21.0            # cacao non sucré : ~21 g nets / 100 g (USDA)
ing["chocolat_noir"][4] = 19.0    # chocolat 85 % : ~19 g nets / 100 g
ing["vanille"] = ["arôme de vanille sans alcool", 50, 0, 0, 12, ing["vanille"][5], ing["vanille"][6]]
ing["beurre_cacahuete"][4] = 12.0
ing["sauce_soja"][0] = "sauce soja sans alcool (halal)"
dump(ROOT / "data/ingredients.json", ing)

# ---------- Prix (M2, M3, M4, Mi-10) ----------
def set_price(file, key, val, note, estime=True):
    p = ROOT / "data" / file
    d = load(p)
    d[key].update({"mad_kg": val, "estime": estime, "note": note})
    if estime:
        d[key]["url"] = d[key].get("url")
    dump(p, d)
    log.append(f"prix {key} -> {val}")

for f in glob.glob(str(ROOT / "data/prix-*.json")):
    d = load(f)
    name = Path(f).name
    if "bouillon" in d:
        set_price(name, "bouillon", 2.5, "Bouillon reconstitué (cube ~1 DH pour 0,5 L) ; le prix au kilo des cubes ne s'applique pas au liquide.")
    if "farine_amande" in d:
        set_price(name, "farine_amande", 140, "Estimation : amandes ~90 DH/kg, poudre d'amande ~120-160 DH/kg en grande surface.")
    if "beurre_cacahuete" in d:
        set_price(name, "beurre_cacahuete", 130, "Estimation pour un pot 100 % cacahuète (sans miel ni sucre).")
    if "psyllium" in d:
        set_price(name, "psyllium", 250, "Estimation herboristerie / parapharmacie (vrac).")

# ---------- Recettes ----------
LIVER = {"l03-foies-volaille-champignons", "l03-terrine-foies-volaille", "l03-foies-volaille-creme-moutarde",
         "l06-boulfaf-foie-agneau", "l06-kebda-mchermla"}
RAW_EGG_NOTE = "Contient des œufs crus : déconseillé aux femmes enceintes, aux enfants de moins de 5 ans et aux personnes âgées ou fragiles."
RAW_FISH_NOTE = "Poisson cru : déconseillé aux femmes enceintes, aux enfants de moins de 5 ans et aux personnes âgées ou fragiles."


def edible_ratio(i, rid):
    n = i["name"].lower()
    if re.search(r"filet|sans arêtes|désoss|en dés|de viande\)|en cubes", n):
        return None
    k = i["ing"]
    if k == "poulet_entier":
        return 0.6 if "aile" in n else 0.65
    if k == "poulet_cuisse":
        return 0.7
    if k in ("dorade", "loup"):
        if "tranche" in n:
            return 0.8
        if re.search(r"vidé|entière|entier|écaill", n):
            return 0.5
    if k == "sardine":
        if "portefeuille" in n:
            return 0.85
        if re.search(r"entière|vidée", n):
            return 0.6
    if k == "agneau_cotelette" and "côtelette" in n:
        return 0.6
    if k == "agneau_epaule" and re.search(r"avec os", n) and "viande" not in n:
        return 0.7
    return None


DUP_UNIT = [(r"^gousses? d['’]\s*", "gousse(s)"), (r"^bottes? de\s+", "botte"), (r"^tranches? de\s+", "tranche(s)"),
            (r"^poignées? de\s+", "poignée")]

for f in sorted(glob.glob(str(ROOT / "data/recipes/lot-*.json"))):
    rs = load(f)
    for r in rs:
        rid = r["id"]
        # B1 : foie cuit à cœur
        if rid in LIVER:
            r["steps"] = [re.sub(r"(ils|elles|le foie|les foies) doi(ven)?t rester (légèrement )?rosés? à cœur|ils doivent rester rosés à cœur|les foies doivent rester (légèrement )?rosés",
                                 "cuisez jusqu'à ce que le cœur ne soit plus rose (70 °C à cœur)", s) for s in r["steps"]]
            r["steps"] = [s.replace("le foie doit rester rosé à cœur", "le foie doit être cuit jusqu'à ce que le cœur ne soit plus rose (70 °C)") for s in r["steps"]]
            r["steps"] = [s.replace(" : ils doivent rester rosés à cœur", " : ils doivent être cuits à cœur, sans trace de rose (70 °C)") for s in r["steps"]]
            if "rosé" in " ".join(r["steps"]):
                log.append("ATTENTION foie encore rosé : " + rid)
        # B2 : vanille sans alcool
        for i in r["ingredients"]:
            if i["ing"] == "vanille":
                i["name"] = re.sub(r"(extrait|arôme|essence) (naturel )?de vanille( liquide)?", "arôme de vanille sans alcool", i["name"])
                if "sans alcool" not in i["name"]:
                    i["name"] = "arôme de vanille sans alcool (ou vanille en poudre)"
        r["steps"] = [re.sub(r"(l['’]|d['’])extrait de vanille", r"\1arôme de vanille sans alcool", s) for s in r["steps"]]
        r["steps"] = [s.replace("extrait de vanille", "arôme de vanille sans alcool") for s in r["steps"]]
        # B4 : œufs / poisson crus
        if rid in ("l11-mousse-chocolat", "l11-tiramisu-keto", "l10-aioli-provencal", "l10-mayonnaise-maison"):
            t = re.sub(r"\s*;?\s*pour les enfants, servez-la avec quelques framboises\.?", ". Servez avec quelques framboises.", r["tips"])
            t = re.sub(r"Utilisez du café décaféiné pour les enfants\.\s*", "Version sans caféine : café décaféiné. ", t)
            t = re.sub(r"\s*;?\s*évitez-la pour les femmes enceintes\.?", ".", t)
            if RAW_EGG_NOTE not in t:
                t = t.rstrip(". ") + ". " + RAW_EGG_NOTE
            r["tips"] = t
        if rid == "l05-tartare-saumon-avocat" and RAW_FISH_NOTE not in r["tips"]:
            r["tips"] = r["tips"].rstrip(". ") + ". " + RAW_FISH_NOTE
        # M10 : steak haché bien cuit
        if rid == "l04-steak-hache-oeuf-cheval-salade":
            r["steps"] = [s.replace("cuisez les steaks 3 minutes par face.", "cuisez les steaks 4 à 5 minutes par face, jusqu'à ce qu'ils soient bien cuits à cœur (70 °C, plus de rose).") for s in r["steps"]]
            r["steps"] = [s.replace("en gardant le jaune coulant.", "jusqu'à ce que le blanc soit pris (jaune bien cuit pour les enfants, les femmes enceintes et les personnes fragiles).") for s in r["steps"]]
        # M5 : sauce soja sans alcool
        for i in r["ingredients"]:
            if i["ing"] == "sauce_soja" and "sans alcool" not in i["name"]:
                i["name"] = i["name"] + " (sans alcool)"
        # Mi-12 : vinaigre de cidre en priorité ; Mi-15 orthographe
        def fix_txt(s):
            s = re.sub(r"vinaigre balsamique", "vinaigre de cidre (ou balsamique)", s)
            s = re.sub(r"vinaigre de vin( blanc| rouge)?", "vinaigre de cidre", s)
            s = s.replace("stevia", "stévia").replace("daurade", "dorade").replace("Daurade", "Dorade")
            s = s.replace("saignante-à point", "saignante ou à point").replace("boîtes à lunch", "boîtes repas")
            return s
        r["title"] = fix_txt(r["title"])
        r["steps"] = [fix_txt(s) for s in r["steps"]]
        r["tips"] = fix_txt(r["tips"])
        for i in r["ingredients"]:
            i["name"] = fix_txt(i["name"])
        # B6 / M9 : poids d'achat (os, arêtes, coquilles) séparé du poids comestible
        for i in r["ingredients"]:
            if "g_achat" in i:
                continue
            k = edible_ratio(i, rid)
            if k:
                i["g_achat"] = i["g"]
                i["g"] = round(i["g"] * k)
                log.append(f"comestible {rid} {i['ing']} {i['g_achat']} -> {i['g']}")
        if rid == "l07-paella-chou-fleur-fruits-mer":
            for i in r["ingredients"]:
                if i["ing"] == "moules":
                    i["g_achat"] = 400
        # M8 : liquides jetés ou en partie absorbés
        for i in r["ingredients"]:
            if rid == "l05-brandade-cabillaud-chou-fleur" and i["ing"] == "lait" and "g_achat" not in i:
                i["g_achat"], i["g"] = i["g"], 50
            if rid == "l05-sardines-panees-amande" and i["ing"].startswith("huile") and "g_achat" not in i:
                i["g_achat"], i["g"] = i["g"], 15
            if rid == "l06-maakouda-chou-fleur" and i["ing"].startswith("huile") and "g_achat" not in i:
                i["g_achat"], i["g"] = i["g"], 15
        # M1 : tanjia
        if rid == "l00-tanjia-agneau-cumin":
            for i in r["ingredients"]:
                if i["name"].startswith("kg d'épaule"):
                    i.update({"qty": 1.2, "unit": "", "name": "kg d'épaule d'agneau en gros morceaux"})
        # Mi-03 : unité répétée dans le nom
        for i in r["ingredients"]:
            for pat, unit in DUP_UNIT:
                if i.get("unit") == unit and re.match(pat, i["name"], re.I):
                    i["name"] = re.sub(pat, "", i["name"], flags=re.I)
            if i.get("unit") == "pièce(s)" and re.match(r"^(demi|½)[- ]", i["name"], re.I):
                i["name"] = re.sub(r"^(demi|½)[- ]", "", i["name"], flags=re.I)
        # Mi-07 : étiquettes cohérentes
        dairy = {"beurre", "smen", "ghee", "creme_fraiche", "creme_liquide", "lait", "yaourt_grec", "fromage_blanc", "mascarpone",
                 "fromage_creme", "ricotta", "mozzarella", "mozzarella_rapee", "emmental", "cheddar", "parmesan", "feta", "chevre",
                 "halloumi", "edam", "fromage_fondu", "jben"}
        if "Sans lactose" in r["tags"] and any(i["ing"] in dairy for i in r["ingredients"]):
            r["tags"].remove("Sans lactose")
        if "Rapide" in r["tags"] and r["prep"] + r["cook"] > 30:
            r["tags"].remove("Rapide")
    dump(f, rs)

# ---------- Mots-clés photo (B3, M7, Mi-14) ----------
HALAL_KW = {
    "ham": "turkey", "bacon": "turkey", "pork": "beef", "prosciutto": "turkey", "sausage": "merguez",
}
REPLACE = {
    "croque monsieur": "grilled cheese sandwich", "quiche lorraine": "vegetable quiche", "carbonara": "creamy zucchini noodles",
    "boeuf bourguignon": "beef stew", "bourguignon": "beef stew", "saltimbocca": "veal escalope", "galette complete": "buckwheat galette egg cheese",
    "eggs benedict": "poached egg hollandaise", "scotch eggs": "meatball egg", "breakfast burrito": "egg wrap",
}
for f in glob.glob(str(ROOT / "data/photo-keywords-*.json")):
    d = load(f)
    for k, v in d.items():
        new = []
        for s in v:
            low = s.lower()
            for a, b in REPLACE.items():
                if a in low:
                    low = low.replace(a, b)
            for a, b in HALAL_KW.items():
                low = re.sub(r"\b" + a + r"\b", b, low)
            new.append(low)
        if len(new) == 2 and new[0] == new[1]:
            new[1] = new[0].split()[-1] if " " in new[0] else "food dish"
        if new != v:
            log.append(f"photo {k}: {v} -> {new}")
        d[k] = new
    dump(f, d)

print("\n".join(l for l in log if not l.startswith("photo")))
print(sum(1 for l in log if l.startswith("photo")), "mots-clés photo modifiés")
