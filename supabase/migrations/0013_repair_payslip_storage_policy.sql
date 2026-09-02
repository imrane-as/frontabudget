-- Repair the private payslip upload policy created by migration 0012.
-- Safe to run more than once from the Supabase SQL editor.

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

drop policy if exists "payslips_files_insert_own" on storage.objects;

create policy "payslips_files_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'payslips'
    and split_part(name, '/', 1) = (select auth.uid())::text
    and name ~ ('^' || (select auth.uid())::text || '/[0-9a-f-]{36}[.]pdf$')
  );

select pg_notification_queue_usage();
notify pgrst, 'reload schema';
