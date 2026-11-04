// Mode sombre : contrastes AA des jetons DARK (src/ui/theme.ts).
import { readFileSync } from 'node:fs';
const src = readFileSync(new URL('../src/ui/theme.ts', import.meta.url), 'utf8');
const block = src.slice(src.indexOf('const DARK = {'));
const tok = (n) => {
  const m = block.match(new RegExp('\\b' + n + ":\\s*'(#[0-9A-Fa-f]{6})'"));
  if (!m) throw new Error('jeton sombre manquant ' + n);
  return m[1];
};
const lum = (h) => {
  const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const pairs = [['text', 'bg'], ['text', 'surface'], ['muted', 'bg'], ['muted', 'surface'], ['accentText', 'bg'], ['primary', 'bg'], ['primary', 'surface'], ['onPrimary', 'primary'], ['onDanger', 'danger'], ['onAccent', 'accent'], ['warning', 'warningBg'], ['danger', 'dangerBg'], ['success', 'successBg'], ['info', 'infoBg']];
let fail = 0;
for (const [f, b] of pairs) {
  const r = ratio(tok(f), tok(b));
  if (r < 4.5) { fail++; console.error(`✗ sombre ${f}/${b} = ${r.toFixed(2)}`); } else console.log(`✓ sombre ${f}/${b} = ${r.toFixed(2)}`);
}
if (fail) process.exit(1);
console.log('mode sombre : contrastes AA OK');
