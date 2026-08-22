create or replace function public.materialize_due_recurring_transactions(p_user_id uuid)
returns integer
language plpgsql
security invoker
as $$
declare
  item record;
  inserted_count integer := 0;
  next_date date;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'Not authorized';
  end if;

  for item in
    select *
    from public.recurring_transactions
    where user_id = p_user_id
      and active = true
      and next_execution_date <= current_date
  loop
    insert into public.transactions(
      user_id, category_id, name, amount, type, transaction_date
    )
    values(
      item.user_id,
      item.category_id,
      item.name,
      item.amount,
      item.type,
      item.next_execution_date
    );

    if item.frequency = 'weekly' then
      next_date := item.next_execution_date + interval '7 days';
    elsif item.frequency = 'monthly' then
      next_date := item.next_execution_date + interval '1 month';
    else
      next_date := item.next_execution_date + interval '1 year';
    end if;

    update public.recurring_transactions
      set next_execution_date = next_date
      where id = item.id;

    inserted_count := inserted_count + 1;
  end loop;

  return inserted_count;
end;
$$;
