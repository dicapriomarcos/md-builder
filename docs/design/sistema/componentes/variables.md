# Modal Variables

> Sistema de diseño · Actualizada 2026-10-08

Inventario de la implementación existente, documentado a petición del usuario; no introduce un rediseño adicional.

## Valores

| Variante | Referencia | Uso |
|---|---|---|
| Modal | Sombras, bordes y espaciado | Ajustes globales |
| Pestañas | Colores y tipografía | General, fuentes y estilos |
| Tarjetas | Biblioteca | Roles tipográficos y estilos de botón |

## Reglas

Variables modifica el sitio entero y tiene indicador de cambios separado. Registrar fuentes antes de elegirlas; límite actual de seis. El guardado de layout guarda Variables primero si están modificadas. Mostrar incidencias de fuentes sin afirmar que una descarga fallida se completó.

## En el código

assets/builder.js: variablesPanelHtml(), saveVariables(), save(); includes/class-mvl-plugin.php: save_variables_route().

## Decisiones

Petición del usuario de completar toda la documentación de diseño. DES-001 conserva el contexto de la renovación; DES-002 describe propuestas futuras de Estructura.
