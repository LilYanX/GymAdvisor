-- Bibliothèque d'exercices partagée + durée de suivi à la création

-- 1) coach_id = créateur (nullable), ne pas tout supprimer si un coach part
alter table public.exercises
  alter column coach_id drop not null;

alter table public.exercises
  drop constraint if exists exercises_coach_id_fkey;

alter table public.exercises
  add constraint exercises_coach_id_fkey
  foreign key (coach_id) references public.profiles (id) on delete set null;

-- 2) Dédupliquer les exercices homonymes
with ranked as (
  select
    id,
    name,
    row_number() over (partition by lower(name) order by created_at, id) as rn
  from public.exercises
),
keepers as (
  select id, lower(name) as name_key from ranked where rn = 1
),
dupes as (
  select r.id as dupe_id, k.id as keep_id
  from ranked r
  join keepers k on k.name_key = lower(r.name)
  where r.rn > 1
)
update public.session_exercises se
set exercise_id = d.keep_id
from dupes d
where se.exercise_id = d.dupe_id;

with ranked as (
  select
    id,
    row_number() over (partition by lower(name) order by created_at, id) as rn
  from public.exercises
)
delete from public.exercises
where id in (select id from ranked where rn > 1);

create unique index if not exists exercises_name_unique_ci
  on public.exercises (lower(name));

-- 3) RLS partagée
drop policy if exists exercises_all_coach on public.exercises;
drop policy if exists exercises_select_athlete on public.exercises;
drop policy if exists exercises_select_coach on public.exercises;
drop policy if exists exercises_insert_coach on public.exercises;
drop policy if exists exercises_update_coach on public.exercises;
drop policy if exists exercises_delete_coach on public.exercises;

create policy exercises_select_coach
  on public.exercises for select
  using (public.is_coach());

create policy exercises_insert_coach
  on public.exercises for insert
  with check (public.is_coach() and coach_id = auth.uid());

create policy exercises_update_coach
  on public.exercises for update
  using (public.is_coach())
  with check (public.is_coach());

create policy exercises_delete_coach
  on public.exercises for delete
  using (public.is_coach());

create policy exercises_select_athlete
  on public.exercises for select
  using (public.my_athlete_id() is not null);

comment on table public.exercises is
  'Bibliothèque d’exercices commune à tous les coachs.';

-- 4) RPC création sportif avec total_weeks
drop function if exists public.coach_create_athlete(text, text, text, text);
drop function if exists public.coach_create_athlete(text, text, text, text, integer);

create or replace function public.coach_create_athlete(
  p_first_name text,
  p_last_name text,
  p_email text,
  p_goal text default '',
  p_total_weeks integer default 12
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_weeks integer := greatest(coalesce(p_total_weeks, 12), 1);
begin
  if auth.uid() is null then
    raise exception 'Non authentifié';
  end if;

  if not public.is_coach() then
    raise exception 'Accès réservé au coach';
  end if;

  insert into public.athletes (
    coach_id,
    first_name,
    last_name,
    email,
    goal,
    total_weeks,
    current_week
  )
  values (
    auth.uid(),
    trim(p_first_name),
    coalesce(trim(p_last_name), ''),
    lower(trim(p_email)),
    coalesce(trim(p_goal), ''),
    v_weeks,
    1
  )
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.coach_create_athlete(text, text, text, text, integer) to authenticated;
