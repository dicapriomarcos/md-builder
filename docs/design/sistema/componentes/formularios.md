# Formularios

> Sistema de diseño · Actualizada 2026-10-08

Inventario de la implementación existente, documentado a petición del usuario; no introduce un rediseño adicional.

## Valores

| Variante | Referencia | Uso |
|---|---|---|
| Campo simple | Bordes, tipografía y colores | Texto y números/unidades |
| Selector | Mismos fundamentos | Opciones discretas |
| Espaciados enlazados | Modelo responsive | Padding y margin |
| Restablecer | Color accent | Eliminar override del dispositivo |

## Reglas

Cada campo tiene etiqueta. Los campos públicos conservan sus unidades permitidas y la normalización del servidor. No sugerir interlineado o color por bloque como existentes: están en el backlog. Usar foco visible y mantener el valor heredado al restablecer.

## En el código

assets/builder.js: stylePanel(), advancedPanel(), resetButton(); assets/admin-theme.css.

## Decisiones

Petición del usuario de completar toda la documentación de diseño. DES-001 conserva el contexto de la renovación; DES-002 describe propuestas futuras de Estructura.
