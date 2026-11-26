import { MODELS, X7_OPTIONS } from "./config.js";

// Toate tarifele sunt estimative, exprimate în euro, fără TVA.
export const PRICE_BOOK = {
  version: "v3",
  currency: "EUR",
  vatIncluded: false,
  base: { x7: 33000, compact: 26900, family: 38900 },
  extras: Object.fromEntries(Object.entries(X7_OPTIONS).map(([id, option]) => [id, option.price])),
  // Costuri pe metrul liniar de fațadă. Culoarea standard a piesei alese este inclusă.
  paintPerMetre: {
    "#e9eeed": 14, "#333638": 15, "#c1c6c7": 16, "#8238cf": 31, "#288b46": 27,
    "#f2ca20": 29, "#d63541": 30, "#ef781c": 28, "#15a3a5": 32, "#1262cf": 33,
    "#b89269": 13, "#caad89": 17, "#78563e": 18, "#525852": 19, "#39403d": 20,
    "#dad6c8": 21, "#595e60": 22, "#8b8e87": 23, "#654c40": 24, "#805b4c": 25,
    "#d6d5ca": 26, "#273940": 12,
  },
  customPaintPerMetre: 38,
  trimPaintFactor: 0.44,
  roofPaintFactor: 0.34,
  // Placarea unui perete lung. Pereții scurți se calculează proporțional cu lățimea.
  wall: {
    compact: { wood: 0, metal: 180, fiber: 300 },
    family: { wood: 0, metal: 240, fiber: 390 },
  },
  horizontalPerMetre: 9,
  roof: {
    compact: { gable: 1250, shingle: 400, includedEaves: 260 },
    family: { gable: 1600, shingle: 600, includedEaves: 340 },
  },
  opening: { window: 400, door: 650, slider: 1400 },
  includedOpenings: { front: ["slider","slider"], right: ["window"], back: ["window"], left: ["window"] },
  // Pardoseala și iluminatul se calculează după suprafața modelului. Vitrajul se calculează per model.
  interiorPerSquareMetre: { floor: { standard: 0, oak: 22, stone: 36 }, lights: { standard: 0, warm: 7, smart: 18 } },
  glazing: {
    compact: { standard: 0, solar: 700, privacy: 1100 },
    family: { standard: 0, solar: 900, privacy: 1400 },
  },
};

export const EXTRA_LABELS = Object.fromEntries(Object.entries(X7_OPTIONS).map(([id, option]) => [id, option.label]));

export const INTERIOR_LABELS = {
  floor: { standard: "Standard", oak: "Stejar", stone: "Aspect de piatră" },
  lights: { standard: "Standard", warm: "Lumină caldă", smart: "Iluminat inteligent" },
  glazing: { standard: "Standard", solar: "Control solar", privacy: "Vitraj de intimitate" },
};

export function formatEuro(amount) {
  return new Intl.NumberFormat("ro-RO", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount) + " €";
}

function paintRate(color, standard) {
  if (!color || color.toLowerCase() === standard) return 0;
  return PRICE_BOOK.paintPerMetre[color.toLowerCase()] ?? PRICE_BOOK.customPaintPerMetre;
}

function openingValue(opening) {
  const values = PRICE_BOOK.opening;
  if (Array.isArray(opening.items)) return opening.items.reduce((sum, key) => sum + values[key], 0);
  return (values[opening.type] ?? 0) * opening.count;
}

// Fiecare linie reprezintă diferența față de configurația inclusă în prețul de bază.
export function getEstimate(config) {
  if (!Object.hasOwn(PRICE_BOOK.base, config.model)) throw new RangeError("Model necunoscut.");
  const model = MODELS[config.model];
  const lines = [];
  const add = (label, amount) => {
    const euros = Math.round(amount);
    if (euros) lines.push({ label, amount: euros });
  };
  const base = PRICE_BOOK.base[config.model];
  const estimate = () => ({
    base, total: lines.reduce((total, line) => total + line.amount, base), lines,
    currency: PRICE_BOOK.currency, vatIncluded: PRICE_BOOK.vatIncluded, tariffVersion: PRICE_BOOK.version,
  });
  if (config.model === "x7") {
    for (const [id, option] of Object.entries(X7_OPTIONS)) {
      if (config.extras?.includes(id)) add(option.label, option.price);
    }
    return estimate();
  }

  const sides = { front: "față", right: "dreapta", back: "spate", left: "stânga" };
  const materials = { metal: "Placare metalică", fiber: "Placare cu fibrociment" };
  for (const [side, label] of Object.entries(sides)) {
    const wall = config.walls?.[side];
    const span = side === "front" || side === "back" ? model.length : model.width;
    add("Culoare fațadă · " + label, span * paintRate(wall?.color, "#b89269"));
    if (wall && materials[wall.material]) {
      add(materials[wall.material] + " · " + label, PRICE_BOOK.wall[config.model][wall.material] * span / model.length);
    }
    if (wall?.orientation === "horizontal") add("Montaj orizontal · " + label, span * PRICE_BOOK.horizontalPerMetre);
    const opening = config.openings?.[side];
    if (opening) {
      const included = openingValue({ items: PRICE_BOOK.includedOpenings[side] });
      // The allowance is limited to the actual fittings already included on this wall.
      add("Uși și ferestre · " + label, openingValue(opening) - included);
    }
  }
  const roof = config.roof;
  if (roof) {
    const trim = roof.trimColor ?? roof.color;
    add("Culoare bordură", paintRate(trim, "#333638") *
      2 * (model.width + model.length) * PRICE_BOOK.trimPaintFactor);
    const rates = PRICE_BOOK.roof[config.model];
    add("Culoare acoperiș", paintRate(roof.color, "#333638") * model.area * PRICE_BOOK.roofPaintFactor);
    if (roof.style === "gable") add("Acoperiș în două ape", rates.gable);
    if (roof.material === "shingle") add("Învelitoare din șindrilă", rates.shingle);
    if (roof.overhang === false) add("Renunțare la streașină", -rates.includedEaves);
  }
  const interior = config.interior || {};
  for (const [key, title] of [["floor", "Pardoseală"], ["lights", "Iluminat"]]) {
    const variant = interior[key] ?? "standard";
    add(title + " · " + INTERIOR_LABELS[key][variant], model.area * PRICE_BOOK.interiorPerSquareMetre[key][variant]);
  }
  const glazing = interior.glazing ?? "standard";
  add("Vitraj · " + INTERIOR_LABELS.glazing[glazing], PRICE_BOOK.glazing[config.model][glazing]);
  return estimate();
}

export function optionDelta(config, nextConfig) {
  return getEstimate(nextConfig).total - getEstimate(config).total;
}
