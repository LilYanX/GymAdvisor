-- McLean wellness (2010) : fatigue, sommeil, courbatures, stress, humeur (1–5, 5 = meilleur)

alter table public.session_check_ins
  add column if not exists fatigue smallint,
  add column if not exists soreness smallint,
  add column if not exists stress smallint,
  add column if not exists mood smallint;

-- Migration depuis l’ancien questionnaire (énergie/sommeil/douleurs/motivation)
-- Douleurs (haut = pire) → courbatures McLean (haut = mieux) : 6 - pain
update public.session_check_ins
set
  fatigue = coalesce(fatigue, energy),
  soreness = coalesce(soreness, greatest(1, least(5, 6 - pain))),
  stress = coalesce(stress, 3),
  mood = coalesce(mood, motivation)
where fatigue is null
   or soreness is null
   or stress is null
   or mood is null;

alter table public.session_check_ins
  alter column fatigue set not null,
  alter column soreness set not null,
  alter column stress set not null,
  alter column mood set not null;

alter table public.session_check_ins
  drop constraint if exists session_check_ins_fatigue_check,
  drop constraint if exists session_check_ins_soreness_check,
  drop constraint if exists session_check_ins_stress_check,
  drop constraint if exists session_check_ins_mood_check,
  drop constraint if exists session_check_ins_sleep_check;

alter table public.session_check_ins
  add constraint session_check_ins_fatigue_check check (fatigue between 1 and 5),
  add constraint session_check_ins_sleep_check check (sleep between 1 and 5),
  add constraint session_check_ins_soreness_check check (soreness between 1 and 5),
  add constraint session_check_ins_stress_check check (stress between 1 and 5),
  add constraint session_check_ins_mood_check check (mood between 1 and 5);

alter table public.session_check_ins
  drop column if exists energy,
  drop column if exists pain,
  drop column if exists motivation;

comment on table public.session_check_ins is
  'Questionnaire McLean (2010) pré-séance : fatigue, sommeil, courbatures, stress, humeur (1–5, 5 = meilleur).';
