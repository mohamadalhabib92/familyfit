# FamilyFit — vision et plan

FamilyFit est l’app sportive de la famille : téléphone iOS, téléphone Android, et le salon sur Apple TV. Les coachs sont des personnages dessinés pour cette app. Les données déjà présentes sur l’appareil restent. Le projet Expo `3104d765-4dcb-492e-ab04-ade0c86471d9` et les identifiants `com.vibecode.familyfit-lpshhx` / `ch.mohamadba.familyfit` ne changent pas.

## Ce que font les apps voisines

| App | Ce qu’elle fait bien | Ce qui manque pour une famille |
| --- | --- | --- |
| Apple Fitness+ | Studio soigné, anneaux, Apple Watch, plusieurs entraîneurs | Abonnement, peu pensé pour un enfant de 5 ans et un grand-parent dans la même séance |
| Nike Training Club | Programmes clairs, vidéos, niveaux | Individuel, marque forte, pas de variante par âge dans la même pièce |
| Freeletics | Coach adaptatif, séances courtes | Intensité haute, langage de performance, inadapté aux enfants |
| Sworkit Kids | Durées courtes, mouvements simples | Enfants seulement, pas le reste de la famille |
| GoNoodle | Énergie et jeu pour la classe | Pas un entraînement pour adultes ni seniors, pas de suivi familial |
| Peloton | Coach, direct, salon | Prix, matériel, intensité, pas une séance partagée à quatre niveaux |
| 7 Minute Workout | Très court, sans matériel | Une seule intensité, pas d’échauffement imposé, pas de famille |
| Cosmic Kids Yoga | Histoires calmes pour enfants | Yoga enfants, pas de défi familial ni de version adulte du même geste |

## Ce qui rend FamilyFit la plus juste pour ce besoin

- **La même séance, quatre corps.** Réveil, soir calme, jeu de formes, équilibre. L’ordre des gestes est identique. La durée, l’impact et le texte changent pour 4–7 ans, 8–12 ans, ados, adultes et seniors.
- **Coachs originaux.** Lina (énergie), Noor (souffle), Pico (jeu), Sami (rythme posé). Illustrations géométriques faites pour FamilyFit. Voix du téléphone via `expo-speech`, en français, anglais, allemand et arabe. Repères de départ, de placement, de repos, de compte à rebours et d’encouragement.
- **Jeu sans score médical.** Défis de minutes, séries, badges, tableau de la semaine dans la famille. Pas de poids, pas de calories, pas de classement public.
- **Prudence.** Échauffement impossible à sauter. Intensité douce et sans saut pour les plus jeunes. Version chaise pour les seniors. Un enfant ne lance une séance guidée que si un parent l’a autorisée. Phrase affichée : ce n’est pas un avis médical.
- **L’appareil d’abord.** Le journal tient dans AsyncStorage, clé `@familyfit/fitness`, à côté des clés déjà là (`family`, `events`, `sessions`…). La synchro Supabase est un SQL dans le dépôt, avec RLS, et n’est pas appliquée.
- **Salon.** Profil large, coach grand, focus pour la télécommande Siri. Le binaire TV est le profil EAS `production-tv`, le même projet Expo et le même bundle que l’iPhone. Le numéro de build iPhone reste celui du fichier `app.json`. Le binaire TV porte `CFBundleVersion` 2.

## Où brancher un coach IA plus tard

`CoachBrain` (`src/lib/coaches.ts`) a `kind: 'scripted' | 'ai'`. `resolveCoach()` renvoie le script local si aucun module n’est fourni. Aucune clé et aucun appel réseau ne sont prévus. Un branchement payant attend l’accord du propriétaire.

## Ce que le propriétaire doit encore décider

- Appliquer `supabase/migrations/20261115120000_fitness.sql` sur le projet Supabase, ou non. Rien n’est exécuté depuis ici.
- Activer la capacité HealthKit dans Apple Developer / App Store Connect, puis poser `EXPO_HEALTHKIT=1` pour écrire l’entitlement. Sans cela, le binaire téléphone actuel continue de se signer et la santé répond « indisponible ».
- Ajouter la plateforme tvOS à l’app App Store Connect déjà liée au bundle iPhone, puis lancer `eas build -p ios --profile production-tv` sur ce même projet Expo. Pas de second projet EAS.
- Pas de soumission App Store et pas de merge : `main` déploie le web.
