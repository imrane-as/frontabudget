-- Allow a bounded number of AI fallbacks for unknown transaction labels.
-- Known merchants are categorized locally and never consume this quota.

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

notify pgrst, 'reload schema';
