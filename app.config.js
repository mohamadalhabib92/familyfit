// baseUrl n'est utile que pour la PWA (GitHub Pages). Sur les builds natifs EAS,
// il préfixe les assets par "<slug>/", ce qui entre en collision avec
// l'exécutable de même nom (système de fichiers insensible à la casse).
module.exports = ({ config }) => {
  if (process.env.EAS_BUILD) {
    // La synchro des capabilities iOS reste désactivée. baseUrl ne s'applique qu'au web.
    if (!process.env.EXPO_NO_CAPABILITY_SYNC) process.env.EXPO_NO_CAPABILITY_SYNC = '1';
    if (config.experiments) {
      const { baseUrl, ...rest } = config.experiments;
      config.experiments = rest;
    }
  }
  config.extra = { ...(config.extra || {}), tv: process.env.EXPO_TV === '1' };
  if (process.env.EXPO_TV === '1') {
    process.env.RCT_USE_PREBUILT_RNCORE = '0';
    config.plugins = [...(config.plugins || []), './plugins/withTvFromSource'];
  }
  return config;
};
