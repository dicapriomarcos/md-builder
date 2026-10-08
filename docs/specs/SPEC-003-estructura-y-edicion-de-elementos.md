# SPEC-003 · Estructura y edición de elementos

| Campo | Valor |
|---|---|
| Estado | `planning` |
| Autor | Codex |
| Propietario | Marcos Di Caprio |
| Creada | 2026-10-08 |
| Actualizada | 2026-10-08 |
| Objetivo de release | Por definir |
| Dependencias | Ninguna |

## 1. Resumen

Mejorar el navegador de estructura y ofrecer acciones de edición al seleccionar elementos. Por petición posterior del usuario, la primera fase únicamente coloca Estructura en el panel derecho y permite alternarla con edición. Las operaciones nuevas quedan pendientes.

## 2. Problema y evidencia

`treeNode()` muestra tipos sin resumen, no hay controles de copiar/duplicar y `moveNode()` rechaza movimientos entre listas distintas. El panel flotante ocupaba parte del lienzo.

## 3. Objetivos

Ubicar Estructura en el espacio del inspector y, en una fase posterior, facilitar identificación y gestión del árbol completo.

## 4. Fuera de alcance

Bloques nuevos, copiar entre sitios, portapapeles del sistema, historial global de deshacer y publicación de versiones.

## 5. Usuarios y permisos

Personas que ya pueden editar el contenido. Las operaciones se realizan sobre el estado local del editor; guardar conserva los permisos y nonce REST existentes.

## 6. Requisitos

| ID | Requisito |
|---|---|
| FR-01 | Estructura sustituye visualmente al inspector y puede mostrarse u ocultarse. |
| FR-02 | Conservar selección y recuperar sus opciones al cerrar Estructura. |
| FR-03 | Propuesta de árbol plegable, iconos, nombres descriptivos, búsqueda y guías visuales. |
| FR-04 | Arrastrar antes/después y dentro de un contenedor, también entre padres. |
| FR-05 | Copiar un elemento/subárbol y pegarlo en un destino explícito. |
| FR-06 | Duplicar junto al original con nuevos identificadores de todos los nodos. |
| FR-07 | Mostrar Editar, Copiar y Duplicar al seleccionar, tanto en el árbol como en la vista previa. |
| NFR-01 | Respetar raíz de contenedores, profundidad y límites del servidor, impidiendo ciclos. |
| NFR-02 | Acciones accesibles por teclado y sin hover obligatorio; alternar paneles no marca cambios. |

## 7. Criterios de aceptación

- [x] AC-01 · Estructura aparece dentro del panel derecho y se ocultan inspector y acciones antiguas.
- [x] AC-02 · Al seleccionar un título en el árbol y cerrarlo, reaparecen sus opciones con la selección conservada.
- [x] AC-03 · Abrir/cerrar Estructura funciona también en Ancho completo y mantiene «Guardado».
- [ ] AC-04 · Se puede mover un bloque entre contenedores y se rechazan destinos inválidos sin pérdida.
- [ ] AC-05 · Copiar no cambia el layout; pegar y duplicar conservan contenido y estilos sin IDs repetidos.
- [ ] AC-06 · Las acciones de edición aparecen al seleccionar y funcionan con teclado.
- [ ] AC-07 · Guardar y recargar conserva la jerarquía reorganizada y duplicada.

## 8. Diseño técnico

Primera fase: insertar el panel de árbol en `.mvl-right`, ocultar inspector y acciones mediante `hidden` y conservar `state.selected`. El botón superior expone `aria-expanded` y `aria-controls`; el cierre devuelve el foco al botón. Estructura tiene acceso en Ancho completo.

Fase posterior: propuesta DES-002. Separar operaciones del árbol de la representación y validar el destino antes de mutar. Copia profunda en memoria del editor, nuevos IDs técnicos y tratamiento explícito de `htmlId` al clonar. Prevalidar máximos actuales: 30 raíces, 50 hijos por contenedor y profundidad máxima 4. Los bloques de contenido nunca quedan en raíz. Mover un contenedor a sí mismo o a un descendiente se rechaza.

## 9. Plan de tareas

- [x] T-01 · Integrar Estructura en el panel derecho con botón y cierre alternables.
- [x] T-02 · Comprobar selección, retorno a edición y Ancho completo en el navegador; revisar sintaxis.
- [x] T-03 · Documentar la propuesta visual y las acciones solicitadas en DES-002.
- [ ] T-04 · Preparar y revisar una muestra visual del árbol y de la barra contextual.
- [ ] T-05 · Implementar copia, pegado y duplicado con IDs únicos.
- [ ] T-06 · Implementar movimiento entre contenedores y validación del destino.
- [ ] T-07 · Incorporar árbol plegable, nombres, búsqueda y acciones al seleccionar.
- [ ] T-08 · Probar límites, ciclos, operaciones por teclado y persistencia tras guardar.

## 10. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Pérdida silenciosa por los límites del sanitizador | Validación local antes de insertar o mover. |
| Identificadores HTML repetidos al duplicar | Definir estrategia de IDs y enlaces internos antes de desarrollar. |
| Barra contextual tapa el contenido | Posicionamiento dentro del viewport y prueba en tamaños pequeños. |

## 11. Preguntas abiertas

Confirmar la propuesta visual de la fase posterior y decidir el tratamiento de IDs HTML/enlaces internos al copiar. La primera fase ya solicitada no depende de estas decisiones.

## Historial

| Fecha | Estado | Nota |
|---|---|---|
| 2026-10-08 | `planning` | Peticiones de estructura, copiar/duplicar y acciones contextuales registradas. Usuario limita el cambio inmediato al panel alternable; aplicado y probado en navegador sin modificar contenido. Resto pendiente de propuesta visual y definición. |
