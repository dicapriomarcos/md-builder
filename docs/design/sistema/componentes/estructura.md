# Panel de Estructura

> Actualizada 2026-10-08

## Reglas

- Estructura ocupa el panel derecho, en el lugar de las opciones de edición.
- El botón Estructura de la barra superior alterna entre el árbol y el inspector.
- «Volver a edición» cierra el árbol y recupera las opciones del bloque seleccionado.
- Seleccionar un elemento del árbol conserva Estructura abierta y actualiza la selección.
- Estructura puede mostrarse también en Ancho completo; el panel desplaza el lienzo en lugar de superponerse a él.

## En el código

`assets/builder.js`: `update()`, `refs.rightPanel` y `state.showStructure`. `assets/builder.css` y `assets/admin-theme.css`: panel integrado y excepción del modo Ancho completo.

## Decisiones

Petición del usuario de 2026-10-08: «de momento ponme para que la estructura ocupe el lugar de la edición y pueda mostrarse o no».
