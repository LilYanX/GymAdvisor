-- Formule 1RM sur exercices + mensurations sportif + historique poids

alter table public.exercises
  add column if not exists one_rm_formula text;

alter table public.athletes
  add column if not exists height_cm double precision;

create table if not exists public.athlete_body_logs (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes (id) on delete cascade,
  recorded_on date not null,
  weight_kg double precision not null check (weight_kg > 0 and weight_kg < 500),
  created_at timestamptz not null default now(),
  unique (athlete_id, recorded_on)
);

create index if not exists athlete_body_logs_athlete_recorded_idx
  on public.athlete_body_logs (athlete_id, recorded_on);

alter table public.athlete_body_logs enable row level security;

-- Coach : lecture / écriture des logs de ses sportifs
create policy athlete_body_logs_coach_all
  on public.athlete_body_logs
  for all
  to authenticated
  using (
    exists (
      select 1 from public.athletes a
      where a.id = athlete_body_logs.athlete_id
        and a.coach_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.athletes a
      where a.id = athlete_body_logs.athlete_id
        and a.coach_id = auth.uid()
    )
  );

-- Sportif : lecture / écriture de ses propres logs
create policy athlete_body_logs_athlete_all
  on public.athlete_body_logs
  for all
  to authenticated
  using (
    exists (
      select 1 from public.athletes a
      where a.id = athlete_body_logs.athlete_id
        and a.profile_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.athletes a
      where a.id = athlete_body_logs.athlete_id
        and a.profile_id = auth.uid()
    )
  );

grant select, insert, update, delete on table public.athlete_body_logs to authenticated;
grant select on table public.athlete_body_logs to anon;

-- Sportif : mise à jour de son propre profil (prénom, nom, objectif, taille)
create policy athletes_update_self
  on public.athletes
  for update
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());
