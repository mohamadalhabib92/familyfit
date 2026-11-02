-- FamilyFit — un parent ne peut pas se promouvoir administrateur.
-- NE PAS exécuter depuis l'app ni depuis une CI.
-- À appliquer manuellement par Mohamed sur SON projet, après relecture.
-- Idempotente. N'efface aucune ligne.
-- Cette migration n'a pas été appliquée par l'agent.

create or replace function public.is_family_admin(fid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.family_members
    where family_id = fid and user_id = auth.uid() and role = 'admin'
  );
$$;

-- new_role = rôle demandé. target_id = ligne visée (null si encore inconnue).
-- Un admin peut tout écrire. Un parent ne peut ni poser le rôle admin,
-- ni modifier une ligne qui est déjà admin (donc pas se promouvoir).
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

-- L'ancienne policy FOR ALL laissait un parent mettre à jour sa propre ligne,
-- y compris role = 'admin', car le contrôle ne regardait que « est gestionnaire ».
drop policy if exists "membres gérés par admin/parent" on public.family_members;
drop policy if exists "membres insérés par gestionnaire" on public.family_members;
drop policy if exists "membres modifiés sans promotion" on public.family_members;
drop policy if exists "membres retirés par gestionnaire" on public.family_members;

create policy "membres insérés par gestionnaire" on public.family_members
  for insert
  with check (public.can_write_member_role(family_id, role, id));

create policy "membres modifiés sans promotion" on public.family_members
  for update
  using (public.is_family_manager(family_id))
  with check (public.can_write_member_role(family_id, role, id));

create policy "membres retirés par gestionnaire" on public.family_members
  for delete
  using (public.is_family_manager(family_id));
