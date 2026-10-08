# Acceso desde WordPress

> Sistema de diseño · Actualizada 2026-10-08

Inventario de la implementación existente, documentado a petición del usuario; no introduce un rediseño adicional.

## Valores

| Variante | Referencia | Uso |
|---|---|---|
| Acceso al maquetador | Botón principal | Contenido con marcador mvl:document |
| Presentación | Colores, bordes y sombras | Bloque informativo del editor |

## Reglas

Mostrar «Maquetar con el Maquetador» y ocultar el editor de contenido solo para documentos ya hechos con el plugin. Conservar título, publicación y atributos. La selección del editor de otras páginas permanece intacta.

## En el código

includes/class-mvl-plugin.php: configure_post_editor(), filter_block_editor(), render_content_cta(); assets/post-editor.css y assets/admin-theme.css.

## Decisiones

Petición del usuario de completar toda la documentación de diseño. DES-001 conserva el contexto de la renovación; DES-002 describe propuestas futuras de Estructura.
