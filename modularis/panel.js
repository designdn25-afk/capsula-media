import { MODELS,createModelConfig } from './config.js';
import { PRICE_BOOK,EXTRA_LABELS as extraNames,INTERIOR_LABELS,optionDelta,getEstimate,formatEuro } from './pricing.js';

const wallNames = {front:'Față', back:'Spate', left:'Stânga', right:'Dreapta'};
const modelIds = ['x7','compact','family','grand'];
const wallIds = Object.keys(wallNames);
const conceptSections = [
  {title:'Model', heading:'Alege modelul', icon:'house'},
  {title:'Fațadă', heading:'Personalizează fațada', icon:'siding'},
  {title:'Acoperiș', heading:'Configurează acoperișul', icon:'roof'},
  {title:'Deschideri', heading:'Alege ușile și ferestrele', icon:'window'},
  {title:'Interior', heading:'Alege finisajele interioare', icon:'interior'},
  {title:'Rezumat', heading:'Configurația ta', icon:'specs'}
];
const capsuleSections = [
  {title:'Model', heading:'Alege modelul', icon:'house'},
  {title:'Exterior', heading:'Colorează exteriorul', icon:'siding'},
  {title:'Accente', heading:'Alege culoarea conturului', icon:'paint'},
  {title:'Dotări', heading:'Alege dotările', icon:'controls'},
  {title:'Interior', heading:'Alege finisajele interioare', icon:'interior'},
  {title:'Rezumat', heading:'Configurația ta', icon:'specs'}
];
const sidingMaterials = {wood:'Lemn', metal:'Metal', fiber:'Fibrociment'};
const roofMaterials = {metal:'Tablă fălțuită', shingle:'Șindrilă'};
const roofStyles = {mono:'O pantă', gable:'Două ape'};
const directions = {horizontal:'Orizontală', vertical:'Verticală'};
const openingTypes = {slider:'Ușă culisantă', door:'Ușă simplă', window:'Fereastră'};
const woodColors = [
  ['#b89269', 'Stejar natural'], ['#caad89', 'Mesteacăn'], ['#78563e','Nuc'],
  ['#525852', 'Gri mineral'], ['#39403d','Antracit'], ['#dad6c8','Ivoriu']
];
const neutralNames = ['Bronz satinat','Bej nisipiu','Brun','Gri mineral','Antracit','Ivoriu'];
const neutralColors = woodColors.map(([hex],index)=>[hex,neutralNames[index]]);
const vividColors = [
  ['#8238cf','Violet ametist'], ['#288b46','Verde smarald'], ['#f2ca20','Galben solar'],
  ['#d63541','Roșu rubin'], ['#ef781c','Portocaliu'], ['#15a3a5','Turcoaz']
];
const capsuleColors = [
  ['#e9eeed','Alb perlat'], ['#333638','Grafit'], ['#c1c6c7','Argintiu'],
  ...vividColors, ['#1262cf','Albastru cobalt']
];
const wallPalette = material=>[...(material==='wood' ? woodColors : neutralColors),...vividColors];
const roofColors = [
  ['#333638','Grafit'], ['#595e60','Gri zinc'], ['#8b8e87','Gri deschis'],
  ['#654c40','Brun'], ['#805b4c','Teracotă'], ['#d6d5ca','Alb cald'], ...vividColors
];
const icons = {
  interior:'<path d="m3 7 8-4 8 4v9l-8 4-8-4Zm0 0 8 4 8-4m-8 4v9M7 5l8 4"/>',
  paint:'<path d="m3 13 8.7-9 6.2 5.7-8.3 8.9H3Zm6 4-5-4M14 6.3l2.2-2.2 3.3 3.2-2.2 2.2"/><path d="M12 19h7"/>',
  controls:'<path d="M4 5v12m7-12v12m7-12v12"/><path stroke-width="4" d="M4 7.5v2m7 3v2m7-8v2"/>',
  house:'<path d="m2.8 9.5 8.2-6 8.2 6v9H4v-8.9"/><path d="M9 18.5v-6h4v6"/>',
  siding:'<rect x="3" y="4.5" width="16" height="13" rx="1"/><path d="M3 8.8h16M3 13.2h16M8 4.5v4.3m6 0v4.4m-6 0v4.3"/>',
  roof:'<path d="m2.5 12 8.5-8 8.5 8M4 11v6.5h14V11M8 17.5v-3h6v3"/>',
  window:'<rect x="3" y="4" width="16" height="14" rx="1"/><path d="M11 4v14M3 10.5h16"/>',
  specs:'<rect x="5" y="2.8" width="12" height="16.4" rx="1.5"/><path d="M8 7h6M8 11h6M8 15h4"/>',
  remove:'<path d="M4 6h14M8 6V3.5h6V6M6 6l.8 12h8.4L16 6M9.5 9v5.5m3-5.5v5.5"/>',
  plus:'<path d="M4 11h14M11 4v14"/>',
  down:'<path d="m6.5 9 4.5 4.5L15.5 9"/>',
  left:'<path d="m13.5 6-5 5 5 5"/>',
  right:'<path d="m8.5 6 5 5-5 5"/>',
  check:'<path d="m5.5 11 3.7 3.7 7.3-8"/>'
};

const icon = name => '<svg class="cfg-icon" aria-hidden="true" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">'+icons[name]+'</svg>';
const number = value => new Intl.NumberFormat('ro-RO', {maximumFractionDigits:2}).format(value);
const dimensions = model => number(model.length)+' × '+number(model.width)+' m';
const escaped = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[char]);
const group = (label, html) => '<fieldset class="cfg-field"><legend>'+label+'</legend>'+html+'</fieldset>';
const colorName = (palette, value) => palette.find(([code]) => code.toLowerCase()===String(value).toLowerCase())?.[1] || (value ? escaped(value) : 'Mixte');
const priceHint = '<p class="cfg-price-hint">Prețurile arată diferența față de selecția curentă, fără TVA.</p>';
const interiorGroups = {floor:'Pardoseală',lights:'Iluminat',glazing:'Vitraj'};
const spec = (label,value) => '<div><dt>'+label+'</dt><dd>'+value+'</dd></div>';

function priceText(delta, current=false) {
  if (current) return 'Selectat';
  if (delta===0) return '0 €';
  return (delta>0?'+ ':'− ')+formatEuro(Math.abs(delta));
}
function options(key, items, current, calculate, extra='') {
  return '<div class="cfg-options '+(calculate?'cfg-priced-options ':'')+extra+'">'+Object.entries(items).map(([value,label])=>{
    const active = value===current;
    const amount = calculate ? '<small>'+priceText(active?0:calculate(key,value),active)+'</small>' : '';
    return '<button type="button" class="cfg-option" data-action="'+key+'" data-value="'+value+'" aria-pressed="'+active+'"><span>'+label+'</span>'+amount+'</button>';
  }).join('')+'</div>';
}
function swatches(key,palette,current,calculate) {
  return '<div class="cfg-color-grid">'+palette.map(([value,label])=>{
    const active = value.toLowerCase()===String(current).toLowerCase();
    const price = priceText(active?0:calculate(key,value),active);
    return '<button type="button" class="cfg-color-card" data-action="'+key+'" data-value="'+value+'" aria-pressed="'+active+'"><i style="--cfg-tone:'+value+'">'+(active?icon('check'):'')+'</i><span>'+label+'<small>'+price+'</small></span></button>';
  }).join('')+'</div>';
}
function interiorPanel(config,calculate) {
  return priceHint+Object.entries(interiorGroups).map(([key,label])=>group(label, options('interior-'+key,INTERIOR_LABELS[key],config.interior[key],calculate))).join('');
}
function interiorSpecs(config) {
  return '<div class="cfg-spec-label">Finisaje interioare</div><dl class="cfg-specs">'+Object.entries(interiorGroups).map(([key,label])=>spec(label,INTERIOR_LABELS[key][config.interior[key]])).join('')+'</dl>';
}

function houseSketch(id) {
  if (id==='x7') {
    return '<svg class="cfg-sketch" viewBox="0 0 90 48" aria-hidden="true" fill="none" stroke-linejoin="round" stroke-linecap="round"><g stroke="currentColor" stroke-width="1.35"><path opacity=".3" d="m4 36 57 8 23-8"/><path fill="currentColor" fill-opacity=".15" d="m13 14 12-4 48 5q7 1 7 7v7q-.1 4-5.5 6.2l-10 4q-2 1-5 1l-47-6Q6 33 6 26v-5q0-5 7-7Z"/><path d="m12 16 43 5q6 .7 6 6v6q0 4.6-5 4l-43-5Q8 31 8 26v-5q0-4.9 4-5Z"/><path fill="currentColor" fill-opacity=".23" d="m14 18 36.5 4.2 3.2 11.2L13 28.8l-2.2-3.7 1-5.7Z"/><path d="m22 19 1 11m12-9.6 1 11m10-9.9 1 10.8m17-8.1 10.3-4.6q2.7-1 2.7 2.1V28l-12 5.2Zm-50 9.8v2.6m41.5 3.4v2.7m16.8-7v2.3"/></g></svg>';
  }
  const depth = id==='grand' ? 28 : id==='family' ? 24 : 21;
  const seamCount = id==='grand' ? 4 : id==='family' ? 3 : 2;
  const side = 81-depth;
  const frontWidth = side-9;
  let seams = '';
  for (let i=1; i<seamCount; i++) {
    const x = 12+i*(frontWidth-8)/seamCount;
    const bottom = 32+(x-9)*.13;
    seams += '<path d="M'+x+' '+(bottom-10)+'v10"/>';
  }
  return '<svg class="cfg-sketch" viewBox="0 0 90 48" aria-hidden="true" fill="none" stroke-linejoin="round" stroke-linecap="round"><g stroke="currentColor" stroke-width="1.15"><path opacity=".3" d="m3 36 54 7 27-9"/><path fill="currentColor" fill-opacity=".08" d="M9 19.5 '+side+' 25 81 15.5 30 11Z"/><path d="M9 19.5v13L'+side+' 38l'+depth+'-10.5v-12M'+side+' 25v13"/><path d="m7 18.3 22.7-8.5L83 14.7l-25 10.4Z"/><path d="m12 22.5 '+(frontWidth-7)+' 4.1v9.3l-'+(frontWidth-7)+'-4.5Z"/>'+seams+'<path d="m'+(side+6)+' 25.5 10-4.1v6l-10 4.3Z"/></g></svg>';
}

function modelList(config) {
  return '<div class="cfg-models" role="group" aria-label="Alege modelul">'+modelIds.map(id => {
    const model = MODELS[id];
    const selected = config.model===id;
    const base = formatEuro(PRICE_BOOK.base[id]);
    const price = base+' <small>+ TVA</small>';
    const type = id==='x7' ? 'Capsulă' : 'Concept';
    const art = id==='x7' ? '<img src="./assets/thumb-exterior-evening.webp" alt="" width="80" height="52">' : houseSketch(id);
    return '<button type="button" class="cfg-model" data-action="model" data-value="'+id+'" aria-pressed="'+selected+'"><span class="cfg-model-art">'+art+'</span><span class="cfg-model-copy"><span class="cfg-model-type">'+type+'</span><strong>'+escaped(model.name)+'</strong><span>'+number(model.area)+' m² · '+dimensions(model)+'</span><span class="cfg-model-price">'+price+'</span></span><span class="cfg-radio" aria-hidden="true">'+icon('check')+'</span></button>';
  }).join('')+'</div><p class="cfg-model-note">Prețuri de bază. Pentru modelele concept, valorile sunt estimative.</p>';
}

function sidingPanel(config, selected,calculate) {
  const walls = selected==='all' ? wallIds.map(id=>config.walls[id]) : [config.walls[selected]];
  const shared = key => walls.every(wall=>wall[key]===walls[0][key]) ? walls[0][key] : null;
  const color = shared('color');
  const palette = wallPalette(shared('material'));
  return priceHint+group('Aplică pe', options('wall-scope', {all:'Toți', ...wallNames}, selected, null, 'cfg-scope'))+
    group('Material', options('wall-material', sidingMaterials, shared('material'),calculate))+
    group('Orientare', options('orientation', directions, shared('orientation'),calculate))+
    group('Culoare <span>'+colorName(palette, color)+'</span>', swatches('wall-color', palette, color,calculate));
}

function capsuleExterior(config, selected,calculate) {
  const sides = selected==='all' ? wallIds : [selected];
  const first = config.walls[sides[0]].color;
  const color = sides.every(side=>config.walls[side].color===first) ? first : null;
  return priceHint+group('Laturi', options('wall-scope', {all:'Toate', ...wallNames}, selected, null, 'cfg-scope'))+
    group('Aluminiu exterior <span>'+colorName(capsuleColors,color)+'</span>',swatches('wall-color',capsuleColors,color,calculate))+
    '<p class="cfg-wall-tip">Poți selecta o latură și direct pe capsulă.</p>';
}

function capsuleAccents(config,calculate) {
  const color = config.roof.trimColor;
  const original = createModelConfig('x7').roof.trimColor;
  const palette = capsuleColors.some(([hex])=>hex===original) ? capsuleColors : [[original,'Finisaj original'],...capsuleColors];
  return priceHint+group('Contur exterior <span>'+colorName(palette,color)+'</span>',swatches('trim-color',palette,color,calculate));
}

function capsuleEquipment(config,calculate) {
  const selected = config.extras || [];
  const included = ['Baie cu duș și boiler','Două aparate de climatizare Midea','Sistem smart cu comandă vocală'];
  const standard = '<ul class="cfg-standard">'+included.map(item=>'<li>'+icon('check')+item+'</li>').join('')+'</ul>';
  const extras = Object.entries(extraNames).map(([id,name])=>{
    const active = selected.includes(id);
    const delta = calculate('extra',id);
    return '<button type="button" data-action="extra" data-value="'+id+'" aria-pressed="'+active+'" class="cfg-extra"><span class="cfg-tick">'+(active?icon('check'):'')+'</span><span>'+name+'</span><span class="cfg-extra-price">'+(active?'Elimină · ':'')+priceText(delta)+'</span></button>';
  }).join('');
  return group('Incluse în prețul de bază',standard)+priceHint+group('Opționale <span>Estimări fără TVA</span>','<div class="cfg-extras">'+extras+'</div>');
}

function capsuleSpecs(config) {
  const model = MODELS.x7;
  const spec = (label,value)=>'<div><dt>'+label+'</dt><dd>'+value+'</dd></div>';
  const selected = config.extras || [];
  const estimate=getEstimate(config);
  const trim=config.roof.trimColor;
  const trims=capsuleColors.some(([hex])=>hex===trim)?colorName(capsuleColors,trim):'Finisaj original';
  const walls=wallIds.map(side=>spec(wallNames[side],colorName(capsuleColors,config.walls[side].color))).join('');
  return '<dl class="cfg-specs">'+spec('Model',model.name)+spec('Suprafață',number(model.area)+' m²')+
    spec('L × l × h',[model.length,model.width,model.height].map(number).join(' × ')+' m')+
    spec('Compartimentare','Living, dormitor, baie și balcon')+spec('Structură','Oțel galvanizat')+
    spec('Fațadă','Panouri din aluminiu')+spec('Vitraj','Geam dublu Low‑E')+spec('Climatizare','2 × Midea Inverter, 12.000 BTU')+spec('Control','Sistem smart cu comandă vocală')+'</dl>'+
    '<div class="cfg-spec-label">Finisaje selectate</div><dl class="cfg-specs">'+walls+spec('Contur',trims)+'</dl>'+interiorSpecs(config)+
    '<div class="cfg-spec-label">Configurația aleasă</div><dl class="cfg-specs">'+
    spec('Preț de bază',formatEuro(estimate.base)+' + TVA')+
    spec('Dotări opționale',selected.length?selected.map(id=>extraNames[id]).join(', '):'Niciuna')+
    spec('Total estimat',formatEuro(estimate.total)+' + TVA')+'</dl>';
}

function roofPanel(config,calculate) {
  const roof = config.roof;
  return priceHint+group('Formă', options('roof-style', roofStyles, roof.style,calculate))+
    group('Învelitoare', options('roof-material', roofMaterials, roof.material,calculate))+
    group('Streașină', options('overhang', {on:'Cu streașină',off:'Fără streașină'}, roof.overhang ? 'on':'off',calculate))+
    group('Culoare acoperiș <span>'+colorName(roofColors,roof.color)+'</span>', swatches('roof-color',roofColors,roof.color,calculate))+
    group('Culoare bordură <span>'+colorName(roofColors,roof.trimColor || roof.color)+'</span>', swatches('trim-color',roofColors,roof.trimColor || roof.color,calculate));
}

function openingItems(opening) {
  if (Array.isArray(opening.items)) return [...opening.items];
  return openingTypes[opening.type] ? Array(opening.count).fill(opening.type) : [];
}

function saveOpeningItems(opening, items) {
  opening.items = items;
  opening.type = items[0] || 'none';
  opening.count = items.length || 1;
}

function openingPanel(config, selected,calculate) {
  const items = openingItems(config.openings[selected]);
  const rows = items.map((item,index)=>{
    const moveButton = (action,label,arrow,disabled) => '<button type="button" class="cfg-open-tool" data-action="'+action+'" data-value="'+index+'" aria-label="'+label+'" title="'+label+'"'+(disabled?' disabled':'')+'>'+icon(arrow)+'</button>';
    const typeChoices = Object.entries(openingTypes).map(([key,name])=>{
      const active = key===item;
      return '<option value="'+key+'"'+(active?' selected':'')+'>'+name+' · '+priceText(active?0:calculate('opening-type',key,index),active)+'</option>';
    }).join('');
    const removePrice=priceText(calculate('remove-opening',index));
    return '<li><div class="cfg-opening-types"><b>'+(index+1)+'</b><label class="cfg-select-wrap"><select data-opening-index="'+index+'" aria-label="Tipul deschiderii '+(index+1)+'">'+typeChoices+'</select>'+icon('down')+'</label></div><div class="cfg-opening-tools">'+
      '<button type="button" class="cfg-remove" data-action="remove-opening" data-value="'+index+'" aria-label="Elimină deschiderea '+(index+1)+', '+removePrice+'">'+icon('remove')+'Elimină · '+removePrice+'</button>'+
      moveButton('move-left','Mută deschiderea '+(index+1)+' mai devreme','left',index===0)+
      moveButton('move-right','Mută deschiderea '+(index+1)+' mai târziu','right',index===items.length-1)+'</div></li>';
  }).join('');
  const list = items.length ? '<ol class="cfg-openings">'+rows+'</ol>' : '<p class="cfg-empty">Perete fără uși sau ferestre.</p>';
  const add = items.length<3 ? group('Adaugă o deschidere',options('add-opening',openingTypes,null,calculate)) : '';
  return priceHint+group('Alege peretele', options('opening-scope', wallNames, selected, null, 'cfg-scope')+'<p class="cfg-wall-tip">Poți selecta peretele și direct pe model.</p>')+
    group('Ordinea deschiderilor <span>'+items.length+' / 3</span>', list)+add;
}

function specifications(config) {
  const model = MODELS[config.model];
  const spec = (label,value) => '<div><dt>'+label+'</dt><dd>'+value+'</dd></div>';
  return '<dl class="cfg-specs">'+spec('Model',escaped(model.name))+spec('Dimensiuni',dimensions(model))+
    spec('Suprafață',number(model.area)+' m²')+spec('Acoperiș',roofStyles[config.roof.style])+spec('Învelitoare',roofMaterials[config.roof.material])+
    spec('Streașină',config.roof.overhang?'Cu streașină':'Fără streașină')+spec('Culoare acoperiș',colorName(roofColors,config.roof.color))+spec('Culoare bordură',colorName(roofColors,config.roof.trimColor || config.roof.color))+'</dl>'+
    '<div class="cfg-spec-label">Pereți și deschideri</div><ul class="cfg-wall-specs">'+wallIds.map(id=>{
      const wall = config.walls[id], items = openingItems(config.openings[id]);
      return '<li><strong>'+wallNames[id]+'</strong><span>'+sidingMaterials[wall.material]+' · '+directions[wall.orientation]+' · '+colorName(wallPalette(wall.material),wall.color)+'</span><span>'+(items.length ? items.map((type,i)=>(i+1)+'. '+openingTypes[type]).join(' · ') : 'Fără uși sau ferestre')+'</span></li>';
    }).join('')+'</ul>'+interiorSpecs(config);
}

function summaryPanel(config) {
  const capsule = config.model==='x7';
  const walls = wallIds.map(side=>config.walls[side]);
  const finishes = [...new Set(walls.map(wall=>colorName(capsule ? capsuleColors : wallPalette(wall.material),wall.color)))];
  const materials = [...new Set(walls.map(wall=>sidingMaterials[wall.material]))];
  const exterior = (capsule ? [] : materials).concat(finishes).join(' · ');
  const interior = Object.entries(config.interior)
    .filter(([,value])=>value!=='standard')
    .map(([key,value])=>INTERIOR_LABELS[key][value]).join(' · ') || 'Finisaje standard';
  const trim = config.roof.trimColor;
  const openingCount = wallIds.reduce((count,side)=>count+openingItems(config.openings[side]).length,0);
  const rows = [
    ['Model',MODELS[config.model].name+' · '+number(MODELS[config.model].area)+' m²'],
    [capsule?'Exterior':'Fațadă',exterior],
    capsule ? ['Contur',trim==='#273940'?'Finisaj original':colorName(capsuleColors,trim)]
            : ['Acoperiș',roofStyles[config.roof.style]+' · '+roofMaterials[config.roof.material]],
    capsule ? ['Dotări',config.extras.map(id=>extraNames[id]).join(' · ') || 'Dotări standard']
            : ['Uși și ferestre',openingCount+' '+(openingCount===1?'deschidere':'deschideri')],
    ['Interior',interior]
  ];
  const summary = rows.map(([label,value],index)=>'<li><div><span>'+label+'</span><strong>'+value+'</strong></div><button type="button" data-action="section" data-value="'+index+'" aria-label="Modifică selecția pentru '+label.toLowerCase()+'">Modifică</button></li>').join('');
  const details = capsule ? capsuleSpecs(config) : specifications(config);
  return '<ul class="cfg-summary">'+summary+'</ul><details class="cfg-details"><summary>Specificații tehnice complete'+icon('down')+'</summary><div>'+details+'</div></details>';
}

// Both the displayed price change and a click apply the same change to a configuration.
function applyOption(config,action,value,wallScope,openingScope,index) {
  if (action.startsWith('interior-')) {
    config.interior[action.slice(9)] = value;
    return;
  }
  switch(action) {
    case 'extra':
      config.extras = config.extras.includes(value)
        ? config.extras.filter(id=>id!==value)
        : [...config.extras,value];
      break;
    case 'wall-material': case 'orientation': case 'wall-color': {
      const key = {'wall-material':'material',orientation:'orientation','wall-color':'color'}[action];
      for (const side of wallScope==='all'?wallIds:[wallScope]) config.walls[side][key]=value;
      break;
    }
    case 'roof-style': config.roof.style=value; break;
    case 'roof-material': config.roof.material=value; break;
    case 'overhang': config.roof.overhang=value==='on'; break;
    case 'roof-color': config.roof.color=value; break;
    case 'trim-color': config.roof.trimColor=value; break;
    case 'opening-type': case 'add-opening': case 'remove-opening': case 'move-left': case 'move-right': {
      const opening=config.openings[openingScope], items=openingItems(opening);
      if (action==='add-opening') {
        if (items.length>=3 || !Object.hasOwn(openingTypes,value)) return;
        items.push(value);
      } else if (action==='opening-type') {
        if (index<0 || index>=items.length || !Object.hasOwn(openingTypes,value)) return;
        items[index]=value;
      } else {
        const from=Number(value);
        if (!Number.isInteger(from) || from<0 || from>=items.length) return;
        if (action==='remove-opening') items.splice(from,1);
        else {
          const dest=from+(action==='move-left'?-1:1);
          if (dest<0 || dest>=items.length) return;
          [items[from],items[dest]]=[items[dest],items[from]];
        }
      }
      saveOpeningItems(opening,items);
    }
  }
}

export function mountPanel(container,{config,onChange,onWallView}) {
  let step = 0, wallScope = 'all', openingScope = 'front';
  container.classList.add('cfg-panel');
  function calculate(action,value,index) {
    const next=structuredClone(config);
    applyOption(next,action,value,wallScope,openingScope,index);
    return optionDelta(config,next);
  }
  function content(index) {
    if (config.model==='x7') {
      switch(index) {
        case 1: return capsuleExterior(config,wallScope,calculate);
        case 2: return capsuleAccents(config,calculate);
        case 3: return capsuleEquipment(config,calculate);
      }
    }
    switch(index) {
      case 0: return modelList(config);
      case 1: return sidingPanel(config,wallScope,calculate);
      case 2: return roofPanel(config,calculate);
      case 3: return openingPanel(config,openingScope,calculate);
      case 4: return interiorPanel(config,calculate);
      case 5: return summaryPanel(config);
    }
  }
  function currentSections() { return config.model==='x7' ? capsuleSections : conceptSections; }
  function render() {
    const scrollTop = container.scrollTop;
    const sections = currentSections();
    const section = sections[step];
    const controls = sections.map((item,index)=>{
      const current = index===step ? ' aria-current="step"' : '';
      return '<button type="button" data-action="section" data-value="'+index+'" aria-label="Pasul '+(index+1)+' din '+sections.length+', '+item.title+'"'+current+'>'+icon(item.icon)+'<span>'+item.title+'</span></button>';
    }).join('');
    const next = sections[step+1];
    const previous = step ? '<button type="button" class="cfg-prev" data-action="prev">Înapoi</button>' : '';
    const forward = next ? '<button type="button" class="cfg-next" data-action="next">Continuă la '+next.title.toLowerCase()+'</button>' : '';
    container.innerHTML = '<nav class="cfg-steps" aria-label="Etapele configurării">'+controls+'</nav>'+
      '<section class="cfg-current cfg-open" aria-labelledby="cfg-step-title"><div class="cfg-step-heading"><span>Pasul '+(step+1)+' din '+sections.length+'</span><h3 id="cfg-step-title" tabindex="-1">'+section.heading+'</h3></div>'+
      '<div class="cfg-section-body">'+content(step)+'</div><div class="cfg-paging">'+previous+forward+'</div></section>';
    container.scrollTop=scrollTop;
  }
  function editingWall() {
    if (step===1) return wallScope;
    if (step===3 && config.model!=='x7') return openingScope;
    return null;
  }
  function showEditingWall() {
    const side=editingWall();
    if (side) onWallView?.(side==='all' ? '3d' : side);
  }
  function selectWall(side) {
    const current=editingWall();
    if (!current) return false;
    // The generic side camera normally shows the right wall. Preserve an explicit left selection.
    if (side==='side') side=current==='left' ? 'left' : 'right';
    if (!wallIds.includes(side) && !(side==='all' && step===1)) return false;
    if (current!==side) {
      if (step===1) wallScope=side;
      else openingScope=side;
      render();
    }
    showEditingWall();
    return true;
  }
  function goTo(index) {
    const value = Number(index);
    step = Number.isInteger(value) ? Math.min(Math.max(value,0),currentSections().length-1) : 0;
    render();
    container.scrollTop=0;
    showEditingWall();
  }
  function selectModel(id) {
    if (!Object.hasOwn(MODELS,id) || id===config.model) return false;
    if (id==='x7' || config.model==='x7') {
      Object.assign(config,createModelConfig(id));
      wallScope='all';
      openingScope='front';
    } else {
      config.model=id;
    }
    render();
    onChange?.();
    return true;
  }
  container.addEventListener('change',event=>{
    const select = event.target.closest('select[data-opening-index]');
    if (!select || !container.contains(select) || !Object.hasOwn(openingTypes,select.value)) return;
    const index = Number(select.dataset.openingIndex);
    applyOption(config,'opening-type',select.value,wallScope,openingScope,index);
    render();
    onChange?.();
    showEditingWall();
    container.querySelector('select[data-opening-index="'+index+'"]')?.focus({preventScroll:true});
  });
  container.addEventListener('click',event=>{
    const button = event.target.closest('button[data-action]');
    if (!button || !container.contains(button) || button.disabled) return;
    const {action, value} = button.dataset;
    const focusButton = document.activeElement===button;
    let focusSelector;
    switch(action) {
      case 'section': case 'next': case 'prev': {
        const target = action==='section' ? Number(value) : step+(action==='next' ? 1:-1);
        if (target===step) {showEditingWall();return;}
        goTo(target);
        if (focusButton) container.querySelector('#cfg-step-title').focus({preventScroll:true});
        return;
      }
      case 'wall-scope': case 'opening-scope':
        selectWall(value);
        if (focusButton) container.querySelector('button[data-action="'+action+'"][data-value="'+value+'"]')?.focus({preventScroll:true});
        return;
      case 'model':
        if (selectModel(value) && focusButton) {
          container.querySelector('button[data-action="model"][data-value="'+value+'"]')?.focus({preventScroll:true});
        }
        return;
      case 'extra': case 'wall-material': case 'orientation': case 'wall-color':
      case 'roof-style': case 'roof-material': case 'overhang': case 'roof-color': case 'trim-color':
      case 'interior-floor': case 'interior-lights': case 'interior-glazing':
      case 'add-opening': case 'remove-opening': case 'move-left': case 'move-right': {
        applyOption(config,action,value,wallScope,openingScope);
        if (['add-opening','remove-opening','move-left','move-right'].includes(action)) {
          const length=openingItems(config.openings[openingScope]).length;
          const from=Number(value);
          const target=action==='add-opening' ? length-1 : Math.min(length-1,from+(action==='move-left'?-1:action==='move-right'?1:0));
          focusSelector=length ? 'select[data-opening-index="'+target+'"]' : '[data-action="add-opening"]';
        }
        break;
      }
      default: return;
    }
    render();
    onChange?.();
    if (editingWall()!=='all') showEditingWall();
    if (focusButton) {
      const selector = 'button[data-action="'+action+'"]'+(value ? '[data-value="'+value+'"]':'');
      const nextFocus = container.querySelector(focusSelector || selector);
      nextFocus?.focus({preventScroll:true});
    }
  });
  render();
  return {refresh:render,goTo,getStep:()=>step,selectModel,selectWall,showEditingWall,
    getSpecStep:()=>currentSections().length-1,
    goToSpecs:()=>{
      goTo(currentSections().length-1);
      container.querySelector('.cfg-details').open=true;
    }
  };
}

export function finishName(code,material='metal') {
  if(code?.toLowerCase()==='#273940') return 'Antracit';
  const palette=[...wallPalette(material),...capsuleColors,...roofColors];
  return palette.find(entry=>entry[0]===code?.toLowerCase())?.[1]??code;
}
