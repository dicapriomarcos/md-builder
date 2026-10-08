# Ficha del proyecto y estado de la sesión

> Parte de la skill `sdd` — índice en [`SKILL.md`](SKILL.md).

Archivos del proyecto (no del kit: MD SDD Hub no los sobrescribe) que guardan lo que una IA necesita para retomar el trabajo sin preguntar lo mismo cada vez:

| Archivo | Qué guarda | Cuándo se lee | Plantilla |
|---|---|---|---|
| `.sdd/proyecto.md` | La ficha: qué es, stack, comandos, estructura, convenciones y el progreso del onboarding. Cambia poco. | Cuando la tarea necesita algo de ella | [plantillas/proyecto.md](plantillas/proyecto.md) |
| `.sdd/estado.md` | Dónde quedó el trabajo: en qué se estaba, siguientes pasos y bloqueos. Cambia en cada sesión. | Al empezar cada sesión | [plantillas/estado.md](plantillas/estado.md) |
| `.sdd/decisiones.md` | Las reglas vigentes, una por línea ([`registrar-decisiones.md`](registrar-decisiones.md)). | Antes de programar o escribir textos | [plantillas/decisiones.md](plantillas/decisiones.md) |
| `.sdd/git.md` | Identidad, remotes y cuándo se sube a cada uno ([`git.md`](git.md)). | Solo al hacer commit, push o desplegar | [plantillas/git.md](plantillas/git.md) |

Si falta `.sdd/proyecto.md` o su tabla `## Onboarding` tiene pasos pendientes, sigue [`onboarding.md`](onboarding.md).

## Mantener la ficha al día

Cuando cambie algo de la ficha (un comando, el stack, la estructura, una convención), actualízala en el momento y avisa con un mensaje corto: «📝 Actualicé `.sdd/proyecto.md`: qué ha cambiado». No la conviertas en un documento largo: lo que necesite explicación va en un ADR o en `docs/`, y las reglas, en `.sdd/decisiones.md`.

## Actualizar el estado

Actualiza `.sdd/estado.md` **al terminar una tarea, cuando aparezca o se resuelva un bloqueo y al acabar la sesión**, sin pedir permiso y avisando con un mensaje corto («📝 Actualicé `.sdd/estado.md`»).

- Pon la fecha de hoy en `Actualizada` y quién trabajó en `Agente` (por ejemplo, «Claude Code» o «Codex»).
- `## Dónde quedó`: dos o tres frases sobre lo último que se hizo y en qué punto está, con los IDs de los documentos (`SPEC-012`, `FIX-003`).
- `## Siguientes pasos`: una lista corta y ordenada, sin casillas (las casillas son solo para `AC-NN` y `T-NN`).
- `## Bloqueos`: qué impide avanzar y qué se necesita de la persona, o «Ninguno».
- Sustituye el contenido en lugar de acumularlo: es una foto del momento, no un diario. El historial ya está en los documentos y en git.
