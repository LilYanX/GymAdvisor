-- Droits manquants sur les tables créées après le GRANT global initial

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

-- Pour les prochaines tables créées dans public
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant select on tables to anon;
