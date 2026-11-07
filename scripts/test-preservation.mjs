// Fondation de conservation : fixture v0, déconnexion, quarantaine, version future.
import ts from 'typescript';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const src = readFileSync(new URL('../src/lib/preservation.ts', import.meta.url), 'utf8');
const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const f = join(mkdtempSync(join(tmpdir(), 'preserve-')), 'preservation.mjs');
writeFileSync(f, js);
const m = await import(f);

const fixture = JSON.parse(readFileSync(new URL('./fixtures/legacy-disk-v0.json', import.meta.url), 'utf8'));
const res = [...m.runPreservationSelfTests(), ...m.auditFixture(fixture)];
for (const r of res) console.log(r.ok ? '✓' : '✗', r.name);

const data = readFileSync(new URL('../src/lib/data.tsx', import.meta.url), 'utf8');
const storage = readFileSync(new URL('../src/lib/storage.ts', import.meta.url), 'utf8');
const signOutFn = data.slice(data.indexOf('const signOut = () => {'), data.indexOf('const resetCorrupt'));
const resetFn = data.slice(data.indexOf('const resetCorrupt'), data.indexOf('const wipe'));
const checks = [
  ['déconnexion sans setFamily', !/setFamily|clearAll|emptyContent|wipe\(/.test(signOutFn)],
  ['déconnexion sans effacement de clé', !signOutFn.includes('multiRemove') && signOutFn.includes('setSession')],
  ['réinitialisation : quarantaine avant remplacement', resetFn.indexOf('rememberUnreadable') !== -1 && resetFn.indexOf('rememberUnreadable') < resetFn.indexOf('replaceUnreadableKey')],
  ['lecture illisible copie en quarantaine', storage.includes("rememberUnreadable(key, result.raw, 'corrupt')")],
  ['saveJSON bloque si la version n’autorise pas l’écriture', (() => {
    const body = storage.slice(storage.indexOf('export async function saveJSON'));
    const guard = body.indexOf('if (!canPersist(key)) return;');
    const schema = body.indexOf('if (writesAreBlocked()) return;');
    const setItem = body.indexOf('AsyncStorage.setItem');
    return guard !== -1 && schema !== -1 && setItem !== -1 && guard < schema && schema < setItem;
  })()],
  ['mise à jour partielle garde les champs inconnus', storage.includes('retainUnknown(prev, v)')],
  ['effacement confirmé relâche la porte de version', data.includes('releaseSchemaGateAfterErase()')],
  ['l’export visible porte le condensé', readFileSync(new URL('../src/app/(tabs)/family.tsx', import.meta.url), 'utf8').includes('exportSnapshot')],
];
for (const [name, ok] of checks) {
  console.log(ok ? '✓' : '✗', name);
  res.push({ name, ok });
}

if (res.some((r) => !r.ok)) process.exit(1);
console.log('Conservation OK');
