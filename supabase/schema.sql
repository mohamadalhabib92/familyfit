-- FamilyFit — schéma Supabase (idempotent : peut être rejoué sans erreur)
-- Isolation stricte par famille via RLS. Aucune donnée de géolocalisation.
-- Exécuter dans Supabase > SQL Editor. Seed démo : voir supabase/seed-demo.sql (optionnel).

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade, -- null pour un enfant sans compte
  display_name text not null,
  role text not null default 'member' check (role in ('admin','parent','member')),
  is_minor boolean not null default false,
  parent_consent_share boolean not null default false,
  color text,
  created_at timestamptz not null default now(),
  unique (family_id, user_id)
);

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  code text not null unique,
  role text not null default 'member' check (role in ('admin','parent','member')),
  status text not null default 'pending' check (status in ('pending','accepted','revoked')),
  created_by uuid not null references auth.users(id),
  accepted_by uuid references auth.users(id),
  expires_at timestamptz not null default now() + interval '7 days',
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  title text not null,
  category text not null check (category in ('family','work','school','leisure','wellness')),
  date date not null,
  start_time time, end_time time,
  all_day boolean not null default false,
  member_ids uuid[] not null default '{}',
  recurrence text not null default 'none' check (recurrence in ('none','daily','weekly','monthly')),
  until date,
  notes text not null default '',
  reminder_min int,
  is_demo boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.rituals (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  title text not null,
  slot text not null check (slot in ('morning','evening')),
  items text[] not null default '{}',
  reminder time,
  is_demo boolean not null default false
);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  ritual_id uuid references public.rituals(id) on delete set null,
  date date not null,
  slot text not null check (slot in ('morning','evening')),
  done text[] not null default '{}',
  participants uuid[] not null default '{}',
  mood smallint check (mood between 1 and 5),
  note text,
  completed_at timestamptz
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  title text not null, unit text not null, weekly_target numeric not null check (weekly_target > 0),
  member_ids uuid[] not null default '{}', icon text, is_demo boolean not null default false
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  goal_id uuid not null references public.goals(id) on delete cascade,
  member_id uuid not null references public.family_members(id) on delete cascade,
  date date not null, amount numeric not null
);

-- Helpers RLS (security definer pour éviter la récursion de policies)
create or replace function public.is_family_member(fid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from family_members where family_id = fid and user_id = auth.uid());
$$;
create or replace function public.is_family_manager(fid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from family_members where family_id = fid and user_id = auth.uid() and role in ('admin','parent'));
$$;

alter table public.profiles enable row level security;
alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.invitations enable row level security;
alter table public.events enable row level security;
alter table public.rituals enable row level security;
alter table public.sessions enable row level security;
alter table public.goals enable row level security;
alter table public.activities enable row level security;

drop policy if exists "profil perso" on public.profiles;
create policy "profil perso" on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "famille lisible par ses membres" on public.families;
create policy "famille lisible par ses membres" on public.families for select using (is_family_member(id));
drop policy if exists "famille modifiable par admin/parent" on public.families;
create policy "famille modifiable par admin/parent" on public.families for update using (is_family_manager(id));

drop policy if exists "membres visibles en famille" on public.family_members;
create policy "membres visibles en famille" on public.family_members for select using (is_family_member(family_id));
drop policy if exists "membres gérés par admin/parent" on public.family_members;
create policy "membres gérés par admin/parent" on public.family_members for all using (is_family_manager(family_id)) with check (is_family_manager(family_id));

drop policy if exists "invitations gérées par admin/parent" on public.invitations;
create policy "invitations gérées par admin/parent" on public.invitations for all using (is_family_manager(family_id)) with check (is_family_manager(family_id));

do $$
declare t text;
begin
  foreach t in array array['events','rituals','sessions','goals','activities'] loop
    execute format('drop policy if exists "isolation famille" on public.%I', t);
    execute format('create policy "isolation famille" on public.%I for all using (public.is_family_member(family_id)) with check (public.is_family_member(family_id))', t);
  end loop;
end $$;

-- RPC appelées par l’app
create or replace function public.create_family(p_name text, p_display_name text) returns uuid
language plpgsql security definer set search_path = public as $$
declare fid uuid;
begin
  if auth.uid() is null then raise exception 'Non authentifié'; end if;
  insert into profiles(id, display_name) values (auth.uid(), p_display_name)
    on conflict (id) do update set display_name = excluded.display_name;
  insert into families(name, created_by) values (p_name, auth.uid()) returning id into fid;
  insert into family_members(family_id, user_id, display_name, role) values (fid, auth.uid(), p_display_name, 'admin');
  return fid;
end $$;

create or replace function public.create_invitation(p_family_id uuid, p_role text) returns text
language plpgsql security definer set search_path = public as $$
declare c text;
begin
  if not is_family_manager(p_family_id) then raise exception 'Réservé aux parents/admin'; end if;
  if p_role not in ('admin','parent','member') then raise exception 'Rôle invalide'; end if;
  loop
    c := upper(substr(translate(encode(gen_random_bytes(8), 'base64'), '+/=0O1IL', ''), 1, 6));
    exit when length(c) = 6 and not exists (select 1 from invitations where code = c);
  end loop;
  insert into invitations(family_id, code, role, created_by) values (p_family_id, c, p_role, auth.uid());
  return c;
end $$;

create or replace function public.accept_invitation(p_code text, p_display_name text) returns uuid
language plpgsql security definer set search_path = public as $$
declare inv invitations;
begin
  if auth.uid() is null then raise exception 'Non authentifié'; end if;
  select * into inv from invitations where code = upper(p_code) for update;
  if inv.id is null then raise exception 'Code inconnu'; end if;
  if inv.status <> 'pending' then raise exception 'Invitation déjà utilisée ou révoquée'; end if;
  if inv.expires_at < now() then raise exception 'Invitation expirée'; end if;
  insert into profiles(id, display_name) values (auth.uid(), p_display_name)
    on conflict (id) do update set display_name = excluded.display_name;
  insert into family_members(family_id, user_id, display_name, role)
    values (inv.family_id, auth.uid(), p_display_name, inv.role)
    on conflict (family_id, user_id) do nothing;
  update invitations set status = 'accepted', accepted_by = auth.uid() where id = inv.id;
  return inv.family_id;
end $$;

revoke all on function public.create_family(text, text) from public, anon;
revoke all on function public.create_invitation(uuid, text) from public, anon;
revoke all on function public.accept_invitation(text, text) from public, anon;
grant execute on function public.create_family(text, text) to authenticated;
grant execute on function public.create_invitation(uuid, text) to authenticated;
grant execute on function public.accept_invitation(text, text) to authenticated;
