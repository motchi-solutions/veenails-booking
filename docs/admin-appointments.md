# Admin appointments and overview

The overview previews eight needs-action appointments and six future
appointments. Headings show **displayed of total**. **Show all** uses the same
filter as its overview section. Totals and search include all matching records,
fetched in stable pages of 100; they are not limited to the newest 100 bookings.

The appointments page keeps its full lists. Needs action and Upcoming are
collapsible, open by default, side by side on large screens and stacked on
small screens. The reusable `AdminCollapsibleSection` provides animated height,
opacity, a rotating chevron, keyboard controls, and reduced-motion support.

Only the saved `completed` status removes completed appointments from action
queues. Passing the scheduled time does not complete an appointment. Completed
details hide operational controls; payments, customer details, totals, and
expandable history remain readable. Costs, promotions, and payment balances use
`AppointmentTotals` across the completion dialog, admin, and client views.

## Completion

Choose **Mark appointment completed**, then normal payment, additional loyalty
percentage discount, or free loyalty courtesy. Cash refunds must be performed
outside the website and confirmed before saving. Existing account credit is
returned separately. Completion is an explicit admin action.

See [Website fee invoicing](website-fee-invoicing.md#unified-completion) for the
atomic transaction, invoice treatment, migrations, and regression tests.

## Release verification

1. Run `npm test`, `npm run lint`, `npx tsc --noEmit`, and `npm run build`.
2. Run `npx supabase db push --linked --dry-run`; check for unexpected migrations.
3. On desktop and mobile, expand/collapse both overview sections. Verify headings
   show displayed/total and Show all opens the complete matching list.
4. Confirm the appointments page still shows all matching appointments and
   search can find older records beyond the first 100.
5. Compare a paid appointment, unpaid appointment, discounted completion, and
   refunded courtesy on the admin and client detail pages.
6. Confirm completed appointments have no operational forms; a past confirmed
   appointment must still require explicit completion.

Database migration deployment and website deployment are separate steps.
Commit restored and new migration files along with the application changes so
future checkouts retain the same migration history.

## Audit notes (October 1, 2026)

The full automated check passed: production build, TypeScript, lint, and eleven
regression tests. All seven local migrations matched the linked database.
The dependency audit was cleared by updating Next.js, sharp, and compatible
transitive dependencies. `npm audit` reported zero vulnerabilities afterward.

Two live August invoice source rows require separate reconciliation:
`VEE-ZZZGB6` (received → credited) and `VEE-EZ7LFL` (received → forfeited).
Both retain their original $15 amounts and payment timestamps. No historical
financial records were changed during the audit. Supabase also reports that
leaked-password protection is disabled in Auth.

These checks do not replace the signed-in browser verification above or website
deployment. Application changes and recovered migrations must be committed
and deployed together.
