# Brief : relevé de prix au Maroc (novembre 2026)

But : pour chaque ingrédient de votre fichier d'entrée, trouver un **prix de détail réaliste au Maroc, en dirhams (MAD) par kilogramme** (ou par litre ≈ kg pour les liquides), tel que payé par une famille dans une grande surface (Marjane, Carrefour/Label'Vie, Aswak Assalam, BIM) ou au souk/marché.

Méthode :
- Utilisez WebSearch (mode "standard", requêtes courtes en français, ex. « prix poulet kg Maroc 2026 », « Marjane prix saumon », « prix tomate marché Casablanca ») et WebFetch sur les pages de résultats (sites des enseignes, comparateurs, presse marocaine : Le360, Médias24, Hespress FR, L'Economiste, Le Matin, HCP, ONICL). Privilégiez les sources les plus récentes (2025–2026).
- Convertissez en MAD/kg : un produit vendu 25 MAD les 200 g → 125 MAD/kg. Les œufs : prix à l'unité ×  (1000/60). Herbes fraîches vendues en botte : estimez le poids d'une botte (≈ 100 g).
- Si aucune source précise n'existe pour un produit (produits importés rares : érythritol, psyllium, farine d'amande, mascarpone…), cherchez le prix en ligne chez un vendeur marocain (Jumia Maroc, épiceries fines en ligne marocaines, parapharmacies) ; à défaut, faites une estimation raisonnée et marquez `"estime": true`.
- Ingrédients gratuits ou négligeables (eau, sel, poivre) : mettez le prix courant (eau 0, sel ≈ 3 MAD/kg, poivre ≈ 200 MAD/kg) avec `"estime": true` si non sourcé.

Format de sortie (JSON, objet) dans votre fichier de sortie :
```json
{
  "poulet_entier": {"mad_kg": 22, "source": "Le360", "url": "https://…", "date": "2026-10", "estime": false, "note": "poulet vif/abattu, marché"},
  "erythritol": {"mad_kg": 180, "source": "Jumia Maroc", "url": "https://…", "date": "2026", "estime": false, "note": "sachet 500 g à 90 MAD"}
}
```
- Chaque id d'entrée doit figurer exactement une fois ; `mad_kg` est un nombre > 0 (sauf eau = 0).
- `url` : la page réellement consultée (pas d'URL inventée) ; `null` si estimation.
- Restez factuel : n'inventez jamais une source. Mieux vaut `"estime": true` qu'une fausse précision.
- Visez au moins 70 % d'ingrédients sourcés. Limitez-vous à ~40 recherches.
- Vérifiez à la fin : `node -e "const i=require('<entrée>'),o=require('<sortie>');const m=Object.keys(i).filter(k=>!(k in o)||typeof o[k].mad_kg!=='number');console.log(Object.keys(i).length,Object.keys(o).length,'manquants',m)"`.
- N'écrivez aucun autre fichier du projet (scripts temporaires : votre sous-dossier dans /tmp/claude-0/-home-claude/c5fc4d82-6520-50cc-9807-ec0efe33cf9b/scratchpad/prix-<groupe>/).
- Répondez seulement : nombre sourcés / estimés, et les 3 sources principales.
