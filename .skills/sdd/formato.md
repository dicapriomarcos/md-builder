# Ubicación y formato de los documentos

> Parte de la skill `sdd` — índice en [`SKILL.md`](SKILL.md).

## Dónde vive cada cosa

- Lee primero `.sdd.json` en la raíz del proyecto, si existe. `dirs` indica la carpeta de cada tipo (`feature`, `design`, `architecture`, `fix`), `specsDir` la de las features, `sddDoc` el documento de diseño del sistema e `idPrefix` el prefijo de las features (por defecto `SPEC`). Si no existe, usa las carpetas por defecto de [`tipos.md`](tipos.md).
- Un documento = un archivo: `<carpeta>/<PREFIJO>-NNN-slug.md`.
  - `NNN`: siguiente número libre de ese prefijo, con tres dígitos (`ADR-007`). Mira la carpeta y usa el mayor + 1. Nunca reutilices un número.
  - `slug`: en español, en minúsculas, sin tildes ni eñes, palabras separadas por guiones, unas 6 palabras como máximo (p. ej. `exportar-informes-en-pdf`).
- Plantilla: `<carpeta>/000-TEMPLATE.md` si existe; si no, la de [`plantillas/`](plantillas/) para ese tipo.
- Registro: `<carpeta>/README.md`, con una tabla bajo `## Registro` (ver [`registro.md`](registro.md)).
- El **sistema de diseño** vive en `<carpeta de diseño>/sistema/` y tiene su propio formato, sin ID ni estado: ver [`sistema-diseno.md`](sistema-diseno.md).

## Estructura obligatoria

Primera línea: `# <ID> · Título en lenguaje natural` (con el punto medio `·`).

Inmediatamente después, la tabla de metadatos de la plantilla, con sus claves exactas y en su orden. En las features:

```markdown
| Campo | Valor |
|---|---|
| Estado | `backlog` |
| Autor | Quién lo redacta (persona o agente) |
| Propietario | Persona o rol responsable |
| Creada | 2026-01-31 |
| Actualizada | 2026-01-31 |
| Objetivo de release | Versión o «Por definir» |
| Dependencias | SPEC-003, ADR-002 o «Ninguna» |
```

Diseño y arquitectura usan `Relacionadas` en lugar de `Objetivo de release` y `Dependencias`; los fixes añaden `Gravedad` (Alta / Media / Baja).

Reglas de los metadatos:

- `Estado` contiene **solo** el estado entre comillas invertidas. Nada más en esa celda: los matices («solo fase 1», «bloqueada por X») van en el Historial.
- Fechas siempre en ISO `AAAA-MM-DD`.
- `Dependencias` / `Relacionadas`: IDs completos separados por comas, para que la herramienta pueda enlazarlos.

## Secciones

Secciones de una **feature** (encabezados `##` numerados; omite solo las que no apliquen y dilo):

1. `## 1. Resumen`
2. `## 2. Problema y evidencia`
3. `## 3. Objetivos`
4. `## 4. Fuera de alcance`
5. `## 5. Usuarios y permisos`
6. `## 6. Requisitos`: tabla `| ID | Requisito |` con IDs `FR-01`, `FR-02`… (y `NFR-01` para no funcionales).
7. `## 7. Criterios de aceptación`: **solo** casillas con este formato exacto:
   `- [ ] AC-01 · Descripción verificable`
8. `## 8. Diseño técnico`: arquitectura, datos, migraciones, API y UX (enlaza los ADR y DES aplicables).
9. `## 9. Plan de tareas`: **solo** casillas con este formato exacto:
   `- [ ] T-01 · Tarea concreta y pequeña`
10. `## 10. Riesgos y mitigaciones`
11. `## 11. Preguntas abiertas`

**Diseño y arquitectura**: Contexto, Decisión, Alternativas consideradas, Consecuencias y Reglas (para la interfaz o para el código). La sección de reglas es la más importante: normas concretas que la IA debe aplicar a partir de ahora.

**Fix**: Síntoma (con pasos para reproducir), Causa raíz, Solución, Prevención, Criterios de verificación (`AC-NN`) y Plan de tareas (`T-NN`).

Todos los tipos terminan con `## Historial`:

```markdown
## Historial

| Fecha | Estado | Nota |
|---|---|---|
| 2026-01-31 | `backlog` | Creación |
```

Las casillas (`- [ ]` / `- [x]`) se reservan para `AC-NN` y `T-NN`. No uses casillas para otras listas: la herramienta las cuenta como progreso.
