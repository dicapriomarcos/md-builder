# Sistema de diseño

> Parte de la skill `sdd` — índice en [`SKILL.md`](SKILL.md).

El sistema de diseño reúne **lo que está vigente** en la interfaz: colores, tipografía, espaciado, bordes, sombras, iconos, componentes y patrones. Se reparte en muchos archivos cortos con un índice, para que la IA lea solo la parte que va a tocar, y **se arma de a poco**: cada decisión de diseño que se toma termina escrita en su parte.

## Dónde vive

En la subcarpeta `sistema/` de la carpeta de diseño (`dirs.design` de `.sdd.json`; por defecto `docs/design/sistema/`). El índice es `sistema/index.md`. Estructura de referencia (crea solo lo que haga falta):

```
docs/design/sistema/
├── index.md              ← índice: qué partes hay y dónde está cada cosa
├── fundamentos/
│   ├── colores.md        paleta, colores de marca, semánticos (éxito, error…), modo oscuro
│   ├── tipografia.md     fuentes, escala de tamaños, pesos, interlineado
│   ├── espaciado.md      escala de espacios (4, 8, 16…)
│   ├── maquetacion.md    rejilla, anchos máximos, breakpoints
│   ├── bordes.md         radios (border-radius) y grosores de borde
│   ├── sombras.md        elevación
│   ├── iconos.md         librería, tamaños, trazo
│   └── movimiento.md     duraciones, curvas, cuándo animar
├── componentes/
│   ├── botones.md
│   ├── formularios.md
│   ├── tarjetas.md
│   ├── avisos.md
│   ├── navegacion.md
│   ├── modales.md
│   └── tablas.md
└── patrones/
    ├── estados-vacios.md
    └── carga-y-errores.md
```

Los nombres de archivo van en español, en minúsculas, sin tildes ni eñes. Si hace falta una parte que no está en la lista (`componentes/pestanas.md`, `fundamentos/ilustraciones.md`), créala en la carpeta que le corresponda. Estos archivos no llevan ID ni estado: no son decisiones, son el resultado de ellas.

## Cuándo proponerlo

El paso `Diseño` de la tabla `## Onboarding` de `.sdd/proyecto.md` dice si el sistema ya se armó.

- **Si ya hay un diseño** (estilos en el código, un tema, mockups, Figma, capturas o un diseño que te pasa la persona) y el paso `Diseño` está `Pendiente`, o está en `✅` pero no existe `sistema/index.md` (se hizo con un kit anterior), **pregunta una vez**: «Este proyecto ya tiene diseño, pero no está escrito como sistema de diseño. ¿Lo armo ahora a partir de lo que hay? Solo te pediré que confirmes lo que encuentre».
- **Si dice que sí**: sigue el paso 3 de [`onboarding.md`](onboarding.md) (detecta, propone, escribe) y marca `Diseño` en `✅`.
- **Si dice que no o que más tarde**: deja `Diseño` en `Pendiente`, añádelo a `## Siguientes pasos` de `.sdd/estado.md` y **no vuelvas a preguntar en esta sesión**. Pregunta otra vez al empezar la siguiente, cuando aparezca trabajo de interfaz. Mientras tanto, las decisiones sueltas que tome la persona sí se escriben en su parte.
- **Si pide que no se lo vuelvas a preguntar**: marca `Diseño` como `No aplica` y no insistas; el sistema seguirá creciendo con las decisiones que se tomen.
- **Si aún no hay diseño** (proyecto nuevo): deja `Diseño` en `Pendiente` y pregunta la primera vez que llegue uno (la persona pasa una paleta, un mockup o un Figma, o se construyen las primeras pantallas).

## Cómo se arma

- **Cuando se toma una decisión de diseño, escríbela en su parte en el momento**: un color, una fuente, un radio, cómo es un botón, qué hace un aviso. Si la parte no existe, créala con la [plantilla](plantillas/sistema-diseno-parte.md); si no existe el sistema, crea también `index.md` con la [plantilla del índice](plantillas/sistema-diseno-indice.md). Avisa con un mensaje corto: «🎨 Actualicé `docs/design/sistema/componentes/botones.md`: radio `--radio-md`».
- **Solo entra lo decidido**: lo que diga la persona, lo que confirme en el onboarding o lo de un DES `accepted`. Lo que propones tú y nadie ha confirmado no entra: pregúntalo o crea un DES en `proposed`. No rellenes partes con valores inventados ni crees archivos vacíos «por si acaso».
- **Una cosa, un sitio.** Los valores se definen una sola vez, en `fundamentos/`, con un nombre de token (`--color-primario`, `--radio-md`, `--espacio-4`). Los componentes y patrones citan el token, nunca el valor suelto, para que cambiarlo sea tocar una sola línea.
- **El código manda en los valores.** Si los tokens existen en el código (variables CSS en `:root`, `tailwind.config.*`, `theme.json`, el tema del framework), cada parte dice en «En el código» dónde viven, y al cambiar un valor se cambia en los dos sitios. Si ves que el código y el sistema no coinciden, avisa a la persona en lugar de elegir tú.
- **Al cambiar algo, sustituye**: el sistema es una foto de lo vigente, no un historial. Pon la fecha de hoy en `Actualizada` de la parte y en su fila del índice. El porqué y las alternativas van en el DES (enlázalo en «Decisiones»); la historia, en git.
- **Mantén el índice al día**: cada parte que se crea, se divide o se borra cambia su fila en `index.md`. Si una parte pasa de unas 150 líneas, divídela (por ejemplo `componentes/formularios/campos.md` y `componentes/formularios/selectores.md`) y actualiza el índice.
- Sin casillas (`- [ ]`): son solo para `AC-NN` y `T-NN`.

## Con los DES y con `.sdd/decisiones.md`

- **DES**: para decisiones que necesitan contexto o alternativas (el sistema de botones, la navegación, el modo oscuro). Mientras está en `proposed`, el sistema no cambia. Cuando la persona lo pasa a `accepted`, lleva sus reglas a las partes que toque y enlaza el DES en su sección «Decisiones».
- **`.sdd/decisiones.md`**: al crear el sistema, añade en `Interfaz` una sola línea que lo enlace: `- AAAA-MM-DD · Sigue el sistema de diseño: lee docs/design/sistema/index.md y las partes que toques`. Las normas visuales y de componentes van en el sistema, no como líneas sueltas en `decisiones.md`, para no tenerlas en dos sitios. Las de los textos (`Textos`) siguen en `decisiones.md`.

## Cuándo leerlo

**Antes de construir o cambiar una pantalla o un componente**: lee `index.md` y **solo las partes que vas a tocar** (un botón: `componentes/botones.md` y los tokens que cite). No abras la carpeta entera. Usa los tokens del sistema en lugar de valores sueltos y, si lo que te piden lo contradice, avisa antes de hacerlo.
