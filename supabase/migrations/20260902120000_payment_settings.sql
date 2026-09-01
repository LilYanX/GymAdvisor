-- Paramètres de paiement par coach (échéance et délai avant blocage)

alter table public.profiles
  add column if not exists payment_due_day integer not null default 25
    check (payment_due_day between 1 and 28),
  add column if not exists payment_block_after_days integer not null default 5
    check (payment_block_after_days between 0 and 60);

comment on column public.profiles.payment_due_day is
  'Jour du mois à partir duquel le paiement est considéré en retard.';
comment on column public.profiles.payment_block_after_days is
  'Nombre de jours après l''échéance avant blocage de l''accès sportif.';
