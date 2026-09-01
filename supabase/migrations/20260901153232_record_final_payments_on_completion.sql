-- Record the missing balance for historical completed appointments. These
-- bookings were closed by the application without creating a payment ledger
-- entry. Their stored amount_due is the balance that was outstanding at the
-- recorded completion time.
insert into public.booking_payments (
  booking_id,
  user_id,
  payment_type,
  method,
  amount,
  status,
  paid_at,
  notes
)
select
  b.id,
  b.user_id,
  'final_payment'::public.payment_type,
  'other'::public.payment_method,
  b.amount_due,
  'received'::public.payment_status,
  coalesce(b.completed_at, b.updated_at),
  'Historical final payment backfilled from the completed booking balance.'
from public.bookings b
where b.status = 'completed'
  and b.amount_due > 0
  and not exists (
    select 1
    from public.booking_payments p
    where p.booking_id = b.id
      and p.payment_type = 'final_payment'
      and p.status in ('received', 'completed')
  );

create or replace function private.prevent_unsettled_booking_completion()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_applied numeric(10,2);
begin
  if new.status <> 'completed' or old.status = 'completed' then
    return new;
  end if;

  select coalesce(sum(
    case
      when p.payment_type in ('deposit', 'final_payment', 'credit')
        and p.status in ('received', 'completed', 'credited') then p.amount
      when p.payment_type = 'refund'
        and p.status in ('refunded', 'completed') then -p.amount
      else 0
    end
  ), 0)::numeric(10,2)
  into v_applied
  from public.booking_payments p
  where p.booking_id = new.id;

  if v_applied <> new.final_total then
    raise exception 'A completed appointment must have payments matching its final total.';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_unsettled_booking_completion on public.bookings;
create trigger prevent_unsettled_booking_completion
before update of status on public.bookings
for each row
execute function private.prevent_unsettled_booking_completion();

create or replace function public.complete_booking_with_payment(
  p_booking_id uuid,
  p_total_charged numeric,
  p_payment_method public.payment_method,
  p_marked_by uuid
)
returns table (
  appointment_total numeric,
  prior_applied numeric,
  final_payment_amount numeric,
  completed_at timestamptz
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_booking public.bookings%rowtype;
  v_prior_applied numeric(10,2);
  v_final_payment numeric(10,2);
  v_completed_at timestamptz := now();
begin
  if p_total_charged is null
    or p_total_charged <= 0
    or p_total_charged > 99999999.99
    or p_total_charged <> round(p_total_charged, 2) then
    raise exception 'Enter a valid total charged with no more than two decimal places.';
  end if;

  if p_payment_method not in ('etransfer', 'cash', 'other') then
    raise exception 'Choose a valid final payment method.';
  end if;

  select b.*
  into v_booking
  from public.bookings b
  where b.id = p_booking_id
  for update;

  if not found then
    raise exception 'Booking not found.';
  end if;

  if v_booking.status <> 'confirmed' then
    raise exception 'Only a confirmed appointment can be completed.';
  end if;

  select coalesce(sum(
    case
      when p.payment_type in ('deposit', 'final_payment', 'credit')
        and p.status in ('received', 'completed', 'credited') then p.amount
      when p.payment_type = 'refund'
        and p.status in ('refunded', 'completed') then -p.amount
      else 0
    end
  ), 0)::numeric(10,2)
  into v_prior_applied
  from public.booking_payments p
  where p.booking_id = p_booking_id;

  v_final_payment := round(p_total_charged - v_prior_applied, 2);

  if v_final_payment < 0 then
    raise exception 'The total charged cannot be less than payments and credits already applied.';
  end if;

  if v_final_payment > 0 then
    insert into public.booking_payments (
      booking_id,
      user_id,
      payment_type,
      method,
      amount,
      status,
      marked_by,
      paid_at,
      notes
    ) values (
      v_booking.id,
      v_booking.user_id,
      'final_payment',
      p_payment_method,
      v_final_payment,
      'received',
      p_marked_by,
      v_completed_at,
      'Final payment recorded when the appointment was completed.'
    );
  end if;

  update public.bookings
  set
    status = 'completed',
    completed_at = v_completed_at,
    final_total = p_total_charged,
    amount_paid = p_total_charged,
    amount_due = 0,
    updated_at = v_completed_at
  where id = v_booking.id;

  return query select
    p_total_charged::numeric,
    v_prior_applied::numeric,
    v_final_payment::numeric,
    v_completed_at;
end;
$$;

revoke all on function public.complete_booking_with_payment(uuid, numeric, public.payment_method, uuid) from public, anon, authenticated;
grant execute on function public.complete_booking_with_payment(uuid, numeric, public.payment_method, uuid) to service_role;

comment on function public.complete_booking_with_payment(uuid, numeric, public.payment_method, uuid)
is 'Atomically records the remaining final payment and completes a confirmed booking. Service role only.';
