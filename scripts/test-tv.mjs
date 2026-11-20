// Surface TV, Menu Siri, et garde des modules absents du lien tvOS.
import ts from 'typescript';
import { readFileSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');

function load(rel) {
  const js = ts.transpileModule(read(rel), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  const file = join(mkdtempSync(join(tmpdir(), 'tv-')), 'mod.mjs');
  writeFileSync(file, js);
  return import(file);
}

const surface = await load('src/lib/tvSurface.ts');
const menu = await load('src/lib/tvMenu.ts');
const guard = await load('src/lib/tvNativeGuard.ts');
const hd = { width: 1920, height: 1080 };
const hdSafeW = 1920 - 180;
const checks = [];
const ok = (name, pass) => checks.push([name, pass]);

const one = surface.profileGrid(hd, 1);
ok('un profil occupe la largeur, pas une carte de 360', one.columns === 1 && one.cardWidth === hdSafeW && one.cardWidth > 360);
for (const count of [2, 3, 4]) {
  const grid = surface.profileGrid(hd, count);
  const used = grid.columns * grid.cardWidth + grid.gap * (grid.columns - 1);
  ok(`grille ${count} remplit la largeur sûre`, grid.cardWidth > 360 && used <= hdSafeW && hdSafeW - used < grid.columns);
}
const small = surface.profileGrid({ width: 1280, height: 720 }, 3);
ok('1280×720 reste une grille positive', small.cardWidth >= 240 && small.cardHeight >= 120 && small.columns >= 1);
const frame = surface.workoutColumns(hd);
ok('séance 1920×1080 : minuteur dans la hauteur, colonne non figée à 420', frame.fitsWithoutScroll && frame.leftWidth !== 420 && frame.rightWidth > frame.leftWidth && frame.timerSize >= 56);
ok('séance 1280×720 tient aussi', surface.workoutColumns({ width: 1280, height: 720 }).fitsWithoutScroll);
ok('routine en cours non remplacée', surface.canSwitchRoutine(true, 'a', 'b') === false && surface.canSwitchRoutine(true, 'a', 'a') === true && surface.canSwitchRoutine(false, 'a', 'b') === true);
ok('un seul focus préféré', surface.claimsPreferredFocus('routine', 0) === false && surface.claimsPreferredFocus('start', 0) === true && surface.claimsPreferredFocus('profile', 1) === false && surface.claimsPreferredFocus('empty', 0) === true);

ok('Menu racine sort, Menu séance revient', menu.tvMenuAction('profiles') === 'exit-home' && menu.tvMenuAction('session') === 'back-to-profiles');
const calls = [];
const control = {
  enableTVMenuKey() { calls.push('enable'); },
  disableTVMenuKey() { calls.push('disable'); },
};
ok('séance active le geste Menu', menu.applyTvMenuPolicy('session', control) === 'back-to-profiles' && calls.at(-1) === 'enable');
ok('profils retirent le geste Menu', menu.applyTvMenuPolicy('profiles', control) === 'exit-home' && calls.at(-1) === 'disable');
ok('contrôle incomplet ignoré', menu.readTvMenuControl(null) === null && menu.readTvMenuControl({ TVEventControl: { enableTVMenuKey() {} } }) === null && menu.readTvMenuControl({ TVEventControl: control }) === control);
ok('sans module TV, la décision reste', menu.applyTvMenuPolicy('session', null) === 'back-to-profiles');

ok('voix, haptique et notifications non chargés sur TV', ['expo-speech', 'expo-haptics', 'expo-notifications'].every((name) => guard.shouldRequireNative(name, true) === false));
ok('ces modules restent chargés sur iPhone', ['expo-speech', 'expo-haptics', 'expo-notifications'].every((name) => guard.shouldRequireNative(name, false) === true));
ok('le maintien d’écran reste autorisé sur TV', guard.shouldRequireNative('expo-keep-awake', true) === true);

const speech = read('src/lib/speechVoice.ts');
const reminders = read('src/lib/reminders.ts');
const kit = read('src/ui/kit.tsx');
const tv = read('src/app/tv.tsx');
const player = read('src/components/SessionPlayer.tsx');
const focus = read('src/components/tv/focus.tsx');
const menuHook = read('src/components/tv/useTvMenu.ts');
ok('pas d’import eager expo-speech', !speech.includes("from 'expo-speech'") && speech.includes("shouldRequireNative('expo-speech'"));
ok('pas d’import eager expo-notifications', !reminders.includes("from 'expo-notifications'") && reminders.includes("shouldRequireNative('expo-notifications'"));
ok('pas d’import eager expo-haptics', !kit.includes("from 'expo-haptics'") && kit.includes("shouldRequireNative('expo-haptics'"));
ok('le salon n’a plus de largeurs fixes ni de second coach', !tv.includes('width: 360') && !tv.includes('width: 420') && !tv.includes('CoachAvatar') && tv.includes('profileGrid') && tv.includes('workoutColumns'));
ok('le fini s’écrit dans les préférences existantes', tv.includes('setPrefs') && tv.includes('finish'));
ok('Menu : enable, BackHandler, et useTVEventHandler seulement s’il existe', menuHook.includes('enableTVMenuKey') && menuHook.includes('hardwareBackPress') && menuHook.includes("typeof rn.useTVEventHandler === 'function'"));
ok('écran allumé pendant la séance TV', player.includes('expo-keep-awake') && player.includes('activateKeepAwakeAsync') && player.includes('familyfit-tv-workout'));
ok('le lecteur ne se remonte plus avec la routine', !tv.includes('key={`${member.id}:${routine.id}`}') && tv.includes('sessionKey=') && tv.includes('canSwitchRoutine'));
ok('plus de scroll forcé vers 1080', !focus.includes('measureInWindow') && !focus.includes('1080'));

const config = spawnSync(process.execPath, ['-e', `
  const app = require('./app.json');
  delete process.env.FAMILYFIT_TV_EAS_PROJECT_ID;
  process.env.EXPO_TV = '1';
  const tv = require('./app.config.js')({ config: JSON.parse(JSON.stringify(app.expo)) });
  process.env.EXPO_TV = '';
  delete require.cache[require.resolve('./app.config.js')];
  const phone = require('./app.config.js')({ config: JSON.parse(JSON.stringify(app.expo)) });
  if (phone.slug !== 'familyfit' || phone.extra.eas.projectId !== '3104d765-4dcb-492e-ab04-ade0c86471d9') process.exit(2);
  if (phone.ios.bundleIdentifier !== 'com.vibecode.familyfit-lpshhx' || !phone.splash) process.exit(3);
  if (tv.slug !== 'familyfit-tv' || tv.extra.eas.projectId !== 'c563620f-7c9e-4354-a3e1-2c43b8bcb31f') process.exit(4);
  if (tv.ios.bundleIdentifier !== 'com.vibecode.familyfit-lpshhx' || tv.splash) process.exit(5);
`], { cwd: root, env: { ...process.env, EXPO_TV: '', FAMILYFIT_TV_EAS_PROJECT_ID: '' }, encoding: 'utf8' });
if (config.status !== 0) console.error(config.stdout, config.stderr);
ok('slug et projet : téléphone inchangé, TV sans splash', config.status === 0);

let failed = false;
for (const [name, pass] of checks) {
  console.log(pass ? '✓' : '✗', name);
  if (!pass) failed = true;
}
if (failed) process.exit(1);
console.log('TV OK');
