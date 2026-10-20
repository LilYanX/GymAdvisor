-- Téléphone optionnel pour relance WhatsApp

alter table public.athletes add column if not exists phone text;
