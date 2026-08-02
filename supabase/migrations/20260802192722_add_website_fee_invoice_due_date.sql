alter table public.website_fee_invoices
add column due_date date;

-- The normal run issues on the first and is due on the tenth of that month.
-- If a recovery run issues after the tenth, use the next month's tenth so an
-- invoice is never born overdue.
update public.website_fee_invoices
set due_date = case
    when extract(day from issued_at at time zone 'America/Toronto') <= 10
        then (date_trunc('month', issued_at at time zone 'America/Toronto') + interval '9 days')::date
    else (date_trunc('month', issued_at at time zone 'America/Toronto') + interval '1 month 9 days')::date
end
where issued_at is not null;

-- Draft rows are not expected to survive issuance, but keeping the column
-- nullable until status becomes issued makes the lifecycle explicit.
alter table public.website_fee_invoices
add constraint website_fee_invoices_due_date_check check (
    (issued_at is null and due_date is null)
    or (
        issued_at is not null
        and due_date is not null
        and due_date >= (issued_at at time zone 'America/Toronto')::date
    )
);

create or replace function public.issue_website_fee_invoice(
    p_billing_month date,
    p_notes text default null,
    p_issued_by uuid default auth.uid()
) returns uuid
language plpgsql
set search_path to 'pg_catalog'
as $$
declare
  v_id uuid := gen_random_uuid();
  v_period_end date;
  v_current_month date;
  v_line_count integer;
  v_booking_count integer;
  v_net numeric(12, 2);
  v_fee numeric(12, 2);
  v_issued_at timestamptz := now();
  v_issued_local_date date;
  v_due_date date;
begin
  if p_billing_month is null
    or p_billing_month <> date_trunc('month', p_billing_month::timestamp)::date
  then
    raise exception 'Billing month must be the first day of a month.';
  end if;

  v_period_end := (p_billing_month + interval '1 month')::date;
  v_current_month := date_trunc('month', current_timestamp at time zone 'America/Toronto')::date;
  v_issued_local_date := (v_issued_at at time zone 'America/Toronto')::date;
  v_due_date := case
    when extract(day from v_issued_local_date) <= 10
      then (date_trunc('month', v_issued_local_date::timestamp) + interval '9 days')::date
    else (date_trunc('month', v_issued_local_date::timestamp) + interval '1 month 9 days')::date
  end;

  if v_period_end > v_current_month then
    raise exception 'Billing month % is not closed.', p_billing_month;
  end if;

  perform pg_advisory_xact_lock(hashtextextended('website_fee_invoice_issuance', 0));

  if exists (
    select 1 from public.website_fee_invoices
    where billing_month = p_billing_month and status <> 'void'
  ) then
    raise exception 'An active invoice already exists for %.', p_billing_month;
  end if;

  if exists (select 1 from public.website_fee_payment_exceptions)
    or exists (select 1 from public.website_fee_invoice_source_drift)
  then
    raise exception 'Website fee checks do not pass.';
  end if;

  insert into public.website_fee_invoices (
    id, invoice_number, billing_month, period_start, period_end,
    status, fee_rate_percent, issued_by, notes
  ) values (
    v_id,
    'VEE-WEB-' || to_char(p_billing_month, 'YYYYMM') || '-' || upper(left(replace(v_id::text, '-', ''), 8)),
    p_billing_month,
    p_billing_month,
    v_period_end,
    'draft',
    3.0000,
    p_issued_by,
    nullif(btrim(p_notes), '')
  );

  insert into public.website_fee_invoice_lines (
    invoice_id, source_payment_id, booking_id, source_billing_month,
    booking_reference_snapshot, paid_at_snapshot, payment_type_snapshot,
    payment_method_snapshot, payment_status_snapshot, recorded_amount_snapshot,
    eligible_net_amount_snapshot, fee_rate_percent_snapshot
  )
  select
    v_id, d.payment_id, d.booking_id, d.billing_month,
    d.booking_reference, d.paid_at, d.payment_type::text,
    d.method::text, d.status::text, d.recorded_amount,
    d.eligible_net_amount, 3.0000
  from public.website_fee_payment_details d
  where d.paid_at < (v_period_end::timestamp at time zone 'America/Toronto')
    and not exists (
      select 1
      from public.website_fee_invoice_lines l
      join public.website_fee_invoices i on i.id = l.invoice_id
      where l.source_payment_id = d.payment_id and i.status <> 'void'
    )
  order by d.paid_at, d.payment_id;

  select
    count(*)::integer,
    count(distinct booking_id)::integer,
    coalesce(round(sum(eligible_net_amount_snapshot), 2), 0),
    coalesce(round(sum(eligible_net_amount_snapshot) * 0.03, 2), 0)
  into v_line_count, v_booking_count, v_net, v_fee
  from public.website_fee_invoice_lines
  where invoice_id = v_id;

  if v_line_count = 0 then
    raise exception 'There are no eligible uninvoiced payments for %.', p_billing_month;
  end if;

  update public.website_fee_invoices
  set eligible_net_revenue = v_net,
      fee_total = v_fee,
      source_line_count = v_line_count,
      booking_count = v_booking_count,
      status = 'issued',
      issued_at = v_issued_at,
      due_date = v_due_date
  where id = v_id and status = 'draft';

  return v_id;
end
$$;

create or replace function public.protect_website_fee_invoice() returns trigger
language plpgsql
set search_path to 'pg_catalog'
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'Website fee invoices cannot be deleted. Void the invoice instead.';
  end if;

  if old.status = 'void' then
    raise exception 'A void invoice cannot be changed.';
  end if;

  if old.status = 'draft' and new.status not in ('draft', 'issued', 'void') then
    raise exception 'Invalid invoice transition from draft to %.', new.status;
  elsif old.status = 'issued' and new.status not in ('issued', 'paid', 'void') then
    raise exception 'Invalid invoice transition from issued to %.', new.status;
  elsif old.status = 'paid' and new.status not in ('paid', 'void') then
    raise exception 'Invalid invoice transition from paid to %.', new.status;
  end if;

  if old.status <> 'draft' and (
    new.invoice_number is distinct from old.invoice_number
    or new.billing_month is distinct from old.billing_month
    or new.period_start is distinct from old.period_start
    or new.period_end is distinct from old.period_end
    or new.currency is distinct from old.currency
    or new.eligible_net_revenue is distinct from old.eligible_net_revenue
    or new.fee_rate_percent is distinct from old.fee_rate_percent
    or new.fee_total is distinct from old.fee_total
    or new.source_line_count is distinct from old.source_line_count
    or new.booking_count is distinct from old.booking_count
    or new.issued_at is distinct from old.issued_at
    or new.due_date is distinct from old.due_date
    or new.issued_by is distinct from old.issued_by
  ) then
    raise exception 'Issued invoice financial fields are immutable.';
  end if;

  new.updated_at := now();
  return new;
end
$$;

create or replace view public.website_fee_invoice_register
with (security_invoker = true)
as
select
  i.id,
  i.invoice_number,
  i.billing_month,
  i.period_start,
  i.period_end,
  i.status,
  i.currency,
  i.eligible_net_revenue,
  i.fee_rate_percent,
  i.fee_total,
  i.source_line_count,
  i.booking_count,
  i.issued_at,
  i.issued_by,
  i.paid_at,
  i.voided_at,
  i.void_reason,
  i.notes,
  i.created_at,
  i.updated_at,
  count(l.id)::integer as actual_line_count,
  count(distinct l.booking_id)::integer as actual_booking_count,
  coalesce(round(sum(l.eligible_net_amount_snapshot), 2), 0) as line_net_revenue,
  coalesce(round(sum(l.eligible_net_amount_snapshot) * i.fee_rate_percent / 100, 2), 0) as recalculated_fee_total,
  round(i.fee_total - coalesce(round(sum(l.eligible_net_amount_snapshot) * i.fee_rate_percent / 100, 2), 0), 2) as fee_difference,
  i.due_date
from public.website_fee_invoices i
left join public.website_fee_invoice_lines l on l.invoice_id = i.id
group by i.id;
