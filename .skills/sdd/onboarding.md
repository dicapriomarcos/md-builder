# Onboarding del proyecto

> Parte de la skill `sdd` — índice en [`SKILL.md`](SKILL.md).

El onboarding recoge lo que una IA necesita saber de un proyecto para no preguntarlo en cada sesión. Sirve igual para un proyecto nuevo que para uno **ya empezado**: en ese caso casi todo se puede deducir del código, y la persona solo confirma.

Se hace **por pasos** y el progreso queda en la tabla `## Onboarding` de `.sdd/proyecto.md`:

```markdown
## Onboarding

| Paso | Estado |
|---|---|
| Ficha | ✅ |
| Git | ✅ |
| Diseño | Pendiente |
| Decisiones existentes | No aplica |
```

Estados: `✅`, `Pendiente` o `No aplica` (por ejemplo, Diseño en una librería sin interfaz).

## Cuándo

- **Si `.sdd/proyecto.md` no existe** o su tabla tiene pasos `Pendiente`: haz **solo los pasos pendientes**, antes de la primera tarea de alcance medio o alto. Si la persona pide algo pequeño y urgente, hazlo primero y propón el onboarding después.
- **Si todos los pasos están en `✅` o `No aplica`: no hagas nada.** No vuelvas a leer este archivo ni a preguntar por el proyecto.
- Si la persona pide «haz el onboarding de diseño» (o de otro paso), hazlo aunque esté marcado.

## Cómo, en cada paso

1. **Detecta antes de preguntar.** Lee lo que indique el paso (abajo) sin pedir permiso.
2. Avisa una vez: «Antes de arrancar necesito conocer un poco este proyecto. Te haré unas preguntas cortas».
3. **Pregunta de una en una**, y solo lo que no hayas podido deducir. En cada pregunta propone la respuesta que has deducido para que la persona solo confirme o corrija. Máximo cinco preguntas por paso.
4. Escribe el resultado donde corresponda y marca el paso en `✅` en la tabla. Si la persona prefiere dejarlo para otro momento, déjalo en `Pendiente`.
5. Nunca copies valores de `.env`, contraseñas ni claves (ver [`seguridad.md`](seguridad.md)): solo los nombres de las variables.

## Paso 1 · Ficha

- **Detecta**: `README`, `package.json`, `composer.json`, `pyproject.toml`, `Gemfile`, `go.mod`, la estructura de carpetas, la configuración de tests y de lint, `AGENTS.md`.
- **Pregunta** lo que falte: qué es el proyecto y para quién, cómo se arranca y se prueba, dónde se despliega.
- **Escribe** `.sdd/proyecto.md` con la [plantilla](plantillas/proyecto.md) (lo que no se sepa, «Por definir») y crea `.sdd/estado.md` y `.sdd/decisiones.md` con sus plantillas si no existen.

## Paso 2 · Git

- **Detecta**: si hay repositorio, `git remote -v` (sin copiar credenciales de las URL), la rama actual y las ramas remotas, `git config --local user.name` / `user.email` y el estilo de los últimos commits (`git log --oneline -15`: idioma, prefijos, emojis).
- **Pregunta** lo que falte: con qué nombre y email se commitea en este proyecto, qué remotes hay (origin, dev, pro…) y cuándo se sube a cada uno, y si la IA commitea sola o solo propone el commit.
- **Escribe** `.sdd/git.md` con la [plantilla](plantillas/git.md). Por defecto, `pro` (producción) **solo con autorización expresa**.

## Paso 3 · Diseño (si el proyecto tiene interfaz)

En un proyecto ya empezado el diseño existe aunque no esté escrito: el objetivo es ponerlo por escrito, como **sistema de diseño** por partes, para que la IA lo respete. Cuándo proponerlo y qué hacer si la persona lo deja para más tarde (se vuelve a preguntar en la siguiente sesión): [`sistema-diseno.md`](sistema-diseno.md). Si aún no hay diseño, deja el paso `Pendiente` hasta que llegue uno.

- **Detecta**: variables CSS (`:root`, `--color-*`), `tailwind.config.*`, `theme.json` (WordPress), tokens o el tema del framework de componentes, las fuentes que se cargan, y cómo son de verdad los componentes más repetidos (botones, formularios, tarjetas, avisos). Mira también el tono de los textos de la interfaz (tú o usted, mayúsculas, longitud).
- **Propón**, no impongas: resume lo encontrado («Primario #2563eb, fuente Inter, botones redondeados de 8 px con texto en mayúscula inicial, tuteo») y pregunta si es así como debe seguir siendo o si algo es un error que no hay que copiar.
- **Escribe**:
  - Lo confirmado, en el **sistema de diseño** (`docs/design/sistema/`) siguiendo [`sistema-diseno.md`](sistema-diseno.md): `index.md` y una parte por cada cosa que hayas encontrado (`fundamentos/colores.md`, `fundamentos/tipografia.md`, `fundamentos/bordes.md`, `componentes/botones.md`…), con sus tokens y dónde viven en el código. Solo las partes de las que haya algo; el resto se irá añadiendo cuando se decida.
  - En `.sdd/decisiones.md`, la línea de `Interfaz` que enlaza el índice del sistema y las reglas de `Textos` (tono, tú o usted), como dice [`registrar-decisiones.md`](registrar-decisiones.md).
  - Lo que la persona no tenga claro o quiera cambiar, en «Por definir» del índice o como DES en `proposed`.

## Paso 4 · Decisiones existentes

- **Detecta**: las decisiones técnicas que ya están tomadas en el código: framework y versión, gestor de estado, ORM, estructura de carpetas, convenciones de nombres, librerías que se usan (y las que se evitan), cómo se hacen los tests.
- **Propón** la lista a la persona y pregunta cuáles son decisiones firmes y cuáles accidentes.
- **Escribe** las firmes como reglas en `.sdd/decisiones.md` (área `Código`) y, las que necesiten contexto, como ADR en `proposed`. No crees un ADR por cada librería: solo para lo que se discutiría de nuevo si nadie lo dejara escrito.
