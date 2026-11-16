/**
 * Modules retirés du lien natif Apple TV. Une seule liste, lue par le hook EAS,
 * le plugin Podfile et react-native.config.js. Inerte tant que EXPO_TV n’est pas 1.
 *
 * Pas de podspec tvOS : santé, voix système, haptique, notifications.
 * expo-router est patché à part (tvOS + exclusion Link Preview / Toolbar).
 */
const TV_AUTOLINK_EXCLUDE = [
  'familyfit-health',
  'expo-haptics',
  'expo-notifications',
  'expo-speech',
  'expo-image-picker',
  'expo-camera',
  'react-native-ble-plx',
  'expo-widgets',
  'expo-quick-actions',
];

/** Les xcframework Maven sont le cœur iOS upstream, pas le fork tvOS. */
const TV_RN_CORE_FROM_SOURCE = '0';

module.exports = { TV_AUTOLINK_EXCLUDE, TV_RN_CORE_FROM_SOURCE };
