---
name: sdd
version: 6
install: always
description: >
  Documentación SDD de este proyecto en el formato de MD SDD Hub: features (specs), decisiones de
  diseño UX/UI, sistema de diseño, decisiones de arquitectura (ADR) y fixes. Úsala siempre que haya que
  crear, redactar, revisar, aprobar, implementar, verificar o cerrar una spec, una funcionalidad, una decisión
  de diseño o de arquitectura, o documentar un fix ("crea una spec para…", "documenta esta decisión", "crea un ADR",
  "registra este fix", "pasa la SPEC-012 a in-progress", "marca las tareas hechas"); antes de programar
  cualquier funcionalidad de alcance medio o alto; al elegir o cambiar tecnologías, patrones o
  convenciones de código; al decidir colores, tipografía, espaciado, bordes o cómo son los componentes
  (sistema de diseño); antes de construir o cambiar pantallas; al corregir un error no trivial; y cuando
  haya avisos en `.sdd/review/`.
---

<!-- sdd-hub v6 · formato sdd-hub/1 · lang es -->

# Skill: SDD (formato MD SDD Hub)

> Instrucciones para cualquier agente de IA (Codex, Claude Code, Gemini, Cursor, Copilot…) y para las personas del equipo. Las instala y actualiza MD SDD Hub: si cambias esta carpeta a mano, se sobrescribirá en la próxima actualización. Las normas propias del proyecto van en `AGENTS.md`.

Este proyecto sigue desarrollo dirigido por especificaciones. Los documentos los lee una herramienta (MD SDD Hub) que analiza los archivos de forma literal, así que **el formato es obligatorio**: no inventes claves, secciones alternativas ni otros nombres de estado.

**Este archivo es un índice.** Las reglas de abajo valen siempre; el detalle está en archivos cortos que solo se leen cuando la tarea los pide. No abras la carpeta entera.

---

## Reglas que valen siempre

Sin abrir ningún otro archivo:

- **Responde, escribe y habla siempre en español**: en el chat con la persona, en los documentos (specs, decisiones, fixes, historial, avisos de revisión), en los comentarios del código y en los mensajes de commit. Aunque te escriban en otro idioma o el código esté en otro idioma, mantén el español salvo que la persona pida expresamente otra cosa.
- **Los nombres de archivo `.md` van en español**, sin tildes ni eñes (por ejemplo `SPEC-038-exportar-informes-en-pdf.md`).
- Los identificadores técnicos no se traducen: estados (`backlog`, `in-progress`…), prefijos (`SPEC`, `ADR`…), `FR-NN`, `AC-NN`, `T-NN`.
- **Nunca** pases nada a `done`, `accepted`, `rejected` o `cancelled` por tu cuenta, ni una feature de `awaiting-approval` a `in-progress`: propónlo y espera confirmación.
- No empieces a programar una funcionalidad de alcance medio o alto sin una spec aprobada (en `in-progress`).
- **Antes de programar o de escribir textos de la interfaz, lee `.sdd/decisiones.md`** (es corto) y los ADR y DES en `accepted` que afecten a lo que vas a tocar, y cumple sus reglas. Si vas a tocar la interfaz y existe el sistema de diseño (`docs/design/sistema/index.md`), lee su índice y solo las partes que toques.
- Cuando la persona fije una norma («siempre…», «nunca…», «di X en vez de Y»), **apúntala en el momento** en `.sdd/decisiones.md` siguiendo [`registrar-decisiones.md`](registrar-decisiones.md). Si es una decisión visual o de un componente (un color, una fuente, un radio, cómo es un botón), va en su parte del sistema de diseño ([`sistema-diseno.md`](sistema-diseno.md)).
- Las casillas (`- [ ]` / `- [x]`) se reservan para `AC-NN` y `T-NN`: la herramienta las cuenta como progreso.
- **Nunca escribas secretos en ningún `.md`**: contraseñas, claves de API, tokens, cadenas de conexión con credenciales ni valores de `.env`. Escribe solo el nombre de la variable (`STRIPE_SECRET_KEY` en `.env`). Si encuentras uno, sigue [`seguridad.md`](seguridad.md).
- **Nunca subas a producción (`pro`) sin autorización expresa** de la persona para ese push. Antes de cualquier commit o push, lee [`git.md`](git.md).

## Al empezar cada sesión

1. Si existe `.sdd/estado.md`, léelo: dice dónde quedó el trabajo. Es corto.
2. Si **no** existe `.sdd/proyecto.md`, o su tabla `## Onboarding` tiene pasos `Pendiente`, sigue [`onboarding.md`](onboarding.md) solo para lo que falte. Si todo está en `✅`, no preguntes nada sobre el proyecto, salvo lo del sistema de diseño (abajo).
3. Si el proyecto ya tiene diseño y el paso `Diseño` está `Pendiente` (o en `✅` sin `docs/design/sistema/index.md`), **pregunta una vez** si se arma ahora el sistema de diseño. Si dice que no, déjalo `Pendiente` y vuelve a preguntar en la próxima sesión ([`sistema-diseno.md`](sistema-diseno.md)).
4. Mira si hay avisos en `.sdd/review/` (sin entrar en `hecho/`). Si los hay, revísalos antes de seguir con trabajo relacionado.

Al terminar una tarea y al acabar la sesión, actualiza `.sdd/estado.md` (formato en [`sesion.md`](sesion.md)).

---

## Índice

| Archivo | Cuándo leerlo |
|---------|---------------|
| [`tipos.md`](tipos.md) | Al decidir si algo necesita un documento y de qué tipo (feature, diseño, arquitectura o fix) |
| [`formato.md`](formato.md) | **Antes de crear o reestructurar un documento**: dónde va, cómo se llama, metadatos y secciones obligatorias |
| [`plantillas/`](plantillas/) | Al crear un documento: una plantilla por tipo |
| [`estados.md`](estados.md) | **Antes de cambiar el estado de un documento**: ciclos de vida, quién decide cada estado y los cuatro pasos del cambio |
| [`implementacion.md`](implementacion.md) | Al implementar una feature o un fix: casillas, trabajo nuevo y decisiones tomadas por el camino |
| [`registro.md`](registro.md) | Al crear un documento o cambiar su estado: la tabla del `README.md` de su carpeta |
| [`registrar-decisiones.md`](registrar-decisiones.md) | Cuando la persona fije una norma o se tome una decisión: si va en una línea de `.sdd/decisiones.md` o en un DES / ADR, y con qué formato |
| [`sistema-diseno.md`](sistema-diseno.md) | Cuando se decida algo visual o de un componente (colores, fuentes, espaciado, bordes, botones…) y **antes de construir o cambiar pantallas**: el sistema de diseño por partes, con su `index.md` |
| [`onboarding.md`](onboarding.md) | Si falta `.sdd/proyecto.md` o su onboarding tiene pasos pendientes (ficha, Git, diseño, decisiones existentes), o si la persona pide repetir un paso |
| [`sesion.md`](sesion.md) | Al actualizar `.sdd/estado.md` o la ficha del proyecto: qué archivo del proyecto guarda cada cosa |
| [`git.md`](git.md) | **Solo al hacer commit, push o desplegar**: identidad, cuándo subir a origin, dev y pro, y reglas |
| [`seguridad.md`](seguridad.md) | Si encuentras o te piden escribir un secreto, al tocar `.env` o `.gitignore`, y al crear carpetas con documentos en la parte pública |
| [`revision.md`](revision.md) | Si hay avisos en `.sdd/review/`: cambios que la persona ha hecho desde MD SDD Hub |
