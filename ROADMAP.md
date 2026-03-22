# Roadmap

## Phase 1. Foundation

- finalize remaining content polish on the public homepage and portal
- keep the frontend static and lightweight
- extend automated tests around production-grade scenarios
- continue standardizing bilingual documentation

## Phase 2. Azure integration

- consolidate Azure resource layout across legacy and new resource groups
- finish wiring Blob settings and document operations in production
- complete Key Vault and secret-management cleanup
- wire Application Insights into the active Functions paths
- add production deploy validation steps

## Phase 3. Secure portal

- refine protected portal state for authenticated users
- expose richer private document metadata through backend authorization
- add document visibility rules by role, audience, or customer
- support better signed-in portal workflows beyond magic-link access

## Phase 4. Blob-backed content

- maintain `public-assets` and `private-docs` as the content backbone
- publish internal documentation through the private document workflow
- add public case studies and technical documents with metadata discipline
- decide between streamed downloads and short-lived SAS delivery
- add document previews or format-specific rendering in the portal

## Phase 5. Security hardening

- add Application Insights telemetry and dashboards
- add deployment smoke tests
- validate throttling behavior against real Cosmos containers
- review cookie and session lifecycle in production
- add document authorization tests
- validate private Blob access boundaries and failure paths

## Phase 6. Content and commercial maturity

- refine service copy for actual target clients
- add use cases, case studies, and technical one-pagers
- define the client onboarding flow
- prepare production deployment and go-live checklist
