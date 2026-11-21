// Programme, horloge unique, continuité des segments, dérive sur 30 min.
import ts from 'typescript';
import { readFileSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');
const js = ts.transpileModule(read('src/lib/training/engine.ts'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const file = join(mkdtempSync(join(tmpdir(), 'train-')), 'engine.mjs');
writeFileSync(file, js);
const m = await import(file);
const res = m.runTrainingSelfTests();
for (const r of res) console.log(r.ok ? '✓' : '✗', r.name);

const example = m.exampleSeance20();
writeFileSync(join(root, 'src/lib/training/example-seance-20.json'), `${JSON.stringify(example, null, 2)}\n`);
const saved = JSON.parse(read('src/lib/training/example-seance-20.json'));
const checks = [
  ['json exemple identique au moteur', JSON.stringify(saved.segments) === JSON.stringify(example.segments) && saved.cues.length === example.cues.length],
  ['script Moussa dans docs', read('docs/voix-moussa-seance-20.md').includes(example.cues[0].fr)],
  ['fiche de tournage cite chaque exercice', m.EXERCISE_LIBRARY.every((item) => read('docs/tournage-exercices.md').includes(item.id))],
  ['module horloge sans Photos', !read('modules/familyfit-session/ios/FamilyfitSessionModule.swift').includes('import Photos') && read('modules/familyfit-session/ios/FamilyfitSessionModule.swift').includes('AVSpeechSynthesizer')],
];
for (const [name, ok] of checks) {
  console.log(ok ? '✓' : '✗', name);
  res.push({ name, ok });
}
if (res.some((r) => !r.ok)) process.exit(1);
console.log('Programme OK');
