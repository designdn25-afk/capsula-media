import { MODELS, WALLS, createModelConfig, formatNumber } from './config.js';
import { EXTRA_LABELS, INTERIOR_LABELS, PRICE_BOOK, formatEuro, getEstimate, optionDelta } from './pricing.js';
import { whatsappUrl } from './commercial.js';
import { icon } from './icon.js';

const sides = { front: 'Față', right: 'Dreapta', back: 'Spate', left: 'Stânga' };
const materials = { wood: 'Lemn', metal: 'Metal', fiber: 'Fibrociment' };
const directions = { vertical: 'Vertical', horizontal: 'Orizontal' };
const roofStyles = { mono: 'Într-o apă', gable: 'În două ape' };
const roofMaterials = { metal: 'Tablă', shingle: 'Șindrilă' };
const openingTypes = { none: 'Liber', window: 'Fereastră', door: 'Ușă', slider: 'Ușă culisantă' };
const interiorTitles = { floor: 'Pardoseală', lights: 'Iluminat', glazing: 'Vitraj' };
const facadeColors = {
  '#b89269': 'Natur', '#caad89': 'Nisip', '#78563e': 'Nuc', '#39403d': 'Antracit',
  '#dad6c8': 'Ivoriu', '#525852': 'Gri mineral', '#1262cf': 'Cobalt', '#288b46': 'Verde'
};
const roofColors = {
  '#333638': 'Grafit', '#595e60': 'Gri zinc', '#8b8e87': 'Gri deschis',
  '#654c40': 'Brun', '#805b4c': 'Teracotă', '#d6d5ca': 'Alb cald'
};
const bodyColors = {
  '#e9eeed': 'Alb perlat', '#c1c6c7': 'Argintiu', '#333638': 'Grafit', '#15a3a5': 'Turcoaz', '#1262cf': 'Cobalt'
};
const frameColors = { '#273940': 'Antracit', '#c1c6c7': 'Argintiu', '#e9eeed': 'Alb perlat', '#333638': 'Grafit' };
const comfortExtras = ['curtains', 'bed', 'kitchen', 'projector'];
const climateExtras = ['underfloorHeating', 'pipeFrostProtection', 'tripleGlazing', 'underbodyInsulation', 'wallInsulation'];
const modelIds = ['x7', 'compact', 'family'];
const dimensions = model => [model.length, model.width].map(formatNumber).join(' × ') + ' m';
const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[character]);
const itemsOf = opening => opening.items ?? (opening.type === 'none' ? [] : Array(opening.count).fill(opening.type));
const field = (title, content) => '<fieldset class="mka-field"><legend>' + title + '</legend>' + content + '</fieldset>';
const row = (label, value) => '<div><dt>' + escapeHtml(label) + '</dt><dd>' + escapeHtml(value) + '</dd></div>';
const check = icon('check', 14);
const chevron = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
const difference = value => (value < 0 ? '−' : '+') + formatEuro(Math.abs(value));

function choice(action, value, label, selected, detail = '', price = '') {
  return '<button type="button" class="mka-option" data-action="' + action + '" data-value="' + escapeHtml(value) +
    '" aria-pressed="' + selected + '"><span class="mka-choice-main"><strong>' + escapeHtml(label) + '</strong>' +
    (detail ? '<small>' + escapeHtml(detail) + '</small>' : '') + '</span>' +
    (price ? '<span class="mka-choice-price">' + escapeHtml(price) + '</span>' : '') + '</button>';
}

function updateOption(config, key, value, scope) {
  if (key.startsWith('wall.')) {
    for (const side of scope === 'all' ? WALLS : [scope]) config.walls[side][key.slice(5)] = value;
    if (config.model === 'x7' && scope === 'all' && key === 'wall.color') config.roof.color = value;
  } else if (key.startsWith('roof.')) {
    config.roof[key.slice(5)] = key === 'roof.overhang' ? value === 'true' : value;
  } else if (key.startsWith('interior.')) {
    config.interior[key.slice(9)] = value;
  }
}

function activeValue(config, key, scope) {
  const [group, property] = key.split('.');
  if (group === 'wall') {
    if (scope !== 'all') return config.walls[scope][property];
    const first = config.walls.front[property];
    return WALLS.every(side => config.walls[side][property] === first) ? first : null;
  }
  return String(config[group][property]);
}

function selectedOptions(config, keys) {
  return keys.filter(key => config.extras.includes(key));
}

function extrasList(config, keys) {
  return '<div class="mka-extras">' + keys.filter(key => Object.hasOwn(PRICE_BOOK.extras, key)).map(key => {
    const active = config.extras.includes(key);
    return '<button class="mka-extra" type="button" aria-pressed="' + active + '" data-action="extra" data-value="' + key +
      '"><span class="mka-check" aria-hidden="true">' + (active ? check : '') + '</span><span class="mka-choice-main">' +
      escapeHtml(EXTRA_LABELS[key]) + '</span><span class="mka-choice-price">+' + formatEuro(PRICE_BOOK.extras[key]) + '</span></button>';
  }).join('') + '</div>';
}

export function mountConfigurator({ container = document.querySelector('#configurator-form'), config, onChange, openQuote, openPhotos, openPreview, onSelectionChange, onWallView }) {
  container.classList.add('mka-form');
  let expanded = 'model';
  const remembered = new Map();
  let wallScope = 'all';
  let openingScope = 'front';
  let lastModular = config.model === 'family' ? 'family' : 'compact';

  function options(key, labels, swatches = false) {
    const current = activeValue(config, key, wallScope);
    return '<div class="' + (swatches ? 'mka-swatches' : 'mka-options') + '">' + Object.entries(labels).map(([value, label]) => {
      const selected = current === value;
      const next = structuredClone(config);
      updateOption(next, key, value, wallScope);
      const delta = optionDelta(config, next);
      if (!swatches) return choice(key, value, label, selected, '', delta ? difference(delta) : '');
      const tooltip = label + (delta ? ' (' + difference(delta) + ')' : '');
      return '<button type="button" class="mka-swatch" data-action="' + key + '" data-value="' + value + '" aria-pressed="' + selected +
        '" aria-label="' + tooltip + '" title="' + tooltip + '"><span class="mka-swatch-dot" style="--swatch:' + value + '">' +
        (selected ? check : '') + '</span><span>' + label + '</span></button>';
    }).join('') + '</div>';
  }

  function scopes(key, current, all = false) {
    return '<div class="mka-options mka-scopes">' + Object.entries(all ? { all: 'Toate', ...sides } : sides)
      .map(([id, name]) => choice(key, id, name, id === current)).join('') + '</div>';
  }

  function accordion(id, title, selected, body) {
    const open = expanded === id;
    return '<section class="mka-accordion' + (open ? ' is-open' : '') + '" data-section="' + id + '">' +
      '<h2><button type="button" id="mka-toggle-' + id + '" class="mka-toggle" data-action="toggle" data-value="' + id +
      '" aria-expanded="' + open + '" aria-controls="mka-content-' + id + '"><span class="mka-section-title">' + title +
      '</span><span class="mka-current">' + escapeHtml(selected) + '</span><span class="mka-chevron">' + chevron +
      '</span></button></h2><div class="mka-content" id="mka-content-' + id + '"' + (open ? '' : ' hidden') + '>' + body + '</div></section>';
  }

  function simulationSections() {
    const body = options('wall.color', bodyColors, true) +
      '<p class="mka-note">Testează nuanțele în 3D. Disponibilitatea finisajelor se confirmă în ofertă.</p>';
    const details = field('Bordură exterioară', options('roof.trimColor', frameColors, true)) +
      field('Pardoseală', options('interior.floor', INTERIOR_LABELS.floor)) +
      field('Iluminat', options('interior.lights', INTERIOR_LABELS.lights));
    const color = activeValue(config, 'wall.color', 'all');
    return accordion('colors', 'Culoare exterioară', bodyColors[color] ?? 'Personalizată', body) +
      accordion('accents', 'Bordură și interior în 3D', frameColors[config.roof.trimColor] ?? 'Personalizată', details);
  }

  function modularSections() {
    const walls = field('Aplică modificările pe', scopes('wallScope', wallScope, true)) +
      field('Material', options('wall.material', materials)) + field('Montaj', options('wall.orientation', directions)) +
      field('Culoare', options('wall.color', facadeColors, true));
    const roof = field('Formă', options('roof.style', roofStyles)) + field('Învelitoare', options('roof.material', roofMaterials)) +
      field('Streașină', options('roof.overhang', { true: 'Cu streașină', false: 'Fără streașină' })) +
      field('Culoare acoperiș', options('roof.color', roofColors, true)) + field('Culoare bordură', options('roof.trimColor', roofColors, true));
    const openingItems = itemsOf(config.openings[openingScope]);
    const positionInputs = [0, 1, 2].slice(0, Math.min(3, openingItems.length + 1)).map(index =>
      '<label class="mka-opening-label">Poziția ' + (index + 1) + '<select class="mka-opening-select" data-slot="' + index + '">' +
      Object.entries(openingTypes).map(([id, label]) => '<option value="' + id + '"' + ((openingItems[index] ?? 'none') === id ? ' selected' : '') +
        '>' + label + '</option>').join('') + '</select></label>').join('');
    const openings = field('Fațadă', scopes('openingScope', openingScope)) + '<div class="mka-openings">' + positionInputs + '</div>';
    const openingCount = WALLS.reduce((sum, side) => sum + itemsOf(config.openings[side]).length, 0);
    const interior = Object.entries(interiorTitles).map(([key, title]) => field(title, options('interior.' + key, INTERIOR_LABELS[key]))).join('');
    const finishes = Object.entries(config.interior)
      .filter(([, value]) => value !== 'standard')
      .map(([key, value]) => INTERIOR_LABELS[key][value]);
    return accordion('walls', 'Fațadă exterioară', materials[activeValue(config, 'wall.material', 'all')] ?? 'Mixtă', walls) +
      accordion('roof', 'Acoperiș', roofStyles[config.roof.style], roof) +
      accordion('openings', 'Uși și ferestre', openingCount === 1 ? '1 deschidere' : openingCount + ' deschideri', openings) +
      accordion('interior', 'Finisaje interioare', finishes.length ? finishes.join(' · ') : 'Standard', interior);
  }

  function specifications() {
    if (config.model === 'x7') {
      const standards = ['Structură din oțel galvanizat și panouri din aluminiu',
        'Geam dublu LOW-E și pardoseală SPC', 'Două aparate Midea Inverter de 12.000 BTU',
        'Baie echipată, boiler și WC smart', 'Iluminat și control smart', 'Racorduri pregătite pentru bucătărie'];
      return '<ul class="mka-standard">' + standards.map(value => '<li>' + value + '</li>').join('') +
        '</ul>' + (openPhotos ? '<button class="mka-text-button" type="button" data-action="photos">Vezi fotografiile X7 ↗</button>' : '');
    }
    const standard = createModelConfig(config.model);
    return '<dl class="mka-summary">' + row('Fațadă de bază', materials[standard.walls.front.material] + ' · montaj vertical') +
      row('Acoperiș de bază', 'Tablă, într-o apă, cu streașină') + row('Deschideri de bază', '2 uși culisante în față și câte o fereastră pe celelalte fațade') +
      '</dl>' + (openPreview ? '<button class="mka-text-button" data-action="preview" type="button">Deschide vizualizarea 3D ↗</button>' : '');
  }

  function render() {
    const model = MODELS[config.model];
    const capsule = config.model === 'x7';
    const sizeIds = capsule ? ['x7'] : ['compact', 'family'];
    const modelChoices = choice('family', 'x7', 'Capsulă X7', capsule) + choice('family', 'modular', 'Casă modulară', !capsule);
    const sizes = sizeIds.map(id => {
      const item = MODELS[id];
      const caption = capsule ? formatNumber(item.area) + ' m²' : item.name + ' · ' + formatNumber(item.area) + ' m²';
      return choice('size', id, caption, id === config.model, dimensions(item));
    }).join('');
    let html = accordion('model', 'Model', model.name, '<div class="mka-options mka-models">' + modelChoices + '</div>') +
      accordion('size', 'Dimensiune', formatNumber(model.area) + ' m²', '<div class="mka-options mka-sizes">' + sizes + '</div>');
    if (capsule) {
      const counts = keys => {
        const count = selectedOptions(config, keys).length;
        return count ? count + (count === 1 ? ' opțiune' : ' opțiuni') : 'Standard';
      };
      html += simulationSections() + accordion('equipment', 'Dotări interioare', counts(comfortExtras), extrasList(config, comfortExtras)) +
        accordion('insulation', 'Confort termic și izolație', counts(climateExtras), extrasList(config, climateExtras));
    } else {
      html += modularSections();
    }
    html += accordion('specifications', 'Dotări standard', 'Incluse', specifications());
    const estimate = getEstimate(config);
    const lines = row(model.name + ' · bază', formatEuro(estimate.base)) +
      estimate.lines.map(line => row(line.label, difference(line.amount))).join('');
    const total = '<div class="mka-total"><span>Total estimat</span><strong>' + formatEuro(estimate.total) + ' <small>+ TVA</small></strong></div>';
    const actions = '<div class="mka-actions"><button class="mka-quote" type="button" data-action="quote">Solicită ofertă</button>' +
      '<a class="mka-whatsapp" href="' + escapeHtml(whatsappUrl(config)) + '" target="_blank" rel="noopener noreferrer">' +
      icon('whatsapp', 17) + ' WhatsApp</a></div>';
    html += accordion('summary', 'Prețul configurației', formatEuro(estimate.total) + ' + TVA',
      '<dl class="mka-summary">' + lines + '</dl>' + total +
      '<p class="mka-note">Transportul, macaraua și montajul se calculează separat pentru amplasamentul tău.</p>' + actions);
    container.innerHTML = html;
  }

  function restoreFocus(selector) {
    container.querySelector(selector)?.focus({ preventScroll: true });
  }

  function openSection(id) {
    const section = [...container.querySelectorAll('[data-section]')].find(element => element.dataset.section === id);
    if (!section) return;
    expanded = id;
    render();
    const button = container.querySelector('#mka-toggle-' + id);
    button.focus({ preventScroll: true });
    button.scrollIntoView({ block: 'start', behavior: 'instant' });
    onSelectionChange?.(id, true);
  }

  function selectModel(id) {
    if (!modelIds.includes(id) || id === config.model) return false;
    const previous = config.model;
    remembered.set(previous, structuredClone(config));
    let next = remembered.get(id) ?? createModelConfig(id);
    if (previous !== 'x7' && id !== 'x7' && !remembered.has(id)) {
      next = { ...structuredClone(config), model: id };
    }
    Object.assign(config, structuredClone(next));
    if (id !== 'x7') lastModular = id;
    wallScope = 'all';
    openingScope = 'front';
    if (expanded !== 'size') expanded = 'model';
    render();
    onChange?.(config);
    return true;
  }

  function toggleExtra(id) {
    if (config.model !== 'x7' || !Object.hasOwn(PRICE_BOOK.extras, id)) return false;
    const selected = !config.extras.includes(id);
    config.extras = selected ? [...config.extras, id] : config.extras.filter(key => key !== id);
    render();
    onChange?.(config, { extra: id, selected });
    return true;
  }

  container.addEventListener('click', event => {
    const button = event.target.closest('button[data-action]');
    if (!button || !container.contains(button)) return;
    const { action, value } = button.dataset;
    switch (action) {
      case 'toggle': {
        const open = expanded !== value;
        expanded = open ? value : null;
        render();
        onSelectionChange?.(value, open);
        break;
      }
      case 'family':
        selectModel(value === 'x7' ? 'x7' : lastModular);
        break;
      case 'size':
        selectModel(value);
        break;
      case 'quote':
        openQuote?.();
        return;
      case 'photos':
        openPhotos?.();
        return;
      case 'preview':
        openPreview?.('3d');
        return;
      case 'wallScope': case 'openingScope':
        if (action === 'wallScope') {
          wallScope = value;
        } else {
          openingScope = value;
        }
        render();
        onWallView?.(value === 'all' ? '3d' : value);
        break;
      case 'extra':
        toggleExtra(value);
        break;
      default:
        updateOption(config, action, value, wallScope);
        render();
        onChange?.(config);
    }
    restoreFocus('button[data-action="' + action + '"][data-value="' + value + '"]');
  });

  container.addEventListener('change', event => {
    const input = event.target.closest('select[data-slot]');
    if (!input) return;
    const index = Number(input.dataset.slot);
    const items = [...itemsOf(config.openings[openingScope])];
    if (input.value === 'none') items.splice(index, 1);
    else items[index] = input.value;
    config.openings[openingScope] = { items, type: items[0] ?? 'none', count: items.length || 1 };
    render();
    onChange?.(config);
    restoreFocus('select[data-slot="' + Math.min(index, items.length) + '"]');
  });

  render();
  function selectWall(side) {
    if (config.model === 'x7') return false;
    const selected = side === 'side' ? 'right' : side;
    if (!WALLS.includes(selected)) return false;
    const editor = expanded === 'openings' ? 'openings' : 'walls';
    if (editor === 'openings') openingScope = selected;
    else wallScope = selected;
    expanded = editor;
    render();
    return true;
  }

  function refresh() {
    remembered.clear();
    lastModular = config.model === 'family' ? 'family' : 'compact';
    wallScope = 'all';
    openingScope = 'front';
    expanded = 'model';
    render();
  }

  return { refresh, selectModel, openSection, selectWall, toggleExtra };
}
