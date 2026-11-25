import { MODELS, createModelConfig, normalizeConfig, formatNumber } from './config.js';
import { PRICE_BOOK, formatEuro } from './pricing.js';
import { icon } from './icon.js';
import { mountQuote } from './quote.js';
import { showBundles } from './bundles.js';
import { showModelComparison } from './model-comparison.js';
import { mountStudioPreview } from './studio-preview.js';
import { mountConfigurator } from './studio-configurator.js';

const select = selector => document.querySelector(selector);
const storeKey = 'modularis.config.v1';
const modal = select('#information');
const menu = select('#navigation');
const menuButton = select('.ms-menu-button');
const notice = select('#project-notice');
const menuActions = Array.from(menu.querySelectorAll('button,a'));
const urlModels = { x7: 'x7', 'space-capsule': 'x7', compact: 'compact', family: 'family', 'modul-32': 'compact', 'modul-48': 'family' };
const layerSlugs = { underfloorHeating: 'pardoseala', tripleGlazing: 'geam', underbodyInsulation: 'izolatie' };
let applyingLocation = true;
let toastTimer;
let form;

function reportNotice(message = '') {
  notice.textContent = message;
  notice.hidden = !message;
}
function enterConfig(raw) {
  if (!raw || typeof raw !== 'object') return createModelConfig();
  if (!Object.hasOwn(MODELS, raw.model)) {
    reportNotice('Modelul din proiectul anterior nu mai face parte din selecție. Poți alege unul dintre cele trei modele disponibile.');
    return createModelConfig();
  }
  const next = normalizeConfig(raw);
  if (raw.model === 'x7' && Array.isArray(raw.extras) && raw.extras.some(id => !next.extras.includes(id))) {
    reportNotice('Oferta X7 s-a actualizat. Verifică accesoriile disponibile și totalul înainte de a cere oferta.');
  }
  return next;
}
function getStartingConfig() {
  reportNotice();
  const url = new URL(location.href);
  const hash = url.hash;
  if (hash.startsWith('#proiect=')) {
    try { return enterConfig(JSON.parse(atob(decodeURIComponent(hash.slice(9))))); }
    catch { reportNotice('Linkul configurației este incomplet. Poți începe un proiect nou.'); return createModelConfig(); }
  }
  const model = hash.startsWith('#model=') ? hash.slice(7) : url.searchParams.get('modele') || url.searchParams.get('model');
  if (model) return enterConfig({model: Object.hasOwn(urlModels, model) ? urlModels[model] : model});
  try { return enterConfig(JSON.parse(localStorage.getItem(storeKey))); }
  catch { return createModelConfig(); }
}
const config = getStartingConfig();
const layoutButtons = [...document.querySelectorAll('[data-layout]')];
const layoutPreference = 'modularis.layout.v1';
function initialLayout() {
  const requested = new URL(location.href).searchParams.get('vedere');
  if (['panorama', 'sus'].includes(requested)) return requested;
  try {
    const saved = localStorage.getItem(layoutPreference);
    if (['panorama', 'sus'].includes(saved)) return saved;
  } catch { /* Storage is optional. */ }
  return matchMedia('(max-width: 700px)').matches ? 'sus' : 'panorama';
}
function showLayout(value) {
  document.documentElement.dataset.layout = value;
  for (const button of layoutButtons) button.setAttribute('aria-pressed', String(button.dataset.layout === value));
}
showLayout(initialLayout());
for (const button of layoutButtons) button.addEventListener('click', () => {
  const value = button.dataset.layout;
  showLayout(value);
  const url = new URL(location.href);
  url.searchParams.set('vedere', value);
  history.replaceState(history.state, '', url);
  try { localStorage.setItem(layoutPreference, value); } catch { /* Storage is optional. */ }
});
for (const el of document.querySelectorAll('[data-icon]')) el.innerHTML = icon(el.dataset.icon, el.dataset.icon === 'brand' ? 31 : 22);

function setLayerInLocation(layer) {
  if (applyingLocation) return;
  const url = new URL(location.href);
  const slug = layerSlugs[layer];
  if (slug) url.searchParams.set('strat', slug);
  else url.searchParams.delete('strat');
  if (url.href !== location.href) history.replaceState(history.state, '', url);
}

const preview = mountStudioPreview(select('#preview-root'), {
  initialConfig: config,
  onSummary: () => form?.openSection('summary'),
  onWallSelect: side => form?.selectWall(side),
  onToggleLayer: id => Object.hasOwn(layerSlugs, id) && form?.toggleExtra(id),
  onModeChange: mode => { if (mode !== 'cutaway') setLayerInLocation(null); },
  onLayerChange: setLayerInLocation
});

const quote = mountQuote({getConfig: () => config, getModel: () => MODELS[config.model]});
function revealPreview(mode) {
  if (mode === '3d') preview.threeD();
  else preview.photo();
  if (matchMedia('(max-width: 860px)').matches) preview.expand();
}
function changed(next, selection) {
  if (next !== config) Object.assign(config, next);
  try { localStorage.setItem(storeKey, JSON.stringify(config)); } catch { /* Storage is optional. */ }
  const url = new URL(location.href);
  if (url.hash.startsWith('#proiect=') || url.hash.startsWith('#model=') || url.searchParams.has('modele') || url.searchParams.has('model')) {
    url.hash = ''; url.searchParams.delete('modele'); url.searchParams.delete('model'); history.replaceState(null, '', url);
  }
  reportNotice();
  const previousLayer = preview.getLayer();
  preview.update(config);
  if (selection && Object.hasOwn(layerSlugs, selection.extra) && (selection.selected || previousLayer)) {
    preview.cutaway(selection.extra);
  }
}

function restorePreviewFromLocation() {
  applyingLocation = true;
  const slug = new URL(location.href).searchParams.get('strat');
  const layer = Object.keys(layerSlugs).find(key => layerSlugs[key] === slug);
  try {
    preview.update(config);
    if (config.model === 'x7' && layer) preview.cutaway(layer);
    else if (preview.getMode() === 'cutaway') preview.threeD();
  } finally {
    applyingLocation = false;
  }
  setLayerInLocation(preview.getLayer());
}

form = mountConfigurator({container: select('#configurator-form'), config, onChange: changed, openQuote: () => quote.open(), openPhotos: () => revealPreview('photo'), openPreview: () => revealPreview('3d'), onWallView: side => preview.threeD(side)});
restorePreviewFromLocation();

function setMenu(open) {
  menu.hidden = !open;
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Închide meniul' : 'Deschide meniul');
}
function showDialog(html) {
  const content = select('#dialog-content');
  content.innerHTML = html;
  content.querySelector('h2').id = 'info-heading';
  if (!modal.open) modal.showModal();
}
function pickModel(id) {
  modal.close();
  form.selectModel(id);
  form.openSection('model');
}
function showModels() {
  const cards = Object.entries(MODELS).map(([id, model]) => {
    const file = id === 'x7' ? 'exterior-evening' : 'studio-' + id;
    const caption = id === 'x7' ? 'Casă capsulă' : 'Casă modulară · concept';
    return `<button type="button" class="model-pick" data-pick="${id}"><img src="./assets/${file}.webp" alt=""><span><small>${caption}</small><strong>${model.name}</strong><span>${formatNumber(model.area)} m² · ${formatEuro(PRICE_BOOK.base[id])} + TVA</span></span></button>`;
  }).join('');
  showDialog(`<h2>Modelele noastre</h2><div class="model-index">${cards}</div><button type="button" class="text-command" data-command="compare">Compară două modele</button>`);
}
function applyConfig(next) {
  modal.close();
  Object.assign(config, next);
  form.refresh();
  changed(config);
}
function exportImage() {
  const image = preview.getImage();
  const anchor = document.createElement('a');
  anchor.href = image.src;
  anchor.download = image.filename;
  anchor.click();
}
function toast(message) {
  const el = select('#toast');
  el.textContent = message; el.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; }, 3400);
}
async function share() {
  const url = new URL(location.pathname, location.origin);
  url.searchParams.set('vedere', document.documentElement.dataset.layout);
  const layer = preview.getLayer();
  if (layer && config.model === 'x7') url.searchParams.set('strat', layerSlugs[layer]);
  url.hash = 'proiect=' + encodeURIComponent(btoa(JSON.stringify(config)));
  try { await navigator.clipboard.writeText(url.href); toast('Linkul configurației a fost copiat.'); }
  catch {
    showDialog('<h2>Linkul configurației</h2><label class="share-label">Copiază linkul pentru a redeschide aceleași opțiuni.<input id="share-url" readonly></label>');
    select('#share-url').value = url.href; select('#share-url').select();
  }
}
const commands = {
  models: showModels, quote: () => quote.open(), share, image: exportImage,
  bundles: () => showBundles(config, showDialog, next => { applyConfig(next); form.openSection('equipment'); }),
  reset: () => showDialog('<h2>Reiei configurația?</h2><p>Modelul ales va reveni la dotările și finisajele standard.</p><div class="confirm-actions"><button type="button" data-command="close">Păstrează selecția</button><button type="button" data-command="confirmReset">Reia configurația</button></div>'),
  confirmReset: () => { applyConfig(createModelConfig(config.model)); preview.reset(); preview.threeD(); form.openSection('model'); },
  compare: () => showModelComparison(config, showDialog, pickModel),
  summary: () => form.openSection('summary'), close: () => modal.close(),
};
document.addEventListener('click', event => {
  const control = event.target.closest('[data-command], [data-pick]');
  if (control?.dataset.command === 'menu') { setMenu(menu.hidden); return; }
  if (!menu.hidden && (!menu.contains(event.target) || event.target.closest('button,a'))) setMenu(false);
  if (!control) return;
  event.preventDefault();
  if (control.dataset.pick) pickModel(control.dataset.pick);
  else commands[control.dataset.command]?.();
});
menuButton.addEventListener('keydown', event => {
  if (event.key === 'ArrowDown') { event.preventDefault(); setMenu(true); menuActions[0].focus(); }
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !menu.hidden) { setMenu(false); menuButton.focus(); }
});
document.addEventListener('focusin', event => {
  if (!menu.hidden && !menu.contains(event.target) && event.target !== menuButton) setMenu(false);
});
modal.addEventListener('click', event => { if (event.target === modal) modal.close(); });
window.addEventListener('hashchange', () => {
  if (location.hash === '#modele') return showModels();
  if (!location.hash.startsWith('#model=') && !location.hash.startsWith('#proiect=')) return;
  if (modal.open) modal.close();
  Object.assign(config, getStartingConfig());
  form.refresh();
  restorePreviewFromLocation();
});
if (location.hash === '#modele' || location.hash === '#showroom') showModels();
