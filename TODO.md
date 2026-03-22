# TODO

## High priority

- decide final cleanup strategy for the legacy root files
- add Blob environment variables to the production Static Web App if not already set
- validate private document listing and download flow in production after deploy
- decide whether to keep internal documentation in private Blob as markdown or export it to PDF

## Frontend

- refine homepage copy with the final service positioning
- decide whether to keep or reduce the footer logo size
- add dedicated sections for case studies and downloadable resources
- add richer authenticated document UX such as previews, language filters, and grouping

## Backend

- add real Cosmos integration tests once credentials exist
- add request logging and telemetry hooks
- review session invalidation strategy in multi-device scenarios
- add role or audience filters for private document visibility
- decide whether downloads should stream through Functions or use short-lived SAS URLs

## Security

- add negative tests for oversized payloads and malformed content types
- review secrets handling with Key Vault references
- add authorization tests for private document access and direct blob bypass attempts

## Documentation

- document Blob container conventions and naming rules
- document the private document publishing workflow from `docs/` to Blob
