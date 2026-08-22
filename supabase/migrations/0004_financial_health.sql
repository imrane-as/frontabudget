drop table if exists public.notification_deliveries;

alter table public.profiles
  drop column if exists whatsapp_phone,
  drop column if exists whatsapp_enabled,
  drop column if exists weekly_summary_enabled;

alter table public.profiles
  add column if not exists monthly_savings_target numeric(12,2) not null default 300;
