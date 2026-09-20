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

No existen otros tipos de nodo. No hay "columna" ni "espaciador" como bloques
propios: las columnas se simulan con `section` anidadas dentro de una `section`
padre — hoy con `display:"grid"` y `columns: N` para ancho parejo (recomendado,
ver §2/§8.1/§11), o con el patrón más viejo `flexDirection:"row"` si se acepta que
las columnas floten según su contenido (ver §7 y las limitaciones en §8).

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
    "classes":        string,    // NO es responsive; default ""; ver §4.6
    "htmlId":         string,    // NO es responsive; default ""; ver §4.6
    "display":        "flex" | "grid",  // NO es responsive; default "flex"; ver nota de grid abajo
    "columns":        ResponsiveValue<int 1-12>,  // default 3; solo tiene efecto si display:"grid"
    "width":          GridWidth,  // NO es responsive; default ""; SOLO tiene efecto en un hijo directo de una Section en modo "grid" — ver nota de grid abajo
    "textAlign":      ResponsiveValue<"left"|"center"|"right">,  // default "left"
    "gap":            ResponsiveValue<SpacingSide>,   // default "16px"
    "flexDirection":  ResponsiveValue<"row"|"column">, // default "column"; solo tiene efecto si display:"flex"
    "justifyContent": ResponsiveValue<"flex-start"|"center"|"flex-end"|"space-between"|"space-around"|"space-evenly">, // default "flex-start"; solo si display:"flex"
    "alignItems":     ResponsiveValue<"stretch"|"flex-start"|"center"|"flex-end">, // default "stretch"; solo si display:"flex"
    "padding":        ResponsiveValue<Spacing>,  // default {top:"48px", right:"24px", bottom:"48px", left:"24px"}
    "margin":         ResponsiveValue<Spacing>   // default {top:"0px", right:"0px", bottom:"0px", left:"0px"}
  },
  "children": [ /* Section[] | Item[] */ ]
}
```

Notas clave:

- `tag` controla la etiqueta HTML del contenedor (`<section>`, `<div>` o
  `<article>`). Cualquier otro valor cae a `"section"`.
- `display` elige el modelo de layout del **wrapper interno** `.mvl-container`
  (hijo directo de la section): `"flex"` (default, el de siempre) o `"grid"`. Con
  `"grid"`, `flexDirection`/`justifyContent`/`alignItems` no tienen efecto (se
  siguen guardando pero se ignoran en el CSS) y en su lugar se usa `columns` para
  definir cuántas pistas tiene `grid-template-columns` — esto sí reparte el ancho
  entre los hijos directos de esa section, a diferencia del flex (ver la
  limitación de §8.1, que con `display:"grid"` deja de aplicar).
- **Ancho de columna por hijo (`GridWidth`, campo `width`)**: cuando el padre está
  en modo `"grid"`, cada hijo directo (`Section` o `Item`, en la posición que
  ocupa) puede fijar su propio ancho de columna con `settings.width` — un string
  con número + unidad `px`, `%`, `em`, `rem`, `vh`, `vw` **o `fr`** (la unidad
  nativa de CSS Grid, "fracción del espacio restante"). `""` (default) significa
  "reparto igual" y equivale a `"1fr"` — por eso **no hace falta poner nada para
  la opción de columnas iguales**, es lo que ya pasa por defecto; solo hay que
  llenar `width` en los hijos donde se quiera un ancho distinto. El servidor arma
  `grid-template-columns` tomando, para cada una de las `columns` pistas, el
  `width` del hijo en esa posición (o `"1fr"` si está vacío o no hay hijo ahí):
  por ejemplo, con `columns: 3` y los hijos con `width` `"250px"`, `""`, `"2fr"`
  el resultado es `grid-template-columns: 250px 1fr 2fr`. `width` en cualquier
  otro contexto (hijo de una section en modo `"flex"`, o de la raíz) se guarda
  pero no tiene ningún efecto visual.
- `flexDirection` / `justifyContent` / `alignItems` / `gap` controlan el
  `display:flex` del wrapper cuando `display` es `"flex"` (`max-width` viene de
  Variables — ver §11 —, `margin:0 auto; flex-wrap:wrap` fijos), **no** el
  `<section>` en sí. En la práctica: esto define cómo se acomodan los **hijos
  directos** de esa section entre sí. `gap` también aplica en modo `"grid"`.
- `textAlign` se aplica también a ese `.mvl-container` (texto centrado/alineado de
  todo el contenido dentro), en ambos modos.
- No hay ninguna propiedad de ancho/alto para la section (`width`, `height`,
  `flex-basis`, `flex-grow`, `min-height`, etc.). El ancho máximo de
  `.mvl-container` es una Variable global (§11), no una propiedad por section.
- `classes`/`htmlId` agregan clases/un id HTML propios al `<section>`/`<div>`/
  `<article>` renderizado, además de las clases fijas del plugin (`mvl-section`,
  etc.) — ver §4.6.

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
    "margin":     ResponsiveValue<Spacing>,     // default: 0 en los 4 lados
    "classes":    string,          // NO es responsive; default ""; ver §4.6
    "htmlId":     string,          // NO es responsive; default ""; ver §4.6
    "typography": Typography,      // NO es responsive; default vacío ("sin anular"); ver §4.6 y §11
    "width":      GridWidth        // NO es responsive; default ""; solo tiene efecto si el `Item` es hijo directo de una `Section` en modo "grid" — ver §2
  }
}
```

Un `Item` **no tiene** `textAlign`, `gap`, `flexDirection`, `justifyContent`,
`alignItems` ni `tag`: esas propiedades solo existen en `Section`.

`typography` solo tiene efecto visual en `heading`/`text`/`button` (se aplica al
`<h{level}>`, al `.mvl-text` o al `.mvl-button` respectivamente); en un `image` se
acepta igual en el JSON pero el sanitizador simplemente no lo usa en ningún lado.

### 3.1 `data` según `type`

| `type`     | Campos de `data`                                                                 | Sanitización / límites |
|------------|-----------------------------------------------------------------------------------|--------------------------|
| `heading`  | `text: string`, `level: 1-6` (default 2)                                          | `text` se limpia con `sanitize_text_field` (se pierde cualquier HTML embebido, es texto plano) |
| `text`     | `text: string` (puede llevar HTML simple)                                         | `text` pasa por `wp_kses_post` (permite `<p> <strong> <em> <a> <ul> <li> <br>`, etc., pero no `<script>` ni atributos peligrosos) y luego `wpautop()` en el render — **no hace falta que la IA agregue `<p>` manualmente**, los saltos de línea dobles ya generan párrafos |
| `button`   | `text: string`, `textTag: string`, `url: string`, `urlTag: string`, `urlPostId: int`, `buttonStyle: string` | ver §3.2 (contenido dinámico) y §11.3 (`buttonStyle`, el id de un estilo de botón con nombre definido en Variables) |
| `image`    | `url: string`, `alt: string`, `id: int` (attachment ID de WP), `size: string`      | `id` es el ID del adjunto en la Media Library; `size` es el "slug" de tamaño de imagen (`thumbnail`, `medium`, `medium_large`, `large`, `full`...) — **una IA sin acceso a la Media Library de ese sitio no puede inventar un `id` válido**, ver §8 |

Ejemplo de `text` con HTML permitido:

```json
{ "type": "text", "data": { "text": "Esto es <strong>importante</strong>.\n\nSegundo párrafo." } }
```

### 3.2 Contenido dinámico del botón (al estilo "Dynamic Tags" de Elementor)

El `button` es, por ahora, el único bloque con contenido dinámico. En vez de (o
además de) un texto/URL fijo, se puede pedir que el texto y/o la URL se resuelvan
automáticamente contra datos reales del post:

```jsonc
{
  "type": "button",
  "data": {
    "text": "Saber más",   // valor estático / fallback — se usa si textTag es "" o si el tag resuelve vacío
    "textTag": "",          // "" = usar "text" tal cual; o una de las claves de la tabla de abajo
    "url": "#",             // valor estático / fallback — se usa si urlTag es "" o si el tag resuelve vacío
    "urlTag": "",           // "" = usar "url" tal cual; o una de las claves de la tabla de abajo
    "urlPostId": 0,         // solo se usa cuando urlTag empieza con "post_link_": ID (int) de la entrada/página/CPT destino
    "buttonStyle": ""       // "" = estilo por defecto (.mvl-button); o el "id" de un estilo de botón con nombre de Variables (§11.3)
  }
}
```

Claves válidas de `textTag`:

| Clave | Se resuelve a |
|---|---|
| `""` | (estático) usa `data.text` tal cual |
| `post_title` | Título de la página/entrada donde vive este layout |
| `site_title` | Nombre del sitio (`bloginfo('name')`) |
| `author_name` | Nombre visible del autor del post |
| `current_date` | Fecha (formato de fecha configurado en WordPress) |

Claves válidas de `urlTag`:

| Clave | Se resuelve a |
|---|---|
| `""` | (estático) usa `data.url` tal cual |
| `post_url` | Permalink de la página/entrada donde vive este layout (la actual, no otra) |
| `site_url` | URL de inicio del sitio |
| `author_url` | Archivo de posts del autor |
| `featured_image` | URL de la imagen destacada del post (en tamaño completo) |
| `post_link_<post_type>` | Permalink de **otro** contenido del sitio, de un tipo concreto, elegido por su ID en `data.urlPostId` |

`post_link_<post_type>` no es una clave fija: hay **una por cada tipo de contenido
público con vista individual registrado en el sitio**, calculada en el momento de
guardar (equivalente al selector "Post/Page" — o "Post/Page/CPT" — de los Dynamic
Tags de Elementor, pero con una opción separada por tipo en vez de una genérica).
En un sitio estándar de WordPress sin CPTs existen como mínimo:

| Clave | Tipo |
|---|---|
| `post_link_page` | Página |
| `post_link_post` | Entrada |

Si el sitio tiene tipos de contenido personalizados públicos con vista individual
(por ejemplo `product`, `proyecto`, `testimonio`...), también aparece
`post_link_product`, `post_link_proyecto`, etc. — el slug es siempre el `post_type`
tal como está registrado (`register_post_type('product', ...)` → `post_link_product`).
Se excluyen `attachment` (adjuntos/medios) y cualquier post type que no sea público
o no tenga una vista individual navegable (`is_post_type_viewable()`).

Cualquier valor de `textTag`/`urlTag` que no esté en estas listas — incluyendo un
`post_link_<algo>` cuyo `<algo>` no sea un post type real y público de ESE sitio —
se sanitiza a `""` (estático). Si un tag resuelve a vacío (p. ej. `featured_image`
en un post sin imagen destacada, o `post_link_<tipo>` con un `urlPostId` que ya no
existe/fue borrado), el render usa el valor estático de `text`/`url` como fallback
— por eso conviene dejar siempre un valor estático razonable aunque se use un tag.

**Sobre `post_link_<post_type>` / `urlPostId`**: una IA que genera el JSON
directamente (sin pasar por el buscador del editor) necesita conocer, para ESE
sitio de WordPress en concreto: (1) qué post types públicos existen — se puede
consultar con `GET /wp-json/wp/v2/types` — y (2) el ID real del contenido destino
dentro de ese tipo — vía `GET /wp-json/wp/v2/pages`, `/wp-json/wp/v2/posts`, el
endpoint REST propio del CPT, o `/wp-json/wp/v2/search?search=...&subtype=<tipo>`.
**No hay que inventar ni el tipo ni el ID.** Un `urlPostId` que no corresponde a
ningún contenido real cae al valor estático de `url` como fallback (no rompe nada,
pero tampoco enlaza a donde se quería). Si no se tiene certeza, es más seguro usar
`urlTag: ""` con la URL relativa como texto estático.

⚠️ **Importante — esto NO es contenido dinámico "en vivo"**: al igual que el resto
del layout, el HTML final del botón se resuelve y se "hornea" en `post_content`
**en el momento de guardar** desde el maquetador, no en cada visita a la página. Si
`textTag` es `post_title` y luego alguien cambia el título de la página, el botón
seguirá mostrando el título viejo hasta que alguien vuelva a abrir el maquetador y
guarde de nuevo. `current_date` en particular casi nunca tiene sentido tal como
está implementado hoy, porque queda fija en la fecha del último guardado.

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

- Rango numérico permitido: **-1000 a 1000** (se recorta si se pasa), **excepto
  `containerMaxWidth` de Variables (§11), que admite -6000 a 6000** — tiene un
  rango propio más amplio porque como ancho de contenedor típicamente supera los
  1000px (de hecho su propio default, `"1140px"`, superaba el límite general).
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

### 4.6 `classes`, `htmlId` y `Typography`

`classes` y `htmlId` existen tanto en `Section` como en `Item` (§2 y §3):

- `classes`: **un solo string** con las clases separadas por espacio (p. ej.
  `"tarjeta destacada"`), no un array. Cada token se limpia por separado (solo
  `A-Za-z0-9_-`; cualquier otro carácter se elimina del token) y se descartan los
  tokens vacíos resultantes; máximo 20 tokens. Se agregan **además** de las clases
  fijas del plugin (`mvl-section`, `mvl-item mvl-item-heading`, etc.), nunca las
  reemplazan.
- `htmlId`: un string que debe empezar por una letra y solo puede tener
  `A-Za-z0-9_-` (regla básica de un id HTML válido); cualquier otro valor se
  sanitiza a `""` (sin id). Máximo 64 caracteres. La IA es responsable de que sea
  único dentro de la página — el sanitizador no lo comprueba.

`Typography` es la forma compartida por el `settings.typography` de un `Item`
(override puntual de un bloque), por cada rol global de Variables (§11.2:
`h1`-`h6`/`paragraph`) y por la tipografía de un estilo de botón con nombre
(§11.3):

```jsonc
{
  "family":    string,   // "" = no anular/heredar; si no es "", debe ser exactamente una de las familias registradas en Variables (§11.1) — cualquier otro valor se sanitiza a ""
  "size":      SpacingSide | "",  // "" = no anular/heredar
  "variant":   "regular" | "italic" | "bold" | "bolditalic",  // default "regular" ("regular" = no anular peso/cursiva)
  "transform": "none" | "uppercase" | "lowercase" | "capitalize"  // default "none" ("none" = no anular)
}
```

- `family` **no** es una familia de fuente libre: la IA no puede poner cualquier
  nombre de Google Fonts ahí. Solo funciona si esa familia ya está en
  `fonts.registered` de las Variables guardadas del sitio (§11.1) — si no, se
  sanitiza a `""` y el elemento hereda la fuente del tema/rol global. Antes de
  generar un `family` no vacío, hay que conocer las fuentes ya registradas en ESE
  sitio (por ejemplo consultando `GET /wp-json/mvl/v1/variables`, que requiere
  sesión de wp-admin) — no hay forma de "registrar y usar" una fuente en el mismo
  paso desde este endpoint de layout.
- `variant` combina peso + cursiva en una sola opción (como los "variants" de
  Google Fonts): `regular`→400, `italic`→400 cursiva, `bold`→700, `bolditalic`→700
  cursiva. No hay pesos intermedios (300, 500, 600, 800...) en esta versión.
- Todo lo que `Typography` sí anula se aplica con `!important` en el CSS generado
  (a diferencia del resto del sistema de estilos), porque su objetivo es poder
  pisar la tipografía del tema — ver §11.

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
| Columnas de un `Section` en modo `grid` | 1–12 |
| Valor numérico de `GridWidth` (`settings.width`) | 0.01–1000 |
| Fuentes de Google registradas en Variables | 6 (§11.1) |
| Estilos de botón con nombre en Variables | 12 (§11.3) |
| Tokens de `classes` por `Section`/`Item` | 20 (§4.6) |

Cualquier nodo que exceda estos límites o tenga un `type` desconocido **se
descarta silenciosamente** al guardar, no genera error visible.

---

## 7. Cómo se traduce esto a HTML/CSS (para razonar sobre el resultado visual)

Cada `Section` se renderiza así:

```html
<section class="mvl-section mvl-bg-host [+ classes]" data-mvl-uid="..." [id="..."]>
  <div class="mvl-container">
    <!-- hijos: otras <section> o los .mvl-item de sus Items -->
  </div>
</section>
```

`.mvl-container` ya no lleva el `max-width` en línea: viene de la Variable global
`containerMaxWidth` (§11), aplicada por CSS a **todas** las `.mvl-container` del
sitio con `!important` (para que gane incluso sobre HTML ya horneado en guardados
anteriores). Por CSS base tiene `margin:0 auto`, y encima el CSS generado le agrega
`display:flex` + `flex-direction`/`justify-content`/`align-items` (o `display:grid`
+ `grid-template-columns` si `display:"grid"`), `gap` y `text-align`, según los
`settings` de esa `Section`.

Cada `Item` se renderiza como:

```html
<div class="mvl-item mvl-item-{type} mvl-bg-host [+ classes]" data-mvl-uid="..." [id="..."]>
  <!-- heading: <h{level}>texto</h{level}> -->
  <!-- text:    <div class="mvl-text">párrafos con wpautop</div> -->
  <!-- button:  <a class="mvl-button [mvl-btn-style-{buttonStyle}]" href="...">texto</a> (sin <p> envolvente) -->
  <!-- image:   <img class="mvl-image" src="..." alt="..."> -->
</div>
```

El `settings.typography` de un `Item` (§4.6) se aplica directamente al elemento de
texto real (`h{level}`/`.mvl-text`/`.mvl-button`), no al `.mvl-item` que lo envuelve.

Para hacer un layout de **"3 columnas"** el patrón es: una `Section` padre con
`flexDirection: "row"` y `gap`, y **3 `Section` hijas** dentro (cada una funcionando
como "columna", conteniendo sus propios `heading`/`text`/`image`). No se ponen los
items sueltos directamente en fila a menos que se quiera que floten libremente.

---

## 8. Limitaciones actuales a tener en cuenta (importante para la IA)

Estas cosas **no existen** en el modelo de datos hoy, así que la IA no debe
asumirlas ni inventar campos para ellas — cualquier campo que no esté en este
documento simplemente se ignora al sanitizar:

1. ~~No hay control de ancho por bloque/columna~~ **Ya existe, pero solo en modo
   `grid` (§2)**: una `Section` padre con `display:"grid"` reparte a sus hijas
   directas en `columns` pistas, todas iguales (`1fr`) por defecto, y cada hija
   puede fijar su propio `settings.width` (`GridWidth`, §2) para un ancho fijo o
   una fracción distinta — esto reemplaza al patrón viejo de §7 con
   `flexDirection:"row"`, que sigue existiendo pero no reparte el ancho. **En modo
   `flex` la limitación de ancho por bloque/columna sigue existiendo tal cual**
   (`width`/`flex-basis`/`flex-grow`/`%` no tienen ningún efecto ahí): cada hija
   ocupa el ancho de su contenido y `flex-wrap:wrap` hace que si no entran en una
   fila, bajen a la siguiente.
2. **No hay `width`/`height`/`min-height` en ningún nivel**, ni siquiera en modo
   `grid` (no hay `grid-template-rows`, `min-height` de fila, etc.), más allá del
   número de columnas.
3. ~~No hay control de tipografía~~ **Ya existe control de tipografía real**, pero
   con dos capas distintas — no confundirlas:
   - **Variables (§11)**: tipografía **global** por rol semántico (`h1`-`h6` y
     "párrafo"), de sitio entero, independiente del `layout` de cada página.
   - **`settings.typography` de un `Item`** (§4.6): override puntual de **ese
     bloque en particular**, que gana sobre el rol global correspondiente.
   En ambos casos, `family` solo puede ser una fuente ya registrada en Variables
   (§11.1) — no cualquier fuente de Google Fonts libremente — y no hay control de
   `line-height`, `letter-spacing` ni color de texto (fuera del color que ya trae
   un estilo de botón, §11.3).
4. **`image.data.id`** (attachment ID de la Media Library) no lo puede inventar una
   IA sin conocer el sitio real: si no se tiene un ID válido, lo más seguro es
   dejar `id: 0` y usar `url` con una imagen externa, o dejar el bloque de imagen
   vacío (`url: ""`) para que el usuario la cargue manualmente después.
5. **No hay bloques de "columna" ni "espaciador" ni "separador" ni "video embed de
   YouTube/Vimeo"** — solo `heading`, `text`, `button`, `image`, y el contenedor
   `section`. Un video de fondo sí existe (`background.type: "video"`, con URL de
   archivo `.mp4` directo, no embed de plataforma). Para columnas de ancho parejo,
   usar `section` con `display:"grid"` (punto 1) en vez de inventar un bloque de
   "columna".
6. ~~El botón no tiene variantes de estilo propias~~ **Ya existe**: un estilo de
   botón con nombre en Variables (§11.3) define color de fondo, color de texto,
   borde y tipografía, y se aplica con `data.buttonStyle: "<id>"` (§3.1) — igual
   que con las fuentes, el `id` tiene que existir ya en las Variables guardadas del
   sitio, no se puede inventar. Sin `buttonStyle` (`""`), el botón sigue usando la
   clase fija `.mvl-button` del tema/preview tal como antes. El
   `background`/`border`/`padding`/`margin` del propio `Item` (§3) se siguen
   aplicando al `.mvl-item` que envuelve el link, no al `<a>` — son dos capas
   independientes (la del `Item` envolvente y la del `buttonStyle` del link).
7. `justifyContent`/`alignItems`/`flexDirection`/`gap`/`textAlign`/`display`/
   `columns` solo se pueden fijar en `Section`, nunca en un `Item` individual.
   `width` (`GridWidth`) sí existe en ambos, `Section` e `Item` (§2, §3), porque
   cualquiera de los dos puede ser la hija directa de una `Section` en grid.
8. **El contenido dinámico (§3.2) solo existe en el botón** (`textTag`/`urlTag`), y
   ni siquiera ahí es "en vivo": se resuelve al guardar, no en cada visita (ver la
   advertencia en §3.2). No hay dynamic tags para `heading`, `text`, `image` ni
   para ningún `settings` (por ejemplo, no se puede poner "el color destacado del
   post" como fondo).
9. **`classes`/`htmlId`/`typography`/`display`/`columns`/`width`/Variables no son
   responsive** (§4.1) — **excepto `columns`**, que sí es `ResponsiveValue<int>`.
   No hay forma de, por ejemplo, darle a una columna un ancho distinto en mobile
   que en escritorio: su `width` es el mismo en todos los tamaños de pantalla.

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
4. No inventar campos fuera de este spec (`width`, `fontSize` suelto, `color` de
   texto suelto, etc. no existen y se ignoran — la tipografía va siempre dentro de
   un objeto `Typography` completo, §4.6).
5. No superar los límites de §6.
6. Para columnas de ancho parejo, usar una `Section` con `display:"grid"` y
   `columns: N` (§2, §8.1) — es la forma recomendada hoy. El patrón viejo de
   anidar `Section` con `flexDirection:"row"` (§7) sigue funcionando pero no
   reparte el ancho de forma pareja; solo usarlo si el usuario acepta esa
   limitación o pide explícitamente que las columnas floten según su contenido.
7. `family` en cualquier `Typography` (§4.6) y `buttonStyle` en un botón (§3.1)
   deben ser exactamente un valor ya existente en las Variables guardadas del
   sitio (§11) — nunca inventarlos. Si no se conocen las Variables actuales,
   dejarlos vacíos (`""`) es siempre seguro.

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
      { "id": "cta-boton", "type": "button", "data": { "text": "Hablemos de tu proyecto", "textTag": "", "url": "/contacto", "urlTag": "", "urlPostId": 0 }, "settings": { "background": { "desktop": { "type": "none" }, "tablet": null, "mobile": null }, "border": { "desktop": { "style": "none", "width": "1px", "color": "#000000", "radius": "0px" }, "tablet": null, "mobile": null }, "padding": { "desktop": { "top": "0px", "right": "0px", "bottom": "0px", "left": "0px", "linked": false }, "tablet": null, "mobile": null }, "margin": { "desktop": { "top": "0px", "right": "0px", "bottom": "0px", "left": "0px", "linked": false }, "tablet": null, "mobile": null } } }
    ]
  }
]
```

---

## 11. Variables (tipografía global, fuentes de Google, estilos de botón)

A diferencia de todo lo anterior (que es el `layout` **de una página**), las
Variables son **de sitio entero**: se guardan una sola vez, aparte de cualquier
`post_id`, y afectan a todas las páginas maquetadas con este plugin a la vez, sin
tener que volver a guardar cada una desde el editor.

### 11.1 Contrato de guardado

```
GET  /wp-json/mvl/v1/variables   -> { variables: Variables }
POST /wp-json/mvl/v1/variables   body: { variables: Variables }  -> { variables, saved: true, fontErrors: string[] }
```

Requiere nonce de WP y capacidad `edit_pages` (la misma que abre el maquetador).
`fontErrors` trae los nombres de familia que no se pudieron descargar de Google
Fonts en ese guardado (por ejemplo, por un fallo de red del servidor) — no bloquea
el guardado del resto de las Variables, simplemente esa familia se queda sin
archivos locales hasta el próximo intento.

```jsonc
{
  "containerMaxWidth": "1140px",   // SpacingSide; default "1140px"; ancho máximo de TODAS las .mvl-container del sitio
  "fonts": {
    "registered": ["Poppins", "Roboto"],  // hasta 6 nombres, cada uno debe existir en el catálogo curado del servidor (ver 11.1.1)
    "typography": {
      "h1": Typography, "h2": Typography, "h3": Typography, "h4": Typography,
      "h5": Typography, "h6": Typography, "paragraph": Typography
      // cada uno default vacío ({"family":"","size":"","variant":"regular","transform":"none"}) = "no tocar, usar el CSS del tema"
    }
  },
  "buttonStyles": [ ButtonStyle, ... ]  // hasta 12; ver 11.3
}
```

#### 11.1.1 Catálogo de fuentes registrables

`fonts.registered` no acepta cualquier string: cada nombre debe existir en un
catálogo curado de ~130 familias de Google Fonts embebido en el servidor
(`google_fonts_catalog()` en `class-mvl-plugin.php`) — **no** es el catálogo
completo de Google Fonts (que tiene miles), es una selección de las más usadas
más un conjunto amplio adicional en orden alfabético. Cualquier nombre fuera de
esa lista se descarta en silencio. La IA puede consultar el catálogo real vía
`GET /wp-json/mvl/v1/variables` combinado con lo que la interfaz del maquetador
recibe como `fontCatalog` (no expuesto hoy en un endpoint REST propio, solo en el
JS del editor) — en la práctica, para generar Variables por API es más seguro
preguntar al usuario qué fuentes ya tiene registradas antes de escribir un
`family`.

**Cómo se sirven realmente**: al guardar, el servidor descarga de
`fonts.googleapis.com`/`fonts.gstatic.com` las 4 variantes estándar (`regular`,
`italic`, `bold`, `bolditalic`) de **cada familia en `fonts.registered`** — no
solo las que ya se usan en un rol global o un `buttonStyle` — porque una familia
registrada también se puede elegir como override en el `Typography` de un bloque
individual de **cualquier página** del sitio (§4.6), y este guardado de Variables
no tiene visibilidad del `layout` de cada post para saber de antemano cuál se va
a usar. Los guarda como `.woff2` en `wp-content/uploads/mvl-fonts/` y genera un
único CSS local con `@font-face`. El front-end de un sitio que usa este plugin
**nunca** carga nada desde `fonts.googleapis.com` ni `fonts.gstatic.com`: solo
las familias que están en `fonts.registered` en este momento tienen archivos
locales; quitar una familia de `fonts.registered` borra sus archivos en el
próximo guardado de Variables (aunque algún bloque de alguna página todavía la
referencie — ese bloque se queda mostrando la fuente del tema hasta que se le
cambie el `family`, ver §4.6).

### 11.2 Tipografía por rol (`fonts.typography`)

Cada uno de los 7 roles (`h1`-`h6`, `paragraph`) es un `Typography` (§4.6) que se
aplica, con `!important`, a:

| Rol | Selector CSS |
|---|---|
| `h1`...`h6` | `.mvl-layout h1` ... `.mvl-layout h6` (cualquier heading de ese nivel, en cualquier página) |
| `paragraph` | `.mvl-layout .mvl-text` (el bloque `text` completo — hereda a los `<p>`/`<strong>`/etc. de adentro por herencia normal de CSS) |

Un `settings.typography` de un `Item` individual (§4.6) tiene un selector más
específico (`[data-mvl-uid="..."] .mvl-heading`, etc.) y por lo tanto gana sobre el
rol global correspondiente cuando ambos anulan la misma propiedad.

### 11.3 Estilos de botón con nombre (`buttonStyles`)

```jsonc
{
  "id": "primario",              // sanitize_key(); si falta o choca con otro, el servidor genera uno nuevo
  "name": "Primario",            // sanitize_text_field(); si queda vacío, se guarda como "Estilo sin nombre"
  "background": { "type": "none" | "color", "color": "#2271b1" },  // default {type:"color", color:"#2271b1"}
  "textColor": "#ffffff",        // default "#ffffff"
  "border": Border,              // §4.5; default {style:"none", width:"1px", color:"#000000", radius:"0px"}
  "padding": Spacing,            // §4.3, NO responsive aquí; default {top:"12px", right:"24px", bottom:"12px", left:"24px"}
  "typography": Typography       // §4.6; default vacío
}
```

Se aplica con la clase `.mvl-btn-style-{id}` sobre el `<a class="mvl-button">`
(§7), con `!important` en todas sus declaraciones (incluida `color`, que si no,
perdería contra el `color:#fff!important` fijo de `.mvl-button` en el CSS del
plugin). Un botón sin `data.buttonStyle` (`""`) o con un `id` que ya no existe en
`buttonStyles` simplemente no lleva esa clase — usa el `.mvl-button` de siempre,
no falla ni deja de renderizarse.

---

## Pendiente / próximas secciones de este spec

- [ ] Prompt de sistema listo para pegar en una IA (rol + reglas + este spec resumido)
- [ ] Few-shots adicionales (galería de imágenes, testimonios, precios, ejemplo con
      `display:"grid"` y con Variables/`buttonStyle`)
- [ ] Definir un mini-lenguaje o wrapper de "recetas" (ítems de negocio → JSON) si se
      decide construir eso
- [x] ~~Agregar `width`/`flex-basis` por hijo para columnas reales~~ — resuelto con
      `Section.settings.display:"grid"` + `columns` + `width` (`GridWidth`) por
      hijo para anchos variables (§2, §8.1)
- [ ] Endpoint REST propio para el catálogo de Google Fonts (`fontCatalog`, hoy solo
      viaja embebido en `window.MVL` del editor, no hay forma de consultarlo desde
      fuera de wp-admin) — ver §11.1.1
- [ ] `line-height`, `letter-spacing` y color de texto en `Typography` (§4.6)
- [ ] Hacer `Typography`/`display`/`columns` responsive (hoy `columns` es el único
      `ResponsiveValue` de los nuevos campos, ver §8.9)
