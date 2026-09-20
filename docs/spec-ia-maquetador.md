# Spec para IA — Maquetador Visual Ligero

Este documento describe, en detalle y sin ambigüedad, el modelo de datos que usa el
Maquetador Visual Ligero para que una IA pueda **generar directamente el JSON del
layout** en vez de tener que operar la interfaz visual.

Fuente de verdad: el sanitizador del servidor en
[`includes/class-mvl-plugin.php`](../includes/class-mvl-plugin.php) (métodos
`sanitize_*`). Cualquier JSON que la IA genere pasa por ahí antes de guardarse, así
que si un valor no es válido **no se rechaza**: se reemplaza en silencio por su
default. Esto es importante — un JSON "casi correcto" no da error, da un resultado
visualmente distinto al esperado.

---

## 1. Modelo general

El layout es un **árbol**. La raíz es un array de nodos `section` (contenedores).
Cada `section` puede contener, como hijos, otras `section` (anidadas) y/o **bloques
de contenido** (`heading`, `text`, `button`, `image`).

```
layout: Section[]              // raíz, máx. 30 elementos
Section.children: (Section | Item)[]   // máx. 50 elementos, máx. 4 niveles de anidación
```

No existen otros tipos de nodo. No hay "columna", "fila", "grid" ni "espaciador"
como bloques propios: las columnas se simulan con `section` anidadas dentro de una
`section` con `flexDirection: row` (ver §7 y las limitaciones en §8).

### 1.1 Contrato de guardado

El endpoint REST es:

```
GET  /wp-json/mvl/v1/layout/{post_id}   -> { layout: Section[] }
POST /wp-json/mvl/v1/layout/{post_id}   body: { layout: Section[] }  -> { layout, saved: true }
```

Requiere nonce de WP (`X-WP-Nonce`) y permiso `edit_post`, así que en la práctica una
IA no llama a este endpoint directamente desde fuera de wp-admin: **genera el array
`layout`** y ese JSON es lo que se pega/inyecta como valor de `layout` (por ejemplo
sustituyendo `window.MVL.layout` o el body del POST). El propio JSON, una vez
guardado, queda embebido en `post_content` dentro de un comentario:

```html
<!-- mvl:document {"version":1,"layout":[ ... ]} -->
```

seguido del HTML/CSS ya renderizado. **La IA nunca debe escribir ese HTML a mano**;
solo genera el array `layout`, el propio plugin se encarga de renderizarlo.

---

## 2. Nodo `Section` (contenedor)

```jsonc
{
  "id": "hero",                  // opcional; string, ver §5 (ids)
  "type": "section",
  "settings": {
    "background":     ResponsiveValue<Background>,   // default: {type:"color", color:"#ffffff"}
    "border":         ResponsiveValue<Border>,        // default: {style:"none", width:"1px", color:"#000000", radius:"0px"}
    "tag":            "div" | "section" | "article",  // NO es responsive; default "section"
    "textAlign":      ResponsiveValue<"left"|"center"|"right">,  // default "left"
    "gap":            ResponsiveValue<SpacingSide>,   // default "16px"
    "flexDirection":  ResponsiveValue<"row"|"column">, // default "column"
    "justifyContent": ResponsiveValue<"flex-start"|"center"|"flex-end"|"space-between"|"space-around"|"space-evenly">, // default "flex-start"
    "alignItems":     ResponsiveValue<"stretch"|"flex-start"|"center"|"flex-end">, // default "stretch"
    "padding":        ResponsiveValue<Spacing>,  // default {top:"48px", right:"24px", bottom:"48px", left:"24px"}
    "margin":         ResponsiveValue<Spacing>   // default {top:"0px", right:"0px", bottom:"0px", left:"0px"}
  },
  "children": [ /* Section[] | Item[] */ ]
}
```

Notas clave:

- `tag` controla la etiqueta HTML del contenedor (`<section>`, `<div>` o
  `<article>`). Cualquier otro valor cae a `"section"`.
- `flexDirection` / `justifyContent` / `alignItems` / `gap` controlan el
  `display:flex` del **wrapper interno** `.mvl-container` (hijo directo de la
  section, `max-width:1140px; margin:0 auto; flex-wrap:wrap`), **no** el `<section>`
  en sí. En la práctica: esto define cómo se acomodan los **hijos directos** de esa
  section entre sí.
- `textAlign` se aplica también a ese `.mvl-container` (texto centrado/alineado de
  todo el contenido dentro).
- No hay ninguna propiedad de ancho/alto para la section (`width`, `height`,
  `flex-basis`, `flex-grow`, `min-height`, etc.). El único ancho fijo del sistema es
  el `max-width:1140px` del `.mvl-container`.

---

## 3. Nodo `Item` (bloque de contenido)

Los `type` válidos son `heading`, `text`, `button`, `image`. Solo pueden existir
como hijos de una `section` (no en la raíz).

```jsonc
{
  "id": "titulo-hero",
  "type": "heading" | "text" | "button" | "image",
  "data": { /* ver tabla abajo, depende de "type" */ },
  "settings": {
    "background": ResponsiveValue<Background>, // default: {type:"none"}
    "border":     ResponsiveValue<Border>,      // default: {style:"none", ...}
    "padding":    ResponsiveValue<Spacing>,     // default: 0 en los 4 lados
    "margin":     ResponsiveValue<Spacing>      // default: 0 en los 4 lados
  }
}
```

Un `Item` **no tiene** `textAlign`, `gap`, `flexDirection`, `justifyContent`,
`alignItems` ni `tag`: esas propiedades solo existen en `Section`.

### 3.1 `data` según `type`

| `type`     | Campos de `data`                                                                 | Sanitización / límites |
|------------|-----------------------------------------------------------------------------------|--------------------------|
| `heading`  | `text: string`, `level: 1-6` (default 2)                                          | `text` se limpia con `sanitize_text_field` (se pierde cualquier HTML embebido, es texto plano) |
| `text`     | `text: string` (puede llevar HTML simple)                                         | `text` pasa por `wp_kses_post` (permite `<p> <strong> <em> <a> <ul> <li> <br>`, etc., pero no `<script>` ni atributos peligrosos) y luego `wpautop()` en el render — **no hace falta que la IA agregue `<p>` manualmente**, los saltos de línea dobles ya generan párrafos |
| `button`   | `text: string`, `url: string`                                                     | `url` pasa por `esc_url_raw`; si viene vacía el link queda en `#` en la preview |
| `image`    | `url: string`, `alt: string`, `id: int` (attachment ID de WP), `size: string`      | `id` es el ID del adjunto en la Media Library; `size` es el "slug" de tamaño de imagen (`thumbnail`, `medium`, `medium_large`, `large`, `full`...) — **una IA sin acceso a la Media Library de ese sitio no puede inventar un `id` válido**, ver §8 |

Ejemplo de `text` con HTML permitido:

```json
{ "type": "text", "data": { "text": "Esto es <strong>importante</strong>.\n\nSegundo párrafo." } }
```

---

## 4. Tipos compartidos

### 4.1 `ResponsiveValue<T>`

Todo ajuste "de estilo" (fondo, borde, padding, margin, alineación, dirección,
gap...) se guarda envuelto así, para poder tener un valor distinto por dispositivo:

```jsonc
{
  "desktop": T,        // obligatorio, es el valor base/fallback
  "tablet":  T | null, // null = "hereda de desktop"
  "mobile":  T | null  // null = "hereda de tablet, o de desktop si tablet también es null"
}
```

Reglas para la IA:

- **Siempre** hay que rellenar `desktop`. Es el único obligatorio.
- Dejar `tablet`/`mobile` en `null` a menos que el usuario pida explícitamente un
  comportamiento distinto en esos anchos.
- Los breakpoints del CSS generado son: tablet `max-width:1024px`, mobile
  `max-width:767px`.
- Formato viejo (compatibilidad): un valor plano sin envolver en `{desktop,...}`
  también se acepta y se trata como si fuera solo `desktop` (tablet/mobile quedan en
  `null`). No es necesario usarlo, pero si se genera así no rompe nada.

### 4.2 `SpacingSide` (un solo lado: ancho de borde, radio, gap)

String con número + unidad CSS: `px`, `%`, `em`, `rem`, `vh`, `vw`.

```
"16px"   "1.5rem"   "50%"   "-8px"
```

- Rango numérico permitido: **-1000 a 1000** (se recorta si se pasa).
- Un número plano (`16` en vez de `"16px"`) se acepta y se asume `px`.
- Cualquier string que no matchee el patrón `^-?\d+(\.\d+)?(px|%|em|rem|vh|vw)$` cae
  al valor por defecto de ese campo (se pierde silenciosamente).

### 4.3 `Spacing` (padding / margin: los 4 lados)

```jsonc
{
  "top":    SpacingSide,
  "right":  SpacingSide,
  "bottom": SpacingSide,
  "left":   SpacingSide,
  "linked": boolean   // solo es un flag de UI ("los 4 lados vinculados"), no cambia el CSS
}
```

⚠️ **Trampa a evitar**: si en vez de un objeto se pasa un solo `SpacingSide` plano
(ej. `"padding": "20px"`), el sanitizador **solo aplica ese valor a `top` y
`bottom`**; `right` y `left` caen al default del campo. Para que la IA controle los
4 lados de forma predecible, **siempre generar el objeto completo con los 4 lados**,
nunca un string suelto.

### 4.4 `Background`

```jsonc
{
  "type": "none" | "color" | "image" | "gradient" | "video",
  "color": "#rrggbb",              // se usa solo si type:"color" (o como color de fallback)
  "image": {
    "url": "https://...",
    "size": "cover" | "contain" | "auto",     // default "cover"
    "position": "center center",              // string libre; la UI ofrece: "center center", "top center", "bottom center", "center left", "center right", pero el servidor acepta cualquier texto
    "repeat": "no-repeat" | "repeat"           // default "no-repeat"
  },
  "gradient": {
    "type": "linear" | "radial",     // default "linear"
    "angle": 0-360,                  // solo aplica si type:"linear"; default 180
    "stops": [ { "color": "#rrggbb", "pos": 0-100 }, ... ]  // mínimo 2, máximo 6; si hay menos de 2 se reemplaza por un default rojo->azul
  },
  "video": { "url": "https://.../video.mp4" }
}
```

Reglas:

- Aunque `type` sea `"color"`, hay que incluir igual las claves `image`, `gradient`,
  `video` con su forma default (o directamente omitirlas y dejar que el sanitizador
  las rellene) — el sanitizador siempre devuelve las 4 claves presentes sin importar
  el `type` activo, así que **da igual si la IA solo llena la rama relevante al
  `type` elegido**; las demás se normalizan a su default.
- Solo se ve un fondo de video si `type: "video"` **y** `video.url` no está vacío.
- Compatibilidad vieja: un string plano como `background` (ej. `"#ff0000"`) se
  interpreta como `{type:"color", color:"#ff0000"}`.

### 4.5 `Border`

```jsonc
{
  "style":  "none" | "solid" | "dashed" | "dotted",   // default "none"
  "width":  SpacingSide,   // default "1px"
  "color":  "#rrggbb",     // default "#000000"
  "radius": SpacingSide    // default "0px"
}
```

Si `style` es `"none"`, el borde no se dibuja aunque `width`/`color` tengan valor
(el CSS generado fuerza `border:none`), pero `radius` sí se sigue aplicando siempre
(un `border-radius` sin borde visible es válido, p. ej. para recortar imágenes de
fondo con esquinas redondeadas).

---

## 5. IDs

- `id` es opcional en la entrada; si falta, el servidor genera un UUID.
- Si se provee, pasa por `sanitize_key()`: **solo minúsculas, números, `_` y `-`**;
  cualquier otro carácter se elimina. `Mi-Hero!` → `mi-hero`.
- No hace falta que la IA garantice unicidad global perfecta, pero es buena
  práctica usar slugs descriptivos y únicos dentro del documento (`hero-titulo`,
  `hero-cta`, `columna-1-icono`) para que sea fácil referenciar/depurar nodos
  después.

---

## 6. Límites duros del servidor

| Límite | Valor |
|---|---|
| Secciones en la raíz | 30 (se recortan las demás) |
| Hijos por contenedor | 50 (se recortan los demás) |
| Niveles de anidación de `section` | 4 (root = nivel 0; se pueden anidar `section` hasta el nivel 3 inclusive; en el nivel 4 ya no se aceptan más `section` hijas, aunque sí bloques de contenido) |
| Ángulo de degradado | 0–360 |
| Paradas de degradado | 2–6 |
| Valores numéricos de spacing | -1000 a 1000 |

Cualquier nodo que exceda estos límites o tenga un `type` desconocido **se
descarta silenciosamente** al guardar, no genera error visible.

---

## 7. Cómo se traduce esto a HTML/CSS (para razonar sobre el resultado visual)

Cada `Section` se renderiza así:

```html
<section class="mvl-section mvl-bg-host" data-mvl-uid="...">
  <div class="mvl-container" style="max-width:1140px;margin:0 auto">
    <!-- hijos: otras <section> o los .mvl-item de sus Items -->
  </div>
</section>
```

`.mvl-container` tiene `display:flex; flex-wrap:wrap` fijo por CSS base, y encima
el CSS generado le agrega `flex-direction`, `justify-content`, `align-items`, `gap`
y `text-align` según los `settings` de esa `Section`.

Cada `Item` se renderiza como:

```html
<div class="mvl-item mvl-item-{type} mvl-bg-host" data-mvl-uid="...">
  <!-- heading: <h{level}>texto</h{level}> -->
  <!-- text:    <div class="mvl-text">párrafos con wpautop</div> -->
  <!-- button:  <p><a class="mvl-button" href="...">texto</a></p> -->
  <!-- image:   <img class="mvl-image" src="..." alt="..."> -->
</div>
```

Para hacer un layout de **"3 columnas"** el patrón es: una `Section` padre con
`flexDirection: "row"` y `gap`, y **3 `Section` hijas** dentro (cada una funcionando
como "columna", conteniendo sus propios `heading`/`text`/`image`). No se ponen los
items sueltos directamente en fila a menos que se quiera que floten libremente.

---

## 8. Limitaciones actuales a tener en cuenta (importante para la IA)

Estas cosas **no existen** en el modelo de datos hoy, así que la IA no debe
asumirlas ni inventar campos para ellas — cualquier campo que no esté en este
documento simplemente se ignora al sanitizar:

1. **No hay control de ancho por bloque/columna** (`width`, `flex-basis`,
   `flex-grow`, `%` de columna). Un layout de "3 columnas iguales" con
   `flexDirection: row` no reparte el espacio automáticamente: cada hija ocupa el
   ancho de su contenido y el `flex-wrap:wrap` hace que si no entran en una fila,
   bajen a la siguiente. Si el usuario pide columnas de ancho parejo, hoy no hay
   forma de lograrlo solo con JSON — es una limitación real del plugin, no algo que
   la IA pueda resolver con datos.
2. **No hay `width`/`height`/`min-height` en ningún nivel.**
3. **No hay control de tipografía** (tamaño de fuente, familia, peso, color de
   texto, line-height) fuera del `<h1>-<h6>` semántico y los estilos del tema
   activo. Todo lo tipográfico depende del CSS del tema.
4. **`image.data.id`** (attachment ID de la Media Library) no lo puede inventar una
   IA sin conocer el sitio real: si no se tiene un ID válido, lo más seguro es
   dejar `id: 0` y usar `url` con una imagen externa, o dejar el bloque de imagen
   vacío (`url: ""`) para que el usuario la cargue manualmente después.
5. **No hay bloques de "columna" ni "espaciador" ni "separador" ni "video embed de
   YouTube/Vimeo"** — solo `heading`, `text`, `button`, `image`, y el contenedor
   `section`. Un video de fondo sí existe (`background.type: "video"`, con URL de
   archivo `.mp4` directo, no embed de plataforma).
6. **El botón (`button`) no tiene variantes de estilo** propias (tamaño, color,
   contorno vs. relleno) más allá de las clases fijas `.mvl-button` definidas en
   CSS del tema/preview — su color/tamaño no se controla desde el JSON del layout,
   solo su `background`/`border`/`padding`/`margin` del **contenedor** que lo
   envuelve (el `<p>` alrededor del link no es un nodo separado).
7. `justifyContent`/`alignItems`/`flexDirection`/`gap`/`textAlign` solo se pueden
   fijar en `Section`, nunca en un `Item` individual.

Si en algún momento se quiere que la IA genere columnas de verdad, la solución real
es agregar al plugin un campo de ancho/flex-basis por hijo (fuera del alcance de
este documento — es una mejora al plugin, no al spec).

---

## 9. Checklist rápido para generar un layout válido

1. La raíz es siempre un array de `Section` (nunca un `Item` suelto en la raíz).
2. Cada `Section`/`Item` lleva `settings` completo con los sub-objetos que le
   corresponden (ver tablas arriba) — mejor generar el objeto completo que confiar
   en que "lo que falte se rellena bien", sobre todo en `padding`/`margin` (ver
   trampa de §4.3).
3. Todo ajuste de estilo va envuelto en `{desktop, tablet, mobile}`, con
   `tablet`/`mobile` en `null` salvo que se pida una diferencia real por
   dispositivo.
4. No inventar campos fuera de este spec (`width`, `fontSize`, `color` de texto,
   etc. no existen y se ignoran).
5. No superar los límites de §6.
6. Para columnas, anidar `Section` con `flexDirection: "row"` en el padre — y
   avisar al usuario de la limitación de ancho de §8.1 si pide algo pixel-perfect.

---

## 10. Ejemplo completo: Hero + 3 columnas + CTA

```json
[
  {
    "id": "hero",
    "type": "section",
    "settings": {
      "background": { "desktop": { "type": "color", "color": "#1d2327" }, "tablet": null, "mobile": null },
      "border": { "desktop": { "style": "none", "width": "1px", "color": "#000000", "radius": "0px" }, "tablet": null, "mobile": null },
      "tag": "section",
      "textAlign": { "desktop": "center", "tablet": null, "mobile": null },
      "gap": { "desktop": "16px", "tablet": null, "mobile": null },
      "flexDirection": { "desktop": "column", "tablet": null, "mobile": null },
      "justifyContent": { "desktop": "center", "tablet": null, "mobile": null },
      "alignItems": { "desktop": "center", "tablet": null, "mobile": null },
      "padding": { "desktop": { "top": "96px", "right": "24px", "bottom": "96px", "left": "24px", "linked": false }, "tablet": null, "mobile": { "top": "48px", "right": "16px", "bottom": "48px", "left": "16px", "linked": false } },
      "margin": { "desktop": { "top": "0px", "right": "0px", "bottom": "0px", "left": "0px", "linked": false }, "tablet": null, "mobile": null }
    },
    "children": [
      {
        "id": "hero-titulo",
        "type": "heading",
        "data": { "text": "Bienvenido a Tres Tristes Tigres", "level": 1 },
        "settings": {
          "background": { "desktop": { "type": "none" }, "tablet": null, "mobile": null },
          "border": { "desktop": { "style": "none", "width": "1px", "color": "#000000", "radius": "0px" }, "tablet": null, "mobile": null },
          "padding": { "desktop": { "top": "0px", "right": "0px", "bottom": "0px", "left": "0px", "linked": false }, "tablet": null, "mobile": null },
          "margin": { "desktop": { "top": "0px", "right": "0px", "bottom": "0px", "left": "0px", "linked": false }, "tablet": null, "mobile": null }
        }
      },
      {
        "id": "hero-texto",
        "type": "text",
        "data": { "text": "Agencia de desarrollo web y estrategia digital." },
        "settings": {
          "background": { "desktop": { "type": "none" }, "tablet": null, "mobile": null },
          "border": { "desktop": { "style": "none", "width": "1px", "color": "#000000", "radius": "0px" }, "tablet": null, "mobile": null },
          "padding": { "desktop": { "top": "0px", "right": "0px", "bottom": "0px", "left": "0px", "linked": false }, "tablet": null, "mobile": null },
          "margin": { "desktop": { "top": "0px", "right": "0px", "bottom": "0px", "left": "0px", "linked": false }, "tablet": null, "mobile": null }
        }
      }
    ]
  },
  {
    "id": "columnas",
    "type": "section",
    "settings": {
      "background": { "desktop": { "type": "color", "color": "#ffffff" }, "tablet": null, "mobile": null },
      "border": { "desktop": { "style": "none", "width": "1px", "color": "#000000", "radius": "0px" }, "tablet": null, "mobile": null },
      "tag": "section",
      "textAlign": { "desktop": "left", "tablet": null, "mobile": null },
      "gap": { "desktop": "32px", "tablet": null, "mobile": "16px" },
      "flexDirection": { "desktop": "row", "tablet": null, "mobile": "column" },
      "justifyContent": { "desktop": "space-between", "tablet": null, "mobile": null },
      "alignItems": { "desktop": "flex-start", "tablet": null, "mobile": null },
      "padding": { "desktop": { "top": "64px", "right": "24px", "bottom": "64px", "left": "24px", "linked": false }, "tablet": null, "mobile": null },
      "margin": { "desktop": { "top": "0px", "right": "0px", "bottom": "0px", "left": "0px", "linked": false }, "tablet": null, "mobile": null }
    },
    "children": [
      {
        "id": "col-1",
        "type": "section",
        "settings": {
          "background": { "desktop": { "type": "none" }, "tablet": null, "mobile": null },
          "border": { "desktop": { "style": "none", "width": "1px", "color": "#000000", "radius": "0px" }, "tablet": null, "mobile": null },
          "tag": "div",
          "textAlign": { "desktop": "left", "tablet": null, "mobile": null },
          "gap": { "desktop": "8px", "tablet": null, "mobile": null },
          "flexDirection": { "desktop": "column", "tablet": null, "mobile": null },
          "justifyContent": { "desktop": "flex-start", "tablet": null, "mobile": null },
          "alignItems": { "desktop": "flex-start", "tablet": null, "mobile": null },
          "padding": { "desktop": { "top": "0px", "right": "0px", "bottom": "0px", "left": "0px", "linked": false }, "tablet": null, "mobile": null },
          "margin": { "desktop": { "top": "0px", "right": "0px", "bottom": "0px", "left": "0px", "linked": false }, "tablet": null, "mobile": null }
        },
        "children": [
          { "id": "col-1-titulo", "type": "heading", "data": { "text": "Diseño", "level": 3 }, "settings": { "background": { "desktop": { "type": "none" }, "tablet": null, "mobile": null }, "border": { "desktop": { "style": "none", "width": "1px", "color": "#000000", "radius": "0px" }, "tablet": null, "mobile": null }, "padding": { "desktop": { "top": "0px", "right": "0px", "bottom": "0px", "left": "0px", "linked": false }, "tablet": null, "mobile": null }, "margin": { "desktop": { "top": "0px", "right": "0px", "bottom": "0px", "left": "0px", "linked": false }, "tablet": null, "mobile": null } } },
          { "id": "col-1-texto", "type": "text", "data": { "text": "Interfaces claras y a medida." }, "settings": { "background": { "desktop": { "type": "none" }, "tablet": null, "mobile": null }, "border": { "desktop": { "style": "none", "width": "1px", "color": "#000000", "radius": "0px" }, "tablet": null, "mobile": null }, "padding": { "desktop": { "top": "0px", "right": "0px", "bottom": "0px", "left": "0px", "linked": false }, "tablet": null, "mobile": null }, "margin": { "desktop": { "top": "0px", "right": "0px", "bottom": "0px", "left": "0px", "linked": false }, "tablet": null, "mobile": null } } }
        ]
      }
    ]
  },
  {
    "id": "cta",
    "type": "section",
    "settings": {
      "background": { "desktop": { "type": "gradient", "gradient": { "type": "linear", "angle": 120, "stops": [ { "color": "#2271b1", "pos": 0 }, { "color": "#135e96", "pos": 100 } ] } }, "tablet": null, "mobile": null },
      "border": { "desktop": { "style": "none", "width": "1px", "color": "#000000", "radius": "0px" }, "tablet": null, "mobile": null },
      "tag": "section",
      "textAlign": { "desktop": "center", "tablet": null, "mobile": null },
      "gap": { "desktop": "16px", "tablet": null, "mobile": null },
      "flexDirection": { "desktop": "column", "tablet": null, "mobile": null },
      "justifyContent": { "desktop": "center", "tablet": null, "mobile": null },
      "alignItems": { "desktop": "center", "tablet": null, "mobile": null },
      "padding": { "desktop": { "top": "64px", "right": "24px", "bottom": "64px", "left": "24px", "linked": false }, "tablet": null, "mobile": null },
      "margin": { "desktop": { "top": "0px", "right": "0px", "bottom": "0px", "left": "0px", "linked": false }, "tablet": null, "mobile": null }
    },
    "children": [
      { "id": "cta-boton", "type": "button", "data": { "text": "Hablemos de tu proyecto", "url": "/contacto" }, "settings": { "background": { "desktop": { "type": "none" }, "tablet": null, "mobile": null }, "border": { "desktop": { "style": "none", "width": "1px", "color": "#000000", "radius": "0px" }, "tablet": null, "mobile": null }, "padding": { "desktop": { "top": "0px", "right": "0px", "bottom": "0px", "left": "0px", "linked": false }, "tablet": null, "mobile": null }, "margin": { "desktop": { "top": "0px", "right": "0px", "bottom": "0px", "left": "0px", "linked": false }, "tablet": null, "mobile": null } } }
    ]
  }
]
```

---

## Pendiente / próximas secciones de este spec

- [ ] Prompt de sistema listo para pegar en una IA (rol + reglas + este spec resumido)
- [ ] Few-shots adicionales (galería de imágenes, testimonios, precios)
- [ ] Definir un mini-lenguaje o wrapper de "recetas" (ítems de negocio → JSON) si se
      decide construir eso
- [ ] Decidir si vale la pena agregar `width`/`flex-basis` por hijo al plugin para
      que la IA pueda hacer columnas reales
