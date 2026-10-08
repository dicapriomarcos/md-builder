# ADR-003 · API, Variables y fuentes

| Campo | Valor |
|---|---|
| Estado | `proposed` |
| Autor | Codex |
| Propietario | Marcos Di Caprio |
| Creada | 2026-10-08 |
| Actualizada | 2026-10-08 |
| Relacionadas | SPEC-002, SPEC-006 |

## 1. Contexto

Los layouts son por entrada y las Variables afectan al sitio entero. Las fuentes elegidas se descargan y sirven localmente.

## 2. Decisión

Documentar y proponer mantener la arquitectura ya existente: REST mvl/v1/layout/{id} con permiso edit_post, REST mvl/v1/variables con edit_pages y nonce WordPress en el editor. Opción mvl_variables sin autoload; sanitizadores por tipo. Fuentes locales bajo uploads y errores de descarga en la respuesta.

## 3. Alternativas consideradas

| Alternativa | Por qué no se adopta en esta tarea |
|---|---|
| Sustituir el modelo o framework | La tarea solicitada completa SDD; no autoriza una migración. |
| Crear almacenamiento adicional | No hace falta para describir el comportamiento actual. |

## 4. Consecuencias

El diseño actual queda explícito y se pueden planificar cambios sin inventar capacidades. Estos ADR registran el código existente como propuesta documental; no se marcan accepted automáticamente. No requieren cambios en el plugin para esta tarea.

## 5. Reglas para el código

- Validar permisos en el servidor; el nonce no sustituye capacidades.
- Sanitizar al entrar y escapar al renderizar; texto con HTML permitido mediante wp_kses_post.
- Mantener el límite de fuentes registradas y catálogo existente.
- No confundir Variables de sitio con overrides de un bloque.
- No publicar credenciales en SDD.
- El catálogo REST independiente sigue siendo propuesta en SPEC-002; no existe hoy.
- Guardar Variables primero cuando el editor tiene cambios globales pendientes.

## Historial

| Fecha | Estado | Nota |
|---|---|---|
| 2026-10-08 | `proposed` | Inventario de la arquitectura existente a petición del usuario; pendiente de revisión formal. |
