-- Ressenti par séance, activités sportif, sous-programmes réutilisables

-- ---------------------------------------------------------------------------
-- 1. session_check_ins — ressenti au démarrage de chaque séance
-- ---------------------------------------------------------------------------

create table public.session_check_ins (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes (id) on delete cascade,
  session_id uuid not null references public.sessions (id) on delete cascade,
  energy smallint not null check (energy between 1 and 5),
  sleep smallint not null check (sleep between 1 and 5),
  pain smallint not null check (pain between 1 and 5),
  motivation smallint not null check (motivation between 1 and 5),
  comment text not null default '',
  needs_attention boolean not null default false,
  created_at timestamptz not null default now(),
  unique (athlete_id, session_id)
);

create index session_check_ins_athlete_id_idx on public.session_check_ins (athlete_id);
create index session_check_ins_session_id_idx on public.session_check_ins (session_id);
create index session_check_ins_needs_attention_idx
  on public.session_check_ins (needs_attention)
  where needs_attention = true;

alter table public.session_check_ins enable row level security;

create policy session_check_ins_select_coach
  on public.session_check_ins for select
  using (public.is_my_athlete(athlete_id));

create policy session_check_ins_select_self
  on public.session_check_ins for select
  using (
    athlete_id in (
      select a.id from public.athletes a where a.profile_id = auth.uid()
    )
  );

create policy session_check_ins_insert_self
  on public.session_check_ins for insert
  with check (
    athlete_id in (
      select a.id from public.athletes a where a.profile_id = auth.uid()
    )
  );

create policy session_check_ins_update_self
  on public.session_check_ins for update
  using (
    athlete_id in (
      select a.id from public.athletes a where a.profile_id = auth.uid()
    )
  )
  with check (
    athlete_id in (
      select a.id from public.athletes a where a.profile_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 2. athlete activities + recurrences
-- ---------------------------------------------------------------------------

create table public.athlete_activity_recurrences (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes (id) on delete cascade,
  name text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  rpe_default smallint check (rpe_default is null or rpe_default between 1 and 10),
  weekdays smallint[] not null default '{}',
  times_per_week smallint check (times_per_week is null or times_per_week between 1 and 7),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    cardinality(weekdays) > 0
    or times_per_week is not null
  )
);

create trigger athlete_activity_recurrences_set_updated_at
  before update on public.athlete_activity_recurrences
  for each row execute function public.set_updated_at();

create index athlete_activity_recurrences_athlete_id_idx
  on public.athlete_activity_recurrences (athlete_id);

create table public.athlete_activities (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes (id) on delete cascade,
  recurrence_id uuid references public.athlete_activity_recurrences (id) on delete set null,
  name text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  rpe smallint check (rpe is null or rpe between 1 and 10),
  performed_on date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger athlete_activities_set_updated_at
  before update on public.athlete_activities
  for each row execute function public.set_updated_at();

create index athlete_activities_athlete_id_idx on public.athlete_activities (athlete_id);
create index athlete_activities_performed_on_idx on public.athlete_activities (performed_on);

alter table public.athlete_activity_recurrences enable row level security;
alter table public.athlete_activities enable row level security;

create policy athlete_activity_recurrences_select_coach
  on public.athlete_activity_recurrences for select
  using (public.is_my_athlete(athlete_id));

create policy athlete_activity_recurrences_all_self
  on public.athlete_activity_recurrences for all
  using (
    athlete_id in (
      select a.id from public.athletes a where a.profile_id = auth.uid()
    )
  )
  with check (
    athlete_id in (
      select a.id from public.athletes a where a.profile_id = auth.uid()
    )
  );

create policy athlete_activities_select_coach
  on public.athlete_activities for select
  using (public.is_my_athlete(athlete_id));

create policy athlete_activities_all_self
  on public.athlete_activities for all
  using (
    athlete_id in (
      select a.id from public.athletes a where a.profile_id = auth.uid()
    )
  )
  with check (
    athlete_id in (
      select a.id from public.athletes a where a.profile_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 3. workout templates (sous-programmes)
-- ---------------------------------------------------------------------------

create type public.workout_template_kind as enum ('day', 'block');

create table public.workout_templates (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  kind public.workout_template_kind not null default 'block',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger workout_templates_set_updated_at
  before update on public.workout_templates
  for each row execute function public.set_updated_at();

create index workout_templates_coach_id_idx on public.workout_templates (coach_id);

create table public.workout_template_exercises (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.workout_templates (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete restrict,
  sort_order integer not null default 0,
  sets_count integer not null default 4,
  target_reps integer not null default 8,
  target_weight_kg numeric,
  target_percent numeric,
  target_rpe numeric,
  rest_seconds integer,
  coach_note text not null default '',
  superset_group_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (template_id, sort_order)
);

create trigger workout_template_exercises_set_updated_at
  before update on public.workout_template_exercises
  for each row execute function public.set_updated_at();

create index workout_template_exercises_template_id_idx
  on public.workout_template_exercises (template_id);

alter table public.workout_templates enable row level security;
alter table public.workout_template_exercises enable row level security;

create policy workout_templates_all_own
  on public.workout_templates for all
  using (public.is_coach() and coach_id = auth.uid())
  with check (public.is_coach() and coach_id = auth.uid());

create policy workout_template_exercises_all_own
  on public.workout_template_exercises for all
  using (
    public.is_coach()
    and exists (
      select 1
      from public.workout_templates t
      where t.id = template_id
        and t.coach_id = auth.uid()
    )
  )
  with check (
    public.is_coach()
    and exists (
      select 1
      from public.workout_templates t
      where t.id = template_id
        and t.coach_id = auth.uid()
    )
  );

grant select, insert, update, delete on table public.session_check_ins to authenticated;
grant select on table public.session_check_ins to anon;

grant select, insert, update, delete on table public.athlete_activity_recurrences to authenticated;
grant select on table public.athlete_activity_recurrences to anon;

grant select, insert, update, delete on table public.athlete_activities to authenticated;
grant select on table public.athlete_activities to anon;

grant select, insert, update, delete on table public.workout_templates to authenticated;
grant select on table public.workout_templates to anon;

grant select, insert, update, delete on table public.workout_template_exercises to authenticated;
grant select on table public.workout_template_exercises to anon;
