# Azure Setup Guide

This document defines the Azure resources used by the current KnowDefend stack and the expected configuration for operating it safely.

## Target stack

- Azure Static Web Apps
- Azure Functions
- Azure Cosmos DB
- Azure Storage Account
- Azure Key Vault
- Azure Monitor / Application Insights
- Resend

## Current known deployment state

- public site and portal are deployed through Azure Static Web Apps
- the current production-facing SWA resource is `knowdefend`
- the SWA resource lives in the legacy resource group `test`
- newer backend-supporting resources live in `rg-knowdefend-dev`
- Cosmos-backed contact and magic-link flows are working end to end

## Recommended creation order

1. Resource Group
2. Storage Account
3. Cosmos DB Account
4. Key Vault
5. Static Web App
6. Application Insights / Monitor connection
7. DNS and email sender setup for Resend

## Resource checklist

### 1. Resource Group

Suggested names:

- `rg-knowdefend-prod`
- `rg-knowdefend-dev`

### 2. Storage Account

Use for:

- Azure Functions storage dependency
- Blob containers for documents

Suggested containers:

- `public-assets`
- `private-docs`

Required values:

- `AzureWebJobsStorage`

### 3. Cosmos DB

Current dev account:

- `cosmos-knowdefend-dev`

Use a single database for v1:

- `knowdefend`

Containers:

- `users`
- `auth`
- `leads`
- `documents`

Required values:

- `COSMOS_DB_ENDPOINT`
- `COSMOS_DB_KEY`
- `COSMOS_DB_DATABASE`
- `COSMOS_DB_CONTAINER_USERS`
- `COSMOS_DB_CONTAINER_AUTH`
- `COSMOS_DB_CONTAINER_LEADS`
- `COSMOS_DB_CONTAINER_DOCUMENTS`

### 4. Key Vault

Current dev vault:

- `kv-knowdefend-dev`

Store:

- `RESEND_API_KEY`
- Cosmos DB key
- storage connection string if you want to centralize it

Recommended app setting approach:

- keep Key Vault as the source of record for secrets
- for this stack, some values may still be entered directly into SWA environment variables for compatibility and operational simplicity

### 5. Azure Static Web App

Current production-facing SWA:

- `knowdefend`

Repository layout:

- app location: `app`
- api location: `api`

Expected output:

- public site under `/`
- portal under `/portal/`
- serverless endpoints under `/api/*`

### 6. Application Insights / Monitor

Current dev resource:

- `appi-knowdefend-dev`

Track:

- failed contact requests
- throttled magic-link requests
- auth verification failures
- unhandled Function exceptions

### 7. Resend

Required values:

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `CONTACT_TO_EMAIL`

Notes:

- never expose the API key in the frontend
- verify the sender domain in Resend before production use

## Required production environment variables

Set these in the Static Web App production environment:

- `APP_BASE_URL=https://www.knowdefend.com`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `CONTACT_TO_EMAIL`
- `COSMOS_DB_ENDPOINT`
- `COSMOS_DB_KEY`
- `COSMOS_DB_DATABASE=knowdefend`
- `COSMOS_DB_CONTAINER_USERS=users`
- `COSMOS_DB_CONTAINER_AUTH=auth`
- `COSMOS_DB_CONTAINER_LEADS=leads`
- `COSMOS_DB_CONTAINER_DOCUMENTS=documents`
- `BLOB_STORAGE_CONNECTION_STRING`
- `BLOB_CONTAINER_PRIVATE_DOCS=private-docs`
- `SESSION_COOKIE_NAME=knowdefend_session`
- `SESSION_TTL_HOURS=24`
- `MAGIC_LINK_TTL_MINUTES=15`
- `CONTACT_THROTTLE_SECONDS=60`
- `MAGIC_LINK_THROTTLE_SECONDS=60`

## Local configuration flow

1. Copy or update `api/local.settings.json`
2. Replace all placeholder values
3. Run:

```bash
cd api
npm run config:check
```

4. Start Functions:

```bash
npx func start --port 7172
```

## Production configuration checklist

- set `APP_BASE_URL` to `https://www.knowdefend.com`
- use real storage connection string
- use real Cosmos endpoint and key
- replace placeholder email sender
- verify HTTPS-only deployment
- confirm cookies are secure in production
- confirm Blob containers have the correct access level

## Post-deploy validation

- confirm `https://www.knowdefend.com/` responds with the rebuilt site
- confirm `https://www.knowdefend.com/portal/` responds
- confirm contact submissions succeed and create `leads` records
- confirm magic-link login creates a session and signs in the portal
- confirm logout clears the session
- confirm response headers include CSP, frame protection, and referrer policy

## Private docs sync

Once `BLOB_STORAGE_CONNECTION_STRING` and `BLOB_CONTAINER_PRIVATE_DOCS` are configured, internal documentation can be uploaded to the private Blob container and registered in Cosmos with:

```bash
cd api
npm run docs:sync-private
```

That script uploads the current internal docs and creates private metadata records in Cosmos `documents`.

## Immediate next tasks

- wire Application Insights telemetry in the Functions code path
- decide whether to consolidate production resources into one resource group
- add Blob-backed public/private document endpoints
- add smoke checks for production deploys
