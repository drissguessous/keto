# 🥑 Keto Famille

Application Android gratuite et hors ligne pour suivre un programme keto, pensée pour la famille et les amis.

**👉 Android : [télécharger KetoFamille.apk](https://github.com/drissguessous/keto/raw/main/telechargement/KetoFamille.apk)** · **iPhone : [page d'installation](https://drissguessous.github.io/keto/iphone.html)** (à ouvrir dans Safari)

## Fonctionnalités

- **Profils** : plusieurs membres de la famille sur le même téléphone, objectifs calculés automatiquement (calories, protéines, lipides, glucides nets).
- **Programme de 4 semaines** : démarrage, adaptation, consolidation, routine — avec objectifs hebdomadaires à cocher.
- **Menu du jour** généré automatiquement (petit-déj, déjeuner, dîner, collation), remplaçable en un geste, et **liste de courses** sur 7 jours.
- **Accompagnement** : compteurs du jour, eau, poids, énergie, conseil quotidien, guide des aliments, FAQ (grippe céto, écarts…).
- **603 recettes complètes** en français, halal : petits-déjeuners, plats (volaille, viande, poisson, végétarien), cuisine marocaine (108 recettes), cuisine du monde, accompagnements, collations, desserts et boissons. Ingrédients ajustables au nombre de personnes, étapes détaillées, illustration propre à chaque recette.
- **Valeurs nutritionnelles calculées** à partir d'une table de 157 ingrédients ([`data/ingredients.json`](data/ingredients.json)) : calories, lipides, protéines et glucides nets par portion, et part de vos besoins du jour.
- **Vraies photos des plats** chargées depuis Wikimedia Commons (licences libres, auteur et licence affichés), mises en cache ; illustration de secours hors connexion. Désactivables dans Profil.
- **Budget par repas** : coût estimé de chaque recette (par portion et au total), du menu du jour et de la liste de courses, à partir de **prix moyens constatés au Maroc** ([`data/prix-*.json`](data/), sources citées par produit). Budget choisi dans le profil (Économique 15 DH, Moyen 25 DH, Confort 40 DH par repas) : les menus le respectent.
- **Mes prix** : chacun peut corriger le prix d'un produit avec ce qu'il paie réellement ; tous les coûts se recalculent.
- **Recherche avancée** : base du repas (œufs, poulet, kefta, saumon, chou-fleur, avocat…), temps, budget, glucides, calories, difficulté, et tri (moins cher, plus rapide, moins de glucides, plus de protéines).
- **Suivi** : courbe de poids, IMC, série de jours keto, historique cliquable.
- **Sauvegarde / restauration** par simple copier-coller, et **profil de démonstration**.

Aucune inscription, aucun serveur : toutes les données restent sur le téléphone. Seule la recherche de photos utilise internet (aucune donnée personnelle n'est envoyée).

## Installer sur un téléphone

**Android** (7.0 minimum)
1. Depuis le téléphone, ouvrir le lien [KetoFamille.apk](https://github.com/drissguessous/keto/raw/main/telechargement/KetoFamille.apk).
2. Ouvrir le fichier ; Android demande d'autoriser l'installation depuis le navigateur ou WhatsApp : accepter.

**iPhone / iPad** (gratuit, sans App Store)

Ouvrir dans **Safari** la page **https://drissguessous.github.io/keto/iphone.html** et toucher « Télécharger Keto Famille » : un profil d'installation ([`KetoFamille.mobileconfig`](telechargement/KetoFamille.mobileconfig)) ajoute l'icône sur l'écran d'accueil (Réglages → Profil téléchargé → Installer). Autre méthode :

1. Ouvrir dans **Safari** `https://drissguessous.github.io/keto/`.
2. Toucher le bouton **Partager** puis **« Sur l'écran d'accueil »**.
3. L'icône Keto Famille apparaît comme une application ; elle fonctionne ensuite hors ligne.

La version web est publiée automatiquement par [`.github/workflows/pages.yml`](.github/workflows/pages.yml) à chaque modification de `app/assets/www/`.

## Construire l'APK

Prérequis : Java 17+ et Python 3. **Aucun SDK Android n'est nécessaire** : `apktool` (smali + aapt2) et `apksigner` sont fournis dans `tools/bin/`.

```bash
./build.sh            # produit dist/KetoFamille.apk signé (v2/v3)
python3 tools/ui_test.py shots     # test d'interface (Playwright), captures dans ./shots
python3 tools/photo_test.py shots  # chargement des photos (réseau simulé)
python3 tools/pwa_test.py          # version iPhone : installation et hors ligne
python3 tools/flow_test.py shots   # parcours clés (annuler, retour, validation, ajout membre)
python3 tools/filters_test.py shots  # filtres avancés et tri
python3 tools/prices_test.py shots   # « Mes prix » : modification et recalcul des coûts
```

## Structure

| Chemin | Rôle |
|---|---|
| [`app/assets/www/`](app/assets/www/) | L'application (HTML/CSS/JS vanilla) |
| [`data/recipes/`](data/recipes/) | Sources des recettes (12 lots JSON) |
| [`data/photo-keywords-*.json`](data/) | Mots-clés de recherche photo par recette |
| [`tools/recipes.py`](tools/recipes.py) | Validation des lots et génération de `recipes.js` (macros calculées) |
| [`app/assets/www/content.js`](app/assets/www/content.js) | Programme, conseils, guide des aliments, FAQ |
| [`app/smali/.../MainActivity.smali`](app/smali/ma/bagile/ketofamille/MainActivity.smali) | Activité Android : WebView plein écran |
| [`app/AndroidManifest.xml`](app/AndroidManifest.xml) | Manifeste (minSdk 24, targetSdk 34) |
| [`docs/revue-ux.md`](docs/revue-ux.md) | Revue UX experte (30 points, avant/après) |
| [`build.sh`](build.sh) | Compilation, alignement, signature |
| [`telechargement/`](telechargement/) | Dernier APK signé, prêt à installer |
| `signing/` | Clé de signature (à conserver pour publier des mises à jour) |

Pour modifier une recette : éditer le lot dans `data/recipes/`, lancer `python3 tools/recipes.py check <lot>` puis `python3 tools/recipes.py build` et `./build.sh`. Pour une nouvelle version, augmenter `versionCode` dans `app/AndroidManifest.xml` et `app/apktool.yml`.

## Avertissement

Ces informations sont générales et ne remplacent pas l'avis d'un médecin. Le keto est déconseillé sans avis médical en cas de grossesse, d'allaitement, de diabète traité, de maladie rénale ou hépatique, et aux mineurs.
