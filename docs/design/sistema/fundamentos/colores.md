# Colores

> Sistema de diseño · Actualizada 2026-10-08

Inventario de la implementación existente, documentado a petición del usuario; no introduce un rediseño adicional.

## Valores

| Token | Valor actual | Uso |
|---|---|---|
| `--mvl-accent` | `#0f766e` | Acciones, selección y foco |
| `--mvl-accent-hover` | `#115e59` | Acción principal al pasar el ratón |
| `--mvl-accent-soft` | `#e8f5f1` | Fondos de selección y tarjetas |
| `--mvl-ink` | `#182b32` | Texto principal |
| `--mvl-muted` | `#62757c` | Texto secundario |
| `--mvl-line` | `#dfe7e8` | Separadores y bordes |
| `--mvl-surface` | `#ffffff` | Paneles |
| `--mvl-canvas` | `#edf2f3` | Área de trabajo |

## Reglas

Tokens limitados a .mvl-admin-wrap y .mvl-content-cta. No se aplican al contenido público. La barra superior usa un fondo oscuro con texto claro; no existe selector de tema oscuro.

## En el código

assets/admin-theme.css, declaración inicial de variables.

## Decisiones

Petición del usuario de completar toda la documentación de diseño. DES-001 conserva el contexto de la renovación; DES-002 describe propuestas futuras de Estructura.
