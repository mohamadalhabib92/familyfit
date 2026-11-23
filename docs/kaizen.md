# Kaizen FamilyFit

Petites passes, une branche à la fois. Pas de merge vers `main`. Les coachs, dont Moussa et Élias, et le verre restent.

## 2026-11-23

Branche `cursor/a-plus-plus-7ac6` (PR 9), binaire TestFlight iOS 21 / TV 7.

### 1. Focus téléviseur lisible à trois mètres

Avant : anneau doré `#F6C453`, échelle 1,08, fond de surface ou verre transparent. Le crayon se confondait avec le verre or.

Après : au `onFocus`, fond crème `#F4EBD9`, encre `#0E2A22`, bord cuivre 3 pt `#C8875A`, échelle 1,05, ombre. `onBlur` rend le verre. « Réduire les animations » garde la crème et le cuivre, sans l’échelle.

Fichiers : `src/lib/tvFocus.ts`, `src/components/tv/focus.tsx`.

Tests : `scripts/test-polish.mjs` (échelle, bord), `scripts/test-verre.mjs`, `scripts/test-workout-engine.mjs`.

### 2. Aucune rangée vide dans le guide de focus

Avant : une liste à zéro élément laissait un conteneur dans `TVFocusGuideView`. `profileGrid` pour 0 carte renvoie une hauteur 0.

Après : `TvRail` ne monte rien si `focusRail` est vide. Les rangées du salon, des zones, du choix de coach et des séances passent par là. Un contrôle focusable garde `minHeight` 72 après le style appelant.

Fichiers : `src/lib/tvFocus.ts`, `src/components/tv/focus.tsx`, `src/components/tv/LivingHome.tsx`, `src/components/moves/CoachPicker.tsx`, `src/app/moves/index.tsx`, `src/app/moves/[part].tsx`, `src/app/moves/seance.tsx`.

Tests : `focusRail([null])` est vide, `shouldMountFocusRail(0)` est faux (`scripts/test-polish.mjs`).

### 3. Textes de démo et diagnostic hors de la release

Avant : sans clés Supabase, l’écran Connexion affichait « Mode démo » et le code simulé. Sept appuis ouvraient Diagnostic, y compris sur un binaire de release.

Après : `showDevSurfaces` n’est vrai qu’en développement. TestFlight ne montre ni le code simulé, ni le bandeau « Mode démo », ni l’entrée Diagnostic. Le geste secret ne navigue plus. En développement, le code simulé et Diagnostic restent.

Fichiers : `src/lib/releaseSurface.ts`, `src/lib/diagnosticAccess.ts`, `src/app/auth.tsx`, `src/app/config.tsx`, `src/app/(tabs)/family.tsx`, `src/app/(tabs)/index.tsx`.

Tests : `showDevSurfaces(false)` est faux (`scripts/test-polish.mjs`).

### Intensité

Les séances progressives sont déjà échauffement → montée → intense → retour (`src/lib/progression.ts`). Le programme filmé est déjà warmup → main → cooldown (`src/lib/training/engine.ts`). Rien à réordonner cette semaine.
