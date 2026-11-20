// Intégrité du roster photo et de la bibliothèque de mouvements.
import ts from 'typescript';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { mkdtempSync, writeFileSync } from 'node:fs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');
const src = read('src/lib/coachLibrary.ts');
const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const f = join(mkdtempSync(join(tmpdir(), 'coaches-')), 'library.mjs');
writeFileSync(f, js);
const m = await import(f);
const res = m.runCoachLibrarySelfTests();
for (const r of res) console.log(r.ok ? '✓' : '✗', r.name);

const limit = 150 * 1024;
const photos = m.COACH_IMAGE_FILES;
const checks = [
  ['sept jpeg sous 150 Ko', photos.length === 7 && photos.every((name) => {
    const p = join(root, 'assets/coaches', name);
    return existsSync(p) && statSync(p).size > 1000 && statSync(p).size <= limit;
  })],
  ['photo du duo papa et garçon', existsSync(join(root, 'assets/coaches/coach-papa-garcon.jpg'))],
  ['ancienne photo avec Coach Homme absente', !existsSync(join(root, 'assets/coaches/coach-homme-garcon.jpg'))],
  ['vidéos squat et planche', ['coach-homme-squat-v2.mp4', 'coach-femme-planche-v2.mp4'].every((name) => {
    const p = join(root, 'assets/coach-videos', name);
    return existsSync(p) && statSync(p).size > 1000;
  })],
  ['require des photos et des deux vidéos', ['coach-papa-garcon.jpg', 'coach-homme-squat-v2.mp4', 'coach-femme-planche-v2.mp4'].every((name) => read('src/components/moves/media.ts').includes(name))],
  ['écrans zone, liste, démo', ['src/app/moves/index.tsx', 'src/app/moves/[part].tsx', 'src/app/moves/demo/[id].tsx'].every((rel) => existsSync(join(root, rel)))],
  ['lecteur expo-video en boucle, muet', read('src/components/moves/DemoStage.tsx').includes("from 'expo-video'") && read('src/components/moves/DemoStage.tsx').includes('p.loop = true') && read('src/components/moves/DemoStage.tsx').includes('p.muted = true')],
  ['focus TV sur les cartes', read('src/app/moves/index.tsx').includes('TvFocusable') && read('src/components/tv/focus.tsx').includes('hasTVPreferredFocus')],
  ['build iPhone inchangé', JSON.parse(read('app.json')).expo.ios.buildNumber === '2'],
];
for (const [name, ok] of checks) {
  console.log(ok ? '✓' : '✗', name);
  res.push({ name, ok });
}

if (res.some((r) => !r.ok)) process.exit(1);
console.log('Coachs OK');
