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
if (res.some((r) => !r.ok)) process.exit(1);
