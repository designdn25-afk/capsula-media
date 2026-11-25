import { MODELS, formatNumber } from './config.js';
import { PRICE_BOOK, formatEuro } from './pricing.js';

const modelIds = Object.keys(MODELS);
const longestModel = Math.max(...Object.values(MODELS).map(model => model.length));
const fieldList = [
  {id:'price', label:'Preț de bază, fără TVA', value:id => formatEuro(PRICE_BOOK.base[id])},
  {id:'area', label:'Suprafață', value:id => formatNumber(MODELS[id].area) + ' m²'},
  {id:'dimensions', label:'Lungime × lățime', value:id =>
    [MODELS[id].length, MODELS[id].width].map(formatNumber).join(' × ') + ' m'},
  {id:'exterior', label:'Fațadă standard', value:id => id === 'x7' ? 'Panouri din aluminiu' : 'Placare din lemn'},
  {id:'options', label:'Ce poți personaliza', value:id => id === 'x7'
    ? 'Culori în previzualizare și nouă dotări opționale'
    : 'Fațadă, acoperiș, uși, ferestre și finisaje interioare'}
];

function modelSelector(id, position) {
  const options = modelIds.map(modelId =>
    `<option value="${modelId}" ${modelId === id ? 'selected' : ''}>${MODELS[modelId].name}</option>`
  ).join('');
  return `<th scope="col" id="comparison-column-${position}">
    <span class="mc-select-wrap">
      <select data-model-position="${position}" aria-label="Schimbă modelul din ${position === 0 ? 'stânga' : 'dreapta'}">${options}</select>
    </span>
    <span class="mc-kind">${id === 'x7' ? 'Model X7' : 'Model conceptual'}</span>
  </th>`;
}

function drawFootprint(id) {
  const model = MODELS[id];
  const width = (model.length / longestModel) * 84;
  const height = (model.width / longestModel) * 168;
  return `<td><div class="mc-plot" aria-hidden="true"><span style="width:${width}%;height:${height}%"></span></div></td>`;
}

function fieldRow(field, pair) {
  const valueCells = pair.map((id, position) =>
    `<td headers="comparison-column-${position} comparison-field-${field.id}">${field.value(id)}</td>`
  ).join('');
  return `<tbody class="mc-field mc-field-${field.id}">
    <tr><th colspan="2" id="comparison-field-${field.id}">${field.label}</th></tr><tr>${valueCells}</tr>
  </tbody>`;
}

function difference(pair) {
  const [smaller, larger] = [...pair].sort((a,b) => MODELS[a].area - MODELS[b].area);
  const area = formatNumber(MODELS[larger].area - MODELS[smaller].area);
  const price = formatEuro(PRICE_BOOK.base[larger] - PRICE_BOOK.base[smaller]);
  return `${MODELS[larger].name} oferă ${area} m² în plus față de ${MODELS[smaller].name}, pentru o diferență de ${price} la prețul de bază, fără TVA.`;
}

function renderTable(pair) {
  return `<table class="mc-table">
    <caption class="sr-only">Comparație între ${MODELS[pair[0]].name} și ${MODELS[pair[1]].name}</caption>
    <thead><tr>${pair.map(modelSelector).join('')}</tr></thead>
    <tbody class="mc-footprints"><tr>${pair.map(drawFootprint).join('')}</tr></tbody>
    ${fieldList.map(field => fieldRow(field, pair)).join('')}
    <tfoot><tr>${pair.map(id => `<td><button type="button" class="mc-pick" data-pick-model="${id}">Configurează <strong>${MODELS[id].name}</strong></button></td>`).join('')}</tr></tfoot>
  </table>`;
}

export function showModelComparison(config, openInfo, onPickModel) {
  const otherModel = modelIds.includes(config.model) && config.model !== 'x7' ? config.model : 'family';
  const pair = ['x7', otherModel];
  openInfo(`<section class="model-comparison">
    <h2>Compară modelele</h2>
    <p class="mc-intro">Alege două case pentru a compara dimensiunile și configurațiile standard.</p>
    <div data-comparison-table>${renderTable(pair)}</div>
    <p class="mc-difference" aria-live="polite">${difference(pair)}</p>
    <p class="mc-note">Prețuri orientative. Transportul, macaraua și montajul se calculează separat.</p>
  </section>`);
  const root = document.querySelector('#dialog-content .model-comparison');
  root.addEventListener('change', event => {
    const select = event.target.closest('[data-model-position]');
    if (!select || !modelIds.includes(select.value)) return;
    const position = Number(select.dataset.modelPosition);
    const opposite = 1 - position;
    if (select.value === pair[opposite]) pair[opposite] = pair[position];
    pair[position] = select.value;
    root.querySelector('[data-comparison-table]').innerHTML = renderTable(pair);
    root.querySelector('.mc-difference').textContent = difference(pair);
    root.querySelector(`[data-model-position="${position}"]`).focus({preventScroll:true});
  });
  root.addEventListener('click', event => {
    const button = event.target.closest('[data-pick-model]');
    if (button) onPickModel(button.dataset.pickModel);
  });
}
