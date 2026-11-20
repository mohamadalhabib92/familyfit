// Montée d’effort, durées, variante famille, choix du clip lent ou intense.
import ts from 'typescript';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
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

const app = JSON.parse(read('app.json'));
const checks = [
  ['build iPhone inchangé', app.expo.ios.buildNumber === '2'],
  ['séance sur iPhone et Apple TV', read('src/app/moves/seance.tsx').includes('TvFocusable') && read('src/app/moves/seance-play.tsx').includes('IntensityBar') && read('src/app/moves/seance.tsx').includes('Button')],
];
for (const [name, ok] of checks) {
  console.log(ok ? '✓' : '✗', name);
  res.push({ name, ok });
}
if (res.some((r) => !r.ok)) process.exit(1);
console.log('Progression OK');
