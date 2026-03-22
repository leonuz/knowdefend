# Hoja de ruta

## Fase 1. Base

- finalizar el pulido restante de contenido en la homepage pública y el portal
- mantener el frontend estático y liviano
- ampliar las pruebas automáticas sobre escenarios más cercanos a producción
- seguir estandarizando la documentación bilingüe del proyecto

## Fase 2. Integración con Azure

- consolidar la distribución de recursos Azure entre resource groups legados y nuevos
- terminar de conectar Blob y las operaciones de documentos en producción
- completar la limpieza de Key Vault y manejo de secretos
- cablear Application Insights en los paths activos de Functions
- agregar pasos de validación para despliegues productivos

## Fase 3. Portal seguro

- refinar el estado protegido del portal para usuarios autenticados
- exponer metadata más rica de documentos privados mediante autorización backend
- agregar reglas de visibilidad de documentos por rol, audiencia o cliente
- soportar flujos autenticados más ricos dentro del portal

## Fase 4. Contenido sobre Blob

- mantener `public-assets` y `private-docs` como base del contenido
- publicar documentación interna a través del flujo privado de documentos
- agregar casos de uso y documentos técnicos públicos con disciplina de metadata
- decidir entre descargas por streaming o SAS de corta duración
- agregar previews o renderizado por formato dentro del portal

## Fase 5. Endurecimiento de seguridad

- agregar telemetría y dashboards con Application Insights
- agregar smoke tests de despliegue
- validar el throttling contra contenedores reales de Cosmos
- revisar el ciclo de vida de cookies y sesiones en producción
- agregar pruebas de autorización de documentos
- validar límites de acceso al Blob privado y rutas de fallo

## Fase 6. Madurez comercial y de contenido

- refinar el copy de servicios para clientes reales
- agregar casos de uso, estudios de caso y fichas técnicas
- definir el flujo de onboarding para clientes
- preparar despliegue productivo y checklist de salida
