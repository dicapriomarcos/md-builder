# SPEC-005 · Acceso al editor desde WordPress

| Campo | Valor |
|---|---|
| Estado | `awaiting-review` |
| Autor | Codex |
| Propietario | Marcos Di Caprio |
| Creada | 2026-10-08 |
| Actualizada | 2026-10-08 |
| Objetivo de release | Por definir |
| Dependencias | Ninguna |

## 1. Resumen

Ocultar el editor de contenido de WordPress en documentos del maquetador y mostrar Maquetar con el Maquetador.

## 2. Problema y evidencia

Petición del usuario: comportarse como otros maquetadores y no mostrar el editor de contenido para páginas maquetadas.

## 3. Objetivos

Cubrir la petición ya implementada y registrar la evidencia disponible para revisión.

## 4. Fuera de alcance

Añadir funcionalidades distintas de las pedidas o publicar en producción.

## 5. Usuarios y permisos

Personas con permisos de edición WordPress. Se conservan controles de publicación y capacidades del sitio.

## 6. Requisitos

| ID | Requisito |
|---|---|
| FR-01 | Detectar marcador mvl:document solo en entradas y páginas autorizadas. |
| FR-02 | Ocultar editor y ofrecer el botón con el texto solicitado. |
| FR-03 | Conservar título, publicación, atributos y comportamiento de contenido externo. |

## 7. Criterios de aceptación

- [x] AC-01 · Página 60 muestra el botón y no el editor de contenido.
- [x] AC-02 · Una página de control sin marcador mantiene su editor.
- [x] AC-03 · Actualizar desde WordPress conserva el contenido y el botón abre el maquetador.

## 8. Diseño técnico

configure_post_editor(), filter_block_editor(), is_builder_post() y render_content_cta() en includes/class-mvl-plugin.php. Estilos en assets/post-editor.css y admin-theme.css. No se modifica Gutenberg globalmente.

## 9. Plan de tareas

- [x] T-01 · Añadir detección y hooks de selección de editor.
- [x] T-02 · Crear acceso y estilos administrativos.
- [x] T-03 · Comprobar página maquetada, página normal y actualización real.

## 10. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Regresión sobre contenido existente | Conservar modelo del documento y revisar guardado/recuperación. |

## 11. Preguntas abiertas

Valoración final del usuario; no se marca done automáticamente.

## Historial

| Fecha | Estado | Nota |
|---|---|---|
| 2026-10-08 | `awaiting-review` | Registro retrospectivo de trabajo autorizado y verificado durante esta conversación. Sintaxis PHP y pruebas previas de selección del editor, navegación y conservación SHA256 del contenido. |
