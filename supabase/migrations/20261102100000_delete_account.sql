-- FamilyFit — migration additive Passe 1 (suppression de compte).
-- NE PAS exécuter depuis l'app, ni depuis une CI, ni contre un projet sans relecture.
-- À appliquer manuellement par Mohamed sur SON projet Supabase.
-- Idempotente. N'efface aucune ligne tant que delete_my_account n'est pas appelée.
-- Cette migration n'a pas été appliquée par l'agent.
-- Le corps de la fonction est le même que dans supabase/schema.sql.

-- p_transfer_to : id de la ligne public.family_members du successeur, pas son user_id.
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
