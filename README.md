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

The database schema is not reproducible from this repository alone because
Supabase migrations are not currently checked in. A new developer therefore
needs access to the existing project or a separately supplied schema backup.

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

## Available scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local Next.js development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve a completed production build |
| `npm run lint` | Run ESLint |

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

For route groups, data flow, integrations, and security boundaries, read the
[architecture guide](docs/architecture.md).

## Documentation

- [Documentation index](docs/README.md)
- [Setup and configuration](docs/setup.md)
- [Architecture](docs/architecture.md)
- [Transactional email matrix](docs/email-notifications.md)
- [Google Calendar manual verification](docs/google-calendar-manual-tests.md)
- [Freestyle booking manual verification](docs/freestyle-booking-manual-tests.md)

## Deployment

The application is designed for Vercel. Configure all environment variables in
the target Vercel environments before deploying. `vercel.json` schedules the
appointment-reminder endpoint daily at 12:00 UTC.

Production deployments should use the production site URL for
`NEXT_PUBLIC_SITE_URL` and the matching Google OAuth callback URL. Never expose
the Supabase secret key, Brevo key, Google client secret, cron secret, or token
encryption key to browser code.

## License

Licensed under the [GNU General Public License v3.0](LICENSE).
