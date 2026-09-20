(function () {
  'use strict';
  var state = { layout: MVL.layout || [], selected: null, dirty: false, leftCollapsed: false, showStructure: false, device: 'desktop', tab: 'content' };
  var root = document.getElementById('mvl-builder');
  var labels = { section: 'Sección', heading: 'Título', text: 'Texto', button: 'Botón', image: 'Imagen' };
  var icons = { section: 'dashicons-align-wide', heading: 'dashicons-heading', text: 'dashicons-text-page', button: 'dashicons-button', image: 'dashicons-format-image' };
  var deviceLabels = { desktop: 'Escritorio', tablet: 'Tablet', mobile: 'Móvil' };
  var sideLabels = { top: 'Arriba', right: 'Derecha', bottom: 'Abajo', left: 'Izquierda' };
  var tabLabels = { content: 'Contenido', style: 'Estilo', advanced: 'Avanzado' };
  var bgTypes = [
    { key: 'color', label: 'Color', icon: 'dashicons-art' },
    { key: 'image', label: 'Imagen', icon: 'dashicons-format-image' },
    { key: 'gradient', label: 'Degradado', icon: 'dashicons-color-picker' },
    { key: 'video', label: 'Video', icon: 'dashicons-video-alt3' }
  ];
  var mediaSizes = { thumbnail: 'Miniatura', medium: 'Mediana', medium_large: 'Mediana grande', large: 'Grande', full: 'Completa' };
  var attachmentSizesCache = {};
  var mediaFrame = null;
  var refs = {};

  function id() { return 'mvl-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function esc(value) { var d = document.createElement('div'); d.textContent = value || ''; return d.innerHTML; }
  function escAttr(value) { return esc(value).replace(/"/g, '&quot;'); }
  function selectedItem() { for (var s of state.layout) { if (s.id === state.selected) return s; for (var i of s.children) if (i.id === state.selected) return i; } return null; }
  function currentSection() { for (var s of state.layout) { if (s.id === state.selected || s.children.some(function (i) { return i.id === state.selected; })) return s; } return state.layout[0]; }
  function markDirty() { state.dirty = true; update(); }

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
  function defaultSpacing() { return { top: 0, right: 0, bottom: 0, left: 0 }; }
  function defaultSettings(kind) {
    return {
      background: respDefault(defaultBackground(kind === 'section' ? 'color' : 'none')),
      padding: respDefault(kind === 'section' ? { top: 48, right: 24, bottom: 48, left: 24 } : defaultSpacing()),
      margin: respDefault(defaultSpacing())
    };
  }

  function add(type) {
    if (type === 'section') {
      var section = { id: id(), type: 'section', settings: Object.assign(defaultSettings('section'), { textAlign: respDefault('left') }), children: [] };
      state.layout.push(section); state.selected = section.id; state.tab = 'style';
    } else {
      var section = currentSection(); if (!section) { add('section'); section = currentSection(); }
      var data = type === 'heading' ? { text: 'Un título claro', level: 2 } : type === 'text' ? { text: 'Escribe aquí tu contenido.' } : type === 'button' ? { text: 'Saber más', url: '#' } : { url: '', alt: '', id: 0, size: 'full' };
      var item = { id: id(), type: type, data: data, settings: defaultSettings('item') }; section.children.push(item); state.selected = item.id; state.tab = 'content';
    }
    markDirty();
  }
  function remove() { if (!state.selected) return; state.layout = state.layout.filter(function (s) { return s.id !== state.selected; }); state.layout.forEach(function (s) { s.children = s.children.filter(function (i) { return i.id !== state.selected; }); }); state.selected = null; markDirty(); }
  function move(delta) { var sec = currentSection(), item = selectedItem(); var list = item && item.type !== 'section' ? sec.children : state.layout; var index = list.findIndex(function (x) { return x.id === state.selected; }); if (index >= 0 && list[index + delta]) { var swap = list[index]; list[index] = list[index + delta]; list[index + delta] = swap; markDirty(); } }

  function reorder(list, fromId, toId) {
    var from = list.findIndex(function (x) { return x.id === fromId; });
    var to = list.findIndex(function (x) { return x.id === toId; });
    if (from < 0 || to < 0 || from === to) return false;
    var moved = list.splice(from, 1)[0];
    list.splice(to, 0, moved);
    return true;
  }
  function moveSection(fromId, toId) { if (reorder(state.layout, fromId, toId)) markDirty(); }
  function moveItem(sectionId, fromId, toId) { var section = state.layout.find(function (s) { return s.id === sectionId; }); if (section && reorder(section.children, fromId, toId)) markDirty(); }

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

  function tabsFor(item) { return item.type === 'section' ? ['style', 'advanced'] : ['content', 'style', 'advanced']; }

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

  function contentPanel(item) {
    var html = '<p class="mvl-type">' + labels[item.type] + '</p>';
    if (item.type === 'heading' || item.type === 'text' || item.type === 'button') html += '<label>Texto<textarea data-field="text">' + esc(item.data.text) + '</textarea></label>';
    if (item.type === 'heading') html += '<label>Nivel<select data-field="level">' + [1, 2, 3, 4, 5, 6].map(function (n) { return '<option ' + (item.data.level === n ? 'selected' : '') + ' value="' + n + '">H' + n + '</option>'; }).join('') + '</select></label>';
    if (item.type === 'button') html += '<label>URL<input data-field="url" type="url" value="' + escAttr(item.data.url) + '"></label>';
    if (item.type === 'image') html += imageContentFields(item);
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

  function stylePanel(item) {
    var device = state.device || 'desktop';
    var html = '<div class="mvl-device-note">Editando para: <strong>' + deviceLabels[device] + '</strong></div>';
    if (item.type === 'section') {
      var align = respGet(item.settings.textAlign, device);
      html += '<label>Alineación' + resetButton('textAlign', item.settings.textAlign, device) + '<select data-resp="textAlign"><option value="left" ' + (align === 'left' ? 'selected' : '') + '>Izquierda</option><option value="center" ' + (align === 'center' ? 'selected' : '') + '>Centrada</option><option value="right" ' + (align === 'right' ? 'selected' : '') + '>Derecha</option></select></label>';
    }
    html += backgroundControls(item.settings.background, device);
    return html;
  }

  function spacingGrid(label, key, resp, device, min, max) {
    var val = respGet(resp, device);
    var html = '<label>' + label + ' (px)' + resetButton(key, resp, device) + '</label>';
    html += '<div class="mvl-padding-grid">' + ['top', 'right', 'bottom', 'left'].map(function (side) {
      return '<label class="mvl-padding-side">' + sideLabels[side] + '<input data-resp="' + key + '" data-resp-side="' + side + '" type="number" min="' + min + '" max="' + max + '" value="' + val[side] + '"></label>';
    }).join('') + '</div>';
    return html;
  }

  function advancedPanel(item) {
    var device = state.device || 'desktop';
    return '<div class="mvl-device-note">Editando para: <strong>' + deviceLabels[device] + '</strong></div>'
      + spacingGrid('Relleno', 'padding', item.settings.padding, device, 0, 200)
      + spacingGrid('Margen', 'margin', item.settings.margin, device, -200, 200);
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

  function tree() {
    return state.layout.map(function (s, si) {
      var items = s.children.map(function (i) { return '<button class="mvl-tree-item ' + (state.selected === i.id ? 'is-selected' : '') + '" draggable="true" data-select="' + i.id + '" data-drag-item="' + i.id + '" data-drag-section="' + s.id + '">' + labels[i.type] + '</button>'; }).join('');
      return '<div class="mvl-tree-section ' + (state.selected === s.id ? 'is-selected' : '') + '" data-id="' + s.id + '"><button draggable="true" data-select="' + s.id + '" data-drag-section-handle="' + s.id + '">Sección ' + (si + 1) + '</button>' + items + '</div>';
    }).join('') || '<p class="mvl-empty">Añade una sección para empezar.</p>';
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
        markDirty();
      });
    });

    container.querySelectorAll('[data-resp]:not([data-resp-side])').forEach(function (el) {
      el.addEventListener('input', function () {
        var item = selectedItem();
        if (!item) return;
        var device = state.device || 'desktop';
        item.settings[el.dataset.resp][device] = el.value;
        markDirty();
      });
    });

    container.querySelectorAll('[data-resp-side]').forEach(function (el) {
      el.addEventListener('input', function () {
        var item = selectedItem();
        if (!item) return;
        var device = state.device || 'desktop';
        var resp = item.settings[el.dataset.resp];
        var target = respEnsureOverride(resp, device);
        target[el.dataset.respSide] = Number(el.value) || 0;
        markDirty();
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
        markDirty();
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
        markDirty();
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
    var dragging = null;
    container.querySelectorAll('[data-drag-section-handle]').forEach(function (handle) {
      handle.addEventListener('dragstart', function (e) { dragging = { type: 'section', id: handle.dataset.dragSectionHandle }; e.dataTransfer.effectAllowed = 'move'; });
    });
    container.querySelectorAll('[data-drag-item]').forEach(function (handle) {
      handle.addEventListener('dragstart', function (e) { e.stopPropagation(); dragging = { type: 'item', id: handle.dataset.dragItem, sectionId: handle.dataset.dragSection }; e.dataTransfer.effectAllowed = 'move'; });
    });
    container.querySelectorAll('.mvl-tree-section').forEach(function (row) {
      row.addEventListener('dragover', function (e) { e.preventDefault(); });
      row.addEventListener('drop', function (e) {
        e.preventDefault();
        if (!dragging) return;
        var targetSectionId = row.dataset.id;
        if (dragging.type === 'section' && dragging.id !== targetSectionId) moveSection(dragging.id, targetSectionId);
        dragging = null;
      });
    });
    container.querySelectorAll('.mvl-tree-item').forEach(function (row) {
      row.addEventListener('dragover', function (e) { e.preventDefault(); e.stopPropagation(); });
      row.addEventListener('drop', function (e) {
        e.preventDefault(); e.stopPropagation();
        if (!dragging || dragging.type !== 'item') return;
        var targetSectionId = row.dataset.dragSection, targetItemId = row.dataset.dragItem;
        if (dragging.sectionId === targetSectionId && dragging.id !== targetItemId) moveItem(targetSectionId, dragging.id, targetItemId);
        dragging = null;
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
      };
    });
    refs.devices.forEach(function (b) { b.onclick = function () { state.device = b.dataset.device; update(); }; });
  }

  function update() {
    refs.shell.classList.toggle('is-left-collapsed', state.leftCollapsed);
    refs.status.textContent = state.dirty ? 'Cambios sin guardar' : 'Guardado';
    refs.toggleStructureBtn.classList.toggle('is-active', state.showStructure);
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

    refreshPreview();
  }

  function autop(text) {
    return (text || '').split(/\n{2,}/).map(function (p) { return p.trim(); }).filter(Boolean).map(function (p) { return '<p>' + esc(p).replace(/\n/g, '<br>') + '</p>'; }).join('');
  }

  function paddingCss(p) { return (p.top | 0) + 'px ' + (p.right | 0) + 'px ' + (p.bottom | 0) + 'px ' + (p.left | 0) + 'px'; }

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

  function styleBlock(selector, settings) {
    var base = selector + '{' + backgroundCss(settings.background.desktop) + 'padding:' + paddingCss(settings.padding.desktop) + '!important;margin:' + paddingCss(settings.margin.desktop) + '!important;}';
    var tablet = '', mobile = '';
    ['tablet', 'mobile'].forEach(function (device) {
      var bg = settings.background[device], pad = settings.padding[device], mar = settings.margin[device];
      if (bg == null && pad == null && mar == null) return;
      var decl = '';
      if (bg != null) decl += backgroundCss(bg);
      if (pad != null) decl += 'padding:' + paddingCss(pad) + '!important;';
      if (mar != null) decl += 'margin:' + paddingCss(mar) + '!important;';
      if (!decl) return;
      var rule = selector + '{' + decl + '}';
      if (device === 'tablet') tablet += rule; else mobile += rule;
    });
    return { base: base, tablet: tablet, mobile: mobile };
  }

  function buildResponsiveCss(layout) {
    var base = '', tablet = '', mobile = '';
    layout.forEach(function (section) {
      var uid = section.id;
      var sr = styleBlock('[data-mvl-uid="' + uid + '"]', section.settings);
      base += sr.base; tablet += sr.tablet; mobile += sr.mobile;
      base += '[data-mvl-uid="' + uid + '"] > .mvl-container{text-align:' + section.settings.textAlign.desktop + '}';
      if (section.settings.textAlign.tablet != null) tablet += '[data-mvl-uid="' + uid + '"] > .mvl-container{text-align:' + section.settings.textAlign.tablet + '}';
      if (section.settings.textAlign.mobile != null) mobile += '[data-mvl-uid="' + uid + '"] > .mvl-container{text-align:' + section.settings.textAlign.mobile + '}';
      section.children.forEach(function (item) {
        var ir = styleBlock('[data-mvl-uid="' + item.id + '"]', item.settings);
        base += ir.base; tablet += ir.tablet; mobile += ir.mobile;
      });
    });
    var css = base;
    if (tablet) css += '@media (max-width:1024px){' + tablet + '}';
    if (mobile) css += '@media (max-width:767px){' + mobile + '}';
    return css;
  }

  function renderLayoutHtml(layout) {
    return layout.map(function (section) {
      var hasVideo = section.settings.background.desktop.type === 'video' && section.settings.background.desktop.video.url;
      var inner = section.children.map(function (item) {
        var attr = ' data-mvl-uid="' + item.id + '"';
        var itemHasVideo = item.settings.background.desktop.type === 'video' && item.settings.background.desktop.video.url;
        var content = '';
        if (item.type === 'heading') { var tag = 'h' + (item.data.level || 2); content = '<' + tag + ' class="mvl-heading">' + esc(item.data.text) + '</' + tag + '>'; }
        if (item.type === 'text') content = '<div class="mvl-text">' + autop(item.data.text) + '</div>';
        if (item.type === 'button') content = '<p><a class="mvl-button" href="' + escAttr(item.data.url || '#') + '">' + esc(item.data.text) + '</a></p>';
        if (item.type === 'image' && item.data.url) content = '<img class="mvl-image" src="' + escAttr(item.data.url) + '" alt="' + escAttr(item.data.alt) + '">';
        var videoHtml = itemHasVideo ? '<div class="mvl-bg-video"><video autoplay muted loop playsinline src="' + escAttr(item.settings.background.desktop.video.url) + '"></video></div>' : '';
        return '<div class="mvl-item mvl-item-' + item.type + ' mvl-bg-host' + (itemHasVideo ? ' mvl-has-video-bg' : '') + '"' + attr + '>' + videoHtml + content + '</div>';
      }).join('');
      var sectionVideo = hasVideo ? '<div class="mvl-bg-video"><video autoplay muted loop playsinline src="' + escAttr(section.settings.background.desktop.video.url) + '"></video></div>' : '';
      return '<section class="mvl-section mvl-bg-host' + (hasVideo ? ' mvl-has-video-bg' : '') + '" data-mvl-uid="' + section.id + '">' + sectionVideo + '<div class="mvl-container" style="max-width:1140px;margin:0 auto">' + inner + '</div></section>';
    }).join('');
  }

  function ensureSelectionStyle(doc) {
    if (doc.getElementById('mvl-live-style')) return;
    var style = doc.createElement('style');
    style.id = 'mvl-live-style';
    style.textContent = '[data-mvl-uid]{cursor:pointer}.mvl-is-selected{outline:2px solid #2271b1!important;outline-offset:-2px}';
    doc.head.appendChild(style);
  }

  function updateResponsiveStyle(doc) {
    var style = doc.getElementById('mvl-responsive-style');
    if (!style) { style = doc.createElement('style'); style.id = 'mvl-responsive-style'; doc.head.appendChild(style); }
    style.textContent = buildResponsiveCss(state.layout);
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

  function save() {
    fetch(MVL.restUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': MVL.nonce }, body: JSON.stringify({ layout: state.layout }) })
      .then(function (r) { if (!r.ok) throw new Error('No se pudo guardar'); return r.json(); })
      .then(function (data) { state.layout = data.layout; state.dirty = false; update(); })
      .catch(function () { alert('No se han podido guardar los cambios.'); });
  }

  window.addEventListener('message', function (event) {
    if (event.origin !== location.origin || !event.data || event.data.type !== 'mvl-select') return;
    state.selected = event.data.id;
    state.tab = 'content';
    update();
  });

  buildSkeleton();
  update();
}());
