-- RPE final de séance (saisi à la clôture) pour UA = durée × RPE/10

alter table public.session_logs
  add column if not exists final_rpe smallint
  check (final_rpe is null or (final_rpe >= 1 and final_rpe <= 10));

comment on column public.session_logs.final_rpe is
  'RPE global saisi en fin de séance (1–10), pour UA finale = durée × final_rpe / 10';
