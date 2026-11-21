// Montée d’effort, durées, variante famille, choix du clip lent ou intense.
import ts from 'typescript';
import { existsSync, mkdtempSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');
const opts = { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } };
const dir = mkdtempSync(join(tmpdir(), 'progress-'));
writeFileSync(join(dir, 'coachLibrary.mjs'), ts.transpileModule(read('src/lib/coachLibrary.ts'), opts).outputText);
const prog = read('src/lib/progression.ts').replaceAll("from './coachLibrary'", "from './coachLibrary.mjs'");
writeFileSync(join(dir, 'progression.mjs'), ts.transpileModule(prog, opts).outputText);
const m = await import(join(dir, 'progression.mjs'));
const res = m.runProgressionSelfTests();
for (const r of res) console.log(r.ok ? '✓' : '✗', r.name);

writeFileSync(join(dir, 'workoutEngine.mjs'), ts.transpileModule(read('src/lib/workoutEngine.ts'), opts).outputText);
const home = read('src/lib/homePractice.ts')
  .replaceAll("from './progression'", "from './progression.mjs'")
  .replaceAll("from './workoutEngine'", "from './workoutEngine.mjs'")
  .replaceAll("from './coachLibrary'", "from './coachLibrary.mjs'");
writeFileSync(join(dir, 'homePractice.mjs'), ts.transpileModule(home, opts).outputText);
const homeMod = await import(join(dir, 'homePractice.mjs'));
for (const r of homeMod.runHomePracticeSelfTests()) {
  console.log(r.ok ? '✓' : '✗', r.name);
  res.push(r);
}

const app = JSON.parse(read('app.json'));
const clips = [
  'squat-coach-papa-garcon.mp4',
  'fente-coach-maghreb.mp4',
  'pompes-coach-femme-voilee.mp4',
  'crunch-coach-femme.mp4',
  'superman-coach-asie.mp4',
  'step-jack-coach-homme.mp4',
  'row-coach-afrique-ouest.mp4',
  'etoile-coach-papa-garcon.mp4',
];
const media = read('src/components/moves/media.ts');
const checks = [
  ['build iPhone 20', app.expo.ios.buildNumber === '20'],
  ['huit démos sous 1 Mo, require compris', clips.every((name) => {
    const file = join(root, 'assets/coach-videos', name);
    return existsSync(file) && statSync(file).size > 1000 && statSync(file).size < 1024 * 1024 && media.includes(name);
  }) && media.includes('coach-homme-squat-v2.mp4') && media.includes('coach-femme-planche-v2.mp4')],
  ['séance sur iPhone et Apple TV', read('src/app/moves/seance.tsx').includes('TvFocusable') && read('src/app/moves/seance-play.tsx').includes('IntensityBar') && read('src/app/moves/seance.tsx').includes('Button')],
];
for (const [name, ok] of checks) {
  console.log(ok ? '✓' : '✗', name);
  res.push({ name, ok });
}
if (res.some((r) => !r.ok)) process.exit(1);
console.log('Progression OK');
