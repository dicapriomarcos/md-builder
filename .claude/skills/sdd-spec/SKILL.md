---
name: sdd-spec
description: Documentación SDD de este proyecto en el formato de MD SDD Hub - features (specs), decisiones de diseño UX/UI, sistema de diseño, decisiones de arquitectura (ADR) y fixes. Úsala siempre que el usuario pida crear, redactar, revisar, aprobar, implementar, verificar o cerrar una spec, una funcionalidad, una decisión de diseño o de arquitectura, o documentar un fix ("crea una spec para…", "documenta esta decisión", "crea un ADR", "registra este fix", "pasa la SPEC-012 a in-progress", "marca las tareas hechas"); antes de programar cualquier funcionalidad de alcance medio o alto; al elegir o cambiar tecnologías, patrones o convenciones de código, al decidir colores, tipografía, bordes o cómo son los componentes (sistema de diseño), antes de construir o cambiar pantallas, al corregir un error no trivial, cuando la persona fije una norma («di X en vez de Y», «nunca…») y antes de hacer commit, push o desplegar.
---

<!-- sdd-hub v6 · acceso para Claude Code · lang es -->

# Documentación SDD (MD SDD Hub)

Las reglas de este proyecto son comunes a todos los agentes de IA y están en la skill **`.skills/sdd/`** (en la raíz del proyecto). Su `SKILL.md` es un índice: las reglas que valen siempre y qué archivo leer para cada tarea, con las plantillas en `.skills/sdd/plantillas/`. El sistema de diseño del proyecto está en `docs/design/sistema/index.md`.

Antes de crear o modificar cualquier spec, decisión de diseño, ADR o fix, y antes de implementar una funcionalidad, **lee `.skills/sdd/SKILL.md` y los archivos que indique su índice para esa tarea, y síguelos al pie de la letra**. Este archivo es solo un acceso para que Claude Code las cargue en el momento adecuado; no contiene reglas propias.

Responde, escribe y habla siempre en español.
