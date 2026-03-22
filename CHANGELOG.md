# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

- new `app/` frontend structure for Azure Static Web Apps
- public homepage based on the selected Vector Shield direction
- secure portal scaffold in `app/portal/`
- shared frontend styles, assets, and client-side validation
- Azure Functions backend scaffold in `api/`
- contact workflow endpoint
- magic-link authentication endpoints
- session lookup and logout endpoints
- Cosmos DB container model for users, auth, leads, and documents
- authenticated private document endpoints in `api/documents` and `api/document-download`
- private Blob sync script for internal documentation
- architecture and Azure setup documentation in English and Spanish
- initial security documentation in `docs/security.md`
- automated tests for validation and auth helpers

### Changed

- GitHub Actions workflow now points to `app/` and `api/`
- branding moved toward a stronger and more consistent visual identity
- security headers were tightened in Static Web Apps configuration
- portal now lists authenticated private documents backed by Cosmos metadata
- deployment is live at `https://www.knowdefend.com/` and `https://www.knowdefend.com/portal/`

### Security

- added server-side payload validation
- added client-side validation for contact and auth forms
- added honeypot fields for bot rejection
- added hashed token handling for sessions and magic links
- added no-store cache headers for sensitive endpoints
- added basic rate-limiting design using Cosmos TTL records
- validated secure session handling and logout flow over HTTPS in production

## [2026-03-21]

### Added

- initial review of the legacy site
- three design concepts under `concepts/`
- selected direction: Vector Shield
- logo and favicon exploration for the selected concept
