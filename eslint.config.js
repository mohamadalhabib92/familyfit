// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: {
      // Ces règles du compilateur React signalent le thème vivant, l’hydratation
      // du disque et les refs du salon (horloge, Menu). Les réécrire changerait
      // le lecteur TV. On ne les élargit pas dans cette passe.
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/globals': 'off',
      'react-hooks/purity': 'off',
      // Le lecteur expo-video se règle par mutation (currentTime, muted, pause).
      'react-hooks/immutability': 'off',
    },
  },
]);
