// baseUrl n'est utile que pour la PWA (GitHub Pages). Sur les builds natifs EAS,
// il préfixe les assets par "<slug>/", ce qui entre en collision avec
// l'exécutable de même nom (système de fichiers insensible à la casse).
const PHONE_PROJECT_ID = '3104d765-4dcb-492e-ab04-ade0c86471d9';
const BUNDLE_ID = 'com.vibecode.familyfit-lpshhx';

module.exports = ({ config }) => {
  if (process.env.EXPO_TV === '1') return withAppleTv(config);
  if (process.env.EAS_BUILD) {
    if (!process.env.EXPO_NO_CAPABILITY_SYNC) process.env.EXPO_NO_CAPABILITY_SYNC = '1';
    if (config.experiments) {
      const { baseUrl, ...rest } = config.experiments;
      config.experiments = rest;
    }
  }
  config.extra = { ...(config.extra || {}), tv: false };
  if (config.extra.eas) config.extra.eas.projectId = PHONE_PROJECT_ID;
  if (config.ios) config.ios.buildNumber = config.ios.buildNumber || '1';
  return config;
};

const TV_DROP_INFO = [
  'NSBluetoothAlwaysUsageDescription',
  'NSCameraUsageDescription',
  'NSPhotoLibraryUsageDescription',
  'NSMicrophoneUsageDescription',
  'NSMotionUsageDescription',
  'NSLocationWhenInUseUsageDescription',
  'NSHealthShareUsageDescription',
  'NSHealthUpdateUsageDescription',
];

/**
 * Même projet Expo, même bundle que l’iPhone. Le numéro de build TV est 2
 * et n’est écrit que lorsque EXPO_TV=1. Le buildNumber iPhone du fichier
 * app.json n’est pas modifié.
 */
function withAppleTv(config) {
  if (process.env.EAS_BUILD && config.experiments) {
    const { baseUrl, ...rest } = config.experiments;
    config.experiments = rest;
  }
  config.plugins = [
    'expo-router',
    ['@react-native-tvos/config-tv', {
      isTV: true,
      tvosDeploymentTarget: '16.4',
      appleTVImages: {
        iconSmallLayers: { front: './assets/tv/icon-home-front.png', back: './assets/tv/icon-home-back.png' },
        iconSmall2xLayers: { front: './assets/tv/icon-home-front@2x.png', back: './assets/tv/icon-home-back@2x.png' },
        iconLayers: { front: './assets/tv/icon-store-front.png', back: './assets/tv/icon-store-back.png' },
        topShelf: './assets/tv/top-shelf.png',
        topShelf2x: './assets/tv/top-shelf@2x.png',
        topShelfWide: './assets/tv/top-shelf-wide.png',
        topShelfWide2x: './assets/tv/top-shelf-wide@2x.png',
      },
    }],
    './plugins/with-tv-pods.js',
  ];
  config.orientation = 'landscape';
  config.slug = 'familyfit';
  config.owner = config.owner || 'habib548';
  config.ios = config.ios || {};
  config.ios.bundleIdentifier = BUNDLE_ID;
  config.ios.buildNumber = '2';
  config.ios.appleTeamId = 'Y9XF9RY2BU';
  config.ios.entitlements = {};
  const info = { ...(config.ios.infoPlist || {}) };
  for (const key of TV_DROP_INFO) delete info[key];
  info.CFBundleVersion = '2';
  config.ios.infoPlist = info;
  config.extra = { ...(config.extra || {}), tv: true };
  config.extra.eas = { ...(config.extra.eas || {}), projectId: PHONE_PROJECT_ID };
  return config;
}
