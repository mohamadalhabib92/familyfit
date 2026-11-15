#!/usr/bin/env node
/**
 * Hook EAS pre-install.
 * Les builds téléphone sortent tout de suite : package.json et package-lock.json
 * du dépôt ne sont pas réécrits.
 * Un build TV (EXPO_TV=1) pointe react-native vers react-native-tvos dans
 * la copie de travail EAS, retire le lockfile de cette copie pour que l’install
 * qui suit résolve la fourche, et écarte les modules réservés au téléphone.
 * Le lockfile commité n’est pas modifié : ce script ne fait aucun git.
 */
import { readFileSync, writeFileSync, rmSync } from 'node:fs';

if (process.env.EXPO_TV !== '1') {
  process.exit(0);
}

process.env.RCT_USE_PREBUILT_RNCORE = '0';

const PHONE_ONLY = [
  'react-native-health',
  'react-native-health-connect',
  'react-native-ble-plx',
  'expo-camera',
  'expo-sensors',
  'expo-widgets',
  'expo-quick-actions',
];

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
pkg.dependencies['react-native'] = 'npm:react-native-tvos@0.88.0-0';
for (const name of PHONE_ONLY) {
  if (pkg.dependencies) delete pkg.dependencies[name];
  if (pkg.devDependencies) delete pkg.devDependencies[name];
}
pkg.expo = pkg.expo || {};
pkg.expo.autolinking = pkg.expo.autolinking || {};
const exclude = new Set(pkg.expo.autolinking.exclude || []);
for (const name of [...PHONE_ONLY, 'familyfit-health']) exclude.add(name);
pkg.expo.autolinking.exclude = [...exclude];
writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
rmSync('package-lock.json', { force: true });
console.log('TV pre-install: react-native → react-native-tvos@0.88.0-0, lockfile de travail retiré, modules téléphone exclus.');
