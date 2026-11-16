const { TV_AUTOLINK_EXCLUDE } = require('./scripts/tv-native.cjs');

/** Sans EXPO_TV, aucune dépendance n’est retirée : le lien iPhone reste celui du lockfile. */
const dependencies = process.env.EXPO_TV === '1'
  ? Object.fromEntries(TV_AUTOLINK_EXCLUDE.map((name) => [name, { platforms: { ios: null, android: null } }]))
  : {};

module.exports = { dependencies };
