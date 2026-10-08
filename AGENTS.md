# AGENTS.md

<!-- sdd-hub:start · v6 · es -->
## Especificaciones y decisiones (SDD)

Este proyecto usa desarrollo dirigido por especificaciones con el formato de MD SDD Hub.
**Responde, escribe y habla siempre en español** (chat, documentos, comentarios de código y commits).

Las reglas están en la skill [`.skills/sdd/SKILL.md`](.skills/sdd/SKILL.md). Ese archivo es un índice corto: las reglas que valen siempre
y qué archivo leer para cada tarea (tipos de documento, formato, estados, implementación, decisiones, revisión).
**Abre solo los archivos que necesite la tarea**, no la carpeta entera.

Al empezar cada sesión:

1. Si existe `.sdd/estado.md`, léelo: dice dónde quedó el trabajo.
2. Si no existe `.sdd/proyecto.md`, haz el onboarding que describe la skill; si existe, pregunta solo por los pasos de su
   onboarding que sigan `Pendiente` (como armar el sistema de diseño), una vez por sesión: si la persona lo deja
   para más tarde, vuelve a preguntar en la siguiente.
3. Revisa si hay avisos en `.sdd/review/` (cambios que la persona ha hecho desde MD SDD Hub) y revísalos.

Antes de programar o de escribir textos de la interfaz, lee `.sdd/decisiones.md` y respétalo, junto con los ADR y las
decisiones de diseño en `accepted`; antes de tocar la interfaz, también el índice del sistema de diseño
(`docs/design/sistema/index.md`) y solo las partes que toques. Cuando la persona fije una norma («siempre…», «nunca…», «di X en vez de Y»),
apúntala ahí en el momento.

**Nunca escribas secretos** (contraseñas, claves de API, tokens, valores de `.env`) en ningún `.md`: solo el nombre
de la variable. Antes de hacer commit, push o desplegar, lee `.skills/sdd/git.md` y `.sdd/git.md`; **nunca subas a
producción (`pro`) sin autorización expresa** de la persona para ese push.

Las demás skills del proyecto, si las hay, están en `.skills/<nombre>/`: cada `SKILL.md` es un índice cuya
`description` dice cuándo usarla. Abre solo los archivos que necesites.

<!-- sdd-hub:end -->
