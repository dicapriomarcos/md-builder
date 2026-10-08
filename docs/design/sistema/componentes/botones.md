# Botones

> Sistema de diseño · Actualizada 2026-10-08

Inventario de la implementación existente, documentado a petición del usuario; no introduce un rediseño adicional.

## Valores

| Variante | Referencia | Uso |
|---|---|---|
| Principal | Colores: accent / accent-hover | Guardar y acceso al maquetador |
| Secundario | Colores: surface / ink / line | Acciones ordinarias |
| Barra superior | Maquetación y colores | Estructura, Variables, dispositivos |
| Destructivo | Texto diferenciado | Eliminar |

## Reglas

Reutilizar fundamentos/colores.md, bordes.md y tipografia.md. Dispositivos exponen aria-pressed; Estructura expone aria-expanded y aria-controls. Las acciones contextuales futuras se describen en DES-002. Los estilos de botón públicos son configurables en Variables y no comparten obligatoriamente esta apariencia.

## En el código

assets/admin-theme.css y assets/builder.js.

## Decisiones

Petición del usuario de completar toda la documentación de diseño. DES-001 conserva el contexto de la renovación; DES-002 describe propuestas futuras de Estructura.
