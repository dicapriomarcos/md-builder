# Guardado y errores

> Sistema de diseño · Actualizada 2026-10-08

Inventario de la implementación existente, documentado a petición del usuario; no introduce un rediseño adicional.

## Valores

| Variante | Referencia | Uso |
|---|---|---|
| Guardado | Indicador de estado | Documento sin cambios locales |
| Cambios sin guardar | Indicador diferenciado | Modificaciones pendientes |
| Error de guardado | Mensaje explícito | Fallo REST |
| Error de fuentes | Resultado de Variables | Descarga no completada |

## Reglas

Alternar paneles o dispositivos no marca el layout como modificado. Eliminar overrides sí modifica el documento. Conservar el contenido local ante fallo de guardado. Los mensajes de error actuales usan alertas; reemplazarlos por avisos integrados sería trabajo futuro, sin aprobación automática.

## En el código

assets/builder.js: markDirty(), saveLayout(), saveVariables(); includes/class-mvl-plugin.php.

## Decisiones

Petición del usuario de completar toda la documentación de diseño. DES-001 conserva el contexto de la renovación; DES-002 describe propuestas futuras de Estructura.
