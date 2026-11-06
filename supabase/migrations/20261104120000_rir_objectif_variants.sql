-- RIR ressenti par exercice
alter table public.session_exercise_logs
  add column if not exists rir smallint;

alter table public.session_exercise_logs
  add column if not exists selected_exercise_id uuid references public.exercises (id) on delete set null;

-- Catégorie Objectif + niveaux / familles de variantes
do $$
begin
  if not exists (
    select 1
    from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'muscle_group' and e.enumlabel = 'objectif'
  ) then
    alter type public.muscle_group add value 'objectif';
  end if;
end $$;

alter table public.exercises
  add column if not exists difficulty_level text
    check (
      difficulty_level is null
      or difficulty_level in ('basique', 'intermediaire', 'avance')
    );

alter table public.exercises
  add column if not exists variant_group_id uuid;
