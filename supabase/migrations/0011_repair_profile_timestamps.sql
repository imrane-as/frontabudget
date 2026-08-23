-- Repair profile tables created from an incomplete initial migration.
-- Idempotent: safe to run more than once from the Supabase SQL editor.

alter table public.profiles
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

grant select, update on table public.profiles to authenticated;

-- Refresh the notification queue before asking the Data API to rebuild its cache.
select pg_notification_queue_usage();
notify pgrst, 'reload schema';

