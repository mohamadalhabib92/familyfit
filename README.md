# FamilyFit

Agenda familial partagé (grégorien + hégirien), rituels du matin et du soir, objectifs de bien-être légers.
Application Expo (iOS / Android) **et** PWA installable (GitHub Pages, `/familyfit/`).

> À ne pas confondre avec **FamCal** : FamilyFit est une application distincte.

## Fonctionnalités

- **Configuration requise** : écran qui liste `EXPO_PUBLIC_SUPABASE_URL` et `EXPO_PUBLIC_SUPABASE_ANON_KEY`. Sans ces valeurs → bouton « Continuer en mode démo (local) ».
- **Connexion sans mot de passe** : code OTP à 6 chiffres par e-mail ou SMS (Supabase Auth). Erreurs claires en français : code expiré, code invalide, trop de tentatives, numéro au mauvais format. Renvoi possible après 30 s. En mode démo, le code est simulé et affiché à l’écran.
- **Onboarding en moins de 2 min** (chronomètre visible) : famille → invitation → premier événement ou rituel.
- **Famille** : modèle `family_id`, rôles Administrateur / Parent / Membre, invitations par code ou lien (`/join/CODE`), valables 7 jours et révocables.
- **Enfants** : profils sans compte ni contact. Un enfant apparaît comme « Enfant » pour les membres non-parents, sauf consentement parental.
- **Agenda** :
  - semaine avec date hégirienne par jour, calculée depuis une seule source (`src/lib/hijri.ts`, ajustement ±2 jours) ;
  - 5 catégories colorées (Famille, Travail, École, Loisirs, Bien-être), filtres par catégorie et par membre ;
  - répétition quotidienne, hebdomadaire ou mensuelle avec date de fin ;
  - **conflits d’horaire signalés** dans l’éditeur et dans les listes ;
  - état vide utile : « Aucun événement cette semaine — ajouter un rituel ? ».
- **Rituels** :
  - 4 modèles ou rituels personnalisés, au matin ou au soir ;
  - session avec checklist, participants, humeur facultative et note ;
  - historique ;
  - rappel quotidien en notification locale.
- **Bien-être** : objectifs hebdomadaires partagés (minutes, repas sans écran…), saisie rapide, encouragements. **Aucun conseil médical.**
- **Vie privée** : écran dédié, aucune géolocalisation, données minimales, export JSON, suppression totale.
- **Hors ligne** : tout est stocké sur l’appareil (AsyncStorage / localStorage). Si une synchronisation Supabase échoue, un message s’affiche et rien n’est perdu.
- **Accessibilité** : cibles tactiles ≥ 44 pt, libellés d’accessibilité, aucun écran blanc (indicateur de chargement, puis redirections).

## Démarrer

```bash
npm install
cp .env.example .env    # optionnel : renseigner les valeurs YOUR_* pour activer Supabase
npx expo start          # mobile (Expo Go / dev build)
npm run build:web       # PWA dans dist/
npm test                # tests du calendrier hégirien
npx tsc --noEmit
```

## Supabase (optionnel)

1. Créer un projet Supabase, puis activer Auth → Email OTP. Pour l’OTP par SMS, configurer aussi un fournisseur SMS (payant, hors du parcours de base).
2. Exécuter `supabase/schema.sql` dans le SQL Editor. Le script est idempotent. Il crée :
   - les tables `profiles`, `families`, `family_members`, `invitations`, `events`, `rituals`, `sessions`, `goals` et `activities` ;
   - la RLS par famille, via `is_family_member()` et `is_family_manager()` ;
   - les RPC `create_family`, `create_invitation` et `accept_invitation`.
3. Facultatif : `supabase/seed-demo.sql` (lignes marquées `is_demo`).
4. Ajouter l’URL de l’app (et `familyfit://`) aux Redirect URLs de Supabase pour les liens profonds.
5. Pour GitHub Pages : ajouter les **variables** de dépôt `EXPO_PUBLIC_SUPABASE_URL` et `EXPO_PUBLIC_SUPABASE_ANON_KEY`. La clé anon est publique par nature. N’y mettez **jamais** la clé `service_role`.

## Déploiement PWA

`.github/workflows/pages.yml` lance la vérification des types, l’export web (`experiments.baseUrl = /familyfit`) et le déploiement sur GitHub Pages. Le service worker et le manifeste sont générés par `scripts/pwa-postbuild.mjs`.

## Données de démonstration

L’option « Ajouter des données d’exemple » de l’onboarding crée :

- 2 membres fictifs (« démo »), dont un enfant ;
- 6 événements, dont un **conflit volontaire aujourd’hui** ;
- 2 rituels et 2 objectifs.

Pour tout retirer : Famille → « Supprimer les données démo ».

## Limites connues

- Les données restent **locales à l’appareil**. Supabase sert à la connexion OTP et aux RPC famille et invitations ; la synchronisation complète des événements, rituels et sessions n’est pas encore branchée (le schéma est prêt).
- En mode démo, un code d’invitation ne peut être accepté que **sur le même appareil**.
- Les rappels (notifications locales) ne fonctionnent que dans l’app iOS / Android, pas dans la PWA.
- Le calendrier hégirien est calculé (tabulaire / Umm al-Qura approché). L’ajustement manuel ±2 jours couvre l’observation locale.
- Pas de saisie de date native : les dates se tapent au format JJ.MM.AAAA.
