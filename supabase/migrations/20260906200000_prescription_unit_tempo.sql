-- Unité de prescription (reps / mètres / secondes) + tempo

create type public.target_unit as enum ('reps', 'meters', 'seconds');

alter table public.session_exercises
  add column if not exists target_unit public.target_unit not null default 'reps',
  add column if not exists target_secondary_reps smallint
    check (target_secondary_reps is null or target_secondary_reps >= 1),
  add column if not exists tempo text not null default '';

alter table public.workout_template_exercises
  add column if not exists target_unit public.target_unit not null default 'reps',
  add column if not exists target_secondary_reps smallint
    check (target_secondary_reps is null or target_secondary_reps >= 1),
  add column if not exists tempo text not null default '';

comment on column public.session_exercises.target_unit is
  'Unité de la quantité principale (target_reps) : reps, mètres ou secondes.';
comment on column public.session_exercises.target_secondary_reps is
  'Reps additionnelles lorsque target_unit = seconds.';
comment on column public.session_exercises.tempo is
  'Tempo d’exécution (ex. 3-0-1-0).';
