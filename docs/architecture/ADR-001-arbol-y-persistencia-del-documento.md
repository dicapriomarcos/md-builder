# ADR-001 · Árbol y persistencia del documento

| Campo | Valor |
|---|---|
| Estado | `proposed` |
| Autor | Codex |
| Propietario | Marcos Di Caprio |
| Creada | 2026-10-08 |
| Actualizada | 2026-10-08 |
| Relacionadas | SPEC-001, SPEC-003, FIX-001 |

## 1. Contexto

El editor usa un árbol de section con bloques heading/text/button/image. La página conserva JSON y HTML/CSS renderizado en post_content.

## 2. Decisión

Documentar y proponer mantener la arquitectura ya existente: marcador mvl:document versión 1, sanitización PHP y renderizado en servidor antes de persistir. Lectura mediante get_layout(); escritura mediante save_layout_route(). Contenido dinámico se resuelve al guardar, no en cada visita.

## 3. Alternativas consideradas

| Alternativa | Por qué no se adopta en esta tarea |
|---|---|
| Sustituir el modelo o framework | La tarea solicitada completa SDD; no autoriza una migración. |
| Crear almacenamiento adicional | No hace falta para describir el comportamiento actual. |

## 4. Consecuencias

El diseño actual queda explícito y se pueden planificar cambios sin inventar capacidades. Estos ADR registran el código existente como propuesta documental; no se marcan accepted automáticamente. No requieren cambios en el plugin para esta tarea.

## 5. Reglas para el código

- Raíz: solo contenedores; máximo 30 raíces, 50 hijos por contenedor y profundidad 4.
- Mantener compatibilidad con ajustes planos y ResponsiveValue de cuatro dispositivos.
- Usar wp_slash antes de wp_update_post para conservar escapes.
- Clonar/mover debe validar límites e IDs antes de modificar el árbol; pendiente en SPEC-003.
- Comprobar guardado/recuperación con tests/responsive.php.

## Historial

| Fecha | Estado | Nota |
|---|---|---|
| 2026-10-08 | `proposed` | Inventario de la arquitectura existente a petición del usuario; pendiente de revisión formal. |
