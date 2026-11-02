// Contraste AA des tokens (src/ui/theme.ts) et absence de couleurs en dur dans l'UI.
import ts from 'typescript';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(join(root, 'src/ui/theme.ts'), 'utf8');
const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const f = join(mkdtempSync(join(tmpdir(), 'theme-')), 'theme.mjs');
writeFileSync(f, js);
const m = await import(f);
const res = m.runThemeSelfTests();
let failed = 0;
for (const r of res) {
  console.log(r.ok ? '✓' : '✗', r.name, r.detail ?? '');
  if (!r.ok) failed++;
}

const kit = readFileSync(join(root, 'src/ui/kit.tsx'), 'utf8');
if (!kit.includes('t.accentText')) {
  console.log('✗ eyebrow / kit n’utilise pas accentText');
  failed++;
} else console.log('✓ kit référence accentText');
if (!kit.includes('inkOn(')) {
  console.log('✗ kit n’utilise pas inkOn pour les pastilles');
  failed++;
} else console.log('✓ kit utilise inkOn');

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (/\.(ts|tsx)$/.test(name) && !p.endsWith(`${join('src', 'ui', 'theme.ts')}`)) acc.push(p);
  }
  return acc;
}
const hex = /#[0-9A-Fa-f]{3,8}/;
for (const p of walk(join(root, 'src'))) {
  const text = readFileSync(p, 'utf8');
  if (hex.test(text)) {
    console.log('✗ couleur en dur', p.slice(root.length + 1));
    failed++;
  }
}
if (!failed) console.log('✓ aucune couleur en dur hors theme.ts');
if (failed) process.exit(1);
