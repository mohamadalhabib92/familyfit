-- FamilyFit — séances, défis, badges.
-- Idempotent. Ne pas lancer sur un projet Supabase hébergé sans accord du propriétaire.
-- Aucune donnée de poids, de calorie ou de diagnostic.

alter table public.family_members add column if not exists age_band text;
alter table public.family_members drop constraint if exists family_members_age_band_check;
alter table public.family_members add constraint family_members_age_band_check
  check (age_band is null or age_band in ('4-7','8-12','teen','adult','senior'));
alter table public.family_members add column if not exists guided_workouts boolean;

create table if not exists public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  routine_id text not null check (char_length(routine_id) between 1 and 80),
  coach_id text not null check (coach_id in ('lina','noor','pico','sami')),
  member_ids uuid[] not null default '{}',
  duration_sec int not null check (duration_sec > 0 and duration_sec <= 7200),
  together boolean not null default false,
  completed_at timestamptz not null default now()
);

create table if not exists public.family_challenges (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  week_start date not null,
  target_minutes int not null check (target_minutes > 0 and target_minutes <= 2000),
  member_ids uuid[] not null default '{}',
  created_by uuid references auth.users(id)
);

create table if not exists public.earned_badges (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  member_id uuid not null references public.family_members(id) on delete cascade,
  badge text not null check (badge in ('first-session','three-day','together','warmup-keeper','weekly-goal')),
  earned_at timestamptz not null default now(),
  unique (family_id, member_id, badge)
);

alter table public.workout_logs enable row level security;
alter table public.family_challenges enable row level security;
alter table public.earned_badges enable row level security;
alter table public.workout_logs force row level security;
alter table public.family_challenges force row level security;
alter table public.earned_badges force row level security;

drop policy if exists "isolation famille" on public.workout_logs;
create policy "isolation famille" on public.workout_logs
  for all using (public.is_family_member(family_id)) with check (public.is_family_member(family_id));

drop policy if exists "defis lisibles en famille" on public.family_challenges;
drop policy if exists "defis crees par les parents" on public.family_challenges;
drop policy if exists "defis modifies par les parents" on public.family_challenges;
drop policy if exists "defis retires par les parents" on public.family_challenges;
create policy "defis lisibles en famille" on public.family_challenges for select using (public.is_family_member(family_id));
create policy "defis crees par les parents" on public.family_challenges for insert with check (public.is_family_manager(family_id));
create policy "defis modifies par les parents" on public.family_challenges for update using (public.is_family_manager(family_id)) with check (public.is_family_manager(family_id));
create policy "defis retires par les parents" on public.family_challenges for delete using (public.is_family_manager(family_id));

drop policy if exists "badges lisibles en famille" on public.earned_badges;
drop policy if exists "badges poses en famille" on public.earned_badges;
drop policy if exists "badges retires par les parents" on public.earned_badges;
create policy "badges lisibles en famille" on public.earned_badges for select using (public.is_family_member(family_id));
create policy "badges poses en famille" on public.earned_badges for insert with check (public.is_family_member(family_id));
create policy "badges retires par les parents" on public.earned_badges for delete using (public.is_family_manager(family_id));

revoke all on public.workout_logs, public.family_challenges, public.earned_badges from anon;
grant select, insert, update, delete on public.workout_logs, public.family_challenges, public.earned_badges to authenticated;
grant select on public.workout_logs, public.family_challenges, public.earned_badges to anon;
