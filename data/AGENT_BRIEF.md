# Brief rédaction de recettes — Keto Famille

Vous écrivez des recettes keto **en français** pour une application familiale (utilisateurs au Maroc).
Règles : halal (pas de porc, pas d'alcool, pas de gélatine animale → agar-agar), ingrédients trouvables au Maroc,
recettes **réellement cuisinables**, étapes précises (températures, durées, gestes), quantités réalistes.

## Format du fichier (JSON, tableau)
```json
[
  {
    "id": "slug-unique-en-minuscules",
    "title": "Titre clair et appétissant",
    "category": "petit-dej | dejeuner | diner | collation | dessert | boisson | accompagnement",
    "emoji": "un seul emoji alimentaire",
    "prep": 10, "cook": 15, "servings": 4,
    "difficulty": "Facile | Moyen",
    "tags": ["Rapide", "Végétarien", "Sans lactose", "Batch cooking", "Marocain", "Famille", "Monde", "Économique"],
    "ingredients": [
      {"ing": "oeuf", "g": 240, "qty": 4, "unit": "pièce(s)", "name": "œufs"},
      {"ing": "huile_olive", "g": 15, "qty": 1, "unit": "c. à s.", "name": "huile d'olive"},
      {"ing": "sel", "g": 2, "qty": null, "unit": "pincée", "name": "sel"}
    ],
    "steps": ["Étape 1 …", "Étape 2 …", "…"],
    "tips": "Une astuce utile (variante, conservation, préparation à l'avance)."
  }
]
```
- `ing` : **obligatoirement** un identifiant de `/home/claude/ketofamille/data/ingredients.json` (liste des ids dans `data/ingredient-ids.txt`). Choisir le plus proche. Ne jamais inventer d'id.
- `g` : grammes (ou ml) **pour toute la recette**, utilisés pour calculer les valeurs nutritionnelles. Repères : 1 œuf ≈ 60 g, 1 c. à s. huile ≈ 13 g, 1 c. à s. épices ≈ 7 g, 1 c. à c. ≈ 3–5 g, 1 gousse d'ail ≈ 5 g, 1 oignon moyen ≈ 110 g, 1 avocat (chair) ≈ 140 g, 1 citron (jus) ≈ 40 g.
- `qty`/`unit`/`name` : ce qui est affiché à l'utilisateur. Unités autorisées : `g`, `ml`, `c. à s.`, `c. à c.`, `pièce(s)`, `pincée`, `tranche(s)`, `gousse(s)`, `botte`, `poignée`, `""`. `qty` peut être null (ex. « sel, poivre »).
- Ne pas mettre de macros : elles sont calculées automatiquement.
- Contraintes vérifiées par le script : ≤ 10 g de glucides nets par portion (8 pour boissons), 40–950 kcal/portion (boissons : 3–950), plats déjeuner/dîner ≥ 15 g de protéines/portion, 4–10 étapes, 3–18 ingrédients. Oignon, carotte, tomate, ail, concentré de tomate : en petite quantité.
- `id` préfixé par le numéro de lot (ex. `l05-tajine-poulet-olives`) pour éviter les collisions.
- Variez vraiment : pas deux recettes qui ne diffèrent que d'une épice. Titres tous différents.

## Validation (obligatoire)
`python3 /home/claude/ketofamille/tools/recipes.py check <votre fichier>` doit afficher `0 en erreur`. Corrigez jusqu'à y arriver.
Écrivez par tranches de 10–15 recettes (ajoutez au fichier, validez), pour ne pas perdre de travail.
Ne modifiez AUCUN autre fichier que le vôtre. Répondez à la fin seulement : nombre de recettes valides et nombre par catégorie.
