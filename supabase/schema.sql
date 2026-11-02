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
create or replace function public.is_family_admin(fid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.family_members
    where family_id = fid and user_id = auth.uid() and role = 'admin'
  );
$$;
-- Un parent ne peut pas écrire role = admin ni modifier un administrateur.
create or replace function public.can_write_member_role(fid uuid, new_role text, target_id uuid)
returns boolean
language plpgsql stable security definer set search_path = public as $$
declare
  old_role text;
begin
  if auth.uid() is null then return false; end if;
  if not public.is_family_manager(fid) then return false; end if;
  if public.is_family_admin(fid) then return true; end if;
  if new_role = 'admin' then return false; end if;
  if target_id is not null then
    select role into old_role from public.family_members where id = target_id and family_id = fid;
    if old_role = 'admin' then return false; end if;
  end if;
  return true;
end $$;

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
drop policy if exists "membres insérés par gestionnaire" on public.family_members;
drop policy if exists "membres modifiés sans promotion" on public.family_members;
drop policy if exists "membres retirés par gestionnaire" on public.family_members;
create policy "membres insérés par gestionnaire" on public.family_members
  for insert with check (public.can_write_member_role(family_id, role, id));
create policy "membres modifiés sans promotion" on public.family_members
  for update using (public.is_family_manager(family_id))
  with check (public.can_write_member_role(family_id, role, id));
create policy "membres retirés par gestionnaire" on public.family_members
  for delete using (public.is_family_manager(family_id));

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

-- Rôles présents sur Supabase ; créés seulement pour un Postgres local de test.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
end $$;

revoke all on function public.create_family(text, text) from public, anon;
revoke all on function public.create_invitation(uuid, text) from public, anon;
revoke all on function public.accept_invitation(text, text) from public, anon;
grant execute on function public.create_family(text, text) to authenticated;
grant execute on function public.create_invitation(uuid, text) to authenticated;
grant execute on function public.accept_invitation(text, text) to authenticated;

-- Le propriétaire d'une table contourne la RLS, sauf FORCE.
-- Un superutilisateur (rôle postgres de Supabase) la contourne encore : l'API anon/authenticated, non.
do $$
declare t text;
begin
  foreach t in array array['profiles','families','family_members','invitations','events','rituals','sessions','goals','activities'] loop
    execute format('alter table public.%I force row level security', t);
  end loop;
end $$;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on all tables in schema public to anon;
grant execute on function public.is_family_member(uuid), public.is_family_manager(uuid) to anon, authenticated;
revoke all on function public.is_family_admin(uuid) from public, anon;
revoke all on function public.can_write_member_role(uuid, text, uuid) from public, anon;
grant execute on function public.is_family_admin(uuid) to authenticated;
grant execute on function public.can_write_member_role(uuid, text, uuid) to authenticated;

-- Suppression de compte (Apple 5.1.1). Additive : ne modifie aucune ligne tant qu'elle n'est pas appelée.
-- Une famille ne reste jamais sans administrateur : transfert exigé, sinon suppression de la famille
-- s'il ne reste aucun autre compte (les profils d'enfants sans compte partent avec elle).
create or replace function public.delete_my_account(p_transfer_to uuid default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  rec record;
  other_accounts int;
  other_admins int;
  successor uuid;
begin
  if uid is null then
    raise exception 'Non authentifié';
  end if;

  for rec in
    select id as member_id, family_id, role
    from public.family_members
    where user_id = uid
  loop
    select count(*) into other_accounts
    from public.family_members
    where family_id = rec.family_id and user_id is not null and user_id <> uid;

    select count(*) into other_admins
    from public.family_members
    where family_id = rec.family_id and role = 'admin' and user_id is not null and user_id <> uid;

    if other_accounts = 0 then
      delete from public.families where id = rec.family_id;
      continue;
    end if;

    if rec.role = 'admin' and other_admins = 0 then
      if p_transfer_to is null then
        raise exception 'Transfert admin requis';
      end if;
      select user_id into successor
      from public.family_members
      where id = p_transfer_to
        and family_id = rec.family_id
        and user_id is not null
        and user_id <> uid
        and is_minor = false;
      if successor is null then
        raise exception 'Successeur invalide';
      end if;
      update public.family_members set role = 'admin' where id = p_transfer_to;
      update public.families set created_by = successor where id = rec.family_id and created_by = uid;
    elsif rec.role = 'admin' then
      update public.families set created_by = (
        select user_id from public.family_members
        where family_id = rec.family_id and role = 'admin' and user_id is not null and user_id <> uid
        limit 1
      )
      where id = rec.family_id and created_by = uid;
    end if;

    delete from public.family_members where id = rec.member_id;
  end loop;

  update public.invitations i
  set created_by = src.user_id
  from (
    select distinct on (family_id) family_id, user_id
    from public.family_members
    where user_id is not null
    order by family_id, case when role = 'admin' then 0 else 1 end
  ) src
  where i.created_by = uid and i.family_id = src.family_id;

  delete from public.invitations where created_by = uid;
  update public.invitations set accepted_by = null where accepted_by = uid;

  update public.families f
  set created_by = src.user_id
  from (
    select distinct on (family_id) family_id, user_id
    from public.family_members
    where user_id is not null and user_id <> uid
    order by family_id, case when role = 'admin' then 0 else 1 end
  ) src
  where f.id = src.family_id and f.created_by = uid;

  delete from public.families f
  where f.created_by = uid
    and not exists (
      select 1 from public.family_members fm
      where fm.family_id = f.id and fm.user_id is not null and fm.user_id <> uid
    );

  delete from public.profiles where id = uid;
  delete from auth.users where id = uid;
end $$;

revoke all on function public.delete_my_account(uuid) from public, anon;
grant execute on function public.delete_my_account(uuid) to authenticated;
