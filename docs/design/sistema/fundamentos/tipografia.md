# Tipografía

> Sistema de diseño · Actualizada 2026-10-08

Inventario de la implementación existente, documentado a petición del usuario; no introduce un rediseño adicional.

## Valores

| Variante existente | Valor actual | Uso |
|---|---|---|
| Familia administrativa | Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif | Inter si está disponible; sin descarga administrativa explícita |
| Texto de controles | 12 px, peso 600 | Botones y etiquetas |
| Texto auxiliar | 11 px | Ayuda |
| Nombre del bloque | 20 px, peso 650 | Inspector |
| Cabecera Variables | 18 px | Modal |
| Resumen del bloque | 12 px, interlineado 1.5 | Referencia de contenido |

## Reglas

La tipografía administrativa es independiente de Variables de la web pública. Los valores de esta tabla están en selectores, sin tokens CSS de tipografía. En la web se admiten familia registrada, tamaño, variante y transformación; interlineado, espaciado y color por bloque están pendientes en SPEC-002.

## En el código

assets/admin-theme.css y assets/builder.js: typographyFieldsHtml().

## Decisiones

Petición del usuario de completar toda la documentación de diseño. DES-001 conserva el contexto de la renovación; DES-002 describe propuestas futuras de Estructura.
