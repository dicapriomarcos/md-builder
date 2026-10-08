# Maquetación

> Sistema de diseño · Actualizada 2026-10-08

Inventario de la implementación existente, documentado a petición del usuario; no introduce un rediseño adicional.

## Valores

| Variante | Valor actual | Uso |
|---|---|---|
| Escritorio público | Base | Valor inicial |
| Laptop público | max-width 1366 px | Hereda de Escritorio |
| Tablet público | max-width 1024 px | Hereda de Laptop |
| Móvil público | max-width 767 px | Hereda de Tablet |
| Preview Laptop / Tablet / Móvil | 1366 / 768 / 390 px | Anchos del iframe |
| Laterales administrativos normales | 220 px izquierda / 310 px derecha | Lienzo flexible entre ambos |
| Breakpoints administrativos | 1200, 960, 760, 480 px | Reorganización de controles y laterales |

## Reglas

Separar los breakpoints públicos de los administrativos. El iframe es desplazable cuando supera el espacio disponible. Ancho completo oculta laterales salvo Estructura al abrirla; Estructura sustituye al inspector. Tipografía, display y ancho individual todavía no tienen overrides responsive.

## En el código

assets/admin-theme.css, assets/builder.css; buildResponsiveCss() y render_layout().

## Decisiones

Petición del usuario de completar toda la documentación de diseño. DES-001 conserva el contexto de la renovación; DES-002 describe propuestas futuras de Estructura.
