-- Private payslip vault with optional automatic salary transaction creation.
-- Safe to run more than once from the Supabase SQL editor.

create table if not exists public.payslips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  salary_transaction_id uuid references public.transactions(id) on delete set null,
  period_year integer not null,
  period_month integer not null,
  employer_name text,
  net_salary numeric(12,2) not null,
  file_path text not null,
  original_filename text not null,
  file_size integer not null,
  page_count integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payslips_period_bounds check (
    period_year between 2000 and 2100
    and period_month between 1 and 12
  ),
  constraint payslips_file_bounds check (
    net_salary > 0 and net_salary <= 1000000000
    and file_size between 1 and 12582912
    and page_count between 1 and 100
    and char_length(original_filename) between 1 and 180
    and char_length(coalesce(employer_name, '')) <= 120
    and file_path = user_id::text || '/' || id::text || '.pdf'
  ),
  constraint payslips_one_per_month unique (user_id, period_year, period_month)
);

create index if not exists idx_payslips_user_period
  on public.payslips(user_id, period_year desc, period_month desc);

alter table public.payslips enable row level security;

drop policy if exists "payslips_select_own" on public.payslips;
drop policy if exists "payslips_insert_own" on public.payslips;
drop policy if exists "payslips_update_own" on public.payslips;
drop policy if exists "payslips_delete_own" on public.payslips;

create policy "payslips_select_own" on public.payslips
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "payslips_insert_own" on public.payslips
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and file_path = (select auth.uid())::text || '/' || id::text || '.pdf'
  );

create policy "payslips_update_own" on public.payslips
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and file_path = (select auth.uid())::text || '/' || id::text || '.pdf'
  );

create policy "payslips_delete_own" on public.payslips
  for delete to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on table public.payslips to authenticated;
revoke all on table public.payslips from anon;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payslips',
  'payslips',
  false,
  12582912,
  array['application/pdf']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "payslips_files_select_own" on storage.objects;
drop policy if exists "payslips_files_insert_own" on storage.objects;
drop policy if exists "payslips_files_update_own" on storage.objects;
drop policy if exists "payslips_files_delete_own" on storage.objects;

create policy "payslips_files_select_own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'payslips'
    and split_part(name, '/', 1) = (select auth.uid())::text
  );

create policy "payslips_files_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'payslips'
    and split_part(name, '/', 1) = (select auth.uid())::text
    and name ~ ('^' || (select auth.uid())::text || '/[0-9a-f-]{36}\\.pdf$')
  );

create policy "payslips_files_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'payslips'
    and split_part(name, '/', 1) = (select auth.uid())::text
  )
  with check (
    bucket_id = 'payslips'
    and split_part(name, '/', 1) = (select auth.uid())::text
  );

create policy "payslips_files_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'payslips'
    and split_part(name, '/', 1) = (select auth.uid())::text
  );

create or replace function public.save_payslip_with_salary(
  p_id uuid,
  p_period_year integer,
  p_period_month integer,
  p_employer_name text,
  p_net_salary numeric,
  p_original_filename text,
  p_file_size integer,
  p_page_count integer,
  p_create_transaction boolean default true
)
returns public.payslips
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_user_id uuid := (select auth.uid());
  salary_category_id uuid;
  created_transaction_id uuid;
  stored_payslip public.payslips;
  clean_employer text := nullif(trim(p_employer_name), '');
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if p_create_transaction then
    select category.id into salary_category_id
    from public.categories category
    where category.user_id = current_user_id
      and category.type = 'income'
      and lower(category.name) = 'salaire'
    order by category.created_at
    limit 1;

    if salary_category_id is null then
      insert into public.categories(user_id, name, type, icon)
      values (current_user_id, 'Salaire', 'income', '💰')
      returning id into salary_category_id;
    end if;

    insert into public.transactions(
      user_id,
      category_id,
      name,
      amount,
      type,
      transaction_date,
      notes
    )
    values (
      current_user_id,
      salary_category_id,
      'Salaire' || case when clean_employer is null then '' else ' · ' || clean_employer end,
      p_net_salary,
      'income',
      (make_date(p_period_year, p_period_month, 1) + interval '1 month - 1 day')::date,
      'Créé automatiquement depuis la fiche de paie'
    )
    returning id into created_transaction_id;
  end if;

  insert into public.payslips(
    id,
    user_id,
    salary_transaction_id,
    period_year,
    period_month,
    employer_name,
    net_salary,
    file_path,
    original_filename,
    file_size,
    page_count
  )
  values (
    p_id,
    current_user_id,
    created_transaction_id,
    p_period_year,
    p_period_month,
    clean_employer,
    p_net_salary,
    current_user_id::text || '/' || p_id::text || '.pdf',
    p_original_filename,
    p_file_size,
    p_page_count
  )
  returning * into stored_payslip;

  return stored_payslip;
end;
$$;

revoke all on function public.save_payslip_with_salary(
  uuid, integer, integer, text, numeric, text, integer, integer, boolean
) from public, anon;
grant execute on function public.save_payslip_with_salary(
  uuid, integer, integer, text, numeric, text, integer, integer, boolean
) to authenticated;

select pg_notification_queue_usage();
notify pgrst, 'reload schema';
