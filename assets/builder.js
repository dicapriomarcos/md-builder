(function () {
  'use strict';
  var state = { layout: MVL.layout || [], selected: null, dirty: false, leftCollapsed: false, showStructure: false, device: 'desktop' };
  var root = document.getElementById('mvl-builder');
  var labels = { section: 'Sección', heading: 'Título', text: 'Texto', button: 'Botón', image: 'Imagen' };
  var icons = { section: 'dashicons-align-wide', heading: 'dashicons-heading', text: 'dashicons-text-page', button: 'dashicons-button', image: 'dashicons-format-image' };
  var deviceLabels = { desktop: 'Escritorio', tablet: 'Tablet', mobile: 'Móvil' };
  var sideLabels = { top: 'Arriba', right: 'Derecha', bottom: 'Abajo', left: 'Izquierda' };
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

  function add(type) {
    if (type === 'section') {
      var section = { id: id(), type: 'section', settings: { background: respDefault('#ffffff'), textAlign: respDefault('left'), padding: respDefault({ top: 48, right: 24, bottom: 48, left: 24 }) }, children: [] };
      state.layout.push(section); state.selected = section.id;
    } else {
      var section = currentSection(); if (!section) { add('section'); section = currentSection(); }
      var data = type === 'heading' ? { text: 'Un título claro', level: 2 } : type === 'text' ? { text: 'Escribe aquí tu contenido.' } : type === 'button' ? { text: 'Saber más', url: '#' } : { url: '', alt: '' };
      var item = { id: id(), type: type, data: data }; section.children.push(item); state.selected = item.id;
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

  function inspector(item) {
    if (!item) return '<div class="mvl-empty">Selecciona un bloque para editarlo.</div>';
    var device = state.device || 'desktop';
    if (item.type === 'section') {
      var s = item.settings;
      var bg = respGet(s.background, device);
      var align = respGet(s.textAlign, device);
      var pad = respGet(s.padding, device);
      var html = '<div class="mvl-device-note">Editando para: <strong>' + deviceLabels[device] + '</strong></div>';
      html += '<label>Fondo' + resetButton('background', s.background, device) + '<input data-resp="background" type="color" value="' + escAttr(bg) + '"></label>';
      html += '<label>Alineación' + resetButton('textAlign', s.textAlign, device) + '<select data-resp="textAlign"><option value="left" ' + (align === 'left' ? 'selected' : '') + '>Izquierda</option><option value="center" ' + (align === 'center' ? 'selected' : '') + '>Centrada</option><option value="right" ' + (align === 'right' ? 'selected' : '') + '>Derecha</option></select></label>';
      html += '<label>Relleno (px)' + resetButton('padding', s.padding, device) + '</label>';
      html += '<div class="mvl-padding-grid">' + ['top', 'right', 'bottom', 'left'].map(function (side) {
        return '<label class="mvl-padding-side">' + sideLabels[side] + '<input data-resp="padding" data-resp-side="' + side + '" type="number" min="0" max="160" value="' + pad[side] + '"></label>';
      }).join('') + '</div>';
      return html;
    }
    var html = '<p class="mvl-type">' + labels[item.type] + '</p>';
    if (item.type === 'heading' || item.type === 'text' || item.type === 'button') html += '<label>Texto<textarea data-field="text">' + esc(item.data.text) + '</textarea></label>';
    if (item.type === 'heading') html += '<label>Nivel<select data-field="level">' + [1, 2, 3, 4, 5, 6].map(function (n) { return '<option ' + (item.data.level === n ? 'selected' : '') + ' value="' + n + '">H' + n + '</option>'; }).join('') + '</select></label>';
    if (item.type === 'button' || item.type === 'image') html += '<label>URL<input data-field="url" type="url" value="' + escAttr(item.data.url) + '"></label>';
    if (item.type === 'image') html += '<label>Texto alternativo<input data-field="alt" value="' + escAttr(item.data.alt) + '"></label>';
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

    container.querySelectorAll('[data-field]').forEach(function (el) {
      el.addEventListener('input', function () {
        var item = selectedItem();
        if (!item) return;
        item.data[el.dataset.field] = el.type === 'number' ? Number(el.value) : el.value;
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
        if (resp[device] == null) {
          var effective = respGet(resp, device);
          resp[device] = { top: effective.top, right: effective.right, bottom: effective.bottom, left: effective.left };
        }
        resp[device][el.dataset.respSide] = Number(el.value) || 0;
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

  function buildResponsiveCss(layout) {
    var base = '', tablet = '', mobile = '';
    layout.forEach(function (section) {
      var uid = section.id, s = section.settings;
      base += '[data-mvl-uid="' + uid + '"]{background:' + s.background.desktop + ';padding:' + paddingCss(s.padding.desktop) + '}';
      base += '[data-mvl-uid="' + uid + '"] > .mvl-container{text-align:' + s.textAlign.desktop + '}';
      if (s.background.tablet != null || s.padding.tablet != null) {
        tablet += '[data-mvl-uid="' + uid + '"]{' + (s.background.tablet != null ? 'background:' + s.background.tablet + ';' : '') + (s.padding.tablet != null ? 'padding:' + paddingCss(s.padding.tablet) + ';' : '') + '}';
      }
      if (s.textAlign.tablet != null) tablet += '[data-mvl-uid="' + uid + '"] > .mvl-container{text-align:' + s.textAlign.tablet + '}';
      if (s.background.mobile != null || s.padding.mobile != null) {
        mobile += '[data-mvl-uid="' + uid + '"]{' + (s.background.mobile != null ? 'background:' + s.background.mobile + ';' : '') + (s.padding.mobile != null ? 'padding:' + paddingCss(s.padding.mobile) + ';' : '') + '}';
      }
      if (s.textAlign.mobile != null) mobile += '[data-mvl-uid="' + uid + '"] > .mvl-container{text-align:' + s.textAlign.mobile + '}';
    });
    var css = base;
    if (tablet) css += '@media (max-width:1024px){' + tablet + '}';
    if (mobile) css += '@media (max-width:767px){' + mobile + '}';
    return css;
  }

  function renderLayoutHtml(layout) {
    return layout.map(function (section) {
      var inner = section.children.map(function (item) {
        var attr = ' data-mvl-uid="' + item.id + '"';
        if (item.type === 'heading') { var tag = 'h' + (item.data.level || 2); return '<' + tag + ' class="mvl-heading"' + attr + '>' + esc(item.data.text) + '</' + tag + '>'; }
        if (item.type === 'text') return '<div class="mvl-text"' + attr + '>' + autop(item.data.text) + '</div>';
        if (item.type === 'button') return '<p' + attr + '><a class="mvl-button" href="' + escAttr(item.data.url || '#') + '">' + esc(item.data.text) + '</a></p>';
        if (item.type === 'image' && item.data.url) return '<img class="mvl-image"' + attr + ' src="' + escAttr(item.data.url) + '" alt="' + escAttr(item.data.alt) + '">';
        return '';
      }).join('');
      return '<section class="mvl-section" data-mvl-uid="' + section.id + '"><div class="mvl-container" style="max-width:1140px;margin:0 auto">' + inner + '</div></section>';
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
    update();
  });

  buildSkeleton();
  update();
}());
