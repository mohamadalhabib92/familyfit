-- FamilyFit — supprimer un compte ne bloque plus sur invitations.accepted_by.
-- NE PAS exécuter depuis l'app ni depuis une CI.
-- À appliquer manuellement après 20261102100100_member_role_guard.sql.
-- Additive et idempotente : la colonne reste nullable, les lignes d'invitation restent.
-- Cette migration n'a pas été appliquée par l'agent.

do $$
declare c name;
begin
  select con.conname into c
  from pg_constraint con
  join pg_attribute att
    on att.attrelid = con.conrelid
   and att.attnum = any (con.conkey)
  where con.conrelid = 'public.invitations'::regclass
    and con.contype = 'f'
    and att.attname = 'accepted_by';
  if c is not null then
    execute format('alter table public.invitations drop constraint %I', c);
  end if;
end $$;

alter table public.invitations
  add constraint invitations_accepted_by_fkey
  foreign key (accepted_by) references auth.users(id) on delete set null;
