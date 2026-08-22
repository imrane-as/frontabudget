-- Security hardening for production. Safe to run after migrations 0001-0005.
-- This migration is intentionally idempotent for manually managed Supabase projects.

create extension if not exists "pgcrypto";

-- Repair databases that were initialized with only a subset of migration 0001.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  residence_country text default 'France',
  work_country text default 'Luxembourg',
  currency text default 'EUR',
  primary_goal text,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists weather_city text not null default 'Metz',
  add column if not exists budget_alert_threshold integer not null default 80,
  add column if not exists monthly_savings_target numeric(12,2) not null default 300;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('income','expense')),
  icon text,
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  amount numeric(12,2) not null check (amount >= 0),
  type text not null check (type in ('income','expense')),
  transaction_date date not null default current_date,
  payment_method text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recurring_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  amount numeric(12,2) not null check (amount >= 0),
  type text not null check (type in ('income','expense')),
  frequency text not null check (frequency in ('weekly','monthly','yearly')),
  next_execution_date date not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  month integer not null check (month between 1 and 12),
  year integer not null check (year between 2020 and 2100),
  planned_amount numeric(12,2) not null check (planned_amount >= 0),
  created_at timestamptz not null default now(),
  unique (user_id, category_id, month, year)
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_amount numeric(12,2) not null check (target_amount > 0),
  current_amount numeric(12,2) not null default 0 check (current_amount >= 0),
  target_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.goal_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references public.goals(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  contributed_at date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists public.commute_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  distance_one_way_km numeric(10,2) not null default 0,
  office_days_month integer not null default 0,
  fuel_cost_month numeric(12,2) not null default 0,
  parking_cost_month numeric(12,2) not null default 0,
  toll_cost_month numeric(12,2) not null default 0,
  leasing_cost_month numeric(12,2) not null default 0,
  insurance_cost_month numeric(12,2) not null default 0,
  other_cost_month numeric(12,2) not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.work_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  work_date date not null,
  day_type text not null check (day_type in ('luxembourg','remote','leave','sick','other')),
  note text,
  created_at timestamptz not null default now(),
  unique (user_id, work_date)
);

create index if not exists idx_transactions_user_date
  on public.transactions(user_id, transaction_date desc);
create index if not exists idx_work_days_user_date
  on public.work_days(user_id, work_date desc);
create index if not exists idx_budgets_user_period
  on public.budgets(user_id, year, month);

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.recurring_transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.goals enable row level security;
alter table public.goal_contributions enable row level security;
alter table public.commute_profiles enable row level security;
alter table public.work_days enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "categories_all_own" on public.categories;
create policy "categories_all_own" on public.categories
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "goals_all_own" on public.goals;
create policy "goals_all_own" on public.goals
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "commute_all_own" on public.commute_profiles;
create policy "commute_all_own" on public.commute_profiles
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "work_days_all_own" on public.work_days;
create policy "work_days_all_own" on public.work_days
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

revoke all on table public.profiles from anon, authenticated;
grant select, update on table public.profiles to authenticated;

revoke all on table public.categories from anon, authenticated;
revoke all on table public.transactions from anon, authenticated;
revoke all on table public.recurring_transactions from anon, authenticated;
revoke all on table public.budgets from anon, authenticated;
revoke all on table public.goals from anon, authenticated;
revoke all on table public.goal_contributions from anon, authenticated;
revoke all on table public.commute_profiles from anon, authenticated;
revoke all on table public.work_days from anon, authenticated;

grant select, insert, update, delete on table public.categories to authenticated;
grant select, insert, update, delete on table public.transactions to authenticated;
grant select, insert, update, delete on table public.recurring_transactions to authenticated;
grant select, insert, update, delete on table public.budgets to authenticated;
grant select, insert, update, delete on table public.goals to authenticated;
grant select, insert, update, delete on table public.goal_contributions to authenticated;
grant select, insert, update, delete on table public.commute_profiles to authenticated;
grant select, insert, update, delete on table public.work_days to authenticated;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.api_rate_limits (
  user_id uuid not null references auth.users(id) on delete cascade,
  scope text not null,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0 check (request_count >= 0),
  primary key (user_id, scope)
);

alter table private.api_rate_limits enable row level security;
revoke all on table private.api_rate_limits from public, anon, authenticated;

create or replace function public.consume_api_rate_limit(p_scope text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  request_limit integer;
  window_duration interval;
  current_time timestamptz := statement_timestamp();
  current_count integer;
begin
  if current_user_id is null then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  case p_scope
    when 'coach' then
      request_limit := 10;
      window_duration := interval '5 minutes';
    when 'weather' then
      request_limit := 30;
      window_duration := interval '1 hour';
    when 'stripe_checkout' then
      request_limit := 5;
      window_duration := interval '1 hour';
    when 'categorize' then
      request_limit := 30;
      window_duration := interval '1 day';
    else
      raise exception 'Unknown rate-limit scope' using errcode = '22023';
  end case;

  insert into private.api_rate_limits(
    user_id,
    scope,
    window_started_at,
    request_count
  )
  values(current_user_id, p_scope, current_time, 1)
  on conflict (user_id, scope)
  do update set
    request_count = case
      when private.api_rate_limits.window_started_at <= current_time - window_duration
        then 1
      else private.api_rate_limits.request_count + 1
    end,
    window_started_at = case
      when private.api_rate_limits.window_started_at <= current_time - window_duration
        then current_time
      else private.api_rate_limits.window_started_at
    end
  returning request_count into current_count;

  return current_count <= request_limit;
end;
$$;

revoke all on function public.consume_api_rate_limit(text) from public, anon;
grant execute on function public.consume_api_rate_limit(text) to authenticated;

create table if not exists public.ai_daily_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null default current_date,
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, usage_date)
);

alter table public.ai_daily_usage enable row level security;
drop policy if exists "ai_daily_usage_all_own" on public.ai_daily_usage;
revoke all on table public.ai_daily_usage from public, anon, authenticated;

create or replace function public.consume_ai_quota(
  p_user_id uuid,
  p_daily_limit integer default 3
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  next_count integer;
begin
  if current_user_id is null or current_user_id <> p_user_id then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  if p_daily_limit < 1 or p_daily_limit > 20 then
    raise exception 'Invalid daily limit' using errcode = '22023';
  end if;

  insert into public.ai_daily_usage(user_id, usage_date, request_count)
  values (current_user_id, current_date, 1)
  on conflict (user_id, usage_date)
  do update set
    request_count = public.ai_daily_usage.request_count + 1,
    updated_at = now()
  where public.ai_daily_usage.request_count < p_daily_limit
  returning request_count into next_count;

  return next_count is not null and next_count <= p_daily_limit;
end;
$$;

revoke all on function public.consume_ai_quota(uuid, integer) from public, anon;
grant execute on function public.consume_ai_quota(uuid, integer) to authenticated;

-- Some early FrontaBudget installations were created without the Stripe table.
-- Recreate it safely before applying the webhook hardening.
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  price_id text,
  plan text not null default 'free' check (plan in ('free','premium')),
  status text not null default 'inactive',
  current_period_end timestamptz,
  stripe_event_created bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions
  add column if not exists stripe_event_created bigint;

alter table public.subscriptions enable row level security;
drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own" on public.subscriptions
  for select to authenticated
  using ((select auth.uid()) = user_id);

revoke all on table public.subscriptions from public, anon, authenticated;
grant select on table public.subscriptions to authenticated;
grant select, insert, update, delete on table public.subscriptions to service_role;

insert into public.subscriptions(user_id, plan, status)
select profile.id, 'free', 'active'
from public.profiles profile
on conflict (user_id) do nothing;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;

  insert into public.categories(user_id, name, type, icon)
  values
    (new.id, 'Salaire', 'income', '💰'),
    (new.id, 'Prime', 'income', '🎁'),
    (new.id, 'Logement', 'expense', '🏠'),
    (new.id, 'Voiture', 'expense', '🚗'),
    (new.id, 'Carburant', 'expense', '⛽'),
    (new.id, 'Courses', 'expense', '🛒'),
    (new.id, 'Restaurants', 'expense', '🍽️'),
    (new.id, 'Énergie', 'expense', '⚡'),
    (new.id, 'Téléphone', 'expense', '📱'),
    (new.id, 'Assurances', 'expense', '🛡️'),
    (new.id, 'Abonnements', 'expense', '📺'),
    (new.id, 'Crédit', 'expense', '🏦'),
    (new.id, 'Sport', 'expense', '🏋️'),
    (new.id, 'Shopping', 'expense', '🛍️'),
    (new.id, 'Voyage', 'expense', '✈️'),
    (new.id, 'Autre', 'expense', '📦');

  insert into public.subscriptions(user_id, plan, status)
  values (new.id, 'free', 'active')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create table if not exists public.stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now(),
  constraint stripe_webhook_event_id_length check (char_length(event_id) between 1 and 255),
  constraint stripe_webhook_event_type_length check (char_length(event_type) between 1 and 120)
);

alter table public.stripe_webhook_events enable row level security;
revoke all on table public.stripe_webhook_events from public, anon, authenticated;
grant select, insert, update, delete on table public.stripe_webhook_events to service_role;

-- Prevent a user from attaching a record to another user's category or goal.
drop policy if exists "transactions_all_own" on public.transactions;
drop policy if exists "transactions_select_own" on public.transactions;
drop policy if exists "transactions_insert_own" on public.transactions;
drop policy if exists "transactions_update_own" on public.transactions;
drop policy if exists "transactions_delete_own" on public.transactions;
create policy "transactions_select_own" on public.transactions
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "transactions_insert_own" on public.transactions
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and (
      category_id is null
      or exists (
        select 1 from public.categories category
        where category.id = category_id
          and category.user_id = (select auth.uid())
      )
    )
  );
create policy "transactions_update_own" on public.transactions
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (
      category_id is null
      or exists (
        select 1 from public.categories category
        where category.id = category_id
          and category.user_id = (select auth.uid())
      )
    )
  );
create policy "transactions_delete_own" on public.transactions
  for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "recurring_all_own" on public.recurring_transactions;
drop policy if exists "recurring_select_own" on public.recurring_transactions;
drop policy if exists "recurring_insert_own" on public.recurring_transactions;
drop policy if exists "recurring_update_own" on public.recurring_transactions;
drop policy if exists "recurring_delete_own" on public.recurring_transactions;
create policy "recurring_select_own" on public.recurring_transactions
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "recurring_insert_own" on public.recurring_transactions
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and (
      category_id is null
      or exists (
        select 1 from public.categories category
        where category.id = category_id
          and category.user_id = (select auth.uid())
      )
    )
  );
create policy "recurring_update_own" on public.recurring_transactions
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (
      category_id is null
      or exists (
        select 1 from public.categories category
        where category.id = category_id
          and category.user_id = (select auth.uid())
      )
    )
  );
create policy "recurring_delete_own" on public.recurring_transactions
  for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "budgets_all_own" on public.budgets;
drop policy if exists "budgets_select_own" on public.budgets;
drop policy if exists "budgets_insert_own" on public.budgets;
drop policy if exists "budgets_update_own" on public.budgets;
drop policy if exists "budgets_delete_own" on public.budgets;
create policy "budgets_select_own" on public.budgets
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "budgets_insert_own" on public.budgets
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.categories category
      where category.id = category_id
        and category.user_id = (select auth.uid())
        and category.type = 'expense'
    )
  );
create policy "budgets_update_own" on public.budgets
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.categories category
      where category.id = category_id
        and category.user_id = (select auth.uid())
        and category.type = 'expense'
    )
  );
create policy "budgets_delete_own" on public.budgets
  for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "goal_contributions_all_own" on public.goal_contributions;
drop policy if exists "goal_contributions_select_own" on public.goal_contributions;
drop policy if exists "goal_contributions_insert_own" on public.goal_contributions;
drop policy if exists "goal_contributions_update_own" on public.goal_contributions;
drop policy if exists "goal_contributions_delete_own" on public.goal_contributions;
create policy "goal_contributions_select_own" on public.goal_contributions
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "goal_contributions_insert_own" on public.goal_contributions
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.goals goal
      where goal.id = goal_id
        and goal.user_id = (select auth.uid())
    )
  );
create policy "goal_contributions_update_own" on public.goal_contributions
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.goals goal
      where goal.id = goal_id
        and goal.user_id = (select auth.uid())
    )
  );
create policy "goal_contributions_delete_own" on public.goal_contributions
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Enforce reasonable bounds on all new or modified user content.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_security_bounds') then
    alter table public.profiles add constraint profiles_security_bounds check (
      char_length(coalesce(full_name, '')) <= 100
      and char_length(coalesce(weather_city, '')) between 1 and 80
      and budget_alert_threshold between 50 and 100
      and monthly_savings_target between 0 and 100000000
    ) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'transactions_security_bounds') then
    alter table public.transactions add constraint transactions_security_bounds check (
      char_length(name) between 1 and 120
      and amount <= 1000000000
      and char_length(coalesce(notes, '')) <= 2000
    ) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'categories_security_bounds') then
    alter table public.categories add constraint categories_security_bounds check (
      char_length(name) between 1 and 80
    ) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'recurring_security_bounds') then
    alter table public.recurring_transactions add constraint recurring_security_bounds check (
      char_length(name) between 1 and 120
      and amount <= 1000000000
    ) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'goals_security_bounds') then
    alter table public.goals add constraint goals_security_bounds check (
      char_length(name) between 1 and 120
      and target_amount <= 1000000000
      and current_amount <= 1000000000
    ) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'work_days_security_bounds') then
    alter table public.work_days add constraint work_days_security_bounds check (
      char_length(coalesce(note, '')) <= 1000
    ) not valid;
  end if;
end
$$;

revoke create on schema public from anon, authenticated;
notify pgrst, 'reload schema';
