import type { DomeGeometry } from './geodesic';

export type Unit = 'ft' | 'm';
export const FT_PER_M = 1 / 0.3048;

/** Original OpenDome palette: struts A/B/C are cyan, pink, lime; the rest extend it. */
export const STRUT_COLORS = [
  '#1FBED6', '#FE65A6', '#BCD700', '#FF8C1A', '#4D7CFF',
  '#2BD98C', '#E8E8E8', '#FF5CF0', '#8FE3FF', '#C8925A',
];
export const DIM_COLORS = {
  D: '#9966FF',
  R: '#FFCC00',
  A: '#000000',
  C: '#666666',
  H: '#FF3333',
};

/** An editable measurement: value = factor * radius^power. */
export interface Field {
  key: string;
  factor: number;
  power: 1 | 2;
}

export function fields(g: DomeGeometry): Field[] {
  return [
    ...g.strutTypes.map((t) => ({ key: `strut-${t.label}`, factor: t.chordFactor, power: 1 as const })),
    { key: 'D', factor: 2, power: 1 },
    { key: 'R', factor: 1, power: 1 },
    { key: 'A', factor: g.floorAreaFactor, power: 2 },
    { key: 'C', factor: g.floorPerimeterFactor, power: 1 },
    { key: 'H', factor: g.heightFactor, power: 1 },
  ];
}

export const valueOf = (f: Field, radius: number) => f.factor * radius ** f.power;
export const radiusFrom = (f: Field, value: number) => (value / f.factor) ** (1 / f.power);

export const fixed = (n: number, digits = 2) =>
  n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** 4.953 ft -> 4' 11 7/16" (nearest 1/16"). */
export function feetInches(ft: number): string {
  const sixteenths = Math.round(ft * 12 * 16);
  const feet = Math.floor(sixteenths / (12 * 16));
  const rest = sixteenths - feet * 12 * 16;
  const inches = Math.floor(rest / 16);
  let num = rest - inches * 16;
  let den = 16;
  while (num && num % 2 === 0) {
    num /= 2;
    den /= 2;
  }
  const inch = `${inches}${num ? ` ${num}/${den}` : ''}"`;
  return feet ? `${feet}' ${inch}` : inch;
}

export const precise = (len: number, unit: Unit) =>
  unit === 'ft' ? feetInches(len) : `${Math.round(len * 1000).toLocaleString('en-US')} mm`;

/** First-fit-decreasing: how many stock lengths cover every strut. */
export function stockNeeded(lengths: number[], stock: number, kerf: number) {
  const bins: number[] = [];
  for (const l of [...lengths].sort((a, b) => b - a)) {
    if (l > stock) return { sticks: Number.POSITIVE_INFINITY, offcut: 0 };
    const i = bins.findIndex((free) => free >= l);
    if (i >= 0) bins[i] -= l + kerf;
    else bins.push(stock - l - kerf);
  }
  return { sticks: bins.length, offcut: bins.reduce((n, free) => n + Math.max(0, free), 0) };
}
