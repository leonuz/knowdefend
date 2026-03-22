# TODO

## Alta prioridad

- decidir la estrategia final de limpieza de los archivos legados en la raíz
- agregar las variables de Blob a la Static Web App de producción si todavía faltan
- validar en producción el listado y descarga de documentos privados después del deploy
- decidir si la documentación interna debe permanecer en markdown privado o exportarse a PDF

## Frontend

- refinar el copy de la homepage con el posicionamiento final de servicios
- decidir si mantener o reducir el tamaño del logo del footer
- agregar secciones dedicadas para casos de uso y recursos descargables
- agregar una UX más rica para documentos autenticados, con previews, filtros de idioma y agrupación

## Backend

- agregar pruebas reales de integración con Cosmos cuando existan credenciales
- agregar logging de solicitudes y hooks de telemetría
- revisar la estrategia de invalidación de sesiones en escenarios multi-dispositivo
- agregar filtros por rol o audiencia para visibilidad de documentos privados
- decidir si las descargas deben salir en streaming desde Functions o con SAS de corta duración

## Seguridad

- agregar pruebas negativas para payloads grandes y content types inválidos
- revisar el manejo de secretos con referencias de Key Vault
- agregar pruebas de autorización para acceso a documentos privados y bypass directo del blob

## Documentación

- documentar convenciones de contenedores Blob y reglas de nombres
- documentar el flujo de publicación de documentación privada desde `docs/` hacia Blob
