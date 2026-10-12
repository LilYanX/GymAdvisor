-- Catégorie Étirement + unités minutes / respirations

alter type public.muscle_group add value if not exists 'etirement';

alter type public.target_unit add value if not exists 'minutes';
alter type public.target_unit add value if not exists 'respirations';
