# Ciclos de vida y cambios de estado

> Parte de la skill `sdd` — índice en [`SKILL.md`](SKILL.md).

## Features

| Estado | Significado | Quién lo decide |
|---|---|---|
| `backlog` | Por hacer: idea o spec incompleta, sin empezar | Agente o persona |
| `planning` | En planificación: se están redactando requisitos, criterios y tareas | Agente o persona |
| `awaiting-approval` | Esperando aprobación: todas las secciones completas, lista para que la persona la apruebe | Agente |
| `in-progress` | En desarrollo. Pasar aquí desde `awaiting-approval` es la aprobación | **Solo la persona usuaria** (el agente solo si ya estaba aprobada) |
| `awaiting-review` | Esperando revisión: todas las `T-NN` y `AC-NN` marcadas y pruebas en verde | Agente, con evidencia |
| `done` | Finalizado: revisado y dado por bueno | **Solo la persona usuaria** |
| `superseded` | Sustituida por otra spec o decisión | Agente o persona, enlazando la nueva |
| `cancelled` | Descartada, no se hará; se conserva como registro | **Solo la persona usuaria** |

## Diseño y arquitectura

| Estado | Significado | Quién lo decide |
|---|---|---|
| `proposed` | Propuesta pendiente de decidir | Agente o persona |
| `accepted` | Decisión vigente: hay que respetarla al programar | **Solo la persona usuaria** |
| `rejected` | Descartada; se conserva para no volver a discutirla | **Solo la persona usuaria** |
| `deprecated` | Ya no aplica, sin sustituta | Agente o persona |
| `superseded` | Sustituida por otra decisión (enlázala) | Agente o persona |

## Fixes

| Estado | Significado | Quién lo decide |
|---|---|---|
| `reported` | Error documentado, sin investigar | Agente o persona |
| `investigating` | Buscando la causa raíz | Agente |
| `in-progress` | Causa conocida, corrigiendo | Agente |
| `verified` | Corregido, criterios marcados y tests en verde | Agente, con evidencia |
| `released` | Corrección desplegada y comprobada | **Solo la persona usuaria** |
| `cancelled` | Descartado o no es un error (no se corregirá); se conserva como registro | **Solo la persona usuaria** |

## Reglas

- Nunca pases nada a `done`, `accepted`, `rejected` o `cancelled` por tu cuenta, ni una feature de `awaiting-approval` a `in-progress`: propónlo y espera confirmación.
- Flujo de una feature: `backlog` → `planning` → `awaiting-approval` (lo pones tú al terminar la spec) → `in-progress` (la persona la aprueba) → `awaiting-review` (lo pones tú al terminar, con evidencia) → `done` (la persona).
- No empieces a programar una funcionalidad de alcance medio o alto sin una spec en `in-progress` aprobada por la persona. Si no existe, créala en `backlog`, complétala, pásala a `awaiting-approval` y pide aprobación.
- Cada proyecto puede saltarse estados que no usa (por ejemplo `planning` o `awaiting-review`). Si `.sdd.json` tiene `skipStatuses`, no uses esos estados: pasa al siguiente del flujo.
- Para pasar a `awaiting-review` (o `verified` en fixes), todas las casillas deben estar marcadas (salvo las tachadas) y las pruebas relevantes deben pasar. Indica en el Historial qué se ejecutó.
- Si cambia el alcance, no borres casillas: táchalas (`- [ ] ~~T-04 · …~~ (descartada: motivo)`) y añade las nuevas al final con el siguiente número.

## Al cambiar el estado (siempre los cuatro pasos)

1. Cambia la celda `Estado`.
2. Pon la fecha de hoy en `Actualizada`.
3. Añade una fila al final de `## Historial`: `| AAAA-MM-DD | \`nuevo-estado\` | Qué ha pasado y por qué |`.
4. Actualiza la fila del documento en el `README.md` de su carpeta (estado y fecha), como dice [`registro.md`](registro.md).

Cuando un DES o ADR pasa a `accepted`, añade su regla principal a `.sdd/decisiones.md` con `→ ID`; si pasa a `deprecated` o `superseded`, quita o sustituye esa línea. Si es un DES que fija algo visual o de componentes, lleva además sus reglas y valores a las partes del sistema de diseño que toque ([`sistema-diseno.md`](sistema-diseno.md)).
