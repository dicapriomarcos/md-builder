# Espaciado

> Sistema de diseño · Actualizada 2026-10-08

Inventario de la implementación existente, documentado a petición del usuario; no introduce un rediseño adicional.

## Valores

| Variante existente | Valor actual | Uso |
|---|---|---|
| Interior de panel | 20 px vertical, 16 px horizontal | Laterales |
| Separación de biblioteca | 10 px | Tarjetas de bloques |
| Interior del lienzo | 28 px | Escritorio administrativo |
| Separación de pestañas | 3 px | Inspector |
| Interior de Variables | 24 px | Cuerpo del modal |

## Reglas

No existe una escala de tokens CSS de espaciado. Estos valores documentan selectores actuales y se definen aquí una sola vez; los componentes enlazan esta parte. Los ajustes públicos de padding y margin pertenecen al documento y admiten overrides responsive.

## En el código

assets/admin-theme.css: .mvl-right, .mvl-add, .mvl-canvas, .mvl-tabs y .mvl-variables-body.

## Decisiones

Petición del usuario de completar toda la documentación de diseño. DES-001 conserva el contexto de la renovación; DES-002 describe propuestas futuras de Estructura.
