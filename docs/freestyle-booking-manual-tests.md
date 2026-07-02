# Freestyle booking verification

The target Supabase schema must include
`pricing_items.requires_design_tier`. This repository does not currently
contain the migration that introduced the column, so confirm the target project
has the expected schema before deploying or running these checks.

## Database smoke check

```sql
select slug, name, requires_design_tier
from public.pricing_items
where lower(slug) = 'freestyle'
   or lower(name) = 'freestyle';
```

Expected: Freestyle is `false`; other service rows remain `true`.

For a newly submitted Freestyle booking, verify its active line items:

```sql
select item_type, label_snapshot, unit_price, active, removed_at
from public.booking_line_items
where booking_id = '<booking-id>'
order by created_at;
```

Expected: one `service` row labelled `Freestyle`, optional valid removal/add-on
rows, and no `design_tier` row.

## Manual scenarios

1. Standard service
   - Select Apres Gel-X or Structured Gel Manicure.
   - Confirm the Design step appears and checkout cannot continue without a tier.
   - Submit and confirm the active line items and total include the selected tier.

2. Freestyle
   - Select Freestyle and its technician-designed option.
   - Confirm the stepper goes directly from Service to Review.
   - Confirm Review and Checkout contain no design-tier row or placeholder.
   - Submit and confirm the total uses the $85 Freestyle service price plus only
     valid removal/add-on charges.

3. Standard to Freestyle
   - Select a standard service and tier, then return and select Freestyle.
   - Confirm the prior tier is cleared, hidden, omitted from checkout, and not
     written as a line item.

4. Freestyle to standard
   - Select Freestyle, then change to a standard service.
   - Confirm the Design step returns and a new tier must be selected.

5. Admin create
   - Create a Freestyle appointment.
   - Confirm no design selector is shown, no tier is required, and no
     `design_tier` line item is created.

6. Admin edit
   - Change a standard appointment with an active tier to Freestyle.
   - Confirm the old tier line item becomes inactive with `removed_at` and the
     recalculated total excludes it.
   - Change back to a standard service and confirm saving is blocked until a
     new tier is selected.

7. Historic Freestyle booking
   - Open an older completed Freestyle booking that already has a tier line item.
   - Confirm the historic tier and original total still render unchanged.

8. Downstream summaries
   - Confirm new Freestyle appointments show `Freestyle` in client/admin
     summaries, reminder email content, and Google Calendar.
   - Confirm no nonexistent design tier is mentioned.
