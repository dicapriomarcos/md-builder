# Tipos de documento

> Parte de la skill `sdd` — índice en [`SKILL.md`](SKILL.md).

| Tipo | Para qué | Prefijo | Carpeta por defecto | Plantilla |
|---|---|---|---|---|
| **Feature** | Una característica de la aplicación: qué hace, requisitos, criterios y tareas | `SPEC` | `docs/specs/` | [plantillas/feature.md](plantillas/feature.md) |
| **Diseño** | Una decisión de diseño UX/UI: pantallas, flujos, componentes, estilos, textos, accesibilidad | `DES` | `docs/design/` | [plantillas/diseno.md](plantillas/diseno.md) |
| **Arquitectura** | Una decisión técnica (ADR): tecnologías, librerías, patrones, estructura de carpetas y clases, convenciones de código, contratos entre módulos | `ADR` | `docs/architecture/` | [plantillas/arquitectura.md](plantillas/arquitectura.md) |
| **Fix** | Una corrección importante: síntoma, causa raíz, solución y prevención | `FIX` | `docs/fixes/` | [plantillas/fix.md](plantillas/fix.md) |

## Cuándo crear cada uno

- **Feature**: funcionalidad nueva o cambio de comportamiento de alcance medio o alto.
- **Diseño**: cuando se decide algo de la interfaz que afecta a más de una pantalla o que hay que mantener en el tiempo y necesita contexto o alternativas (un patrón de componente, la navegación, el modo oscuro, el tono de los textos). Lo que queda vigente se escribe además en el **sistema de diseño** (`docs/design/sistema/`, ver [`sistema-diseno.md`](sistema-diseno.md)): colores, tipografía, espaciado, bordes, componentes y patrones, un archivo por parte con un `index.md`. Los valores sueltos (un color, un radio) van directos al sistema, sin DES.
- **Arquitectura**: al elegir o cambiar una tecnología o librería, un patrón, la estructura del código o una convención. Si al programar vas a contradecir un ADR `accepted`, no lo hagas en silencio: propón un ADR nuevo que lo sustituya.
- **Fix**: regresiones, incidentes en producción, errores con una causa raíz no obvia o cuando la persona lo pida. Los errores triviales no necesitan FIX.

Una feature puede citar las decisiones en las que se apoya (`ADR-003`, `DES-002`) y un fix la feature afectada (`SPEC-012`), en la fila `Dependencias` o `Relacionadas`.

Las decisiones que caben en una línea («di X en vez de Y») no necesitan documento: van en `.sdd/decisiones.md` (ver [`registrar-decisiones.md`](registrar-decisiones.md)). Las que tienen DES o ADR también se enlazan desde allí.

Para crear el documento, sigue [`formato.md`](formato.md).
