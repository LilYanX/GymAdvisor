-- Superset : exercices liés dans une même session (enchaînés sans repos entre eux).

alter table public.session_exercises
  add column if not exists superset_group_id uuid;

create index if not exists session_exercises_superset_group_id_idx
  on public.session_exercises (superset_group_id)
  where superset_group_id is not null;

comment on column public.session_exercises.superset_group_id is
  'Exercices partageant le même UUID sont exécutés en superset.';
