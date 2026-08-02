# Architecture

## Overview

Vee's Nail Studio Booking is a Next.js App Router application. Server
Components load most route data, Server Actions handle mutations, and Client
Components are reserved for interactive UI. Supabase provides authentication
and the Postgres data layer.

The studio's canonical time zone is `America/Toronto`. Booking and availability
logic should use the helpers in `src/lib/utils/studio-time.ts` rather than
assuming the server or browser time zone.

## Route groups

Route groups organize layouts without changing public URLs:

| Group | Purpose | Examples |
| --- | --- | --- |
| `(public)` | Public marketing content | `/` |
| `(auth)` | Authentication and onboarding | `/login`, `/signup`, `/complete-profile` |
| `(app)` | Authenticated client portal | `/dashboard`, `/book`, `/booking`, `/credits`, `/profile` |
| `(admin)` | Role-protected studio operations | `/admin/appointments`, `/admin/availability`, `/admin/users`, `/admin/settings` |

Route handlers provide the Supabase Auth callback, Google OAuth connection and
callback, and the scheduled appointment-reminder endpoint.

## Source organization

### `src/app`

Owns routes, layouts, loading and error boundaries, metadata, and HTTP route
handlers. Pages should primarily coordinate feature modules.

### `src/features`

Contains domain behavior grouped by capability:

- `admin` — appointment, availability, credit, user, and settings tools
- `auth` — actions, forms, guards, validation, and redirect handling
- `bookings` — booking creation, checkout, details, editing, and cancellation
- `credits` — client credit data and presentation
- `dashboard` — client overview and upcoming appointments
- `deals` — promotional content
- `integrations/google-calendar` — OAuth, synchronization, and event lifecycle
- `notifications` — email templates, delivery, recipient resolution, and reminders
- `profile` — onboarding, account details, and password/email updates
- `website-fees` — monthly checks, invoice snapshots, PDF rendering, review links, and delivery

Keep feature-specific actions, data access, validation, types, and components
inside their feature. Move code to `src/components`, `src/lib`, or `src/types`
only when it is genuinely shared across domains.

### Shared layers

- `src/components` contains shared UI, navigation, forms, feedback, and motion.
- `src/lib` contains infrastructure clients and cross-feature utilities.
- `src/constants` contains shared route and navigation configuration.
- `src/types` contains application types and generated Supabase database types.

## Authentication and authorization

`src/proxy.ts` runs the Supabase session refresh flow from
`src/lib/supabase/update-session.ts`. Server-side guards then enforce the route
requirements:

- `requireUser` requires a valid authenticated user.
- `requireCompleteProfile` requires completed onboarding.
- `requireAdmin` requires an active `admin_users` record.

Admin route checks are a UI and routing boundary, not the database security
boundary. Row Level Security must protect all Data API access. The
`SUPABASE_SECRET_KEY` client bypasses RLS and is restricted to server-only code;
every call site must perform its own authorization checks.

## Data access

The application uses three Supabase client factories:

| Client | Location | Intended use |
| --- | --- | --- |
| Browser client | `src/lib/supabase/client.ts` | Client Components acting as the signed-in user |
| Server client | `src/lib/supabase/server.ts` | Server Components, Server Actions, and Route Handlers acting as the signed-in user |
| Admin client | `src/lib/supabase/admin.ts` | Authorized server-only operations requiring elevated access |

`src/types/database.types.ts` is generated from the database. Avoid hand-editing
it; regenerate it when the schema changes. The repository contains a complete
schema baseline under `supabase/migrations`; applied migrations are immutable
and all later schema changes must be added as new migration files.

## Booking lifecycle

A client selects services and an available slot, reviews the checkout draft,
and submits a booking request. Booking line items preserve labels and prices as
snapshots so historical appointments do not change when the current pricing
catalog changes.

Admin actions advance booking status, manage deposits and credits, and may
reschedule or cancel appointments. Side effects are deliberately separated:

- Booking state persists in Supabase.
- Email sends are deduplicated through `notification_logs`.
- Calendar events are synchronized through the Google Calendar integration.

An external provider failure should be recorded for recovery without silently
duplicating notifications or calendar events.

## Integrations

### Brevo

Email configuration and provider calls live under `src/lib/email`; notification
templates and delivery orchestration live under `src/features/notifications`.
Booking-scoped messages reserve a stable deduplication key before delivery.

### Google Calendar

OAuth and API calls live under `src/features/integrations/google-calendar`.
Refresh tokens are encrypted before storage. Availability and confirmed
appointments share a managed event lifecycle so retries remain idempotent.

### Vercel Cron

`vercel.json` schedules `/api/cron/appointment-reminders` once daily and
`/api/cron/website-fees` on the first of each month. Both authenticate with
`CRON_SECRET`. The monthly workflow checks the previous closed Toronto month,
pauses on payment exceptions or source drift, and sends an immutable PDF only
after every check passes.

## Code conventions

- Prefer the `@/` alias over long relative imports.
- Keep secrets and privileged clients in modules marked `server-only`.
- Validate permissions again inside Server Actions; hiding controls is not
  authorization.
- Use Server Components by default and add `"use client"` only for browser
  state, effects, or event handlers.
- Reuse studio time and money utilities instead of duplicating formatting or
  date calculations.
- Add loading and error boundaries for data-heavy routes.
- Update the relevant operational guide when changing an integration or
  booking lifecycle.
