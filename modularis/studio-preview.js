import { MODELS, X7_OPTIONS, defaultConfig, normalizeConfig } from './config.js';
import { icon } from './icon.js';
import { shots } from './photos.js';
import { formatEuro, getEstimate } from './pricing.js';
import { createViewer } from './viewer-real.js';

const cutawayLayers = {
  underfloorHeating: { tab: 'Pardoseală', description: 'Zona portocalie arată încălzirea electrică de sub pardoseală.' },
  tripleGlazing: { tab: 'Geam triplu', description: 'Cele trei foi de sticlă sunt distanțate pentru a le vedea separat.' },
  underbodyInsulation: { tab: 'Izolație', description: 'Stratul verde este coborât pentru a vedea poziția izolației sub podea.' }
};
const assetURL = file => new URL('./assets/' + file + '.webp', import.meta.url).href;
const cameras = [
  ['3d', 'Perspectivă'], ['front', 'Față'], ['right', 'Lateral dreapta'],
  ['back', 'Spate'], ['left', 'Lateral stânga'], ['top', 'De sus']
];
const conceptImage = model => ({
  file: 'studio-' + model,
  label: MODELS[model].name,
  detail: 'Imagine de prezentare',
  alt: 'Vedere exterioară a modelului ' + MODELS[model].name + '.'
});

function action(name, label, glyph, text = '') {
  return '<button type="button" data-preview="' + name + '" aria-label="' + label +
    '" title="' + label + '">' + icon(glyph, 18) + (text ? '<span>' + text + '</span>' : '') + '</button>';
}

/**
 * Mount inside an empty #preview-root. No additional page markup is required.
 * update(config) selects the model and reflects changes. Editing visual finishes
 * opens the live model. photo(index?), threeD(view?), expand(), prev() and next()
 * are also available to the surrounding studio. Expansion uses one dialog and
 * moves the existing stage into it, retaining the image, camera and selection.
 */
export function mountStudioPreview(root, { initialConfig, onModeChange, onWallSelect, onViewChange, onSummary, onToggleLayer, onLayerChange } = {}) {
  const stage = document.createElement('section');
  stage.className = 'preview-stage';
  stage.setAttribute('aria-label', 'Previzualizarea casei');
  stage.innerHTML = `
    <img class="preview-image" draggable="false" fetchpriority="high" alt="">
    <canvas class="preview-canvas" tabindex="0" hidden></canvas>
    <div class="preview-top">
      <div class="preview-switch" role="group" aria-label="Mod de vizualizare">
        ${action('3d', 'Vizualizare 3D', 'cube', 'Model 3D')}
        ${action('photo', 'Imagini de prezentare', 'webcam', 'Fotografii')}
        ${action('cutaway', 'Sub finisaje', 'layers', 'Sub finisaje')}
      </div>
      <div class="preview-expand">${action('expand', 'Extinde previzualizarea', 'expand')}</div>
    </div>
    <div class="cutaway-layers" role="group" aria-label="Straturi și dotări X7" hidden>
      ${Object.entries(cutawayLayers).map(([key, layer]) =>
        '<button type="button" data-layer="' + key + '" aria-pressed="false">' + layer.tab + '</button>'
      ).join('')}
      <button type="button" class="cutaway-config" data-preview="toggle-layer"></button>
    </div>
    <div class="preview-bottom">
      <div class="preview-caption" aria-live="polite"><small class="cutaway-schematic" hidden>Schemă orientativă</small><strong class="preview-title"></strong><span class="preview-detail"></span></div>
      <div class="preview-nav" role="group" aria-label="Schimbă vederea">
        ${action('prev', 'Vederea precedentă', 'chevron')}
        <span class="preview-count"></span>
        ${action('next', 'Vederea următoare', 'chevron')}
      </div>
    </div>
    <button type="button" data-preview="summary" class="preview-summary">
      <span class="preview-model"></span><span class="preview-price"></span>
      <span class="preview-tax">+ TVA</span>${icon('chevron', 16)}
    </button>
    <div class="preview-tools" role="group" aria-label="Instrumente 3D" hidden>
      ${action('zoom-out', 'Micșorează', 'minus')}${action('zoom-in', 'Mărește', 'plus')}
      ${action('measure', 'Cote de gabarit', 'ruler')}${action('reset-camera', 'Restabilește perspectiva', 'reset')}
    </div>`;
  const dialog = document.createElement('dialog');
  dialog.className = 'preview-gallery-dialog';
  dialog.setAttribute('aria-label', 'Previzualizare extinsă');
  root.replaceChildren(stage, dialog);

  const elem = selector => stage.querySelector(selector);
  const button = key => elem('[data-preview="' + key + '"]');
  const image = elem('.preview-image');
  const canvas = elem('.preview-canvas');
  const title = elem('.preview-title');
  const detail = elem('.preview-detail');
  const count = elem('.preview-count');
  const nav = elem('.preview-nav');
  const tools = elem('.preview-tools');
  const layers = elem('.cutaway-layers');
  const schematic = elem('.cutaway-schematic');
  const layerButtons = Array.from(layers.querySelectorAll('[data-layer]'));
  const summary = elem('.preview-summary');
  const summaryModel = elem('.preview-model');
  const summaryPrice = elem('.preview-price');
  const zoomToggle = button('expand');
  button('prev').querySelector('svg').style.transform = 'rotate(180deg)';
  canvas.setAttribute('title', 'Trage pentru a roti. Folosește rotița sau butoanele pentru zoom.');

  let config = initialConfig || defaultConfig();
  let hasConfig = false;
  let visualKey = '';
  let mode = '3d';
  let activeLayer = 'underfloorHeating';
  let gallery = shots;
  let index = 0;
  let angle = 0;
  let viewer;
  let viewerModel;
  let measured = false;
  let touch = null;
  let focusBeforeExpand;

  function drawCaption() {
    if (mode === 'cutaway') {
      const selected = config.extras.includes(activeLayer);
      const option = X7_OPTIONS[activeLayer];
      const verb = selected ? 'Elimină' : 'Adaugă';
      const price = formatEuro(option.price);
      const toggle = button('toggle-layer');
      toggle.textContent = verb + ' · ' + (selected ? '−' : '+') + price;
      toggle.setAttribute('aria-label', verb + ' ' + option.label + ', ' + price);
      toggle.dataset.selected = String(selected);
      for (const control of layerButtons) control.setAttribute('aria-pressed', String(control.dataset.layer === activeLayer));
      title.textContent = option.label;
      detail.textContent = cutawayLayers[activeLayer].description;
      nav.hidden = true;
      return;
    }
    const isPhoto = mode === 'photo';
    const shot = gallery[index];
    title.textContent = isPhoto ? shot.label : MODELS[config.model].name + ' · ' + cameras[angle][1];
    detail.textContent = isPhoto && config.model === 'x7' ? 'Fotografie reală · configurație de prezentare'
      : isPhoto ? shot.detail : 'Trage pentru a roti modelul.';
    const total = isPhoto ? gallery.length : cameras.length;
    count.textContent = (1 + (isPhoto ? index : angle)) + ' / ' + total;
    nav.hidden = total <= 1;
  }
  function drawPhoto() {
    const shot = gallery[index];
    const src = assetURL(shot.file);
    if (image.src !== src) image.src = src;
    image.alt = shot.alt;
    image.dataset.shot = shot.file;
  }
  function setMode(value) {
    const changed = mode !== value;
    mode = value;
    const isPhoto = value === 'photo';
    const isCutaway = value === 'cutaway';
    stage.dataset.mode = value;
    button('3d').setAttribute('aria-pressed', String(value === '3d'));
    button('cutaway').setAttribute('aria-pressed', String(isCutaway));
    layers.hidden = !isCutaway;
    schematic.hidden = !isCutaway;
    button('measure').hidden = isCutaway;
    canvas.setAttribute('aria-label', isCutaway
      ? 'Capsula X7 în secțiune · ' + X7_OPTIONS[activeLayer].label + '. Folosește săgețile pentru a roti modelul.'
      : 'Model 3D interactiv · ' + MODELS[config.model].name);
    button('photo').setAttribute('aria-pressed', String(isPhoto));
    image.hidden = !isPhoto;
    canvas.hidden = isPhoto;
    tools.hidden = isPhoto;
    if (isPhoto) {
      drawPhoto();
    } else {
      viewer ??= createViewer(canvas, {
        onWallSelect,
        onViewChange: name => {
          // The viewer reports both lateral cameras as "side".
          if (name !== 'side') angle = Math.max(0, cameras.findIndex(([key]) => key === name));
          drawCaption();
          onViewChange?.(name);
        }
      });
      viewer.update(config, isCutaway ? activeLayer : null);
      if (viewerModel && viewerModel !== config.model) viewer.reset();
      viewerModel = config.model;
    }
    drawCaption();
    if (changed) onModeChange?.(value);
  }
  function cutaway(layer = activeLayer) {
    if (config.model !== 'x7' || !Object.hasOwn(cutawayLayers, layer)) return;
    const changedLayer = mode !== 'cutaway' || activeLayer !== layer;
    activeLayer = layer;
    setMode('cutaway');
    if (changedLayer) onLayerChange?.(layer);
  }
  function photo(at) {
    if (Number.isInteger(at)) index = ((at % gallery.length) + gallery.length) % gallery.length;
    setMode('photo');
  }
  function threeD(view) {
    setMode('3d');
    if (view === 'side') view = 'right';
    const selected = cameras.findIndex(([key]) => key === view);
    if (selected >= 0) {
      angle = selected;
      viewer.setView(view);
      drawCaption();
    }
  }
  function move(delta) {
    if (mode === 'photo') photo(index + delta);
    else threeD(cameras[(angle + delta + cameras.length) % cameras.length][0]);
  }
  function update(next) {
    const incoming = normalizeConfig(next);
    const changedModel = !hasConfig || incoming.model !== config.model;
    const newVisualKey = JSON.stringify([incoming.walls, incoming.openings, incoming.roof, incoming.interior]);
    const changedFinish = hasConfig && !changedModel && newVisualKey !== visualKey;
    config = incoming;
    summaryModel.textContent = MODELS[config.model].name;
    summaryPrice.textContent = formatEuro(getEstimate(config).total);
    summary.setAttribute('aria-label', 'Detalii preț · ' + summaryModel.textContent + ', ' + summaryPrice.textContent + ' + TVA');
    visualKey = newVisualKey;
    hasConfig = true;
    if (changedModel) {
      index = 0;
      angle = 0;
      gallery = config.model === 'x7' ? shots : [conceptImage(config.model)];
      const imageMode = config.model === 'x7' ? 'Fotografii' : 'Imagine';
      button('photo').querySelector('span').textContent = imageMode;
      button('photo').setAttribute('aria-label', imageMode + ' · ' + MODELS[config.model].name);
      stage.dataset.model = config.model;
      canvas.setAttribute('aria-label', 'Model 3D interactiv · ' + MODELS[config.model].name);
      button('cutaway').hidden = config.model !== 'x7';
      setMode(mode === 'cutaway' && config.model !== 'x7' ? '3d' : mode);
    } else {
      setMode(changedFinish ? '3d' : mode);
    }
  }
  function expand() {
    if (dialog.open) {
      dialog.close();
      return;
    }
    focusBeforeExpand = document.activeElement;
    dialog.append(stage);
    dialog.showModal();
    zoomToggle.title = 'Închide previzualizarea extinsă';
    zoomToggle.setAttribute('aria-label', zoomToggle.title);
    zoomToggle.setAttribute('aria-expanded', 'true');
    zoomToggle.innerHTML = icon('shrink', 18);
    zoomToggle.focus({ preventScroll: true });
  }
  zoomToggle.setAttribute('aria-expanded', 'false');
  dialog.addEventListener('close', () => {
    root.insertBefore(stage, dialog);
    zoomToggle.title = 'Extinde previzualizarea';
    zoomToggle.setAttribute('aria-label', zoomToggle.title);
    zoomToggle.setAttribute('aria-expanded', 'false');
    zoomToggle.innerHTML = icon('expand', 18);
    (focusBeforeExpand?.isConnected ? focusBeforeExpand : zoomToggle).focus({ preventScroll: true });
  });
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });
  function reset() {
    angle = 0;
    index = 0;
    measured = false;
    button('measure').setAttribute('aria-pressed', 'false');
    viewer?.setDimensions(false);
    viewer?.reset();
    setMode(mode);
  }
  button('measure').setAttribute('aria-pressed', 'false');
  const actions = {
    photo: () => photo(), '3d': () => threeD(), cutaway: () => cutaway(), expand,
    'toggle-layer': () => { if (mode === 'cutaway') onToggleLayer?.(activeLayer); },
    prev: () => move(-1), next: () => move(1),
    summary: () => {
      if (dialog.open) dialog.close();
      if (onSummary) onSummary();
      else root.dispatchEvent(new CustomEvent('preview-summary', { bubbles: true }));
    },
    'zoom-in': () => viewer?.zoom(1.17), 'zoom-out': () => viewer?.zoom(1 / 1.17),
    'reset-camera': () => { viewer?.reset(); angle = 0; drawCaption(); },
    measure: () => {
      measured = !measured;
      viewer?.setDimensions(measured);
      button('measure').setAttribute('aria-pressed', String(measured));
    }
  };
  stage.addEventListener('click', event => {
    const layer = event.target.closest('[data-layer]')?.dataset.layer;
    if (layer) { cutaway(layer); return; }
    const command = event.target.closest('[data-preview]')?.dataset.preview;
    if (Object.hasOwn(actions, command)) actions[command]();
  });
  stage.addEventListener('keydown', event => {
    if (mode !== 'photo' || event.altKey || event.ctrlKey || event.metaKey || gallery.length < 2) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      move(event.key === 'ArrowRight' ? 1 : -1);
    }
  });
  image.addEventListener('click', () => { if (!dialog.open) expand(); });
  image.addEventListener('touchstart', event => {
    touch = event.touches.length === 1 ? event.touches[0] : null;
  }, { passive: true });
  image.addEventListener('touchend', event => {
    if (!touch || !event.changedTouches.length) return;
    const dx = event.changedTouches[0].clientX - touch.clientX;
    const dy = event.changedTouches[0].clientY - touch.clientY;
    touch = null;
    if (gallery.length > 1 && Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      event.preventDefault();
      move(dx < 0 ? 1 : -1);
    }
  }, { passive: false });
  image.addEventListener('touchcancel', () => { touch = null; });

  update(config);
  // The first call from the host may restore a custom finish from a shared link.
  // Treat that as initial data, not as an edit made during this visit.
  hasConfig = false;
  return {
    update, photo, threeD, cutaway, expand, reset,
    getLayer: () => mode === 'cutaway' ? activeLayer : null,
    prev: actions.prev, next: actions.next, getMode: () => mode,
    getImage() {
      const shot = gallery[index];
      if (mode === 'photo') return { src: assetURL(shot.file), filename: config.model + '-' + shot.file + '.webp', alt: shot.alt };
      return { src: canvas.toDataURL('image/png'), filename: mode === 'cutaway' ? 'x7-sectiune-' + activeLayer + '.png' : config.model + '-3d.png', alt: canvas.getAttribute('aria-label') };
    },
    destroy() { viewer?.destroy(); root.replaceChildren(); }
  };
}
