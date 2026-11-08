# Revue UX/UI — Keto Famille

*Revue du 8 novembre 2026. Base de code : `app/assets/www/` (version web vanilla, WebView Android et PWA iPhone).*
*Captures d'écran : `tools/ui_test.py` sur un écran de 390 × 844 px (iPhone 12/13/14), à densité ×2.*

## 1. Synthèse

Keto Famille repose déjà sur une base solide. L'identité visuelle est chaleureuse et cohérente (vert, avocat, fond crème). Le contenu est riche et ancré dans la cuisine marocaine. L'application fonctionne hors ligne, sans compte, et chaque écran garde une seule colonne facile à lire.

La revue a porté sur cinq parcours clés : premier lancement, « ajouter ce que j'ai mangé », trouver une recette, suivre son poids et ajouter un membre de la famille. Elle a fait ressortir trois grandes familles de problèmes, qui gênent surtout le public visé (parents et grands-parents, souvent peu à l'aise avec le numérique) :

1. **Accessibilité de base insuffisante.** Le zoom était bloqué (`user-scalable=no`), beaucoup de cibles tactiles faisaient moins de 44 px, plusieurs textes mesuraient 10 à 12 px et certains contrastes étaient trop faibles (la jauge des glucides en vert avocat sur crème avait un contraste de 1,2:1).
2. **Navigation fragile.** Le bouton Retour du téléphone ne fermait pas les fenêtres du bas : il quittait l'écran situé dessous. Ces fenêtres n'avaient pas de bouton « Fermer » visible, et l'écran remontait en haut à chaque toucher, par exemple à chaque verre d'eau coché.
3. **Parcours essentiels peu visibles ou sans filet de sécurité.** Le journal n'était accessible que par un petit lien « Journal › ». On ne pouvait pas noter son poids depuis l'onglet Suivi. Aucune action ne pouvait être annulée. La saisie de « 78,5 » (virgule française) n'était pas fiable. Les erreurs du formulaire n'étaient pas expliquées et rien ne signalait le profil de démonstration.

**Bilan : 30 problèmes relevés, dont 4 critiques, 13 majeurs et 13 mineurs. 29 sont corrigés dans cette passe et 1 mineur est reporté (m13). S'y ajoute un point hors du périmètre (H1, cache de `sw.js`).** Tous les tests automatiques passent (`ui_test.py`, `photo_test.py`, `pwa_test.py`).

## 2. Points forts

- **Identité visuelle forte et apaisante.** Le vert profond, l'avocat et le crème donnent une ambiance « cuisine familiale » plutôt que « application de régime ».
- **Contenu local et concret.** Msemen, harira, tajines, kefta et smen figurent dans les recettes, le guide des aliments parle de chebakia et de dattes, et le filtre « Marocain » existe.
- **Écran « Aujourd'hui » bien pensé.** Il montre une seule chose à faire à la fois : manger le plat proposé, cocher un verre d'eau, cocher un objectif.
- **Respect de la vie privée et gratuité.** L'application fonctionne sans compte, garde les données sur le téléphone et marche hors ligne. C'est clairement annoncé dès l'accueil.
- **Prudence médicale.** L'avertissement apparaît à la création du profil, les cibles ont des planchers caloriques, le programme est réservé aux adultes et la FAQ est rédigée avec soin.
- **Profil de démonstration.** Il permet de découvrir l'application avant de saisir quoi que ce soit, ce qui la rend plus simple à présenter en famille.
- **Recettes adaptables.** Le nombre de personnes est réglable et les fractions (½, ¼) restent lisibles. Les étapes peuvent être cochées et chaque recette indique sa part des objectifs du jour.
- **Libellés en français simple** et typographie système de bonne taille dans l'ensemble (16 px de base).

## 3. Problèmes classés par sévérité

Légende des heuristiques : **N1–N10** = les dix heuristiques de Nielsen (N1 visibilité de l'état, N2 correspondance avec le monde réel, N3 contrôle et liberté, N4 cohérence, N5 prévention des erreurs, N6 reconnaissance plutôt que rappel, N7 flexibilité, N8 esthétique minimaliste, N9 aide à la récupération des erreurs, N10 aide et documentation). **WCAG** = critère WCAG 2.2 niveau AA.

### 3.1 Critiques

| # | Écran | Problème | Heuristique | Recommandation | Corrigé |
|---|---|---|---|---|---|
| C1 | Toute l'application | `user-scalable=no` empêche de zoomer avec deux doigts. C'est bloquant pour les personnes âgées ou malvoyantes. | WCAG 1.4.4 Redimensionnement du texte | Retirer `user-scalable=no` de la balise `viewport`. | ✅ Oui |
| C2 | Toutes les fenêtres du bas (remplacer un plat, portions, courses, profils, sauvegarde) | Le bouton Retour d'Android et le geste retour d'iOS ne ferment pas la fenêtre : ils reviennent à l'écran précédent sous la fenêtre. Aucun bouton « Fermer » n'est visible, il faut deviner qu'on peut toucher la zone grisée. | N3, N6 ; WCAG 2.1.2 (touche Échap) | Ajouter une entrée d'historique à l'ouverture pour que Retour ferme la fenêtre. Ajouter un bouton « ✕ Fermer » de 44 px et gérer la touche Échap. | ✅ Oui |
| C3 | Aujourd'hui, Recettes, Profil (formulaires de poids) | Les champs `type="number"` refusent ou vident « 78,5 » sur certains claviers Android en français : la virgule est rejetée et la valeur lue est vide. Le message « Poids invalide » ne dit pas quoi faire. | N2, N5, N9 ; WCAG 3.3.1, 3.3.3 | Utiliser `type="text"` avec `inputmode="decimal"`, accepter la virgule et le point, afficher un exemple (« Ex. 78,5 ») et un message d'erreur qui explique. | ✅ Oui |
| C4 | Toute l'application | De nombreuses cibles tactiles mesurent moins de 44 px : bouton retour (32 px), puce profil (≈ 30 px), « Changer » (≈ 32 px), verres d'eau (36 px de large), boutons − / + (36 px), boutons des cartes à choix (≈ 34 px), ✕ du journal (≈ 32 px), onglets inférieurs. | WCAG 2.5.8 Taille de la cible (minimum), Apple et Material ≥ 44–48 px | Hauteur minimale de 44 px partout et de 48 px pour les boutons principaux. Verres d'eau en grille 4 × 2 sur toute la largeur. | ✅ Oui |

### 3.2 Majeurs

| # | Écran | Problème | Heuristique | Recommandation | Corrigé |
|---|---|---|---|---|---|
| M1 | Aujourd'hui | Contraste insuffisant des jauges : avocat sur crème à 1,16:1 et ambre à 2,2:1. L'état « dépassé » n'est signalé que par la couleur rouge. | WCAG 1.4.11 Contraste non textuel, 1.4.1 Utilisation de la couleur | Jauges en `--avocado-ink` (#58801a) et `--amber-ink` (#9a6210), avec un contraste d'au moins 3:1. Ajouter le mot « dépassé » sous la jauge et un libellé vocal à chaque jauge. | ✅ Oui |
| M2 | Toute l'application | Le gris secondaire #6b766d sur fond crème atteint 4,24:1, sous le seuil de 4,5:1 pour du texte de 11 à 13 px. Le blanc à 80–85 % sur le bandeau vert est limite. | WCAG 1.4.3 Contraste | Passer `--muted` à #5d685f (5,2:1). Mettre le texte du bandeau vert en blanc plein. Passer le rouge en #a63f2b (5,3:1 sur fond rosé). | ✅ Oui |
| M3 | Toute l'application | Textes trop petits pour un public âgé : libellés des onglets (11 px), unités des jauges (10 px), légendes des statistiques et des valeurs nutritionnelles (11 px), métadonnées (12,5 px), axes de la courbe (10 px). | WCAG 1.4.4 ; lisibilité pour les seniors | Taille minimale de 12,5 px pour les légendes et de 14 px pour le texte secondaire. Axes de la courbe en 12 px. | ✅ Oui |
| M4 | Aujourd'hui → Journal | Le journal, cœur du parcours « ajouter ce que j'ai mangé », n'est accessible que par un petit lien « Journal › » de 13 px. Il n'existe aucun bouton pour ajouter un repas qui n'est pas au menu. | N6, N7 | Ajouter deux gros boutons sous les jauges, « 📋 Mon journal (n) » et « ＋ Ajouter un repas ». Le second ouvre un choix : une recette, autre chose, ou voir mon journal. | ✅ Oui |
| M5 | Aujourd'hui, Journal, Recette | Les actions ne peuvent pas être annulées : retirer un plat (✕) le supprime sans confirmation ni retour possible, et un « J'ai mangé » touché par erreur n'est signalé que par un message bref. | N3, N5 | Le message qui confirme l'action propose maintenant un bouton « Annuler » pendant 5 s, pour les ajouts comme pour les retraits. | ✅ Oui |
| M6 | Suivi | Pour noter son poids, il faut le savoir et aller sur Aujourd'hui, carte « Mon bilan rapide », vers le bas de l'écran. L'onglet Suivi ne permet pas cette saisie. | N6, N7 ; découvrabilité | La carte « Noter mon poids » est maintenant en haut de Suivi, réutilisée sur Aujourd'hui, avec « Déjà noté aujourd'hui : 78,4 kg ». | ✅ Oui |
| M7 | Toute l'application | Chaque nouveau rendu ramène l'écran en haut : cocher un verre d'eau ou un objectif fait « sauter » la page, ce qui désoriente. | N1, N3 | Garder la position de défilement quand on redessine le même écran. | ✅ Oui |
| M8 | Création et modification du profil | Il n'y a pas de validation visible : âge 12, taille 1,78 m saisie « 1.78 » ou poids visé supérieur au poids actuel avec l'objectif « Perdre » sont acceptés, ou bien refusés par le navigateur avec une infobulle anglaise ou peu lisible. | N5, N9 ; WCAG 3.3.1, 3.3.3 | Validation en français avec un message clair, le champ concerné encadré en rouge et le curseur placé dedans. Des exemples dans chaque champ. | ✅ Oui |
| M9 | Profil | Le champ « Poids actuel » du profil modifie en réalité le poids **de départ**, ce qui fausse « kg depuis le début ». C'est un piège courant. | N2, N5 | Renommer le champ en « Poids de départ (kg) » dans la modification, avec une explication et un renvoi vers Suivi pour le poids du jour. | ✅ Oui |
| M10 | Recettes | Le second rang de filtres défile horizontalement sans indice visible : « ≤ 3 g glucid… » est coupé. Les symboles « ≤ » et 📉 sont abstraits. Aucun bouton ne permet d'effacer les filtres, et sans résultat on reste bloqué. | N1, N2, N6, N9 | Filtres renvoyés à la ligne et précédés d'un titre (« Type de plat », « Ingrédient principal et envies »). Libellés en clair (« Rapide (20 min max) », « Très peu de glucides (3 g max) »), lien « Effacer les filtres », bouton de réinitialisation quand rien ne correspond, croix pour vider la recherche. | ✅ Oui |
| M11 | Premier lancement | Le profil de démonstration est proposé tout en bas, sous un long formulaire. Une fois chargé, rien n'indique qu'on est en mode démo ni comment créer son vrai profil. | N1, N6 | Bouton « 👀 Juste regarder » sous la présentation, avant le formulaire. Bandeau « profil de démonstration » sur Aujourd'hui avec le bouton « Créer mon vrai profil », et badge sur Profil. | ✅ Oui |
| M12 | Profil, Restaurer | Restaurer une sauvegarde **remplace tous les profils** dès le toucher, sans confirmation. Un texte mal collé ne donne qu'un message bref. | N5, N9 | Avertissement visible, message d'erreur durable, puis confirmation qui liste les profils contenus dans la sauvegarde. | ✅ Oui |
| M13 | Ajouter un membre de la famille | La fonction est cachée derrière la puce du nom en haut à droite, qui ne ressemble pas à un bouton, et derrière un bouton en bas de Profil. | N6 ; découvrabilité | Ajouter un « ▾ » à la puce, une carte « Ma famille » en haut de Profil et un titre explicite dans la fenêtre (« Qui utilise l'application ? »), où le profil actif est marqué « ✓ Profil actif ». | ✅ Oui |

### 3.3 Mineurs

| # | Écran | Problème | Heuristique | Recommandation | Corrigé |
|---|---|---|---|---|---|
| m1 | Toute l'application | Les nombres issus des recettes s'affichent avec un point décimal (« 2.2 g »), alors que les statistiques utilisent la virgule. | N4, N2 | Virgule décimale partout. | ✅ Oui |
| m2 | Formulaires | Les boutons Sexe, Objectif et Glucides se distinguent à peine, l'option choisie n'étant qu'un fond blanc sur crème. Lecteur d'écran : état non annoncé. | WCAG 1.4.11, 4.1.2 | Option choisie en vert plein avec « ✓ », `aria-pressed` et groupe étiqueté. | ✅ Oui |
| m3 | Aujourd'hui | Les émojis d'énergie sont sans libellé : 😕 contre 🙂 est ambigu, et rien n'est lu au lecteur d'écran. | N2, WCAG 1.1.1 | Libellé sous chaque émoji (Épuisé, Fatigué, Correct, En forme, Super) et `aria-label`. | ✅ Oui |
| m4 | Aujourd'hui | Eau : il est peu évident qu'on retire un verre en touchant le dernier, et l'équivalence d'un verre n'est pas donnée. | N6, N10 | Consigne « 1 verre ≈ 25 cl » et lien « − Retirer un verre ». | ✅ Oui |
| m5 | Onglets du bas | L'onglet actif ne se distingue que par la couleur, et `aria-current` est absent. | WCAG 1.4.1, 4.1.2 | Onglet actif signalé par une barre, un fond avocat et du gras, plus `aria-current="page"`. | ✅ Oui |
| m6 | Recette | Le bouton favori « ♡ » n'a pas de texte et les favoris sont difficiles à retrouver. | N6 | Mot « Favori » sous le cœur, cœur rouge quand il est actif, message « retrouvez-les dans Recettes › Favoris ». | ✅ Oui |
| m7 | Recette | La fenêtre des portions propose « 0,5 / 1 / 1,5 / 2 », sans repère concret. | N2 | « ½ portion, petite part », « 1 portion, part normale »…, avec le rappel des glucides par portion. | ✅ Oui |
| m8 | Recette | Une étape cochée devient pâle à 45 % d'opacité : le contraste devient illisible et l'état n'est pas annoncé. | WCAG 1.4.3, 4.1.2 | Étape barrée, pastille « ✓ », `role="button"` et `aria-pressed`, utilisable au clavier. | ✅ Oui |
| m9 | Journal | Le total en quatre petites cases de 11 px est difficile à comprendre. | N8 | Quatre barres de progression lisibles (« 6 / 25 g ») avec « dépassé » en rouge. | ✅ Oui |
| m10 | Suivi | Les libellés sont ambigus : « kg aujourd'hui » affiche la dernière pesée même ancienne, et « IMC 29,1 » n'est pas interprété. | N2 | « kg (dernière pesée, 6 nov.) », « IMC · surpoids » avec une note de prudence, série et moyenne en clair. | ✅ Oui |
| m11 | Courses | Le bouton « Copier la liste » se trouve tout en bas d'une longue liste et les articles cochés ne changent pas d'aspect. | N6, N1 | Bouton remonté en haut, articles cochés barrés. | ✅ Oui |
| m12 | Toute l'application | La structure n'est pas annoncée aux lecteurs d'écran : fenêtres sans `role="dialog"`, message d'état sans `aria-live`, focus non visible, émojis décoratifs lus à voix haute. | WCAG 1.3.1, 2.4.7, 4.1.3 | `role="dialog"`, `aria-modal`, `aria-labelledby`, `aria-live`, contour de focus de 3 px, `aria-hidden` sur les émojis décoratifs, champ de recherche étiqueté. | ✅ Oui |
| m13 | Programme | La page fait plus de 9 000 px de haut (quatre semaines détaillées, menus, guide, FAQ). Il est difficile d'y retrouver le guide des aliments. | N8 | Replier les semaines passées et futures, ou ajouter un sommaire avec des ancres en haut de page. | ❌ Non (reporté) |

### 3.4 Problèmes hors du périmètre de cette passe

| # | Écran | Problème | Recommandation | Corrigé |
|---|---|---|---|---|
| H1 | PWA iPhone | `sw.js` sert les fichiers depuis le cache d'abord, avec la version `kf-app-v1.2.0`. Les utilisateurs iPhone déjà installés **ne recevront pas ces améliorations** tant que ce nom de cache ne change pas. | Passer `APP` à `kf-app-v1.3.0` dans `sw.js` au moment de la publication (fichier hors du périmètre autorisé pour cette passe). | ❌ Non (à faire à la publication) |

## 4. Parcours testés (après corrections)

| Parcours | Avant | Après |
|---|---|---|
| **Premier lancement** | Long formulaire. Démo en bas de page. Erreurs non expliquées. Virgule refusée. | Bouton « Juste regarder » visible, durée annoncée (« environ 1 minute »), exemples dans chaque champ, erreurs en français sur le bon champ, virgule acceptée. |
| **Ajouter ce que j'ai mangé** | « J'ai mangé » sur le menu, ou petit lien vers le journal. Pas d'annulation. | « J'ai mangé » sur le menu, plus le gros bouton « Ajouter un repas » (recette, autre chose ou journal), plus une annulation de 5 s. |
| **Trouver une recette** | Filtres cachés en défilement horizontal, symboles abstraits, impasse quand rien ne correspond. | Tous les filtres visibles et titrés, libellés en clair, « Effacer les filtres », croix de recherche, compteur annoncé. |
| **Suivre son poids** | Saisie seulement sur Aujourd'hui, en bas d'écran. Le champ « Poids actuel » du profil fausse le suivi. | Carte « Noter mon poids » en tête de Suivi et sur Aujourd'hui, confirmation de la valeur, « Poids de départ » explicite dans le profil. |
| **Ajouter un membre de la famille** | Puce du nom sans indice, fenêtre titrée « Profils sur ce téléphone ». | Puce « Nom ▾ », carte « Ma famille » dans Profil, fenêtre « Qui utilise l'application ? », profil actif marqué. Retour ferme la fenêtre. |

## 5. Vérifications

- `python3 tools/ui_test.py <dossier>/apres` → **ERREURS : aucune**
- `python3 tools/photo_test.py <dossier>/apres` → crédit photo correct, cache en place (0 nouvelle requête), **aucune erreur**
- `python3 tools/pwa_test.py` → manifeste `standalone`, fonctionnement hors ligne, 30 recettes affichées
- Test complémentaire des nouveaux comportements (script de revue, non versionné) :
  - validation (« Pour perdre du poids, le poids visé doit être inférieur au poids actuel. ») ;
  - virgule acceptée (`74,5` → 74,5) ;
  - Retour du téléphone qui ferme la fenêtre en restant sur Aujourd'hui ;
  - annulation d'un ajout ;
  - ajout d'un membre de la famille.
- Compatibilité : pas de `?.` ni de `??`. Les remplacements de secours pour `Object.fromEntries` et `Promise.prototype.finally` couvrent Chrome 60–72 et Safari 12. La propriété CSS `inset` a été remplacée par `top/right/bottom/left` (non prise en charge avant Chrome 87 et Safari 14.1). Aucun nouveau stockage n'est ajouté : seule la clé `ketofamille_v1` existante est utilisée.
- Sélecteurs des tests conservés : `pform`, `demo`, `wIn`, `wSave`, `data-eat`, `data-w`, `data-task`, `data-swap`, `sheetCard`, `data-r`, `shop`, `chips`, `chips2`, `more`, `q`, `recipe-item`, `plus`, `fav`, `eat`, `data-n`, `profileChip`, `r-illus`, `credit`, `title`.

## 6. Tableau avant / après des principaux changements

| Domaine | Avant | Après |
|---|---|---|
| Zoom | Bloqué (`user-scalable=no`) | Autorisé |
| Fenêtres du bas | Fermeture par la zone grisée uniquement. Retour quitte l'écran. | Bouton « ✕ Fermer », Retour du téléphone, touche Échap ; focus restitué |
| Cibles tactiles | 30 à 36 px pour de nombreux boutons | ≥ 44 px partout ; boutons principaux de 48 px ; verres d'eau en grille 4 × 2 |
| Texte secondaire | #6b766d (4,24:1), 10–12 px | #5d685f (5,2:1), 12,5–14 px minimum |
| Jauges | Avocat 1,16:1, ambre 2,2:1 ; dépassement signalé par la couleur seule | #58801a et #9a6210 (≥ 3:1) ; mot « dépassé » ; libellé vocal |
| Saisie du poids | `type=number`, virgule non fiable, « Poids invalide » | `inputmode=decimal`, « 78,5 » accepté, exemple et message explicite, valeur confirmée |
| Poids depuis Suivi | Impossible | Carte « Noter mon poids » en tête d'écran |
| Accès au journal | Lien de 13 px | Boutons « Mon journal (n) » et « Ajouter un repas » |
| Annulation | Aucune | « Annuler » pendant 5 s après chaque ajout ou retrait |
| Défilement | Retour en haut à chaque toucher | Position conservée sur le même écran |
| Formulaire de profil | Erreurs du navigateur, cas incohérents acceptés | Validation en français, champ en évidence, exemples, « Poids de départ » en modification |
| Choix segmentés | Option choisie peu visible | Vert plein avec « ✓ », `aria-pressed` |
| Filtres de recettes | Défilement horizontal caché, « ≤ », impasse | Filtres sur plusieurs lignes et titrés, libellés en clair, « Effacer les filtres » |
| Profil démo | Bouton en bas, mode non signalé | Bouton en haut ; bandeau et badge « Démonstration » ; « Créer mon vrai profil » |
| Famille | Puce sans indice | « Nom ▾ », carte « Ma famille », « Qui utilise l'application ? », profil actif marqué |
| Restaurer | Remplacement immédiat | Avertissement, puis confirmation avec la liste des profils |
| Supprimer un profil | « Oui, supprimer » en premier | « Non, garder » en premier, conséquences détaillées |
| Énergie | Émojis seuls | Émoji et mot (Épuisé… Super) |
| Portions | 0,5 / 1 / 1,5 / 2 | « ½ portion, petite part »… avec les glucides par portion |
| Décimales | « 2.2 g » | « 2,2 g » |
| Lecteurs d'écran | Pas de dialogue, pas d'`aria-live`, émojis lus | `role=dialog`, `aria-live`, `aria-current`, `aria-pressed`, contour de focus de 3 px |

## 7. Reste à faire

1. **H1 (avant publication)** : passer le cache `APP` de `sw.js` à `kf-app-v1.3.0`, sinon les iPhone déjà installés garderont l'ancienne version.
2. **m13** : alléger l'écran Programme, en repliant les semaines non en cours ou en ajoutant un sommaire en haut de page.
3. À envisager : un test utilisateur rapide avec deux ou trois proches de plus de 60 ans sur les cinq parcours ci-dessus, pour valider les libellés.
