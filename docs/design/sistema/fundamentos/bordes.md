# Bordes

> Sistema de diseño · Actualizada 2026-10-08

Inventario de la implementación existente, documentado a petición del usuario; no introduce un rediseño adicional.

## Valores

| Token o variante | Valor actual | Uso |
|---|---|---|
| `--mvl-radius` | 10 px | Tarjetas de bloques y grupo de pestañas |
| Radio de control | 8 px | Botones y campos |
| Radio de contenido | 12 px | Vista previa, icono de bloque y tarjetas Variables |
| Radio del modal | 16 px | Ventana Variables |
| Radio de pestaña | 7 px | Pestaña interior |
| Línea estándar | 1 px, color `--mvl-line` | Bordes y separadores |

## Reglas

Las variantes sin nombre de token son valores actuales de selectores, no variables CSS nuevas. Fondo, borde y radio de los bloques públicos pertenecen a sus ajustes, no al tema administrativo.

## En el código

assets/admin-theme.css.

## Decisiones

Petición del usuario de completar toda la documentación de diseño. DES-001 conserva el contexto de la renovación; DES-002 describe propuestas futuras de Estructura.
