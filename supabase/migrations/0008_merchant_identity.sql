-- Persist verified merchant identities and add a dedicated credit category.
-- Safe to run more than once on manually managed Supabase projects.

alter table public.transactions
  add column if not exists merchant_name text,
  add column if not exists merchant_domain text,
  add column if not exists categorization_source text,
  add column if not exists categorization_url text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'transactions_merchant_metadata_bounds'
  ) then
    alter table public.transactions
      add constraint transactions_merchant_metadata_bounds check (
        char_length(coalesce(merchant_name, '')) <= 80
        and (
          merchant_domain is null
          or (
            char_length(merchant_domain) between 3 and 253
            and position('.' in merchant_domain) > 0
            and merchant_domain ~ '^[a-z0-9][a-z0-9.-]*[a-z0-9]$'
          )
        )
        and (
          categorization_source is null
          or categorization_source in ('local', 'ai', 'fallback')
        )
        and char_length(coalesce(categorization_url, '')) <= 500
        and (
          categorization_url is null
          or categorization_url like 'https://%'
        )
      ) not valid;
  end if;
end
$$;

insert into public.categories(user_id, name, type, icon)
select user_account.id, 'Crédit', 'expense', '🏦'
from auth.users user_account
where not exists (
  select 1
  from public.categories category
  where category.user_id = user_account.id
    and category.type = 'expense'
    and lower(category.name) = lower('Crédit')
);

create or replace function public.handle_new_user_credit_category()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.categories(user_id, name, type, icon)
  select new.id, 'Crédit', 'expense', '🏦'
  where not exists (
    select 1
    from public.categories category
    where category.user_id = new.id
      and category.type = 'expense'
      and lower(category.name) = lower('Crédit')
  );

  return new;
end;
$$;

revoke all on function public.handle_new_user_credit_category()
  from public, anon, authenticated;

drop trigger if exists on_auth_user_created_credit_category on auth.users;
create trigger on_auth_user_created_credit_category
  after insert on auth.users
  for each row execute procedure public.handle_new_user_credit_category();

notify pgrst, 'reload schema';
