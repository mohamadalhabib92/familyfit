# Audit FamilyFit — 7 novembre 2026

Lecture du code sur `main` au SHA `3959aabdd0e45ddf390ba1fe5fb376e18b1aa79e` (fusion de la PR #2). La fondation de conservation décrite en fin de document est le diff de la branche `cursor/preservation-foundation-8cb7`. Aucune autre branche de PR n’a été modifiée.

## Diagnostic

FamilyFit est un agenda familial local (Expo 58, iOS, Android et PWA) : semaine grégorienne, date hégirienne tabulaire, rituels du matin et du soir, objectifs de bien-être légers. Ce n’est pas un carnet d’entraînement, ni un dossier de santé, ni une application de culte. Les données cœur vivent dans AsyncStorage, préfixe `@familyfit/` ; Supabase, s’il est configuré, sert à l’OTP et à quelques RPC, pas à une synchro des événements. La PR #2 bloque déjà l’écriture tant que la lecture d’une clé n’a pas réussi ; il manquait la version de schéma, le maintien des champs inconnus, une quarantaine et un export qui dit ce qu’il est. La déconnexion ne doit pas effacer la famille : la route le garantissait, le fournisseur de données pouvait encore vider `family` si cette décision changeait. Aucun téléphone, aucune sauvegarde d’appareil et aucune base de production n’ont été ouverts. Une restauration future devra comparer comptes et condensé sur une copie isolée, puis pouvoir revenir en arrière. Ce n’est pas une promesse de perte nulle.

## Périmètre réel

Vérifié dans le dépôt, pas par supposition.

Présent :

- Onglets Aujourd’hui, Agenda, Rituels, Bien-être, Famille (`src/app/(tabs)/_layout.tsx`).
- Événements à cinq catégories, répétition, conflits d’horaire (`src/lib/events.ts`).
- Quatre modèles de rituels, séances avec étapes, participants, humeur facultative (`src/lib/model.ts`).
- Objectifs en quantité hebdomadaire (minutes, repas, sorties) et barres de progression (`src/app/(tabs)/wellness.tsx`).
- Liste d’exemple locale, pas une liste partagée (`src/lib/model.ts`, `src/components/ExampleLists.tsx`).
- Profils enfant : prénom, couleur, drapeau mineur, consentement parental booléen. Pas de compte enfant (`src/lib/model.ts`, `src/app/member/[id].tsx`).
- Mode essai local si les clés Supabase sont absentes ou `YOUR_*` (`README.md`, `src/lib/supabase.ts`).
- Export JSON, effacement local, suppression de compte si la RPC répond (`src/app/(tabs)/family.tsx`, `supabase/schema.sql`).

Absent du code, donc hors des affirmations de cet audit :

- Pas de séances de musculation, de GPS, de HealthKit, de poids, d’IMC, de calories, de séries (streaks), de graphiques (pas de librairie de charts : seulement des barres).
- Pas d’import ICS ni de fichiers importés. La clé `imports` de la fixture sert à prouver qu’une clé inconnue n’est pas supprimée. Elle ne lit aucun fichier.
- Pas de modèle d’IA, pas de diagnostic, pas d’horaires de prière, pas de suivi cultuel.
- Pas de synchro temps réel des événements, rituels ou séances. Les RPC appelées sont `create_family`, `create_invitation`, `accept_invitation`, `delete_my_account` (`src/lib/data.tsx`).
- Pas de table `audit_log` sur `main`. La PR #1 ouverte en parle ; elle n’est pas la source de vérité.

## État des PR

| PR | Branche | État au 7 novembre 2026 | Traitement |
|---|---|---|---|
| #2 | `cursor/passe-1-foundations-3580` | Fusionnée, commit `3959aabdd0e45ddf390ba1fe5fb376e18b1aa79e` | Base lue. `origin/main` est à ce SHA. |
| #1 | `cursor/passe-1-foundations-da25` | Ouverte, non fusionnée | Ancien doublon de la passe 1. Non modifiée, non mergée. |
| #3 | `ux/passe-plaisir-2026-11-04` | Ouverte | Passe UX. Non lue comme base, non modifiée. |

## Tableau

Effort de 1 (correctif local) à 5 (chantier). Priorité P0 = cette fondation, P1 = suite bornée, P2 = plus tard.

| Élément | Problème | Solution concrète | Impact | Effort | Priorité |
|---|---|---|---|---|---|
| Écriture au chargement | Avant la PR #2, un état vide pouvait remplacer le disque. La garde existe (`persistGuard.ts`). Elle ne couvrait pas une version future ni les champs inconnus. | Garder la garde. Ajouter un tampon de version, refuser les réécritures si la version lue est plus récente, et conserver les champs non cités lors d’une mise à jour partielle. | Une mise à jour ou un JSON ancien n’efface plus en silence l’historique, les rituels, les séances, les objectifs, les préférences, les membres. | 3 | P0, fait ici |
| Déconnexion | `gate.signOut` gardait la famille, mais `data.tsx` faisait `setFamily(null)` si la famille revenait vide. Un changement de route pouvait donc effacer la famille au logout. | La déconnexion n’écrit que la session. Fixture : famille, séances, rituels, objectifs, imports inchangés. | Plus de logout destructeur dormant. | 1 | P0, fait ici |
| JSON illisible | Le brut restait la seule copie. « Réinitialiser » le remplaçait par une valeur vide. | Copie en quarantaine avant remplacement, sans écraser une quarantaine déjà illisible. L’effacement confirmé, lui, retire aussi la quarantaine. | Une donnée cassée n’est plus détruite par le seul bouton de réparation. Le droit d’effacer reste entier. | 2 | P0, fait ici |
| Export | JSON brut, sans comptes ni condensé, présenté comme « mes données ». | Instantané `local-snapshot` : comptes par clé, SHA-256, phrase « ce n’est pas une restauration ». Visible dans Famille et sur le bandeau d’écritures en pause. | L’utilisateur voit un fichier honnête. Personne ne peut le prendre pour une restauration garantie. | 2 | P0, fait ici |
| Champs et clés futurs | Un objet reconstruit sans les champs inconnus les perdait à la sauvegarde. Aucune version n’interdisait d’écraser un disque plus récent. | `retainUnknown` sur les mises à jour fonction. `planMigration` ne supprime aucune clé. Version supérieure : écritures en pause, lecture et export possibles. | Les notes futures, une clé `imports`, une métadonnée `legacyNote` survivent. | 3 | P0, fait ici |
| Appareil partagé | Un seul `isMe`. Pas de code, pas de profil verrouillé. Humeurs, notes, contacts adultes sont dans le même stockage. `displayName` masque le prénom d’un mineur seulement pour un lecteur non parent. | Prochaine passe : verrou local ou choix de lecteur, sans copier les données sensibles d’un profil vers un autre. Ne pas le faire dans cette PR. | Un enfant qui ouvre l’app sur le téléphone familial voit aujourd’hui le contenu de l’appareil. | 4 | P1 |
| Retrait d’un membre | Le bouton dit que les données personnelles seront supprimées. Le code retire le membre et son id dans les événements, pas les séances, humeurs ni activités (`src/app/member/[id].tsx`). | Aligner le texte et le geste : soit effacement confirmé des lignes de ce membre, soit dire que l’historique familial est conservé. | Évite une fausse promesse d’effacement, sans manger l’historique des autres. | 2 | P1 |
| CI | `.github/workflows/pages.yml` lance `tsc` et l’export web, puis déploie GitHub Pages. `npm test` n’y est pas. | Ajouter `npm test` avant l’upload. Ne pas déployer si les fixtures de conservation échouent. | Une régression de logout ou de quarantaine ne part pas en PWA sur `main`. | 2 | P1 |
| Fiche store | Brouillon : nom déjà pris par Family Fit GmbH, mot-clé `islam`, « nous ne collectons pas de données », texte « jusqu’à 200 % » sans plafond dans le code (`store/ios-metadata.md`, `family.tsx`). | Décision de Mohamed : nom, mots-clés, étiquettes nutrition, phrase d’accessibilité. Pas de soumission dans cette PR. | Réduit le risque de refus App Store et d’étiquette fausse si Supabase est activé. | 2 | P1 |
| iPad, web, VoiceOver | `supportsTablet: true`, orientation portrait, contenu plafonné à 860 px. Pas de disposition iPad. VoiceOver non parcouru. Rappels absents sur le web, le dit l’écran Famille. | Passe dédiée : grands pointeurs, ordre de focus, semaine lisible en paysage si le produit le veut. | L’iPad est accepté par la fiche mais l’écran reste celui du téléphone. | 3 | P2 |
| Conflits | `conflictsFor` signale deux rendez-vous qui se chevauchent. Ce n’est pas un conflit de synchro. Hors ligne, l’échec RPC affiche un message et garde le local. | Ne pas appeler cela une synchro. Une passe synchro ultérieure devra avoir des versions par enregistrement, pas un dernier écrit gagne silencieux. | Évite de perdre deux appareils le jour où la synchro sera branchée. | 5 | P2 |
| Consentement mineurs | Booléen `parentConsentShare` / colonne `parent_consent_share`. Pas de journal (qui, quand, révocation). L’âge « 16 ans » cité dans la PR #1 n’est pas une constante du code sur `main`. | Journal local append-only, plus tard, sans pièce d’identité. Ne pas inventer un âge légal dans l’app tant que le conseil ne l’a pas fixé. | Le drapeau existe. La preuve du consentement, non. | 3 | P2 |
| Santé et motivation | Refus poids / IMC / calories. Phrase « consultez un professionnel ». Encouragements sans honte ni série. Pas de mesure scientifique embarquée : ce sont des repères déclaratifs. | Garder l’interdit. Ne pas ajouter de courbe de poids « pour les parents ». | Le produit reste un agenda, pas un dispositif médical. | 1 | P2, déjà tenu |
| IA | Aucun SDK, aucun appel modèle. | Ne pas en ajouter pour « conseiller la famille ». Si un jour un texte est proposé : coût plafonné, pas de diagnostic, pas d’envoi des prénoms d’enfants, arrêt clair. | Rien à débrancher. Le risque est une passe future trop large. | 1 | P2 |
| RLS exécutable | Le SQL d’isolation est dans le dépôt et relu par `test-foundations`. `test-rls-local.mjs` a quitté 0 sans Postgres : `initdb` absent. Aucun projet Supabase contacté. | Installer Postgres dans la CI si l’on veut rejouer l’isolation, sans pointer vers la prod. | La politique est écrite. Elle n’a pas été exécutée ici. | 2 | P2 |

## Douze axes

### 1. Produit et concurrents nommés

FamilyFit se compare à des agendas familiaux, pas à des apps fitness.

- **Cozi** (Cozi Inc.) : calendrier, listes, recettes, synchro de famille. FamilyFit a l’agenda et une liste d’exemple sur l’appareil. Pas de recettes, pas de synchro d’événements.
- **TimeTree** : calendrier partagé multi-personnes. FamilyFit ajoute rituels et date hégirienne, sans le même partage en ligne.
- **FamilyWall** : agenda, listes, localisation. FamilyFit ne demande pas la position (`app.json` ne déclare pas la localisation ; l’écran vie privée le dit).
- **Calendrier Apple** et **Partage familial**, **Google Agenda** : calendriers système. FamilyFit n’utilise pas EventKit et n’importe pas d’ICS (`README.md`, limites).
- **Fabulous** : routines matin et soir guidées. FamilyFit a des checklists et un historique de séances, sans parcours commercial ni série punitive.
- **Streaks** (Crunchy Bagel) : habitudes avec séries. Aucun compteur de série dans `src/`.
- **Muslim Pro** : calendrier hégirien, prières, qibla. FamilyFit n’affiche qu’une date hégirienne arithmétique, ajustable de −2 à +2 jours (`src/lib/hijri.ts`). Pas d’horaire de prière.
- **Family Fit GmbH** : le brouillon store signale que le nom est déjà sur l’App Store (`store/ios-metadata.md`). Constat de marque, pas une comparaison fonctionnelle.
- **FamCal** : autre application du même auteur, citée comme distincte dans le README et comme risque 4.3 dans le brouillon. Non auditée ici.

Ces produits n’ont pas été installés dans cette session. La colonne « eux » décrit leur catégorie publique. La colonne « nous » vient du code.

### 2. UX iPhone, iPad, web

- iPhone : parcours onglets, cibles d’au moins 44 pt (`src/ui/kit.tsx`), chargement avec repli à 4 s puis 8 s selon les textes déjà en place.
- iPad : `supportsTablet: true`, `orientation: "portrait"` (`app.json`). Le contenu est centré, largeur max 860 (`kit.tsx`). Pas d’écran spécifique tablette. La fiche store demande pourtant des captures iPad.
- Web : PWA `baseUrl` `/familyfit`, manifeste, déploiement Pages. Les rappels sont marqués non fiables sur le web (`src/lib/reminders.ts`, écran Famille).
- Le mode essai évite l’écran « Configuration requise » (contrôlé par `scripts/test-foundations.mjs`).

### 3. Accessibilité, aînés, enfants

- Contrastes AA mesurés par le test des fondations (texte, muted, accentText, primary, états). L’accent `#D08C60` est réservé aux pastilles (environ 2,5:1).
- Réglage « Texte large » : ×1,5 sur H1, H2, Body, Muted, Eyebrow (`kit.tsx`). Beaucoup de `Text` d’écran ne passent pas par ces composants et restent à 16 px.
- Le libellé dit que le téléphone peut aller « jusqu’à 200 % ». Aucun `maxFontSizeMultiplier` dans `src/`. Le test des fondations vérifie l’absence de `allowFontScaling={false}`, pas un plafond à 200 %. La phrase est donc en avance sur le code.
- `AccessibilityInfo` écoute « réduire les animations » pour les cartes pressées.
- Enfants : libellés présents sur une partie des contrôles. Pas de parcours VoiceOver exécuté. Pas de mode simplifié « enfant » distinct du masquage du prénom.

### 4. Architecture, hors-ligne, conflits

- Client Expo Router, état React, AsyncStorage. Pas de `ios/` ni `android/` versionnés : génération native continue.
- Hors ligne : les écritures locales sont la source. Un RPC en échec remplit `remoteError` et annonce que les données restent sur l’appareil (`data.tsx`).
- Conflit d’horaire : même jour, créneaux qui se croisent, participant commun (`events.ts`). Conflit de réplication : inexistant.
- Préfixe `@familyfit/` pour ne pas mélanger d’autres PWA sur la même origine GitHub Pages.

### 5. CI et tests

- Scripts : hijri, garde d’écriture, route, fondations (contraste, clés, RLS déclarée, secrets, phrase santé), conservation, RLS locale.
- CI réelle : typecheck + export web + Pages sur push `main` (`.github/workflows/pages.yml`). Pas `npm test`. Pas de workflow EAS dans le dépôt.
- Cette session : `npx tsc --noEmit` OK, `npm test` OK. RLS locale ignorée (`initdb` absent), code de sortie 0, aucun appel Supabase.
- `npx expo lint` a voulu installer ESLint et une config. Ces fichiers n’étaient pas dans le dépôt. L’installation a été annulée. Le lint n’est donc pas un contrôle du projet aujourd’hui. Trois erreurs signalées au passage existaient déjà (pureté du minuteur d’onboarding, `setState` dans des effets de `storage.ts` et `kit.tsx`) et n’ont pas été élargies.

### 6. Performance, batterie, taille

Non mesurées ici. Pas de profil batterie, pas de taille d’IPA/AAB, pas d’export web chronométré dans cette session. Indices dans le code : pas de localisation en continu, pas de synchro périodique, notifications locales seulement si l’utilisateur les autorise, sons de notification coupés (`reminders.ts`). La taille et la batterie restent des inconnues, pas des résultats.

### 7. Sécurité : familles, santé, enfants, religion séparés

- RLS déclarée par `family_id` sur les tables du schéma. Fonctions `is_family_member`, `is_family_manager`, `is_family_admin`. `delete_my_account` est `security definer`, réservée aux authentifiés, avec transfert d’admin (`schema.sql`).
- Pas de clé `service_role` dans le dépôt (test des fondations).
- Santé : interdite à la saisie d’objectif via une expression sur poids, IMC, kcal, calorie, maigrir, régime (`src/lib/health.ts`). Ce n’est pas un filtre médical complet. C’est un garde-fou de produit.
- Enfants : pas d’e-mail obligatoire, rôle forcé à membre si mineur, contact retiré (`member/[id].tsx`).
- Religion : préférence `showHijri` et `hijriOffset` seulement. Pas de table de pratique religieuse. Le mot-clé store `islam` mélange le calendrier et une identité religieuse que le modèle de données ne porte pas.
- Sentry : envoi maison si `EXPO_PUBLIC_SENTRY_DSN` est défini, messages tronqués et JWT masqués (`src/lib/sentry.ts`). Pas de SDK. Un message d’erreur pourrait encore contenir un prénom si une exception le concatène. Désactivé sans DSN.

### 8. RGPD, consentement, droits parentaux

- Base légale, registre, sous-traitants, durée : pas dans le code. Textes « à valider » sur l’écran vie privée.
- Droits : export et suppression existent. Cette PR précise que l’export est un instantané et que la déconnexion n’efface pas.
- Compte en ligne : la suppression n’efface l’appareil qu’après une RPC réussie (`deleteAccount` dans `data.tsx`). Si le serveur refuse, le message dit que rien n’a été effacé. Ce chemin n’a pas été rejoué sur un projet réel.
- Mineurs : le parent coche un booléen. Pas d’historique de consentement, pas de majorité configurable dans le code de `main`.
- Effacement confirmé : `wipe`, suppression de compte, « Recommencer » du mode essai (`clearAll`). Ils retirent aussi la quarantaine, sinon le droit d’effacer serait fictif.
- La déconnexion n’est pas un effacement.

### 9. Linguistique

- Interface en français. Catégories avec un libellé anglais dans le modèle (`en:`), non utilisé comme locale.
- Dates hégiriennes : noms français et arabe dans `hijri.ts`. Le calcul est tabulaire, le README dit l’écart possible avec l’observation.
- Ton : « Bonjour », encouragements (« Chaque petit pas compte », « Nouveau départ »). Pas d’insulte, pas de « tu as échoué ».
- Aucune autre langue livrée. L’arabe du calendrier n’est pas une UI arabe (pas de `dir` RTL vu dans les écrans).

### 10. Pédagogie, santé, motivation, science

- Rituels : eau, petit-déjeuner, sacs, mot gentil, étirements, réussite du jour, écrans, lecture, gratitude (`model.ts`). Ce sont des habitudes familiales, pas un protocole.
- Objectifs : bouger ensemble, repas sans écran, lecture, grand air (`goal/[id].tsx`). Cible libre. La semaine vide dit « nouveau départ », pas « série cassée ».
- Science : aucune étude, aucun seuil médical codé en dehors du refus poids/IMC/calories et de la phrase « consultez un professionnel de santé ». Ne pas présenter 150 minutes comme une prescription : c’est un exemple de cible.
- Humeur 1 à 5 en emoji (`model.ts`). Ce n’est pas une échelle clinique. Elle est stockée dans la séance, visible sur l’appareil.

### 11. IA, coût, vie privée, anthropométrie, permissions

- IA : aucune. Coût API modèle : nul. Ne pas en ajouter dans cette fondation.
- Anthropométrie : pas de taille, pas de poids, pas de courbe. Le refus à la saisie est le seul contrôle. Un titre contournant l’expression (autre langue, abréviation) passerait. À traiter si le produit s’ouvre à d’autres langues, pas en réécrivant les textes maintenant.
- Permissions réelles dans le code : notifications locales (`expo-notifications`). `app.json` : pas de caméra, photos, micro, contacts, santé, localisation. Manifeste iOS : UserDefaults, horodatage de fichier, boot time, espace disque, raisons déclarées. `NSPrivacyTracking: false`.
- Pas d’achat intégré dans le code. Pas de nouveau service payant ajouté.

### 12. Stores, règles Family / Kids, croissance, éthique, composants partagés

- Brouillon iOS seulement (`store/ios-metadata.md`). Rien n’a été soumis. `eas.json` a un profil de soumission (identifiants d’équipe et d’app) sans clé `.p8` dans le fichier. Aucun build EAS lancé.
- Âge brouillon 4+. L’app manipule des prénoms d’enfants et des humeurs. Ce n’est pas une catégorie Kids au sens d’un espace enfant séparé : il n’y a pas de parental gate d’achat (pas d’achat), mais il n’y a pas non plus de session enfant isolée.
- Google Play Families : aucune fiche dans le dépôt. Ne pas extrapoler.
- Croissance : pas de KPI codé (pas d’analytics). Un indicateur éthique possible, plus tard, serait le nombre de familles qui exportent avant une migration, pas le temps passé ni une série.
- Composants partagés (`kit`, `EventRow`, `ExampleLists`, `TrialBanner`) n’embarquent pas le contenu d’un autre profil. Le risque de mélange est le stockage unique de l’appareil, pas un import croisé entre composants.
- `displayName` évite d’afficher le prénom d’un mineur sans consentement à un membre non parent. Sur un seul appareil, le lecteur est `isMe`. Le masquage ne protège pas contre la personne qui tient le téléphone.

## Top 5 de la semaine

1. **Fondation de conservation** — cette PR. Gardes, export visible, quarantaine, fixtures.
2. **Faire échouer la CI si `npm test` échoue**, avant le déploiement Pages. Sans cela la fondation ne protège que les machines qui lancent les tests.
3. **Appareil partagé** : un lecteur qui n’est pas parent ne doit pas voir notes, humeurs et contacts. Décision de produit courte, puis un verrou borné. Pas de nouveau backend.
4. **Retrait de membre honnête** : le texte et les lignes réellement ôtées (séances, activités) doivent coïncider, avec confirmation, sans effacer les événements des autres.
5. **Fiche store et phrase « 200 % »** : nom distinct de Family Fit GmbH, mot-clé `islam` retiré ou assumé par écrit, étiquette « données non collectées » revue si l’OTP est actif, libellé d’accessibilité aligné sur le code. Aucune soumission.

## Cinq invites prêtes à coller

1. « FamilyFit, branche fraîche depuis main. Ajoute `npm test` au workflow Pages avant l’upload de `dist`. Si un test échoue, pas de déploiement. Ne change pas le schéma, ne lance pas EAS, ne fusionne pas. »

2. « FamilyFit. Sur un seul appareil, `isMe` voit notes, humeurs et contacts. Propose un verrou local (code à 4 chiffres stocké seulement comme condensé, ou choix du lecteur parent) qui masque ces champs aux autres rôles. N’envoie rien au serveur. Fixture : un membre non parent ne reçoit pas la note de séance ni le contact. Garde l’export complet pour le parent qui a le verrou. »

3. « FamilyFit. Le bouton Retirer de la famille dit que les données personnelles sont supprimées, mais les séances et activités restent. Aligne le texte et le code, avec confirmation. Ne supprime pas les événements des autres membres. Teste un membre réel et un membre démo. »

4. « FamilyFit. Passe accessibilité iPhone et iPad en portrait : VoiceOver sur Agenda et Famille, texte système à 200 % sans `allowFontScaling` forcé, corrige la phrase qui promet un plafond absent. Pas de refonte graphique, pas la branche UX ouverte. »

5. « FamilyFit. Plus tard, pas maintenant : protocole de bascule. À partir d’un instantané exporté (comptes + SHA-256), restauration dans un stockage vide isolé, comparaison des comptes et du condensé, retour arrière si ça diffère. Interdit d’écrire dans le stockage d’origine avant égalité. Interdit de promettre une perte nulle. N’exécute pas ce protocole sur un appareil réel tant qu’il n’y a pas une copie vérifiée. »

## Cibles mesurables

| Cible | Seuil | État au 7 novembre 2026 |
|---|---|---|
| Écriture avant lecture réussie de la clé | 0 | Tenue, test `test-persist.mjs` |
| Réécriture si version de schéma lue > version de l’app | 0 | Tenue, `test-preservation.mjs` |
| Clé inconnue supprimée par le plan de migration | 0 | Tenue, fixture `imports` |
| Champs inconnus perdus sur mise à jour partielle ou montée 0 → 1 | 0 sur la fixture | Tenue (`localeFuture`, `schoolClass`, `legacyNote`) |
| Clés autres que `session` modifiées par la déconnexion | 0 | Tenue, fixture et lecture de `signOut` |
| Brut illisible perdu lors d’une réinitialisation confirmée | 0 copie manquante en quarantaine | Tenue sur la fonction pure. Pas rejoué sur un appareil |
| Instantané sans condensé ni phrase « pas une restauration » | 0 | Tenue |
| Effacement confirmé qui laisserait la quarantaine | 0 | Tenue par `diskAfterConfirmedWipe` et `clearAll` |
| Contraste texte / fond | ≥ 4,5:1 | Tenue, test des fondations (chiffres affichés par le script) |
| `npm test` dans le workflow Pages | présent | Non. Cible suivante |
| Restauration isolée : comptes et condensé égaux, puis rollback | protocole écrit et exécuté sur copie | Non exécuté. Pas une promesse de perte nulle |
| Batterie, taille binaire, VoiceOver, OTP réel | mesurés | Non mesurés |

## Fondation livrée avec cet audit

Fichiers : `src/lib/preservation.ts`, `src/lib/storage.ts`, `src/lib/data.tsx`, `src/app/_layout.tsx`, `src/app/(tabs)/family.tsx`, `src/app/privacy.tsx`, `src/components/StorageRecovery.tsx`, `scripts/test-preservation.mjs`, `scripts/fixtures/legacy-disk-v0.json`, `scripts/test-persist.mjs`, `package.json`.

- Version de schéma `1`. Absence de tampon = héritage, les contenus ne sont pas réécrits pour « migrer ». Un objet de version sans entier, ou un JSON de métadonnée cassé, bloque les écritures au lieu d’être écrasé.
- Version supérieure à 1 : bandeau « Écritures en pause », export possible, pas de réensemencement d’essai.
- Mise à jour via fonction : les champs non cités restent. Un remplacement direct (effacement confirmé, nouvelle valeur entière) reste un remplacement voulu.
- Quarantaine des bruts illisibles. La zone n’est pas écrasée si elle-même est illisible ou d’une forme inconnue.
- Export visible : comptes, SHA-256, phrase d’avertissement. Écran vie privée aligné.
- Déconnexion : session seule. `setFamily(null)` retiré de ce chemin.
- Effacements confirmés inchangés dans leur intention : tout l’appareil, compte, recommencer l’essai, retirer la démo, réinitialiser une clé illisible. Ils restent distincts du logout.
- Fixture v0 : famille, membres dont un enfant, événements, rituels, séances, objectifs, activités, listes, préférence future, clé `imports`. La démo est retirée sans emporter le réel.

Hors de cette PR, volontairement : pas de réécriture Swift ou Next, pas de nouveau SDK, pas de changement de contenu des rituels, pas de migration SQL, pas de build, pas de soumission, pas de lecture de données réelles, pas de restauration.

## Limites qui restent vraies après la PR

- `saveJSON` avale encore l’erreur si le disque est plein. L’UI ne le dit pas. Les données précédentes restent si `setItem` a échoué, mais l’écran montre l’état mémoire.
- La quarantaine déduplique par clé et condensé. Elle ne versionne pas plusieurs raisons pour le même brut.
- Le retrait de membre et la suppression d’un objectif (qui, elle, retire aussi les activités, avec confirmation) ne sont pas unifiés.
- Aucune copie de sauvegarde appareil n’a été ouverte. Le protocole de bascule n’a pas été exécuté.
- Un créneau très court existe au démarrage : les écritures sont fermées le temps de lire le tampon. Une frappe dans ce créneau met à jour la mémoire et n’est écrite qu’à la sauvegarde suivante, une fois la porte ouverte.
- L’expression qui refuse le poids ne couvre pas toutes les langues.

## Tests réellement lancés

Commandes, dans cet environnement, après `npm ci` :

- `npx tsc --noEmit` : succès.
- `npm test` : succès. Détail : hijri, garde d’écriture, routes, fondations (contrastes chiffrés, clés, RLS déclarée, secrets, phrase santé), conservation (vecteurs SHA-256 vide et `abc`, fixture v0), puis RLS locale ignorée avec le message `initdb absent`. Aucun projet Supabase contacté.

Non lancés : Expo sur simulateur, téléphone, iPad, navigateur cliqué, export web, EAS, lint de dépôt (il n’y a pas de config ESLint versionnée), restauration depuis une sauvegarde, requête de production.

## Entrées manquantes

- Clés Supabase réelles, région d’hébergement, application ou non de `schema.sql` sur un projet.
- Âge retenu pour un compte adolescent, et validation juridique des textes.
- Nom d’app distinct si Family Fit GmbH bloque la marque.
- Compte de revue, e-mail d’assistance, décision sur Sentry.
- Postgres local (`initdb`) si l’on veut exécuter le SQL d’isolation.
- Un appareil ou une copie de sauvegarde le jour où le protocole de bascule sera tenté. Pas avant une égalité de comptes et de condensé sur une copie isolée.

## Sources

SHA de lecture : `3959aabdd0e45ddf390ba1fe5fb376e18b1aa79e`.

| Constat | Fichier | Lignes sur ce SHA |
|---|---|---|
| Produit décrit | `README.md` | 1–27, 69–74 |
| Pas de synchro complète | `README.md` | 69–70 |
| Tablette portrait, pas de santé dans les permissions | `app.json` | 7–17, 23–56, 80–83 |
| CI sans `npm test`, déploiement Pages | `.github/workflows/pages.yml` | 6–8, 29–32 |
| Mineur, consentement, nom affiché | `src/lib/model.ts` | 10–17, 84–88 |
| Rituels, pas un carnet sportif | `src/lib/model.ts` | 63–67 |
| Conflit = chevauchement d’horaire | `src/lib/events.ts` | 29 |
| Encouragement sans série | `src/lib/goals.ts` | 8–12 |
| Refus poids / IMC / calories | `src/lib/health.ts` | 9–18 |
| Barre de bien-être, pas un graphique | `src/app/(tabs)/wellness.tsx` | 19–42 |
| Déconnexion de route garde la famille | `src/lib/gate.ts` | 6–7, 44–47 |
| OTP et RPC, pas de lecture de tables directe | `src/lib/supabase.ts` | 47–60 |
| Rappels locaux, web non supporté | `src/lib/reminders.ts` | 4–15 |
| Schéma membre, consentement booléen, pas de journal | `supabase/schema.sql` | 20–31 |
| Suppression de compte serveur | `supabase/schema.sql` | 377–479 |
| Retrait membre incomplet vs la phrase | `src/app/member/[id].tsx` | 63–67 |
| Historique de rituel conservé à la suppression du rituel | `src/app/ritual/[id].tsx` | 58 |
| Suppression d’objectif retire le suivi, avec confirmation | `src/app/goal/[id].tsx` | 60 |
| Texte large ×1,5, largeur 860, pas de plafond 200 % | `src/ui/kit.tsx` | 78–104, 419 |
| Nom Family Fit GmbH, mot-clé islam, « data not collected » | `store/ios-metadata.md` | 28, 46–49, 71 |
| Sentry optionnel, sans SDK | `src/lib/sentry.ts` | 1–16, 31–53 |
| Garde d’écriture déjà sur main | `src/lib/persistGuard.ts` | 1–30 |
| Export et logout avant cette PR | `src/app/(tabs)/family.tsx` | 124–127 sur ce SHA |

Lignes de la fondation (cette branche, après le diff) :

| Mécanisme | Fichier | Lignes |
|---|---|---|
| Version, note d’instantané, effacements distincts | `src/lib/preservation.ts` | 8–29, 60–68 |
| Champs inconnus, plan sans suppression | `src/lib/preservation.ts` | 147–176, 205–216 |
| Déconnexion de disque, retrait démo | `src/lib/preservation.ts` | 243–244, 278–296 |
| Porte d’écriture et quarantaine | `src/lib/storage.ts` | 48–82, 93–111, 181 |
| Lecture de version, logout, reset | `src/lib/data.tsx` | 133–168, 253–270 |
| Bandeau et export | `src/app/_layout.tsx` lignes 19–44 ; `src/app/(tabs)/family.tsx` lignes 131–149 | — |
| Fixture | `scripts/fixtures/legacy-disk-v0.json` | fichier entier |
| Phrase droits | `src/app/privacy.tsx` | 9 |
