// Aucun secret dans le client ni le schéma. Les placeholders YOUR_* sont autorisés.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const skip = new Set(['node_modules', 'dist', '.git', '.expo', 'web-build']);
const rules = [
  { name: 'service_role', re: /service_role\s*[:=]/i },
  { name: 'JWT', re: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/ },
  { name: 'clé secrète', re: /(sk_live|sb_secret_|SUPABASE_SERVICE|private_key)\s*[:=]/ },
  { name: 'clé AWS', re: /AKIA[0-9A-Z]{16}/ },
];

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    if (skip.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (/\.(ts|tsx|js|mjs|json|sql|yml|yaml|md|example|env)$/.test(name) || name.startsWith('.env')) acc.push(p);
  }
  return acc;
}

let failed = 0;
const files = [join(root, 'app.json'), join(root, 'eas.json'), join(root, '.env.example'), join(root, 'package.json'), ...walk(join(root, 'src')), ...walk(join(root, 'supabase')), ...walk(join(root, '.github'))];
for (const p of files) {
  const text = readFileSync(p, 'utf8');
  for (const rule of rules) {
    if (rule.re.test(text)) {
      console.log('✗', rule.name, 'dans', p.slice(root.length + 1));
      failed++;
    }
  }
}
const example = readFileSync(join(root, '.env.example'), 'utf8');
for (const key of ['EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_ANON_KEY', 'EXPO_PUBLIC_SENTRY_DSN', 'EXPO_PUBLIC_SUPPORT_EMAIL']) {
  if (!example.includes(`${key}=YOUR_`)) {
    console.log('✗ placeholder manquant', key);
    failed++;
  }
}
if (!example.includes('service_role')) {
  // la mention « ne jamais mettre service_role » est attendue dans le commentaire
  console.log('✗ .env.example devrait rappeler de ne pas y mettre service_role');
  failed++;
}
if (failed) process.exit(1);
console.log('✓ aucun secret client, placeholders YOUR_* présents');
