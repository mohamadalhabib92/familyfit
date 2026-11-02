-- FamilyFit — preuve d'isolation entre deux familles.
-- Prérequis : supabase/schema.sql déjà appliqué (rôles anon et authenticated présents).
-- Tout tient dans une transaction annulée à la fin. Ne pas viser la production :
-- un ROLLBACK évite de laisser les utilisateurs de test, mais le script ne doit
-- pas être lancé sur le projet réel de Mohamed.
-- L'agent ne l'a pas exécuté contre un projet Supabase.

begin;

create or replace function public.rls_as(uid text) returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', uid, true);
  perform set_config('request.jwt.claims', json_build_object('sub', nullif(uid, ''))::text, true);
end;
$$;
grant execute on function public.rls_as(text) to authenticated, anon;

create table public.rls_probe (k text primary key, v uuid);
grant all on public.rls_probe to authenticated, anon;
alter table public.rls_probe disable row level security;

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'alice@example.test'),
  ('22222222-2222-4222-8222-222222222222', 'bruno@example.test'),
  ('33333333-3333-4333-8333-333333333333', 'eden@example.test'),
  ('44444444-4444-4444-8444-444444444444', 'dina@example.test'),
  ('55555555-5555-4555-8555-555555555555', 'nora@example.test');

select public.rls_as('11111111-1111-4111-8111-111111111111');
set role authenticated;
insert into public.rls_probe (k, v)
values ('fam_a', public.create_family('Famille A', 'Alice'));

select public.rls_as('22222222-2222-4222-8222-222222222222');
insert into public.rls_probe (k, v)
values ('fam_b', public.create_family('Famille B', 'Bruno'));

select public.rls_as('44444444-4444-4444-8444-444444444444');
insert into public.rls_probe (k, v)
values ('fam_d', public.create_family('Famille D', 'Dina'));

-- Alice écrit un événement dans SA famille.
select public.rls_as('11111111-1111-4111-8111-111111111111');
insert into public.events (family_id, title, category, date)
select v, 'Piscine', 'leisure', current_date from public.rls_probe where k = 'fam_a';

-- Bruno ne voit pas l'événement d'Alice.
do $$
declare n int;
begin
  perform public.rls_as('22222222-2222-4222-8222-222222222222');
  select count(*) into n from public.events e
  where e.family_id = (select v from public.rls_probe where k = 'fam_a');
  if n <> 0 then
    raise exception 'ASSERT Bruno voit % événement(s) de la famille A', n;
  end if;
end $$;

-- Bruno ne voit pas les membres d'Alice.
do $$
declare n int;
begin
  perform public.rls_as('22222222-2222-4222-8222-222222222222');
  select count(*) into n from public.family_members
  where family_id = (select v from public.rls_probe where k = 'fam_a');
  if n <> 0 then
    raise exception 'ASSERT Bruno voit % membre(s) de la famille A', n;
  end if;
end $$;

-- Bruno ne lit pas le profil d'Alice.
do $$
declare n int;
begin
  perform public.rls_as('22222222-2222-4222-8222-222222222222');
  select count(*) into n from public.profiles where id = '11111111-1111-4111-8111-111111111111';
  if n <> 0 then
    raise exception 'ASSERT Bruno lit le profil d''Alice';
  end if;
end $$;

-- Bruno ne peut pas écrire dans la famille A.
do $$
begin
  perform public.rls_as('22222222-2222-4222-8222-222222222222');
  insert into public.events (family_id, title, category, date)
  select v, 'Piraté', 'family', current_date from public.rls_probe where k = 'fam_a';
  raise exception 'ASSERT insertion croisée autorisée';
exception
  when insufficient_privilege then
    if SQLERRM not like '%row-level security%' and SQLERRM not like '%politique%' then
      raise exception 'ASSERT message RLS inattendu: %', SQLERRM;
    end if;
end $$;

-- Alice voit son propre événement.
do $$
declare n int;
begin
  perform public.rls_as('11111111-1111-4111-8111-111111111111');
  select count(*) into n from public.events e
  where e.family_id = (select v from public.rls_probe where k = 'fam_a');
  if n < 1 then
    raise exception 'ASSERT Alice ne voit pas son événement';
  end if;
end $$;

reset role;
select public.rls_as('');
set role anon;
do $$
declare n int;
begin
  select count(*) into n from public.events;
  if n <> 0 then
    raise exception 'ASSERT le rôle anon voit % événement(s)', n;
  end if;
end $$;

reset role;

-- Alice invite Eden (autre adulte) puis ne peut pas supprimer son compte sans transfert.
select public.rls_as('11111111-1111-4111-8111-111111111111');
set role authenticated;
insert into public.family_members (family_id, user_id, display_name, role, is_minor)
select v, '33333333-3333-4333-8333-333333333333', 'Eden', 'parent', false
from public.rls_probe where k = 'fam_a';
insert into public.rls_probe (k, v)
select 'eden', id from public.family_members where user_id = '33333333-3333-4333-8333-333333333333';

-- Eden est parent : il ne peut pas passer sa ligne à admin.
select public.rls_as('33333333-3333-4333-8333-333333333333');
do $$
declare n int;
begin
  update public.family_members
  set role = 'admin'
  where user_id = '33333333-3333-4333-8333-333333333333';
  get diagnostics n = row_count;
  if n > 0 then
    raise exception 'ASSERT un parent a pu se promouvoir admin';
  end if;
exception
  when others then
    if SQLERRM like 'ASSERT%' or SQLERRM not like '%Réservé aux administrateurs%' then
      raise exception 'ASSERT promotion parent, message: %', SQLERRM;
    end if;
end $$;

reset role;
do $$
declare r text;
begin
  select role into r from public.family_members
  where user_id = '33333333-3333-4333-8333-333333333333';
  if r = 'admin' then
    raise exception 'ASSERT le rôle d''Eden a été élevé';
  end if;
  if r <> 'parent' then
    raise exception 'ASSERT rôle Eden inattendu: %', r;
  end if;
end $$;

-- Eden ne peut pas créer une invitation admin, ni en RPC ni en écriture directe.
select public.rls_as('33333333-3333-4333-8333-333333333333');
set role authenticated;
do $$
begin
  perform public.create_invitation((select v from public.rls_probe where k = 'fam_a'), 'admin');
  raise exception 'ASSERT parent a créé une invitation admin';
exception
  when others then
    if SQLERRM like 'ASSERT%' or SQLERRM not like '%Réservé aux administrateurs%' then
      raise exception 'ASSERT invitation admin RPC, message: %', SQLERRM;
    end if;
end $$;
do $$
declare n int;
begin
  insert into public.invitations (family_id, code, role, created_by)
  select v, 'BADADM', 'admin', '33333333-3333-4333-8333-333333333333'
  from public.rls_probe where k = 'fam_a';
  get diagnostics n = row_count;
  if n > 0 then raise exception 'ASSERT parent a inséré une invitation admin'; end if;
exception
  when others then
    if SQLERRM like 'ASSERT%' or (SQLERRM not like '%Réservé aux administrateurs%' and SQLERRM not like '%row-level security%' and SQLERRM not like '%politique%') then
      raise exception 'ASSERT invitation admin directe, message: %', SQLERRM;
    end if;
end $$;

-- Invitation admin forgée (créée par un parent) : l'acceptation ne donne pas le rôle.
reset role;
select public.rls_as('11111111-1111-4111-8111-111111111111');
insert into public.invitations (family_id, code, role, created_by)
select v, 'PADMIN', 'admin', '33333333-3333-4333-8333-333333333333'
from public.rls_probe where k = 'fam_a';
select public.rls_as('55555555-5555-4555-8555-555555555555');
set role authenticated;
do $$
begin
  perform public.accept_invitation('PADMIN', 'Nora');
  raise exception 'ASSERT une invitation admin de parent a été acceptée';
exception
  when others then
    if SQLERRM like 'ASSERT%' or SQLERRM not like '%Invitation admin refusée%' then
      raise exception 'ASSERT acceptation admin, message: %', SQLERRM;
    end if;
end $$;
reset role;
do $$
declare n int;
begin
  select count(*) into n from public.family_members
  where user_id = '55555555-5555-4555-8555-555555555555' and role = 'admin';
  if n <> 0 then raise exception 'ASSERT Nora est admin'; end if;
end $$;

-- Changer l'id pour faire oublier OLD.role, ou supprimer la ligne admin, est refusé.
select public.rls_as('33333333-3333-4333-8333-333333333333');
set role authenticated;
do $$
declare n int;
begin
  update public.family_members
  set id = gen_random_uuid(), role = 'parent'
  where user_id = '11111111-1111-4111-8111-111111111111';
  get diagnostics n = row_count;
  if n > 0 then raise exception 'ASSERT parent a rétrogradé un admin en changeant l''id'; end if;
exception
  when others then
    if SQLERRM like 'ASSERT%' or SQLERRM not like '%Identité du membre immuable%' then
      raise exception 'ASSERT changement d''id, message: %', SQLERRM;
    end if;
end $$;
do $$
declare n int;
begin
  delete from public.family_members
  where user_id = '11111111-1111-4111-8111-111111111111';
  get diagnostics n = row_count;
  if n > 0 then raise exception 'ASSERT parent a supprimé un admin'; end if;
exception
  when others then
    if SQLERRM like 'ASSERT%' or SQLERRM not like '%Transfert admin requis%' then
      raise exception 'ASSERT suppression admin par parent, message: %', SQLERRM;
    end if;
end $$;
reset role;
do $$
declare r text; i uuid;
begin
  select role, id into r, i from public.family_members
  where user_id = '11111111-1111-4111-8111-111111111111';
  if r <> 'admin' then raise exception 'ASSERT Alice n''est plus admin (%)', r; end if;
  if i is null then raise exception 'ASSERT Alice a disparu'; end if;
end $$;

select public.rls_as('11111111-1111-4111-8111-111111111111');
set role authenticated;

do $$
begin
  update public.family_members set role = 'parent'
  where user_id = '11111111-1111-4111-8111-111111111111';
  raise exception 'ASSERT le dernier admin s''est rétrogradé';
exception
  when others then
    if SQLERRM like 'ASSERT%' or SQLERRM not like '%Transfert admin requis%' then
      raise exception 'ASSERT rétrogradation dernier admin: %', SQLERRM;
    end if;
end $$;
do $$
begin
  delete from public.family_members
  where user_id = '11111111-1111-4111-8111-111111111111';
  raise exception 'ASSERT le dernier admin a supprimé sa ligne';
exception
  when others then
    if SQLERRM like 'ASSERT%' or SQLERRM not like '%Transfert admin requis%' then
      raise exception 'ASSERT suppression dernier admin: %', SQLERRM;
    end if;
end $$;

do $$
begin
  perform public.rls_as('11111111-1111-4111-8111-111111111111');
  perform public.delete_my_account(null);
  raise exception 'ASSERT suppression sans transfert autorisée';
exception
  when others then
    if SQLERRM like 'ASSERT%' or SQLERRM not like '%Transfert admin requis%' then
      raise exception 'ASSERT message transfert inattendu: %', SQLERRM;
    end if;
end $$;

-- Avec transfert, la famille A reste, Eden devient admin, la famille B est intacte.
select public.delete_my_account((select v from public.rls_probe where k = 'eden'));

reset role;

do $$
declare
  n_b int;
  n_a int;
  eden_admin int;
  alice_gone int;
begin
  select count(*) into n_b from public.families where name = 'Famille B';
  select count(*) into n_a from public.families where name = 'Famille A';
  select count(*) into eden_admin from public.family_members
  where user_id = '33333333-3333-4333-8333-333333333333' and role = 'admin';
  select count(*) into alice_gone from auth.users where id = '11111111-1111-4111-8111-111111111111';
  if n_b <> 1 then raise exception 'ASSERT famille B touchée (% )', n_b; end if;
  if n_a <> 1 then raise exception 'ASSERT famille A disparue'; end if;
  if eden_admin <> 1 then raise exception 'ASSERT Eden n''est pas admin'; end if;
  if alice_gone <> 0 then raise exception 'ASSERT Alice existe encore'; end if;
end $$;

-- Dina est seule : son compte supprime sa famille et pas les autres.
select public.rls_as('44444444-4444-4444-8444-444444444444');
set role authenticated;
select public.delete_my_account(null);
reset role;

do $$
declare n_d int; n_b int;
begin
  select count(*) into n_d from public.families where name = 'Famille D';
  select count(*) into n_b from public.families where name = 'Famille B';
  if n_d <> 0 then raise exception 'ASSERT famille D encore là'; end if;
  if n_b <> 1 then raise exception 'ASSERT famille B disparue avec Dina'; end if;
end $$;

-- Famille de service : Eli créateur admin, Sam admin non créateur, Kim membre.
reset role;
insert into auth.users (id, email) values
  ('66666666-6666-4666-8666-666666666666', 'eli@example.test'),
  ('77777777-7777-4777-8777-777777777777', 'sam@example.test'),
  ('88888888-8888-4888-8888-888888888888', 'kim@example.test');
select public.rls_as('66666666-6666-4666-8666-666666666666');
set role authenticated;
insert into public.rls_probe (k, v)
values ('fam_e', public.create_family('Famille E', 'Eli'));
insert into public.family_members (family_id, user_id, display_name, role, is_minor)
select v, '77777777-7777-4777-8777-777777777777', 'Sam', 'admin', false from public.rls_probe where k = 'fam_e';
insert into public.family_members (family_id, user_id, display_name, role, is_minor)
select v, '88888888-8888-4888-8888-888888888888', 'Kim', 'member', false from public.rls_probe where k = 'fam_e';

-- anon et authenticated sans session : auth.uid() null ne suffit pas.
reset role;
alter table public.family_members disable row level security;
alter table public.family_members no force row level security;
select public.rls_as('');
set role authenticated;
do $$
begin
  delete from public.family_members where user_id = '77777777-7777-4777-8777-777777777777';
  raise exception 'ASSERT authenticated sans session a supprimé un admin';
exception
  when others then
    if SQLERRM like 'ASSERT%' or SQLERRM not like '%Réservé aux administrateurs%' then
      raise exception 'ASSERT refus authenticated: %', SQLERRM;
    end if;
end $$;
reset role;
grant delete on public.family_members to anon;
select public.rls_as('');
set role anon;
do $$
begin
  delete from public.family_members where user_id = '77777777-7777-4777-8777-777777777777';
  raise exception 'ASSERT anon a supprimé un admin';
exception
  when others then
    if SQLERRM like 'ASSERT%' or SQLERRM not like '%Réservé aux administrateurs%' then
      raise exception 'ASSERT refus anon: %', SQLERRM;
    end if;
end $$;
reset role;
alter table public.family_members enable row level security;
alter table public.family_members force row level security;

-- service_role supprime l'admin qui n'est pas le créateur.
select public.rls_as('');
set role service_role;
delete from auth.users where id = '77777777-7777-4777-8777-777777777777';
reset role;
do $$
declare n_sam int; n_eli int; n_fam int;
begin
  select count(*) into n_sam from auth.users where id = '77777777-7777-4777-8777-777777777777';
  select count(*) into n_eli from public.family_members
    where user_id = '66666666-6666-4666-8666-666666666666' and role = 'admin';
  select count(*) into n_fam from public.families where name = 'Famille E';
  if n_sam <> 0 then raise exception 'ASSERT Sam existe encore'; end if;
  if n_eli <> 1 then raise exception 'ASSERT Eli n''est plus admin'; end if;
  if n_fam <> 1 then raise exception 'ASSERT famille E a disparu avec Sam'; end if;
end $$;

-- postgres supprime la famille : la cascade des membres admin passe.
select public.rls_as('');
set role postgres;
delete from public.families where name = 'Famille E';
reset role;
do $$
declare n_fam int; n_mem int;
begin
  select count(*) into n_fam from public.families where name = 'Famille E';
  select count(*) into n_mem from public.family_members
    where user_id in ('66666666-6666-4666-8666-666666666666', '88888888-8888-4888-8888-888888888888');
  if n_fam <> 0 then raise exception 'ASSERT famille E encore là'; end if;
  if n_mem <> 0 then raise exception 'ASSERT des membres de E restent'; end if;
end $$;

rollback;
