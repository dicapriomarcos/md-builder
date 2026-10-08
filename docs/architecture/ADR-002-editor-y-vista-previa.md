# ADR-002 · Editor y vista previa

| Campo | Valor |
|---|---|
| Estado | `proposed` |
| Autor | Codex |
| Propietario | Marcos Di Caprio |
| Creada | 2026-10-08 |
| Actualizada | 2026-10-08 |
| Relacionadas | SPEC-001, SPEC-003, SPEC-005, SPEC-006 |

## 1. Contexto

assets/builder.js mantiene el estado en memoria y genera controles y CSS dentro de un iframe de la web real.

## 2. Decisión

Documentar y proponer mantener la arquitectura ya existente: JavaScript sin framework, estado local, DOM y listeners; lienzo iframe aislado del tema administrativo. CSS PHP para salida pública y CSS JavaScript para vista previa; estilos equivalentes por dispositivo.

## 3. Alternativas consideradas

| Alternativa | Por qué no se adopta en esta tarea |
|---|---|
| Sustituir el modelo o framework | La tarea solicitada completa SDD; no autoriza una migración. |
| Crear almacenamiento adicional | No hace falta para describir el comportamiento actual. |

## 4. Consecuencias

El diseño actual queda explícito y se pueden planificar cambios sin inventar capacidades. Estos ADR registran el código existente como propuesta documental; no se marcan accepted automáticamente. No requieren cambios en el plugin para esta tarea.

## 5. Reglas para el código

- Mantener los cinco tipos existentes en la biblioteca.
- La selección del iframe valida event.origin antes de procesar mvl-select.
- Separar state.dirty y variablesDirty de navegación de paneles.
- Controlar selección por ID y no por posición.
- Evitar dependencia de Gutenberg para editar documentos del maquetador.
- Verificar equivalencia de CSS con tests/responsive.cjs y comprobar navegación en navegador.

## Historial

| Fecha | Estado | Nota |
|---|---|---|
| 2026-10-08 | `proposed` | Inventario de la arquitectura existente a petición del usuario; pendiente de revisión formal. |
