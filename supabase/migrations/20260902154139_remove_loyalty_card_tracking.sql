drop table if exists public.loyalty_card_events;
drop table if exists public.loyalty_cards;
drop type if exists public.loyalty_event_type;

comment on column public.bookings.is_loyalty_reward is
  'True when an admin completes an appointment free as a loyalty courtesy. No loyalty card balance or eligibility is tracked.';
