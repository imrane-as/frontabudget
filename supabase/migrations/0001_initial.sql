create extension if not exists "pgcrypto";

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

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  price_id text,
  plan text not null default 'free' check (plan in ('free','premium')),
  status text not null default 'inactive',
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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
alter table public.subscriptions enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "categories_all_own" on public.categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "transactions_all_own" on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "recurring_all_own" on public.recurring_transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "budgets_all_own" on public.budgets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "goals_all_own" on public.goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "goal_contributions_all_own" on public.goal_contributions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "commute_all_own" on public.commute_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "work_days_all_own" on public.work_days
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "subscriptions_select_own" on public.subscriptions
  for select using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));

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
    (new.id, 'Sport', 'expense', '🏋️'),
    (new.id, 'Shopping', 'expense', '🛍️'),
    (new.id, 'Voyage', 'expense', '✈️'),
    (new.id, 'Autre', 'expense', '📦');

  insert into public.subscriptions(user_id, plan, status)
  values (new.id, 'free', 'active');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
