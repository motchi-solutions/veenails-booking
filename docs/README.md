# Documentation

## Developer guides

- [Setup and configuration](setup.md) covers local installation, environment
  variables, external services, admin access, and deployment.
- [Architecture](architecture.md) explains the source layout, route groups,
  request flow, integrations, and security boundaries.

## Operations and verification

- [Transactional email matrix](email-notifications.md) documents delivery
  triggers, deduplication, configuration, and production verification.
- [Google Calendar manual verification](google-calendar-manual-tests.md)
  covers availability and appointment event lifecycles.
- [Freestyle booking verification](freestyle-booking-manual-tests.md) covers
  service-selection behavior and database smoke checks.
- [Website fee invoicing](website-fee-invoicing.md) documents the 3% rule,
  monthly proof, invoice issuance, recovery workflow, and safe admin testing.

Keep operational behavior documented beside the relevant manual verification
guide. Update the root README when prerequisites, scripts, or major
capabilities change.
