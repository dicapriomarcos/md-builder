# SPEC-004 · Portada de pruebas Lorem Ipsum

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

Página 60 publicada como portada, editable con los elementos existentes del Maquetador Ligero.

## 2. Problema y evidencia

El usuario pidió una maqueta Lorem Ipsum probando contenedores, elementos y estilos, y usarla como página principal. Tras la corrección del usuario, los ajustes se realizaron y guardaron desde la interfaz del maquetador.

## 3. Objetivos

Cubrir la petición ya implementada y registrar la evidencia disponible para revisión.

## 4. Fuera de alcance

Añadir funcionalidades distintas de las pedidas o publicar en producción.

## 5. Usuarios y permisos

Personas con permisos de edición WordPress. Se conservan controles de publicación y capacidades del sitio.

## 6. Requisitos

| ID | Requisito |
|---|---|
| FR-01 | Contenedores Flex, Grid y anidados; heading, text, button e image. |
| FR-02 | Variaciones de estilos, tipografía y todos los tipos de fondo disponibles. |
| FR-03 | Página 60 como portada estática y documento editable. |

## 7. Criterios de aceptación

- [x] AC-01 · Documento con 12 secciones raíz, 55 contenedores, 49 textos, 33 títulos, 18 botones y 3 imágenes comprobado en la sesión.
- [x] AC-02 · Portada estática configurada y guardado desde el editor verificado.
- [x] AC-03 · Página y medios comprobados en navegador; ajustes responsive de la muestra conservados.

## 8. Diseño técnico

show_on_front=page y page_on_front=60 en el WordPress de pruebas. Layout en post_content; medios en biblioteca WordPress. Estos datos son de la instalación local y no se distribuyen como fixture ni se reproducen al activar el plugin.

## 9. Plan de tareas

- [x] T-01 · Construir la maqueta con bloques existentes y contenido Lorem Ipsum.
- [x] T-02 · Configurar la portada y medios locales.
- [x] T-03 · Verificar y ajustar desde el editor, con guardado y revisión responsive.

## 10. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Regresión sobre contenido existente | Conservar modelo del documento y revisar guardado/recuperación. |

## 11. Preguntas abiertas

Valoración final del usuario; no se marca done automáticamente.

## Historial

| Fecha | Estado | Nota |
|---|---|---|
| 2026-10-08 | `awaiting-review` | Registro retrospectivo de trabajo autorizado y verificado durante esta conversación. Verificaciones previas de portada, árbol completo, medios y guardado; esta tarea documental no vuelve a publicar la página. |
