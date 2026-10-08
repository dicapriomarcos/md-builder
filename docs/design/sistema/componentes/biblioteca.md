# Biblioteca y tarjetas

> Sistema de diseño · Actualizada 2026-10-08

Inventario de la implementación existente, documentado a petición del usuario; no introduce un rediseño adicional.

## Valores

| Variante | Referencia | Uso |
|---|---|---|
| Bloque disponible | Iconos, bordes, espaciado | Añadir uno de los cinco tipos |
| Tarjeta de Variables | Colores y tipografía | Fuentes y estilos de botón |
| Vista de imagen | Bordes | Medio seleccionado |

## Reglas

Biblioteca siempre usa los cinco tipos existentes. Contenedores admiten Flex y Grid con anidación; no inventar un bloque columna. Mantener un texto legible debajo de los iconos y ayudas de imagen vacía.

## En el código

assets/builder.js: labels, buildSkeleton() y variablesPanelHtml(); assets/admin-theme.css.

## Decisiones

Petición del usuario de completar toda la documentación de diseño. DES-001 conserva el contexto de la renovación; DES-002 describe propuestas futuras de Estructura.
