const { withInfoPlist, withEntitlementsPlist, withAndroidManifest } = require('expo/config-plugins');

const SHARE = 'FamilyFit peut lire vos pas pour les afficher dans la famille. Le refus n’empêche pas les séances. Aucun diagnostic.';
const UPDATE = 'FamilyFit peut enregistrer une séance terminée dans Santé. Le refus laisse la séance uniquement dans l’app.';

/** Permissions Santé. L’entitlement HealthKit n’est écrit que si EXPO_HEALTHKIT=1 (capacité à activer par le propriétaire). Ignoré sur le build TV. */
function withFamilyFitHealth(config) {
  if (process.env.EXPO_TV === '1') return config;
  config = withInfoPlist(config, (c) => {
    c.modResults.NSHealthShareUsageDescription = c.modResults.NSHealthShareUsageDescription || SHARE;
    c.modResults.NSHealthUpdateUsageDescription = c.modResults.NSHealthUpdateUsageDescription || UPDATE;
    return c;
  });
  if (process.env.EXPO_HEALTHKIT === '1') {
    config = withEntitlementsPlist(config, (c) => {
      c.modResults['com.apple.developer.healthkit'] = true;
      if (!c.modResults['com.apple.developer.healthkit.access']) c.modResults['com.apple.developer.healthkit.access'] = [];
      return c;
    });
  }
  config = withAndroidManifest(config, (c) => {
    const manifest = c.modResults.manifest;
    const perms = new Set((manifest['uses-permission'] || []).map((p) => p.$['android:name']));
    for (const name of ['android.permission.health.READ_STEPS', 'android.permission.health.WRITE_EXERCISE']) {
      if (!perms.has(name)) {
        manifest['uses-permission'] = manifest['uses-permission'] || [];
        manifest['uses-permission'].push({ $: { 'android:name': name } });
      }
    }
    const app = manifest.application?.[0];
    if (app) {
      app['activity-alias'] = app['activity-alias'] || [];
      const exists = app['activity-alias'].some((a) => a.$['android:name'] === '.ViewHealthPermissionUsage');
      if (!exists) {
        app['activity-alias'].push({
          $: {
            'android:name': '.ViewHealthPermissionUsage',
            'android:exported': 'true',
            'android:targetActivity': '.MainActivity',
            'android:permission': 'android.permission.START_VIEW_PERMISSION_USAGE',
          },
          'intent-filter': [{
            action: [{ $: { 'android:name': 'android.intent.action.VIEW_PERMISSION_USAGE' } }],
            category: [{ $: { 'android:name': 'android.intent.category.HEALTH_PERMISSIONS' } }],
          }],
        });
      }
    }
    return c;
  });
  return config;
}

module.exports = withFamilyFitHealth;
