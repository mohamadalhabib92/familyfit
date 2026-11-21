# Release next

`release/next` est la branche de livraison iPhone et Apple TV. Elle n’est pas `main`.

**Ne pas merger dans `main` sans accord explicite.** Un push sur `main` déclenche `.github/workflows/pages.yml`, qui publie la PWA sur GitHub Pages. Cette branche ne doit pas servir ce déploiement tant que la livraison native n’est pas validée.

Les autres branches ouvertes restent en place. Rien ici ne soumet l’app, ne lance un build EAS, ni ne modifie la signature, les bundle ids ou les entitlements.

## Contrôles

`.github/workflows/pr-checks.yml` tourne à chaque push et à chaque pull request :

1. `npx tsc --noEmit`
2. `npm test`
3. `npx expo export -p web`

Le job ne déploie pas, n’utilise pas de secret, et n’appelle pas EAS. L’export web sert à vérifier que le bundle se construit. La PWA publiée reste celle de `main`.

## TestFlight

Les profils sont déjà dans `eas.json`. Les clés App Store Connect ne sont pas dans le dépôt : `ascApiKeyPath`, `ascApiKeyId` et `ascApiKeyIssuerId` lisent `EXPO_ASC_API_KEY_PATH`, `EXPO_ASC_KEY_ID` et `EXPO_ASC_ISSUER_ID` dans l’environnement EAS du propriétaire.

Depuis cette branche, après les contrôles verts.

### iPhone — profil `production`

```bash
git checkout release/next
npx eas-cli@latest build --platform ios --profile production
npx eas-cli@latest submit --platform ios --profile production --latest
```

Le profil `production` incrémente le numéro de build (`autoIncrement`) et garde le bundle du téléphone. `EXPO_NO_CAPABILITY_SYNC` reste posé par le profil : ne pas réécrire les entitlements à la main.

### Apple TV — profil `production-tv`

```bash
git checkout release/next
npx eas-cli@latest build --platform ios --profile production-tv
npx eas-cli@latest submit --platform ios --profile production-tv --latest
```

Le profil `production-tv` pose `EXPO_TV=1`. `app.config.js` prépare alors le salon (slug `familyfit-tv`, projet EAS `c563620f-7c9e-4354-a3e1-2c43b8bcb31f`, même bundle que l’iPhone, sans splash téléphone). `cli.appVersionSource` est `remote` : EAS ignore `ios.buildNumber` du fichier et injecte le compteur du projet TV. Le dernier compteur était 4 (TestFlight 3 puis 4). `autoIncrement` est vrai sur ce profil seulement, donc le prochain build est 5. Le plugin ne descend jamais sous 5 et ne rabaisse pas un compteur déjà plus haut. Le téléphone reste le projet `familyfit`, build 20.

Les deux soumissions visent la fiche App Store Connect déjà liée. Elles n’installent pas l’app : TestFlight reste une étape manuelle après le submit.
