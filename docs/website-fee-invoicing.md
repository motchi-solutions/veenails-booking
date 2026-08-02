# Website fee invoicing

## Business rule

The studio absorbs a 3% website fee. Eligibility is based on when money is
recorded as paid, not the appointment date. Eligible deposits and final
payments paid on or after August 1, 2026 are included; eligible refunds reduce
the total. A payment discovered late remains uninvoiced evidence and is picked
up by the next safe run.

The scheduled run on the first of the month evaluates the previous closed
Toronto calendar month. Its period end is exclusive. For example, the August
invoice covers `2026-08-01` through, but not including, `2026-09-01`.

## Monthly sequence

1. Vercel calls `/api/cron/website-fees` using `CRON_SECRET`.
2. `website_fee_ready_to_issue` calculates the previous month and all older
   uninvoiced eligible payments.
3. The workflow checks payment exceptions and whether evidence behind an
   existing invoice has changed.
4. If a check fails, only `admin@motchi.ca` receives a review email.
5. After records are corrected, the signed link displays a confirmation page.
   Its POST action reruns every check; simply opening the email does not issue
   an invoice.
6. When checks pass, the database function creates an invoice and immutable
   evidence lines in one transaction.
7. The PDF is emailed to `admin@motchi.ca`, with
   `vee.nailsstudio@gmail.com` copied.

Invoices issued on or before the tenth are due on the tenth of that same month.
The scheduled run normally issues on the first. If review delays issuance until
after the tenth, the due date becomes the tenth of the following month so a new
invoice is never immediately overdue.

The invoice identifies the supplier as **Mohamad Nakouzi, carrying on business
as Motchi Solutions**, and identifies **Motchi Websites** as the client-facing
brand. Payment is shown as payable to Mohamad Nakouzi. The customer column is
addressed to **Veronica Vicena, Owner, Vee's Nail Studio**. This displays both
the sole proprietor and registered business name without presenting the brand
as a separate legal entity.

Retries are idempotent: a month has at most one non-void invoice, source
payments cannot appear in two active invoices, and email delivery uses a stable
deduplication key.

## What to inspect for proof

Use these service-role-only views in Supabase SQL Editor:

```sql
select * from public.monthly_website_fee_totals
order by billing_month desc;

select * from public.website_fee_payment_details
where billing_month = date '2026-08-01'
order by paid_at, booking_reference;

select * from public.website_fee_payment_exceptions
order by created_at;

select * from public.website_fee_invoice_source_drift;
```

`monthly_website_fee_totals` is the live monthly roll-up. Payment details are
the source proof. Exceptions must be zero before issuing. Source drift must also
be zero; it identifies a payment changed after its immutable invoice snapshot.

## What to inspect for issuance

```sql
select * from public.website_fee_ready_to_issue;
select * from public.website_fee_invoice_due_now;

select * from public.website_fee_invoice_register
order by billing_month desc;

select * from public.website_fee_invoice_evidence
order by issued_at desc, paid_at_snapshot;

select * from public.website_fee_workflow_runs
order by billing_month desc;
```

Before issuance, `unresolved_exception_count` and `source_drift_count` must both
be zero. `website_fee_invoice_register` proves stored totals against evidence;
`fee_difference` must be zero. The attached PDF is generated from
`website_fee_invoice_evidence`, not mutable live payment rows.

The stored `due_date` is part of the invoice snapshot and becomes immutable
when the invoice is issued.

Supplier and customer addresses come from server-only environment variables.
The workflow validates both complete addresses before creating an immutable
invoice. The values stay out of source control and browser bundles, but they are
visible in the generated PDF by design. The PDF automatically wraps each value
inside its supplier or customer column.

## GST/HST status

A nine-digit business number does not by itself mean the business has a
GST/HST account. A GST/HST program account adds an `RT` identifier and reference
number, commonly `RT0001`, to the BN. Confirm the account list in CRA My
Business Account before describing the business as registered or charging tax.

Generally, a business remains a small supplier while gross revenue from taxable
supplies, including associated businesses where applicable, does not exceed
$30,000 in one calendar quarter or across the previous four consecutive
calendar quarters. Voluntary registration is still possible below that amount.
Until registration is confirmed, this invoice workflow does not calculate,
label, or collect GST/HST.

The four internal tables have RLS enabled with no client policies and all
`anon`/`authenticated` privileges revoked. Supabase may report
`rls_enabled_no_policy` as INFO. That is expected for these service-role-only
tables; do not add a permissive policy to silence it.

## Safe admin testing

Go to **Admin → Settings → Invoice diagnostics**.

- **Download test PDF** verifies PDF generation and browser download.
- **Email test invoice to me** verifies Brevo delivery and PDF attachment
  handling using the signed-in admin profile email.

Both options use obvious sample records and mark the file “TEST” and “NOT
PAYABLE.” They do not insert invoice or workflow records and never contact the
salon. Email attempts appear in `notification_logs` with type
`admin_website_fee_invoice_test` so provider failures can be diagnosed.

An actual invoice uses the same layout but replaces the test invoice number,
dates, sample bookings, revenue, and fee with the immutable values issued by the
database. The “TEST” and “NOT PAYABLE” labels are removed. Actual invoice
numbers use the `VEE-WEB-YYYYMM-…` format.

## Schema contribution rules

The initial baseline is `supabase/migrations/20260802185732_initial_schema.sql`.
It represents the live application-owned `public` and `private` schemas and the
two application triggers attached to `auth.users`. It contains no production
rows.

Never edit the applied baseline. Create and verify each later change:

```bash
npx supabase migration new descriptive_change_name
npx supabase db reset
npx supabase db lint
npx supabase migration list --linked
npx supabase db diff --linked --schema public,private
```

Review generated SQL before `npx supabase db push`. A remote push changes the
linked database; a local reset changes only local data. Do not drop an object
merely because it looks empty—confirm application references, database
dependencies, production usage, and a recovery path first.
