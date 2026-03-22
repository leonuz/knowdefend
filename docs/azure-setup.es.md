# Guía de configuración de Azure

Este documento define los recursos Azure usados por el stack actual de KnowDefend y la configuración esperada para operarlo de forma segura.

## Stack objetivo

- Azure Static Web Apps
- Azure Functions
- Azure Cosmos DB
- Azure Storage Account
- Azure Key Vault
- Azure Monitor / Application Insights
- Resend

## Estado conocido del despliegue actual

- el sitio público y el portal están desplegados por Azure Static Web Apps
- la SWA productiva actual es `knowdefend`
- la SWA vive en el resource group heredado `test`
- los recursos de soporte más nuevos viven en `rg-knowdefend-dev`
- los flujos de contacto y magic link con Cosmos ya funcionan de extremo a extremo

## Orden recomendado de creación

1. Resource Group
2. Storage Account
3. Cuenta de Cosmos DB
4. Key Vault
5. Static Web App
6. Application Insights / integración con Monitor
7. DNS y configuración del remitente en Resend

## Checklist de recursos

### 1. Resource Group

Nombres sugeridos:

- `rg-knowdefend-prod`
- `rg-knowdefend-dev`

### 2. Storage Account

Úsalo para:

- dependencia de almacenamiento de Azure Functions
- contenedores Blob para documentos

Contenedores sugeridos:

- `public-assets`
- `private-docs`

Valores requeridos:

- `AzureWebJobsStorage`

### 3. Cosmos DB

Cuenta dev actual:

- `cosmos-knowdefend-dev`

Usa una sola base de datos para v1:

- `knowdefend`

Contenedores:

- `users`
- `auth`
- `leads`
- `documents`

Valores requeridos:

- `COSMOS_DB_ENDPOINT`
- `COSMOS_DB_KEY`
- `COSMOS_DB_DATABASE`
- `COSMOS_DB_CONTAINER_USERS`
- `COSMOS_DB_CONTAINER_AUTH`
- `COSMOS_DB_CONTAINER_LEADS`
- `COSMOS_DB_CONTAINER_DOCUMENTS`

### 4. Key Vault

Vault dev actual:

- `kv-knowdefend-dev`

Guardar:

- `RESEND_API_KEY`
- la clave de Cosmos DB
- el connection string de Storage si quieres centralizarlo

Enfoque recomendado:

- mantener Key Vault como fuente de verdad para secretos
- por simplicidad operativa, algunos valores todavía pueden cargarse directamente en las environment variables de SWA

### 5. Azure Static Web App

SWA productiva actual:

- `knowdefend`

Estructura del repositorio:

- app location: `app`
- api location: `api`

Salida esperada:

- sitio público en `/`
- portal en `/portal/`
- endpoints serverless en `/api/*`

### 6. Application Insights / Monitor

Recurso dev actual:

- `appi-knowdefend-dev`

Registrar:

- fallos de contacto
- solicitudes de magic link bloqueadas por throttling
- fallos de verificación de auth
- excepciones no controladas de Functions

### 7. Resend

Valores requeridos:

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `CONTACT_TO_EMAIL`

Notas:

- nunca expongas la API key en el frontend
- verifica el dominio remitente en Resend antes de usarlo en producción

## Variables requeridas en producción

Estas variables deben existir en el entorno Production de la Static Web App:

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

## Flujo de configuración local

1. Copia o actualiza `api/local.settings.json`
2. Reemplaza todos los valores de ejemplo
3. Ejecuta:

```bash
cd api
npm run config:check
```

4. Inicia Functions:

```bash
npx func start --port 7172
```

## Checklist de configuración productiva

- establecer `APP_BASE_URL` como `https://www.knowdefend.com`
- usar el connection string real de Storage
- usar el endpoint y key reales de Cosmos
- reemplazar el remitente de correo de ejemplo
- verificar despliegue solo sobre HTTPS
- confirmar que las cookies sean seguras en producción
- confirmar que los contenedores Blob tengan el nivel de acceso correcto

## Validación posterior al despliegue

- confirmar que `https://www.knowdefend.com/` responde con el sitio nuevo
- confirmar que `https://www.knowdefend.com/portal/` responde
- confirmar que contacto funciona y crea registros en `leads`
- confirmar que el magic link crea sesión y autentica el portal
- confirmar que logout elimina la sesión
- confirmar que las respuestas incluyen CSP y otros headers de seguridad

## Sincronización de documentos privados

Cuando `BLOB_STORAGE_CONNECTION_STRING` y `BLOB_CONTAINER_PRIVATE_DOCS` estén configurados, la documentación interna puede cargarse al Blob privado y registrarse en Cosmos con:

```bash
cd api
npm run docs:sync-private
```

Ese script sube los documentos internos actuales y crea registros privados de metadata en Cosmos `documents`.

## Próximas tareas inmediatas

- cablear telemetría hacia Application Insights
- decidir si se consolidan los recursos productivos en un solo resource group
- agregar endpoints para documentos públicos y privados respaldados por Blob
- agregar smoke checks para despliegues productivos
