export const MODELS = Object.freeze({
  x7: {name:'Capsula X7', length:11.5, width:3.4, height:3.45, area:38},
  compact: {name:'Modul 32', length:8, width:4, area:32},
  family: {name:'Modul 48', length:10, width:4.8, area:48}
});
// Sursa tarifelor X7: https://casecapsula.ro/configurator, verificată la 24.11.2026.
export const X7_OPTIONS = Object.freeze({
  curtains: {label: 'Draperii blackout smart', price: 550},
  bed: {label: 'Pat + saltea 180 × 200 cm', price: 700},
  kitchen: {label: 'Sistem bucătărie', price: 1050},
  projector: {label: 'Sistem proiector', price: 320},
  underfloorHeating: {label: 'Încălzire electrică în pardoseală', price: 1000},
  pipeFrostProtection: {label: 'Protecție anti-îngheț pentru țevi', price: 280},
  tripleGlazing: {label: 'Geam triplu', price: 530},
  underbodyInsulation: {label: 'Izolație inferioară 8–10 cm', price: 530},
  wallInsulation: {label: 'Izolație de perete mai groasă', price: 270}
});
export const WALLS = ['front','right','back','left'];
export const formatNumber = value => new Intl.NumberFormat('ro-RO').format(value);
export function createModelConfig(modelId='x7') {
  if (!Object.hasOwn(MODELS,modelId)) throw new RangeError('Model indisponibil.');
  const model=modelId;
  const x7=model==='x7';
  return {
    model,
    walls:Object.fromEntries(WALLS.map(side=>[side,x7?{material:'metal',orientation:'horizontal',color:'#e9eeed'}:{material:'wood',orientation:'vertical',color:'#b89269'}])),
    roof:x7?{style:'mono',material:'metal',overhang:false,color:'#e9eeed',trimColor:'#273940'}:{style:'mono',material:'metal',overhang:true,color:'#333638',trimColor:'#333638'},
    openings:Object.fromEntries(WALLS.map(side=>[side,side==='front'?{type:'slider',count:2}:{type:'window',count:1}])),
    interior:{floor:'standard',lights:'standard',glazing:'standard'},
    extras:[]
  };
}
export const defaultConfig=createModelConfig;
function member(value,options,fallback) {return options.includes(value)?value:fallback;}
function color(value,fallback) {return typeof value==='string' && /^#[0-9a-f]{6}$/i.test(value)?value:fallback;}
export function normalizeConfig(raw) {
  if(raw==null) return defaultConfig();
  if(typeof raw!=='object' || !Object.hasOwn(MODELS, raw.model)) throw new RangeError('Model indisponibil.');
  const result=createModelConfig(raw.model);
  for (const side of WALLS) {
    const wall=raw.walls?.[side]??{}, preset=result.walls[side];
    result.walls[side]={material:member(wall.material,['wood','metal','fiber'],preset.material),orientation:member(wall.orientation,['vertical','horizontal'],preset.orientation),color:color(wall.color,preset.color)};
    const opening=raw.openings?.[side]??{};
    result.openings[side]={type:member(opening.type,['slider','door','window','none'],result.openings[side].type),count:member(opening.count,[1,2,3],result.openings[side].count)};
    if(Array.isArray(opening.items)) {
      const items=opening.items.filter(value=>['slider','door','window'].includes(value)).slice(0,3);
      result.openings[side]={type:items[0]??'none',count:items.length||1,items};
    }
  }
  const roof=raw.roof??{}, preset=result.roof;
  result.roof={style:member(roof.style,['mono','gable'],preset.style),material:member(roof.material,['metal','shingle'],preset.material),overhang:typeof roof.overhang==='boolean'?roof.overhang:preset.overhang,color:color(roof.color,preset.color),trimColor:color(roof.trimColor,result.model==='x7'?preset.trimColor:color(roof.color,preset.trimColor))};
  const interior=raw.interior??{};
  result.interior={
    floor:member(interior.floor,['standard','oak','stone'],'standard'),
    lights:member(interior.lights,['standard','warm','smart'],'standard'),
    glazing:member(interior.glazing,['standard','solar','privacy'],'standard')
  };
  if(result.model==='x7' && Array.isArray(raw.extras)) {
    result.extras=Object.keys(X7_OPTIONS).filter(key=>raw.extras.includes(key));
  }
  return result;
}
