-- Private profile personalization and avatar storage.
-- Safe to run more than once from the Supabase SQL editor.

alter table public.profiles
  add column if not exists birth_year integer,
  add column if not exists household_size integer not null default 1,
  add column if not exists employment_status text,
  add column if not exists skills text,
  add column if not exists grocery_budget_weekly numeric(10,2),
  add column if not exists avatar_path text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_personalization_bounds'
  ) then
    alter table public.profiles
      add constraint profiles_personalization_bounds check (
        (birth_year is null or birth_year between 1900 and 2100)
        and household_size between 1 and 12
        and (
          employment_status is null
          or employment_status in ('employee', 'self_employed', 'student', 'job_seeker', 'retired', 'other')
        )
        and char_length(coalesce(skills, '')) <= 400
        and (grocery_budget_weekly is null or grocery_budget_weekly between 0 and 10000)
        and (
          avatar_path is null
          or avatar_path = id::text || '/avatar'
        )
      ) not valid;
  end if;
end
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  false,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "avatars_select_own" on storage.objects;
drop policy if exists "avatars_insert_own" on storage.objects;
drop policy if exists "avatars_update_own" on storage.objects;
drop policy if exists "avatars_delete_own" on storage.objects;

create policy "avatars_select_own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'avatars'
    and name = (select auth.uid())::text || '/avatar'
  );

create policy "avatars_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and name = (select auth.uid())::text || '/avatar'
  );

create policy "avatars_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and name = (select auth.uid())::text || '/avatar'
  )
  with check (
    bucket_id = 'avatars'
    and name = (select auth.uid())::text || '/avatar'
  );

create policy "avatars_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and name = (select auth.uid())::text || '/avatar'
  );
