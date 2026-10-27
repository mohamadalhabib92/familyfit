# FamilyFit — fiche App Store (brouillon)

> Brouillon à recopier dans App Store Connect. Rien n'a été soumis.

| Champ | Valeur |
|---|---|
| Nom (≤ 30) | FamilyFit – Rituels en famille (30 car.) |
| Sous-titre (≤ 30) | Agenda hégirien et bien-être (28 car.) |
| Bundle ID | `ch.mohamadba.familyfit` |
| SKU proposé | `familyfit-ios-001` |
| Projet EAS | `3104d765-4dcb-492e-ab04-ade0c86471d9` (compte habib548) |
| Version / build | 1.0.0 / numéro de build géré par EAS (remote, autoIncrement) |
| Langue principale | Français |
| Catégorie principale | Style de vie (Lifestyle) |
| Catégorie secondaire | Productivité (Productivity) |
| Prix | Gratuit |
| URL de confidentialité | https://mohamadalhabib92.github.io/familyfit/privacy/ |
| URL d'assistance | https://mohamadalhabib92.github.io/familyfit/support/ |
| URL marketing | https://mohamadalhabib92.github.io/familyfit/ |
| Copyright | 2026 Mohamed El Habib Ba |
| Appareils | iPhone + iPad (supportsTablet) |
| Chiffrement | Aucun chiffrement non exempté (ITSAppUsesNonExemptEncryption = false) |

## Texte promotionnel (≤ 170)
L'agenda familial avec la date hégirienne, des rituels du matin et du soir et des objectifs de bien-être à partager.

## Mots-clés (≤ 100, séparés par des virgules)
`famille,agenda,hégirien,hijri,rituels,routine,bien-être,enfants,objectifs,calendrier,islam` (90 car.)

## Description — FR
FamilyFit aide la famille à s'organiser et à prendre de bonnes habitudes ensemble.

• Agenda de la semaine avec la date hégirienne de chaque jour.
• 5 catégories colorées, répétitions et conflits d'horaire signalés.
• Rituels du matin et du soir : checklist, participants, humeur, historique, rappel quotidien.
• Objectifs de bien-être partagés (minutes d'activité, repas sans écran…), sans conseil médical.
• Rôles Administrateur, Parent et Membre, invitations par code, profils d'enfants sans compte.
• Vie privée : aucune géolocalisation, export et suppression totale des données.

## Description — EN
FamilyFit is a family planner with Hijri dates on every day, colour categories, recurrence and conflict alerts, morning and evening rituals with daily reminders, shared light wellbeing goals (no medical advice), family roles and invitation codes. No location tracking; export or delete all your data at any time.

## Classification par âge
4+ — réponses au questionnaire : aucune violence, aucun contenu sexuel, pas de jeux d'argent, pas de navigation web non filtrée, pas de contenu médical, pas de messagerie entre utilisateurs.

## Confidentialité de l'app (étiquettes « nutrition »)
- **Collecte de données : « Nous ne collectons pas de données »** (Data Not Collected). Tout est stocké uniquement sur l'appareil et n'est transmis ni à l'éditeur ni à des tiers (au sens d'Apple, il n'y a donc pas de « collecte »).
- Suivi (tracking) : Non. Pas d'identifiant publicitaire.
- À revoir si un backend (Supabase, Stripe, API) est activé dans une version future.

Données stockées localement (pour information) :
- L'adresse e-mail ou le numéro saisi pour la connexion (en mode démo, le code est simulé et rien n'est envoyé) ;
- Votre famille (prénoms, rôles, profils d'enfants), vos événements, rituels, objectifs de bien-être, humeurs et notes facultatives ;
- Vos préférences, dont l'heure des rappels.

Autorisations :
- Notifications : facultatives, pour le rappel quotidien de vos rituels. Ce sont des notifications locales, programmées sur l'appareil.

## Notes pour l'équipe de révision (App Review)
Au premier lancement, choisissez « Continuer en mode démo (local) ». La connexion par code (OTP) est alors SIMULÉE : le code s'affiche à l'écran, aucun e-mail ni SMS n'est envoyé. Toutes les données restent sur l'appareil. Les notifications ne servent qu'au rappel quotidien des rituels.

Contact révision : à compléter (prénom, nom, téléphone, e-mail de Mohamed). Compte de démonstration : non requis.

## Captures d'écran à fournir
- iPhone 6,9 pouces (1320 × 2868 ou 1290 × 2796) : 3 à 10 captures.
- iPad 13 pouces (2064 × 2752 ou 2048 × 2732) : 3 à 10 captures (obligatoire car l'app est disponible sur iPad).

## Risques de refus (App Review) et corrections
| Niveau | Risque | À faire avant soumission |
|---|---|---|
| Élevé | Nom et marque : « FamilyFit » est déjà utilisé sur l'App Store par Family Fit GmbH (risque 5.2 et nom refusé dans App Store Connect). | Utiliser « FamilyFit – Rituels en famille » au minimum ; idéalement un nom distinct. |
| Élevé | 4.3 Spam avec FamCal (deux agendas familiaux). | Publier une seule des deux apps, ou mettre en avant ce qui est propre à FamilyFit (rituels, hégirien, bien-être). |
| Moyen | 2.1 L'écran « Configuration requise » (Supabase) et la connexion démo peuvent sembler inachevés. | Masquer l'écran de configuration dans la version App Store et démarrer directement en mode local, ou activer Supabase. |
| Faible | Bien-être : pas de conseil médical (déjà le cas). | Garder la mention « aucun conseil médical ». |
