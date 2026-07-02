# Setup and configuration

## Requirements

- Node.js 20 or newer
- npm
- Access to the configured Supabase project
- Brevo and Google Cloud credentials when working on those integrations

Install the locked dependencies with:

```bash
npm ci
```

Copy the environment template and add local credentials:

```bash
cp .env.example .env.local
```

`.env.local` is ignored by Git. Do not commit real credentials.

## Environment variables

### Supabase

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Project API URL from the Supabase Connect dialog |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Browser-safe publishable key; database access must still be protected by RLS |
| `SUPABASE_SECRET_KEY` | Yes | Server-only elevated key used by privileged application operations |

The secret key bypasses Row Level Security and must never be prefixed with
`NEXT_PUBLIC_`, logged, or used by a Client Component. The application keeps
its privileged client in `src/lib/supabase/admin.ts`.

This repository contains generated database types in
`src/types/database.types.ts`, but it does not contain the migrations needed to
create the database. Treat the configured Supabase project as the current
schema source of truth until migrations or a schema dump are added.

Supabase Auth must allow the application's callback URL:

```text
http://localhost:3000/auth/callback
```

Add the equivalent production and preview URLs in the Supabase Auth redirect
URL configuration when those environments are used.

For Google sign-in, enable the Google provider in Supabase Auth and configure
the Google OAuth client with the Supabase callback URL shown by the provider
settings. This is separate from the direct Google Calendar integration
described below.

Useful references:

- [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys)
- [Supabase server-side Auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs)

### Application URL

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Production | Canonical origin used for email links and metadata, without a trailing slash |

Local development defaults in `.env.example` to `http://localhost:3000`.
`NEXT_PUBLIC_BASE_URL` is still accepted by the code as a legacy fallback but
should not be used for new configuration.

### Transactional email

| Variable | Required | Description |
| --- | --- | --- |
| `BREVO_API_KEY` | For email | Server-only Brevo API v3 key |
| `BREVO_SENDER_EMAIL` | For email | Verified sender address |
| `BREVO_SENDER_NAME` | No | Sender display name; defaults to the studio name |
| `ADMIN_NOTIFICATION_EMAIL` | No | Address that receives applicable admin copies |
| `CRON_SECRET` | For reminders | Secret used to authorize the reminder endpoint |

Email failures do not roll back booking operations. They are recorded in
`notification_logs` for diagnosis or retry. See the
[transactional email matrix](email-notifications.md) for exact behavior.

Vercel invokes `/api/cron/appointment-reminders` daily at 12:00 UTC. The route
expects:

```text
Authorization: Bearer <CRON_SECRET>
```

### Google Calendar

| Variable | Required | Description |
| --- | --- | --- |
| `GOOGLE_CLIENT_ID` | For calendar sync | OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | For calendar sync | Server-only OAuth client secret |
| `GOOGLE_CALENDAR_REDIRECT_URI` | For calendar sync | Exact OAuth callback URL |
| `GOOGLE_CALENDAR_ENCRYPTION_KEY` | For calendar sync | Private key material used to encrypt refresh tokens and sign OAuth state |

For local development, configure this authorized redirect URI in Google Cloud:

```text
http://localhost:3000/api/google-calendar/callback
```

Create a separate production URI using the deployed origin. Enable the Google
Calendar API and configure an OAuth consent screen. The application requests
calendar event access and read-only calendar-list access.

Generate strong local encryption material with:

```bash
openssl rand -base64 32
```

Changing `GOOGLE_CALENDAR_ENCRYPTION_KEY` makes stored refresh tokens
undecryptable, so coordinate key rotation with reconnecting the integration.

## Running locally

Start the application:

```bash
npm run dev
```

The auth proxy refreshes Supabase sessions for application requests. Sign-up
may require email confirmation depending on the Supabase project's Auth
settings.

Admin routes require an authenticated user with an active row in
`public.admin_users`. Assign admin access through a controlled database process;
do not derive authorization from user-editable profile metadata.

## Deployment checklist

1. Create or link the Vercel project.
2. Add the required variables separately for Development, Preview, and
   Production.
3. Use environment-specific site and OAuth callback URLs.
4. Confirm Supabase Auth permits each deployed callback URL.
5. Confirm the Brevo sender or sender domain is verified.
6. Confirm `CRON_SECRET` is configured before enabling reminder delivery.
7. Deploy, then follow the email and Google Calendar manual verification
   guides in this directory.

Environment-variable changes require a new deployment before server functions
receive them.
