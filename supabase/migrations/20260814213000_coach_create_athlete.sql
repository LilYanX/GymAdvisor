-- Permet au coach de créer un sportif même si la politique RLS INSERT échoue
-- (ex. is_coach() ou auth.uid() mal résolu côté client SSR).

create or replace function public.coach_create_athlete(
  p_first_name text,
  p_last_name text,
  p_email text,
  p_goal text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Non authentifié';
  end if;

  if not public.is_coach() then
    raise exception 'Accès réservé au coach';
  end if;

  insert into public.athletes (coach_id, first_name, last_name, email, goal)
  values (
    auth.uid(),
    trim(p_first_name),
    coalesce(trim(p_last_name), ''),
    lower(trim(p_email)),
    coalesce(trim(p_goal), '')
  )
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.coach_create_athlete(text, text, text, text) to authenticated;

comment on function public.coach_create_athlete is
  'Crée un sportif pour le coach connecté (contourne les soucis RLS INSERT).';
