--
-- PostgreSQL database dump
--

-- \restrict BL0n2zNyaZKUTfoCpfS4nQ8fhoJKjdeIF646awNNGavMuFpwjZ8BLiUMc7vqr4G

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
-- SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: private; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA IF NOT EXISTS "private";


ALTER SCHEMA "private" OWNER TO "postgres";

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";

--
-- Name: SCHEMA "public"; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA "public" IS 'standard public schema';


--
-- Name: app_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."app_role" AS ENUM (
    'owner',
    'admin'
);


ALTER TYPE "public"."app_role" OWNER TO "postgres";

--
-- Name: booking_actor_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."booking_actor_type" AS ENUM (
    'client',
    'admin',
    'system'
);


ALTER TYPE "public"."booking_actor_type" OWNER TO "postgres";

--
-- Name: booking_inspo_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."booking_inspo_status" AS ENUM (
    'pending',
    'sent',
    'reviewed'
);


ALTER TYPE "public"."booking_inspo_status" OWNER TO "postgres";

--
-- Name: booking_line_item_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."booking_line_item_type" AS ENUM (
    'service',
    'design_tier',
    'removal',
    'addon',
    'adjustment',
    'discount',
    'fee'
);


ALTER TYPE "public"."booking_line_item_type" OWNER TO "postgres";

--
-- Name: booking_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."booking_status" AS ENUM (
    'held',
    'requested',
    'confirmed',
    'cancellation_requested',
    'cancelled',
    'rejected',
    'completed',
    'no_show',
    'expired'
);


ALTER TYPE "public"."booking_status" OWNER TO "postgres";

--
-- Name: cancellation_request_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."cancellation_request_status" AS ENUM (
    'pending',
    'approved',
    'rejected',
    'resolved'
);


ALTER TYPE "public"."cancellation_request_status" OWNER TO "postgres";

--
-- Name: deal_redemption_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."deal_redemption_status" AS ENUM (
    'claimed',
    'applied',
    'expired',
    'cancelled'
);


ALTER TYPE "public"."deal_redemption_status" OWNER TO "postgres";

--
-- Name: deposit_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."deposit_status" AS ENUM (
    'pending',
    'marked_sent',
    'received',
    'rejected',
    'refunded',
    'credited',
    'forfeited'
);


ALTER TYPE "public"."deposit_status" OWNER TO "postgres";

--
-- Name: discount_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."discount_type" AS ENUM (
    'fixed_amount',
    'percentage',
    'custom'
);


ALTER TYPE "public"."discount_type" OWNER TO "postgres";

--
-- Name: fee_mode; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."fee_mode" AS ENUM (
    'added_on_top',
    'included_in_price'
);


ALTER TYPE "public"."fee_mode" OWNER TO "postgres";

--
-- Name: notification_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."notification_status" AS ENUM (
    'pending',
    'sent',
    'failed',
    'skipped'
);


ALTER TYPE "public"."notification_status" OWNER TO "postgres";

--
-- Name: payment_method; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."payment_method" AS ENUM (
    'etransfer',
    'cash',
    'account_credit',
    'other'
);


ALTER TYPE "public"."payment_method" OWNER TO "postgres";

--
-- Name: payment_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."payment_status" AS ENUM (
    'pending',
    'marked_sent',
    'received',
    'rejected',
    'refunded',
    'credited',
    'forfeited',
    'completed',
    'failed'
);


ALTER TYPE "public"."payment_status" OWNER TO "postgres";

--
-- Name: payment_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."payment_type" AS ENUM (
    'deposit',
    'final_payment',
    'refund',
    'credit',
    'forfeit'
);


ALTER TYPE "public"."payment_type" OWNER TO "postgres";

--
-- Name: preferred_contact_method; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."preferred_contact_method" AS ENUM (
    'email',
    'phone',
    'instagram'
);


ALTER TYPE "public"."preferred_contact_method" OWNER TO "postgres";

--
-- Name: refund_method; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."refund_method" AS ENUM (
    'no_refund',
    'refund_etransfer',
    'account_credit'
);


ALTER TYPE "public"."refund_method" OWNER TO "postgres";

--
-- Name: slot_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."slot_status" AS ENUM (
    'available',
    'blocked',
    'held',
    'requested',
    'confirmed',
    'cancelled',
    'expired'
);


ALTER TYPE "public"."slot_status" OWNER TO "postgres";

--
-- Name: website_fee_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."website_fee_status" AS ENUM (
    'unbilled',
    'invoiced',
    'paid',
    'waived'
);


ALTER TYPE "public"."website_fee_status" OWNER TO "postgres";

--
-- Name: website_invoice_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."website_invoice_status" AS ENUM (
    'draft',
    'sent',
    'paid',
    'waived',
    'cancelled'
);


ALTER TYPE "public"."website_invoice_status" OWNER TO "postgres";

--
-- Name: has_admin_claim(); Type: FUNCTION; Schema: private; Owner: postgres
--

CREATE OR REPLACE FUNCTION "private"."has_admin_claim"() RETURNS boolean
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public', 'auth'
    AS $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') in ('owner', 'admin');
$$;


ALTER FUNCTION "private"."has_admin_claim"() OWNER TO "postgres";

--
-- Name: has_admin_record(); Type: FUNCTION; Schema: private; Owner: postgres
--

CREATE OR REPLACE FUNCTION "private"."has_admin_record"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
      and au.active = true
      and au.role in ('owner', 'admin')
  );
$$;


ALTER FUNCTION "private"."has_admin_record"() OWNER TO "postgres";

--
-- Name: has_owner_claim(); Type: FUNCTION; Schema: private; Owner: postgres
--

CREATE OR REPLACE FUNCTION "private"."has_owner_claim"() RETURNS boolean
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public', 'auth'
    AS $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'owner';
$$;


ALTER FUNCTION "private"."has_owner_claim"() OWNER TO "postgres";

--
-- Name: has_owner_record(); Type: FUNCTION; Schema: private; Owner: postgres
--

CREATE OR REPLACE FUNCTION "private"."has_owner_record"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
      and au.active = true
      and au.role = 'owner'
  );
$$;


ALTER FUNCTION "private"."has_owner_record"() OWNER TO "postgres";

--
-- Name: is_active_admin(); Type: FUNCTION; Schema: private; Owner: postgres
--

CREATE OR REPLACE FUNCTION "private"."is_active_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
    select exists (
        select 1
        from public.admin_users
        where admin_users.user_id = (select auth.uid())
          and admin_users.active = true
    );
$$;


ALTER FUNCTION "private"."is_active_admin"() OWNER TO "postgres";

--
-- Name: is_app_admin(); Type: FUNCTION; Schema: private; Owner: postgres
--

CREATE OR REPLACE FUNCTION "private"."is_app_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'private', 'auth'
    AS $$
  select private.has_admin_claim()
     and private.has_admin_record();
$$;


ALTER FUNCTION "private"."is_app_admin"() OWNER TO "postgres";

--
-- Name: is_app_owner(); Type: FUNCTION; Schema: private; Owner: postgres
--

CREATE OR REPLACE FUNCTION "private"."is_app_owner"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'private', 'auth'
    AS $$
  select private.has_owner_claim()
     and private.has_owner_record();
$$;


ALTER FUNCTION "private"."is_app_owner"() OWNER TO "postgres";

--
-- Name: is_regular_user(); Type: FUNCTION; Schema: private; Owner: postgres
--

CREATE OR REPLACE FUNCTION "private"."is_regular_user"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
    select coalesce(
        (
            select p.is_regular
            from public.profiles p
            where p.id = auth.uid()
        ),
        false
    );
$$;


ALTER FUNCTION "private"."is_regular_user"() OWNER TO "postgres";

--
-- Name: promote_regular_after_completed_booking(); Type: FUNCTION; Schema: private; Owner: postgres
--

CREATE OR REPLACE FUNCTION "private"."promote_regular_after_completed_booking"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
    completed_paid_booking_count integer;
begin
    -- Only run when a booking becomes completed.
    if new.status <> 'completed'
       or old.status = 'completed'
       or new.user_id is null
       or new.amount_due > 0 then
        return new;
    end if;

    select count(*)
    into completed_paid_booking_count
    from public.bookings
    where user_id = new.user_id
      and status = 'completed'
      and amount_due <= 0;

    if completed_paid_booking_count >= 3 then
        update public.profiles
        set
            is_regular = true,
            regular_since = coalesce(regular_since, now())
        where id = new.user_id
          and is_regular = false;
    end if;

    return new;
end;
$$;


ALTER FUNCTION "private"."promote_regular_after_completed_booking"() OWNER TO "postgres";

--
-- Name: recalculate_booking_totals("uuid"); Type: FUNCTION; Schema: private; Owner: postgres
--

CREATE OR REPLACE FUNCTION "private"."recalculate_booking_totals"("target_booking_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'private'
    AS $$
declare
  v_subtotal numeric(10,2);
  v_booking_fee numeric(10,2);
  v_estimated_total numeric(10,2);
  v_amount_paid numeric(10,2);
  v_amount_due numeric(10,2);
  v_fee_rate numeric(5,4);
  v_fee_mode public.fee_mode;
  v_final_total numeric(10,2);
begin
  select
    b.booking_fee_rate,
    b.booking_fee_mode,
    b.final_total
  into
    v_fee_rate,
    v_fee_mode,
    v_final_total
  from public.bookings b
  where b.id = target_booking_id;

  if not found then
    return;
  end if;

  select coalesce(sum(bli.line_total), 0)::numeric(10,2)
  into v_subtotal
  from public.booking_line_items bli
  where bli.booking_id = target_booking_id
    and bli.active = true
    and bli.removed_at is null;

  v_booking_fee :=
    case
      when v_fee_mode = 'added_on_top'
        then round(v_subtotal * v_fee_rate, 2)
      else 0
    end;

  v_estimated_total :=
    case
      when v_fee_mode = 'added_on_top'
        then round(v_subtotal + v_booking_fee, 2)
      else v_subtotal
    end;

  select coalesce(
    sum(
      case
        when bp.payment_type in ('deposit', 'final_payment', 'credit')
          and bp.status in ('received', 'completed', 'credited')
          then bp.amount

        when bp.payment_type = 'refund'
          and bp.status in ('refunded', 'completed')
          then -bp.amount

        else 0
      end
    ),
    0
  )::numeric(10,2)
  into v_amount_paid
  from public.booking_payments bp
  where bp.booking_id = target_booking_id;

  v_amount_due := greatest(
    case
      when coalesce(v_final_total, 0) > 0
        then v_final_total
      else v_estimated_total
    end - v_amount_paid,
    0
  )::numeric(10,2);

  update public.bookings
  set
    subtotal_amount = v_subtotal,
    booking_fee_amount = v_booking_fee,
    estimated_total = v_estimated_total,
    amount_paid = v_amount_paid,
    amount_due = v_amount_due,
    updated_at = now()
  where id = target_booking_id;
end;
$$;


ALTER FUNCTION "private"."recalculate_booking_totals"("target_booking_id" "uuid") OWNER TO "postgres";

--
-- Name: sync_profile_display_name_to_auth(); Type: FUNCTION; Schema: private; Owner: postgres
--

CREATE OR REPLACE FUNCTION "private"."sync_profile_display_name_to_auth"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
    update auth.users
    set
        raw_user_meta_data =
            coalesce(raw_user_meta_data, '{}'::jsonb)
            || jsonb_build_object(
                'display_name', new.display_name,
                'full_name', new.display_name,
                'name', new.display_name
            ),
        updated_at = now()
    where id = new.id
      and (
          raw_user_meta_data ->> 'display_name' is distinct from new.display_name
          or raw_user_meta_data ->> 'full_name' is distinct from new.display_name
          or raw_user_meta_data ->> 'name' is distinct from new.display_name
      );

    return new;
end;
$$;


ALTER FUNCTION "private"."sync_profile_display_name_to_auth"() OWNER TO "postgres";

--
-- Name: trigger_recalculate_booking_totals(); Type: FUNCTION; Schema: private; Owner: postgres
--

CREATE OR REPLACE FUNCTION "private"."trigger_recalculate_booking_totals"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'private'
    AS $$
begin
  if tg_op = 'DELETE' then
    perform private.recalculate_booking_totals(old.booking_id);
    return old;
  end if;

  if tg_op = 'UPDATE' and old.booking_id is distinct from new.booking_id then
    perform private.recalculate_booking_totals(old.booking_id);
    perform private.recalculate_booking_totals(new.booking_id);
    return new;
  end if;

  perform private.recalculate_booking_totals(new.booking_id);
  return new;
end;
$$;


ALTER FUNCTION "private"."trigger_recalculate_booking_totals"() OWNER TO "postgres";

--
-- Name: trigger_recalculate_booking_totals_from_booking(); Type: FUNCTION; Schema: private; Owner: postgres
--

CREATE OR REPLACE FUNCTION "private"."trigger_recalculate_booking_totals_from_booking"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'private'
    AS $$
begin
  perform private.recalculate_booking_totals(new.id);
  return new;
end;
$$;


ALTER FUNCTION "private"."trigger_recalculate_booking_totals_from_booking"() OWNER TO "postgres";

--
-- Name: user_owns_booking("uuid"); Type: FUNCTION; Schema: private; Owner: postgres
--

CREATE OR REPLACE FUNCTION "private"."user_owns_booking"("target_booking_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.bookings b
    where b.id = target_booking_id
      and b.user_id = auth.uid()
  );
$$;


ALTER FUNCTION "private"."user_owns_booking"("target_booking_id" "uuid") OWNER TO "postgres";

--
-- Name: audit_booking_payment_change(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."audit_booking_payment_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
begin
  insert into public.booking_payment_audit_log (
    payment_id,
    operation,
    old_record,
    new_record,
    actor_user_id,
    database_role,
    transaction_id
  ) values (
    case when tg_op = 'DELETE' then old.id else new.id end,
    tg_op,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end,
    auth.uid(),
    current_user,
    txid_current()
  );

  return case when tg_op = 'DELETE' then old else new end;
end
$$;


ALTER FUNCTION "public"."audit_booking_payment_change"() OWNER TO "postgres";

--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $_$
declare
    normalized_instagram_handle text;
    normalized_contact_method public.preferred_contact_method;
begin
    normalized_instagram_handle := regexp_replace(
        lower(btrim(coalesce(new.raw_user_meta_data ->> 'instagram_handle', ''))),
        '^@+',
        ''
    );

    if normalized_instagram_handle = ''
        or normalized_instagram_handle !~ '^[a-z0-9._]{1,30}$'
    then
        normalized_instagram_handle := null;
    end if;

    normalized_contact_method := case
        when new.raw_user_meta_data ->> 'preferred_contact_method'
            in ('email', 'phone', 'instagram')
        then (new.raw_user_meta_data ->> 'preferred_contact_method')::public.preferred_contact_method
        else 'email'::public.preferred_contact_method
    end;

    insert into public.profiles (
        id,
        email,
        display_name,
        phone,
        instagram_handle,
        preferred_contact_method
    )
    values (
        new.id,
        coalesce(new.email, ''),
        coalesce(
            nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
            nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
            nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
            'New client'
        ),
        nullif(btrim(new.raw_user_meta_data ->> 'phone'), ''),
        normalized_instagram_handle,
        normalized_contact_method
    );

    return new;
end;
$_$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";

--
-- Name: issue_website_fee_invoice("date", "text", "uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."issue_website_fee_invoice"("p_billing_month" "date", "p_notes" "text" DEFAULT NULL::"text", "p_issued_by" "uuid" DEFAULT "auth"."uid"()) RETURNS "uuid"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog'
    AS $$
declare
  v_id uuid := gen_random_uuid();
  v_period_end date;
  v_current_month date;
  v_line_count integer;
  v_booking_count integer;
  v_net numeric(12, 2);
  v_fee numeric(12, 2);
begin
  if p_billing_month is null
    or p_billing_month <> date_trunc('month', p_billing_month::timestamp)::date
  then
    raise exception 'Billing month must be the first day of a month.';
  end if;

  v_period_end := (p_billing_month + interval '1 month')::date;
  v_current_month := date_trunc('month', current_timestamp at time zone 'America/Toronto')::date;

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
      issued_at = now()
  where id = v_id and status = 'draft';

  return v_id;
end
$$;


ALTER FUNCTION "public"."issue_website_fee_invoice"("p_billing_month" "date", "p_notes" "text", "p_issued_by" "uuid") OWNER TO "postgres";

--
-- Name: protect_website_fee_invoice(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."protect_website_fee_invoice"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog'
    AS $$
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
    or new.issued_by is distinct from old.issued_by
  ) then
    raise exception 'Issued invoice financial fields are immutable.';
  end if;

  new.updated_at := now();
  return new;
end
$$;


ALTER FUNCTION "public"."protect_website_fee_invoice"() OWNER TO "postgres";

--
-- Name: protect_website_fee_invoice_line(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."protect_website_fee_invoice_line"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog'
    AS $$
declare
  v_status text;
begin
  if tg_op in ('UPDATE', 'DELETE') then
    raise exception 'Website fee invoice lines are immutable.';
  end if;

  select status into v_status
  from public.website_fee_invoices
  where id = new.invoice_id
  for update;

  if v_status <> 'draft' then
    raise exception 'Invoice lines may only be inserted while the invoice is a draft.';
  end if;

  return new;
end
$$;


ALTER FUNCTION "public"."protect_website_fee_invoice_line"() OWNER TO "postgres";

--
-- Name: rls_auto_enable(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";

--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
begin
    new.updated_at = now();
    return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";

--
-- Name: sync_profile_from_auth_user(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."sync_profile_from_auth_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  update public.profiles
  set
    email = new.email,
    updated_at = now()
  where id = new.id;

  return new;
end;
$$;


ALTER FUNCTION "public"."sync_profile_from_auth_user"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";

--
-- Name: admin_users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."admin_users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "public"."app_role" DEFAULT 'admin'::"public"."app_role" NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."admin_users" OWNER TO "postgres";

--
-- Name: aftercare_instructions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."aftercare_instructions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text",
    "description" "text",
    "display_order" smallint,
    "active" boolean,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."aftercare_instructions" OWNER TO "postgres";

--
-- Name: availability_slots; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."availability_slots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "starts_at" timestamp with time zone NOT NULL,
    "ends_at" timestamp with time zone,
    "status" "public"."slot_status" DEFAULT 'available'::"public"."slot_status" NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "notes" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "regulars_first" boolean DEFAULT true NOT NULL,
    "public_access_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deactivated_at" timestamp with time zone,
    "deactivated_by" "uuid",
    "deactivation_reason" "text",
    "google_calendar_event_id" "text",
    "google_calendar_synced_at" timestamp with time zone,
    "google_calendar_sync_error" "text",
    CONSTRAINT "availability_slots_valid_time" CHECK ((("ends_at" IS NULL) OR ("ends_at" > "starts_at")))
);


ALTER TABLE "public"."availability_slots" OWNER TO "postgres";

--
-- Name: booking_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."booking_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "booking_id" "uuid",
    "actor_user_id" "uuid",
    "actor_type" "public"."booking_actor_type" DEFAULT 'system'::"public"."booking_actor_type" NOT NULL,
    "event_type" "text" NOT NULL,
    "message" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."booking_events" OWNER TO "postgres";

--
-- Name: booking_inspo_prompts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."booking_inspo_prompts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "booking_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "message_text" "text" NOT NULL,
    "instagram_url" "text",
    "copied_at" timestamp with time zone,
    "opened_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "public"."booking_inspo_status" DEFAULT 'pending'::"public"."booking_inspo_status" NOT NULL,
    "inspo_sent_at" timestamp with time zone,
    "reviewed_at" timestamp with time zone,
    "reviewed_by" "uuid"
);


ALTER TABLE "public"."booking_inspo_prompts" OWNER TO "postgres";

--
-- Name: booking_line_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."booking_line_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "booking_id" "uuid" NOT NULL,
    "item_type" "public"."booking_line_item_type" NOT NULL,
    "source_table" "text",
    "source_id" "uuid",
    "label_snapshot" "text" NOT NULL,
    "description_snapshot" "text",
    "quantity" numeric(10,2) DEFAULT 1 NOT NULL,
    "unit_price" numeric(10,2) DEFAULT 0 NOT NULL,
    "line_total" numeric(10,2) GENERATED ALWAYS AS (("quantity" * "unit_price")) STORED,
    "active" boolean DEFAULT true NOT NULL,
    "added_by" "uuid",
    "removed_by" "uuid",
    "removed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "booking_line_items_quantity_check" CHECK (("quantity" > (0)::numeric))
);


ALTER TABLE "public"."booking_line_items" OWNER TO "postgres";

--
-- Name: booking_payment_audit_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."booking_payment_audit_log" (
    "id" bigint NOT NULL,
    "payment_id" "uuid",
    "operation" "text" NOT NULL,
    "old_record" "jsonb",
    "new_record" "jsonb",
    "actor_user_id" "uuid",
    "database_role" "text" NOT NULL,
    "transaction_id" bigint NOT NULL,
    "changed_at" timestamp with time zone DEFAULT "clock_timestamp"() NOT NULL,
    CONSTRAINT "booking_payment_audit_log_operation_check" CHECK (("operation" = ANY (ARRAY['INSERT'::"text", 'UPDATE'::"text", 'DELETE'::"text"])))
);


ALTER TABLE "public"."booking_payment_audit_log" OWNER TO "postgres";

--
-- Name: booking_payment_audit_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE "public"."booking_payment_audit_log" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."booking_payment_audit_log_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: booking_payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."booking_payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "booking_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "payment_type" "public"."payment_type" NOT NULL,
    "method" "public"."payment_method" DEFAULT 'etransfer'::"public"."payment_method" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "status" "public"."payment_status" DEFAULT 'pending'::"public"."payment_status" NOT NULL,
    "marked_by" "uuid",
    "paid_at" timestamp with time zone,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "booking_payments_amount_check" CHECK (("amount" >= (0)::numeric))
);


ALTER TABLE "public"."booking_payments" OWNER TO "postgres";

--
-- Name: booking_policy_acceptances; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."booking_policy_acceptances" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "booking_id" "uuid" NOT NULL,
    "policy_id" "uuid",
    "title_snapshot" "text" NOT NULL,
    "description_snapshot" "text" NOT NULL,
    "accepted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."booking_policy_acceptances" OWNER TO "postgres";

--
-- Name: booking_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."booking_settings" (
    "id" smallint DEFAULT 1 NOT NULL,
    "deposit_amount" numeric(10,2) DEFAULT 15.00 NOT NULL,
    "booking_fee_rate" numeric(5,4) DEFAULT 0.0300 NOT NULL,
    "booking_fee_mode" "public"."fee_mode" DEFAULT 'added_on_top'::"public"."fee_mode" NOT NULL,
    "hold_minutes" integer DEFAULT 20 NOT NULL,
    "etransfer_email" "text",
    "instagram_url" "text",
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "regular_early_access_hours" integer DEFAULT 24 NOT NULL,
    "studio_address" "text",
    "studio_buzzer_code" "text",
    CONSTRAINT "booking_settings_id_check" CHECK (("id" = 1)),
    CONSTRAINT "booking_settings_regular_early_access_hours_check" CHECK ((("regular_early_access_hours" >= 0) AND ("regular_early_access_hours" <= 48)))
);


ALTER TABLE "public"."booking_settings" OWNER TO "postgres";

--
-- Name: COLUMN "booking_settings"."studio_address"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."booking_settings"."studio_address" IS 'Studio arrival address shown only for confirmed appointments.';


--
-- Name: COLUMN "booking_settings"."studio_buzzer_code"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."booking_settings"."studio_buzzer_code" IS 'Private buzzer code shown only for confirmed appointments and reminders.';


--
-- Name: bookings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."bookings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "booking_reference" "text" NOT NULL,
    "user_id" "uuid",
    "slot_id" "uuid",
    "status" "public"."booking_status" DEFAULT 'held'::"public"."booking_status" NOT NULL,
    "hold_expires_at" timestamp with time zone,
    "deposit_amount" numeric(10,2) DEFAULT 15.00 NOT NULL,
    "deposit_status" "public"."deposit_status" DEFAULT 'pending'::"public"."deposit_status" NOT NULL,
    "subtotal_amount" numeric(10,2) DEFAULT 0 NOT NULL,
    "booking_fee_rate" numeric(5,4) DEFAULT 0.0300 NOT NULL,
    "booking_fee_mode" "public"."fee_mode" DEFAULT 'added_on_top'::"public"."fee_mode" NOT NULL,
    "booking_fee_amount" numeric(10,2) DEFAULT 0 NOT NULL,
    "estimated_total" numeric(10,2) DEFAULT 0 NOT NULL,
    "final_total" numeric(10,2) DEFAULT 0 NOT NULL,
    "amount_paid" numeric(10,2) DEFAULT 0 NOT NULL,
    "amount_due" numeric(10,2) DEFAULT 0 NOT NULL,
    "client_notes" "text",
    "admin_notes" "text",
    "completed_at" timestamp with time zone,
    "cancelled_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "client_display_name" "text",
    "client_email" "text",
    "client_instagram_handle" "text",
    "client_preferred_contact_method" "text",
    "google_calendar_event_id" "text",
    "google_calendar_synced_at" timestamp with time zone,
    "google_calendar_sync_error" "text",
    CONSTRAINT "bookings_client_preferred_contact_method_check" CHECK ((("client_preferred_contact_method" IS NULL) OR ("client_preferred_contact_method" = ANY (ARRAY['email'::"text", 'instagram'::"text"]))))
);


ALTER TABLE "public"."bookings" OWNER TO "postgres";

--
-- Name: booking_totals_view; Type: VIEW; Schema: public; Owner: postgres
--

CREATE OR REPLACE VIEW "public"."booking_totals_view" WITH ("security_invoker"='true') AS
 WITH "line_item_totals" AS (
         SELECT "bli"."booking_id",
            (COALESCE("sum"("bli"."line_total") FILTER (WHERE (("bli"."active" = true) AND ("bli"."removed_at" IS NULL))), (0)::numeric))::numeric(10,2) AS "subtotal_amount"
           FROM "public"."booking_line_items" "bli"
          GROUP BY "bli"."booking_id"
        ), "payment_totals" AS (
         SELECT "bp"."booking_id",
            (COALESCE("sum"(
                CASE
                    WHEN (("bp"."payment_type" = ANY (ARRAY['deposit'::"public"."payment_type", 'final_payment'::"public"."payment_type", 'credit'::"public"."payment_type"])) AND ("bp"."status" = ANY (ARRAY['received'::"public"."payment_status", 'completed'::"public"."payment_status", 'credited'::"public"."payment_status"]))) THEN "bp"."amount"
                    WHEN (("bp"."payment_type" = 'refund'::"public"."payment_type") AND ("bp"."status" = ANY (ARRAY['refunded'::"public"."payment_status", 'completed'::"public"."payment_status"]))) THEN (- "bp"."amount")
                    ELSE (0)::numeric
                END), (0)::numeric))::numeric(10,2) AS "amount_paid"
           FROM "public"."booking_payments" "bp"
          GROUP BY "bp"."booking_id"
        )
 SELECT "b"."id" AS "booking_id",
    "b"."user_id",
    (COALESCE("lit"."subtotal_amount", (0)::numeric))::numeric(10,2) AS "calculated_subtotal_amount",
    (
        CASE
            WHEN ("b"."booking_fee_mode" = 'added_on_top'::"public"."fee_mode") THEN "round"((COALESCE("lit"."subtotal_amount", (0)::numeric) * "b"."booking_fee_rate"), 2)
            ELSE (0)::numeric
        END)::numeric(10,2) AS "calculated_booking_fee_amount",
    (
        CASE
            WHEN ("b"."booking_fee_mode" = 'added_on_top'::"public"."fee_mode") THEN "round"((COALESCE("lit"."subtotal_amount", (0)::numeric) + (COALESCE("lit"."subtotal_amount", (0)::numeric) * "b"."booking_fee_rate")), 2)
            ELSE COALESCE("lit"."subtotal_amount", (0)::numeric)
        END)::numeric(10,2) AS "calculated_estimated_total",
    (COALESCE("pt"."amount_paid", (0)::numeric))::numeric(10,2) AS "calculated_amount_paid",
    (GREATEST((
        CASE
            WHEN (COALESCE("b"."final_total", (0)::numeric) > (0)::numeric) THEN "b"."final_total"
            WHEN ("b"."booking_fee_mode" = 'added_on_top'::"public"."fee_mode") THEN "round"((COALESCE("lit"."subtotal_amount", (0)::numeric) + (COALESCE("lit"."subtotal_amount", (0)::numeric) * "b"."booking_fee_rate")), 2)
            ELSE COALESCE("lit"."subtotal_amount", (0)::numeric)
        END - COALESCE("pt"."amount_paid", (0)::numeric)), (0)::numeric))::numeric(10,2) AS "calculated_amount_due"
   FROM (("public"."bookings" "b"
     LEFT JOIN "line_item_totals" "lit" ON (("lit"."booking_id" = "b"."id")))
     LEFT JOIN "payment_totals" "pt" ON (("pt"."booking_id" = "b"."id")));


ALTER VIEW "public"."booking_totals_view" OWNER TO "postgres";

--
-- Name: cancellation_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."cancellation_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "booking_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "reason" "text" NOT NULL,
    "requested_refund_method" "public"."refund_method" DEFAULT 'no_refund'::"public"."refund_method" NOT NULL,
    "status" "public"."cancellation_request_status" DEFAULT 'pending'::"public"."cancellation_request_status" NOT NULL,
    "admin_decision" "text",
    "admin_reason" "text",
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."cancellation_requests" OWNER TO "postgres";

--
-- Name: deal_redemptions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."deal_redemptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "deal_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "booking_id" "uuid",
    "status" "public"."deal_redemption_status" DEFAULT 'claimed'::"public"."deal_redemption_status" NOT NULL,
    "redeemed_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."deal_redemptions" OWNER TO "postgres";

--
-- Name: deals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."deals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "discount_type" "public"."discount_type" DEFAULT 'custom'::"public"."discount_type" NOT NULL,
    "discount_value" numeric(10,2),
    "starts_at" timestamp with time zone,
    "ends_at" timestamp with time zone,
    "active" boolean DEFAULT true NOT NULL,
    "max_uses" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "deals_valid_dates" CHECK ((("ends_at" IS NULL) OR ("starts_at" IS NULL) OR ("ends_at" > "starts_at")))
);


ALTER TABLE "public"."deals" OWNER TO "postgres";

--
-- Name: design_tier_images; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."design_tier_images" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "design_tier_id" "uuid" NOT NULL,
    "image_url" "text" NOT NULL,
    "alt_text" "text",
    "display_order" integer DEFAULT 0 NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."design_tier_images" OWNER TO "postgres";

--
-- Name: design_tiers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."design_tiers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text" NOT NULL,
    "price" numeric(10,2) NOT NULL,
    "display_order" integer DEFAULT 0 NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "design_tiers_price_check" CHECK (("price" >= (0)::numeric))
);


ALTER TABLE "public"."design_tiers" OWNER TO "postgres";

--
-- Name: faqs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."faqs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "question" "text" NOT NULL,
    "answer" "text" NOT NULL,
    "display_order" integer DEFAULT 0 NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."faqs" OWNER TO "postgres";

--
-- Name: gallery_groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."gallery_groups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "background" "text" DEFAULT 'bg-surface'::"text" NOT NULL,
    "display_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "active" boolean,
    CONSTRAINT "gallery_groups_background_check" CHECK (("background" = ANY (ARRAY['bg-background'::"text", 'bg-surface'::"text", 'bg-surface-2'::"text"])))
);


ALTER TABLE "public"."gallery_groups" OWNER TO "postgres";

--
-- Name: gallery_images; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."gallery_images" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "src" "text" NOT NULL,
    "alt" "text" NOT NULL,
    "display_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "active" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."gallery_images" OWNER TO "postgres";

--
-- Name: google_calendar_integrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."google_calendar_integrations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "admin_user_id" "uuid" NOT NULL,
    "google_email" "text",
    "calendar_id" "text" DEFAULT 'primary'::"text" NOT NULL,
    "calendar_name" "text" DEFAULT 'Primary calendar'::"text" NOT NULL,
    "encrypted_refresh_token" "text" NOT NULL,
    "is_active" boolean DEFAULT false NOT NULL,
    "needs_reconnect" boolean DEFAULT false NOT NULL,
    "connected_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_sync_at" timestamp with time zone,
    "last_sync_error" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."google_calendar_integrations" OWNER TO "postgres";

--
-- Name: website_fee_payment_details; Type: VIEW; Schema: public; Owner: postgres
--

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
  WHERE (("p"."paid_at" >= '2026-08-01 04:00:00+00'::timestamp with time zone) AND ((("p"."payment_type" = ANY (ARRAY['deposit'::"public"."payment_type", 'final_payment'::"public"."payment_type"])) AND ("p"."status" = ANY (ARRAY['received'::"public"."payment_status", 'completed'::"public"."payment_status"]))) OR (("p"."payment_type" = 'refund'::"public"."payment_type") AND ("p"."status" = ANY (ARRAY['refunded'::"public"."payment_status", 'completed'::"public"."payment_status"])))));


ALTER VIEW "public"."website_fee_payment_details" OWNER TO "postgres";

--
-- Name: VIEW "website_fee_payment_details"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW "public"."website_fee_payment_details" IS 'Eligible cash receipts and refunds from August 1, 2026 onward, grouped using America/Toronto local time. Account credits are excluded.';


--
-- Name: monthly_website_fee_totals; Type: VIEW; Schema: public; Owner: postgres
--

CREATE OR REPLACE VIEW "public"."monthly_website_fee_totals" WITH ("security_invoker"='true') AS
 SELECT "billing_month",
    "count"(*) FILTER (WHERE ("eligible_net_amount" > (0)::numeric)) AS "receipt_count",
    "count"(DISTINCT "booking_id") AS "booking_count",
    "round"("sum"("eligible_net_amount"), 2) AS "eligible_net_revenue",
    3.00 AS "fee_rate_percent",
    "round"(("sum"("eligible_net_amount") * 0.03), 2) AS "invoice_amount"
   FROM "public"."website_fee_payment_details"
  GROUP BY "billing_month";


ALTER VIEW "public"."monthly_website_fee_totals" OWNER TO "postgres";

--
-- Name: VIEW "monthly_website_fee_totals"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW "public"."monthly_website_fee_totals" IS 'Live monthly salon invoice totals calculated as 3% of eligible net cash by America/Toronto billing month.';


--
-- Name: notification_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."notification_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "booking_id" "uuid",
    "notification_type" "text" NOT NULL,
    "recipient_email" "text",
    "subject" "text",
    "status" "public"."notification_status" DEFAULT 'pending'::"public"."notification_status" NOT NULL,
    "provider" "text",
    "provider_message_id" "text",
    "sent_at" timestamp with time zone,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deduplication_key" "text"
);


ALTER TABLE "public"."notification_logs" OWNER TO "postgres";

--
-- Name: policies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."policies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "policy_type" "text" DEFAULT 'booking'::"text" NOT NULL,
    "required_acknowledgement" boolean DEFAULT false NOT NULL,
    "display_order" integer DEFAULT 0 NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."policies" OWNER TO "postgres";

--
-- Name: pricing_groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."pricing_groups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "display_order" integer DEFAULT 0 NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "service_description" "text"
);


ALTER TABLE "public"."pricing_groups" OWNER TO "postgres";

--
-- Name: pricing_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."pricing_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "standalone_booking_allowed" boolean DEFAULT true NOT NULL,
    "display_order" integer DEFAULT 0 NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "requires_design_tier" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."pricing_items" OWNER TO "postgres";

--
-- Name: COLUMN "pricing_items"."requires_design_tier"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."pricing_items"."requires_design_tier" IS 'Whether bookings for this service must include a separate design-tier line item.';


--
-- Name: pricing_variants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."pricing_variants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "item_id" "uuid" NOT NULL,
    "slug" "text" NOT NULL,
    "label" "text" NOT NULL,
    "price" numeric(10,2) NOT NULL,
    "duration_minutes" integer,
    "note" "text",
    "display_order" integer DEFAULT 0 NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "pricing_variants_price_check" CHECK (("price" >= (0)::numeric))
);


ALTER TABLE "public"."pricing_variants" OWNER TO "postgres";

--
-- Name: profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "display_name" "text" NOT NULL,
    "phone" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "instagram_handle" "text",
    "preferred_contact_method" "public"."preferred_contact_method" DEFAULT 'email'::"public"."preferred_contact_method" NOT NULL,
    "is_regular" boolean DEFAULT false NOT NULL,
    "regular_since" timestamp with time zone,
    "profile_completed_at" timestamp with time zone,
    "terms_accepted_at" timestamp with time zone,
    "privacy_accepted_at" timestamp with time zone,
    "legal_version" "text",
    CONSTRAINT "profiles_instagram_handle_format" CHECK ((("instagram_handle" = "lower"("btrim"("regexp_replace"("instagram_handle", '^@'::"text", ''::"text")))) AND ("instagram_handle" ~ '^[a-z0-9._]{1,30}$'::"text")))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";

--
-- Name: testimonials; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."testimonials" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_name" "text" NOT NULL,
    "review" "text" NOT NULL,
    "image_url" "text",
    "featured" boolean DEFAULT false NOT NULL,
    "display_order" integer DEFAULT 0 NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."testimonials" OWNER TO "postgres";

--
-- Name: user_credits; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."user_credits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "source_booking_id" "uuid",
    "reason" "text",
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone,
    "used_at" timestamp with time zone,
    CONSTRAINT "user_credits_amount_check" CHECK (("amount" >= (0)::numeric))
);


ALTER TABLE "public"."user_credits" OWNER TO "postgres";

--
-- Name: website_fee_invoice_due_now; Type: VIEW; Schema: public; Owner: postgres
--

CREATE OR REPLACE VIEW "public"."website_fee_invoice_due_now" WITH ("security_invoker"='true') AS
 SELECT "billing_month",
    "receipt_count",
    "booking_count",
    "eligible_net_revenue",
    "fee_rate_percent",
    "invoice_amount"
   FROM "public"."monthly_website_fee_totals"
  WHERE ("billing_month" = ((("date_trunc"('month'::"text", (CURRENT_TIMESTAMP AT TIME ZONE 'America/Toronto'::"text")))::"date" - '1 mon'::interval))::"date");


ALTER VIEW "public"."website_fee_invoice_due_now" OWNER TO "postgres";

--
-- Name: VIEW "website_fee_invoice_due_now"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW "public"."website_fee_invoice_due_now" IS 'Previous Toronto calendar month total to use when preparing the current invoice.';


--
-- Name: website_fee_invoice_lines; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."website_fee_invoice_lines" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invoice_id" "uuid" NOT NULL,
    "source_payment_id" "uuid" NOT NULL,
    "booking_id" "uuid" NOT NULL,
    "source_billing_month" "date" NOT NULL,
    "booking_reference_snapshot" "text" NOT NULL,
    "paid_at_snapshot" timestamp with time zone NOT NULL,
    "payment_type_snapshot" "text" NOT NULL,
    "payment_method_snapshot" "text" NOT NULL,
    "payment_status_snapshot" "text" NOT NULL,
    "recorded_amount_snapshot" numeric(12,2) NOT NULL,
    "eligible_net_amount_snapshot" numeric(12,2) NOT NULL,
    "fee_rate_percent_snapshot" numeric(7,4) DEFAULT 3.0000 NOT NULL,
    "calculated_fee_unrounded" numeric(18,6) GENERATED ALWAYS AS ((("eligible_net_amount_snapshot" * "fee_rate_percent_snapshot") / (100)::numeric)) STORED,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "website_fee_invoice_lines_amount_check" CHECK (("eligible_net_amount_snapshot" <> (0)::numeric)),
    CONSTRAINT "website_fee_invoice_lines_month_check" CHECK (("source_billing_month" = ("date_trunc"('month'::"text", ("source_billing_month")::timestamp without time zone))::"date")),
    CONSTRAINT "website_fee_invoice_lines_rate_check" CHECK ((("fee_rate_percent_snapshot" >= (0)::numeric) AND ("fee_rate_percent_snapshot" <= (100)::numeric)))
);


ALTER TABLE "public"."website_fee_invoice_lines" OWNER TO "postgres";

--
-- Name: TABLE "website_fee_invoice_lines"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."website_fee_invoice_lines" IS 'Immutable source evidence for website fee invoices.';


--
-- Name: website_fee_invoices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."website_fee_invoices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invoice_number" "text" NOT NULL,
    "billing_month" "date" NOT NULL,
    "period_start" "date" NOT NULL,
    "period_end" "date" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "currency" "text" DEFAULT 'CAD'::"text" NOT NULL,
    "eligible_net_revenue" numeric(12,2) DEFAULT 0 NOT NULL,
    "fee_rate_percent" numeric(7,4) DEFAULT 3.0000 NOT NULL,
    "fee_total" numeric(12,2) DEFAULT 0 NOT NULL,
    "source_line_count" integer DEFAULT 0 NOT NULL,
    "booking_count" integer DEFAULT 0 NOT NULL,
    "issued_at" timestamp with time zone,
    "issued_by" "uuid",
    "paid_at" timestamp with time zone,
    "voided_at" timestamp with time zone,
    "void_reason" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "website_fee_invoices_counts_check" CHECK ((("source_line_count" >= 0) AND ("booking_count" >= 0))),
    CONSTRAINT "website_fee_invoices_currency_check" CHECK (("currency" ~ '^[A-Z]{3}$'::"text")),
    CONSTRAINT "website_fee_invoices_issued_check" CHECK ((("status" <> ALL (ARRAY['issued'::"text", 'paid'::"text"])) OR ("issued_at" IS NOT NULL))),
    CONSTRAINT "website_fee_invoices_month_start_check" CHECK (("billing_month" = ("date_trunc"('month'::"text", ("billing_month")::timestamp without time zone))::"date")),
    CONSTRAINT "website_fee_invoices_paid_check" CHECK ((("status" <> 'paid'::"text") OR ("paid_at" IS NOT NULL))),
    CONSTRAINT "website_fee_invoices_period_check" CHECK ((("period_start" = "billing_month") AND ("period_end" = (("billing_month" + '1 mon'::interval))::"date"))),
    CONSTRAINT "website_fee_invoices_rate_check" CHECK ((("fee_rate_percent" >= (0)::numeric) AND ("fee_rate_percent" <= (100)::numeric))),
    CONSTRAINT "website_fee_invoices_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'issued'::"text", 'paid'::"text", 'void'::"text"]))),
    CONSTRAINT "website_fee_invoices_void_check" CHECK ((("status" <> 'void'::"text") OR (("voided_at" IS NOT NULL) AND (NULLIF("btrim"("void_reason"), ''::"text") IS NOT NULL))))
);


ALTER TABLE "public"."website_fee_invoices" OWNER TO "postgres";

--
-- Name: TABLE "website_fee_invoices"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."website_fee_invoices" IS 'Immutable snapshots of issued monthly website fee invoices.';


--
-- Name: website_fee_invoice_evidence; Type: VIEW; Schema: public; Owner: postgres
--

CREATE OR REPLACE VIEW "public"."website_fee_invoice_evidence" WITH ("security_invoker"='true') AS
 SELECT "i"."invoice_number",
    "i"."billing_month" AS "invoice_billing_month",
    "i"."status" AS "invoice_status",
    "i"."issued_at",
    "l"."id",
    "l"."invoice_id",
    "l"."source_payment_id",
    "l"."booking_id",
    "l"."source_billing_month",
    "l"."booking_reference_snapshot",
    "l"."paid_at_snapshot",
    "l"."payment_type_snapshot",
    "l"."payment_method_snapshot",
    "l"."payment_status_snapshot",
    "l"."recorded_amount_snapshot",
    "l"."eligible_net_amount_snapshot",
    "l"."fee_rate_percent_snapshot",
    "l"."calculated_fee_unrounded",
    "l"."created_at"
   FROM ("public"."website_fee_invoices" "i"
     JOIN "public"."website_fee_invoice_lines" "l" ON (("l"."invoice_id" = "i"."id")));


ALTER VIEW "public"."website_fee_invoice_evidence" OWNER TO "postgres";

--
-- Name: website_fee_invoice_register; Type: VIEW; Schema: public; Owner: postgres
--

CREATE OR REPLACE VIEW "public"."website_fee_invoice_register" AS
SELECT
    NULL::"uuid" AS "id",
    NULL::"text" AS "invoice_number",
    NULL::"date" AS "billing_month",
    NULL::"date" AS "period_start",
    NULL::"date" AS "period_end",
    NULL::"text" AS "status",
    NULL::"text" AS "currency",
    NULL::numeric(12,2) AS "eligible_net_revenue",
    NULL::numeric(7,4) AS "fee_rate_percent",
    NULL::numeric(12,2) AS "fee_total",
    NULL::integer AS "source_line_count",
    NULL::integer AS "booking_count",
    NULL::timestamp with time zone AS "issued_at",
    NULL::"uuid" AS "issued_by",
    NULL::timestamp with time zone AS "paid_at",
    NULL::timestamp with time zone AS "voided_at",
    NULL::"text" AS "void_reason",
    NULL::"text" AS "notes",
    NULL::timestamp with time zone AS "created_at",
    NULL::timestamp with time zone AS "updated_at",
    NULL::integer AS "actual_line_count",
    NULL::integer AS "actual_booking_count",
    NULL::numeric AS "line_net_revenue",
    NULL::numeric AS "recalculated_fee_total",
    NULL::numeric AS "fee_difference";


ALTER VIEW "public"."website_fee_invoice_register" OWNER TO "postgres";

--
-- Name: website_fee_invoice_source_drift; Type: VIEW; Schema: public; Owner: postgres
--

CREATE OR REPLACE VIEW "public"."website_fee_invoice_source_drift" WITH ("security_invoker"='true') AS
 SELECT "i"."invoice_number",
    "i"."billing_month" AS "invoice_billing_month",
    "l"."source_payment_id",
    "l"."booking_reference_snapshot",
        CASE
            WHEN ("p"."id" IS NULL) THEN 'SOURCE_PAYMENT_MISSING'::"text"
            WHEN ("p"."paid_at" IS DISTINCT FROM "l"."paid_at_snapshot") THEN 'PAID_AT_CHANGED'::"text"
            WHEN (("p"."payment_type")::"text" IS DISTINCT FROM "l"."payment_type_snapshot") THEN 'PAYMENT_TYPE_CHANGED'::"text"
            WHEN (("p"."status")::"text" IS DISTINCT FROM "l"."payment_status_snapshot") THEN 'PAYMENT_STATUS_CHANGED'::"text"
            WHEN ("p"."amount" IS DISTINCT FROM "l"."recorded_amount_snapshot") THEN 'PAYMENT_AMOUNT_CHANGED'::"text"
            ELSE NULL::"text"
        END AS "drift_reason"
   FROM (("public"."website_fee_invoice_lines" "l"
     JOIN "public"."website_fee_invoices" "i" ON (("i"."id" = "l"."invoice_id")))
     LEFT JOIN "public"."booking_payments" "p" ON (("p"."id" = "l"."source_payment_id")))
  WHERE (("i"."status" <> 'void'::"text") AND (("p"."id" IS NULL) OR ("p"."paid_at" IS DISTINCT FROM "l"."paid_at_snapshot") OR (("p"."payment_type")::"text" IS DISTINCT FROM "l"."payment_type_snapshot") OR (("p"."status")::"text" IS DISTINCT FROM "l"."payment_status_snapshot") OR ("p"."amount" IS DISTINCT FROM "l"."recorded_amount_snapshot")));


ALTER VIEW "public"."website_fee_invoice_source_drift" OWNER TO "postgres";

--
-- Name: website_fee_payment_exceptions; Type: VIEW; Schema: public; Owner: postgres
--

CREATE OR REPLACE VIEW "public"."website_fee_payment_exceptions" WITH ("security_invoker"='true') AS
 SELECT "p"."id" AS "payment_id",
    "p"."booking_id",
    "b"."booking_reference",
    "p"."payment_type",
    "p"."method",
    "p"."status",
    "p"."amount",
    "p"."paid_at",
    "p"."created_at",
        CASE
            WHEN ("p"."amount" <= (0)::numeric) THEN 'NON_POSITIVE_AMOUNT'::"text"
            WHEN (("p"."payment_type" = ANY (ARRAY['deposit'::"public"."payment_type", 'final_payment'::"public"."payment_type"])) AND ("p"."status" = ANY (ARRAY['received'::"public"."payment_status", 'completed'::"public"."payment_status"])) AND ("p"."paid_at" IS NULL)) THEN 'ELIGIBLE_PAYMENT_MISSING_PAID_AT'::"text"
            WHEN (("p"."payment_type" = 'refund'::"public"."payment_type") AND ("p"."status" = ANY (ARRAY['refunded'::"public"."payment_status", 'completed'::"public"."payment_status"])) AND ("p"."paid_at" IS NULL)) THEN 'REFUND_MISSING_PAID_AT'::"text"
            ELSE NULL::"text"
        END AS "exception_code"
   FROM ("public"."booking_payments" "p"
     JOIN "public"."bookings" "b" ON (("b"."id" = "p"."booking_id")))
  WHERE (("p"."amount" <= (0)::numeric) OR (("p"."payment_type" = ANY (ARRAY['deposit'::"public"."payment_type", 'final_payment'::"public"."payment_type"])) AND ("p"."status" = ANY (ARRAY['received'::"public"."payment_status", 'completed'::"public"."payment_status"])) AND ("p"."paid_at" IS NULL)) OR (("p"."payment_type" = 'refund'::"public"."payment_type") AND ("p"."status" = ANY (ARRAY['refunded'::"public"."payment_status", 'completed'::"public"."payment_status"])) AND ("p"."paid_at" IS NULL)));


ALTER VIEW "public"."website_fee_payment_exceptions" OWNER TO "postgres";

--
-- Name: website_fee_ready_to_issue; Type: VIEW; Schema: public; Owner: postgres
--

CREATE OR REPLACE VIEW "public"."website_fee_ready_to_issue" WITH ("security_invoker"='true') AS
 WITH "target" AS (
         SELECT ((("date_trunc"('month'::"text", (CURRENT_TIMESTAMP AT TIME ZONE 'America/Toronto'::"text")))::"date" - '1 mon'::interval))::"date" AS "billing_month"
        ), "eligible" AS (
         SELECT "d"."payment_id",
            "d"."booking_id",
            "d"."booking_reference",
            "d"."paid_at",
            "d"."billing_month",
            "d"."payment_type",
            "d"."method",
            "d"."status",
            "d"."recorded_amount",
            "d"."eligible_net_amount",
            "d"."fee_rate_percent"
           FROM ("public"."website_fee_payment_details" "d"
             CROSS JOIN "target" "t_1")
          WHERE (("d"."paid_at" < (((("t_1"."billing_month" + '1 mon'::interval))::"date")::timestamp without time zone AT TIME ZONE 'America/Toronto'::"text")) AND (NOT (EXISTS ( SELECT 1
                   FROM ("public"."website_fee_invoice_lines" "l"
                     JOIN "public"."website_fee_invoices" "i" ON (("i"."id" = "l"."invoice_id")))
                  WHERE (("l"."source_payment_id" = "d"."payment_id") AND ("i"."status" <> 'void'::"text"))))))
        )
 SELECT "t"."billing_month",
    "t"."billing_month" AS "period_start",
    (("t"."billing_month" + '1 mon'::interval))::"date" AS "period_end",
    ("count"("e"."payment_id"))::integer AS "uninvoiced_source_count",
    ("count"(DISTINCT "e"."booking_id"))::integer AS "booking_count",
    ("count"(*) FILTER (WHERE ("e"."billing_month" < "t"."billing_month")))::integer AS "late_source_count",
    COALESCE("round"("sum"("e"."eligible_net_amount"), 2), (0)::numeric) AS "eligible_net_revenue",
    3.0000 AS "fee_rate_percent",
    COALESCE("round"(("sum"("e"."eligible_net_amount") * 0.03), 2), (0)::numeric) AS "proposed_invoice_total",
    ( SELECT ("count"(*))::integer AS "count"
           FROM "public"."website_fee_payment_exceptions") AS "unresolved_exception_count",
    ( SELECT ("count"(*))::integer AS "count"
           FROM "public"."website_fee_invoice_source_drift") AS "source_drift_count",
    (EXISTS ( SELECT 1
           FROM "public"."website_fee_invoices" "i"
          WHERE (("i"."billing_month" = "t"."billing_month") AND ("i"."status" <> 'void'::"text")))) AS "invoice_already_exists"
   FROM ("target" "t"
     LEFT JOIN "eligible" "e" ON (true))
  GROUP BY "t"."billing_month";


ALTER VIEW "public"."website_fee_ready_to_issue" OWNER TO "postgres";

--
-- Name: VIEW "website_fee_ready_to_issue"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW "public"."website_fee_ready_to_issue" IS 'Previous closed Toronto month readiness check, including late uninvoiced sources.';


--
-- Name: website_fee_workflow_runs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."website_fee_workflow_runs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "billing_month" "date" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "check_details" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "review_token_nonce" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "issue_attempts" integer DEFAULT 0 NOT NULL,
    "last_checked_at" timestamp with time zone,
    "admin_alert_sent_at" timestamp with time zone,
    "invoice_id" "uuid",
    "invoice_emailed_at" timestamp with time zone,
    "last_error" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "website_fee_workflow_attempts_check" CHECK (("issue_attempts" >= 0)),
    CONSTRAINT "website_fee_workflow_month_check" CHECK (("billing_month" = ("date_trunc"('month'::"text", ("billing_month")::timestamp without time zone))::"date")),
    CONSTRAINT "website_fee_workflow_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'needs_review'::"text", 'processing'::"text", 'invoiced'::"text", 'no_activity'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."website_fee_workflow_runs" OWNER TO "postgres";

--
-- Name: admin_users admin_users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id");


--
-- Name: admin_users admin_users_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_user_id_key" UNIQUE ("user_id");


--
-- Name: aftercare_instructions aftercare_instructions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."aftercare_instructions"
    ADD CONSTRAINT "aftercare_instructions_pkey" PRIMARY KEY ("id");


--
-- Name: availability_slots availability_slots_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."availability_slots"
    ADD CONSTRAINT "availability_slots_pkey" PRIMARY KEY ("id");


--
-- Name: booking_events booking_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."booking_events"
    ADD CONSTRAINT "booking_events_pkey" PRIMARY KEY ("id");


--
-- Name: booking_inspo_prompts booking_inspo_prompts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."booking_inspo_prompts"
    ADD CONSTRAINT "booking_inspo_prompts_pkey" PRIMARY KEY ("id");


--
-- Name: booking_line_items booking_line_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."booking_line_items"
    ADD CONSTRAINT "booking_line_items_pkey" PRIMARY KEY ("id");


--
-- Name: booking_payment_audit_log booking_payment_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."booking_payment_audit_log"
    ADD CONSTRAINT "booking_payment_audit_log_pkey" PRIMARY KEY ("id");


--
-- Name: booking_payments booking_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."booking_payments"
    ADD CONSTRAINT "booking_payments_pkey" PRIMARY KEY ("id");


--
-- Name: booking_policy_acceptances booking_policy_acceptances_booking_id_policy_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."booking_policy_acceptances"
    ADD CONSTRAINT "booking_policy_acceptances_booking_id_policy_id_key" UNIQUE ("booking_id", "policy_id");


--
-- Name: booking_policy_acceptances booking_policy_acceptances_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."booking_policy_acceptances"
    ADD CONSTRAINT "booking_policy_acceptances_pkey" PRIMARY KEY ("id");


--
-- Name: booking_settings booking_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."booking_settings"
    ADD CONSTRAINT "booking_settings_pkey" PRIMARY KEY ("id");


--
-- Name: bookings bookings_booking_reference_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_booking_reference_key" UNIQUE ("booking_reference");


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_pkey" PRIMARY KEY ("id");


--
-- Name: bookings bookings_requires_account_or_external_contact; Type: CHECK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE "public"."bookings"
    ADD CONSTRAINT "bookings_requires_account_or_external_contact" CHECK ((("user_id" IS NOT NULL) OR ((NULLIF("btrim"("client_display_name"), ''::"text") IS NOT NULL) AND ((NULLIF("btrim"("client_email"), ''::"text") IS NOT NULL) OR (NULLIF("btrim"("client_instagram_handle"), ''::"text") IS NOT NULL))))) NOT VALID;


--
-- Name: cancellation_requests cancellation_requests_allowed_refund_methods; Type: CHECK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE "public"."cancellation_requests"
    ADD CONSTRAINT "cancellation_requests_allowed_refund_methods" CHECK (("requested_refund_method" = ANY (ARRAY['no_refund'::"public"."refund_method", 'account_credit'::"public"."refund_method"]))) NOT VALID;


--
-- Name: cancellation_requests cancellation_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."cancellation_requests"
    ADD CONSTRAINT "cancellation_requests_pkey" PRIMARY KEY ("id");


--
-- Name: deal_redemptions deal_redemptions_deal_id_user_id_booking_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."deal_redemptions"
    ADD CONSTRAINT "deal_redemptions_deal_id_user_id_booking_id_key" UNIQUE ("deal_id", "user_id", "booking_id");


--
-- Name: deal_redemptions deal_redemptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."deal_redemptions"
    ADD CONSTRAINT "deal_redemptions_pkey" PRIMARY KEY ("id");


--
-- Name: deals deals_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."deals"
    ADD CONSTRAINT "deals_code_key" UNIQUE ("code");


--
-- Name: deals deals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."deals"
    ADD CONSTRAINT "deals_pkey" PRIMARY KEY ("id");


--
-- Name: design_tier_images design_tier_images_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."design_tier_images"
    ADD CONSTRAINT "design_tier_images_pkey" PRIMARY KEY ("id");


--
-- Name: design_tier_images design_tier_images_unique_order; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."design_tier_images"
    ADD CONSTRAINT "design_tier_images_unique_order" UNIQUE ("design_tier_id", "display_order");


--
-- Name: design_tiers design_tiers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."design_tiers"
    ADD CONSTRAINT "design_tiers_pkey" PRIMARY KEY ("id");


--
-- Name: design_tiers design_tiers_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."design_tiers"
    ADD CONSTRAINT "design_tiers_slug_key" UNIQUE ("slug");


--
-- Name: faqs faqs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."faqs"
    ADD CONSTRAINT "faqs_pkey" PRIMARY KEY ("id");


--
-- Name: gallery_groups gallery_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."gallery_groups"
    ADD CONSTRAINT "gallery_groups_pkey" PRIMARY KEY ("id");


--
-- Name: gallery_groups gallery_groups_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."gallery_groups"
    ADD CONSTRAINT "gallery_groups_slug_key" UNIQUE ("slug");


--
-- Name: gallery_images gallery_images_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."gallery_images"
    ADD CONSTRAINT "gallery_images_pkey" PRIMARY KEY ("id");


--
-- Name: google_calendar_integrations google_calendar_integrations_admin_user_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."google_calendar_integrations"
    ADD CONSTRAINT "google_calendar_integrations_admin_user_unique" UNIQUE ("admin_user_id");


--
-- Name: google_calendar_integrations google_calendar_integrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."google_calendar_integrations"
    ADD CONSTRAINT "google_calendar_integrations_pkey" PRIMARY KEY ("id");


--
-- Name: notification_logs notification_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."notification_logs"
    ADD CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id");


--
-- Name: policies policies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."policies"
    ADD CONSTRAINT "policies_pkey" PRIMARY KEY ("id");


--
-- Name: policies policies_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."policies"
    ADD CONSTRAINT "policies_slug_key" UNIQUE ("slug");


--
-- Name: pricing_groups pricing_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."pricing_groups"
    ADD CONSTRAINT "pricing_groups_pkey" PRIMARY KEY ("id");


--
-- Name: pricing_groups pricing_groups_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."pricing_groups"
    ADD CONSTRAINT "pricing_groups_slug_key" UNIQUE ("slug");


--
-- Name: pricing_items pricing_items_group_id_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."pricing_items"
    ADD CONSTRAINT "pricing_items_group_id_slug_key" UNIQUE ("group_id", "slug");


--
-- Name: pricing_items pricing_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."pricing_items"
    ADD CONSTRAINT "pricing_items_pkey" PRIMARY KEY ("id");


--
-- Name: pricing_variants pricing_variants_item_id_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."pricing_variants"
    ADD CONSTRAINT "pricing_variants_item_id_slug_key" UNIQUE ("item_id", "slug");


--
-- Name: pricing_variants pricing_variants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."pricing_variants"
    ADD CONSTRAINT "pricing_variants_pkey" PRIMARY KEY ("id");


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");


--
-- Name: testimonials testimonials_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."testimonials"
    ADD CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id");


--
-- Name: user_credits user_credits_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."user_credits"
    ADD CONSTRAINT "user_credits_pkey" PRIMARY KEY ("id");


--
-- Name: website_fee_invoice_lines website_fee_invoice_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."website_fee_invoice_lines"
    ADD CONSTRAINT "website_fee_invoice_lines_pkey" PRIMARY KEY ("id");


--
-- Name: website_fee_invoices website_fee_invoices_invoice_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."website_fee_invoices"
    ADD CONSTRAINT "website_fee_invoices_invoice_number_key" UNIQUE ("invoice_number");


--
-- Name: website_fee_invoices website_fee_invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."website_fee_invoices"
    ADD CONSTRAINT "website_fee_invoices_pkey" PRIMARY KEY ("id");


--
-- Name: website_fee_workflow_runs website_fee_workflow_runs_billing_month_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."website_fee_workflow_runs"
    ADD CONSTRAINT "website_fee_workflow_runs_billing_month_key" UNIQUE ("billing_month");


--
-- Name: website_fee_workflow_runs website_fee_workflow_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."website_fee_workflow_runs"
    ADD CONSTRAINT "website_fee_workflow_runs_pkey" PRIMARY KEY ("id");


--
-- Name: admin_users_role_active_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "admin_users_role_active_idx" ON "public"."admin_users" USING "btree" ("role", "active");


--
-- Name: admin_users_user_id_active_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "admin_users_user_id_active_idx" ON "public"."admin_users" USING "btree" ("user_id", "active");


--
-- Name: availability_slots_active_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "availability_slots_active_status_idx" ON "public"."availability_slots" USING "btree" ("active", "status");


--
-- Name: availability_slots_inactive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "availability_slots_inactive_idx" ON "public"."availability_slots" USING "btree" ("active", "starts_at") WHERE ("active" = false);


--
-- Name: availability_slots_one_active_start_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "availability_slots_one_active_start_idx" ON "public"."availability_slots" USING "btree" ("starts_at") WHERE "active";


--
-- Name: availability_slots_public_access_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "availability_slots_public_access_idx" ON "public"."availability_slots" USING "btree" ("active", "status", "public_access_at", "starts_at");


--
-- Name: availability_slots_starts_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "availability_slots_starts_at_idx" ON "public"."availability_slots" USING "btree" ("starts_at");


--
-- Name: availability_slots_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "availability_slots_status_idx" ON "public"."availability_slots" USING "btree" ("status");


--
-- Name: booking_events_actor_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "booking_events_actor_user_id_idx" ON "public"."booking_events" USING "btree" ("actor_user_id");


--
-- Name: booking_events_booking_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "booking_events_booking_id_idx" ON "public"."booking_events" USING "btree" ("booking_id");


--
-- Name: booking_events_event_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "booking_events_event_type_idx" ON "public"."booking_events" USING "btree" ("event_type");


--
-- Name: booking_events_metadata_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "booking_events_metadata_idx" ON "public"."booking_events" USING "gin" ("metadata");


--
-- Name: booking_inspo_prompts_booking_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "booking_inspo_prompts_booking_id_idx" ON "public"."booking_inspo_prompts" USING "btree" ("booking_id");


--
-- Name: booking_inspo_prompts_inspo_sent_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "booking_inspo_prompts_inspo_sent_at_idx" ON "public"."booking_inspo_prompts" USING "btree" ("inspo_sent_at");


--
-- Name: booking_inspo_prompts_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "booking_inspo_prompts_status_idx" ON "public"."booking_inspo_prompts" USING "btree" ("status");


--
-- Name: booking_inspo_prompts_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "booking_inspo_prompts_user_id_idx" ON "public"."booking_inspo_prompts" USING "btree" ("user_id");


--
-- Name: booking_line_items_active_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "booking_line_items_active_idx" ON "public"."booking_line_items" USING "btree" ("booking_id", "active");


--
-- Name: booking_line_items_booking_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "booking_line_items_booking_id_idx" ON "public"."booking_line_items" USING "btree" ("booking_id");


--
-- Name: booking_line_items_item_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "booking_line_items_item_type_idx" ON "public"."booking_line_items" USING "btree" ("item_type");


--
-- Name: booking_payment_audit_payment_changed_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "booking_payment_audit_payment_changed_idx" ON "public"."booking_payment_audit_log" USING "btree" ("payment_id", "changed_at" DESC);


--
-- Name: booking_payments_booking_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "booking_payments_booking_id_idx" ON "public"."booking_payments" USING "btree" ("booking_id");


--
-- Name: booking_payments_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "booking_payments_status_idx" ON "public"."booking_payments" USING "btree" ("status");


--
-- Name: booking_payments_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "booking_payments_user_id_idx" ON "public"."booking_payments" USING "btree" ("user_id");


--
-- Name: booking_policy_acceptances_booking_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "booking_policy_acceptances_booking_id_idx" ON "public"."booking_policy_acceptances" USING "btree" ("booking_id");


--
-- Name: bookings_client_email_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "bookings_client_email_idx" ON "public"."bookings" USING "btree" ("lower"("client_email")) WHERE ("client_email" IS NOT NULL);


--
-- Name: bookings_hold_expires_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "bookings_hold_expires_at_idx" ON "public"."bookings" USING "btree" ("hold_expires_at");


--
-- Name: bookings_one_active_per_slot_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "bookings_one_active_per_slot_idx" ON "public"."bookings" USING "btree" ("slot_id") WHERE ("status" = ANY (ARRAY['held'::"public"."booking_status", 'requested'::"public"."booking_status", 'confirmed'::"public"."booking_status", 'cancellation_requested'::"public"."booking_status", 'completed'::"public"."booking_status"]));


--
-- Name: bookings_slot_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "bookings_slot_id_idx" ON "public"."bookings" USING "btree" ("slot_id");


--
-- Name: bookings_slot_id_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "bookings_slot_id_user_id_idx" ON "public"."bookings" USING "btree" ("slot_id", "user_id");


--
-- Name: bookings_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "bookings_status_idx" ON "public"."bookings" USING "btree" ("status");


--
-- Name: bookings_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "bookings_user_id_idx" ON "public"."bookings" USING "btree" ("user_id");


--
-- Name: cancellation_requests_booking_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "cancellation_requests_booking_id_idx" ON "public"."cancellation_requests" USING "btree" ("booking_id");


--
-- Name: cancellation_requests_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "cancellation_requests_status_idx" ON "public"."cancellation_requests" USING "btree" ("status");


--
-- Name: cancellation_requests_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "cancellation_requests_user_id_idx" ON "public"."cancellation_requests" USING "btree" ("user_id");


--
-- Name: deal_redemptions_deal_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "deal_redemptions_deal_id_idx" ON "public"."deal_redemptions" USING "btree" ("deal_id");


--
-- Name: deal_redemptions_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "deal_redemptions_user_id_idx" ON "public"."deal_redemptions" USING "btree" ("user_id");


--
-- Name: deals_active_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "deals_active_idx" ON "public"."deals" USING "btree" ("active");


--
-- Name: deals_code_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "deals_code_idx" ON "public"."deals" USING "btree" ("code");


--
-- Name: faqs_active_order_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "faqs_active_order_idx" ON "public"."faqs" USING "btree" ("active", "display_order");


--
-- Name: google_calendar_integrations_active_admin_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "google_calendar_integrations_active_admin_idx" ON "public"."google_calendar_integrations" USING "btree" ("admin_user_id") WHERE ("is_active" = true);


--
-- Name: google_calendar_integrations_one_studio_active_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "google_calendar_integrations_one_studio_active_idx" ON "public"."google_calendar_integrations" USING "btree" ("is_active") WHERE ("is_active" = true);


--
-- Name: notification_logs_booking_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "notification_logs_booking_id_idx" ON "public"."notification_logs" USING "btree" ("booking_id");


--
-- Name: notification_logs_deduplication_terminal_uidx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "notification_logs_deduplication_terminal_uidx" ON "public"."notification_logs" USING "btree" ("deduplication_key") WHERE (("deduplication_key" IS NOT NULL) AND ("status" = ANY (ARRAY['pending'::"public"."notification_status", 'sent'::"public"."notification_status", 'skipped'::"public"."notification_status"])));


--
-- Name: notification_logs_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "notification_logs_status_idx" ON "public"."notification_logs" USING "btree" ("status");


--
-- Name: notification_logs_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "notification_logs_user_id_idx" ON "public"."notification_logs" USING "btree" ("user_id");


--
-- Name: profiles_is_regular_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "profiles_is_regular_idx" ON "public"."profiles" USING "btree" ("is_regular") WHERE ("is_regular" = true);


--
-- Name: testimonials_active_order_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "testimonials_active_order_idx" ON "public"."testimonials" USING "btree" ("active", "display_order");


--
-- Name: user_credits_active_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "user_credits_active_idx" ON "public"."user_credits" USING "btree" ("user_id", "active");


--
-- Name: user_credits_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "user_credits_user_id_idx" ON "public"."user_credits" USING "btree" ("user_id");


--
-- Name: website_fee_invoice_lines_booking_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "website_fee_invoice_lines_booking_idx" ON "public"."website_fee_invoice_lines" USING "btree" ("booking_id");


--
-- Name: website_fee_invoice_lines_invoice_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "website_fee_invoice_lines_invoice_idx" ON "public"."website_fee_invoice_lines" USING "btree" ("invoice_id");


--
-- Name: website_fee_invoice_lines_payment_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "website_fee_invoice_lines_payment_idx" ON "public"."website_fee_invoice_lines" USING "btree" ("source_payment_id");


--
-- Name: website_fee_invoices_issued_by_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "website_fee_invoices_issued_by_idx" ON "public"."website_fee_invoices" USING "btree" ("issued_by") WHERE ("issued_by" IS NOT NULL);


--
-- Name: website_fee_invoices_one_active_month_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "website_fee_invoices_one_active_month_idx" ON "public"."website_fee_invoices" USING "btree" ("billing_month") WHERE ("status" <> 'void'::"text");


--
-- Name: website_fee_invoices_status_month_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "website_fee_invoices_status_month_idx" ON "public"."website_fee_invoices" USING "btree" ("status", "billing_month" DESC);


--
-- Name: website_fee_workflow_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "website_fee_workflow_status_idx" ON "public"."website_fee_workflow_runs" USING "btree" ("status", "billing_month" DESC);


--
-- Name: website_fee_invoice_register _RETURN; Type: RULE; Schema: public; Owner: postgres
--

CREATE OR REPLACE VIEW "public"."website_fee_invoice_register" WITH ("security_invoker"='true') AS
 SELECT "i"."id",
    "i"."invoice_number",
    "i"."billing_month",
    "i"."period_start",
    "i"."period_end",
    "i"."status",
    "i"."currency",
    "i"."eligible_net_revenue",
    "i"."fee_rate_percent",
    "i"."fee_total",
    "i"."source_line_count",
    "i"."booking_count",
    "i"."issued_at",
    "i"."issued_by",
    "i"."paid_at",
    "i"."voided_at",
    "i"."void_reason",
    "i"."notes",
    "i"."created_at",
    "i"."updated_at",
    ("count"("l"."id"))::integer AS "actual_line_count",
    ("count"(DISTINCT "l"."booking_id"))::integer AS "actual_booking_count",
    COALESCE("round"("sum"("l"."eligible_net_amount_snapshot"), 2), (0)::numeric) AS "line_net_revenue",
    COALESCE("round"((("sum"("l"."eligible_net_amount_snapshot") * "i"."fee_rate_percent") / (100)::numeric), 2), (0)::numeric) AS "recalculated_fee_total",
    "round"(("i"."fee_total" - COALESCE("round"((("sum"("l"."eligible_net_amount_snapshot") * "i"."fee_rate_percent") / (100)::numeric), 2), (0)::numeric)), 2) AS "fee_difference"
   FROM ("public"."website_fee_invoices" "i"
     LEFT JOIN "public"."website_fee_invoice_lines" "l" ON (("l"."invoice_id" = "i"."id")))
  GROUP BY "i"."id";


--
-- Name: booking_payments audit_booking_payment_change; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "audit_booking_payment_change" AFTER INSERT OR DELETE OR UPDATE ON "public"."booking_payments" FOR EACH ROW EXECUTE FUNCTION "public"."audit_booking_payment_change"();


--
-- Name: bookings promote_regular_after_completed_booking; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "promote_regular_after_completed_booking" AFTER UPDATE OF "status" ON "public"."bookings" FOR EACH ROW EXECUTE FUNCTION "private"."promote_regular_after_completed_booking"();


--
-- Name: website_fee_invoices protect_website_fee_invoice; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "protect_website_fee_invoice" BEFORE DELETE OR UPDATE ON "public"."website_fee_invoices" FOR EACH ROW EXECUTE FUNCTION "public"."protect_website_fee_invoice"();


--
-- Name: website_fee_invoice_lines protect_website_fee_invoice_line; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "protect_website_fee_invoice_line" BEFORE INSERT OR DELETE OR UPDATE ON "public"."website_fee_invoice_lines" FOR EACH ROW EXECUTE FUNCTION "public"."protect_website_fee_invoice_line"();


--
-- Name: bookings recalculate_booking_totals_on_booking_pricing_change; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "recalculate_booking_totals_on_booking_pricing_change" AFTER UPDATE OF "booking_fee_rate", "booking_fee_mode", "final_total" ON "public"."bookings" FOR EACH ROW WHEN ((("old"."booking_fee_rate" IS DISTINCT FROM "new"."booking_fee_rate") OR ("old"."booking_fee_mode" IS DISTINCT FROM "new"."booking_fee_mode") OR ("old"."final_total" IS DISTINCT FROM "new"."final_total"))) EXECUTE FUNCTION "private"."trigger_recalculate_booking_totals_from_booking"();


--
-- Name: booking_line_items recalculate_booking_totals_on_line_items; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "recalculate_booking_totals_on_line_items" AFTER INSERT OR DELETE OR UPDATE ON "public"."booking_line_items" FOR EACH ROW EXECUTE FUNCTION "private"."trigger_recalculate_booking_totals"();


--
-- Name: booking_payments recalculate_booking_totals_on_payments; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "recalculate_booking_totals_on_payments" AFTER INSERT OR DELETE OR UPDATE ON "public"."booking_payments" FOR EACH ROW EXECUTE FUNCTION "private"."trigger_recalculate_booking_totals"();


--
-- Name: admin_users set_admin_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "set_admin_users_updated_at" BEFORE UPDATE ON "public"."admin_users" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();


--
-- Name: aftercare_instructions set_aftercare_instructions_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "set_aftercare_instructions_updated_at" BEFORE UPDATE ON "public"."aftercare_instructions" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();


--
-- Name: availability_slots set_availability_slots_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "set_availability_slots_updated_at" BEFORE UPDATE ON "public"."availability_slots" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();


--
-- Name: booking_line_items set_booking_line_items_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "set_booking_line_items_updated_at" BEFORE UPDATE ON "public"."booking_line_items" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();


--
-- Name: booking_payments set_booking_payments_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "set_booking_payments_updated_at" BEFORE UPDATE ON "public"."booking_payments" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();


--
-- Name: booking_settings set_booking_settings_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "set_booking_settings_updated_at" BEFORE UPDATE ON "public"."booking_settings" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();


--
-- Name: bookings set_bookings_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "set_bookings_updated_at" BEFORE UPDATE ON "public"."bookings" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();


--
-- Name: cancellation_requests set_cancellation_requests_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "set_cancellation_requests_updated_at" BEFORE UPDATE ON "public"."cancellation_requests" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();


--
-- Name: deals set_deals_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "set_deals_updated_at" BEFORE UPDATE ON "public"."deals" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();


--
-- Name: design_tiers set_design_tiers_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "set_design_tiers_updated_at" BEFORE UPDATE ON "public"."design_tiers" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();


--
-- Name: faqs set_faqs_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "set_faqs_updated_at" BEFORE UPDATE ON "public"."faqs" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();


--
-- Name: gallery_groups set_gallery_groups_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "set_gallery_groups_updated_at" BEFORE UPDATE ON "public"."gallery_groups" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();


--
-- Name: gallery_images set_gallery_images_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "set_gallery_images_updated_at" BEFORE UPDATE ON "public"."gallery_images" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();


--
-- Name: policies set_policies_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "set_policies_updated_at" BEFORE UPDATE ON "public"."policies" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();


--
-- Name: pricing_groups set_pricing_groups_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "set_pricing_groups_updated_at" BEFORE UPDATE ON "public"."pricing_groups" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();


--
-- Name: pricing_items set_pricing_items_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "set_pricing_items_updated_at" BEFORE UPDATE ON "public"."pricing_items" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();


--
-- Name: pricing_variants set_pricing_variants_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "set_pricing_variants_updated_at" BEFORE UPDATE ON "public"."pricing_variants" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();


--
-- Name: profiles set_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "set_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();


--
-- Name: testimonials set_testimonials_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "set_testimonials_updated_at" BEFORE UPDATE ON "public"."testimonials" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();


--
-- Name: profiles sync_profile_display_name_to_auth; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "sync_profile_display_name_to_auth" AFTER UPDATE OF "display_name" ON "public"."profiles" FOR EACH ROW WHEN (("old"."display_name" IS DISTINCT FROM "new"."display_name")) EXECUTE FUNCTION "private"."sync_profile_display_name_to_auth"();


--
-- Cross-schema auth triggers are not emitted when pg_dump is scoped to
-- public/private. Supabase creates auth.users; these application triggers
-- attach the profile lifecycle functions defined above.
--

CREATE OR REPLACE TRIGGER "on_auth_user_created"
AFTER INSERT ON "auth"."users"
FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_user"();

CREATE OR REPLACE TRIGGER "on_auth_user_updated_sync_profile"
AFTER UPDATE OF "email" ON "auth"."users"
FOR EACH ROW
WHEN (("old"."email"::text IS DISTINCT FROM "new"."email"::text))
EXECUTE FUNCTION "public"."sync_profile_from_auth_user"();


--
-- Name: admin_users admin_users_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");


--
-- Name: admin_users admin_users_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;


--
-- Name: availability_slots availability_slots_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."availability_slots"
    ADD CONSTRAINT "availability_slots_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;


--
-- Name: availability_slots availability_slots_deactivated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."availability_slots"
    ADD CONSTRAINT "availability_slots_deactivated_by_fkey" FOREIGN KEY ("deactivated_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;


--
-- Name: booking_events booking_events_actor_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."booking_events"
    ADD CONSTRAINT "booking_events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;


--
-- Name: booking_events booking_events_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."booking_events"
    ADD CONSTRAINT "booking_events_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE;


--
-- Name: booking_inspo_prompts booking_inspo_prompts_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."booking_inspo_prompts"
    ADD CONSTRAINT "booking_inspo_prompts_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE;


--
-- Name: booking_inspo_prompts booking_inspo_prompts_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."booking_inspo_prompts"
    ADD CONSTRAINT "booking_inspo_prompts_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;


--
-- Name: booking_inspo_prompts booking_inspo_prompts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."booking_inspo_prompts"
    ADD CONSTRAINT "booking_inspo_prompts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;


--
-- Name: booking_line_items booking_line_items_added_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."booking_line_items"
    ADD CONSTRAINT "booking_line_items_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;


--
-- Name: booking_line_items booking_line_items_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."booking_line_items"
    ADD CONSTRAINT "booking_line_items_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE;


--
-- Name: booking_line_items booking_line_items_removed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."booking_line_items"
    ADD CONSTRAINT "booking_line_items_removed_by_fkey" FOREIGN KEY ("removed_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;


--
-- Name: booking_payments booking_payments_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."booking_payments"
    ADD CONSTRAINT "booking_payments_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE;


--
-- Name: booking_payments booking_payments_marked_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."booking_payments"
    ADD CONSTRAINT "booking_payments_marked_by_fkey" FOREIGN KEY ("marked_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;


--
-- Name: booking_payments booking_payments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."booking_payments"
    ADD CONSTRAINT "booking_payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;


--
-- Name: booking_policy_acceptances booking_policy_acceptances_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."booking_policy_acceptances"
    ADD CONSTRAINT "booking_policy_acceptances_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE;


--
-- Name: booking_policy_acceptances booking_policy_acceptances_policy_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."booking_policy_acceptances"
    ADD CONSTRAINT "booking_policy_acceptances_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "public"."policies"("id") ON DELETE SET NULL;


--
-- Name: bookings bookings_slot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "public"."availability_slots"("id") ON DELETE SET NULL;


--
-- Name: bookings bookings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;


--
-- Name: cancellation_requests cancellation_requests_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."cancellation_requests"
    ADD CONSTRAINT "cancellation_requests_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE;


--
-- Name: cancellation_requests cancellation_requests_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."cancellation_requests"
    ADD CONSTRAINT "cancellation_requests_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;


--
-- Name: cancellation_requests cancellation_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."cancellation_requests"
    ADD CONSTRAINT "cancellation_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;


--
-- Name: deal_redemptions deal_redemptions_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."deal_redemptions"
    ADD CONSTRAINT "deal_redemptions_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE SET NULL;


--
-- Name: deal_redemptions deal_redemptions_deal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."deal_redemptions"
    ADD CONSTRAINT "deal_redemptions_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE CASCADE;


--
-- Name: deal_redemptions deal_redemptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."deal_redemptions"
    ADD CONSTRAINT "deal_redemptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;


--
-- Name: design_tier_images design_tier_images_design_tier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."design_tier_images"
    ADD CONSTRAINT "design_tier_images_design_tier_id_fkey" FOREIGN KEY ("design_tier_id") REFERENCES "public"."design_tiers"("id") ON DELETE CASCADE;


--
-- Name: gallery_images gallery_images_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."gallery_images"
    ADD CONSTRAINT "gallery_images_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."gallery_groups"("id") ON DELETE CASCADE;


--
-- Name: google_calendar_integrations google_calendar_integrations_admin_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."google_calendar_integrations"
    ADD CONSTRAINT "google_calendar_integrations_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;


--
-- Name: notification_logs notification_logs_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."notification_logs"
    ADD CONSTRAINT "notification_logs_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE;


--
-- Name: notification_logs notification_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."notification_logs"
    ADD CONSTRAINT "notification_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;


--
-- Name: pricing_items pricing_items_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."pricing_items"
    ADD CONSTRAINT "pricing_items_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."pricing_groups"("id") ON DELETE CASCADE;


--
-- Name: pricing_variants pricing_variants_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."pricing_variants"
    ADD CONSTRAINT "pricing_variants_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."pricing_items"("id") ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: user_credits user_credits_source_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."user_credits"
    ADD CONSTRAINT "user_credits_source_booking_id_fkey" FOREIGN KEY ("source_booking_id") REFERENCES "public"."bookings"("id") ON DELETE SET NULL;


--
-- Name: user_credits user_credits_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."user_credits"
    ADD CONSTRAINT "user_credits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;


--
-- Name: website_fee_invoice_lines website_fee_invoice_lines_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."website_fee_invoice_lines"
    ADD CONSTRAINT "website_fee_invoice_lines_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE RESTRICT;


--
-- Name: website_fee_invoice_lines website_fee_invoice_lines_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."website_fee_invoice_lines"
    ADD CONSTRAINT "website_fee_invoice_lines_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."website_fee_invoices"("id") ON DELETE RESTRICT;


--
-- Name: website_fee_invoice_lines website_fee_invoice_lines_source_payment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."website_fee_invoice_lines"
    ADD CONSTRAINT "website_fee_invoice_lines_source_payment_id_fkey" FOREIGN KEY ("source_payment_id") REFERENCES "public"."booking_payments"("id") ON DELETE RESTRICT;


--
-- Name: website_fee_invoices website_fee_invoices_issued_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."website_fee_invoices"
    ADD CONSTRAINT "website_fee_invoices_issued_by_fkey" FOREIGN KEY ("issued_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;


--
-- Name: website_fee_workflow_runs website_fee_workflow_runs_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."website_fee_workflow_runs"
    ADD CONSTRAINT "website_fee_workflow_runs_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."website_fee_invoices"("id") ON DELETE RESTRICT;


--
-- Name: google_calendar_integrations Active admins can delete their Google Calendar integration; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Active admins can delete their Google Calendar integration" ON "public"."google_calendar_integrations" FOR DELETE TO "authenticated" USING ((("admin_user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ( SELECT "private"."is_active_admin"() AS "is_active_admin")));


--
-- Name: google_calendar_integrations Active admins can insert their Google Calendar integration; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Active admins can insert their Google Calendar integration" ON "public"."google_calendar_integrations" FOR INSERT TO "authenticated" WITH CHECK ((("admin_user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ( SELECT "private"."is_active_admin"() AS "is_active_admin")));


--
-- Name: google_calendar_integrations Active admins can read Google Calendar integrations; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Active admins can read Google Calendar integrations" ON "public"."google_calendar_integrations" FOR SELECT TO "authenticated" USING (( SELECT "private"."is_active_admin"() AS "is_active_admin"));


--
-- Name: google_calendar_integrations Active admins can update their Google Calendar integration; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Active admins can update their Google Calendar integration" ON "public"."google_calendar_integrations" FOR UPDATE TO "authenticated" USING ((("admin_user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ( SELECT "private"."is_active_admin"() AS "is_active_admin"))) WITH CHECK ((("admin_user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ( SELECT "private"."is_active_admin"() AS "is_active_admin")));


--
-- Name: faqs Admins can delete FAQs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can delete FAQs" ON "public"."faqs" FOR DELETE TO "authenticated" USING ("private"."is_app_admin"());


--
-- Name: availability_slots Admins can delete availability slots; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can delete availability slots" ON "public"."availability_slots" FOR DELETE TO "authenticated" USING ("private"."is_app_admin"());


--
-- Name: booking_line_items Admins can delete booking line items; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can delete booking line items" ON "public"."booking_line_items" FOR DELETE TO "authenticated" USING ("private"."is_app_admin"());


--
-- Name: booking_payments Admins can delete booking payments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can delete booking payments" ON "public"."booking_payments" FOR DELETE TO "authenticated" USING ("private"."is_app_admin"());


--
-- Name: bookings Admins can delete bookings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can delete bookings" ON "public"."bookings" FOR DELETE TO "authenticated" USING ("private"."is_app_admin"());


--
-- Name: cancellation_requests Admins can delete cancellation requests; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can delete cancellation requests" ON "public"."cancellation_requests" FOR DELETE TO "authenticated" USING ("private"."is_app_admin"());


--
-- Name: user_credits Admins can delete credits; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can delete credits" ON "public"."user_credits" FOR DELETE TO "authenticated" USING ("private"."is_app_admin"());


--
-- Name: deals Admins can delete deals; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can delete deals" ON "public"."deals" FOR DELETE TO "authenticated" USING ("private"."is_app_admin"());


--
-- Name: design_tier_images Admins can delete design tier images; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can delete design tier images" ON "public"."design_tier_images" FOR DELETE TO "authenticated" USING ("private"."is_app_admin"());


--
-- Name: design_tiers Admins can delete design tiers; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can delete design tiers" ON "public"."design_tiers" FOR DELETE TO "authenticated" USING ("private"."is_app_admin"());


--
-- Name: gallery_groups Admins can delete gallery groups; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can delete gallery groups" ON "public"."gallery_groups" FOR DELETE TO "authenticated" USING ("private"."is_app_admin"());


--
-- Name: gallery_images Admins can delete gallery images; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can delete gallery images" ON "public"."gallery_images" FOR DELETE TO "authenticated" USING ("private"."is_app_admin"());


--
-- Name: aftercare_instructions Admins can delete instructions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can delete instructions" ON "public"."aftercare_instructions" FOR DELETE TO "authenticated" USING ("private"."is_app_admin"());


--
-- Name: policies Admins can delete policies; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can delete policies" ON "public"."policies" FOR DELETE TO "authenticated" USING ("private"."is_app_admin"());


--
-- Name: pricing_groups Admins can delete pricing groups; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can delete pricing groups" ON "public"."pricing_groups" FOR DELETE TO "authenticated" USING ("private"."is_app_admin"());


--
-- Name: pricing_items Admins can delete pricing items; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can delete pricing items" ON "public"."pricing_items" FOR DELETE TO "authenticated" USING ("private"."is_app_admin"());


--
-- Name: pricing_variants Admins can delete pricing variants; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can delete pricing variants" ON "public"."pricing_variants" FOR DELETE TO "authenticated" USING ("private"."is_app_admin"());


--
-- Name: testimonials Admins can delete testimonials; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can delete testimonials" ON "public"."testimonials" FOR DELETE TO "authenticated" USING ("private"."is_app_admin"());


--
-- Name: faqs Admins can insert FAQs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can insert FAQs" ON "public"."faqs" FOR INSERT TO "authenticated" WITH CHECK ("private"."is_app_admin"());


--
-- Name: availability_slots Admins can insert availability slots; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can insert availability slots" ON "public"."availability_slots" FOR INSERT TO "authenticated" WITH CHECK ("private"."is_app_admin"());


--
-- Name: booking_events Admins can insert booking events; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can insert booking events" ON "public"."booking_events" FOR INSERT TO "authenticated" WITH CHECK ("private"."is_app_admin"());


--
-- Name: booking_line_items Admins can insert booking line items; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can insert booking line items" ON "public"."booking_line_items" FOR INSERT TO "authenticated" WITH CHECK ("private"."is_app_admin"());


--
-- Name: booking_payments Admins can insert booking payments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can insert booking payments" ON "public"."booking_payments" FOR INSERT TO "authenticated" WITH CHECK ("private"."is_app_admin"());


--
-- Name: bookings Admins can insert bookings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can insert bookings" ON "public"."bookings" FOR INSERT TO "authenticated" WITH CHECK ("private"."is_app_admin"());


--
-- Name: user_credits Admins can insert credits; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can insert credits" ON "public"."user_credits" FOR INSERT TO "authenticated" WITH CHECK ("private"."is_app_admin"());


--
-- Name: deals Admins can insert deals; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can insert deals" ON "public"."deals" FOR INSERT TO "authenticated" WITH CHECK ("private"."is_app_admin"());


--
-- Name: design_tier_images Admins can insert design tier images; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can insert design tier images" ON "public"."design_tier_images" FOR INSERT TO "authenticated" WITH CHECK ("private"."is_app_admin"());


--
-- Name: design_tiers Admins can insert design tiers; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can insert design tiers" ON "public"."design_tiers" FOR INSERT TO "authenticated" WITH CHECK ("private"."is_app_admin"());


--
-- Name: gallery_groups Admins can insert gallery groups; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can insert gallery groups" ON "public"."gallery_groups" FOR INSERT TO "authenticated" WITH CHECK ("private"."is_app_admin"());


--
-- Name: gallery_images Admins can insert gallery images; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can insert gallery images" ON "public"."gallery_images" FOR INSERT TO "authenticated" WITH CHECK ("private"."is_app_admin"());


--
-- Name: aftercare_instructions Admins can insert instructions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can insert instructions" ON "public"."aftercare_instructions" FOR INSERT TO "authenticated" WITH CHECK ("private"."is_app_admin"());


--
-- Name: notification_logs Admins can insert notification logs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can insert notification logs" ON "public"."notification_logs" FOR INSERT TO "authenticated" WITH CHECK ("private"."is_app_admin"());


--
-- Name: policies Admins can insert policies; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can insert policies" ON "public"."policies" FOR INSERT TO "authenticated" WITH CHECK ("private"."is_app_admin"());


--
-- Name: booking_policy_acceptances Admins can insert policy acceptances; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can insert policy acceptances" ON "public"."booking_policy_acceptances" FOR INSERT TO "authenticated" WITH CHECK ("private"."is_app_admin"());


--
-- Name: pricing_groups Admins can insert pricing groups; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can insert pricing groups" ON "public"."pricing_groups" FOR INSERT TO "authenticated" WITH CHECK ("private"."is_app_admin"());


--
-- Name: pricing_items Admins can insert pricing items; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can insert pricing items" ON "public"."pricing_items" FOR INSERT TO "authenticated" WITH CHECK ("private"."is_app_admin"());


--
-- Name: pricing_variants Admins can insert pricing variants; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can insert pricing variants" ON "public"."pricing_variants" FOR INSERT TO "authenticated" WITH CHECK ("private"."is_app_admin"());


--
-- Name: testimonials Admins can insert testimonials; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can insert testimonials" ON "public"."testimonials" FOR INSERT TO "authenticated" WITH CHECK ("private"."is_app_admin"());


--
-- Name: admin_users Admins can read admin users; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can read admin users" ON "public"."admin_users" FOR SELECT TO "authenticated" USING ("private"."is_app_admin"());


--
-- Name: availability_slots Admins can read all availability slots; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can read all availability slots" ON "public"."availability_slots" FOR SELECT TO "authenticated" USING ("private"."is_app_admin"());


--
-- Name: booking_events Admins can read all booking events; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can read all booking events" ON "public"."booking_events" FOR SELECT TO "authenticated" USING ("private"."is_app_admin"());


--
-- Name: booking_line_items Admins can read all booking line items; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can read all booking line items" ON "public"."booking_line_items" FOR SELECT TO "authenticated" USING ("private"."is_app_admin"());


--
-- Name: booking_payments Admins can read all booking payments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can read all booking payments" ON "public"."booking_payments" FOR SELECT TO "authenticated" USING ("private"."is_app_admin"());


--
-- Name: bookings Admins can read all bookings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can read all bookings" ON "public"."bookings" FOR SELECT TO "authenticated" USING ("private"."is_app_admin"());


--
-- Name: cancellation_requests Admins can read all cancellation requests; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can read all cancellation requests" ON "public"."cancellation_requests" FOR SELECT TO "authenticated" USING ("private"."is_app_admin"());


--
-- Name: user_credits Admins can read all credits; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can read all credits" ON "public"."user_credits" FOR SELECT TO "authenticated" USING ("private"."is_app_admin"());


--
-- Name: deal_redemptions Admins can read all deal redemptions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can read all deal redemptions" ON "public"."deal_redemptions" FOR SELECT TO "authenticated" USING ("private"."is_app_admin"());


--
-- Name: deals Admins can read all deals; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can read all deals" ON "public"."deals" FOR SELECT TO "authenticated" USING ("private"."is_app_admin"());


--
-- Name: booking_inspo_prompts Admins can read all inspo prompts; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can read all inspo prompts" ON "public"."booking_inspo_prompts" FOR SELECT TO "authenticated" USING ("private"."is_app_admin"());


--
-- Name: notification_logs Admins can read all notification logs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can read all notification logs" ON "public"."notification_logs" FOR SELECT TO "authenticated" USING ("private"."is_app_admin"());


--
-- Name: booking_policy_acceptances Admins can read all policy acceptances; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can read all policy acceptances" ON "public"."booking_policy_acceptances" FOR SELECT TO "authenticated" USING ("private"."is_app_admin"());


--
-- Name: faqs Admins can update FAQs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can update FAQs" ON "public"."faqs" FOR UPDATE TO "authenticated" USING ("private"."is_app_admin"()) WITH CHECK ("private"."is_app_admin"());


--
-- Name: availability_slots Admins can update availability slots; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can update availability slots" ON "public"."availability_slots" FOR UPDATE TO "authenticated" USING ("private"."is_app_admin"()) WITH CHECK ("private"."is_app_admin"());


--
-- Name: booking_line_items Admins can update booking line items; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can update booking line items" ON "public"."booking_line_items" FOR UPDATE TO "authenticated" USING ("private"."is_app_admin"()) WITH CHECK ("private"."is_app_admin"());


--
-- Name: booking_payments Admins can update booking payments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can update booking payments" ON "public"."booking_payments" FOR UPDATE TO "authenticated" USING ("private"."is_app_admin"()) WITH CHECK ("private"."is_app_admin"());


--
-- Name: booking_settings Admins can update booking settings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can update booking settings" ON "public"."booking_settings" FOR UPDATE TO "authenticated" USING ("private"."is_app_admin"()) WITH CHECK ("private"."is_app_admin"());


--
-- Name: bookings Admins can update bookings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can update bookings" ON "public"."bookings" FOR UPDATE TO "authenticated" USING ("private"."is_app_admin"()) WITH CHECK ("private"."is_app_admin"());


--
-- Name: cancellation_requests Admins can update cancellation requests; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can update cancellation requests" ON "public"."cancellation_requests" FOR UPDATE TO "authenticated" USING ("private"."is_app_admin"()) WITH CHECK ("private"."is_app_admin"());


--
-- Name: user_credits Admins can update credits; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can update credits" ON "public"."user_credits" FOR UPDATE TO "authenticated" USING ("private"."is_app_admin"()) WITH CHECK ("private"."is_app_admin"());


--
-- Name: deal_redemptions Admins can update deal redemptions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can update deal redemptions" ON "public"."deal_redemptions" FOR UPDATE TO "authenticated" USING ("private"."is_app_admin"()) WITH CHECK ("private"."is_app_admin"());


--
-- Name: deals Admins can update deals; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can update deals" ON "public"."deals" FOR UPDATE TO "authenticated" USING ("private"."is_app_admin"()) WITH CHECK ("private"."is_app_admin"());


--
-- Name: design_tier_images Admins can update design tier images; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can update design tier images" ON "public"."design_tier_images" FOR UPDATE TO "authenticated" USING ("private"."is_app_admin"()) WITH CHECK ("private"."is_app_admin"());


--
-- Name: design_tiers Admins can update design tiers; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can update design tiers" ON "public"."design_tiers" FOR UPDATE TO "authenticated" USING ("private"."is_app_admin"()) WITH CHECK ("private"."is_app_admin"());


--
-- Name: gallery_groups Admins can update gallery groups; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can update gallery groups" ON "public"."gallery_groups" FOR UPDATE TO "authenticated" USING ("private"."is_app_admin"()) WITH CHECK ("private"."is_app_admin"());


--
-- Name: gallery_images Admins can update gallery images; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can update gallery images" ON "public"."gallery_images" FOR UPDATE TO "authenticated" USING ("private"."is_app_admin"()) WITH CHECK ("private"."is_app_admin"());


--
-- Name: aftercare_instructions Admins can update instructions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can update instructions" ON "public"."aftercare_instructions" FOR UPDATE TO "authenticated" USING ("private"."is_app_admin"()) WITH CHECK ("private"."is_app_admin"());


--
-- Name: notification_logs Admins can update notification logs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can update notification logs" ON "public"."notification_logs" FOR UPDATE TO "authenticated" USING ("private"."is_app_admin"()) WITH CHECK ("private"."is_app_admin"());


--
-- Name: policies Admins can update policies; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can update policies" ON "public"."policies" FOR UPDATE TO "authenticated" USING ("private"."is_app_admin"()) WITH CHECK ("private"."is_app_admin"());


--
-- Name: booking_policy_acceptances Admins can update policy acceptances; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can update policy acceptances" ON "public"."booking_policy_acceptances" FOR UPDATE TO "authenticated" USING ("private"."is_app_admin"()) WITH CHECK ("private"."is_app_admin"());


--
-- Name: pricing_groups Admins can update pricing groups; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can update pricing groups" ON "public"."pricing_groups" FOR UPDATE TO "authenticated" USING ("private"."is_app_admin"()) WITH CHECK ("private"."is_app_admin"());


--
-- Name: pricing_items Admins can update pricing items; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can update pricing items" ON "public"."pricing_items" FOR UPDATE TO "authenticated" USING ("private"."is_app_admin"()) WITH CHECK ("private"."is_app_admin"());


--
-- Name: pricing_variants Admins can update pricing variants; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can update pricing variants" ON "public"."pricing_variants" FOR UPDATE TO "authenticated" USING ("private"."is_app_admin"()) WITH CHECK ("private"."is_app_admin"());


--
-- Name: testimonials Admins can update testimonials; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can update testimonials" ON "public"."testimonials" FOR UPDATE TO "authenticated" USING ("private"."is_app_admin"()) WITH CHECK ("private"."is_app_admin"());


--
-- Name: design_tier_images Admins can view all (including inactive); Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can view all (including inactive)" ON "public"."design_tier_images" FOR SELECT TO "authenticated" USING ("private"."is_app_admin"());


--
-- Name: design_tiers Admins can view all (including inactive); Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can view all (including inactive)" ON "public"."design_tiers" FOR SELECT TO "authenticated" USING ("private"."is_app_admin"());


--
-- Name: faqs Admins can view all (including inactive); Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can view all (including inactive)" ON "public"."faqs" FOR SELECT TO "authenticated" USING ("private"."is_app_admin"());


--
-- Name: policies Admins can view all (including inactive); Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can view all (including inactive)" ON "public"."policies" FOR SELECT TO "authenticated" USING ("private"."is_app_admin"());


--
-- Name: pricing_groups Admins can view all (including inactive); Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can view all (including inactive)" ON "public"."pricing_groups" FOR SELECT TO "authenticated" USING ("private"."is_app_admin"());


--
-- Name: pricing_items Admins can view all (including inactive); Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can view all (including inactive)" ON "public"."pricing_items" FOR SELECT TO "authenticated" USING ("private"."is_app_admin"());


--
-- Name: pricing_variants Admins can view all (including inactive); Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can view all (including inactive)" ON "public"."pricing_variants" FOR SELECT TO "authenticated" USING ("private"."is_app_admin"());


--
-- Name: testimonials Admins can view all (including inactive); Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can view all (including inactive)" ON "public"."testimonials" FOR SELECT TO "authenticated" USING ("private"."is_app_admin"());


--
-- Name: gallery_groups Admins can view all gallery groups; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can view all gallery groups" ON "public"."gallery_groups" FOR SELECT TO "authenticated" USING ("private"."is_app_admin"());


--
-- Name: gallery_images Admins can view all gallery images; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can view all gallery images" ON "public"."gallery_images" FOR SELECT TO "authenticated" USING ("private"."is_app_admin"());


--
-- Name: aftercare_instructions Admins can view all instructions (including inactive)); Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can view all instructions (including inactive))" ON "public"."aftercare_instructions" FOR SELECT TO "authenticated" USING ("private"."is_app_admin"());


--
-- Name: profiles Admins can view all users; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can view all users" ON "public"."profiles" FOR SELECT TO "authenticated" USING ("private"."is_app_admin"());


--
-- Name: availability_slots Anonymous priority availability is restricted; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anonymous priority availability is restricted" ON "public"."availability_slots" AS RESTRICTIVE FOR SELECT TO "anon" USING ((NOT ("active" AND ("status" = 'available'::"public"."slot_status") AND "regulars_first" AND ("public_access_at" > "now"()))));


--
-- Name: availability_slots Authenticated priority availability is restricted; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated priority availability is restricted" ON "public"."availability_slots" AS RESTRICTIVE FOR SELECT TO "authenticated" USING (((NOT ("active" AND ("status" = 'available'::"public"."slot_status") AND "regulars_first" AND ("public_access_at" > "now"()))) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND "profiles"."is_regular")))));


--
-- Name: availability_slots Eligible users can read bookable availability slots; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Eligible users can read bookable availability slots" ON "public"."availability_slots" FOR SELECT TO "authenticated" USING ((("active" = true) AND ("status" = 'available'::"public"."slot_status") AND ("starts_at" > "now"()) AND (("public_access_at" <= "now"()) OR "private"."is_regular_user"())));


--
-- Name: admin_users Owners can delete admin users; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Owners can delete admin users" ON "public"."admin_users" FOR DELETE TO "authenticated" USING ("private"."is_app_owner"());


--
-- Name: admin_users Owners can insert admin users; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Owners can insert admin users" ON "public"."admin_users" FOR INSERT TO "authenticated" WITH CHECK ("private"."is_app_owner"());


--
-- Name: admin_users Owners can update admin users; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Owners can update admin users" ON "public"."admin_users" FOR UPDATE TO "authenticated" USING ("private"."is_app_owner"()) WITH CHECK ("private"."is_app_owner"());


--
-- Name: faqs Public can read active FAQs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public can read active FAQs" ON "public"."faqs" FOR SELECT TO "authenticated", "anon" USING (("active" = true));


--
-- Name: booking_settings Public can read active booking settings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public can read active booking settings" ON "public"."booking_settings" FOR SELECT TO "authenticated", "anon" USING (("active" = true));


--
-- Name: deals Public can read active deals; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public can read active deals" ON "public"."deals" FOR SELECT TO "authenticated", "anon" USING ((("active" = true) AND (("starts_at" IS NULL) OR ("starts_at" <= "now"())) AND (("ends_at" IS NULL) OR ("ends_at" >= "now"()))));


--
-- Name: design_tier_images Public can read active design tier images; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public can read active design tier images" ON "public"."design_tier_images" FOR SELECT TO "authenticated", "anon" USING (("active" = true));


--
-- Name: design_tiers Public can read active design tiers; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public can read active design tiers" ON "public"."design_tiers" FOR SELECT TO "authenticated", "anon" USING (("active" = true));


--
-- Name: gallery_groups Public can read active gallery groups; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public can read active gallery groups" ON "public"."gallery_groups" FOR SELECT TO "authenticated", "anon" USING (("active" = true));


--
-- Name: gallery_images Public can read active gallery images; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public can read active gallery images" ON "public"."gallery_images" FOR SELECT TO "authenticated", "anon" USING ((("active" = true) AND (EXISTS ( SELECT 1
   FROM "public"."gallery_groups" "gg"
  WHERE (("gg"."id" = "gallery_images"."group_id") AND ("gg"."active" = true))))));


--
-- Name: aftercare_instructions Public can read active instructions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public can read active instructions" ON "public"."aftercare_instructions" FOR SELECT TO "authenticated", "anon" USING (("active" = true));


--
-- Name: policies Public can read active policies; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public can read active policies" ON "public"."policies" FOR SELECT TO "authenticated", "anon" USING (("active" = true));


--
-- Name: pricing_groups Public can read active pricing groups; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public can read active pricing groups" ON "public"."pricing_groups" FOR SELECT TO "authenticated", "anon" USING (("active" = true));


--
-- Name: pricing_items Public can read active pricing items; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public can read active pricing items" ON "public"."pricing_items" FOR SELECT TO "authenticated", "anon" USING (("active" = true));


--
-- Name: pricing_variants Public can read active pricing variants; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public can read active pricing variants" ON "public"."pricing_variants" FOR SELECT TO "authenticated", "anon" USING (("active" = true));


--
-- Name: testimonials Public can read active testimonials; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public can read active testimonials" ON "public"."testimonials" FOR SELECT TO "authenticated", "anon" USING (("active" = true));


--
-- Name: cancellation_requests Users can create cancellation requests for their own bookings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can create cancellation requests for their own bookings" ON "public"."cancellation_requests" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = "auth"."uid"()) AND "private"."user_owns_booking"("booking_id")));


--
-- Name: deal_redemptions Users can create their own deal redemptions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can create their own deal redemptions" ON "public"."deal_redemptions" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));


--
-- Name: booking_inspo_prompts Users can create their own inspo prompts; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can create their own inspo prompts" ON "public"."booking_inspo_prompts" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = "auth"."uid"()) AND "private"."user_owns_booking"("booking_id")));


--
-- Name: booking_events Users can read events for their own bookings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can read events for their own bookings" ON "public"."booking_events" FOR SELECT TO "authenticated" USING ((("booking_id" IS NOT NULL) AND "private"."user_owns_booking"("booking_id")));


--
-- Name: availability_slots Users can read slots for their own bookings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can read slots for their own bookings" ON "public"."availability_slots" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."bookings"
  WHERE (("bookings"."slot_id" = "availability_slots"."id") AND ("bookings"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));


--
-- Name: admin_users Users can read their own admin status; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can read their own admin status" ON "public"."admin_users" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) AND ("active" = true)));


--
-- Name: booking_line_items Users can read their own booking line items; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can read their own booking line items" ON "public"."booking_line_items" FOR SELECT TO "authenticated" USING ("private"."user_owns_booking"("booking_id"));


--
-- Name: booking_payments Users can read their own booking payments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can read their own booking payments" ON "public"."booking_payments" FOR SELECT TO "authenticated" USING ("private"."user_owns_booking"("booking_id"));


--
-- Name: bookings Users can read their own bookings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can read their own bookings" ON "public"."bookings" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));


--
-- Name: cancellation_requests Users can read their own cancellation requests; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can read their own cancellation requests" ON "public"."cancellation_requests" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));


--
-- Name: user_credits Users can read their own credits; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can read their own credits" ON "public"."user_credits" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));


--
-- Name: deal_redemptions Users can read their own deal redemptions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can read their own deal redemptions" ON "public"."deal_redemptions" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));


--
-- Name: booking_inspo_prompts Users can read their own inspo prompts; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can read their own inspo prompts" ON "public"."booking_inspo_prompts" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));


--
-- Name: notification_logs Users can read their own notification logs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can read their own notification logs" ON "public"."notification_logs" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));


--
-- Name: booking_policy_acceptances Users can read their own policy acceptances; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can read their own policy acceptances" ON "public"."booking_policy_acceptances" FOR SELECT TO "authenticated" USING ("private"."user_owns_booking"("booking_id"));


--
-- Name: profiles Users can read their own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can read their own profile" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("id" = "auth"."uid"()));


--
-- Name: booking_inspo_prompts Users can update their own inspo prompts; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own inspo prompts" ON "public"."booking_inspo_prompts" FOR UPDATE TO "authenticated" USING ((("user_id" = "auth"."uid"()) AND "private"."user_owns_booking"("booking_id"))) WITH CHECK ((("user_id" = "auth"."uid"()) AND "private"."user_owns_booking"("booking_id")));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("id" = "auth"."uid"())) WITH CHECK (("id" = "auth"."uid"()));


--
-- Name: admin_users; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."admin_users" ENABLE ROW LEVEL SECURITY;

--
-- Name: aftercare_instructions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."aftercare_instructions" ENABLE ROW LEVEL SECURITY;

--
-- Name: availability_slots; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."availability_slots" ENABLE ROW LEVEL SECURITY;

--
-- Name: booking_events; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."booking_events" ENABLE ROW LEVEL SECURITY;

--
-- Name: booking_inspo_prompts; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."booking_inspo_prompts" ENABLE ROW LEVEL SECURITY;

--
-- Name: booking_line_items; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."booking_line_items" ENABLE ROW LEVEL SECURITY;

--
-- Name: booking_payment_audit_log; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."booking_payment_audit_log" ENABLE ROW LEVEL SECURITY;

--
-- Name: booking_payments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."booking_payments" ENABLE ROW LEVEL SECURITY;

--
-- Name: booking_policy_acceptances; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."booking_policy_acceptances" ENABLE ROW LEVEL SECURITY;

--
-- Name: booking_settings; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."booking_settings" ENABLE ROW LEVEL SECURITY;

--
-- Name: bookings; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."bookings" ENABLE ROW LEVEL SECURITY;

--
-- Name: cancellation_requests; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."cancellation_requests" ENABLE ROW LEVEL SECURITY;

--
-- Name: deal_redemptions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."deal_redemptions" ENABLE ROW LEVEL SECURITY;

--
-- Name: deals; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."deals" ENABLE ROW LEVEL SECURITY;

--
-- Name: design_tier_images; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."design_tier_images" ENABLE ROW LEVEL SECURITY;

--
-- Name: design_tiers; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."design_tiers" ENABLE ROW LEVEL SECURITY;

--
-- Name: faqs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."faqs" ENABLE ROW LEVEL SECURITY;

--
-- Name: gallery_groups; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."gallery_groups" ENABLE ROW LEVEL SECURITY;

--
-- Name: gallery_images; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."gallery_images" ENABLE ROW LEVEL SECURITY;

--
-- Name: google_calendar_integrations; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."google_calendar_integrations" ENABLE ROW LEVEL SECURITY;

--
-- Name: notification_logs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."notification_logs" ENABLE ROW LEVEL SECURITY;

--
-- Name: policies; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."policies" ENABLE ROW LEVEL SECURITY;

--
-- Name: pricing_groups; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."pricing_groups" ENABLE ROW LEVEL SECURITY;

--
-- Name: pricing_items; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."pricing_items" ENABLE ROW LEVEL SECURITY;

--
-- Name: pricing_variants; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."pricing_variants" ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;

--
-- Name: testimonials; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."testimonials" ENABLE ROW LEVEL SECURITY;

--
-- Name: user_credits; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."user_credits" ENABLE ROW LEVEL SECURITY;

--
-- Name: website_fee_invoice_lines; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."website_fee_invoice_lines" ENABLE ROW LEVEL SECURITY;

--
-- Name: website_fee_invoices; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."website_fee_invoices" ENABLE ROW LEVEL SECURITY;

--
-- Name: website_fee_workflow_runs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."website_fee_workflow_runs" ENABLE ROW LEVEL SECURITY;

--
-- Name: SCHEMA "public"; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";


--
-- Name: FUNCTION "has_admin_claim"(); Type: ACL; Schema: private; Owner: postgres
--

REVOKE ALL ON FUNCTION "private"."has_admin_claim"() FROM PUBLIC;


--
-- Name: FUNCTION "has_admin_record"(); Type: ACL; Schema: private; Owner: postgres
--

REVOKE ALL ON FUNCTION "private"."has_admin_record"() FROM PUBLIC;


--
-- Name: FUNCTION "has_owner_claim"(); Type: ACL; Schema: private; Owner: postgres
--

REVOKE ALL ON FUNCTION "private"."has_owner_claim"() FROM PUBLIC;


--
-- Name: FUNCTION "has_owner_record"(); Type: ACL; Schema: private; Owner: postgres
--

REVOKE ALL ON FUNCTION "private"."has_owner_record"() FROM PUBLIC;


--
-- Name: FUNCTION "is_active_admin"(); Type: ACL; Schema: private; Owner: postgres
--

REVOKE ALL ON FUNCTION "private"."is_active_admin"() FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."is_active_admin"() TO "authenticated";


--
-- Name: FUNCTION "is_app_admin"(); Type: ACL; Schema: private; Owner: postgres
--

REVOKE ALL ON FUNCTION "private"."is_app_admin"() FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."is_app_admin"() TO "authenticated";


--
-- Name: FUNCTION "is_app_owner"(); Type: ACL; Schema: private; Owner: postgres
--

REVOKE ALL ON FUNCTION "private"."is_app_owner"() FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."is_app_owner"() TO "authenticated";


--
-- Name: FUNCTION "recalculate_booking_totals"("target_booking_id" "uuid"); Type: ACL; Schema: private; Owner: postgres
--

REVOKE ALL ON FUNCTION "private"."recalculate_booking_totals"("target_booking_id" "uuid") FROM PUBLIC;


--
-- Name: FUNCTION "sync_profile_display_name_to_auth"(); Type: ACL; Schema: private; Owner: postgres
--

REVOKE ALL ON FUNCTION "private"."sync_profile_display_name_to_auth"() FROM PUBLIC;


--
-- Name: FUNCTION "trigger_recalculate_booking_totals"(); Type: ACL; Schema: private; Owner: postgres
--

REVOKE ALL ON FUNCTION "private"."trigger_recalculate_booking_totals"() FROM PUBLIC;


--
-- Name: FUNCTION "trigger_recalculate_booking_totals_from_booking"(); Type: ACL; Schema: private; Owner: postgres
--

REVOKE ALL ON FUNCTION "private"."trigger_recalculate_booking_totals_from_booking"() FROM PUBLIC;


--
-- Name: FUNCTION "audit_booking_payment_change"(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION "public"."audit_booking_payment_change"() FROM PUBLIC;


--
-- Name: FUNCTION "handle_new_user"(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";


--
-- Name: FUNCTION "issue_website_fee_invoice"("p_billing_month" "date", "p_notes" "text", "p_issued_by" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION "public"."issue_website_fee_invoice"("p_billing_month" "date", "p_notes" "text", "p_issued_by" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."issue_website_fee_invoice"("p_billing_month" "date", "p_notes" "text", "p_issued_by" "uuid") TO "service_role";


--
-- Name: FUNCTION "protect_website_fee_invoice"(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION "public"."protect_website_fee_invoice"() FROM PUBLIC;


--
-- Name: FUNCTION "protect_website_fee_invoice_line"(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION "public"."protect_website_fee_invoice_line"() FROM PUBLIC;


--
-- Name: FUNCTION "rls_auto_enable"(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION "public"."rls_auto_enable"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";


--
-- Name: FUNCTION "set_updated_at"(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION "public"."set_updated_at"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";


--
-- Name: FUNCTION "sync_profile_from_auth_user"(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION "public"."sync_profile_from_auth_user"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."sync_profile_from_auth_user"() TO "service_role";


--
-- Name: TABLE "admin_users"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."admin_users" TO "anon";
GRANT ALL ON TABLE "public"."admin_users" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_users" TO "service_role";


--
-- Name: TABLE "aftercare_instructions"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."aftercare_instructions" TO "anon";
GRANT ALL ON TABLE "public"."aftercare_instructions" TO "authenticated";
GRANT ALL ON TABLE "public"."aftercare_instructions" TO "service_role";


--
-- Name: TABLE "availability_slots"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."availability_slots" TO "anon";
GRANT ALL ON TABLE "public"."availability_slots" TO "authenticated";
GRANT ALL ON TABLE "public"."availability_slots" TO "service_role";


--
-- Name: TABLE "booking_events"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."booking_events" TO "anon";
GRANT ALL ON TABLE "public"."booking_events" TO "authenticated";
GRANT ALL ON TABLE "public"."booking_events" TO "service_role";


--
-- Name: TABLE "booking_inspo_prompts"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."booking_inspo_prompts" TO "anon";
GRANT ALL ON TABLE "public"."booking_inspo_prompts" TO "authenticated";
GRANT ALL ON TABLE "public"."booking_inspo_prompts" TO "service_role";


--
-- Name: TABLE "booking_line_items"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."booking_line_items" TO "anon";
GRANT ALL ON TABLE "public"."booking_line_items" TO "authenticated";
GRANT ALL ON TABLE "public"."booking_line_items" TO "service_role";


--
-- Name: TABLE "booking_payment_audit_log"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."booking_payment_audit_log" TO "service_role";


--
-- Name: SEQUENCE "booking_payment_audit_log_id_seq"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE "public"."booking_payment_audit_log_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."booking_payment_audit_log_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."booking_payment_audit_log_id_seq" TO "service_role";


--
-- Name: TABLE "booking_payments"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."booking_payments" TO "anon";
GRANT ALL ON TABLE "public"."booking_payments" TO "authenticated";
GRANT ALL ON TABLE "public"."booking_payments" TO "service_role";


--
-- Name: TABLE "booking_policy_acceptances"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."booking_policy_acceptances" TO "anon";
GRANT ALL ON TABLE "public"."booking_policy_acceptances" TO "authenticated";
GRANT ALL ON TABLE "public"."booking_policy_acceptances" TO "service_role";


--
-- Name: TABLE "booking_settings"; Type: ACL; Schema: public; Owner: postgres
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."booking_settings" TO "anon";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."booking_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."booking_settings" TO "service_role";


--
-- Name: COLUMN "booking_settings"."id"; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT("id") ON TABLE "public"."booking_settings" TO "anon";
GRANT SELECT("id") ON TABLE "public"."booking_settings" TO "authenticated";


--
-- Name: COLUMN "booking_settings"."deposit_amount"; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT("deposit_amount") ON TABLE "public"."booking_settings" TO "anon";
GRANT SELECT("deposit_amount") ON TABLE "public"."booking_settings" TO "authenticated";


--
-- Name: COLUMN "booking_settings"."booking_fee_rate"; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT("booking_fee_rate") ON TABLE "public"."booking_settings" TO "anon";
GRANT SELECT("booking_fee_rate") ON TABLE "public"."booking_settings" TO "authenticated";


--
-- Name: COLUMN "booking_settings"."booking_fee_mode"; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT("booking_fee_mode") ON TABLE "public"."booking_settings" TO "anon";
GRANT SELECT("booking_fee_mode") ON TABLE "public"."booking_settings" TO "authenticated";


--
-- Name: COLUMN "booking_settings"."hold_minutes"; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT("hold_minutes") ON TABLE "public"."booking_settings" TO "anon";
GRANT SELECT("hold_minutes") ON TABLE "public"."booking_settings" TO "authenticated";


--
-- Name: COLUMN "booking_settings"."etransfer_email"; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT("etransfer_email") ON TABLE "public"."booking_settings" TO "anon";
GRANT SELECT("etransfer_email") ON TABLE "public"."booking_settings" TO "authenticated";


--
-- Name: COLUMN "booking_settings"."instagram_url"; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT("instagram_url") ON TABLE "public"."booking_settings" TO "anon";
GRANT SELECT("instagram_url") ON TABLE "public"."booking_settings" TO "authenticated";


--
-- Name: COLUMN "booking_settings"."active"; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT("active") ON TABLE "public"."booking_settings" TO "anon";
GRANT SELECT("active") ON TABLE "public"."booking_settings" TO "authenticated";


--
-- Name: COLUMN "booking_settings"."created_at"; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT("created_at") ON TABLE "public"."booking_settings" TO "anon";
GRANT SELECT("created_at") ON TABLE "public"."booking_settings" TO "authenticated";


--
-- Name: COLUMN "booking_settings"."updated_at"; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT("updated_at") ON TABLE "public"."booking_settings" TO "anon";
GRANT SELECT("updated_at") ON TABLE "public"."booking_settings" TO "authenticated";


--
-- Name: COLUMN "booking_settings"."regular_early_access_hours"; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT("regular_early_access_hours") ON TABLE "public"."booking_settings" TO "anon";
GRANT SELECT("regular_early_access_hours") ON TABLE "public"."booking_settings" TO "authenticated";


--
-- Name: TABLE "bookings"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."bookings" TO "anon";
GRANT ALL ON TABLE "public"."bookings" TO "authenticated";
GRANT ALL ON TABLE "public"."bookings" TO "service_role";


--
-- Name: TABLE "booking_totals_view"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."booking_totals_view" TO "anon";
GRANT ALL ON TABLE "public"."booking_totals_view" TO "authenticated";
GRANT ALL ON TABLE "public"."booking_totals_view" TO "service_role";


--
-- Name: TABLE "cancellation_requests"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."cancellation_requests" TO "anon";
GRANT ALL ON TABLE "public"."cancellation_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."cancellation_requests" TO "service_role";


--
-- Name: TABLE "deal_redemptions"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."deal_redemptions" TO "anon";
GRANT ALL ON TABLE "public"."deal_redemptions" TO "authenticated";
GRANT ALL ON TABLE "public"."deal_redemptions" TO "service_role";


--
-- Name: TABLE "deals"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."deals" TO "anon";
GRANT ALL ON TABLE "public"."deals" TO "authenticated";
GRANT ALL ON TABLE "public"."deals" TO "service_role";


--
-- Name: TABLE "design_tier_images"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."design_tier_images" TO "anon";
GRANT ALL ON TABLE "public"."design_tier_images" TO "authenticated";
GRANT ALL ON TABLE "public"."design_tier_images" TO "service_role";


--
-- Name: TABLE "design_tiers"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."design_tiers" TO "anon";
GRANT ALL ON TABLE "public"."design_tiers" TO "authenticated";
GRANT ALL ON TABLE "public"."design_tiers" TO "service_role";


--
-- Name: TABLE "faqs"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."faqs" TO "anon";
GRANT ALL ON TABLE "public"."faqs" TO "authenticated";
GRANT ALL ON TABLE "public"."faqs" TO "service_role";


--
-- Name: TABLE "gallery_groups"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."gallery_groups" TO "anon";
GRANT ALL ON TABLE "public"."gallery_groups" TO "authenticated";
GRANT ALL ON TABLE "public"."gallery_groups" TO "service_role";


--
-- Name: TABLE "gallery_images"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."gallery_images" TO "anon";
GRANT ALL ON TABLE "public"."gallery_images" TO "authenticated";
GRANT ALL ON TABLE "public"."gallery_images" TO "service_role";


--
-- Name: TABLE "google_calendar_integrations"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."google_calendar_integrations" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."google_calendar_integrations" TO "authenticated";


--
-- Name: TABLE "website_fee_payment_details"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."website_fee_payment_details" TO "service_role";


--
-- Name: TABLE "monthly_website_fee_totals"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."monthly_website_fee_totals" TO "service_role";


--
-- Name: TABLE "notification_logs"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."notification_logs" TO "anon";
GRANT ALL ON TABLE "public"."notification_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_logs" TO "service_role";


--
-- Name: TABLE "policies"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."policies" TO "anon";
GRANT ALL ON TABLE "public"."policies" TO "authenticated";
GRANT ALL ON TABLE "public"."policies" TO "service_role";


--
-- Name: TABLE "pricing_groups"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."pricing_groups" TO "anon";
GRANT ALL ON TABLE "public"."pricing_groups" TO "authenticated";
GRANT ALL ON TABLE "public"."pricing_groups" TO "service_role";


--
-- Name: TABLE "pricing_items"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."pricing_items" TO "anon";
GRANT ALL ON TABLE "public"."pricing_items" TO "authenticated";
GRANT ALL ON TABLE "public"."pricing_items" TO "service_role";


--
-- Name: TABLE "pricing_variants"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."pricing_variants" TO "anon";
GRANT ALL ON TABLE "public"."pricing_variants" TO "authenticated";
GRANT ALL ON TABLE "public"."pricing_variants" TO "service_role";


--
-- Name: TABLE "profiles"; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."profiles" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";


--
-- Name: COLUMN "profiles"."display_name"; Type: ACL; Schema: public; Owner: postgres
--

GRANT UPDATE("display_name") ON TABLE "public"."profiles" TO "authenticated";


--
-- Name: COLUMN "profiles"."phone"; Type: ACL; Schema: public; Owner: postgres
--

GRANT UPDATE("phone") ON TABLE "public"."profiles" TO "authenticated";


--
-- Name: COLUMN "profiles"."updated_at"; Type: ACL; Schema: public; Owner: postgres
--

GRANT UPDATE("updated_at") ON TABLE "public"."profiles" TO "authenticated";


--
-- Name: COLUMN "profiles"."instagram_handle"; Type: ACL; Schema: public; Owner: postgres
--

GRANT UPDATE("instagram_handle") ON TABLE "public"."profiles" TO "authenticated";


--
-- Name: COLUMN "profiles"."preferred_contact_method"; Type: ACL; Schema: public; Owner: postgres
--

GRANT UPDATE("preferred_contact_method") ON TABLE "public"."profiles" TO "authenticated";


--
-- Name: TABLE "testimonials"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."testimonials" TO "anon";
GRANT ALL ON TABLE "public"."testimonials" TO "authenticated";
GRANT ALL ON TABLE "public"."testimonials" TO "service_role";


--
-- Name: TABLE "user_credits"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."user_credits" TO "anon";
GRANT ALL ON TABLE "public"."user_credits" TO "authenticated";
GRANT ALL ON TABLE "public"."user_credits" TO "service_role";


--
-- Name: TABLE "website_fee_invoice_due_now"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."website_fee_invoice_due_now" TO "service_role";


--
-- Name: TABLE "website_fee_invoice_lines"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."website_fee_invoice_lines" TO "service_role";


--
-- Name: TABLE "website_fee_invoices"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."website_fee_invoices" TO "service_role";


--
-- Name: TABLE "website_fee_invoice_evidence"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."website_fee_invoice_evidence" TO "service_role";


--
-- Name: TABLE "website_fee_invoice_register"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."website_fee_invoice_register" TO "service_role";


--
-- Name: TABLE "website_fee_invoice_source_drift"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."website_fee_invoice_source_drift" TO "service_role";


--
-- Name: TABLE "website_fee_payment_exceptions"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."website_fee_payment_exceptions" TO "service_role";


--
-- Name: TABLE "website_fee_ready_to_issue"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."website_fee_ready_to_issue" TO "service_role";


--
-- Name: TABLE "website_fee_workflow_runs"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."website_fee_workflow_runs" TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";


--
-- PostgreSQL database dump complete
--

-- Internal accounting records are reachable only through trusted server code.
-- RLS remains enabled as defense in depth; removing every table/sequence
-- privilege also prevents non-row operations such as TRUNCATE.
REVOKE ALL PRIVILEGES ON TABLE
  public.booking_payment_audit_log,
  public.website_fee_invoice_lines,
  public.website_fee_invoices,
  public.website_fee_workflow_runs
FROM anon, authenticated;

REVOKE ALL PRIVILEGES ON SEQUENCE
  public.booking_payment_audit_log_id_seq
FROM anon, authenticated;

GRANT ALL PRIVILEGES ON TABLE
  public.booking_payment_audit_log,
  public.website_fee_invoice_lines,
  public.website_fee_invoices,
  public.website_fee_workflow_runs
TO service_role;

GRANT ALL PRIVILEGES ON SEQUENCE
  public.booking_payment_audit_log_id_seq
TO service_role;

-- \unrestrict BL0n2zNyaZKUTfoCpfS4nQ8fhoJKjdeIF646awNNGavMuFpwjZ8BLiUMc7vqr4G
