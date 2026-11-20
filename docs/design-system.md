# Design system FamilyFit

Une seule famille visuelle pour le téléphone, la tablette et le salon. Les écrans passent par `src/ui/kit.tsx`. Les couleurs, l’espace, le type, les rayons et le mouvement sont dans `src/ui/theme.ts`. Le sombre est `src/ui/themeDark.ts`, copié sur l’objet vivant par `ThemeProvider` (Réglages → Apparence, ou le système).

## Couleur

Clair : fond `#F6F4EF`, surface blanche, encre `#1D2522`, forêt `#2F4B43`. L’accent `#D08C60` reste une pastille. Le texte d’accent est `#8B4E2F`.

Sombre : fond `#101614`, surface `#1A2420`, encre `#F3F6F4`, forêt claire `#8FBFB0` avec encre `#10211C` dessus. Les paires texte / fond visées tiennent le AA (4,5:1), y compris `onPrimary` sur `primary`. Le test `scripts/test-workout-engine.mjs` mesure le sombre.

Les huit couleurs de membres gardent leur motif. L’information ne passe pas que par la couleur.

## Type

| Rôle | Taille | Interligne | Usage |
| --- | --- | --- | --- |
| display | 34 | 40 | Titre d’écran (`H1`) |
| title | 22 | 28 | Section (`H2`) |
| body | 17 | 24 | Texte |
| label | 13 | 18 | Champ |
| eyebrow | 12 | 16 | Surtitre, suivi large |

`Texte large` dans Famille multiplie par 1,5. Le réglage du téléphone peut encore monter. Rien ne pose `allowFontScaling={false}`.

## Espace et forme

`space` : 4, 8, 12, 16, 24, 32, 40. Cartes au rayon 20 (`radii.md`), héros au rayon 28. Ombre douce (opacité basse, rayon large), pas un contour dur. Les boutons font au moins 44 pt, 52 pt pour l’action principale.

## Mouvement

`motion` : 140 / 220 / 380 ms. Un bouton principal se réduit légèrement à la pression. L’avatar des coachs se balance. **Réduire les animations** (réglage système) coupe le balancement, le scale et le retour haptique. Le texte du repère reste affiché, avec `accessibilityLiveRegion`.

## Haptique

Impact léger sur le bouton principal, si le réglage Famille est allumé et si les animations ne sont pas réduites. `expo-haptics`. Sur le web, l’appel est ignoré.

## Écrans vides et entrée

`Empty` : pastille, titre, une phrase, une action. `Hero` : bande forêt, surtitre, promesse, bouton clair. L’accueil s’ouvre sur « Dix minutes ensemble ». L’onboarding garde ses trois étapes, dans les mêmes cartes.

## Téléphone, tablette, Apple TV

- Téléphone : colonne, largeur max 920.
- Tablette (largeur ≥ 900) : les coachs et les compteurs passent côte à côte. L’échelle de type est 1,05.
- Apple TV : échelle 1,45, marge plus large, largeur max 1280, anneau de focus sur les cartes et les boutons (`focused`). L’écran `tv` est le salon : profils larges, coach 220 pt, phrases pour la télécommande. Pas d’onglets.

## Verre

Famille → Fini : Classique (inchangé), Verre (clair dépoli), Verre or (sombre, liseré `#D08C60`). Le voile du verre est à 90 % d’opacité : le texte reste sur une surface lisible, le flou est derrière. « Réduire la transparence » retire le flou et revient aux cartes pleines. « Réduire les animations » retire l’enfoncement du bouton. Les boutons partagés ont une arête claire, une ombre, un dégradé bas, et s’enfoncent au toucher. Sur Apple TV le focus reste un bord doré épais et une échelle 1,08.

## Voix et écriture

Les séances et le chrome des onglets existent en FR, EN, DE et AR. L’agenda historique reste en français. L’arabe aligne le texte des séances ; l’app entière ne force pas le RTL, pour ne pas déplacer l’agenda déjà là.
