# SPEC-002 · Mejoras pendientes del maquetador

| Campo | Valor |
|---|---|
| Estado | `backlog` |
| Autor | Codex |
| Propietario | Marcos Di Caprio |
| Creada | 2026-10-08 |
| Actualizada | 2026-10-08 |
| Objetivo de release | Por definir |
| Dependencias | Ninguna |

## 1. Resumen

Inventario de trabajo pendiente, extraído del contrato técnico existente y contrastado con el código. Cada funcionalidad seleccionada deberá tener una spec propia antes de implementarla. Este documento no autoriza todas las mejoras.

## 2. Problema y evidencia

`docs/spec-ia-maquetador.md` contenía una lista de tareas sin estados SDD. El editor ofrece familia, tamaño, variante y transformación, pero no interlineado, espaciado de letras ni color por bloque. Tipografía y display no tienen overrides por dispositivo. Las columnas ya son responsive: no se consideran pendientes.

## 3. Objetivos

Mantener un backlog comprobable y evitar confundir limitaciones actuales con funcionalidades comprometidas.

## 4. Fuera de alcance

Implementar automáticamente este inventario, añadir bloques nuevos o introducir generación IA dentro del plugin.

## 5. Usuarios y permisos

Marcos Di Caprio prioriza el backlog; los futuros permisos se definirán en cada spec.

## 6. Requisitos

| ID | Requisito |
|---|---|
| FR-01 | Distinguir mejoras funcionales, documentación y validación. |
| FR-02 | Mantener columnas responsive como funcionalidad existente. |
| NFR-01 | Conservar el modelo y la compatibilidad al planificar mejoras. |

## 7. Criterios de aceptación

- [ ] AC-01 · El usuario ha seleccionado y priorizado las mejoras que desea desarrollar.
- [ ] AC-02 · Cada mejora elegida tiene requisitos, pruebas y spec propia aprobada.

## 8. Diseño técnico

Fuentes: sanitizadores y renderizadores de `includes/class-mvl-plugin.php`, controles de `assets/builder.js` y sección de limitaciones del contrato técnico. Recetas y endpoint de fuentes son propuestas opcionales; no requisitos del editor actual.

## 9. Plan de tareas

- [ ] T-01 · Priorizar con el usuario las mejoras del inventario.
- [ ] T-02 · Preparar spec para interlineado, espaciado entre letras y color de texto.
- [ ] T-03 · Preparar spec para tipografía responsive.
- [ ] T-04 · Evaluar y especificar display responsive si se necesita cambiar Flex/Grid entre dispositivos.
- [ ] T-05 · Preparar un prompt de sistema para generar layouts válidos, conservando la preferencia del usuario de maquetar desde la interfaz.
- [ ] T-06 · Añadir ejemplos de galería, testimonios, precios, Grid y Variables al contrato técnico.
- [ ] T-07 · Evaluar si hace falta un endpoint REST de catálogo de Google Fonts.
- [ ] T-08 · Evaluar recetas de negocio → JSON; propuesta opcional sin compromiso de implementación.

## 10. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Crecimiento de alcance | Specs independientes y priorización antes de programar. |
| Desajuste entre contrato y código | Revisar sanitización, controles y renderizado en cada cambio. |

## 11. Preguntas abiertas

Prioridad y alcance de las mejoras; confirmación del diseño visual reciente y política de Git. No bloquean el cambio Laptop solicitado.

## Historial

| Fecha | Estado | Nota |
|---|---|---|
| 2026-10-08 | `backlog` | Auditoría del contrato y del código; columnas responsive ya resueltas. Las ideas quedan pendientes de priorización. |
