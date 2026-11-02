// Isolation RLS sur un Postgres local jetable. N'atteint aucun projet Supabase.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const bins = ['/usr/lib/postgresql/16/bin', '/usr/lib/postgresql/15/bin', '/usr/lib/postgresql/14/bin', '/usr/bin'];
const bin = (name) => bins.map((d) => join(d, name)).find((p) => existsSync(p)) ?? name;

function run(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: 'utf8' });
  if (r.status !== 0) {
    if (r.stdout) process.stderr.write(r.stdout);
    if (r.stderr) process.stderr.write(r.stderr);
    throw new Error(`${cmd} ${args.join(' ')} → ${r.status}`);
  }
}

const dir = mkdtempSync(join(tmpdir(), 'familyfit-rls-'));
const data = join(dir, 'data');
const sock = join(dir, 'sock');
mkdirSync(sock);
const port = '55432';
try {
  run(bin('initdb'), ['-D', data, '--username', process.env.USER || 'familyfit', '--auth', 'trust', '--no-instructions']);
  run(bin('pg_ctl'), ['-D', data, '-l', join(dir, 'log'), '-o', `-p ${port} -k ${sock} -c listen_addresses=`, 'start']);
  const psql = bin('psql');
  const base = ['-h', sock, '-p', port, '-v', 'ON_ERROR_STOP=1'];
  const preamble = join(dir, 'preamble.sql');
  writeFileSync(preamble, `
    create schema if not exists auth;
    create table if not exists auth.users (id uuid primary key, email text);
    create role anon nologin;
    create role authenticated nologin;
    create or replace function auth.uid() returns uuid language sql stable as $$
      select coalesce(
        nullif(current_setting('request.jwt.claim.sub', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')::json->>'sub'
      )::uuid;
    $$;
  `);
  run(psql, [...base, '-d', 'postgres', '-f', preamble]);
  run(psql, [...base, '-d', 'postgres', '-f', join(root, 'supabase/schema.sql')]);
  run(psql, [...base, '-d', 'postgres', '-f', join(root, 'supabase/tests/rls_family_isolation.sql')]);
  console.log('✓ isolation RLS locale (familles A/B, anon, promotion parent, rollback)');
} finally {
  spawnSync(bin('pg_ctl'), ['-D', data, '-m', 'immediate', 'stop'], { encoding: 'utf8' });
  rmSync(dir, { recursive: true, force: true });
}
