-- FamilyFit — seul un admin crée, accepte ou retire un admin.
-- NE PAS exécuter depuis l'app ni depuis une CI.
-- À appliquer manuellement par Mohamed après 20261102100000_delete_account.sql.
-- Idempotente. N'efface aucune ligne.
-- Cette migration n'a pas été appliquée par l'agent.

create or replace function public.is_family_admin(fid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.family_members
    where family_id = fid and user_id = auth.uid() and role = 'admin'
  );
$$;

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

revoke all on function public.is_family_admin(uuid) from public, anon;
revoke all on function public.can_write_member_role(uuid, text, uuid) from public, anon;
grant execute on function public.is_family_admin(uuid) to authenticated;
grant execute on function public.can_write_member_role(uuid, text, uuid) to authenticated;

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
  for delete using (
    public.is_family_manager(family_id)
    and (role <> 'admin' or public.is_family_admin(family_id))
  );

-- Le service et les cascades passent sans session.
-- auth.uid() null ne suffit pas pour anon ou authenticated.
create or replace function public.family_members_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  -- SECURITY DEFINER : current_user est le propriétaire, pas l'appelant.
  privileged boolean := coalesce(nullif(current_setting('role', true), 'none'), session_user::text)
      in ('service_role', 'postgres', 'supabase_admin')
    or pg_trigger_depth() > 1;
  family_gone boolean := not exists (select 1 from public.families f where f.id = old.family_id);
  other_admins int;
  other_members int;
begin
  if tg_op = 'UPDATE' then
    if new.id is distinct from old.id
       or new.family_id is distinct from old.family_id
       or new.user_id is distinct from old.user_id then
      raise exception 'Identité du membre immuable';
    end if;
  end if;

  if privileged or (tg_op = 'DELETE' and family_gone) then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  if old.role = 'admin'
     and (tg_op = 'DELETE' or new.role is distinct from 'admin') then
    select count(*) into other_admins from public.family_members
      where family_id = old.family_id and role = 'admin' and id <> old.id;
    select count(*) into other_members from public.family_members
      where family_id = old.family_id and id <> old.id;
    if other_admins = 0 and other_members > 0 then
      raise exception 'Transfert admin requis';
    end if;
  end if;

  if tg_op = 'UPDATE' then
    if old.role = 'admin' and not public.is_family_admin(old.family_id) then
      raise exception 'Réservé aux administrateurs';
    end if;
    if new.role = 'admin' and old.role is distinct from 'admin' and not public.is_family_admin(old.family_id) then
      raise exception 'Réservé aux administrateurs';
    end if;
    return new;
  end if;
  if tg_op = 'DELETE' then
    if old.role = 'admin' and not public.is_family_admin(old.family_id) then
      raise exception 'Réservé aux administrateurs';
    end if;
    return old;
  end if;
  return new;
end $$;

drop trigger if exists family_members_guard on public.family_members;
create trigger family_members_guard
  before update or delete on public.family_members
  for each row execute function public.family_members_guard();

drop policy if exists "invitations gérées par admin/parent" on public.invitations;
drop policy if exists "invitations lisibles par gestionnaire" on public.invitations;
drop policy if exists "invitations créées sans admin usurpé" on public.invitations;
drop policy if exists "invitations modifiées sans admin usurpé" on public.invitations;
drop policy if exists "invitations révoquées par gestionnaire" on public.invitations;
create policy "invitations lisibles par gestionnaire" on public.invitations
  for select using (public.is_family_manager(family_id));
create policy "invitations créées sans admin usurpé" on public.invitations
  for insert with check (
    public.is_family_manager(family_id)
    and (role <> 'admin' or public.is_family_admin(family_id))
  );
create policy "invitations modifiées sans admin usurpé" on public.invitations
  for update using (public.is_family_manager(family_id))
  with check (
    public.is_family_manager(family_id)
    and (role <> 'admin' or public.is_family_admin(family_id))
  );
create policy "invitations révoquées par gestionnaire" on public.invitations
  for delete using (public.is_family_manager(family_id));

create or replace function public.invitations_guard_admin_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role = 'admin' and not (tg_op = 'UPDATE' and old.role = 'admin') then
    if not public.is_family_admin(new.family_id) then
      raise exception 'Réservé aux administrateurs';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists invitations_guard_admin_role on public.invitations;
create trigger invitations_guard_admin_role
  before insert or update on public.invitations
  for each row execute function public.invitations_guard_admin_role();

create or replace function public.create_invitation(p_family_id uuid, p_role text) returns text
language plpgsql security definer set search_path = public as $$
declare c text;
begin
  if not is_family_manager(p_family_id) then raise exception 'Réservé aux parents/admin'; end if;
  if p_role not in ('admin','parent','member') then raise exception 'Rôle invalide'; end if;
  if p_role = 'admin' and not public.is_family_admin(p_family_id) then raise exception 'Réservé aux administrateurs'; end if;
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
  if inv.role = 'admin' and not exists (
    select 1 from public.family_members
    where family_id = inv.family_id and user_id = inv.created_by and role = 'admin'
  ) then
    raise exception 'Invitation admin refusée';
  end if;
  insert into profiles(id, display_name) values (auth.uid(), p_display_name)
    on conflict (id) do update set display_name = excluded.display_name;
  insert into family_members(family_id, user_id, display_name, role)
    values (inv.family_id, auth.uid(), p_display_name, inv.role)
    on conflict (family_id, user_id) do nothing;
  update invitations set status = 'accepted', accepted_by = auth.uid() where id = inv.id;
  return inv.family_id;
end $$;

revoke all on function public.create_invitation(uuid, text) from public, anon;
revoke all on function public.accept_invitation(text, text) from public, anon;
grant execute on function public.create_invitation(uuid, text) to authenticated;
grant execute on function public.accept_invitation(text, text) to authenticated;
