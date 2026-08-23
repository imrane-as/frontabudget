-- Repair profile saving after the personalization migration.
-- Idempotent: safe to run from the Supabase SQL editor more than once.

alter table public.profiles
  add column if not exists birth_year integer,
  add column if not exists household_size integer not null default 1,
  add column if not exists employment_status text,
  add column if not exists skills text,
  add column if not exists grocery_budget_weekly numeric(10,2),
  add column if not exists avatar_path text;

-- Older accounts may have been created while the profile trigger was missing.
insert into public.profiles (id, full_name)
select
  users.id,
  left(coalesce(users.raw_user_meta_data->>'full_name', ''), 100)
from auth.users as users
on conflict (id) do nothing;

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

grant select, update on table public.profiles to authenticated;

-- Force the Data API to see columns added by migrations 0009/0010.
notify pgrst, 'reload schema';

