-- GymAdvisor — schéma initial
-- À exécuter dans l’éditeur SQL du projet Supabase (SQL Editor → New query → Run).
-- Les colonnes pourront être ajoutées ensuite via de nouvelles migrations.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.user_role as enum ('coach', 'athlete');
create type public.muscle_group as enum (
  'jambes',
  'haut_du_corps',
  'gainage',
  'cardio',
  'full_body'
);
create type public.week_status as enum ('draft', 'published');
create type public.session_type as enum ('workout', 'rest', 'optional');
create type public.session_log_status as enum (
  'not_started',
  'in_progress',
  'completed',
  'skipped'
);
create type public.payment_status as enum ('pending', 'paid');
create type public.reminder_kind as enum (
  'session_fill',
  'week_prepare',
  'payment',
  'check_in'
);
create type public.reminder_channel as enum ('email');

-- ---------------------------------------------------------------------------
-- Utilitaires
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 1. profiles — compte connecté (coach ou sportif)
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'athlete',
  first_name text not null default '',
  last_name text not null default '',
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

comment on table public.profiles is
  'Compte Auth : un coach (Lilia) et des sportifs une fois inscrits.';

-- ---------------------------------------------------------------------------
-- 2. athletes — roster du coach (existe même avant inscription)
-- ---------------------------------------------------------------------------

create table public.athletes (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles (id) on delete restrict,
  profile_id uuid unique references public.profiles (id) on delete set null,
  email text not null,
  first_name text not null,
  last_name text not null default '',
  goal text not null default '',
  birth_date date,
  current_week integer not null default 1 check (current_week >= 1),
  total_weeks integer not null default 12 check (total_weeks >= 1),
  notes text not null default '',
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (coach_id, email)
);

create index athletes_coach_id_idx on public.athletes (coach_id);
create index athletes_profile_id_idx on public.athletes (profile_id);

create trigger athletes_set_updated_at
  before update on public.athletes
  for each row execute function public.set_updated_at();

comment on table public.athletes is
  'Sportif suivi. profile_id se remplit quand le compte Auth est créé (même e-mail).';
comment on column public.athletes.notes is
  'Notes coach (onglet Notes). Peut devenir une table d’historique plus tard.';
comment on column public.athletes.current_week is
  'Semaine affichée (ex. 7 dans 7/12).';

-- ---------------------------------------------------------------------------
-- 3. exercises — bibliothèque de mouvements + vidéo
-- ---------------------------------------------------------------------------

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  muscle_group public.muscle_group not null,
  video_url text,
  cues text[] not null default '{}',
  vigilance_points text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index exercises_coach_id_idx on public.exercises (coach_id);
create index exercises_muscle_group_idx on public.exercises (muscle_group);

create trigger exercises_set_updated_at
  before update on public.exercises
  for each row execute function public.set_updated_at();

comment on table public.exercises is
  'Bibliothèque réutilisable. Évite de renvoyer la même vidéo sur WhatsApp.';
comment on column public.exercises.cues is
  'Consignes techniques (liste de phrases).';

-- ---------------------------------------------------------------------------
-- 4. program_weeks — une semaine de programme pour un sportif
-- ---------------------------------------------------------------------------

create table public.program_weeks (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes (id) on delete cascade,
  week_number integer not null check (week_number >= 1),
  status public.week_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (athlete_id, week_number)
);

create index program_weeks_athlete_id_idx on public.program_weeks (athlete_id);

create trigger program_weeks_set_updated_at
  before update on public.program_weeks
  for each row execute function public.set_updated_at();

comment on table public.program_weeks is
  'Semaine 8 — Chloé. Brouillon jusqu’à publication (notification sportif).';

-- ---------------------------------------------------------------------------
-- 5. sessions — un jour de la semaine (séance ou repos)
-- ---------------------------------------------------------------------------

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  program_week_id uuid not null references public.program_weeks (id) on delete cascade,
  weekday smallint not null check (weekday between 1 and 7),
  scheduled_date date,
  title text not null,
  session_type public.session_type not null default 'workout',
  rest_details text not null default '',
  suggested_time time,
  estimated_minutes integer check (estimated_minutes is null or estimated_minutes > 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (program_week_id, weekday)
);

create index sessions_program_week_id_idx on public.sessions (program_week_id);
create index sessions_scheduled_date_idx on public.sessions (scheduled_date);

create trigger sessions_set_updated_at
  before update on public.sessions
  for each row execute function public.set_updated_at();

comment on column public.sessions.weekday is
  '1 = lundi … 7 = dimanche.';
comment on column public.sessions.scheduled_date is
  'Date réelle, utile pour les relances (« séance d’hier »). À remplir à la publication.';

-- ---------------------------------------------------------------------------
-- 6. session_exercises — prescription coach (séries, charge, RPE cible)
-- ---------------------------------------------------------------------------

create table public.session_exercises (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete restrict,
  sort_order integer not null default 0,
  sets_count smallint not null check (sets_count >= 1),
  target_reps smallint not null check (target_reps >= 1),
  target_weight_kg double precision,
  target_percent double precision,
  target_rpe smallint check (target_rpe is null or target_rpe between 1 and 10),
  rest_seconds integer check (rest_seconds is null or rest_seconds >= 0),
  coach_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, sort_order)
);

create index session_exercises_session_id_idx on public.session_exercises (session_id);
create index session_exercises_exercise_id_idx on public.session_exercises (exercise_id);

create trigger session_exercises_set_updated_at
  before update on public.session_exercises
  for each row execute function public.set_updated_at();

comment on column public.session_exercises.coach_note is
  'Ex. « pause 1s en bas ». Personnalisation par séance, pas dans la bibliothèque.';

-- ---------------------------------------------------------------------------
-- 7. session_logs — avancement de la séance (fait / en cours / en retard)
-- ---------------------------------------------------------------------------

create table public.session_logs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.sessions (id) on delete cascade,
  athlete_id uuid not null references public.athletes (id) on delete cascade,
  status public.session_log_status not null default 'not_started',
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index session_logs_athlete_id_idx on public.session_logs (athlete_id, status);

create trigger session_logs_set_updated_at
  before update on public.session_logs
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 8. session_exercise_logs — RPE ressenti + commentaire par exercice
-- ---------------------------------------------------------------------------

create table public.session_exercise_logs (
  id uuid primary key default gen_random_uuid(),
  session_exercise_id uuid not null unique references public.session_exercises (id) on delete cascade,
  athlete_id uuid not null references public.athletes (id) on delete cascade,
  rpe smallint check (rpe is null or rpe between 1 and 10),
  comment text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger session_exercise_logs_set_updated_at
  before update on public.session_exercise_logs
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 9. set_logs — une ligne par série (charge, reps, fait)
-- ---------------------------------------------------------------------------

create table public.set_logs (
  id uuid primary key default gen_random_uuid(),
  session_exercise_id uuid not null references public.session_exercises (id) on delete cascade,
  athlete_id uuid not null references public.athletes (id) on delete cascade,
  set_number smallint not null check (set_number >= 1),
  weight_kg double precision,
  reps smallint,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_exercise_id, set_number)
);

create index set_logs_session_exercise_id_idx on public.set_logs (session_exercise_id);

create trigger set_logs_set_updated_at
  before update on public.set_logs
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 10. check_ins — ressenti hebdo (énergie / sommeil / douleurs)
-- ---------------------------------------------------------------------------

create table public.check_ins (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes (id) on delete cascade,
  program_week_id uuid references public.program_weeks (id) on delete set null,
  week_start_date date not null,
  energy smallint not null check (energy between 1 and 5),
  sleep smallint not null check (sleep between 1 and 5),
  pain smallint not null check (pain between 1 and 5),
  comment text not null default '',
  created_at timestamptz not null default now(),
  unique (athlete_id, week_start_date)
);

create index check_ins_athlete_id_idx on public.check_ins (athlete_id);

comment on table public.check_ins is
  'Check-in « Comment tu te sens cette semaine ? ».';

-- ---------------------------------------------------------------------------
-- 11. payments — suivi mensuel simple (pas d’encaissement)
-- ---------------------------------------------------------------------------

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes (id) on delete cascade,
  period_start date not null,
  status public.payment_status not null default 'pending',
  amount_cents integer check (amount_cents is null or amount_cents >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (athlete_id, period_start)
);

create index payments_athlete_id_idx on public.payments (athlete_id);

create trigger payments_set_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

comment on column public.payments.period_start is
  'Premier jour du mois concerné (ex. 2026-08-01).';

-- ---------------------------------------------------------------------------
-- 12. reminder_logs — historique des relances auto (anti-doublon)
-- ---------------------------------------------------------------------------

create table public.reminder_logs (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes (id) on delete cascade,
  kind public.reminder_kind not null,
  channel public.reminder_channel not null default 'email',
  session_id uuid references public.sessions (id) on delete set null,
  program_week_id uuid references public.program_weeks (id) on delete set null,
  sent_at timestamptz not null default now()
);

create index reminder_logs_athlete_id_idx on public.reminder_logs (athlete_id, kind, sent_at desc);

-- ---------------------------------------------------------------------------
-- Auth : créer le profil + lier le sportif existant par e-mail
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name, last_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    'athlete'
  );

  update public.athletes
  set profile_id = new.id
  where profile_id is null
    and lower(email) = lower(new.email);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role
     and current_user not in ('postgres', 'supabase_admin') then
    raise exception 'Le rôle ne peut être changé que depuis le SQL Editor';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

-- ---------------------------------------------------------------------------
-- Helpers RLS (security definer pour éviter la récursion)
-- ---------------------------------------------------------------------------

create or replace function public.is_coach()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'coach'
  );
$$;

create or replace function public.my_athlete_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.athletes
  where profile_id = auth.uid()
  limit 1;
$$;

create or replace function public.is_my_athlete(_athlete_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.athletes
    where id = _athlete_id
      and coach_id = auth.uid()
  );
$$;

create or replace function public.week_athlete_id(_week_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select athlete_id from public.program_weeks where id = _week_id;
$$;

create or replace function public.session_athlete_id(_session_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select pw.athlete_id
  from public.sessions s
  join public.program_weeks pw on pw.id = s.program_week_id
  where s.id = _session_id;
$$;

create or replace function public.session_exercise_athlete_id(_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select pw.athlete_id
  from public.session_exercises se
  join public.sessions s on s.id = se.session_id
  join public.program_weeks pw on pw.id = s.program_week_id
  where se.id = _id;
$$;

create or replace function public.is_published_week(_week_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.program_weeks
    where id = _week_id
      and status = 'published'
  );
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.athletes enable row level security;
alter table public.exercises enable row level security;
alter table public.program_weeks enable row level security;
alter table public.sessions enable row level security;
alter table public.session_exercises enable row level security;
alter table public.session_logs enable row level security;
alter table public.session_exercise_logs enable row level security;
alter table public.set_logs enable row level security;
alter table public.check_ins enable row level security;
alter table public.payments enable row level security;
alter table public.reminder_logs enable row level security;

-- profiles
create policy profiles_select_own
  on public.profiles for select
  using (id = auth.uid());

create policy profiles_select_as_coach
  on public.profiles for select
  using (
    public.is_coach()
    and id in (
      select a.profile_id
      from public.athletes a
      where a.coach_id = auth.uid()
        and a.profile_id is not null
    )
  );

create policy profiles_select_my_coach
  on public.profiles for select
  using (
    id = (
      select a.coach_id
      from public.athletes a
      where a.profile_id = auth.uid()
    )
  );

create policy profiles_update_own
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- athletes
create policy athletes_select_coach
  on public.athletes for select
  using (public.is_my_athlete(id));

create policy athletes_select_self
  on public.athletes for select
  using (id = public.my_athlete_id());

create policy athletes_insert_coach
  on public.athletes for insert
  with check (public.is_coach() and coach_id = auth.uid());

create policy athletes_update_coach
  on public.athletes for update
  using (public.is_my_athlete(id))
  with check (public.is_my_athlete(id) and coach_id = auth.uid());

create policy athletes_delete_coach
  on public.athletes for delete
  using (public.is_my_athlete(id));

-- exercises : le sportif lit la bibliothèque de son coach (vidéos du programme)
create policy exercises_all_coach
  on public.exercises for all
  using (public.is_coach() and coach_id = auth.uid())
  with check (public.is_coach() and coach_id = auth.uid());

create policy exercises_select_athlete
  on public.exercises for select
  using (
    coach_id = (
      select a.coach_id
      from public.athletes a
      where a.profile_id = auth.uid()
    )
  );

-- program_weeks
create policy program_weeks_all_coach
  on public.program_weeks for all
  using (public.is_my_athlete(athlete_id))
  with check (public.is_my_athlete(athlete_id));

create policy program_weeks_select_athlete
  on public.program_weeks for select
  using (
    athlete_id = public.my_athlete_id()
    and status = 'published'
  );

-- sessions
create policy sessions_all_coach
  on public.sessions for all
  using (public.is_my_athlete(public.week_athlete_id(program_week_id)))
  with check (public.is_my_athlete(public.week_athlete_id(program_week_id)));

create policy sessions_select_athlete
  on public.sessions for select
  using (
    public.week_athlete_id(program_week_id) = public.my_athlete_id()
    and public.is_published_week(program_week_id)
  );

-- session_exercises
create policy session_exercises_all_coach
  on public.session_exercises for all
  using (public.is_my_athlete(public.session_athlete_id(session_id)))
  with check (public.is_my_athlete(public.session_athlete_id(session_id)));

create policy session_exercises_select_athlete
  on public.session_exercises for select
  using (public.session_athlete_id(session_id) = public.my_athlete_id());

-- session_logs
create policy session_logs_select_coach
  on public.session_logs for select
  using (public.is_my_athlete(athlete_id));

create policy session_logs_select_self
  on public.session_logs for select
  using (athlete_id = public.my_athlete_id());

create policy session_logs_write_self
  on public.session_logs for insert
  with check (
    athlete_id = public.my_athlete_id()
    and public.session_athlete_id(session_id) = public.my_athlete_id()
  );

create policy session_logs_update_self
  on public.session_logs for update
  using (athlete_id = public.my_athlete_id())
  with check (athlete_id = public.my_athlete_id());

-- session_exercise_logs
create policy session_exercise_logs_select_coach
  on public.session_exercise_logs for select
  using (public.is_my_athlete(athlete_id));

create policy session_exercise_logs_select_self
  on public.session_exercise_logs for select
  using (athlete_id = public.my_athlete_id());

create policy session_exercise_logs_insert_self
  on public.session_exercise_logs for insert
  with check (
    athlete_id = public.my_athlete_id()
    and public.session_exercise_athlete_id(session_exercise_id) = public.my_athlete_id()
  );

create policy session_exercise_logs_update_self
  on public.session_exercise_logs for update
  using (athlete_id = public.my_athlete_id())
  with check (athlete_id = public.my_athlete_id());

-- set_logs
create policy set_logs_select_coach
  on public.set_logs for select
  using (public.is_my_athlete(athlete_id));

create policy set_logs_select_self
  on public.set_logs for select
  using (athlete_id = public.my_athlete_id());

create policy set_logs_insert_self
  on public.set_logs for insert
  with check (
    athlete_id = public.my_athlete_id()
    and public.session_exercise_athlete_id(session_exercise_id) = public.my_athlete_id()
  );

create policy set_logs_update_self
  on public.set_logs for update
  using (athlete_id = public.my_athlete_id())
  with check (athlete_id = public.my_athlete_id());

-- check_ins
create policy check_ins_select_coach
  on public.check_ins for select
  using (public.is_my_athlete(athlete_id));

create policy check_ins_select_self
  on public.check_ins for select
  using (athlete_id = public.my_athlete_id());

create policy check_ins_insert_self
  on public.check_ins for insert
  with check (athlete_id = public.my_athlete_id());

create policy check_ins_update_self
  on public.check_ins for update
  using (athlete_id = public.my_athlete_id())
  with check (athlete_id = public.my_athlete_id());

-- payments : le sportif voit son statut, seul le coach le modifie
create policy payments_select_coach
  on public.payments for select
  using (public.is_my_athlete(athlete_id));

create policy payments_select_self
  on public.payments for select
  using (athlete_id = public.my_athlete_id());

create policy payments_write_coach
  on public.payments for all
  using (public.is_my_athlete(athlete_id))
  with check (public.is_my_athlete(athlete_id));

-- reminder_logs : coach uniquement
create policy reminder_logs_coach
  on public.reminder_logs for all
  using (public.is_my_athlete(athlete_id))
  with check (public.is_my_athlete(athlete_id));

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on all tables in schema public to anon;

grant execute on function public.is_coach() to authenticated;
grant execute on function public.my_athlete_id() to authenticated;
grant execute on function public.is_my_athlete(uuid) to authenticated;
grant execute on function public.week_athlete_id(uuid) to authenticated;
grant execute on function public.session_athlete_id(uuid) to authenticated;
grant execute on function public.session_exercise_athlete_id(uuid) to authenticated;
grant execute on function public.is_published_week(uuid) to authenticated;

-- Après la première inscription du coach (Authentication → Users) :
-- update public.profiles set role = 'coach' where email = 'TON_EMAIL';
