// Minutage, adaptation d’âge, conservation du disque, garde TV.
import ts from 'typescript';
import { readFileSync, mkdtempSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

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
const appJson = JSON.parse(read('app.json'));
const focus = read('src/components/tv/focus.tsx');
const checks = [
  ['profil production-tv isolé du téléphone', (() => {
    const json = JSON.parse(eas);
    const tv = json.build['production-tv'];
    const phone = json.build.production;
    return json.cli.appVersionSource === 'remote' && tv && tv.autoIncrement === true && tv.channel === 'production-tv' && tv.env.EXPO_TV === '1' && tv.env.RCT_USE_PREBUILT_RNCORE === '0' && tv.env.EXPO_USE_PRECOMPILED_MODULES === '0' && !tv.extends && phone.autoIncrement === true && phone.env.EXPO_TV == null;
  })()],
  ['iPhone : react-native 0.88 et buildNumber 20', JSON.parse(read('package.json')).dependencies['react-native'] === '0.88.0' && appJson.expo.ios.buildNumber === '20'],
  ['TV : react-native-tvos 0.87-stable, swap seulement sur EAS', read('scripts/tv-build.mjs').includes('npm:react-native-tvos@0.87-stable') && read('scripts/tv-build.mjs').includes("env.EAS_BUILD === 'true'")],
  ['pre-install téléphone ne touche pas le lockfile', (() => {
    const dir = mkdtempSync(join(tmpdir(), 'tvhook-'));
    const lock = '{"name":"phone"}';
    writeFileSync(join(dir, 'package.json'), '{"dependencies":{"react-native":"0.88.0"}}\n');
    writeFileSync(join(dir, 'package-lock.json'), lock);
    const phone = spawnSync(process.execPath, [join(root, 'scripts/eas-tv-preinstall.mjs')], { cwd: dir, env: { ...process.env, EXPO_TV: '0', EAS_BUILD: 'true' }, encoding: 'utf8' });
    const localTv = spawnSync(process.execPath, [join(root, 'scripts/eas-tv-preinstall.mjs')], { cwd: dir, env: { ...process.env, EXPO_TV: '1', EAS_BUILD: '' }, encoding: 'utf8' });
    return phone.status === 0 && localTv.status === 0 && readFileSync(join(dir, 'package-lock.json'), 'utf8') === lock && readFileSync(join(dir, 'package.json'), 'utf8').includes('0.88.0');
  })()],
  ['patch routeur : tvOS 16.4, sans Link Preview ni Toolbar, sans else orphelin', (() => {
    const patch = createRequire(join(root, 'scripts/tv-native-patch.cjs'))('./tv-native-patch.cjs');
    const head = patch.patchExpoHeadSubscriberSource(readFileSync(join(root, 'node_modules/expo-router/ios/ExpoHeadAppDelegateSubscriber.swift'), 'utf8'));
    const pod = patch.patchExpoRouterPodspecSource(readFileSync(join(root, 'node_modules/expo-router/ios/ExpoRouter.podspec'), 'utf8'));
    const cache = patch.patchVideoCachingHelpersSource(readFileSync(join(root, 'node_modules/expo-video/ios/Cache/CachingHelpers.swift'), 'utf8'));
    const asset = patch.patchVideoAssetSource(readFileSync(join(root, 'node_modules/expo-video/ios/VideoAsset.swift'), 'utf8'));
    const photos = patch.patchVideoMediaLibrarySource(readFileSync(join(root, 'node_modules/expo-video/ios/Utils/URL+MediaLibraryAssets.swift'), 'utf8'));
    const player = patch.patchVideoPlayerSource(readFileSync(join(root, 'node_modules/expo-video/ios/VideoPlayer.swift'), 'utf8'));
    const cacheTv = patch.compiledFor(cache, 'tvos');
    const cacheIos = patch.compiledFor(cache, 'ios');
    const photosTv = patch.compiledFor(photos, 'tvos');
    const photosIos = patch.compiledFor(photos, 'ios');
    const playerTv = patch.compiledFor(player, 'tvos');
    const playerIos = patch.compiledFor(player, 'ios');
    const banned = (text) => /\bimport MobileCoreServices\b/.test(text) || /\bimport Photos\b/.test(text) || /\bPHAsset\b/.test(text);
    return head.includes('#if !os(tvOS)') && !head.includes('#if !os(tvOS)\n    } else if') && pod.includes(":tvos => '16.4'") && pod.includes("s.tvos.exclude_files = 'LinkPreview/**/*', 'Toolbar/**/*'")
      && !banned(cacheTv) && cacheTv.includes('UniformTypeIdentifiers') && cacheTv.includes('preferredFilenameExtension')
      && cacheIos.includes('import MobileCoreServices') && cacheIos.includes('UTTypeCreatePreferredIdentifierForTag')
      && !banned(patch.compiledFor(asset, 'tvos')) && patch.compiledFor(asset, 'ios').includes('import MobileCoreServices')
      && !banned(photosTv) && photosTv.includes('toUrlWithPermissions') && photosIos.includes('import Photos') && photosIos.includes('PHAsset.fetchAssets')
      && !banned(playerTv) && playerIos.includes('PHAsset');
  })()],
  ['modules absents de tvOS exclus', ['familyfit-health', 'expo-haptics', 'expo-notifications', 'expo-speech'].every((name) => read('scripts/tv-native.cjs').includes(name))],
  ['focus 10 pieds', focus.includes('onFocus') && focus.includes('onBlur') && focus.includes('tvFocusScale') && focus.includes('TV_FOCUS_CREAM') && focus.includes('TV_FOCUS_INK') && focus.includes('TV_FOCUS_COPPER') && focus.includes('TVFocusGuideView') && focus.includes('hasTVPreferredFocus') && read('src/lib/tvSurface.ts').includes('horizontal: 90') && read('src/lib/tvSurface.ts').includes('vertical: 60') && read('src/lib/tvFocus.ts').includes("export const TV_FOCUS_CREAM = '#F4EBD9'") && read('src/lib/tvFocus.ts').includes("export const TV_FOCUS_INK = '#0E2A22'") && read('src/lib/tvFocus.ts').includes("export const TV_FOCUS_COPPER = '#C8875A'") && read('src/lib/tvFocus.ts').includes('export const TV_FOCUS_SCALE = 1.05') && read('src/lib/tvFocus.ts').includes('export const TV_FOCUS_BORDER = 3') && !focus.includes('measureInWindow') && !focus.includes('1080') && !focus.includes('#F6C453') && !focus.includes('1.08')],
  ['verre : flou, repli plein, boutons en relief', read('src/ui/glass.tsx').includes('0.90') && read('src/ui/effects.tsx').includes('reduceTransparency') && read('src/ui/kit.tsx').includes('raisedShadow')],
  ['catalogue tvOS aux tailles Apple', ['icon-home-front.png', 'icon-home-back.png', 'icon-store-front.png', 'icon-store-back.png', 'top-shelf.png', 'top-shelf-wide.png'].every((name) => existsSync(join(root, 'assets/tv', name)))],
  ['tampon natif TV plancher 5, au-dessus du distant 4', (() => {
    const pods = createRequire(join(root, 'plugins/with-tv-pods.js'))('./with-tv-pods.js');
    return pods.TV_BUNDLE_VERSION === '5' && read('scripts/tv-build.mjs').includes("export const TV_BUNDLE_VERSION = '5'") && pods.resolvedTvBuildNumber({ ios: { buildNumber: '4' } }) === '5' && pods.resolvedTvBuildNumber({ ios: { buildNumber: '5' } }) === '5' && pods.resolvedTvBuildNumber({ ios: { buildNumber: '6' } }) === '6' && pods.resolvedTvBuildNumber({}) === '5';
  })()],
  ['config TV : build 5, projet familyfit-tv, même bundle, iPhone inchangé', (() => {
    const r = spawnSync(process.execPath, ['-e', `
      const app = require('./app.json');
      delete process.env.FAMILYFIT_TV_EAS_PROJECT_ID;
      process.env.EXPO_TV = '1';
      const tv = require('./app.config.js')({ config: JSON.parse(JSON.stringify(app.expo)) });
      process.env.FAMILYFIT_TV_EAS_PROJECT_ID = 'override-id';
      delete require.cache[require.resolve('./app.config.js')];
      const tvOverride = require('./app.config.js')({ config: JSON.parse(JSON.stringify(app.expo)) });
      process.env.EXPO_TV = '';
      delete process.env.FAMILYFIT_TV_EAS_PROJECT_ID;
      delete require.cache[require.resolve('./app.config.js')];
      const phone = require('./app.config.js')({ config: JSON.parse(JSON.stringify(app.expo)) });
      if (tv.ios.buildNumber !== '5' || tv.ios.infoPlist.CFBundleVersion !== '5') process.exit(2);
      if (tv.extra.eas.projectId !== 'c563620f-7c9e-4354-a3e1-2c43b8bcb31f') process.exit(3);
      if (tv.ios.bundleIdentifier !== 'com.vibecode.familyfit-lpshhx' || tv.slug !== 'familyfit-tv') process.exit(4);
      if (tvOverride.extra.eas.projectId !== 'override-id' || tvOverride.slug !== 'familyfit-tv') process.exit(7);
      if (phone.ios.buildNumber !== '20' || app.expo.ios.buildNumber !== '20') process.exit(5);
      if (phone.slug !== 'familyfit' || phone.extra.eas.projectId !== '3104d765-4dcb-492e-ab04-ade0c86471d9') process.exit(6);
      if (tv.splash) process.exit(8);
      if (!phone.splash || phone.splash.image !== './assets/splash-icon.png') process.exit(9);
    `], { cwd: root, env: { ...process.env, EXPO_TV: '', FAMILYFIT_TV_EAS_PROJECT_ID: '' }, encoding: 'utf8' });
    if (r.status !== 0) console.error(r.stdout, r.stderr);
    return r.status === 0;
  })()],
  ['projet Expo et bundle inchangés', appJson.expo.extra.eas.projectId === '3104d765-4dcb-492e-ab04-ade0c86471d9' && appJson.expo.ios.bundleIdentifier === 'com.vibecode.familyfit-lpshhx'],
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
