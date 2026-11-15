#!/usr/bin/env node
/**
 * Après l’install EAS. Le build téléphone ne touche pas node_modules.
 * Le build TV remplace les fichiers ExpoHead qui importent CoreSpotlight,
 * puis refuse un import CoreSpotlight encore nu.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

if (process.env.EXPO_TV !== '1') process.exit(0);

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const patches = join(root, 'tv/patches/expo-router');
const dest = join(root, 'node_modules/expo-router/ios');
for (const name of ['ExpoHeadModule.swift', 'ExpoHeadAppDelegateSubscriber.swift']) {
  const from = join(patches, name);
  const body = readFileSync(from, 'utf8');
  if (!body.includes('#if !os(tvOS)')) {
    console.error('patch TV sans garde', name);
    process.exit(1);
  }
  writeFileSync(join(dest, name), body);
  console.log('TV patch', name);
}

const hits = [];
function walk(dir, depth) {
  if (depth > 5) return;
  let names;
  try { names = readdirSync(dir); } catch { return; }
  for (const name of names) {
    if (name === '.bin' || name === 'android' || name === 'lib') continue;
    const p = join(dir, name);
    let st;
    try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) {
      walk(p, depth + 1);
      continue;
    }
    if (!/\.(swift|m|mm)$/.test(name)) continue;
    const text = readFileSync(p, 'utf8');
    if (!text.includes('import CoreSpotlight') && !text.includes('@import CoreSpotlight')) continue;
    const guarded = text.includes('#if !os(tvOS)') || text.includes('#if os(iOS)');
    if (!guarded) hits.push(p);
  }
}
for (const pkg of ['expo', 'expo-router', 'expo-modules-core', 'expo-linking', 'expo-constants']) {
  walk(join(root, 'node_modules', pkg), 0);
}
if (hits.length) {
  console.error('API CoreSpotlight sans garde tvOS :');
  hits.slice(0, 40).forEach((p) => console.error(' -', p));
  process.exit(1);
}
console.log('Scan tvOS : CoreSpotlight est gardé.');
