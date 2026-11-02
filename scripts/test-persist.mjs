// Garde d'écriture : ne jamais persister avant une lecture réussie.
import ts from 'typescript';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const src = readFileSync(new URL('../src/lib/persistGuard.ts', import.meta.url), 'utf8');
const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText;
const f = join(mkdtempSync(join(tmpdir(), 'persist-')), 'persistGuard.mjs');
writeFileSync(f, js);
const m = await import(f);
const res = m.runPersistGuardSelfTests();
for (const r of res) console.log(r.ok ? '✓' : '✗', r.name);

const storage = readFileSync(new URL('../src/lib/storage.ts', import.meta.url), 'utf8');
const saveBody = storage.slice(storage.indexOf('export async function saveJSON'));
const setItemAt = saveBody.indexOf('AsyncStorage.setItem');
const guardAt = saveBody.indexOf('if (!canPersist(key)) return;');
if (guardAt === -1 || setItemAt === -1 || guardAt > setItemAt) {
  console.log('✗', 'saveJSON écrit avant d’avoir vérifié la lecture');
  res.push({ name: 'garde dans saveJSON', ok: false });
} else {
  console.log('✓', 'saveJSON vérifie la lecture avant setItem');
}
if (!storage.includes('if (canPersist(key)) void saveJSON(key, v);')) {
  console.log('✗', 'le setter persiste sans garde');
  res.push({ name: 'garde dans le setter', ok: false });
} else {
  console.log('✓', 'le setter ne persiste qu’après lecture réussie');
}
if (!storage.includes('noteLoadStarted(key)')) {
  console.log('✗', 'Réessayer ne rebloque pas les écritures');
  res.push({ name: 'relecture', ok: false });
} else {
  console.log('✓', 'chaque lecture rebloque les écritures');
}
if (storage.includes('Continuer hors ligne')) {
  console.log('✗', 'un bouton Continuer hors ligne est présent');
  res.push({ name: 'pas de continuer hors ligne', ok: false });
} else {
  console.log('✓', 'pas de bouton Continuer hors ligne');
}

if (res.some((r) => !r.ok)) process.exit(1);
