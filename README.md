# Vee's Nail Studio Booking

A full-service appointment portal for Vee's Nail Studio. Clients can create and
manage bookings, track credits, and maintain their profiles. Staff can manage
availability, appointments, customers, credits, notifications, and a connected
Google Calendar from a protected admin area.

## Features

- Email/password and Google authentication through Supabase Auth
- Guided booking, checkout, rescheduling, and cancellation flows
- Client dashboard, booking history, profile, and account credits
- Role-protected admin tools for appointments, availability, and users
- Transactional email delivery and deduplication through Brevo
- Google Calendar synchronization for availability and appointments
- Daily appointment-reminder job through Vercel Cron
- Monthly 3% website-fee checks, immutable invoice evidence, PDF generation,
  tenth-of-month due dates, and email delivery
- Admin diagnostics for transactional email and test invoice attachments
- Responsive public, client, and admin interfaces

## Technology

- Next.js 16 App Router and React 19
- TypeScript
- Supabase Auth and Postgres
- Tailwind CSS 4
- Brevo transactional email
- Google Calendar API
- Vercel hosting and Cron

## Quick start

### Prerequisites

- Node.js 20 or newer
- npm
- Access to the existing Supabase project and its configured database
- Supabase CLI access when changing or restoring the database schema

The complete application-owned database schema is checked in as a Supabase
baseline migration. Production data and secrets are intentionally excluded.

### Installation

```bash
git clone <repository-url>
cd veenails-booking
npm ci
cp .env.example .env.local
```

Fill in the required Supabase variables in `.env.local`, then start the
development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

See [Setup and configuration](docs/setup.md) for environment variables,
provider configuration, admin access, and deployment details.

### Local Supabase

With Docker running, create a fresh local database from the checked-in schema:

```bash
npx supabase start
npx supabase db reset
```

`db reset` deletes local Supabase data and rebuilds it from migrations. It does
not reset the linked production database. The baseline contains schema only,
so local users, bookings, and the booking-settings row must be seeded or
created for the flow being tested.

## Available scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local Next.js development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve a completed production build |
| `npm run lint` | Run ESLint |
| `npx supabase db reset` | Rebuild the local database from migrations |
| `npx supabase db lint` | Check local database functions and schema |
| `npx supabase migration list --linked` | Compare local and remote migration history |

## Project structure

```text
src/
├── app/          Routes, layouts, metadata, and route handlers
├── components/   Shared and navigation UI
├── constants/    Routes and shared static configuration
├── features/     Domain modules such as bookings, auth, and admin
├── lib/          Infrastructure clients and cross-feature utilities
└── types/        Shared and generated database types
```

Application code is organized by feature. Route files should stay thin and
compose data, actions, and UI from the relevant directory under `src/features`.
The `@/*` import alias points to `src/*`.

Database migrations live in `supabase/migrations`. The current starting point
is `20260802185732_initial_schema.sql`; do not edit that applied baseline. Every
new schema change must be a new migration created with:

```bash
npx supabase migration new descriptive_change_name
```

Test a new migration with a local reset and lint before proposing a remote
push. Never place production data, API keys, or customer information in one.

For route groups, data flow, integrations, and security boundaries, read the
[architecture guide](docs/architecture.md).

## Documentation

- [Documentation index](docs/README.md)
- [Setup and configuration](docs/setup.md)
- [Architecture](docs/architecture.md)
- [Transactional email matrix](docs/email-notifications.md)
- [Google Calendar manual verification](docs/google-calendar-manual-tests.md)
- [Freestyle booking manual verification](docs/freestyle-booking-manual-tests.md)
- [Website fee invoicing and monthly operations](docs/website-fee-invoicing.md)

## Contributing

1. Run `npm ci` and copy `.env.example` to `.env.local`.
2. Start Supabase locally when work touches database-backed behavior.
3. Keep changes in the relevant feature module and privileged code server-only.
4. Create a new migration for every schema change. Never rewrite an applied
   file or make an undocumented production-only Dashboard change.
5. Run `npm run lint` and `npm run build`.
6. For migrations, also run `npx supabase db reset`, `npx supabase db lint`,
   and review `npx supabase db diff --linked --schema public,private`.
7. Update the relevant guide when behavior, configuration, cron timing, or an
   operational recovery step changes.

Expect RLS to be the database security boundary. UI visibility is not
authorization. Supabase secret credentials, Brevo credentials, Google secrets,
cron secrets, and invoice workflow secrets must remain server-only and must
never use a `NEXT_PUBLIC_` prefix.

## Deployment

The application is designed for Vercel. Configure all environment variables in
the target Vercel environments before deploying. `vercel.json` schedules the
appointment-reminder endpoint daily at 12:00 UTC.

The schedules in `vercel.json` run appointment reminders daily at 12:00 UTC and
the website-fee workflow on the first day of every month at 14:00 UTC. During
daylight saving time that monthly run is 10:00 in Toronto.

Production deployments should use the production site URL for
`NEXT_PUBLIC_SITE_URL` and the matching Google OAuth callback URL. Never expose
the Supabase secret key, Brevo key, Google client secret, cron secret, or token
encryption key to browser code.

## License

Licensed under the [GNU General Public License v3.0](LICENSE).
