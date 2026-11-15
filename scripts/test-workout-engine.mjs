// Minutage, adaptation d’âge, conservation du disque, garde TV.
import ts from 'typescript';
import { readFileSync, mkdtempSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');
const src = read('src/lib/workoutEngine.ts');
const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const f = join(mkdtempSync(join(tmpdir(), 'workout-')), 'engine.mjs');
writeFileSync(f, js);
const m = await import(f);
const res = m.runWorkoutSelfTests();
for (const r of res) console.log(r.ok ? '✓' : '✗', r.name);

const eas = read('eas.json');
const checks = [
  ['profil production-tv', eas.includes('"production-tv"') && eas.includes('"EXPO_TV": "1"') && eas.includes('"RCT_USE_PREBUILT_RNCORE": "0"') && read('scripts/eas-pre-install.mjs').includes('react-native-tvos@0.88.0-0') && read('scripts/eas-pre-install.mjs').includes("EXPO_TV !== '1'")],
  ['pre-install téléphone ne touche pas le lockfile', (() => {
    const dir = mkdtempSync(join(tmpdir(), 'tvhook-'));
    const lock = '{"name":"phone"}';
    writeFileSync(join(dir, 'package.json'), '{"dependencies":{"react-native":"0.88.0"}}\n');
    writeFileSync(join(dir, 'package-lock.json'), lock);
    const r = spawnSync(process.execPath, [join(root, 'scripts/eas-pre-install.mjs')], { cwd: dir, env: { ...process.env, EXPO_TV: '0' }, encoding: 'utf8' });
    return r.status === 0 && existsSync(join(dir, 'package-lock.json')) && readFileSync(join(dir, 'package-lock.json'), 'utf8') === lock;
  })()],
  ['patch CoreSpotlight gardé pour tvOS', read('tv/patches/expo-router/ExpoHeadModule.swift').includes('#if !os(tvOS)') && read('tv/patches/expo-router/ExpoHeadAppDelegateSubscriber.swift').includes('#if !os(tvOS)') && read('tv/patches/expo-router/ExpoHeadModule.swift').includes('import CoreSpotlight')],
  ['projet Expo et bundle inchangés', JSON.parse(read('app.json')).expo.extra.eas.projectId === '3104d765-4dcb-492e-ab04-ade0c86471d9' && JSON.parse(read('app.json')).expo.ios.bundleIdentifier === 'com.vibecode.familyfit-lpshhx'],
  ['design tokens présents', read('src/ui/theme.ts').includes('space:') && read('src/ui/theme.ts').includes('motion:') && read('docs/design-system.md').includes('Réduire les animations')],
];
for (const [name, ok] of checks) {
  console.log(ok ? '✓' : '✗', name);
  res.push({ name, ok });
}

const dark = read('src/ui/themeDark.ts');
function lin(c) { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }
function L(hex) {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
}
function contrast(a, b) {
  const hi = Math.max(L(a), L(b));
  const lo = Math.min(L(a), L(b));
  return (hi + 0.05) / (lo + 0.05);
}
function token(name) {
  const found = dark.match(new RegExp(name + ":\\s*'(#[0-9A-Fa-f]{6})'"));
  if (!found) throw new Error(name);
  return found[1];
}
for (const [fg, bg] of [['text', 'bg'], ['muted', 'bg'], ['accentText', 'bg'], ['primary', 'bg'], ['onPrimary', 'primary'], ['text', 'surface']]) {
  const ratio = contrast(token(fg), token(bg));
  const ok = ratio >= 4.5;
  console.log(ok ? '✓' : '✗', `sombre ${fg}/${bg} ${ratio.toFixed(2)}`);
  res.push({ name: `sombre ${fg}/${bg}`, ok });
}

if (res.some((r) => !r.ok)) process.exit(1);
console.log('Séances OK');
