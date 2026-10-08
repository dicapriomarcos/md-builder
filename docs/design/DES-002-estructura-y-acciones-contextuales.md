# DES-002 · Estructura y acciones contextuales

| Campo | Valor |
|---|---|
| Estado | `proposed` |
| Autor | Codex |
| Propietario | Marcos Di Caprio |
| Creada | 2026-10-08 |
| Actualizada | 2026-10-08 |
| Relacionadas | SPEC-003 |

## 1. Contexto

El árbol actual muestra tipos genéricos y solo admite arrastre entre hermanos. El usuario pide una propuesta visual, arrastrar, copiar, duplicar y botones de edición al seleccionar elementos. Después limita el cambio inmediato a colocar Estructura en el espacio del inspector y poder mostrarla u ocultarla.

## 2. Decisión

Propuesta para una fase posterior: árbol plegable con guías de jerarquía, icono de tipo, nombre reconocible y un resumen del contenido. Cabecera con búsqueda y plegado general. Selección con acento administrativo existente y acciones visibles Editar, Copiar y Duplicar. Un menú secundario reúne Pegar, Mover y Eliminar.

En la vista previa, una barra contextual sobre el elemento seleccionado ofrece Editar, Copiar y Duplicar. Editar abre el inspector; en el árbol, seleccionar mantiene abierta Estructura para facilitar otras operaciones. Los botones tienen etiqueta o tooltip y nombre accesible; no dependen exclusivamente de hover.

El arrastre muestra tres destinos: antes, dentro y después. «Dentro» solo se ofrece para contenedores. El destino inválido se muestra como bloqueado y nunca cambia el documento.

## 3. Alternativas consideradas

| Alternativa | Por qué se descarta |
|---|---|
| Árbol flotante sobre el lienzo | El usuario eligió ocupar el espacio de edición. |
| Todos los controles en cada fila | Reduce el espacio para nombres y hace difícil leer el árbol. |
| Acciones disponibles solo al pasar el ratón | Excluye uso táctil y dificulta acceso por teclado. |

## 4. Consecuencias

La jerarquía se reconoce por contenido y puede reorganizarse desde un único panel. El movimiento entre padres necesita controles de profundidad, límites y ciclos. Copiar y duplicar contenedores exige regenerar identificadores de todo el subárbol.

## 5. Reglas para la interfaz

- Mantener el panel alternable definido en `sistema/componentes/estructura.md`.
- Reutilizar tokens e iconos administrativos del plugin.
- Mostrar las acciones al seleccionar; ofrecer operaciones equivalentes sin arrastre.
- Copiar prepara una copia para pegar; Duplicar crea inmediatamente un hermano debajo del original.
- Pegar dentro de un contenedor o después de un elemento, con destino explícito.
- No añadir funcionalidades a la primera fase solo por aparecer en esta propuesta.

## 6. Referencias

`assets/builder.js`: `treeNode()`, `moveNode()`, `locate()` y `bindDragAndDrop()`. `docs/specs/SPEC-003-estructura-y-edicion-de-elementos.md`.

## Historial

| Fecha | Estado | Nota |
|---|---|---|
| 2026-10-08 | `proposed` | Propuesta escrita; la muestra interactiva y la implementación ampliada se aplazan tras la instrucción «de momento». El panel integrado sí se aplica. |
