create type public.cancellation_deposit_outcome as enum (
  'not_received',
  'refund',
  'account_credit',
  'forfeited'
);

create type public.refund_status as enum (
  'not_required',
  'pending',
  'completed',
  'failed'
);

create type public.loyalty_event_type as enum ('stamp', 'reward_redeemed');

alter table public.bookings
  add column is_loyalty_reward boolean not null default false;

create table public.booking_cancellations (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete restrict,
  reason text not null check (length(btrim(reason)) >= 4),
  internal_note text,
  deposit_outcome public.cancellation_deposit_outcome not null,
  refund_status public.refund_status not null default 'not_required',
  final_payment_status public.payment_status,
  deposit_amount numeric(10,2) not null default 0 check (deposit_amount >= 0),
  refund_payment_id uuid references public.booking_payments(id) on delete restrict,
  cancelled_by uuid references auth.users(id) on delete set null,
  cancelled_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint booking_cancellations_refund_consistency check (
    (deposit_outcome = 'refund' and refund_status <> 'not_required')
    or (deposit_outcome <> 'refund' and refund_status = 'not_required')
  )
);

create index booking_cancellations_cancelled_at_idx
  on public.booking_cancellations (cancelled_at desc);

create table public.loyalty_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  stamps_required smallint not null default 6 check (stamps_required between 1 and 24),
  active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.loyalty_card_events (
  id uuid primary key default gen_random_uuid(),
  loyalty_card_id uuid not null references public.loyalty_cards(id) on delete cascade,
  booking_id uuid not null references public.bookings(id) on delete restrict,
  event_type public.loyalty_event_type not null,
  stamped_by uuid references auth.users(id) on delete set null,
  note text,
  created_at timestamptz not null default now(),
  unique (booking_id),
  constraint loyalty_card_events_note_length check (
    note is null or length(note) <= 500
  )
);

create index loyalty_card_events_card_created_idx
  on public.loyalty_card_events (loyalty_card_id, created_at desc);

alter table public.booking_cancellations enable row level security;
alter table public.loyalty_cards enable row level security;
alter table public.loyalty_card_events enable row level security;

create policy "Admins can manage booking cancellations"
  on public.booking_cancellations
  for all to authenticated
  using ((select private.is_app_admin()))
  with check ((select private.is_app_admin()));

create policy "Admins can manage loyalty cards"
  on public.loyalty_cards
  for all to authenticated
  using ((select private.is_app_admin()))
  with check ((select private.is_app_admin()));

create policy "Admins can manage loyalty card events"
  on public.loyalty_card_events
  for all to authenticated
  using ((select private.is_app_admin()))
  with check ((select private.is_app_admin()));

grant select, insert, update, delete on public.booking_cancellations to authenticated;
grant select, insert, update, delete on public.loyalty_cards to authenticated;
grant select, insert, update, delete on public.loyalty_card_events to authenticated;
grant all on public.booking_cancellations to service_role;
grant all on public.loyalty_cards to service_role;
grant all on public.loyalty_card_events to service_role;

create or replace function private.recalculate_booking_totals(target_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = 'public', 'private'
as $$
declare
  v_subtotal numeric(10,2);
  v_booking_fee numeric(10,2);
  v_estimated_total numeric(10,2);
  v_amount_paid numeric(10,2);
  v_amount_due numeric(10,2);
  v_fee_rate numeric(5,4);
  v_fee_mode public.fee_mode;
  v_final_total numeric(10,2);
  v_is_loyalty_reward boolean;
begin
  select b.booking_fee_rate, b.booking_fee_mode, b.final_total, b.is_loyalty_reward
  into v_fee_rate, v_fee_mode, v_final_total, v_is_loyalty_reward
  from public.bookings b
  where b.id = target_booking_id;

  if not found then return; end if;

  select coalesce(sum(bli.line_total), 0)::numeric(10,2)
  into v_subtotal
  from public.booking_line_items bli
  where bli.booking_id = target_booking_id
    and bli.active = true
    and bli.removed_at is null;

  v_booking_fee := case
    when v_is_loyalty_reward then 0
    when v_fee_mode = 'added_on_top' then round(v_subtotal * v_fee_rate, 2)
    else 0
  end;

  v_estimated_total := case
    when v_is_loyalty_reward then 0
    when v_fee_mode = 'added_on_top' then round(v_subtotal + v_booking_fee, 2)
    else v_subtotal
  end;

  select coalesce(sum(case
    when bp.payment_type in ('deposit', 'final_payment', 'credit')
      and bp.status in ('received', 'completed', 'credited') then bp.amount
    when bp.payment_type = 'refund'
      and bp.status in ('refunded', 'completed') then -bp.amount
    else 0 end), 0)::numeric(10,2)
  into v_amount_paid
  from public.booking_payments bp
  where bp.booking_id = target_booking_id;

  v_amount_due := greatest(case
    when v_is_loyalty_reward then 0
    when coalesce(v_final_total, 0) > 0 then v_final_total
    else v_estimated_total
  end - v_amount_paid, 0)::numeric(10,2);

  update public.bookings set
    subtotal_amount = case when v_is_loyalty_reward then 0 else v_subtotal end,
    booking_fee_amount = v_booking_fee,
    estimated_total = v_estimated_total,
    final_total = case when v_is_loyalty_reward then 0 else final_total end,
    amount_paid = v_amount_paid,
    amount_due = v_amount_due,
    updated_at = now()
  where id = target_booking_id;
end;
$$;

comment on table public.booking_cancellations is
  'One auditable admin cancellation outcome per booking, including deposit refund and final-payment state.';
comment on table public.loyalty_card_events is
  'Append-only loyalty stamp and reward-redemption ledger. Each appointment can affect loyalty once.';
comment on column public.bookings.is_loyalty_reward is
  'True when an appointment is redeemed as the free loyalty set and intentionally totals $0.00.';
