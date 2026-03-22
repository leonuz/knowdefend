# KnowDefend

KnowDefend es la plataforma web de Defense Security LLC.

El proyecto se está reconstruyendo como una solución limpia basada en Azure con:

- un sitio público de presentación
- un portal seguro para clientes
- Azure Functions para los flujos de backend
- Cosmos DB para usuarios, sesiones y leads
- Azure Blob Storage para documentos públicos y privados en el futuro
- Resend para correo transaccional

## Objetivos del proyecto

- presentar una marca de ciberseguridad más sólida y confiable
- mantener el frontend simple y fácil de sostener
- agregar flujos seguros de contacto y autenticación
- preparar una estructura que pueda crecer hacia un portal para clientes
- validar controles de seguridad antes del despliegue a producción

## Arquitectura actual

### Frontend

- `app/` es la raíz del frontend para Azure Static Web Apps
- `app/index.html` es la página pública principal
- `app/portal/index.html` es el punto de entrada del portal

### Backend

- `api/contact` procesa solicitudes de contacto
- `api/request-magic-link` envía enlaces de acceso
- `api/verify-magic-link` valida enlaces y crea sesiones
- `api/me` devuelve el estado actual de sesión
- `api/logout` cierra sesiones

### Servicios de apoyo

- Azure Static Web Apps para hosting
- Azure Functions para endpoints backend
- Azure Cosmos DB para datos de aplicación
- Azure Blob Storage para almacenamiento futuro de documentos
- Azure Key Vault para secretos
- Azure Monitor / Application Insights para telemetría
- Resend para envío de correos

## Estructura del repositorio

```text
app/      Sitio público y frontend del portal
api/      Backend con Azure Functions
concepts/ Exploración de diseño y prototipos
docs/     Notas de arquitectura y seguridad
```

## Desarrollo local

### Vista previa del frontend

Desde la raíz del repositorio:

```bash
python3 -m http.server 4173 --directory /home/codex/knowdefend
```

Rutas útiles:

- `/app/`
- `/app/portal/`
- `/concepts/`

### Backend

Instalar dependencias:

```bash
cd api
npm install
```

Ejecutar pruebas:

```bash
npm test
```

Levantar Azure Functions localmente:

```bash
npx func start --port 7172
```

Necesitarás un `local.settings.json` real basado en `api/local.settings.example.json` para probar el flujo completo del backend.

## Estado de seguridad

El proyecto ya incluye:

- validación del lado cliente y servidor
- campos honeypot para rechazar bots básicos
- diseño inicial de throttling de solicitudes
- tokens hash para magic links y sesiones
- cookies seguras
- headers de seguridad restrictivos
- pruebas automáticas de validación

Ver:

- [docs/architecture.md](./docs/architecture.md)
- [docs/security.md](./docs/security.md)
- [docs/azure-setup.es.md](./docs/azure-setup.es.md)

## Dirección de despliegue

El objetivo actual de despliegue es Azure Static Web Apps con Azure Functions integradas.

El workflow de GitHub está configurado en:

- `.github/workflows/azure-static-web-apps-zealous-bush-0668be510.yml`

## Estado

Esto sigue en construcción.

El frontend principal, el portal base, la validación y los controles iniciales de seguridad ya están listos.
La integración real con recursos de Azure y la configuración completa para producción siguen pendientes.
