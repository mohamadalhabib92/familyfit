// Repli vidéo, hors ligne, haptique, minuteur, textes. Aucune clé @familyfit/ nouvelle.
import ts from 'typescript';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');
let failed = 0;
const ok = (name, pass) => {
  console.log(pass ? '✓' : '✗', name);
  if (!pass) failed += 1;
};

const opts = { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } };
const dir = mkdtempSync(join(tmpdir(), 'polish-'));
function load(rel, name) {
  writeFileSync(join(dir, name), ts.transpileModule(read(rel), opts).outputText);
  return import(join(dir, name));
}

const playback = await load('src/lib/playback.ts', 'playback.mjs');
ok('erreur vidéo = poster', playback.videoPlaybackFailed('error') && playback.showVideoPoster('error', true));
ok('prêt = plus de poster', !playback.showVideoPoster('readyToPlay', false));
ok('chargement court = poster', playback.showVideoPoster('loading', false));
ok('chargement long = on montre l’image', !playback.showVideoPoster('loading', true));
ok('seek refusé si temps illisible', !playback.shouldSeekMedia(Number.NaN, 400, 1000, 0));
ok('seek refusé si trop tôt', !playback.shouldSeekMedia(0, 400, 100, 0));
ok('seek si l’écart dépasse 100 ms', playback.shouldSeekMedia(0, 400, 1000, 0));
ok('seek refusé sous le seuil', !playback.shouldSeekMedia(350, 400, 1000, 0));

const haptics = await load('src/lib/haptics.ts', 'haptics.mjs');
ok('haptique téléphone', haptics.shouldPulse(true, false, false));
ok('pas d’haptique TV, réduit, ou réglage coupé', !haptics.shouldPulse(true, true, false) && !haptics.shouldPulse(true, false, true) && !haptics.shouldPulse(false, false, false));

const reach = await load('src/lib/reachability.ts', 'reachability.mjs');
ok('hors ligne seulement si la connexion est fausse', reach.isOffline(false) && !reach.isOffline(true) && !reach.isOffline(null) && !reach.isOffline(undefined));

const focusMod = await load('src/lib/tvFocus.ts', 'tvFocus.mjs');
ok('échelle 1,05 seulement au focus', focusMod.tvFocusScale(true, false) === 1.05 && focusMod.tvFocusScale(true, true) === 1 && focusMod.tvFocusScale(false, false) === 1);
ok('bord cuivre 3 pt au focus', focusMod.tvFocusBorderWidth(true) === 3 && focusMod.tvFocusBorderWidth(false) === 2);
ok('rail vide non monté', focusMod.shouldMountFocusRail(0) === false && focusMod.shouldMountFocusRail(Number.NaN) === false && focusMod.focusRail([null, undefined]).length === 0);
ok('rail avec éléments monté', focusMod.shouldMountFocusRail(2) && focusMod.focusRail(['a', null, 'b']).join(',') === 'a,b');
const release = await load('src/lib/releaseSurface.ts', 'release.mjs');
ok('surfaces dev cachées en release', release.showDevSurfaces(false) === false && release.showDevSurfaces(true) === true);

const stage = read('src/components/moves/DemoStage.tsx');
ok('lecteur sans plaque #1D2522', !stage.includes('#1D2522') && stage.includes('surfaceAlt') && stage.includes('videoPlaybackFailed'));
ok('boundary qui remonte l’arbre', read('src/ui/ErrorBoundary.tsx').includes('attempt: state.attempt + 1'));
const focus = read('src/components/tv/focus.tsx');
ok('focus salon : crème, encre, cuivre, onFocus', focus.includes('onFocus') && focus.includes('onBlur') && focus.includes('TV_FOCUS_CREAM') && focus.includes('TV_FOCUS_INK') && focus.includes('TvRail') && focus.includes('shouldMountFocusRail'));
ok('diagnostic absent de la release', read('src/app/config.tsx').includes('showDevSurfaces') && read('src/app/auth.tsx').includes('showDevSurfaces') && read('src/app/(tabs)/family.tsx').includes('showDevSurfaces'));

const i18n = read('src/lib/i18n.ts');
for (const key of ['moves.videoFailed', 'net.offline', 'health.disclaimer']) {
  const count = i18n.split(`'${key}'`).length - 1;
  ok(`texte ${key} dans les quatre langues`, count >= 4);
}
ok('phrase santé française inchangée', i18n.includes('HEALTH_DISCLAIMER') && read('src/lib/health.ts').includes('Consultez un professionnel de santé'));
ok('onboarding sans family!', !read('src/app/onboarding.tsx').includes('family!'));
ok('test npm avant le déploiement web', read('.github/workflows/pages.yml').includes('npm test') && read('.github/workflows/pages.yml').indexOf('npm test') < read('.github/workflows/pages.yml').indexOf('npm run build:web'));
ok('clés de stockage non renommées dans cette passe', !read('src/lib/reachability.ts').includes('@familyfit/') && !read('src/lib/playback.ts').includes('@familyfit/'));

if (failed) {
  console.log(failed, 'échec(s)');
  process.exit(1);
}
console.log('Polish OK');
