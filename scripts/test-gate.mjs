import ts from 'typescript';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const src = readFileSync(new URL('../src/lib/gate.ts', import.meta.url), 'utf8');
const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText;
const f = join(mkdtempSync(join(tmpdir(), 'gate-')), 'gate.mjs');
writeFileSync(f, js);
const m = await import(f);
const res = m.runGateSelfTests();
for (const r of res) console.log(r.ok ? '✓' : '✗', r.name);
const layout = readFileSync(new URL('../src/app/(tabs)/_layout.tsx', import.meta.url), 'utf8');
if (layout.includes("supabaseConfigured ? '/auth' : '/onboarding'")) {
  console.log('✗', 'le layout renvoie encore vers l’onboarding sans session');
  res.push({ name: 'layout', ok: false });
} else if (!layout.includes('routeAfterReady')) {
  console.log('✗', 'le layout n’utilise pas routeAfterReady');
  res.push({ name: 'layout', ok: false });
} else {
  console.log('✓', 'le layout suit routeAfterReady');
}
const data = readFileSync(new URL('../src/lib/data.tsx', import.meta.url), 'utf8');
if (!/const signOut = \(\) => setSession\(null\);/.test(data)) {
  console.log('✗', 'signOut ne se limite pas à la session');
  res.push({ name: 'signOut', ok: false });
} else {
  console.log('✓', 'signOut ne touche pas à la famille');
}
if (res.some((r) => !r.ok)) process.exit(1);
