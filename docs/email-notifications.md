# Transactional email matrix

All booking-scoped sends reserve a stable key in `notification_logs` before
calling Brevo. A `sent` row prevents a duplicate send, and a recent `pending`
row prevents concurrent delivery. Failed, skipped, and stale-pending rows are
reused for a later retry, so the unique deduplication key does not permanently
block recovery.

| Event | Client email | Admin copy | Deduplication key | Notification type |
| --- | --- | --- | --- | --- |
| Booking request submitted | Yes | BCC when configured | `{bookingId}:booking_requested` | `booking_requested` |
| Admin-created appointment | Yes, when email exists | No | `{bookingId}:admin_booking_created` | `admin_booking_created` |
| Appointment confirmed | Yes | No | `{bookingId}:appointment_confirmed` | `appointment_confirmed` |
| Deposit confirmed without a status change | Yes | No | `{bookingId}:deposit_confirmed` | `deposit_confirmed` |
| Appointment rejected | Yes | No | `{bookingId}:appointment_rejected` | `appointment_rejected` |
| Rejected with credit | One combined email | No | `{bookingId}:appointment_rejected_credit_issued` | `appointment_rejected_credit_issued` |
| Appointment cancelled by studio | Yes | No | `{bookingId}:admin_cancellation` | `admin_cancellation` |
| Cancellation request submitted | Yes | BCC when configured | `{bookingId}:cancellation_request_submitted` | `cancellation_request_submitted` |
| Cancellation request declined | Yes | No | `{bookingId}:cancellation_rejected` | `cancellation_rejected` |
| Date change requested | Yes | BCC when configured | `{bookingId}:date_change_request_submitted:{requestEventId}` | `date_change_request_submitted` |
| Date change approved | Yes | No | `{bookingId}:date_change_request_approved:{requestEventId}` | `date_change_request_approved` |
| Date change declined | Yes | No | `{bookingId}:date_change_request_declined:{requestEventId}` | `date_change_request_declined` |
| Credit issued | Yes | No | `credit_issued:{creditId}` | `credit_issued` |
| No-show | Yes | No | `{bookingId}:appointment_no_show` | `appointment_no_show` |
| Appointment completed | Yes | No | `{bookingId}:appointment_completed` | `appointment_completed` |
| 24-hour reminder | Yes | BCC when configured | `{bookingId}:appointment_reminder_24h` | `appointment_reminder_24h` |
| Design inspo ready | Admin only | N/A | `{bookingId}:admin_design_inspo_sent` | `admin_design_inspo_sent` |

If a client email is unavailable, Brevo is not called and the booking-scoped
notification is recorded as `skipped`.

## Configuration

These variables are server-only and must be configured independently in each
Vercel environment (Production, Preview, and Development):

- `BREVO_API_KEY`
- `BREVO_SENDER_EMAIL`
- `BREVO_SENDER_NAME`
- `ADMIN_NOTIFICATION_EMAIL`
- `NEXT_PUBLIC_SITE_URL` or the legacy `NEXT_PUBLIC_BASE_URL`

`BREVO_API_KEY` must never use a `NEXT_PUBLIC_` prefix. The configured sender
email or its domain must be authenticated in Brevo. After changing an
environment variable, redeploy that environment so server functions receive
the new value.

The Admin Settings page includes an admin-authenticated **Send test email**
control. It resolves the recipient from the signed-in admin profile, sends
through the configured Brevo sender, and records a `sent`, `failed`, or
`skipped` notification log. The UI only returns safe diagnostics; structured
server logs contain HTTP status/provider codes without API keys or raw provider
responses.

## Production verification

1. In Brevo, create or copy an active API v3 key and confirm the configured
   sender is active.
2. In Vercel, replace `BREVO_API_KEY` and verify all variables above in
   Production, Preview, and Development. Redeploy each changed environment.
3. Sign in as an admin, open `/admin/settings`, and send a test email.
4. Confirm the inbox receives it and the matching `notification_logs` row has
   `status = 'sent'` and a provider message ID.
5. Exercise a booking request and an admin status update. Confirm the action
   succeeds even if delivery fails, and verify the corresponding notification
   log.
