# 🥑 Keto Famille

Application Android gratuite et hors ligne pour suivre un programme keto, pensée pour la famille et les amis.

**👉 Télécharger l'APK : onglet [Releases](../../releases/latest) → `KetoFamille.apk`**

## Fonctionnalités

- **Profils** : plusieurs membres de la famille sur le même téléphone, objectifs calculés automatiquement (calories, protéines, lipides, glucides nets).
- **Programme de 4 semaines** : démarrage, adaptation, consolidation, routine — avec objectifs hebdomadaires à cocher.
- **Menu du jour** généré automatiquement (petit-déj, déjeuner, dîner, collation), remplaçable en un geste, et **liste de courses** sur 7 jours.
- **Accompagnement** : compteurs du jour, eau, poids, énergie, conseil quotidien, guide des aliments, FAQ (grippe céto, écarts…).
- **603 recettes complètes** en français, halal : petits-déjeuners, plats (volaille, viande, poisson, végétarien), cuisine marocaine (108 recettes), cuisine du monde, accompagnements, collations, desserts et boissons. Ingrédients ajustables au nombre de personnes, étapes détaillées, illustration propre à chaque recette.
- **Valeurs nutritionnelles calculées** à partir d'une table de 157 ingrédients ([`data/ingredients.json`](data/ingredients.json)) : calories, lipides, protéines et glucides nets par portion, et part de vos besoins du jour.
- **Suivi** : courbe de poids, IMC, série de jours keto, historique cliquable.
- **Sauvegarde / restauration** par simple copier-coller, et **profil de démonstration**.

Aucune inscription, aucun serveur : toutes les données restent sur le téléphone.

## Installer sur un téléphone

1. Ouvrir la page Releases depuis le téléphone et télécharger `KetoFamille.apk`.
2. Ouvrir le fichier ; Android demande d'autoriser l'installation depuis le navigateur ou WhatsApp : accepter.
3. Android 7.0 minimum.

## Construire l'APK

Prérequis : Java 17+ et Python 3. **Aucun SDK Android n'est nécessaire** : `apktool` (smali + aapt2) et `apksigner` sont fournis dans `tools/bin/`.

```bash
./build.sh            # produit dist/KetoFamille.apk signé (v2/v3)
python3 tools/ui_test.py shots   # test d'interface (Playwright), captures dans ./shots
```

## Structure

| Chemin | Rôle |
|---|---|
| [`app/assets/www/`](app/assets/www/) | L'application (HTML/CSS/JS vanilla) |
| [`data/recipes/`](data/recipes/) | Sources des recettes (12 lots JSON) |
| [`tools/recipes.py`](tools/recipes.py) | Validation des lots et génération de `recipes.js` (macros calculées) |
| [`app/assets/www/content.js`](app/assets/www/content.js) | Programme, conseils, guide des aliments, FAQ |
| [`app/smali/.../MainActivity.smali`](app/smali/ma/bagile/ketofamille/MainActivity.smali) | Activité Android : WebView plein écran |
| [`app/AndroidManifest.xml`](app/AndroidManifest.xml) | Manifeste (minSdk 24, targetSdk 34) |
| [`build.sh`](build.sh) | Compilation, alignement, signature |
| `signing/` | Clé de signature (à conserver pour publier des mises à jour) |

Pour modifier une recette : éditer le lot dans `data/recipes/`, lancer `python3 tools/recipes.py check <lot>` puis `python3 tools/recipes.py build` et `./build.sh`. Pour une nouvelle version, augmenter `versionCode` dans `app/AndroidManifest.xml` et `app/apktool.yml`.

## Avertissement

Ces informations sont générales et ne remplacent pas l'avis d'un médecin. Le keto est déconseillé sans avis médical en cas de grossesse, d'allaitement, de diabète traité, de maladie rénale ou hépatique, et aux mineurs.
