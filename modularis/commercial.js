import {MODELS, formatNumber} from './config.js';
import {getEstimate, formatEuro, EXTRA_LABELS, INTERIOR_LABELS} from './pricing.js';
import {finishName} from './panel.js';

const MATERIALS={metal:'metal',wood:'lemn',fiber:'fibrociment'};
const SIDES={front:'Față',right:'Dreapta',back:'Spate',left:'Stânga'};
const OPENINGS={window:'fereastră',slider:'ușă culisantă',door:'ușă simplă'};
export const PDFS=[
  {name:'Oferta X7 în PDF',summary:'Echipare și livrare. Tarifele din document pot diferi de estimarea curentă.',pages:5,url:'https://casecapsula.ro/docs/oferta-capsula-x7-v2.pdf'},
  {name:'Prezentarea tehnică X7',summary:'Planuri, structură, izolație și instalații',pages:30,url:'https://casecapsula.ro/docs/prezentare-tehnica-x7.pdf'}
];
function detailsByWall(config) {
  const sides=Object.entries(SIDES);
  const color=side=>finishName(config.walls[side].color,config.walls[side].material);
  if(config.model==='x7') {
    const colors=new Set(sides.map(([side])=>color(side)));
    return colors.size===1?`Caroserie: ${color('front')}`:`Caroserie: ${sides.map(([s,label])=>`${label} ${color(s)}`).join(', ')}`;
  }
  return sides.map(([side,label])=>{
    const wall=config.walls[side],opening=config.openings[side];
    const items=opening.items??(opening.type==='none'?[]:Array(opening.count).fill(opening.type));
    return `${label}: ${MATERIALS[wall.material]} ${color(side)}, ${wall.orientation==='vertical'?'vertical':'orizontal'}, ${items.map(type=>OPENINGS[type]).join(' / ')||'fără deschideri'}`;
  }).join('\n');
}
export function whatsappUrl(config) {
  const model=MODELS[config.model],estimate=getEstimate(config);
  const extra=(config.extras??[]).map(key=>EXTRA_LABELS[key]).filter(Boolean);
  const finishTitles={floor:'Pardoseală',lights:'Iluminat',glazing:'Vitraj'};
  const finishes=Object.entries(finishTitles).map(([key,title])=>title+' – '+INTERIOR_LABELS[key][config.interior?.[key]??'standard']);
  const message=[`Bună ziua! Aș dori o ofertă pentru ${model.name} (${formatNumber(model.area)} m²).`,
    `Dimensiuni: ${formatNumber(model.length)} × ${formatNumber(model.width)} m.`,config.model==='x7'?'Preferințe de previzualizare (de confirmat în ofertă): '+detailsByWall(config):detailsByWall(config),
    `Bordură: ${finishName(config.roof.trimColor)}.`,
    config.model==='x7'?`Dotări opționale: ${extra.join(', ')||'fără suplimente'}.`:`Acoperiș: ${config.roof.style==='gable'?'în două ape':'într-o apă'}, ${config.roof.material==='metal'?'tablă':'șindrilă'}, ${config.roof.color}, ${config.roof.overhang?'cu':'fără'} streașină.`,
    `${finishes.join(', ')}.`,
    `Preț estimat: ${formatEuro(estimate.total)} + TVA.`, 'Aș dori și detalii despre transport și montaj.'].join('\n');
  return `https://wa.me/40731166070?text=${encodeURIComponent(message)}`;
}
const PHOTOS=[['Exterior','exterior-evening','Exteriorul capsulei X7 iluminat seara'],['Living','living-wide','Livingul X7 cu geamuri panoramice'],['Dormitor','bedroom-daylight','Dormitorul luminos al capsulei X7'],['Baie','bathroom','Baia complet echipată a modelului X7']];
export function showDocuments(openInfo,icon) {
  const fileLinks=PDFS.map(doc=>`<a class="file-card" href="${doc.url}" target="_blank" rel="noopener"><i>${icon('file',22)}</i><span><strong>${doc.name}</strong><small>${doc.summary}</small></span><b>PDF<br>${doc.pages} pag.</b></a>`).join('');
  openInfo(`<h2>Documente și fotografii X7</h2><div class="file-list">${fileLinks}</div><div class="product-photo"><img id="product-image" src="./assets/${PHOTOS[0][1]}.webp" alt="${PHOTOS[0][2]}"></div><div class="photo-tabs" role="group" aria-label="Fotografii X7">${PHOTOS.map(([label],idx)=>`<button type="button" data-photo="${idx}" aria-pressed="${idx===0}">${label}</button>`).join('')}</div><a class="product-source" href="https://casecapsula.ro/model-x7" target="_blank" rel="noopener">Modelul X7 pe casecapsula.ro</a>`);
  const content=document.getElementById('dialog-content');
  const photo=content.querySelector('#product-image'),tabs=content.querySelectorAll('[data-photo]');
  for(const tab of tabs) tab.addEventListener('click',()=>{
    const [,file,alt]=PHOTOS[Number(tab.dataset.photo)];
    photo.src=`./assets/${file}.webp`;photo.alt=alt;
    for(const other of tabs) other.setAttribute('aria-pressed',String(other===tab));
  });
}
export function showEstimate(config,openInfo) {
  const estimate=getEstimate(config),model=MODELS[config.model];
  const rows=[{label:`${model.name} · configurație standard`,amount:estimate.base},...estimate.lines];
  openInfo(`<h2>Prețul configurației</h2><dl class="price-breakdown">${rows.map(item=>`<div><dt>${item.label}</dt><dd>${formatEuro(item.amount)}</dd></div>`).join('')}</dl><div class="price-overall"><span>Total estimat</span><strong>${formatEuro(estimate.total)} <small>+ TVA</small></strong></div><p>Transportul, macaraua și montajul se calculează pentru adresa de livrare. Prețurile opțiunilor sunt orientative.</p><button type="button" class="dialog-primary" data-action="close-dialog">Înapoi la configurator</button>`);
}
