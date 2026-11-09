# Brief de traduction des recettes — Keto Famille

Vous traduisez des recettes keto **depuis le français** pour une application familiale marocaine.

Entrée : un fichier JSON (tableau) de recettes : `{"id", "t": titre, "i": [noms d'ingrédients], "s": [étapes], "p": astuce, "tags": [...]}`.
Sortie : un objet JSON `{ "<id>": {"t": "...", "i": [...], "s": [...], "p": "..."} }` avec **exactement le même nombre d'éléments** dans `i` et `s` que la source, dans le même ordre (n'ajoutez pas `tags`).

Règles :
- Traduction naturelle, claire, pour des familles (pas de traduction mot à mot). Conservez températures (°C), durées, quantités et nombres exactement.
- Noms de plats marocains : gardez le nom usuel (tajine, harira, msemen, zaalouk, kefta, chermoula, bastilla…) translittéré dans la langue cible ; en arabe, écrivez-les en arabe (طاجين، حريرة، مسمن، زعلوك، كفتة، شرمولة، بسطيلة…).
- Conservez strictement les mises en garde de sécurité (cuisson à cœur 70 °C, œufs crus, poisson cru, publics fragiles) et les mentions halal (« sans alcool », « halal »).
- Ne traduisez pas les noms de marques ; gardez les émojis s'il y en a.
- Écrivez le JSON progressivement par tranches de ~40 recettes (lisez votre fichier, ajoutez, réécrivez), pour ne rien perdre. Utilisez un script Python pour écrire le JSON (encodage UTF-8, `ensure_ascii=False`), jamais d'édition manuelle de gros fichiers.
- Validation obligatoire à la fin : `python3 /home/claude/ketofamille/tools/i18n_check.py <entrée> <sortie>` doit afficher `0 erreurs, 0 ids en trop`.
- Scripts temporaires uniquement dans `/tmp/claude-0/-home-claude/c5fc4d82-6520-50cc-9807-ec0efe33cf9b/scratchpad/tr-<langue>-<part>/`. N'écrivez aucun autre fichier du projet que votre sortie.
- Réponse finale : une ligne (nombre de recettes traduites, résultat du contrôle).
