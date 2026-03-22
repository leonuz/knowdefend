# Arquitectura V1 de KnowDefend

Este documento describe la arquitectura Azure usada actualmente por KnowDefend y los servicios ya aprovisionados para la siguiente fase.

## Superficie actualmente desplegada

- Sitio público: `https://www.knowdefend.com/`
- Portal: `https://www.knowdefend.com/portal/`
- Raíz del frontend: `app/`
- Backend serverless integrado: `api/`
- Workflow de despliegue: `.github/workflows/azure-static-web-apps-zealous-bush-0668be510.yml`

## Inventario de recursos Azure

| Servicio | Recurso Azure | Propósito | Uso actual |
|---|---|---|---|
| Azure Static Web Apps | `knowdefend` | Hospeda el sitio público y la API integrada de Functions | Activo en producción |
| Azure Functions integradas con SWA | `api/` dentro del despliegue SWA | Backend serverless para contacto, auth, consulta de sesión y logout | Activo |
| Azure Cosmos DB for NoSQL | `cosmos-knowdefend-dev` | Almacena usuarios, registros de auth, leads y metadata de documentos | Activo |
| Azure Key Vault | `kv-knowdefend-dev` | Guarda secretos operativos como API keys y connection strings | Aprovisionado |
| Azure Application Insights | `appi-knowdefend-dev` | Telemetría y diagnóstico para endurecimiento posterior | Aprovisionado |
| Azure Storage Account / Blob | storage account dev en `rg-knowdefend-dev` | Soporte de Functions y almacenamiento futuro de documentos | Aprovisionado |
| Resend | servicio externo | Envío transaccional para contacto y magic links | Activo |

## Distribución por resource groups

- `test`
  - contiene la Static Web App productiva `knowdefend`
- `rg-knowdefend-dev`
  - contiene Cosmos, Key Vault, Application Insights y Storage

Funciona técnicamente, pero más adelante conviene consolidar los recursos productivos en un solo resource group.

## Diagrama general de componentes

```mermaid
flowchart LR
    U[Navegador del usuario]
    DNS[DNS y dominio\nwww.knowdefend.com]
    SWA[Azure Static Web Apps\nknowdefend]
    FE[Frontend estático\napp/]
    API[Azure Functions integradas\napi/*]
    COSMOS[Azure Cosmos DB\ncosmos-knowdefend-dev]
    KV[Azure Key Vault\nkv-knowdefend-dev]
    APPI[Application Insights\nappi-knowdefend-dev]
    STORAGE[Azure Storage / Blob]
    RESEND[Resend]

    U --> DNS
    DNS --> SWA
    SWA --> FE
    FE --> API
    API --> COSMOS
    API --> RESEND
    API -. secretos y config futura .-> KV
    API -. telemetría .-> APPI
    API -. documentos futuros .-> STORAGE
```

## Diagrama de despliegue

```mermaid
flowchart TD
    GH[Repositorio GitHub\nleonuz/knowdefend]
    WF[GitHub Actions\nazure-static-web-apps-zealous-bush-0668be510.yml]
    SWA[Azure Static Web App\nknowdefend]
    APP[Despliegue estático\napp/]
    FUNC[Despliegue Functions\napi/]
    DOMAIN[Dominio personalizado\nwww.knowdefend.com]

    GH --> WF
    WF --> SWA
    SWA --> APP
    SWA --> FUNC
    DOMAIN --> SWA
```

## Modelo UML de servicios

```mermaid
classDiagram
    class StaticWebApp {
      +name: knowdefend
      +sirve app/
      +integra api/
      +dominio: www.knowdefend.com
    }

    class AzureFunctions {
      +contact()
      +requestMagicLink()
      +verifyMagicLink()
      +me()
      +logout()
    }

    class CosmosDB {
      +database: knowdefend
      +container: users
      +container: auth
      +container: leads
      +container: documents
    }

    class KeyVault {
      +secret: resend-api-key
      +secret: cosmos-db-key
      +secret: storage-connection-string
    }

    class ApplicationInsights {
      +telemetría de requests
      +telemetría de errores
      +diagnóstico de auth
    }

    class BlobStorage {
      +container: public-assets
      +container: private-docs
    }

    class Resend {
      +envía correo de contacto
      +envía magic links
    }

    StaticWebApp --> AzureFunctions
    AzureFunctions --> CosmosDB
    AzureFunctions --> Resend
    AzureFunctions ..> KeyVault
    AzureFunctions ..> ApplicationInsights
    AzureFunctions ..> BlobStorage
```

## Responsabilidades en runtime

### Frontend

- `app/index.html` es el sitio público principal
- `app/portal/index.html` es la entrada del portal
- `app/scripts/main.js` maneja el formulario de contacto
- `app/scripts/portal.js` maneja auth, estado de sesión y logout
- `app/staticwebapp.config.json` define headers de seguridad, rutas y fallback

### Backend

- `api/contact`
  - valida entrada
  - rechaza honeypot y payloads inválidos
  - guarda leads en Cosmos `leads`
  - envía correo por Resend
- `api/request-magic-link`
  - valida entrada
  - escribe token temporal en Cosmos `auth`
  - envía magic link por Resend
- `api/verify-magic-link`
  - valida token
  - elimina el registro del magic link usado
  - crea la sesión en Cosmos `auth`
  - setea la cookie `knowdefend_session`
  - redirige a `/portal/`
- `api/me`
  - lee la cookie de sesión
  - consulta la sesión en Cosmos
  - devuelve el estado autenticado
- `api/logout`
  - elimina la sesión
  - expira la cookie

## Diagrama de secuencia: flujo de contacto

```mermaid
sequenceDiagram
    actor Usuario
    participant Browser as Navegador
    participant SWA as Static Web App
    participant Contact as api/contact
    participant Cosmos as Cosmos DB leads
    participant Resend

    Usuario->>Browser: Envía formulario de contacto
    Browser->>SWA: POST /api/contact
    SWA->>Contact: Invoca Function
    Contact->>Contact: Valida payload y honeypot
    Contact->>Cosmos: Guarda lead
    Contact->>Resend: Envía correo
    Contact-->>Browser: 200 JSON
```

## Diagrama de secuencia: flujo de autenticación por magic link

```mermaid
sequenceDiagram
    actor Usuario
    participant Browser as Navegador
    participant SWA as Static Web App
    participant Request as api/request-magic-link
    participant Verify as api/verify-magic-link
    participant Me as api/me
    participant Logout as api/logout
    participant Cosmos as Cosmos DB auth/users
    participant Resend

    Usuario->>Browser: Solicita acceso al portal
    Browser->>SWA: POST /api/request-magic-link
    SWA->>Request: Invoca Function
    Request->>Cosmos: Guarda token temporal
    Request->>Resend: Envía magic link
    Request-->>Browser: 200 JSON

    Usuario->>Browser: Abre el enlace recibido
    Browser->>SWA: GET /api/verify-magic-link
    SWA->>Verify: Invoca Function
    Verify->>Cosmos: Lee token
    Verify->>Cosmos: Elimina token usado
    Verify->>Cosmos: Crea sesión
    Verify-->>Browser: 302 redirect + Set-Cookie

    Browser->>SWA: GET /api/me
    SWA->>Me: Invoca Function
    Me->>Cosmos: Consulta sesión y usuario
    Me-->>Browser: JSON autenticado

    Usuario->>Browser: Hace logout
    Browser->>SWA: POST /api/logout
    SWA->>Logout: Invoca Function
    Logout->>Cosmos: Elimina sesión
    Logout-->>Browser: 200 JSON + cookie expirada
```

## Variables de entorno y límites de secretos

### Variables requeridas en Static Web App

- `APP_BASE_URL`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `CONTACT_TO_EMAIL`
- `COSMOS_DB_ENDPOINT`
- `COSMOS_DB_KEY`
- `COSMOS_DB_DATABASE`
- `COSMOS_DB_CONTAINER_USERS`
- `COSMOS_DB_CONTAINER_AUTH`
- `COSMOS_DB_CONTAINER_LEADS`
- `COSMOS_DB_CONTAINER_DOCUMENTS`
- `SESSION_COOKIE_NAME`
- `SESSION_TTL_HOURS`
- `MAGIC_LINK_TTL_MINUTES`
- `CONTACT_THROTTLE_SECONDS`
- `MAGIC_LINK_THROTTLE_SECONDS`

### Rol de Key Vault

Key Vault debe seguir siendo la fuente de verdad para secretos sensibles, aunque por compatibilidad operativa algunos valores todavía se carguen directamente como app settings en SWA.

## Modelo de datos en Cosmos

### `users`

```json
{
  "id": "user_name@example.com",
  "type": "user",
  "email": "name@example.com",
  "name": "Name",
  "company": "Company",
  "createdAt": "2026-03-21T00:00:00.000Z",
  "updatedAt": "2026-03-21T00:00:00.000Z"
}
```

### `auth`

Magic links y sesiones comparten el mismo container y se distinguen por `type`.

```json
{
  "id": "session_xxx",
  "type": "session",
  "email": "name@example.com",
  "tokenHash": "sha256",
  "expiresAt": "2026-03-22T00:00:00.000Z",
  "ttl": 86400
}
```

### `leads`

```json
{
  "id": "lead_xxx",
  "type": "lead",
  "name": "Name",
  "email": "name@example.com",
  "company": "Company",
  "service": "ai-security",
  "message": "Need review",
  "createdAt": "2026-03-21T00:00:00.000Z"
}
```

### `documents`

```json
{
  "id": "doc_case_study_ai_guardrails",
  "visibility": "public",
  "title": "Caso de estudio de AI Guardrails",
  "slug": "ai-guardrails-case-study",
  "blobPath": "public-assets/case-studies/ai-guardrails.pdf",
  "contentType": "application/pdf",
  "tags": ["ai", "case-study"],
  "publishedAt": "2026-03-21T00:00:00.000Z"
}
```

## Estrategia propuesta para documentos privados en Blob

Sí, tiene sentido mover esta documentación interna a Blob privado y exponerla solo a usuarios autenticados.

Modelo recomendado:

- guardar los archivos reales en el container privado `private-docs`
- guardar metadata en Cosmos `documents`
- marcar cada documento con `visibility: "private"` y el `blobPath`
- no exponer nunca URLs públicas directas del blob
- crear dos endpoints nuevos:
  - `GET /api/documents` para listar documentos visibles al usuario autenticado
  - `GET /api/documents/:id/download` para validar sesión y devolver descarga autorizada

## Diagrama de acceso a documentos privados

```mermaid
sequenceDiagram
    actor Usuario
    participant Browser as Navegador
    participant SWA as Static Web App
    participant API as Azure Functions
    participant Cosmos as Cosmos documents/auth
    participant Blob as Azure Blob private-docs

    Usuario->>Browser: Abre el portal autenticado
    Browser->>SWA: GET /api/documents
    SWA->>API: Invoca Function
    API->>Cosmos: Valida sesión y lista metadata
    API-->>Browser: Lista de documentos

    Usuario->>Browser: Solicita descarga
    Browser->>SWA: GET /api/documents/:id/download
    SWA->>API: Invoca Function
    API->>Cosmos: Valida sesión y metadata del documento
    API->>Blob: Lee stream o genera SAS corto
    API-->>Browser: Descarga autorizada
```

## Notas operativas

- El sitio está vivo en la SWA heredada mientras la plataforma de datos vive en un resource group más nuevo.
- La ruta actual es suficientemente estable para v1.
- Application Insights ya existe, pero todavía falta cablear telemetría completa.
