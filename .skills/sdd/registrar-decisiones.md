# Decisiones rápidas (`.sdd/decisiones.md`)

> Parte de la skill `sdd` — índice en [`SKILL.md`](SKILL.md).

`.sdd/decisiones.md` es la lista de **todas las reglas vigentes** del proyecto, una por línea, agrupadas por área. Es del proyecto (MD SDD Hub no la sobrescribe) y la persona también puede añadir reglas desde la app. Plantilla: [plantillas/decisiones.md](plantillas/decisiones.md).

## Cuándo apuntar una decisión

En cuanto la persona fije una norma, aunque sea de pasada: «siempre…», «nunca…», «di X en vez de Y», «los botones van así», «no uses esta librería», «los commits en inglés». Apúntala **en el momento**, sin pedir permiso, y avisa con un mensaje corto: «📝 Anotada en `.sdd/decisiones.md`: la regla».

¿Línea rápida o documento?

- **Solo una línea** si la regla se entiende sola y no hubo alternativas que discutir (un texto, un nombre, una preferencia).
- **DES o ADR** si necesita contexto, alternativas o consecuencias, o si afecta a muchas pantallas o a la estructura del código (el sistema de botones, la navegación, una librería). Créalo en `proposed` siguiendo [`formato.md`](formato.md) y añade además una línea en `decisiones.md` que lo enlace, para que la regla se encuentre en un único sitio.
- **Sistema de diseño** si es una decisión visual o de un componente (un color, una fuente, un tamaño, un radio, cómo es un botón o un aviso): escríbela en su parte de `docs/design/sistema/` siguiendo [`sistema-diseno.md`](sistema-diseno.md), no como línea suelta. `decisiones.md` solo lleva una línea que enlaza el índice del sistema.

## Formato

```markdown
## Textos

- 2026-10-03 · Di «Guardar cambios», no «Enviar», en los formularios de edición.

## Interfaz

- 2026-10-03 · Botones: primario relleno, secundario con borde, nunca dos primarios juntos → DES-004
```

- Áreas (encabezados `##`): `Textos`, `Interfaz`, `Código`, `Proceso`. Añade otra solo si ninguna encaja.
- Cada regla: `- AAAA-MM-DD · Regla en imperativo, concreta y comprobable`. Si hay un documento detrás, termina con `→ ID` (`→ DES-004`, `→ ADR-002`).
- Sin casillas: las casillas son solo para `AC-NN` y `T-NN`.
- Si una regla cambia, **sustituye la línea** (con la fecha nueva) en lugar de añadir otra que la contradiga. Si deja de aplicar, bórrala; si tenía DES o ADR, pásalo a `deprecated` o `superseded`.

## Cuándo leerla

Es corta: léela entera **antes de programar, de escribir textos de la interfaz o de proponer una decisión**, y respétala igual que los DES y ADR `accepted`. Si algo que te piden la contradice, avisa a la persona antes de hacerlo.
