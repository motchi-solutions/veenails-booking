-- All courtesy ledger changes and the completion commit together. Retrying a
-- completed appointment is rejected under its row lock, preventing duplicates.
create or replace function public.complete_booking_with_courtesy(
  p_booking_id uuid,
  p_mode text,
  p_base_total numeric,
  p_percentage numeric,
  p_payment_method public.payment_method,
  p_refund_method public.payment_method,
  p_refund_confirmed boolean,
  p_marked_by uuid
)
returns table (appointment_total numeric, prior_applied numeric, final_payment_amount numeric, completed_at timestamptz)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  b public.bookings%rowtype;
  v_cash numeric(10,2);
  v_credit numeric(10,2);
  v_discount numeric(10,2);
  v_total numeric(10,2);
  v_now timestamptz := now();
begin
  if p_mode is null or p_mode not in ('free', 'discount') then
    raise exception 'Choose a valid loyalty courtesy.';
  end if;
  if not exists (select 1 from public.admin_users a where a.user_id = p_marked_by and a.active) then
    raise exception 'An active admin must complete this appointment.';
  end if;
  select * into b from public.bookings where id = p_booking_id for update;
  if not found or b.status <> 'confirmed' then
    raise exception 'Only a confirmed appointment can be completed.';
  end if;
  if not exists (select 1 from public.availability_slots s where s.id = b.slot_id and s.starts_at <= v_now) then
    raise exception 'This appointment cannot be completed before it starts.';
  end if;
  if exists (select 1 from public.booking_payments p where p.booking_id = b.id and p.status in ('pending', 'marked_sent')) then
    raise exception 'Resolve pending payments before completing the appointment.';
  end if;

  select coalesce(sum(case
    when p.payment_type in ('deposit', 'final_payment') and p.status in ('received', 'completed') then p.amount
    when p.payment_type = 'refund' and p.method <> 'account_credit' and p.status in ('refunded', 'completed') then -p.amount
    else 0 end), 0),
    coalesce(sum(case
    when p.payment_type = 'credit' and p.status in ('credited', 'completed', 'received') then p.amount
    when p.payment_type = 'refund' and p.method = 'account_credit' and p.status in ('refunded', 'completed') then -p.amount
    else 0 end), 0)
  into v_cash, v_credit from public.booking_payments p where p.booking_id = b.id;
  if v_cash < 0 or v_credit < 0 then
    raise exception 'Resolve the payment/refund discrepancy before completing.';
  end if;

  if p_mode = 'discount' then
    if p_base_total is null or p_base_total <= 0 or p_base_total > 99999999.99
       or p_base_total <> round(p_base_total, 2)
       or p_percentage is null or p_percentage <= 0 or p_percentage >= 100
       or p_percentage <> round(p_percentage, 2) then
      raise exception 'Enter a valid price and loyalty percentage with at most two decimal places.';
    end if;
    v_discount := round(p_base_total * p_percentage / 100, 2);
    v_total := p_base_total - v_discount;
    if v_total <= 0 or v_discount <= 0 then
      raise exception 'Use a free loyalty courtesy for a zero total.';
    end if;
    if v_total < v_cash + v_credit then
      raise exception 'The discounted total is below payments already applied. Resolve the overpayment first.';
    end if;
    insert into public.booking_line_items (booking_id, item_type, label_snapshot, description_snapshot, quantity, unit_price, active, added_by)
    values (b.id, 'discount', 'Loyalty courtesy (' || p_percentage || '%)', 'Additional loyalty discount at completion', 1, -v_discount, true, p_marked_by);
    return query select * from public.complete_booking_with_payment(b.id, v_total, p_payment_method, p_marked_by);
  else
    if v_cash > 0 and (p_refund_confirmed is distinct from true or p_refund_method is null or p_refund_method not in ('cash', 'etransfer', 'other')) then
      raise exception 'Confirm that the existing cash payments have been returned and select the refund method.';
    end if;
    if v_credit > 0 and b.user_id is null then
      raise exception 'Account credit cannot be returned without a client account.';
    end if;
    if v_cash > 0 then
      insert into public.booking_payments (booking_id, user_id, payment_type, method, amount, status, paid_at, marked_by, notes)
      values (b.id, b.user_id, 'refund', p_refund_method, v_cash, 'refunded', v_now, p_marked_by, 'Loyalty courtesy · refund confirmed by admin');
    end if;
    if v_credit > 0 then
      insert into public.user_credits (user_id, amount, source_booking_id, reason)
      values (b.user_id, v_credit, b.id, 'Account credit returned for free loyalty courtesy');
      insert into public.booking_payments (booking_id, user_id, payment_type, method, amount, status, paid_at, marked_by, notes)
      values (b.id, b.user_id, 'refund', 'account_credit', v_credit, 'refunded', v_now, p_marked_by, 'Loyalty courtesy · account credit returned');
    end if;
    insert into public.booking_payments (booking_id, user_id, payment_type, method, amount, status, paid_at, marked_by, notes)
    values (b.id, b.user_id, 'final_payment', 'other', 0, 'completed', v_now, p_marked_by, 'Loyalty courtesy · complimentary appointment');
    update public.bookings set is_loyalty_reward = true, status = 'completed', final_total = 0,
      amount_paid = 0, amount_due = 0, completed_at = v_now,
      deposit_status = case when v_cash > 0 then 'refunded'::public.deposit_status else deposit_status end
    where id = b.id;
    return query select 0::numeric, 0::numeric, 0::numeric, v_now;
  end if;
  insert into public.booking_events (booking_id, actor_type, actor_user_id, event_type, message, metadata)
  values (b.id, 'admin', p_marked_by, 'loyalty_courtesy_applied',
    case when p_mode = 'free' then 'Admin completed this appointment free as a loyalty courtesy.' else 'Admin applied a loyalty percentage discount and completed this appointment.' end,
    jsonb_build_object('adjustment', p_mode, 'percentage', p_percentage, 'amount', v_discount,
      'baseTotal', p_base_total, 'finalTotal', case when p_mode = 'free' then 0 else v_total end,
      'previousPaymentsRefunded', case when p_mode = 'free' then v_cash else 0 end,
      'accountCreditReturned', case when p_mode = 'free' then v_credit else 0 end));
end;
$$;
revoke all on function public.complete_booking_with_courtesy(uuid, text, numeric, numeric, public.payment_method, public.payment_method, boolean, uuid) from public, anon, authenticated;
grant execute on function public.complete_booking_with_courtesy(uuid, text, numeric, numeric, public.payment_method, public.payment_method, boolean, uuid) to service_role;

-- Returning account credit reverses a credit, not cash revenue.
CREATE OR REPLACE VIEW "public"."website_fee_payment_details" WITH ("security_invoker"='true') AS
 SELECT "p"."id" AS "payment_id",
    "p"."booking_id",
    "b"."booking_reference",
    "p"."paid_at",
    ("date_trunc"('month'::"text", ("p"."paid_at" AT TIME ZONE 'America/Toronto'::"text")))::"date" AS "billing_month",
    "p"."payment_type",
    "p"."method",
    "p"."status",
    "p"."amount" AS "recorded_amount",
        CASE
            WHEN (("p"."payment_type" = ANY (ARRAY['deposit'::"public"."payment_type", 'final_payment'::"public"."payment_type"])) AND ("p"."status" = ANY (ARRAY['received'::"public"."payment_status", 'completed'::"public"."payment_status"]))) THEN "p"."amount"
            WHEN (("p"."payment_type" = 'refund'::"public"."payment_type") AND ("p"."status" = ANY (ARRAY['refunded'::"public"."payment_status", 'completed'::"public"."payment_status"]))) THEN (- "p"."amount")
            ELSE (0)::numeric
        END AS "eligible_net_amount",
    3.00 AS "fee_rate_percent"
   FROM ("public"."booking_payments" "p"
     JOIN "public"."bookings" "b" ON (("b"."id" = "p"."booking_id")))
  WHERE (("p"."paid_at" >= '2026-08-01 04:00:00+00'::timestamp with time zone) AND ((("p"."payment_type" = ANY (ARRAY['deposit'::"public"."payment_type", 'final_payment'::"public"."payment_type"])) AND ("p"."status" = ANY (ARRAY['received'::"public"."payment_status", 'completed'::"public"."payment_status"]))) OR (("p"."payment_type" = 'refund'::"public"."payment_type") AND ("p"."status" = ANY (ARRAY['refunded'::"public"."payment_status", 'completed'::"public"."payment_status"])))))
  AND "p"."amount" > 0
  AND NOT ("p"."payment_type" = 'refund' AND "p"."method" = 'account_credit');
