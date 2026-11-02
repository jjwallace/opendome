import { DIM_COLORS, STRUT_COLORS } from './calc';
import { type DomeGeometry, type Polyhedron, frequencyTriangle } from './geodesic';

// ---------------------------------------------------------------- diagrams

/** Subdivided base triangle, edges in the calculator's strut colours. */
export function triangleSvg(freq: number, width: number, kind: Polyhedron = 'icosahedron') {
  const t = frequencyTriangle(kind, freq);
  const pad = 0.06;
  const h = (Math.sqrt(3) / 2) * t.size;
  const sx = (x: number) => (((x + t.size / 2) / t.size) * (1 - 2 * pad) + pad) * 100;
  const sy = (v: number) => ((v / h) * (Math.sqrt(3) / 2) * (1 - 2 * pad) + pad) * 100;
  const stroke = Math.max(1.2, 3.2 - freq * 0.3);
  const lines = t.edges
    .map(
      (e) =>
        `<line x1="${sx(e.a[0])}" y1="${sy(e.a[1])}" x2="${sx(e.b[0])}" y2="${sy(e.b[1])}" stroke="${STRUT_COLORS[e.type]}" stroke-width="${stroke}" stroke-linecap="round" />`,
    )
    .join('');
  return `<svg viewBox="0 0 100 ${(Math.sqrt(3) / 2) * 100 + 4}" width="${width}" role="img" aria-label="Frequency ${freq} triangle">${lines}</svg>`;
}

/** Side view of a sphere cut at 3/8, 1/2 and 5/8 of its diameter. */
export function truncationSvg(width = 280) {
  const r = 80;
  const cuts = [
    { f: '3/8', frac: 3 / 8, color: STRUT_COLORS[0] },
    { f: '1/2', frac: 1 / 2, color: STRUT_COLORS[2] },
    { f: '5/8', frac: 5 / 8, color: STRUT_COLORS[1] },
  ];
  const lines = cuts
    .map((c) => {
      const y = 20 + c.frac * 2 * r;
      const half = Math.sqrt(Math.max(0, r * r - (y - 100) ** 2));
      return `<line x1="${120 - half - 14}" y1="${y}" x2="${120 + half + 14}" y2="${y}" stroke="${c.color}" stroke-width="2.5" stroke-dasharray="7 5" />
        <text x="${120 + half + 22}" y="${y + 5}" fill="${c.color}" font-size="15" font-weight="700">${c.f}</text>`;
    })
    .join('');
  return `<svg viewBox="0 0 280 200" width="${width}" role="img" aria-label="Dome heights 3/8, 1/2 and 5/8">
    <circle cx="120" cy="100" r="${r}" fill="none" stroke="#777" stroke-width="2" />
    <line x1="120" y1="20" x2="120" y2="180" stroke="${DIM_COLORS.H}" stroke-width="2" stroke-dasharray="4 4" />
    ${lines}
  </svg>`;
}

/** A chord across a circle. */
export function chordSvg(width = 200) {
  const r = 80;
  const a = (-125 * Math.PI) / 180;
  const b = (-55 * Math.PI) / 180;
  const p = [100 + r * Math.cos(a), 110 + r * Math.sin(a)];
  const q = [100 + r * Math.cos(b), 110 + r * Math.sin(b)];
  return `<svg viewBox="0 0 200 200" width="${width}" role="img" aria-label="Chord factor diagram">
    <circle cx="100" cy="110" r="${r}" fill="none" stroke="#777" stroke-width="2" />
    <line x1="100" y1="110" x2="${p[0]}" y2="${p[1]}" stroke="${DIM_COLORS.R}" stroke-width="2" />
    <line x1="100" y1="110" x2="${q[0]}" y2="${q[1]}" stroke="${DIM_COLORS.R}" stroke-width="2" />
    <line x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}" stroke="${STRUT_COLORS[1]}" stroke-width="4" stroke-linecap="round" />
    <circle cx="${p[0]}" cy="${p[1]}" r="5" fill="#ddd" /><circle cx="${q[0]}" cy="${q[1]}" r="5" fill="#ddd" />
    <text x="100" y="${p[1] - 10}" fill="${STRUT_COLORS[1]}" font-size="14" font-weight="700" text-anchor="middle">strut</text>
    <text x="74" y="104" fill="${DIM_COLORS.R}" font-size="14" font-weight="700">r</text>
  </svg>`;
}

/** Truncated icosahedron outline (the C60 cage), as a flat ring of hexagons round a pentagon. */
export function buckyballSvg(width = 160) {
  const pent = (cx: number, cy: number, r: number, rot: number) =>
    Array.from({ length: 5 }, (_, i) => {
      const t = rot + (i * 2 * Math.PI) / 5;
      return `${cx + r * Math.cos(t)},${cy + r * Math.sin(t)}`;
    }).join(' ');
  const hex = (cx: number, cy: number, r: number, rot: number) =>
    Array.from({ length: 6 }, (_, i) => {
      const t = rot + (i * Math.PI) / 3;
      return `${cx + r * Math.cos(t)},${cy + r * Math.sin(t)}`;
    }).join(' ');
  // Equal edges: each hexagon shares one side with the pentagon.
  const side = 20;
  const apothemP = side / (2 * Math.tan(Math.PI / 5));
  const apothemH = (side * Math.sqrt(3)) / 2;
  const ring = Array.from({ length: 5 }, (_, i) => {
    const t = (-54 * Math.PI) / 180 + (i * 2 * Math.PI) / 5;
    const d = apothemP + apothemH;
    return `<polygon points="${hex(80 + d * Math.cos(t), 80 + d * Math.sin(t), side, t - Math.PI / 6)}" fill="none" stroke="${STRUT_COLORS[[0, 2, 0, 2, 3][i]]}" stroke-width="2.5" stroke-linejoin="round" />`;
  }).join('');
  return `<svg viewBox="0 0 160 160" width="${width}" role="img" aria-label="Buckyball pattern">
    <circle cx="80" cy="80" r="72" fill="none" stroke="#555" stroke-width="2" />
    ${ring}
    <polygon points="${pent(80, 80, side / (2 * Math.sin(Math.PI / 5)), -Math.PI / 2)}" fill="${STRUT_COLORS[1]}" fill-opacity=".25" stroke="${STRUT_COLORS[1]}" stroke-width="2.5" />
  </svg>`;
}

export const img = (file: string, alt: string, caption?: string, cls = '') =>
  `<figure class="photo ${cls}"><img src="wiki/${file}" alt="${alt}" loading="lazy" />${caption ? `<figcaption>${caption}</figcaption>` : ''}</figure>`;

// ---------------------------------------------------------------- page shape

export type WikiGroup = 'Learn' | 'Build' | 'Dome types' | 'History' | 'Reference';

export interface WikiPage {
  slug: string;
  title: string;
  /** One line for the index card. */
  teaser: string;
  group: WikiGroup;
  art: () => string;
  body: (ctx: { geometries: DomeGeometry[] }) => string;
  /** Slugs shown as "Related" under the page. */
  related?: string[];
  /** Extra words the wiki search should match. */
  keywords?: string;
}

/** Collapsible items inside a page, so long topics stay scannable. */
export const accordion = (items: { title: string; body: string; open?: boolean }[]) =>
  `<div class="acc">${items
    .map((it) => `<details class="acc-item"${it.open ? ' open' : ''}><summary>${it.title}</summary><div class="acc-body">${it.body}</div></details>`)
    .join('')}</div>`;
