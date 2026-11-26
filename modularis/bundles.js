import {createModelConfig} from './config.js';
import {formatEuro,getEstimate} from './pricing.js';

const presets=[
  {name:'Standard', extras:[], description:'Capsula X7 cu dotările de serie.'},
  {name:'Confort', extras:['curtains','bed','kitchen'], description:'Draperii blackout smart, pat cu saltea și sistem de bucătărie.'},
  {name:'Pentru iarnă', extras:['underfloorHeating','pipeFrostProtection','tripleGlazing','underbodyInsulation','wallInsulation'], description:'Încălzire în pardoseală, protecție pentru țevi, geam triplu și izolație suplimentară sub capsulă și în pereți.'}
];

export function presetConfigs(config) {
  const base=config.model==='x7'?config:createModelConfig('x7');
  return presets.map(preset=>{
    const next=structuredClone(base);
    next.extras=[...preset.extras];
    return {name:preset.name,description:preset.description,config:next,price:getEstimate(next).total};
  });
}

export function showBundles(config,openInfo,applyPreset) {
  const candidates=presetConfigs(config);
  const isX7=config.model==='x7';
  const paragraph=isX7?'Alege o selecție de dotări. Poți adăuga sau elimina apoi fiecare opțiune.':'Alegerea unei selecții deschide Capsula X7. Poți modifica apoi dotările.';
  openInfo(`<h2>Pachete Capsula X7</h2><p>${paragraph}</p><div class="bundle-list">${candidates.map((item,index)=>`<article class="bundle-card"><div><h3>${item.name}</h3><strong>${formatEuro(item.price)} <small>+ TVA</small></strong></div><p>${item.description}</p><button type="button" data-bundle-index="${index}" aria-label="Alege pachetul ${item.name}">Alege pachetul</button></article>`).join('')}</div><small class="bundle-note">Estimări pentru casă și opțiuni. Transportul, macaraua și montajul se calculează separat.</small>`);
  for(const button of document.querySelectorAll('#dialog-content [data-bundle-index]')) {
    button.addEventListener('click',()=>applyPreset(candidates[Number(button.dataset.bundleIndex)]));
  }
}
