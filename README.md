# KnowDefend

KnowDefend is the web platform for Defense Security LLC.

The project is being rebuilt as a clean Azure-based stack with:

- a public marketing site
- a secure client portal
- Azure Functions for backend workflows
- Cosmos DB for users, sessions, and leads
- Azure Blob Storage for future public and private documents
- Resend for transactional email

## Project goals

- present a more credible cybersecurity brand
- keep the frontend simple and maintainable
- add secure contact and authentication flows
- prepare a structure that can grow into a client-facing portal
- validate security controls before production deployment

## Current architecture

### Frontend

- `app/` is the Azure Static Web Apps frontend root
- `app/index.html` is the public homepage
- `app/portal/index.html` is the portal entry point

### Backend

- `api/contact` handles contact requests
- `api/request-magic-link` sends login links
- `api/verify-magic-link` validates links and creates sessions
- `api/me` returns current session state
- `api/logout` clears sessions

### Supporting services

- Azure Static Web Apps for hosting
- Azure Functions for backend endpoints
- Azure Cosmos DB for application data
- Azure Blob Storage for future document storage
- Azure Key Vault for secrets
- Azure Monitor / Application Insights for telemetry
- Resend for email delivery

## Repository structure

```text
app/      Public site and portal frontend
api/      Azure Functions backend
concepts/ Design exploration and prototypes
docs/     Architecture and security notes
```

## Local development

### Frontend preview

From the repository root:

```bash
python3 -m http.server 4173 --directory /home/codex/knowdefend
```

Useful paths:

- `/app/`
- `/app/portal/`
- `/concepts/`

### Backend

Install dependencies:

```bash
cd api
npm install
```

Run tests:

```bash
npm test
```

Run Azure Functions locally:

```bash
npx func start --port 7172
```

You will need a real `local.settings.json` based on `api/local.settings.example.json` to exercise the full backend flow.

## Security status

The project already includes:

- client and server-side validation
- honeypot fields for basic bot rejection
- basic request throttling design
- hashed magic-link and session tokens
- secure cookie settings
- restrictive security headers
- automated validation tests

See:

- [docs/architecture.md](./docs/architecture.md)
- [docs/security.md](./docs/security.md)
- [docs/azure-setup.md](./docs/azure-setup.md)

## Deployment direction

The current deployment target is Azure Static Web Apps with integrated Azure Functions.

The GitHub workflow is configured in:

- `.github/workflows/azure-static-web-apps-zealous-bush-0668be510.yml`

## Status

This is still a work in progress.

Core frontend, portal scaffolding, validation, and initial security controls are already in place.
Azure resource integration and end-to-end production setup are still pending.
