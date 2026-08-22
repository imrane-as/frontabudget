alter table public.profiles
  add column if not exists weather_city text not null default 'Metz',
  add column if not exists budget_alert_threshold integer not null default 80,
  add column if not exists monthly_savings_target numeric(12,2) not null default 300;

create table if not exists public.ai_daily_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null default current_date,
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, usage_date)
);

alter table public.ai_daily_usage enable row level security;

create policy "ai_daily_usage_all_own" on public.ai_daily_usage
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.consume_ai_quota(
  p_user_id uuid,
  p_daily_limit integer default 3
)
returns boolean
language plpgsql
security invoker
as $$
declare
  next_count integer;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'Not authorized';
  end if;

  insert into public.ai_daily_usage(user_id, usage_date, request_count)
  values (p_user_id, current_date, 1)
  on conflict (user_id, usage_date)
  do update set
    request_count = public.ai_daily_usage.request_count + 1,
    updated_at = now()
  where public.ai_daily_usage.request_count < p_daily_limit
  returning request_count into next_count;

  return next_count is not null and next_count <= p_daily_limit;
end;
$$;
