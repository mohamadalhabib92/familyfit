// Contrôles Passe 1 : contraste AA, clés de stockage, RLS déclarée, aucun secret, mention santé.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');
let failed = 0;
const ok = (name) => console.log('✓', name);
const bad = (name) => { console.log('✗', name); failed++; };

function lin(c) { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }
function L(hex) {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
}
function contrast(a, b) {
  const hi = Math.max(L(a), L(b));
  const lo = Math.min(L(a), L(b));
  return (hi + 0.05) / (lo + 0.05);
}
function token(src, name) {
  const m = src.match(new RegExp(name + ":\\s*'(#[0-9A-Fa-f]{6})'"));
  if (!m) throw new Error('jeton manquant ' + name);
  return m[1];
}

const theme = read('src/ui/theme.ts');
const pairs = [
  ['text', 'bg', 4.5],
  ['muted', 'bg', 4.5],
  ['accentText', 'bg', 4.5],
  ['primary', 'bg', 4.5],
  ['warning', 'warningBg', 4.5],
  ['danger', 'dangerBg', 4.5],
  ['success', 'successBg', 4.5],
  ['info', 'infoBg', 4.5],
];
for (const [fg, bg, min] of pairs) {
  const ratio = contrast(token(theme, fg), token(theme, bg));
  if (ratio < min) bad(`${fg} sur ${bg} = ${ratio.toFixed(2)} < ${min}`);
  else ok(`${fg} sur ${bg} = ${ratio.toFixed(2)}`);
}
const accentOnBg = contrast(token(theme, 'accent'), token(theme, 'bg'));
if (accentOnBg >= 4.5) bad(`l'accent ne doit pas servir de texte (ratio ${accentOnBg.toFixed(2)})`);
else ok(`accent réservé aux pastilles (${accentOnBg.toFixed(2)}:1, texte = accentText)`);
const darkOnAccent = contrast(token(theme, 'text'), token(theme, 'accent'));
if (darkOnAccent < 4.5) bad(`texte foncé sur accent ${darkOnAccent.toFixed(2)}`);
else ok(`encre sur accent ${darkOnAccent.toFixed(2)}`);

const palette = [...theme.matchAll(/color:\s*'(#[0-9A-Fa-f]{6})',\s*glyph:\s*'([^']+)'/g)];
if (palette.length !== 8) bad(`palette membres ${palette.length} ≠ 8`);
else ok('8 couleurs de membres avec motif');
const colors = new Set(palette.map((m) => m[1].toLowerCase()));
if (colors.size !== 8) bad('couleurs de membres non distinctes');
else ok('couleurs de membres distinctes');

const kit = read('src/ui/kit.tsx');
if (!kit.includes('color: t.accentText')) bad('le sourcil utilise encore l’accent clair');
else ok('sourcil en accentText');
if (!kit.includes('inkOn(')) bad('les pastilles ne calculent pas l’encre');
else ok('pastilles : encre selon le contraste');
if (kit.includes("backgroundColor: '#fff'") || kit.includes('color: \'#fff\'')) bad('couleur en dur #fff dans kit');
else ok('kit sans #fff en dur');

const js = ts.transpileModule(read('src/ui/contrast.ts'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const mod = await import('data:text/javascript,' + encodeURIComponent(js));
if (mod.inkOn('#D08C60') === '#FFFFFF') bad('encre blanche sur l’accent');
else ok('encre blanche refusée sur #D08C60');
if (mod.contrastRatio('#8B4E2F', '#F6F4EF') < 4.5) bad('contrastRatio accentText');
else ok('contrastRatio accentText');

const data = read('src/lib/data.tsx');
for (const key of ['session', 'prefs', 'family', 'members', 'invitations', 'events', 'rituals', 'sessions', 'goals', 'activities', 'remoteError']) {
  if (!data.includes(`'${key}'`)) bad(`clé de stockage manquante : ${key}`);
  else ok(`clé ${key}`);
}
if (!data.includes("'lists'")) bad('clé lists absente');
else ok('clé lists ajoutée');
if (!read('src/lib/storage.ts').includes("@familyfit/")) bad('préfixe de stockage modifié');
else ok('préfixe @familyfit/ inchangé');

const schema = read('supabase/schema.sql');
const tables = [...schema.matchAll(/create table if not exists public\.(\w+)/g)].map((m) => m[1]);
for (const table of tables) {
  if (!schema.includes(`alter table public.${table} enable row level security`) && !schema.includes(`alter table public.${table} enable row level security;`)) {
    // la phrase exacte du fichier
  }
  const enabled = schema.includes(`public.${table} enable row level security`);
  if (!enabled) bad(`RLS absente sur ${table}`);
  else ok(`RLS ${table}`);
}
if (!schema.includes('is_family_member(family_id)') && !schema.includes('is_family_member(family_id)')) bad('politique famille');
if (!schema.includes('function public.delete_my_account')) bad('delete_my_account absent du schéma');
else ok('delete_my_account dans le schéma');
if (!read('supabase/migrations/20261102_delete_account.sql').includes('delete_my_account')) bad('migration suppression');
else ok('migration suppression présente');
const rlsTest = read('supabase/tests/rls_family_isolation.sql');
for (const needle of ['Famille A', 'Famille B', 'ASSERT Bruno', 'rollback']) {
  if (!rlsTest.includes(needle)) bad(`test RLS incomplet : ${needle}`);
  else ok(`test RLS contient « ${needle} »`);
}

const app = JSON.parse(read('app.json'));
if (app.expo.ios.bundleIdentifier !== 'com.vibecode.familyfit-lpshhx') bad('bundle id modifié');
else ok('bundle id inchangé');
if (app.expo.android.package !== 'ch.mohamadba.familyfit') bad('package android modifié');
else ok('package android inchangé');
if (app.expo.experiments.baseUrl !== '/familyfit') bad('baseUrl web modifié');
else ok('baseUrl web /familyfit');
const eas = read('eas.json');
if (!eas.includes('Y9XF9RY2BU')) bad('équipe Apple manquante');
else ok('équipe Apple conservée');
if (!eas.includes('EXPO_NO_CAPABILITY_SYNC')) bad('EXPO_NO_CAPABILITY_SYNC absent');
else ok('EXPO_NO_CAPABILITY_SYNC');
if (eas.includes('.p8')) bad('chemin .p8 dans eas.json');
else ok('pas de chemin .p8');

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist' || name === '.git') continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx|js|json|sql|mjs|html|md|yml|example)$/.test(name)) out.push(p);
  }
  return out;
}
const secretHits = [];
for (const file of walk(root)) {
  const text = readFileSync(file, 'utf8');
  if (/service_role['"]?\s*[:=]\s*['"]eyJ/.test(text) || /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/.test(text)) secretHits.push(file);
}
if (secretHits.length) bad('secret potentiel : ' + secretHits.join(', '));
else ok('aucun JWT ni service_role dans le dépôt');

const phrase = 'Consultez un professionnel de santé';
for (const file of ['src/app/(tabs)/wellness.tsx', 'src/app/goal/[id].tsx', 'src/app/session/[ritualId].tsx', 'src/app/privacy.tsx', 'src/lib/health.ts']) {
  if (!read(file).includes(phrase) && file !== 'src/lib/health.ts') {
    // wellness importe la constante ; le fichier health la contient, les écrans doivent l'importer ou la citer
  }
  const body = read(file);
  if (file.endsWith('health.ts')) {
    if (!body.includes(phrase)) bad('phrase santé absente de health.ts');
    else ok('phrase santé');
  } else if (!body.includes('HEALTH_DISCLAIMER') && !body.includes(phrase)) bad(`mention santé absente de ${file}`);
  else ok(`mention santé ${file}`);
}
const srcJoined = walk(join(root, 'src')).map((p) => readFileSync(p, 'utf8')).join('\n');
if (/allowFontScaling=\{false\}/.test(srcJoined)) bad('allowFontScaling désactivé');
else ok('texte dynamique non plafonné');
if (srcJoined.includes('Configuration requise')) bad('écran Configuration requise encore référencé');
else ok('plus d’écran « Configuration requise »');

if (failed) {
  console.log(failed, 'échec(s)');
  process.exit(1);
}
console.log('Fondations OK');
