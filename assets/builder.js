(function () {
  'use strict';
  var root = document.getElementById('mvl-builder');
  var labels = { section: 'Contenedor', heading: 'Título', text: 'Texto', button: 'Botón', image: 'Imagen' };
  var containerTags = { div: 'div', section: 'section', article: 'article' };
  var icons = { section: 'dashicons-align-wide', heading: 'dashicons-heading', text: 'dashicons-text-page', button: 'dashicons-button', image: 'dashicons-format-image' };
  var deviceLabels = { desktop: 'Escritorio', tablet: 'Tablet', mobile: 'Móvil' };
  var sideLabels = { top: 'Arriba', right: 'Derecha', bottom: 'Abajo', left: 'Izquierda' };
  var tabLabels = { content: 'Contenido', style: 'Estilo', advanced: 'Avanzado' };
  var fontVariantLabels = { regular: 'Normal', italic: 'Cursiva', bold: 'Negrita', bolditalic: 'Negrita cursiva' };
  var textTransformLabels = { none: 'Ninguna', uppercase: 'MAYÚSCULAS', lowercase: 'minúsculas', capitalize: 'Capitalizada' };
  var typographyRoleLabels = { h1: 'Título H1', h2: 'Título H2', h3: 'Título H3', h4: 'Título H4', h5: 'Título H5', h6: 'Título H6', paragraph: 'Párrafo' };
  var MAX_REGISTERED_FONTS = MVL.maxRegisteredFonts || 6;
  var state = { layout: MVL.layout || [], variables: normalizeVariables(MVL.variables), variablesDirty: false, showVariables: false, variablesTab: 'general', selected: null, dirty: false, leftCollapsed: false, showStructure: false, device: 'desktop', tab: 'content', fullscreen: false };
  var bgTypes = [
    { key: 'color', label: 'Color', icon: 'dashicons-art' },
    { key: 'image', label: 'Imagen', icon: 'dashicons-format-image' },
    { key: 'gradient', label: 'Degradado', icon: 'dashicons-color-picker' },
    { key: 'video', label: 'Video', icon: 'dashicons-video-alt3' }
  ];
  var borderStyles = { none: 'Ninguno', solid: 'Sólido', dashed: 'Discontinuo', dotted: 'Punteado' };
  var textDynamicTags = { post_title: 'Título de la entrada', site_title: 'Nombre del sitio', author_name: 'Nombre del autor', current_date: 'Fecha actual' };
  var urlDynamicTags = { post_url: 'URL de esta entrada', site_url: 'URL de inicio del sitio', author_url: 'URL del autor', featured_image: 'URL de la imagen destacada' };
  /** Una entrada "post_link_<post_type>" por cada tipo de contenido público con vista individual del sitio (Página, Entrada, y cualquier CPT), al estilo del selector "Post/Page" de Elementor pero separado por tipo. */
  (MVL.linkablePostTypes || []).forEach(function (pt) { urlDynamicTags['post_link_' + pt.slug] = pt.label + ' (Buscar)'; });
  var mediaSizes = { thumbnail: 'Miniatura', medium: 'Mediana', medium_large: 'Mediana grande', large: 'Grande', full: 'Completa' };
  var attachmentSizesCache = {};
  /** Caché en memoria {postId: {title, url, type}} de las entradas/páginas elegidas con el buscador "Otra entrada o página". */
  var postLinkCache = {};
  var mediaFrame = null;
  var refs = {};
  var MAX_NESTING_DEPTH = 4;

  function defaultTypography() { return { family: '', size: '', variant: 'regular', transform: 'none' }; }
  /** Completa lo que falte de Variables (por si el sitio nunca las guardó) con una forma vacía segura, sin fuentes registradas ni estilos de botón todavía. */
  function normalizeVariables(v) {
    v = v && typeof v === 'object' ? v : {};
    var fonts = v.fonts && typeof v.fonts === 'object' ? v.fonts : {};
    var typography = {};
    Object.keys(typographyRoleLabels).forEach(function (role) {
      typography[role] = Object.assign(defaultTypography(), (fonts.typography || {})[role] || {});
    });
    return {
      containerMaxWidth: v.containerMaxWidth || '1140px',
      fonts: { registered: Array.isArray(fonts.registered) ? fonts.registered : [], typography: typography },
      buttonStyles: Array.isArray(v.buttonStyles) ? v.buttonStyles : []
    };
  }

  function id() { return 'mvl-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function esc(value) { var d = document.createElement('div'); d.textContent = value || ''; return d.innerHTML; }
  function escAttr(value) { return esc(value).replace(/"/g, '&quot;'); }
  function markDirty() { state.dirty = true; update(); }
  /**
   * Para inputs de texto/número en los que el usuario sigue tecleando: actualiza el
   * estado y la vista previa sin redibujar el panel de ajustes (eso destruiría el
   * input y le haría perder el foco a mitad de la escritura).
   */
  function markDirtyLite() {
    state.dirty = true;
    refs.status.textContent = 'Cambios sin guardar';
    refreshPreview();
  }
  /** Igual que markDirty()/markDirtyLite() pero para las Variables globales (tipografía, fuentes, estilos de botón), que se guardan aparte del layout. */
  function markVariablesDirty() {
    state.variablesDirty = true;
    update();
  }
  function markVariablesDirtyLite() {
    state.variablesDirty = true;
    var status = root.querySelector('.mvl-variables-status');
    if (status) status.textContent = 'Cambios sin guardar';
    refreshPreview();
  }

  /**
   * El layout es un árbol: un contenedor puede tener otros contenedores como hijos.
   * locate() busca un nodo por id recursivamente y devuelve también la lista que lo
   * contiene (para reordenar/eliminar) y su contenedor padre directo (para saber
   * dónde debe caer un bloque nuevo).
   */
  function locate(list, targetId, parentSection) {
    for (var i = 0; i < list.length; i++) {
      var node = list[i];
      if (node.id === targetId) return { node: node, list: list, index: i, parentSection: parentSection || null };
      if (node.type === 'section') {
        var found = locate(node.children, targetId, node);
        if (found) return found;
      }
    }
    return null;
  }
  function findLocation(targetId) { return targetId ? locate(state.layout, targetId, null) : null; }
  function walkTree(list, fn) {
    list.forEach(function (node) {
      fn(node);
      if (node.type === 'section') walkTree(node.children, fn);
    });
  }
  /**
   * Al cargar un layout ya guardado, los botones vinculados a "otra entrada o
   * página" solo tienen el ID guardado; hay que resolver su título/URL reales
   * contra el sitio para poder mostrarlos en el panel y en la vista previa.
   */
  function hydratePostLinkLabels() {
    var ids = [];
    walkTree(state.layout, function (node) {
      if (node.type === 'button' && node.data.urlTag && node.data.urlTag.indexOf('post_link_') === 0 && node.data.urlPostId && ids.indexOf(node.data.urlPostId) === -1 && !postLinkCache[node.data.urlPostId]) {
        ids.push(node.data.urlPostId);
      }
    });
    if (!ids.length) return;
    var qs = ids.map(function (postId) { return 'include[]=' + postId; }).join('&');
    fetch(MVL.restRoot + 'wp/v2/search?' + qs + '&per_page=' + ids.length, { headers: { 'X-WP-Nonce': MVL.nonce } })
      .then(function (r) { return r.json(); })
      .then(function (results) {
        (Array.isArray(results) ? results : []).forEach(function (r) { postLinkCache[r.id] = { title: r.title, url: r.url, type: r.subtype || r.type }; });
        update();
      })
      .catch(function () {});
  }
  function nodeDepth(targetId) {
    var loc = findLocation(targetId), depth = 0;
    while (loc && loc.parentSection) { depth++; loc = findLocation(loc.parentSection.id); }
    return depth;
  }
  function selectedItem() { var loc = findLocation(state.selected); return loc ? loc.node : null; }
  function currentSection() {
    var loc = findLocation(state.selected);
    if (!loc) return state.layout[0] || null;
    return loc.node.type === 'section' ? loc.node : (loc.parentSection || state.layout[0] || null);
  }
  /** El contenedor donde debe insertarse un nuevo Contenedor: dentro del seleccionado si es un contenedor, si no como hermano de lo seleccionado, si no hay nada seleccionado va a nivel raíz. */
  function containerForNewSection() {
    var loc = findLocation(state.selected);
    if (!loc) return null;
    return loc.node.type === 'section' ? loc.node : loc.parentSection;
  }

  function respDefault(value) { return { desktop: value, tablet: null, mobile: null }; }
  function respGet(resp, device) {
    if (device === 'mobile') return resp.mobile != null ? resp.mobile : (resp.tablet != null ? resp.tablet : resp.desktop);
    if (device === 'tablet') return resp.tablet != null ? resp.tablet : resp.desktop;
    return resp.desktop;
  }
  function respHasOverride(resp, device) { return device !== 'desktop' && resp[device] != null; }
  function respReset(resp, device) { if (device !== 'desktop') resp[device] = null; }
  function respEnsureOverride(resp, device) {
    if (device === 'desktop') return resp.desktop;
    if (resp[device] == null) resp[device] = JSON.parse(JSON.stringify(respGet(resp, device)));
    return resp[device];
  }

  function defaultBackground(type) {
    return {
      type: type || 'none',
      color: '#ffffff',
      image: { url: '', size: 'cover', position: 'center center', repeat: 'no-repeat' },
      gradient: { type: 'linear', angle: 180, stops: [{ color: '#ff0000', pos: 0 }, { color: '#0000ff', pos: 100 }] },
      video: { url: '' }
    };
  }
  function defaultBorder() { return { style: 'none', width: '1px', color: '#000000', radius: '0px' }; }
  function defaultSpacing() { return { top: '0px', right: '0px', bottom: '0px', left: '0px', linked: false }; }
  function defaultSettings(kind) {
    return {
      background: respDefault(defaultBackground(kind === 'section' ? 'color' : 'none')),
      border: respDefault(defaultBorder()),
      padding: respDefault(kind === 'section' ? { top: '48px', right: '24px', bottom: '48px', left: '24px', linked: false } : defaultSpacing()),
      margin: respDefault(defaultSpacing()),
      classes: '',
      htmlId: '',
      typography: defaultTypography(),
      width: ''
    };
  }
  function newSectionSettings() {
    return Object.assign(defaultSettings('section'), { textAlign: respDefault('left'), tag: 'section', gap: respDefault('16px'), display: 'flex', columns: respDefault(3), flexDirection: respDefault('column'), justifyContent: respDefault('flex-start'), alignItems: respDefault('stretch') });
  }

  function add(type) {
    if (type === 'section') {
      var newSection = { id: id(), type: 'section', settings: newSectionSettings(), children: [] };
      var target = containerForNewSection();
      if (target && nodeDepth(target.id) + 1 >= MAX_NESTING_DEPTH) target = null;
      if (target) target.children.push(newSection); else state.layout.push(newSection);
      state.selected = newSection.id; state.tab = 'style';
    } else {
      var section = currentSection(); if (!section) { add('section'); section = currentSection(); }
      var data = type === 'heading' ? { text: 'Un título claro', level: 2 } : type === 'text' ? { text: 'Escribe aquí tu contenido.' } : type === 'button' ? { text: 'Saber más', textTag: '', url: '#', urlTag: '', urlPostId: 0, buttonStyle: '' } : { url: '', alt: '', id: 0, size: 'full' };
      var item = { id: id(), type: type, data: data, settings: defaultSettings('item') }; section.children.push(item); state.selected = item.id; state.tab = 'content';
    }
    markDirty();
  }
  function remove() {
    var loc = findLocation(state.selected);
    if (!loc) return;
    loc.list.splice(loc.index, 1);
    state.selected = null;
    markDirty();
  }
  function move(delta) {
    var loc = findLocation(state.selected);
    if (!loc) return;
    var list = loc.list, index = loc.index;
    if (list[index + delta]) { var swap = list[index]; list[index] = list[index + delta]; list[index + delta] = swap; markDirty(); }
  }

  function reorder(list, fromId, toId) {
    var from = list.findIndex(function (x) { return x.id === fromId; });
    var to = list.findIndex(function (x) { return x.id === toId; });
    if (from < 0 || to < 0 || from === to) return false;
    var moved = list.splice(from, 1)[0];
    list.splice(to, 0, moved);
    return true;
  }
  function moveNode(fromId, toId) {
    var locFrom = findLocation(fromId), locTo = findLocation(toId);
    if (!locFrom || !locTo || locFrom.list !== locTo.list) return;
    if (reorder(locFrom.list, fromId, toId)) markDirty();
  }

  function resetButton(key, resp, device) {
    if (!respHasOverride(resp, device)) return '';
    return ' <button type="button" class="mvl-reset" data-reset="' + key + '" title="Quitar el valor propio de ' + deviceLabels[device] + '">↺ Restablecer</button>';
  }

  function openMediaPicker(callback) {
    if (!window.wp || !wp.media) { window.alert('La biblioteca de medios no está disponible.'); return; }
    if (mediaFrame) mediaFrame.detach();
    mediaFrame = wp.media({ title: 'Selecciona una imagen', button: { text: 'Usar esta imagen' }, multiple: false, library: { type: 'image' } });
    mediaFrame.on('select', function () {
      var attachment = mediaFrame.state().get('selection').first().toJSON();
      var sizes = {};
      Object.keys(attachment.sizes || {}).forEach(function (key) { sizes[key] = attachment.sizes[key].url; });
      sizes.full = attachment.url;
      callback({ id: attachment.id, url: attachment.url, alt: attachment.alt, sizes: sizes });
    });
    mediaFrame.open();
  }

  function tabsFor() { return ['content', 'style', 'advanced']; }

  /**
   * Bloque de campos de tipografía reutilizado en tres sitios: el override de un
   * bloque (ref "item"), un rol global h1-h6/párrafo (ref "role:h1"...) y la
   * tipografía de un estilo de botón (ref "btn:<índice>"). resolveTypoTarget()
   * sabe traducir cada ref de vuelta al objeto real cuando el usuario edita.
   */
  function typographyFieldsHtml(ref, typo, opts) {
    opts = opts || {};
    var registered = state.variables.fonts.registered;
    var html = '<div class="mvl-field-group">';
    if (opts.label) html += '<label class="mvl-group-label">' + opts.label + '</label>';
    html += '<label>Fuente<select data-typo="' + ref + '" data-typo-key="family"><option value="">' + esc(opts.inheritLabel || 'Predeterminado del tema') + '</option>'
      + registered.map(function (f) { return '<option value="' + escAttr(f) + '" ' + (typo.family === f ? 'selected' : '') + '>' + esc(f) + '</option>'; }).join('')
      + '</select></label>';
    html += '<label>Tamaño <span class="mvl-hint">(px, em, rem...)</span><input data-typo="' + ref + '" data-typo-key="size" type="text" placeholder="Auto" value="' + escAttr(typo.size) + '"></label>';
    html += '<label>Estilo<select data-typo="' + ref + '" data-typo-key="variant">' + Object.keys(fontVariantLabels).map(function (k) { return '<option value="' + k + '" ' + (typo.variant === k ? 'selected' : '') + '>' + fontVariantLabels[k] + '</option>'; }).join('') + '</select></label>';
    html += '<label>Transformación<select data-typo="' + ref + '" data-typo-key="transform">' + Object.keys(textTransformLabels).map(function (k) { return '<option value="' + k + '" ' + (typo.transform === k ? 'selected' : '') + '>' + textTransformLabels[k] + '</option>'; }).join('') + '</select></label>';
    if (!registered.length) html += '<p class="mvl-hint">Registra fuentes en Variables → Fuentes para poder elegirlas aquí.</p>';
    html += '</div>';
    return html;
  }

  function resolveTypoTarget(ref) {
    if (ref === 'item') { var it = selectedItem(); return it ? it.settings.typography : null; }
    if (ref.indexOf('role:') === 0) return state.variables.fonts.typography[ref.slice(5)] || null;
    if (ref.indexOf('btn:') === 0) { var st = state.variables.buttonStyles[Number(ref.slice(4))]; return st ? st.typography : null; }
    return null;
  }

  function imageContentFields(item) {
    var html = '<div class="mvl-media-picker">';
    html += item.data.url ? '<img class="mvl-media-preview" src="' + escAttr(item.data.url) + '">' : '<div class="mvl-media-empty">Sin imagen</div>';
    html += '<button type="button" class="button" data-action="pick-image">' + (item.data.url ? 'Cambiar imagen' : 'Seleccionar imagen') + '</button>';
    html += '</div>';
    var sizes = item.data.id ? attachmentSizesCache[item.data.id] : null;
    if (sizes) {
      html += '<label>Tamaño<select data-field="size">' + Object.keys(mediaSizes).filter(function (s) { return sizes[s]; }).map(function (s) { return '<option value="' + s + '" ' + (item.data.size === s ? 'selected' : '') + '>' + mediaSizes[s] + '</option>'; }).join('') + '</select></label>';
    }
    html += '<label>URL<input data-field="url" type="url" value="' + escAttr(item.data.url) + '"></label>';
    html += '<label>Texto alternativo<input data-field="alt" value="' + escAttr(item.data.alt) + '"></label>';
    return html;
  }

  /**
   * Campo con selector de contenido dinámico (al estilo del icono de "Dynamic
   * Tags" de Elementor): un botón alterna entre escribir un valor fijo o elegir
   * una etiqueta (título de la página, URL del sitio...) que se resuelve contra
   * el post real al guardar. tagOptions es un mapa {clave: etiqueta legible}.
   * El <select> de la etiqueta usa data-tag-select (no data-field) para forzar
   * un redibujado completo del panel al cambiar: por ejemplo, "URL" necesita
   * mostrar el buscador de entradas en vez del texto de vista previa según cuál
   * etiqueta esté activa (ver buttonUrlField).
   */
  function dynamicField(label, dataField, tagField, item, tagOptions, inputTag) {
    var tag = item.data[tagField] || '';
    var html = '<div class="mvl-dynamic-field"><label>' + label
      + '<button type="button" class="mvl-dynamic-toggle' + (tag ? ' is-active' : '') + '" data-dynamic-toggle="' + tagField + '" title="Contenido dinámico"><span class="dashicons dashicons-database"></span></button>'
      + '</label>';
    if (tag) {
      html += '<select data-tag-select="' + tagField + '">' + Object.keys(tagOptions).map(function (k) { return '<option value="' + k + '" ' + (tag === k ? 'selected' : '') + '>' + tagOptions[k] + '</option>'; }).join('') + '</select>';
      html += '<p class="mvl-dynamic-preview">Vista previa: ' + esc((MVL.dynamicPreview && MVL.dynamicPreview[tag]) || '(vacío en este post)') + '</p>';
    } else if (inputTag === 'textarea') {
      html += '<textarea data-field="' + dataField + '">' + esc(item.data[dataField]) + '</textarea>';
    } else {
      html += '<input data-field="' + dataField + '" type="' + inputTag + '" value="' + escAttr(item.data[dataField]) + '">';
    }
    html += '</div>';
    return html;
  }

  /** Campo de URL del botón: igual que dynamicField, pero las etiquetas "post_link_<tipo>" muestran un buscador (acotado a ese tipo de contenido) en vez de la vista previa genérica. */
  function buttonUrlField(item) {
    var tag = item.data.urlTag || '';
    var html = '<div class="mvl-dynamic-field"><label>URL'
      + '<button type="button" class="mvl-dynamic-toggle' + (tag ? ' is-active' : '') + '" data-dynamic-toggle="urlTag" title="Contenido dinámico"><span class="dashicons dashicons-database"></span></button>'
      + '</label>';
    if (!tag) {
      html += '<input data-field="url" type="url" value="' + escAttr(item.data.url) + '">';
      html += '</div>';
      return html;
    }
    html += '<select data-tag-select="urlTag">' + Object.keys(urlDynamicTags).map(function (k) { return '<option value="' + k + '" ' + (tag === k ? 'selected' : '') + '>' + urlDynamicTags[k] + '</option>'; }).join('') + '</select>';
    if (tag.indexOf('post_link_') === 0) {
      var postType = tag.slice('post_link_'.length);
      var linked = item.data.urlPostId ? postLinkCache[item.data.urlPostId] : null;
      html += '<div class="mvl-post-picker">';
      if (item.data.urlPostId) {
        html += '<p class="mvl-dynamic-preview">Vinculado a: <strong>' + esc(linked ? linked.title : ('#' + item.data.urlPostId + ' (cargando…)')) + '</strong> <button type="button" class="mvl-reset" data-action="clear-post-link">Quitar</button></p>';
      } else {
        html += '<p class="mvl-dynamic-preview">Sin vincular todavía.</p>';
      }
      html += '<input type="text" class="mvl-post-search" data-action="search-post-link" data-post-type="' + escAttr(postType) + '" placeholder="Buscar..." autocomplete="off">';
      html += '<div class="mvl-post-search-results"></div>';
      html += '</div>';
    } else {
      html += '<p class="mvl-dynamic-preview">Vista previa: ' + esc((MVL.dynamicPreview && MVL.dynamicPreview[tag]) || '(vacío en este post)') + '</p>';
    }
    html += '</div>';
    return html;
  }

  function searchPosts(term, postType, resultsBox) {
    var url = MVL.restRoot + 'wp/v2/search?search=' + encodeURIComponent(term) + '&subtype=' + encodeURIComponent(postType) + '&per_page=10';
    resultsBox.innerHTML = '<p class="mvl-empty">Buscando…</p>';
    fetch(url, { headers: { 'X-WP-Nonce': MVL.nonce } })
      .then(function (r) { return r.json(); })
      .then(function (results) {
        results = Array.isArray(results) ? results : [];
        if (!results.length) { resultsBox.innerHTML = '<p class="mvl-empty">Sin resultados.</p>'; return; }
        resultsBox.innerHTML = '';
        results.forEach(function (r) {
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'mvl-post-result';
          btn.innerHTML = esc(r.title) + ' <span class="mvl-hint">' + esc(r.subtype || r.type) + '</span>';
          btn.onclick = function () {
            var item = selectedItem();
            if (!item) return;
            postLinkCache[r.id] = { title: r.title, url: r.url, type: r.subtype || r.type };
            item.data.urlPostId = r.id;
            markDirty();
          };
          resultsBox.appendChild(btn);
        });
      })
      .catch(function () { resultsBox.innerHTML = '<p class="mvl-empty">Error al buscar.</p>'; });
  }

  function buttonStyleField(item) {
    var styles = state.variables.buttonStyles || [];
    if (!styles.length) return '';
    return '<label>Estilo de botón<select data-field="buttonStyle"><option value="">Predeterminado</option>'
      + styles.map(function (s) { return '<option value="' + escAttr(s.id) + '" ' + (item.data.buttonStyle === s.id ? 'selected' : '') + '>' + esc(s.name) + '</option>'; }).join('')
      + '</select></label>';
  }

  function contentPanel(item) {
    var html = '<p class="mvl-type">' + labels[item.type] + '</p>';
    if (item.type === 'section') {
      var tag = item.settings.tag || 'section';
      html += '<label>Elemento HTML<select data-setting="tag">' + Object.keys(containerTags).map(function (t) { return '<option value="' + t + '" ' + (tag === t ? 'selected' : '') + '>&lt;' + t + '&gt;</option>'; }).join('') + '</select></label>';
    }
    if (item.type === 'heading' || item.type === 'text') html += '<label>Texto<textarea data-field="text">' + esc(item.data.text) + '</textarea></label>';
    if (item.type === 'heading') html += '<label>Nivel<select data-field="level">' + [1, 2, 3, 4, 5, 6].map(function (n) { return '<option ' + (item.data.level === n ? 'selected' : '') + ' value="' + n + '">H' + n + '</option>'; }).join('') + '</select></label>';
    if (item.type === 'button') {
      html += dynamicField('Texto', 'text', 'textTag', item, textDynamicTags, 'textarea');
      html += buttonUrlField(item);
      html += buttonStyleField(item);
    }
    if (item.type === 'image') html += imageContentFields(item);
    html += '<label>Clases CSS <span class="mvl-hint">(separadas por espacio: clase1 clase2)</span><input data-setting="classes" type="text" placeholder="clase1 clase2" value="' + escAttr(item.settings.classes || '') + '"></label>';
    html += '<label>ID HTML<input data-setting="htmlId" type="text" placeholder="mi-id" value="' + escAttr(item.settings.htmlId || '') + '"></label>';
    return html;
  }

  function backgroundControls(resp, device) {
    var value = respGet(resp, device);
    var html = '<div class="mvl-field-group"><label class="mvl-group-label">Fondo' + resetButton('background', resp, device) + '</label>';
    html += '<div class="mvl-bg-types">' + bgTypes.map(function (t) {
      return '<button type="button" class="mvl-bg-type' + (value.type === t.key ? ' is-active' : '') + '" data-bg-type="' + t.key + '"><span class="dashicons ' + t.icon + '"></span>' + t.label + '</button>';
    }).join('') + '</div>';

    if (value.type === 'color') {
      html += '<label>Color<input data-bg-field="color" type="color" value="' + escAttr(value.color) + '"></label>';
    }
    if (value.type === 'image') {
      html += '<div class="mvl-media-picker">' + (value.image.url ? '<img class="mvl-media-preview" src="' + escAttr(value.image.url) + '">' : '<div class="mvl-media-empty">Sin imagen</div>') + '<button type="button" class="button" data-action="pick-bg-image">' + (value.image.url ? 'Cambiar imagen' : 'Seleccionar imagen') + '</button></div>';
      html += '<label>Ajuste<select data-bg-field="image.size"><option value="cover" ' + (value.image.size === 'cover' ? 'selected' : '') + '>Cubrir</option><option value="contain" ' + (value.image.size === 'contain' ? 'selected' : '') + '>Contener</option><option value="auto" ' + (value.image.size === 'auto' ? 'selected' : '') + '>Auto</option></select></label>';
      html += '<label>Posición<select data-bg-field="image.position">' + ['center center', 'top center', 'bottom center', 'center left', 'center right'].map(function (p) { return '<option value="' + p + '" ' + (value.image.position === p ? 'selected' : '') + '>' + p + '</option>'; }).join('') + '</select></label>';
      html += '<label>Repetición<select data-bg-field="image.repeat"><option value="no-repeat" ' + (value.image.repeat === 'no-repeat' ? 'selected' : '') + '>No repetir</option><option value="repeat" ' + (value.image.repeat === 'repeat' ? 'selected' : '') + '>Repetir</option></select></label>';
    }
    if (value.type === 'gradient') {
      html += '<label>Tipo<select data-bg-field="gradient.type"><option value="linear" ' + (value.gradient.type === 'linear' ? 'selected' : '') + '>Lineal</option><option value="radial" ' + (value.gradient.type === 'radial' ? 'selected' : '') + '>Radial</option></select></label>';
      if (value.gradient.type === 'linear') html += '<label>Ángulo<input data-bg-field="gradient.angle" type="number" min="0" max="360" value="' + value.gradient.angle + '"></label>';
      html += '<div class="mvl-gradient-stops">' + value.gradient.stops.map(function (stop, i) {
        return '<div class="mvl-gradient-stop"><input data-gradient-stop="' + i + '" data-gradient-field="color" type="color" value="' + escAttr(stop.color) + '"><input data-gradient-stop="' + i + '" data-gradient-field="pos" type="number" min="0" max="100" value="' + stop.pos + '">' + (value.gradient.stops.length > 2 ? '<button type="button" class="mvl-reset" data-remove-stop="' + i + '">✕</button>' : '') + '</div>';
      }).join('') + '</div>';
      html += '<button type="button" class="button" data-action="add-gradient-stop">+ Añadir color</button>';
    }
    if (value.type === 'video') {
      html += '<label>URL del video<input data-bg-field="video.url" type="url" value="' + escAttr(value.video.url) + '" placeholder="https://.../video.mp4"></label>';
    }
    html += '</div>';
    return html;
  }

  function borderControls(resp, device) {
    var value = respGet(resp, device);
    var html = '<div class="mvl-field-group"><label class="mvl-group-label">Borde' + resetButton('border', resp, device) + '</label>';
    html += '<label>Tipo<select data-border-field="style">' + Object.keys(borderStyles).map(function (s) { return '<option value="' + s + '" ' + (value.style === s ? 'selected' : '') + '>' + borderStyles[s] + '</option>'; }).join('') + '</select></label>';
    if (value.style !== 'none') {
      html += '<label>Grosor <span class="mvl-hint">(px, em...)</span><input data-border-field="width" type="text" placeholder="1px" value="' + escAttr(value.width) + '"></label>';
      html += '<label>Color<input data-border-field="color" type="color" value="' + escAttr(value.color) + '"></label>';
    }
    html += '<label>Radio <span class="mvl-hint">(px, %, em...)</span><input data-border-field="radius" type="text" placeholder="0px" value="' + escAttr(value.radius) + '"></label>';
    html += '</div>';
    return html;
  }

  /** El "Estilo" (peso+cursiva) y otros campos que cambian qué controles se ven abajo necesitan redibujar todo el panel; el resto de campos de texto no (perderían el foco). */
  var STYLE_FIELDS_NEEDING_REDRAW = { style: true, display: true };

  function stylePanel(item) {
    var device = state.device || 'desktop';
    var html = '';
    if (item.type === 'heading' || item.type === 'text' || item.type === 'button') {
      html += typographyFieldsHtml('item', item.settings.typography, { label: 'Tipografía', inheritLabel: 'Heredar de Variables' });
    }
    var loc = findLocation(item.id);
    var parent = loc && loc.parentSection;
    if (parent && parent.settings.display === 'grid') {
      html += '<label>Ancho de esta columna <span class="mvl-hint">(px, %, em, rem, fr — vacío = reparto igual entre todas)</span><input data-setting="width" type="text" placeholder="1fr" value="' + escAttr(item.settings.width || '') + '"></label>';
    }
    html += '<div class="mvl-device-note">Editando para: <strong>' + deviceLabels[device] + '</strong></div>';
    if (item.type === 'section') {
      var display = item.settings.display || 'flex';
      html += '<label>Tipo de disposición<select data-setting="display"><option value="flex" ' + (display === 'flex' ? 'selected' : '') + '>Flexbox</option><option value="grid" ' + (display === 'grid' ? 'selected' : '') + '>Grid (columnas)</option></select></label>';
      var align = respGet(item.settings.textAlign, device);
      html += '<label>Alineación' + resetButton('textAlign', item.settings.textAlign, device) + '<select data-resp="textAlign"><option value="left" ' + (align === 'left' ? 'selected' : '') + '>Izquierda</option><option value="center" ' + (align === 'center' ? 'selected' : '') + '>Centrada</option><option value="right" ' + (align === 'right' ? 'selected' : '') + '>Derecha</option></select></label>';
      html += '<label>Espacio entre bloques <span class="mvl-hint">(px, %, em, rem, vh, vw)</span>' + resetButton('gap', item.settings.gap, device) + '<input data-resp="gap" type="text" placeholder="16px" value="' + escAttr(respGet(item.settings.gap, device)) + '"></label>';
      if (display === 'grid') {
        var cols = respGet(item.settings.columns, device);
        html += '<label>Columnas' + resetButton('columns', item.settings.columns, device) + '<input data-resp="columns" type="number" min="1" max="12" value="' + cols + '"></label>';
      } else {
        var dir = respGet(item.settings.flexDirection, device);
        html += '<label>Disposición' + resetButton('flexDirection', item.settings.flexDirection, device) + '<select data-resp="flexDirection"><option value="column" ' + (dir === 'column' ? 'selected' : '') + '>Columna (vertical)</option><option value="row" ' + (dir === 'row' ? 'selected' : '') + '>Fila (horizontal)</option></select></label>';
        var justify = respGet(item.settings.justifyContent, device);
        html += '<label>Justificar contenido' + resetButton('justifyContent', item.settings.justifyContent, device) + '<select data-resp="justifyContent">' + [['flex-start', 'Inicio'], ['center', 'Centro'], ['flex-end', 'Final'], ['space-between', 'Espacio entre'], ['space-around', 'Espacio alrededor'], ['space-evenly', 'Espacio uniforme']].map(function (o) { return '<option value="' + o[0] + '" ' + (justify === o[0] ? 'selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></label>';
        var alignItems = respGet(item.settings.alignItems, device);
        html += '<label>Alinear elementos' + resetButton('alignItems', item.settings.alignItems, device) + '<select data-resp="alignItems">' + [['stretch', 'Estirar'], ['flex-start', 'Inicio'], ['center', 'Centro'], ['flex-end', 'Final']].map(function (o) { return '<option value="' + o[0] + '" ' + (alignItems === o[0] ? 'selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></label>';
      }
    }
    html += backgroundControls(item.settings.background, device);
    html += borderControls(item.settings.border, device);
    return html;
  }

  function spacingGrid(label, key, resp, device) {
    var val = respGet(resp, device);
    var html = '<div class="mvl-spacing-head"><label>' + label + ' <span class="mvl-hint">(px, %, em, rem, vh, vw)</span>' + resetButton(key, resp, device) + '</label>';
    html += '<button type="button" class="mvl-link-toggle' + (val.linked ? ' is-linked' : '') + '" data-link-toggle="' + key + '" title="' + (val.linked ? 'Desvincular valores' : 'Vincular valores') + '"><span class="dashicons ' + (val.linked ? 'dashicons-admin-links' : 'dashicons-editor-unlink') + '"></span></button></div>';
    html += '<div class="mvl-padding-grid">' + ['top', 'right', 'bottom', 'left'].map(function (side) {
      return '<label class="mvl-padding-side">' + sideLabels[side] + '<input data-resp="' + key + '" data-resp-side="' + side + '" type="text" placeholder="0px" value="' + escAttr(val[side]) + '"></label>';
    }).join('') + '</div>';
    return html;
  }

  function advancedPanel(item) {
    var device = state.device || 'desktop';
    return '<div class="mvl-device-note">Editando para: <strong>' + deviceLabels[device] + '</strong></div>'
      + spacingGrid('Relleno', 'padding', item.settings.padding, device)
      + spacingGrid('Margen', 'margin', item.settings.margin, device);
  }

  function inspector(item) {
    if (!item) return '<div class="mvl-empty">Selecciona un bloque para editarlo.</div>';
    var tabs = tabsFor(item);
    if (tabs.indexOf(state.tab) === -1) state.tab = tabs[0];
    var html = '<div class="mvl-tabs">' + tabs.map(function (t) { return '<button class="mvl-tab' + (state.tab === t ? ' is-active' : '') + '" data-tab="' + t + '">' + tabLabels[t] + '</button>'; }).join('') + '</div>';
    html += '<div class="mvl-tab-panel">';
    if (state.tab === 'content') html += contentPanel(item);
    if (state.tab === 'style') html += stylePanel(item);
    if (state.tab === 'advanced') html += advancedPanel(item);
    html += '</div>';
    return html;
  }

  function variablesGeneralPanel(v) {
    return '<label>Ancho máximo del contenedor <span class="mvl-hint">(px, %, em, rem, vh, vw)</span><input data-var-field="containerMaxWidth" type="text" value="' + escAttr(v.containerMaxWidth) + '"></label>';
  }

  function renderFontResults(term, box) {
    if (!box) return;
    var registered = state.variables.fonts.registered;
    var list = (MVL.fontCatalog || []).filter(function (f) {
      return registered.indexOf(f) === -1 && (!term || f.toLowerCase().indexOf(term.toLowerCase()) !== -1);
    }).slice(0, 30);
    box.innerHTML = list.length
      ? list.map(function (f) { return '<button type="button" class="mvl-font-result" data-add-font="' + escAttr(f) + '">' + esc(f) + '</button>'; }).join('')
      : '<p class="mvl-empty">Sin resultados.</p>';
  }

  function variablesFontsPanel(v) {
    var html = '<div class="mvl-field-group"><label class="mvl-group-label">Fuentes registradas <span class="mvl-hint">(máx. ' + MAX_REGISTERED_FONTS + ', se descargan y se sirven localmente — el resto de Google Fonts no se carga en el front)</span></label>';
    html += '<div class="mvl-font-chips">' + v.fonts.registered.map(function (f) { return '<span class="mvl-font-chip">' + esc(f) + '<button type="button" data-remove-font="' + escAttr(f) + '" title="Quitar">×</button></span>'; }).join('') + '</div>';
    if (v.fonts.registered.length < MAX_REGISTERED_FONTS) {
      html += '<input type="text" class="mvl-font-search" data-action="font-search" placeholder="Buscar en Google Fonts…" autocomplete="off">';
      html += '<div class="mvl-font-search-results"></div>';
    } else {
      html += '<p class="mvl-hint">Llegaste al máximo de fuentes registradas; quita una para añadir otra.</p>';
    }
    html += '</div>';
    html += '<div class="mvl-field-group"><label class="mvl-group-label">Tipografía por rol</label>';
    Object.keys(typographyRoleLabels).forEach(function (role) {
      html += '<div class="mvl-typo-role"><p class="mvl-type">' + typographyRoleLabels[role] + '</p>' + typographyFieldsHtml('role:' + role, v.fonts.typography[role], { inheritLabel: 'Predeterminado del tema' }) + '</div>';
    });
    html += '</div>';
    return html;
  }

  function newButtonStyle() {
    return {
      id: 'style-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: 'Nuevo estilo',
      background: { type: 'color', color: '#2271b1' },
      textColor: '#ffffff',
      border: { style: 'none', width: '1px', color: '#000000', radius: '4px' },
      padding: { top: '12px', right: '24px', bottom: '12px', left: '24px', linked: false },
      typography: defaultTypography()
    };
  }

  function variablesButtonsPanel(v) {
    var html = '<div class="mvl-field-group"><button type="button" class="button" data-action="add-button-style">+ Nuevo estilo de botón</button></div>';
    if (!v.buttonStyles.length) html += '<p class="mvl-empty">Todavía no hay estilos de botón. Crea uno y luego elígelo desde el botón en el lienzo (pestaña Contenido).</p>';
    v.buttonStyles.forEach(function (style, idx) {
      html += '<div class="mvl-button-style-card">';
      html += '<div class="mvl-button-style-head"><input type="text" data-btnstyle-field="' + idx + '.name" value="' + escAttr(style.name) + '" placeholder="Nombre del estilo"><button type="button" class="mvl-reset" data-remove-button-style="' + idx + '">Eliminar</button></div>';
      html += '<label>Color de fondo<input type="color" data-btnstyle-field="' + idx + '.background.color" value="' + escAttr(style.background.color) + '"></label>';
      html += '<label>Color de texto<input type="color" data-btnstyle-field="' + idx + '.textColor" value="' + escAttr(style.textColor) + '"></label>';
      html += '<label>Borde<select data-btnstyle-field="' + idx + '.border.style">' + Object.keys(borderStyles).map(function (s) { return '<option value="' + s + '" ' + (style.border.style === s ? 'selected' : '') + '>' + borderStyles[s] + '</option>'; }).join('') + '</select></label>';
      if (style.border.style !== 'none') {
        html += '<label>Grosor de borde<input type="text" data-btnstyle-field="' + idx + '.border.width" value="' + escAttr(style.border.width) + '"></label>';
        html += '<label>Color de borde<input type="color" data-btnstyle-field="' + idx + '.border.color" value="' + escAttr(style.border.color) + '"></label>';
      }
      html += '<label>Radio de borde<input type="text" data-btnstyle-field="' + idx + '.border.radius" value="' + escAttr(style.border.radius) + '"></label>';
      html += '<div class="mvl-padding-grid">' + ['top', 'right', 'bottom', 'left'].map(function (side) { return '<label class="mvl-padding-side">' + sideLabels[side] + '<input data-btnstyle-field="' + idx + '.padding.' + side + '" type="text" value="' + escAttr(style.padding[side]) + '"></label>'; }).join('') + '</div>';
      html += typographyFieldsHtml('btn:' + idx, style.typography, { label: 'Tipografía del botón', inheritLabel: 'Predeterminado' });
      html += '</div>';
    });
    return html;
  }

  function variablesPanelHtml() {
    var v = state.variables;
    var tab = state.variablesTab || 'general';
    var tabs = [['general', 'General'], ['fonts', 'Fuentes'], ['buttons', 'Estilos de botón']];
    var html = '<div class="mvl-variables-panel"><h2>Variables<button class="mvl-close" data-action="toggle-variables" title="Cerrar">×</button></h2>';
    html += '<div class="mvl-tabs">' + tabs.map(function (t) { return '<button class="mvl-tab' + (tab === t[0] ? ' is-active' : '') + '" data-variables-tab="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>';
    html += '<div class="mvl-variables-body">';
    if (tab === 'general') html += variablesGeneralPanel(v);
    if (tab === 'fonts') html += variablesFontsPanel(v);
    if (tab === 'buttons') html += variablesButtonsPanel(v);
    html += '</div>';
    html += '<div class="mvl-variables-footer"><span class="mvl-variables-status">' + (state.variablesDirty ? 'Cambios sin guardar' : 'Guardado') + '</span><button type="button" class="button button-primary" data-action="save-variables">Guardar variables</button></div>';
    html += '</div>';
    return html;
  }

  function bindVariablesEvents(container) {
    container.querySelectorAll('[data-variables-tab]').forEach(function (b) { b.onclick = function () { state.variablesTab = b.dataset.variablesTab; update(); }; });

    container.querySelectorAll('[data-var-field]').forEach(function (el) {
      el.addEventListener('input', function () {
        state.variables[el.dataset.varField] = el.value;
        markVariablesDirtyLite();
      });
    });

    container.querySelectorAll('[data-action="font-search"]').forEach(function (input) {
      input.addEventListener('input', function () { renderFontResults(input.value.trim(), input.nextElementSibling); });
      renderFontResults(input.value.trim(), input.nextElementSibling);
    });

    container.querySelectorAll('[data-add-font]').forEach(function (b) {
      b.onclick = function () {
        if (state.variables.fonts.registered.length >= MAX_REGISTERED_FONTS) return;
        state.variables.fonts.registered.push(b.dataset.addFont);
        markVariablesDirty();
      };
    });

    container.querySelectorAll('[data-remove-font]').forEach(function (b) {
      b.onclick = function () {
        var f = b.dataset.removeFont;
        var idx = state.variables.fonts.registered.indexOf(f);
        if (idx > -1) state.variables.fonts.registered.splice(idx, 1);
        Object.keys(state.variables.fonts.typography).forEach(function (role) {
          if (state.variables.fonts.typography[role].family === f) state.variables.fonts.typography[role].family = '';
        });
        state.variables.buttonStyles.forEach(function (s) { if (s.typography.family === f) s.typography.family = ''; });
        markVariablesDirty();
      };
    });

    container.querySelectorAll('[data-action="add-button-style"]').forEach(function (b) {
      b.onclick = function () { state.variables.buttonStyles.push(newButtonStyle()); markVariablesDirty(); };
    });

    container.querySelectorAll('[data-remove-button-style]').forEach(function (b) {
      b.onclick = function () { state.variables.buttonStyles.splice(Number(b.dataset.removeButtonStyle), 1); markVariablesDirty(); };
    });

    container.querySelectorAll('[data-btnstyle-field]').forEach(function (el) {
      el.addEventListener('input', function () {
        var path = el.dataset.btnstyleField.split('.');
        var idx = Number(path.shift());
        var style = state.variables.buttonStyles[idx];
        if (!style) return;
        var obj = style;
        for (var i = 0; i < path.length - 1; i++) obj = obj[path[i]];
        obj[path[path.length - 1]] = el.value;
        if (path[path.length - 1] === 'style' && path[0] === 'border') markVariablesDirty(); else markVariablesDirtyLite();
      });
    });

    container.querySelectorAll('[data-action="save-variables"]').forEach(function (b) { b.onclick = function () { saveVariables(); }; });
    container.querySelectorAll('[data-action="toggle-variables"]').forEach(function (b) { b.onclick = function () { state.showVariables = false; update(); }; });
  }

  function saveVariables(onSaved) {
    fetch(MVL.variablesUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': MVL.nonce }, body: JSON.stringify({ variables: state.variables }) })
      .then(function (r) { if (!r.ok) throw new Error('No se pudo guardar'); return r.json(); })
      .then(function (data) {
        state.variables = data.variables;
        state.variablesDirty = false;
        update();
        if (data.fontErrors && data.fontErrors.length) {
          alert('No se pudieron descargar estas fuentes de Google: ' + data.fontErrors.join(', ') + '. Se usará la fuente del tema mientras tanto.');
        }
        if (onSaved) onSaved();
      })
      .catch(function () { alert('No se han podido guardar las Variables.'); });
  }

  function treeNode(node, depth) {
    var indent = ' style="padding-left:' + (depth * 16) + 'px"';
    if (node.type === 'section') {
      var inner = node.children.map(function (child) { return treeNode(child, depth + 1); }).join('');
      return '<div class="mvl-tree-section ' + (state.selected === node.id ? 'is-selected' : '') + '" data-id="' + node.id + '">'
        + '<button' + indent + ' draggable="true" data-select="' + node.id + '" data-drag-node="' + node.id + '">' + labels.section + '</button>'
        + inner + '</div>';
    }
    return '<button class="mvl-tree-item ' + (state.selected === node.id ? 'is-selected' : '') + '"' + indent + ' draggable="true" data-select="' + node.id + '" data-drag-node="' + node.id + '">' + labels[node.type] + '</button>';
  }
  function tree() {
    return state.layout.map(function (n) { return treeNode(n, 0); }).join('') || '<p class="mvl-empty">Añade un contenedor para empezar.</p>';
  }

  function bindDynamicEvents(container) {
    container.querySelectorAll('[data-select]').forEach(function (b) { b.onclick = function () { state.selected = b.dataset.select; update(); }; });

    container.querySelectorAll('[data-tab]').forEach(function (b) { b.onclick = function () { state.tab = b.dataset.tab; update(); }; });

    container.querySelectorAll('[data-field]').forEach(function (el) {
      el.addEventListener('input', function () {
        var item = selectedItem();
        if (!item) return;
        var value = el.type === 'number' ? Number(el.value) : el.value;
        item.data[el.dataset.field] = value;
        if (el.dataset.field === 'size' && item.data.id && attachmentSizesCache[item.data.id] && attachmentSizesCache[item.data.id][value]) {
          item.data.url = attachmentSizesCache[item.data.id][value];
        }
        markDirtyLite();
      });
    });

    container.querySelectorAll('[data-setting]').forEach(function (el) {
      el.addEventListener('input', function () {
        var item = selectedItem();
        if (!item) return;
        item.settings[el.dataset.setting] = el.value;
        if (STYLE_FIELDS_NEEDING_REDRAW[el.dataset.setting]) markDirty(); else markDirtyLite();
      });
    });

    container.querySelectorAll('[data-typo]').forEach(function (el) {
      el.addEventListener('input', function () {
        var typo = resolveTypoTarget(el.dataset.typo);
        if (!typo) return;
        typo[el.dataset.typoKey] = el.value;
        if (el.dataset.typo === 'item') markDirtyLite(); else markVariablesDirtyLite();
      });
    });

    container.querySelectorAll('[data-resp]:not([data-resp-side])').forEach(function (el) {
      el.addEventListener('input', function () {
        var item = selectedItem();
        if (!item) return;
        var device = state.device || 'desktop';
        item.settings[el.dataset.resp][device] = el.value;
        markDirtyLite();
      });
    });

    container.querySelectorAll('[data-resp-side]').forEach(function (el) {
      el.addEventListener('input', function () {
        var item = selectedItem();
        if (!item) return;
        var device = state.device || 'desktop';
        var resp = item.settings[el.dataset.resp];
        var target = respEnsureOverride(resp, device);
        if (target.linked) {
          target.top = target.right = target.bottom = target.left = el.value;
          container.querySelectorAll('[data-resp="' + el.dataset.resp + '"][data-resp-side]').forEach(function (sibling) {
            if (sibling !== el) sibling.value = el.value;
          });
        } else {
          target[el.dataset.respSide] = el.value;
        }
        markDirtyLite();
      });
    });

    container.querySelectorAll('[data-link-toggle]').forEach(function (b) {
      b.onclick = function () {
        var item = selectedItem();
        if (!item) return;
        var device = state.device || 'desktop';
        var target = respEnsureOverride(item.settings[b.dataset.linkToggle], device);
        target.linked = !target.linked;
        if (target.linked) {
          target.right = target.bottom = target.left = target.top;
        }
        markDirty();
      };
    });

    container.querySelectorAll('[data-dynamic-toggle]').forEach(function (b) {
      b.onclick = function () {
        var item = selectedItem();
        if (!item) return;
        var field = b.dataset.dynamicToggle;
        var options = field === 'textTag' ? textDynamicTags : urlDynamicTags;
        item.data[field] = item.data[field] ? '' : Object.keys(options)[0];
        markDirty();
      };
    });

    container.querySelectorAll('[data-tag-select]').forEach(function (el) {
      el.addEventListener('change', function () {
        var item = selectedItem();
        if (!item) return;
        item.data[el.dataset.tagSelect] = el.value;
        markDirty();
      });
    });

    container.querySelectorAll('[data-action="clear-post-link"]').forEach(function (b) {
      b.onclick = function () {
        var item = selectedItem();
        if (!item) return;
        item.data.urlPostId = 0;
        markDirty();
      };
    });

    container.querySelectorAll('[data-action="search-post-link"]').forEach(function (input) {
      var timer = null;
      input.addEventListener('input', function () {
        var term = input.value.trim();
        var resultsBox = input.nextElementSibling;
        if (timer) clearTimeout(timer);
        if (term.length < 2) { resultsBox.innerHTML = ''; return; }
        timer = setTimeout(function () { searchPosts(term, input.dataset.postType, resultsBox); }, 300);
      });
    });

    container.querySelectorAll('[data-reset]').forEach(function (btn) {
      btn.onclick = function () {
        var item = selectedItem();
        if (!item) return;
        respReset(item.settings[btn.dataset.reset], state.device || 'desktop');
        markDirty();
      };
    });

    container.querySelectorAll('[data-bg-type]').forEach(function (b) {
      b.onclick = function () {
        var item = selectedItem();
        if (!item) return;
        var target = respEnsureOverride(item.settings.background, state.device || 'desktop');
        target.type = target.type === b.dataset.bgType ? 'none' : b.dataset.bgType;
        markDirty();
      };
    });

    container.querySelectorAll('[data-bg-field]').forEach(function (el) {
      el.addEventListener('input', function () {
        var item = selectedItem();
        if (!item) return;
        var target = respEnsureOverride(item.settings.background, state.device || 'desktop');
        var path = el.dataset.bgField.split('.');
        var obj = target;
        for (var i = 0; i < path.length - 1; i++) obj = obj[path[i]];
        obj[path[path.length - 1]] = el.type === 'number' ? Number(el.value) : el.value;
        markDirtyLite();
      });
    });

    container.querySelectorAll('[data-border-field]').forEach(function (el) {
      el.addEventListener('input', function () {
        var item = selectedItem();
        if (!item) return;
        var target = respEnsureOverride(item.settings.border, state.device || 'desktop');
        target[el.dataset.borderField] = el.value;
        if (STYLE_FIELDS_NEEDING_REDRAW[el.dataset.borderField]) markDirty(); else markDirtyLite();
      });
    });

    container.querySelectorAll('[data-gradient-stop]').forEach(function (el) {
      el.addEventListener('input', function () {
        var item = selectedItem();
        if (!item) return;
        var target = respEnsureOverride(item.settings.background, state.device || 'desktop');
        var stop = target.gradient.stops[Number(el.dataset.gradientStop)];
        if (!stop) return;
        stop[el.dataset.gradientField] = el.dataset.gradientField === 'pos' ? Number(el.value) : el.value;
        markDirtyLite();
      });
    });

    container.querySelectorAll('[data-remove-stop]').forEach(function (b) {
      b.onclick = function () {
        var item = selectedItem();
        if (!item) return;
        var target = respEnsureOverride(item.settings.background, state.device || 'desktop');
        target.gradient.stops.splice(Number(b.dataset.removeStop), 1);
        markDirty();
      };
    });

    container.querySelectorAll('[data-action="add-gradient-stop"]').forEach(function (b) {
      b.onclick = function () {
        var item = selectedItem();
        if (!item) return;
        var target = respEnsureOverride(item.settings.background, state.device || 'desktop');
        target.gradient.stops.push({ color: '#ffffff', pos: 50 });
        markDirty();
      };
    });

    container.querySelectorAll('[data-action="pick-image"]').forEach(function (b) {
      b.onclick = function () {
        openMediaPicker(function (attachment) {
          var item = selectedItem();
          if (!item) return;
          attachmentSizesCache[attachment.id] = attachment.sizes;
          item.data.id = attachment.id;
          item.data.size = item.data.size || 'full';
          item.data.url = attachment.sizes[item.data.size] || attachment.url;
          item.data.alt = item.data.alt || attachment.alt || '';
          markDirty();
        });
      };
    });

    container.querySelectorAll('[data-action="pick-bg-image"]').forEach(function (b) {
      b.onclick = function () {
        openMediaPicker(function (attachment) {
          var item = selectedItem();
          if (!item) return;
          var target = respEnsureOverride(item.settings.background, state.device || 'desktop');
          target.image.url = attachment.url;
          markDirty();
        });
      };
    });

    bindDragAndDrop(container);
  }

  function bindDragAndDrop(container) {
    var draggingId = null;
    container.querySelectorAll('[data-drag-node]').forEach(function (handle) {
      handle.addEventListener('dragstart', function (e) { e.stopPropagation(); draggingId = handle.dataset.dragNode; e.dataTransfer.effectAllowed = 'move'; });
      handle.addEventListener('dragover', function (e) { e.preventDefault(); e.stopPropagation(); });
      handle.addEventListener('drop', function (e) {
        e.preventDefault(); e.stopPropagation();
        if (!draggingId) return;
        var targetId = handle.dataset.dragNode;
        if (draggingId !== targetId) moveNode(draggingId, targetId);
        draggingId = null;
      });
    });
  }

  function buildSkeleton() {
    root.innerHTML =
      '<header class="mvl-topbar">'
      + '<button class="mvl-toggle-left" data-action="toggle-left" title="Mostrar/ocultar bloques">☰</button>'
      + '<strong>' + esc(MVL.postTitle) + '</strong>'
      + '<div class="mvl-devices">'
      + '<button class="mvl-device is-active" data-device="desktop" title="Escritorio">🖥</button>'
      + '<button class="mvl-device" data-device="tablet" title="Tablet">📱</button>'
      + '<button class="mvl-device" data-device="mobile" title="Móvil">📲</button>'
      + '</div>'
      + '<button class="mvl-toggle-structure" data-action="toggle-structure" title="Estructura">Estructura</button>'
      + '<button class="mvl-toggle-variables" data-action="toggle-variables" title="Variables globales de tipografía y fuentes">Variables</button>'
      + '<button class="mvl-toggle-fullscreen" data-action="toggle-fullscreen" title="Ver a ancho completo">⛶ Ancho completo</button>'
      + '<span class="mvl-status"></span>'
      + '<button class="button button-primary" data-action="save">Guardar</button>'
      + '</header>'
      + '<main class="mvl-shell">'
      + '<aside class="mvl-left"><h2>Bloques</h2><div class="mvl-add">' + Object.keys(labels).map(function (type) { return '<button class="mvl-add-block" data-add="' + type + '"><span class="dashicons ' + icons[type] + '"></span><span class="mvl-add-label">' + labels[type] + '</span></button>'; }).join('') + '</div></aside>'
      + '<section class="mvl-canvas"><div class="mvl-canvas-frame"></div></section>'
      + '<aside class="mvl-right"><h2>Ajustes</h2><div class="mvl-inspector"></div><div class="mvl-actions"><button class="button" data-action="up">Subir</button><button class="button" data-action="down">Bajar</button><button class="button-link-delete" data-action="delete">Eliminar</button></div></aside>'
      + '</main>';

    refs.shell = root.querySelector('.mvl-shell');
    refs.status = root.querySelector('.mvl-status');
    refs.toggleStructureBtn = root.querySelector('[data-action="toggle-structure"]');
    refs.toggleVariablesBtn = root.querySelector('[data-action="toggle-variables"]');
    refs.toggleFullscreenBtn = root.querySelector('[data-action="toggle-fullscreen"]');
    refs.inspector = root.querySelector('.mvl-inspector');
    refs.canvasFrame = root.querySelector('.mvl-canvas-frame');
    refs.devices = root.querySelectorAll('[data-device]');

    refs.frame = document.createElement('iframe');
    refs.frame.title = 'Vista previa real';
    refs.frame.src = MVL.previewUrl;
    refs.frame.onload = function () { refreshPreview(); };
    refs.canvasFrame.appendChild(refs.frame);

    root.querySelectorAll('[data-add]').forEach(function (b) { b.onclick = function () { add(b.dataset.add); }; });
    root.querySelectorAll('[data-action]').forEach(function (b) {
      b.onclick = function () {
        if (b.dataset.action === 'save') save();
        if (b.dataset.action === 'delete') remove();
        if (b.dataset.action === 'up') move(-1);
        if (b.dataset.action === 'down') move(1);
        if (b.dataset.action === 'toggle-left') { state.leftCollapsed = !state.leftCollapsed; update(); }
        if (b.dataset.action === 'toggle-structure') { state.showStructure = !state.showStructure; update(); }
        if (b.dataset.action === 'toggle-variables') { state.showVariables = !state.showVariables; update(); }
        if (b.dataset.action === 'toggle-fullscreen') { toggleFullscreen(); }
      };
    });
    refs.devices.forEach(function (b) { b.onclick = function () { state.device = b.dataset.device; update(); }; });
  }

  function toggleFullscreen() {
    state.fullscreen = !state.fullscreen;
    update();
  }

  function update() {
    refs.shell.classList.toggle('is-left-collapsed', state.leftCollapsed);
    refs.status.textContent = state.dirty ? 'Cambios sin guardar' : 'Guardado';
    refs.toggleStructureBtn.classList.toggle('is-active', state.showStructure);
    refs.toggleVariablesBtn.classList.toggle('is-active', state.showVariables);
    refs.toggleFullscreenBtn.classList.toggle('is-active', state.fullscreen);
    refs.shell.classList.toggle('mvl-focus-mode', state.fullscreen);
    refs.canvasFrame.className = 'mvl-canvas-frame' + (state.device && state.device !== 'desktop' ? ' is-' + state.device : '');
    refs.devices.forEach(function (b) { b.classList.toggle('is-active', (state.device || 'desktop') === b.dataset.device); });

    refs.inspector.innerHTML = inspector(selectedItem());
    bindDynamicEvents(refs.inspector);

    var existingPanel = root.querySelector('.mvl-structure-panel');
    if (state.showStructure) {
      var panelHtml = '<div class="mvl-structure-panel"><h2>Estructura<button class="mvl-close" data-action="toggle-structure" title="Cerrar">×</button></h2><div class="mvl-tree">' + tree() + '</div></div>';
      if (existingPanel) { existingPanel.outerHTML = panelHtml; } else { root.insertAdjacentHTML('beforeend', panelHtml); }
      var panel = root.querySelector('.mvl-structure-panel');
      panel.querySelector('[data-action="toggle-structure"]').onclick = function () { state.showStructure = false; update(); };
      bindDynamicEvents(panel);
    } else if (existingPanel) {
      existingPanel.remove();
    }

    var existingVariablesPanel = root.querySelector('.mvl-variables-panel');
    if (state.showVariables) {
      var variablesHtml = variablesPanelHtml();
      if (existingVariablesPanel) { existingVariablesPanel.outerHTML = variablesHtml; } else { root.insertAdjacentHTML('beforeend', variablesHtml); }
      var variablesPanel = root.querySelector('.mvl-variables-panel');
      // bindDynamicEvents trae el manejador genérico de [data-typo], compartido con
      // la tipografía de un bloque en el inspector (ver typographyFieldsHtml).
      bindDynamicEvents(variablesPanel);
      bindVariablesEvents(variablesPanel);
    } else if (existingVariablesPanel) {
      existingVariablesPanel.remove();
    }

    refreshPreview();
  }

  function autop(text) {
    return (text || '').split(/\n{2,}/).map(function (p) { return p.trim(); }).filter(Boolean).map(function (p) { return '<p>' + esc(p).replace(/\n/g, '<br>') + '</p>'; }).join('');
  }

  function cssLength(v) { v = (v == null ? '' : v).toString().trim(); if (v === '') return '0px'; return /^-?\d+(\.\d+)?$/.test(v) ? v + 'px' : v; }
  function paddingCss(p) { return cssLength(p.top) + ' ' + cssLength(p.right) + ' ' + cssLength(p.bottom) + ' ' + cssLength(p.left); }

  function backgroundCss(bg) {
    if (bg.type === 'color') return 'background:' + bg.color + ';';
    if (bg.type === 'image' && bg.image.url) return 'background-image:url(' + bg.image.url + ');background-size:' + bg.image.size + ';background-position:' + bg.image.position + ';background-repeat:' + bg.image.repeat + ';';
    if (bg.type === 'gradient') {
      var stops = bg.gradient.stops.map(function (s) { return s.color + ' ' + s.pos + '%'; }).join(', ');
      var fn = bg.gradient.type === 'radial' ? 'radial-gradient(circle, ' : 'linear-gradient(' + bg.gradient.angle + 'deg, ';
      return 'background:' + fn + stops + ');';
    }
    return '';
  }

  function borderCss(b) {
    var css = 'border-radius:' + cssLength(b.radius) + ';';
    css += b.style && b.style !== 'none' ? 'border:' + cssLength(b.width) + ' ' + b.style + ' ' + b.color + ';' : 'border:none;';
    return css;
  }

  /** Equivalentes en JS de variant_css()/typography_css()/button_style_css()/variables_css() en class-mvl-plugin.php: recalculan el mismo CSS al vuelo para la vista previa en vivo dentro del iframe, antes de guardar. */
  function variantCssJs(variant) {
    if (variant === 'italic') return 'font-style:italic!important;font-weight:400!important;';
    if (variant === 'bold') return 'font-style:normal!important;font-weight:700!important;';
    if (variant === 'bolditalic') return 'font-style:italic!important;font-weight:700!important;';
    return 'font-style:normal!important;font-weight:400!important;';
  }
  function typographyCssJs(selector, typo) {
    var decl = '';
    if (typo.family) decl += 'font-family:"' + typo.family + '",sans-serif!important;';
    if (typo.size) decl += 'font-size:' + cssLength(typo.size) + '!important;';
    if (typo.variant && typo.variant !== 'regular') decl += variantCssJs(typo.variant);
    if (typo.transform && typo.transform !== 'none') decl += 'text-transform:' + typo.transform + '!important;';
    return decl ? selector + '{' + decl + '}' : '';
  }
  /** Equivalente en JS de grid_template_columns_css() en class-mvl-plugin.php. */
  function gridTemplateColumnsCss(children, columns) {
    var tracks = [];
    for (var i = 0; i < columns; i++) {
      var child = children[i];
      tracks.push(child && child.settings.width ? child.settings.width : '1fr');
    }
    return tracks.join(' ');
  }
  function itemTypographySelector(uid, type) {
    if (type === 'heading') return '[data-mvl-uid="' + uid + '"] .mvl-heading';
    if (type === 'text') return '[data-mvl-uid="' + uid + '"] .mvl-text';
    if (type === 'button') return '[data-mvl-uid="' + uid + '"] .mvl-button';
    return '';
  }
  function buttonStyleCssJs(style) {
    var selector = '.mvl-btn-style-' + style.id;
    var decl = 'color:' + style.textColor + '!important;';
    decl += style.background.type === 'color' ? 'background:' + style.background.color + '!important;' : 'background:transparent!important;';
    decl += 'border-radius:' + cssLength(style.border.radius) + '!important;';
    decl += style.border.style && style.border.style !== 'none' ? 'border:' + cssLength(style.border.width) + ' ' + style.border.style + ' ' + style.border.color + '!important;' : 'border:none!important;';
    decl += 'padding:' + paddingCss(style.padding) + '!important;';
    return selector + '{' + decl + '}' + typographyCssJs(selector, style.typography);
  }
  function buildVariablesCss(variables) {
    var css = '.mvl-container{max-width:' + cssLength(variables.containerMaxWidth) + '}';
    var roleSelectors = { h1: '.mvl-layout h1', h2: '.mvl-layout h2', h3: '.mvl-layout h3', h4: '.mvl-layout h4', h5: '.mvl-layout h5', h6: '.mvl-layout h6', paragraph: '.mvl-layout .mvl-text' };
    Object.keys(roleSelectors).forEach(function (role) { css += typographyCssJs(roleSelectors[role], variables.fonts.typography[role]); });
    variables.buttonStyles.forEach(function (s) { css += buttonStyleCssJs(s); });
    return css;
  }

  function styleBlock(selector, settings) {
    var base = selector + '{' + backgroundCss(settings.background.desktop) + borderCss(settings.border.desktop) + 'padding:' + paddingCss(settings.padding.desktop) + '!important;margin:' + paddingCss(settings.margin.desktop) + '!important;}';
    var tablet = '', mobile = '';
    ['tablet', 'mobile'].forEach(function (device) {
      var bg = settings.background[device], bd = settings.border[device], pad = settings.padding[device], mar = settings.margin[device];
      if (bg == null && bd == null && pad == null && mar == null) return;
      var decl = '';
      if (bg != null) decl += backgroundCss(bg);
      if (bd != null) decl += borderCss(bd);
      if (pad != null) decl += 'padding:' + paddingCss(pad) + '!important;';
      if (mar != null) decl += 'margin:' + paddingCss(mar) + '!important;';
      if (!decl) return;
      var rule = selector + '{' + decl + '}';
      if (device === 'tablet') tablet += rule; else mobile += rule;
    });
    return { base: base, tablet: tablet, mobile: mobile };
  }

  function collectRules(list, acc) {
    list.forEach(function (node) {
      var uid = node.id;
      var r = styleBlock('[data-mvl-uid="' + uid + '"]', node.settings);
      acc.base += r.base; acc.tablet += r.tablet; acc.mobile += r.mobile;
      var typoSelector = itemTypographySelector(uid, node.type);
      if (typoSelector && node.settings.typography) acc.base += typographyCssJs(typoSelector, node.settings.typography);
      if (node.type === 'section') {
        var s = node.settings;
        var isGrid = s.display === 'grid';
        var gridDecl = isGrid
          ? 'display:grid;grid-template-columns:' + gridTemplateColumnsCss(node.children, respGet(s.columns, 'desktop')) + ';'
          : 'display:flex;flex-wrap:wrap;flex-direction:' + s.flexDirection.desktop + ';justify-content:' + s.justifyContent.desktop + ';align-items:' + s.alignItems.desktop + ';';
        acc.base += '[data-mvl-uid="' + uid + '"] > .mvl-container{text-align:' + s.textAlign.desktop + ';gap:' + cssLength(s.gap.desktop) + ';' + gridDecl + '}';
        if (s.textAlign.tablet != null) acc.tablet += '[data-mvl-uid="' + uid + '"] > .mvl-container{text-align:' + s.textAlign.tablet + '}';
        if (s.textAlign.mobile != null) acc.mobile += '[data-mvl-uid="' + uid + '"] > .mvl-container{text-align:' + s.textAlign.mobile + '}';
        if (s.gap.tablet != null) acc.tablet += '[data-mvl-uid="' + uid + '"] > .mvl-container{gap:' + cssLength(s.gap.tablet) + '}';
        if (s.gap.mobile != null) acc.mobile += '[data-mvl-uid="' + uid + '"] > .mvl-container{gap:' + cssLength(s.gap.mobile) + '}';
        if (isGrid) {
          if (s.columns.tablet != null) acc.tablet += '[data-mvl-uid="' + uid + '"] > .mvl-container{grid-template-columns:' + gridTemplateColumnsCss(node.children, s.columns.tablet) + '}';
          if (s.columns.mobile != null) acc.mobile += '[data-mvl-uid="' + uid + '"] > .mvl-container{grid-template-columns:' + gridTemplateColumnsCss(node.children, s.columns.mobile) + '}';
        } else {
          if (s.flexDirection.tablet != null) acc.tablet += '[data-mvl-uid="' + uid + '"] > .mvl-container{flex-direction:' + s.flexDirection.tablet + '}';
          if (s.flexDirection.mobile != null) acc.mobile += '[data-mvl-uid="' + uid + '"] > .mvl-container{flex-direction:' + s.flexDirection.mobile + '}';
          if (s.justifyContent.tablet != null) acc.tablet += '[data-mvl-uid="' + uid + '"] > .mvl-container{justify-content:' + s.justifyContent.tablet + '}';
          if (s.justifyContent.mobile != null) acc.mobile += '[data-mvl-uid="' + uid + '"] > .mvl-container{justify-content:' + s.justifyContent.mobile + '}';
          if (s.alignItems.tablet != null) acc.tablet += '[data-mvl-uid="' + uid + '"] > .mvl-container{align-items:' + s.alignItems.tablet + '}';
          if (s.alignItems.mobile != null) acc.mobile += '[data-mvl-uid="' + uid + '"] > .mvl-container{align-items:' + s.alignItems.mobile + '}';
        }
        collectRules(node.children, acc);
      }
    });
  }
  function buildResponsiveCss(layout) {
    var acc = { base: '', tablet: '', mobile: '' };
    collectRules(layout, acc);
    var css = acc.base;
    if (acc.tablet) css += '@media (max-width:1024px){' + acc.tablet + '}';
    if (acc.mobile) css += '@media (max-width:767px){' + acc.mobile + '}';
    return css;
  }

  function renderLeafHtml(item) {
    var idAttr = item.settings.htmlId ? ' id="' + escAttr(item.settings.htmlId) + '"' : '';
    var attr = ' data-mvl-uid="' + item.id + '"' + idAttr;
    var extraClass = item.settings.classes ? ' ' + escAttr(item.settings.classes) : '';
    var itemHasVideo = item.settings.background.desktop.type === 'video' && item.settings.background.desktop.video.url;
    var content = '';
    if (item.type === 'heading') { var tag = 'h' + (item.data.level || 2); content = '<' + tag + ' class="mvl-heading">' + esc(item.data.text) + '</' + tag + '>'; }
    if (item.type === 'text') content = '<div class="mvl-text">' + autop(item.data.text) + '</div>';
    if (item.type === 'button') {
      var preview = MVL.dynamicPreview || {};
      var btnText = item.data.textTag ? (preview[item.data.textTag] || item.data.text) : item.data.text;
      var btnUrl;
      if (item.data.urlTag && item.data.urlTag.indexOf('post_link_') === 0) {
        var linkedPost = item.data.urlPostId ? postLinkCache[item.data.urlPostId] : null;
        btnUrl = (linkedPost && linkedPost.url) || item.data.url || '#';
      } else {
        btnUrl = item.data.urlTag ? (preview[item.data.urlTag] || item.data.url) : (item.data.url || '#');
      }
      var styleClass = item.data.buttonStyle ? ' mvl-btn-style-' + escAttr(item.data.buttonStyle) : '';
      content = '<a class="mvl-button' + styleClass + '" href="' + escAttr(btnUrl) + '">' + esc(btnText) + '</a>';
    }
    if (item.type === 'image' && item.data.url) content = '<img class="mvl-image" src="' + escAttr(item.data.url) + '" alt="' + escAttr(item.data.alt) + '">';
    var videoHtml = itemHasVideo ? '<div class="mvl-bg-video"><video autoplay muted loop playsinline src="' + escAttr(item.settings.background.desktop.video.url) + '"></video></div>' : '';
    return '<div class="mvl-item mvl-item-' + item.type + ' mvl-bg-host' + (itemHasVideo ? ' mvl-has-video-bg' : '') + extraClass + '"' + attr + '>' + videoHtml + content + '</div>';
  }
  function renderSectionHtml(section) {
    var hasVideo = section.settings.background.desktop.type === 'video' && section.settings.background.desktop.video.url;
    var inner = section.children.map(function (node) { return node.type === 'section' ? renderSectionHtml(node) : renderLeafHtml(node); }).join('');
    var sectionVideo = hasVideo ? '<div class="mvl-bg-video"><video autoplay muted loop playsinline src="' + escAttr(section.settings.background.desktop.video.url) + '"></video></div>' : '';
    var sectionTag = containerTags[section.settings.tag] ? section.settings.tag : 'section';
    var idAttr = section.settings.htmlId ? ' id="' + escAttr(section.settings.htmlId) + '"' : '';
    var extraClass = section.settings.classes ? ' ' + escAttr(section.settings.classes) : '';
    return '<' + sectionTag + ' class="mvl-section mvl-bg-host' + (hasVideo ? ' mvl-has-video-bg' : '') + extraClass + '" data-mvl-uid="' + section.id + '"' + idAttr + '>' + sectionVideo + '<div class="mvl-container">' + inner + '</div></' + sectionTag + '>';
  }
  function renderLayoutHtml(layout) { return layout.map(renderSectionHtml).join(''); }

  function ensureSelectionStyle(doc) {
    if (doc.getElementById('mvl-live-style')) return;
    var style = doc.createElement('style');
    style.id = 'mvl-live-style';
    style.textContent = '[data-mvl-uid]{cursor:pointer}.mvl-is-selected{outline:2px solid #2271b1!important;outline-offset:-2px}';
    doc.head.appendChild(style);
  }

  function updateResponsiveStyle(doc) {
    var style = doc.getElementById('mvl-responsive-style');
    if (!style) { style = doc.createElement('style'); style.id = 'mvl-responsive-style'; }
    style.textContent = buildVariablesCss(state.variables) + buildResponsiveCss(state.layout);
    // La página real ya trae su propio <style> con los valores guardados; como tiene
    // igual especificidad, para que la vista previa en vivo siempre gane hay que
    // mantener este <style> al final del body (appendChild también lo reubica si ya existía).
    doc.body.appendChild(style);
  }

  function refreshPreview() {
    if (!refs.frame) return;
    var doc; try { doc = refs.frame.contentDocument; } catch (e) { return; }
    if (!doc || !doc.body) return;
    var container = doc.querySelector('.mvl-layout');
    if (!container) return;
    container.innerHTML = renderLayoutHtml(state.layout);
    ensureSelectionStyle(doc);
    updateResponsiveStyle(doc);
    doc.querySelectorAll('[data-mvl-uid]').forEach(function (el) { el.classList.toggle('mvl-is-selected', el.dataset.mvlUid === state.selected); });
  }

  function saveLayout() {
    fetch(MVL.restUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': MVL.nonce }, body: JSON.stringify({ layout: state.layout }) })
      .then(function (r) { if (!r.ok) throw new Error('No se pudo guardar'); return r.json(); })
      .then(function (data) { state.layout = data.layout; state.dirty = false; update(); })
      .catch(function () { alert('No se han podido guardar los cambios.'); });
  }

  /**
   * Si hay cambios sin guardar en Variables (fuentes/tipografía/estilos de botón),
   * hay que guardarlos ANTES que el layout: el sanitizador del servidor solo acepta
   * en un botón/bloque una fuente o un estilo de botón que ya exista en las
   * Variables guardadas, así que guardar el layout primero descartaría en silencio
   * lo que se acaba de elegir en esta misma sesión.
   */
  function save() {
    if (state.variablesDirty) saveVariables(saveLayout); else saveLayout();
  }

  window.addEventListener('message', function (event) {
    if (event.origin !== location.origin || !event.data || event.data.type !== 'mvl-select') return;
    state.selected = event.data.id;
    state.tab = 'content';
    update();
  });

  buildSkeleton();
  update();
  hydratePostLinkLabels();
}());
