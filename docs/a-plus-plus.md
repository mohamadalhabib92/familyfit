# FamilyFit — scorecard A++ 

Lecture du code sur `release/next` au SHA `b4d5725f600fe5de1cd2280b83100d6c117291a0` (PR 8), puis correctifs de cette branche. Les notes comparent le code du dépôt aux apps de la catégorie (Apple Fitness+, Nike Training Club, Peloton, Freeletics, Seven, Down Dog, Cosmic Kids Yoga, GoNoodle, Sworkit Kids). Ces apps n’ont pas été installées ici : la colonne « eux » décrit leur offre publique. La colonne « nous » vient du code.

Échelle : A solide pour la catégorie familiale, B utilisable avec un trou visible, C trou qui casse un parcours. « safe polish » = correctif local, sans nouveau produit. « needs Mohamed's decision » = copie, store, santé, synchro, argent ou donnée que cette branche ne doit pas trancher.

## Tableau

| Axe | Avant | Après cette branche | Eux | Écart qui reste | Tag |
| --- | --- | --- | --- | --- | --- |
| Fiabilité | B+ | A− | Fitness+ reprend une séance plantée sans perdre les anneaux | Le brouillon meurt si le processus est tué pendant un disque plein. Pas de preuve appareil. | safe polish (fait : frontière qui remonte l’arbre, séance vide non journalisée, onboarding sans `family!`, `npm test` avant l’export web) |
| Démarrage / perf | B | B+ | NTC et Peloton mesurent le temps jusqu’à la première image | Le chargement est annoncé. Le salon relit l’horloge native toutes les 50 ms : on n’y touche pas. Taille du binaire et batterie non mesurées. | safe polish partiel ; la mesure appareil est needs Mohamed's decision |
| Hors ligne | B | A− | Down Dog et Freeletics téléchargent le programme | Les séances locales continuent. Une URL distante est sautée s’il existe un clip déjà dans l’app. Pas de paquet téléchargé pour les clips absents. | safe polish (fait) ; téléchargement needs Mohamed's decision |
| Accessibilité | B | A− | Fitness+ et Apple : VoiceOver, Dynamic Type, réduire les animations | Libellés, minuteurs, texte large sur les réglages, les listes, les vides et le chargement. Aucun parcours VoiceOver sur appareil. | safe polish (fait) ; passage VoiceOver needs Mohamed's decision |
| Langues FR/DE/IT/EN | B | B | Down Dog couvre beaucoup de langues, dont l’italien | FR, EN, DE et AR pour les séances et les onglets. L’agenda reste en français. Le programme filmé n’a que FR et EN. Pas d’italien. | needs Mohamed's decision |
| Onboarding | B | A− | NTC demande le niveau en quelques écrans | Trois étapes inchangées. On n’écrit plus un événement si la famille n’a pas d’identifiant, et la création qui n’a pas abouti ne passe plus à l’étape suivante. | safe polish (fait) |
| Famille, enfants, intensité | A− | A | Sworkit Kids et Cosmic Kids isolent l’enfant ; Freeletics est trop dur | Moussa et Élias restent. Le pic famille est plus court que le pic adulte. La phrase « pas un avis médical » s’affiche aussi à la fin des séances filmées. Pas de journal de consentement. | safe polish (fait pour la phrase) ; journal needs Mohamed's decision |
| Vidéo des coachs | B | A− | Fitness+ a une image de secours, jamais un écran noir | Surface du thème pendant le chargement. Si le lecteur passe en erreur, le titre reste, la vidéo est retirée, le lecteur est mis en pause. | safe polish (fait) |
| Programmes progressifs | A | A | NTC a des semaines entières ; Seven n’a qu’une intensité | Échauffement, montée, effort, retour au calme. Une séance sans bloc ne s’enregistre pas comme faite. | safe polish (fait) |
| Verre | A | A | Pas l’équivalent chez les apps citées | Voile 0,90, relief des boutons, et maintenant l’arête claire des bandeaux. Réduire la transparence retire le flou. | safe polish (fait) |
| Salon plein écran / focus | A− | A | Peloton occupe le téléviseur ; le focus doit se voir à trois mètres | La séance reste en ligne, vidéo à droite, sans bandeau racine. Le focus garde l’anneau doré et une barre, même si « réduire les animations » enlève l’échelle 1,08. | safe polish (fait) |
| Vie privée | A− | A− | Les leaders ont un compte obligatoire et de la télémétrie | Export honnête, pas de position, pas de poids. L’appareil partagé reste ouvert. | needs Mohamed's decision |

## Ce qui a été corrigé ici (safe polish)

1. Lecteur : plus de fond `#1D2522`. Poster sur `surfaceAlt` tant que la vidéo n’est pas prête (au plus 1,5 s), et pour de bon si le statut est `error`.
2. Hors ligne : `pickClip` ignore une URL distante et prend le fichier déjà bundlé. Une ligne « Hors ligne » sur Aujourd’hui, Bouger et le salon, sans réduire la séance TV.
3. Séance progressive vide : le minuteur ne démarre pas et rien n’est écrit dans le journal fitness.
4. Onboarding : `createFamily` dit si l’écriture a eu lieu. L’événement et le rituel exigent un identifiant de famille.
5. Frontière d’erreur : Réessayer incrémente une clé et remonte l’écran. Les données locales ne sont pas effacées.
6. Dynamic Type et VoiceOver : segments, champs, listes (deux lignes), héros, vides, pastilles, compteurs, chargement annoncé, minuteur avec rôle `timer`.
7. Haptique léger au changement de geste sur le téléphone, coupé sur Apple TV et si les animations sont réduites.
8. Focus TV : barre dorée de 10 pt en plus de l’anneau, y compris sans mise à l’échelle.
9. Phrase santé à la fin de la séance illustrée, de la séance filmée et du salon, dans les quatre langues déjà livrées. Le français reste la phrase de `health.ts`.
10. Bandeaux d’alerte : arête claire et base, comme les boutons en relief.
11. Le workflow Pages lance `npm test` avant `npm run build:web`. Un test rouge ne déploie pas la PWA.
12. ESLint du SDK 58 est versionné (`eslint.config.js`, script `lint`). Les règles du compilateur React qui réécriraient l’horloge du salon, le thème vivant ou les mutations du lecteur `expo-video` restent éteintes. Le hook conditionnel de la session de rituel est corrigé : `useWindowDimensions` est appelé avant le retour anticipé.

Aucun coach retiré. Moussa (papa d’Afrique de l’Ouest) et Élias (6 ans) restent sur les séances enfants. Aucune clé `@familyfit/` renommée. Version, bundle, entitlements et identifiants EAS inchangés.

## Écarts qui attendent une décision

1. **Italien et noms de gestes DE/AR dans le programme filmé.** Le moteur TV n’a que `fr` et `en`. Ajouter IT, ou traduire les douze gestes, change la voix et la copie. needs Mohamed's decision.
2. **Appliquer `supabase/migrations/20261115120000_fitness.sql`.** Le SQL est dans le dépôt. Rien n’est exécuté sur un projet hébergé. needs Mohamed's decision.
3. **HealthKit.** L’accès reste « indisponible » tant que `EXPO_HEALTHKIT=1` n’est pas posé côté Apple Developer. Cette branche ne touche pas aux entitlements. needs Mohamed's decision.
4. **Build tvOS.** Le profil `production-tv` existe. L’ajouter à App Store Connect puis lancer EAS n’est pas fait ici, et aucune soumission. needs Mohamed's decision.
5. **Appareil partagé.** `isMe` n’empêche pas un enfant d’ouvrir humeurs, notes et contacts sur le téléphone familial. Un verrou local est un choix de produit. needs Mohamed's decision.
6. **Fiche store.** Nom déjà pris par Family Fit GmbH, mot-clé, étiquette « données non collectées » si l’OTP est actif. Aucune soumission dans cette branche. needs Mohamed's decision.
7. **Sauvegarde et restauration sur un vrai appareil**, avec retour arrière, avant toute publication. Le code ne peut pas le prouver. needs Mohamed's decision.
8. **Journal de consentement parental** (qui, quand, révocation) sans inventer un âge légal. needs Mohamed's decision.
9. **Synchro multi-appareils** avec une version par enregistrement. Aujourd’hui un échec RPC garde le local et le dit. needs Mohamed's decision.
10. **Coach IA** (`CoachBrain` kind `ai`) : plafond de coût, pas de prénoms d’enfants envoyés, accord explicite. Aucune clé n’est ajoutée. needs Mohamed's decision.

## Ce qui n’est pas une promesse

Le poster vidéo dépend du statut `expo-video` (`idle`, `loading`, `readyToPlay`, `error`). Si le statut ne passe jamais à `error` et que le décodeur peint quand même du noir après 1,5 s, l’image peut rester sombre : le fond du composant, lui, est la surface du thème. Ce cas n’a pas été filmé sur Apple TV dans cette session.
