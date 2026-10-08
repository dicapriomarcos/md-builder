# SPEC-001 · Añadir el dispositivo Laptop

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

Añadir Laptop entre Escritorio y Tablet en el selector y en todos los ajustes actualmente responsive.

## 2. Problema y evidencia

El editor y el servidor solo admiten desktop/tablet/mobile. El usuario pide un nivel Laptop.

## 3. Objetivos

Editar, previsualizar y guardar valores propios de Laptop sin perder los de otros dispositivos.

## 4. Fuera de alcance

Convertir tipografía o display en responsive; cambiar los límites actuales de Tablet y Móvil.

## 5. Usuarios y permisos

Personas con permiso de edición del contenido; se conserva la autenticación REST existente.

## 6. Requisitos

| ID | Requisito |
|---|---|
| FR-01 | Selector accesible Laptop y vista previa de 1366 px. |
| FR-02 | Admitir laptop en fondo, borde, espaciados y ajustes Flex/Grid responsive. |
| FR-03 | Herencia Escritorio → Laptop → Tablet → Móvil; restablecer elimina el valor propio. |
| FR-04 | CSS público y de vista previa equivalentes: Laptop ≤1366 px, Tablet ≤1024 px, Móvil ≤767 px. |
| NFR-01 | Documentos antiguos y valores planos siguen siendo válidos. |

## 7. Criterios de aceptación

- [x] AC-01 · Laptop aparece y permite editar un valor propio y restablecerlo.
- [x] AC-02 · Guardar y recuperar conserva overrides de los cuatro dispositivos.
- [x] AC-03 · CSS de PHP y JavaScript incluye Laptop antes de Tablet/Móvil y genera propiedades equivalentes.
- [x] AC-04 · Un documento antiguo sin laptop conserva sus valores existentes.

## 8. Diseño técnico

Extender ResponsiveValue con laptop nullable. El valor null hereda del dispositivo anterior. Media queries ordenadas de mayor a menor. La vista previa fija su ancho a 1366 px como ya ocurre con Tablet y Móvil. El umbral de Laptop es una elección de implementación pendiente de revisión, no una norma visual confirmada.

## 9. Plan de tareas

- [x] T-01 · Incorporar selector, defaults y herencia en JavaScript.
- [x] T-02 · Extender sanitizador y renderizador PHP.
- [x] T-03 · Actualizar CSS de vista previa y contrato técnico.
- [x] T-04 · Comprobar compatibilidad, cascada y guardado con pruebas.
- [x] T-05 · Revisar selector y controles en el navegador.

## 10. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Divergencia entre preview y página pública | Pruebas de ambos generadores y orden de media queries. |
| Alterar documentos existentes | laptop null por defecto y prueba de documentos previos. |

## 11. Preguntas abiertas

El usuario puede ajustar el umbral propuesto de 1366 px tras la revisión.

## Historial

| Fecha | Estado | Nota |
|---|---|---|
| 2026-10-08 | `in-progress` | Petición explícita del usuario: «me gustaría que agregues un responsive más de Laptop». |
| 2026-10-08 | `awaiting-review` | Sintaxis PHP/JS y diff correctos. WP-CLI: sanitización, Grid/Flex, estilos, compatibilidad y guardado/recuperación en página temporal. Node: herencia, restablecer y CSS idéntico PHP/JS. Navegador: selector Laptop activo, frame de 1366 px, gap 24→25 heredado en Tablet, restablecer a 24, guardar y recargar; documento sin desbordamiento global a 851 px. |
