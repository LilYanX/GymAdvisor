-- GymAdvisor — stockage des vidéos d’exercices (MP4)
-- À exécuter dans l’éditeur SQL du projet Supabase (SQL Editor → New query → Run).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'exercise-videos',
  'exercise-videos',
  true,
  52428800,
  array['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists exercise_videos_insert_coach on storage.objects;
drop policy if exists exercise_videos_update_coach on storage.objects;
drop policy if exists exercise_videos_delete_coach on storage.objects;
drop policy if exists exercise_videos_select_authenticated on storage.objects;

-- Chemin : {coach_id}/{uuid}.mp4 — seul le coach écrit dans son dossier.
create policy exercise_videos_insert_coach
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'exercise-videos'
    and public.is_coach()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy exercise_videos_update_coach
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'exercise-videos'
    and public.is_coach()
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'exercise-videos'
    and public.is_coach()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy exercise_videos_delete_coach
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'exercise-videos'
    and public.is_coach()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Lecture via l’API Storage (l’URL publique fonctionne aussi sans auth).
create policy exercise_videos_select_authenticated
  on storage.objects for select
  to authenticated
  using (bucket_id = 'exercise-videos');
