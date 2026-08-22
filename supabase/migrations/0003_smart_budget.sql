alter table public.profiles
  add column if not exists weather_city text not null default 'Metz',
  add column if not exists budget_alert_threshold integer not null default 80,
  add column if not exists whatsapp_phone text,
  add column if not exists whatsapp_enabled boolean not null default false,
  add column if not exists weekly_summary_enabled boolean not null default true;

create table if not exists public.ai_daily_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null default current_date,
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, usage_date)
);

create table if not exists public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_key text not null,
  channel text not null default 'whatsapp',
  provider_message_id text,
  status text not null default 'sent',
  created_at timestamptz not null default now(),
  unique (user_id, event_key, channel)
);

create index if not exists idx_notification_deliveries_user_date
  on public.notification_deliveries(user_id, created_at desc);

alter table public.ai_daily_usage enable row level security;
alter table public.notification_deliveries enable row level security;

create policy "ai_daily_usage_all_own" on public.ai_daily_usage
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "notification_deliveries_select_own" on public.notification_deliveries
  for select using (auth.uid() = user_id);

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
