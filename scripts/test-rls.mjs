// Preuve d'isolation RLS entre deux familles (PGlite) + contrôle statique du schéma.
// Aucune clé, aucun réseau : base éphémère en mémoire.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const schema = readFileSync(join(root, 'supabase/schema.sql'), 'utf8');
// PGlite n'embarque pas pgcrypto. gen_random_uuid est dans le cœur ; gen_random_bytes est substitué.
const schemaForTest = schema.replace(/create extension if not exists pgcrypto\s*;/i, 'select 1;');

const tables = ['profiles', 'families', 'family_members', 'invitations', 'events', 'rituals', 'sessions', 'goals', 'activities', 'audit_log'];
for (const t of tables) {
  if (!new RegExp(`alter table public\\.${t} enable row level security`, 'i').test(schema)) {
    console.log('✗ RLS absente sur', t);
    process.exit(1);
  }
}
if (!/function public\.is_family_member/.test(schema) || !/function public\.delete_my_account/.test(schema)) {
  console.log('✗ is_family_member ou delete_my_account manquant');
  process.exit(1);
}
if (/service_role\s*[:=]/i.test(schema)) {
  console.log('✗ service_role assigné dans le schéma');
  process.exit(1);
}
console.log('✓ schéma : RLS, is_family_member, delete_my_account, pas de clé service_role');

const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
const C = '33333333-3333-4333-8333-333333333333';

const db = new PGlite();
await db.exec(`
  create schema if not exists auth;
  create table if not exists auth.users (id uuid primary key);
  create or replace function auth.uid() returns uuid
  language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
  $$;
  create role authenticated nologin;
  create role anon nologin;
`);
await db.exec(schemaForTest);
await db.exec(`
  grant usage on schema public to authenticated;
  grant select, insert, update, delete on all tables in schema public to authenticated;
  grant execute on all functions in schema public to authenticated;
`);

async function asUser(id) {
  await db.exec('reset role');
  await db.exec(`select set_config('request.jwt.claim.sub', '${id ?? ''}', false)`);
  if (id) await db.exec('set role authenticated');
}

function nOf(rows) {
  const v = rows[0]?.n ?? rows[0]?.count ?? 0;
  return Number(v);
}

await asUser(null);
await db.exec(`insert into auth.users(id) values ('${A}'), ('${B}'), ('${C}')`);

await asUser(A);
const famA = (await db.query(`select public.create_family('Alpha', 'Awa') as id`)).rows[0].id;
await db.exec(`insert into public.events (family_id, title, category, date) values ('${famA}', 'Piscine', 'leisure', '2026-11-02')`);

await asUser(B);
const famB = (await db.query(`select public.create_family('Beta', 'Bo') as id`)).rows[0].id;
await db.exec(`insert into public.events (family_id, title, category, date) values ('${famB}', 'Réunion', 'work', '2026-11-03')`);

const seenByB = nOf((await db.query(`select count(*)::int as n from public.events where family_id = '${famA}'`)).rows);
const familiesB = nOf((await db.query(`select count(*)::int as n from public.families`)).rows);
const profilesB = nOf((await db.query(`select count(*)::int as n from public.profiles`)).rows);
if (seenByB !== 0) {
  console.log('✗ B voit les événements de A :', seenByB);
  process.exit(1);
}
if (familiesB !== 1) {
  console.log('✗ B voit', familiesB, 'familles (attendu 1)');
  process.exit(1);
}
if (profilesB !== 1) {
  console.log('✗ B voit', profilesB, 'profils (attendu 1)');
  process.exit(1);
}
console.log('✓ B ne lit ni les événements, ni la famille, ni le profil de A');

let writeBlocked = false;
try {
  await db.exec(`insert into public.events (family_id, title, category, date) values ('${famA}', 'Intrusion', 'family', '2026-11-02')`);
} catch {
  writeBlocked = true;
}
if (!writeBlocked) {
  console.log('✗ B a écrit dans la famille A');
  process.exit(1);
}
console.log('✓ B ne peut pas écrire dans la famille A');

await asUser(null);
await db.exec(`insert into public.audit_log(family_id, action, detail) values ('${famA}', 'probe', '{}')`);
await db.exec(`insert into public.family_members(family_id, user_id, display_name, role, is_minor) values ('${famA}', '${C}', 'Camille', 'parent', false)`);

await asUser(B);
const auditB = nOf((await db.query(`select count(*)::int as n from public.audit_log where family_id = '${famA}'`)).rows);
if (auditB !== 0) {
  console.log('✗ B lit le journal de A');
  process.exit(1);
}
console.log('✓ journal de A invisible pour B');

await asUser(A);
const deleted = (await db.query(`select public.delete_my_account() as r`)).rows[0].r;
const payload = typeof deleted === 'string' ? JSON.parse(deleted) : deleted;
if (!payload?.ok) {
  console.log('✗ delete_my_account a échoué', payload);
  process.exit(1);
}

await asUser(null);
const roleC = (await db.query(`select role from public.family_members where user_id = '${C}' and family_id = '${famA}'`)).rows[0]?.role;
const stillA = nOf((await db.query(`select count(*)::int as n from public.family_members where user_id = '${A}'`)).rows);
const authA = nOf((await db.query(`select count(*)::int as n from auth.users where id = '${A}'`)).rows);
const famExists = nOf((await db.query(`select count(*)::int as n from public.families where id = '${famA}'`)).rows);
if (roleC !== 'admin' || stillA !== 0 || famExists !== 1) {
  console.log('✗ transfert admin inattendu', { roleC, stillA, famExists, payload });
  process.exit(1);
}
if (payload.auth_user_deleted !== true || authA !== 0) {
  console.log('✗ auth.users non supprimé', payload, authA);
  process.exit(1);
}
console.log('✓ suppression du compte : admin transmis à C, A retiré, auth.users effacé');

await asUser(B);
const stillSafe = nOf((await db.query(`select count(*)::int as n from public.events where family_id = '${famA}'`)).rows);
if (stillSafe !== 0) {
  console.log('✗ après suppression, B voit la famille A');
  process.exit(1);
}
console.log('✓ isolation toujours vraie après suppression du compte');
