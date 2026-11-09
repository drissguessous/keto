# Brief : traduction de l'interface et du contenu — Keto Famille

Application keto familiale (Maroc), ton simple et chaleureux, tutoiement à éviter (vouvoiement / forme polie neutre).

1. `/home/claude/ketofamille/data/i18n/ui-strings.json` : tableau de textes d'interface en français. Certains sont des fragments (début ou fin de phrase coupée par du gras) : traduisez le fragment tel quel, en gardant ponctuation et espaces de début/fin.
   - `#` = un nombre (à garder, à la bonne place dans la langue cible) ; `{name}` = prénom (à garder).
   - Gardez émojis, symboles (≈, ›, ✓, ⚠︎, DH, kcal, g, °C) et la casse adaptée.
   - Sortie : `/home/claude/ketofamille/data/i18n/ui.<lang>.json` = objet `{ "<texte français>": "<traduction>" }` avec TOUTES les clés.
2. `/home/claude/ketofamille/data/i18n/content.fr.json` : `{PROGRAM:[{week,title,subtitle,text,goals:[]}], TIPS:[...], FOODS:{oui:[[emoji,nom,détail]],modere:[...],non:[...]}, FAQ:[[question,réponse]]}`.
   - Sortie : `/home/claude/ketofamille/data/i18n/content.<lang>.json` : même structure, mêmes longueurs, `week` et émojis inchangés.
   - Conservez strictement les mises en garde médicales et de sécurité, et les mentions halal.
3. Écrivez les JSON avec un script Python (`ensure_ascii=False`). Vérifiez : mêmes clés que la source pour ui, mêmes longueurs pour content, `#` et `{name}` présents autant de fois que dans la source.
Scratch : `/tmp/claude-0/-home-claude/c5fc4d82-6520-50cc-9807-ec0efe33cf9b/scratchpad/ui-<lang>/`. Ne modifiez aucun autre fichier. Réponse finale : une ligne (nombres traduits, vérifications OK).
