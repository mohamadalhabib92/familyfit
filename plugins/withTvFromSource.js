const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Build TV : React Native core depuis les sources.
 * react_native_pods.rb ne garde RCT_USE_PREBUILT_RNCORE=0 que s’il est déjà 0
 * avant l’évaluation du Podfile.
 */
function withTvFromSource(config) {
  if (process.env.EXPO_TV !== '1') return config;
  return withDangerousMod(config, [
    'ios',
    async (c) => {
      const file = path.join(c.modRequest.platformProjectRoot, 'Podfile');
      if (!fs.existsSync(file)) return c;
      let src = fs.readFileSync(file, 'utf8');
      if (src.includes('RCT_USE_PREBUILT_RNCORE')) {
        src = src.replace(/ENV\['RCT_USE_PREBUILT_RNCORE'\]\s*=\s*'[01]'/, "ENV['RCT_USE_PREBUILT_RNCORE'] = '0'");
      } else {
        src = "ENV['RCT_USE_PREBUILT_RNCORE'] = '0'\n" + src;
      }
      fs.writeFileSync(file, src);
      return c;
    },
  ]);
}

module.exports = withTvFromSource;
