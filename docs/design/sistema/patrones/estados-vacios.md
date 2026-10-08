# Estados vacíos

> Sistema de diseño · Actualizada 2026-10-08

Inventario de la implementación existente, documentado a petición del usuario; no introduce un rediseño adicional.

## Valores

| Variante | Referencia | Uso |
|---|---|---|
| Sin selección | Iconos y tipografía | Indicar cómo seleccionar un bloque |
| Árbol vacío | Texto auxiliar | Añadir un contenedor |
| Imagen vacía | Biblioteca | Seleccionar imagen |
| Fuentes sin registrar | Formularios | Ir a Variables |

## Reglas

Cada estado explica la acción siguiente. El estado vacío no crea elementos ni modifica automáticamente el documento. No mostrar acciones de eliminar si no existe selección.

## En el código

assets/builder.js: inspector(), tree(), imageContentFields(), typographyFieldsHtml().

## Decisiones

Petición del usuario de completar toda la documentación de diseño. DES-001 conserva el contexto de la renovación; DES-002 describe propuestas futuras de Estructura.
