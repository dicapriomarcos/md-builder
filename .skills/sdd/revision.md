# Cambios hechos por la persona desde MD SDD Hub (revisión obligatoria)

> Parte de la skill `sdd` — índice en [`SKILL.md`](SKILL.md).

Cuando la persona edita un `.md` desde MD SDD Hub (texto, estado o casillas), la app deja un aviso con el diff en `.sdd/review/<archivo>.md`. Si tu herramienta tiene instalado el hook de MD SDD Hub (Claude Code), recibirás además un recordatorio automático al inicio de cada mensaje mientras queden avisos; si no, compruébalo tú al empezar.

## Procedimiento

Al empezar a trabajar en el proyecto y siempre que haya avisos:

1. Lista `.sdd/review/*.md` (sin entrar en `.sdd/review/hecho/`). Si no hay, continúa normalmente.
2. Por cada aviso, lee los diffs y el archivo completo **en su estado actual**. Interpreta la intención: requisitos nuevos o cambiados, criterios modificados, tareas añadidas, decisiones aceptadas o rechazadas, cambio de estado (`in-progress` o `accepted` significan luz verde; volver a `backlog`, `planning`, `awaiting-approval` o `proposed` significa parar).
3. Comprueba la coherencia con el resto del documento, con el código actual y con los documentos relacionados. Si el cambio invalida trabajo hecho, desmarca las `T-NN` / `AC-NN` afectadas y añade las tareas nuevas. Si se acepta un ADR o DES, revisa si el código existente lo cumple y propone las tareas necesarias.
4. Si algo es ambiguo o contradictorio, pregunta a la persona antes de tocar código.
5. Añade al Historial del documento: `| AAAA-MM-DD | \`estado-actual\` | Revisados cambios de la persona: resumen breve |`.
6. Añade al final del aviso una sección `## Resultado de la revisión` con qué has entendido, qué has cambiado (documento o código) y qué preguntas quedan abiertas.
7. Mueve el aviso a `.sdd/review/hecho/AAAA-MM-DD-HHMM-<nombre-original>.md`. MD SDD Hub mostrará tu resultado a la persona.

No implementes código derivado de un cambio si la spec no está en `in-progress` (o la decisión en `accepted`): limítate a actualizar el documento y proponer el plan.
