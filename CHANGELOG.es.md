# Historial de cambios

Todos los cambios importantes de este proyecto se documentarán en este archivo.

## [Sin publicar]

### Agregado

- nueva estructura frontend `app/` para Azure Static Web Apps
- nueva página pública basada en la dirección visual Vector Shield
- base del portal seguro en `app/portal/`
- estilos, assets y validación del lado cliente compartidos
- base del backend con Azure Functions en `api/`
- endpoint para contacto
- endpoints para autenticación por magic link
- endpoints para estado de sesión y logout
- modelo de contenedores Cosmos DB para usuarios, auth, leads y documentos
- endpoints autenticados de documentos privados en `api/documents` y `api/document-download`
- script de sincronización a Blob privado para documentación interna
- documentación de arquitectura y setup de Azure en inglés y español
- documentación inicial de seguridad en `docs/security.md`
- pruebas automáticas para validación y helpers de autenticación

### Cambiado

- el workflow de GitHub Actions ahora apunta a `app/` y `api/`
- la identidad visual evolucionó hacia una dirección más sólida y consistente
- los headers de seguridad fueron reforzados en la configuración de Static Web Apps
- el portal ahora lista documentos privados autenticados respaldados por metadata en Cosmos
- el despliegue está activo en `https://www.knowdefend.com/` y `https://www.knowdefend.com/portal/`

### Seguridad

- se agregó validación de payload del lado servidor
- se agregó validación del lado cliente para formularios de contacto y auth
- se agregaron campos honeypot para rechazo de bots
- se agregó manejo de tokens hash para sesiones y magic links
- se agregaron headers `no-store` para endpoints sensibles
- se agregó un diseño inicial de rate limiting usando registros TTL en Cosmos
- se validó el manejo seguro de sesión y logout sobre HTTPS en producción

## [2026-03-21]

### Agregado

- revisión inicial del sitio legado
- tres conceptos de diseño bajo `concepts/`
- dirección seleccionada: Vector Shield
- exploración de logo y favicon para el concepto seleccionado
