# SPEC-006 · Renovación visual del plugin

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

Actualizar la apariencia de administración y mostrar el nombre del bloque encima de todas sus opciones.

## 2. Problema y evidencia

El usuario pidió un refresh estético y el nombre de cada bloque sobre el panel de opciones.

## 3. Objetivos

Cubrir la petición ya implementada y registrar la evidencia disponible para revisión.

## 4. Fuera de alcance

Añadir funcionalidades distintas de las pedidas o publicar en producción.

## 5. Usuarios y permisos

Personas con permisos de edición WordPress. Se conservan controles de publicación y capacidades del sitio.

## 6. Requisitos

| ID | Requisito |
|---|---|
| FR-01 | Cabecera con nombre, icono y resumen del bloque. |
| FR-02 | Mantener cabecera al alternar Contenido, Estilo y Avanzado. |
| FR-03 | Tema coherente para biblioteca, campos, dispositivos, Variables, Estructura y acceso WordPress. |
| FR-04 | No aplicar estilos administrativos a la maqueta pública. |

## 7. Criterios de aceptación

- [x] AC-01 · Los cinco tipos muestran su nombre y mantienen cabecera al alternar pestañas.
- [x] AC-02 · Tema administrativo y modal Variables comprobados en navegador.
- [x] AC-03 · Indicador de cambios y guardado real comprobados conservando el contenido.

## 8. Diseño técnico

assets/admin-theme.css cargado después de los estilos originales; tokens limitados a los ámbitos administrativos. Sistema documentado en docs/design/sistema/index.md. Contexto visual en DES-001.

## 9. Plan de tareas

- [x] T-01 · Renovar toolbar, biblioteca e inspector con tokens de administración.
- [x] T-02 · Actualizar Variables, campos y acceso WordPress.
- [x] T-03 · Revisar tipos de bloque, pestañas, estado y guardado.

## 10. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Regresión sobre contenido existente | Conservar modelo del documento y revisar guardado/recuperación. |

## 11. Preguntas abiertas

Valoración final del usuario; no se marca done automáticamente.

## Historial

| Fecha | Estado | Nota |
|---|---|---|
| 2026-10-08 | `awaiting-review` | Registro retrospectivo de trabajo autorizado y verificado durante esta conversación. Pruebas previas de PHP/JS, revisión visual de cinco tipos y guardado real; se documenta el diseño existente por petición posterior del usuario. |
