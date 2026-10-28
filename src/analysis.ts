// Build-planning figures derived from a dome's geometry: cover panels, base
// shims, assembly courses, capacity, weight, and file exports.
import type { DomeGeometry, Vec3 } from './geodesic';

const dist = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

export interface PanelType {
  /** Strut letters round the triangle, sorted, e.g. "AAB". */
  key: string;
  count: number;
  /** Side chord factors, matching the letters. */
  sides: [number, number, number];
  /** Area on the unit sphere. */
  areaFactor: number;
}

/** Triangles grouped by which strut types make their sides: one cover template each. */
export function panelTypes(g: DomeGeometry): PanelType[] {
  const typeOf = new Map<string, number>();
  for (const [a, b, t] of g.edges) typeOf.set(a < b ? `${a}-${b}` : `${b}-${a}`, t);
  const edgeType = (a: number, b: number) => typeOf.get(a < b ? `${a}-${b}` : `${b}-${a}`)!;
  const groups = new Map<string, PanelType>();
  for (const [a, b, c] of g.faces) {
    const types = [edgeType(a, b), edgeType(b, c), edgeType(c, a)].sort((x, y) => x - y);
    const key = types.map((t) => g.strutTypes[t].label).join('');
    const existing = groups.get(key);
    if (existing) {
      existing.count++;
      continue;
    }
    const [p, q, r] = [g.vertices[a], g.vertices[b], g.vertices[c]];
    const sides = types.map((t) => g.strutTypes[t].chordFactor) as [number, number, number];
    // Heron's formula on the flat panel.
    const [x, y, z] = [dist(p, q), dist(q, r), dist(r, p)];
    const s = (x + y + z) / 2;
    groups.set(key, { key, count: 1, sides, areaFactor: Math.sqrt(s * (s - x) * (s - y) * (s - z)) });
  }
  return [...groups.values()].sort((p, q) => q.count - p.count || p.key.localeCompare(q.key));
}

/** Rim hubs grouped by how far each sits above the lowest one (unit sphere). */
export function baseShims(g: DomeGeometry): { lift: number; hubs: number }[] {
  const degree = new Array(g.vertices.length).fill(0);
  for (const [a, b] of g.edges) {
    degree[a]++;
    degree[b]++;
  }
  // Rim hubs are those within one strut of the cut plane that touch a rim edge.
  const faceCount = new Map<string, number>();
  for (const [a, b, c] of g.faces) {
    for (const [p, q] of [[a, b], [b, c], [c, a]]) {
      const k = p < q ? `${p}-${q}` : `${q}-${p}`;
      faceCount.set(k, (faceCount.get(k) ?? 0) + 1);
    }
  }
  const rim = new Set<number>();
  for (const [k, n] of faceCount) if (n === 1) for (const i of k.split('-').map(Number)) rim.add(i);
  const ys = [...rim].map((i) => g.vertices[i][1]);
  const low = Math.min(...ys);
  const groups = new Map<number, number>();
  for (const y of ys) {
    const lift = Math.round((y - low) * 1e5) / 1e5;
    groups.set(lift, (groups.get(lift) ?? 0) + 1);
  }
  return [...groups].map(([lift, hubs]) => ({ lift, hubs })).sort((a, b) => a.lift - b.lift);
}

/** Struts grouped into horizontal courses, bottom first: the order to raise them. */
export function courses(g: DomeGeometry): number[][] {
  const mids = g.edges.map(([a, b]) => (g.vertices[a][1] + g.vertices[b][1]) / 2);
  const order = mids.map((_, i) => i).sort((a, b) => mids[a] - mids[b]);
  const out: number[][] = [];
  let last = Number.NEGATIVE_INFINITY;
  for (const i of order) {
    if (mids[i] - last > 0.012) out.push([]);
    out[out.length - 1].push(i);
    last = mids[i];
  }
  // Each course as a count per strut type.
  return out.map((course) => {
    const counts = new Array(g.strutTypes.length).fill(0);
    for (const i of course) counts[g.edges[i][2]]++;
    return counts;
  });
}

/** Floor area per person, in square feet: standing crowd, theatre rows, tables. */
export const CAPACITY_FT2 = { standing: 6, seated: 8, banquet: 12 };

/** Linear weights, lb per ft. Approximate: check your supplier's figures. */
export const STRUT_MATERIALS: { id: string; name: string; lbPerFt: number }[] = [
  { id: 'emt-12', name: '1/2" EMT conduit', lbPerFt: 0.3 },
  { id: 'emt-34', name: '3/4" EMT conduit', lbPerFt: 0.46 },
  { id: 'emt-1', name: '1" EMT conduit', lbPerFt: 0.67 },
  { id: 'pvc-34', name: '3/4" PVC sch. 40', lbPerFt: 0.22 },
  { id: 'pvc-1', name: '1" PVC sch. 40', lbPerFt: 0.32 },
  { id: 'wood-2x2', name: '2×2 softwood', lbPerFt: 0.55 },
  { id: 'wood-2x4', name: '2×4 softwood', lbPerFt: 1.3 },
];

const csvCell = (v: string | number) => (typeof v === 'number' ? String(v) : `"${v.replace(/"/g, '""')}"`);

export function cutListCsv(g: DomeGeometry, radius: number, unit: string): string {
  const rows: (string | number)[][] = [['Type', 'Quantity', 'Chord factor', `Length (${unit})`]];
  for (const t of g.strutTypes) rows.push([t.label, t.count, Number(t.chordFactor.toFixed(5)), Number((t.chordFactor * radius).toFixed(4))]);
  return `${rows.map((r) => r.map(csvCell).join(',')).join('\n')}\n`;
}

/** Wavefront OBJ: hubs as vertices, panels as faces, struts as lines, grouped by type. */
export function domeObj(g: DomeGeometry, radius: number, unit: string): string {
  const out = [`# ${g.spec.name} geodesic dome, radius ${radius.toFixed(3)} ${unit}`, `o ${g.spec.id}`];
  for (const [x, y, z] of g.vertices) out.push(`v ${(x * radius).toFixed(5)} ${((y - g.baseY) * radius).toFixed(5)} ${(z * radius).toFixed(5)}`);
  out.push('g panels');
  for (const [a, b, c] of g.faces) out.push(`f ${a + 1} ${b + 1} ${c + 1}`);
  g.strutTypes.forEach((t, i) => {
    out.push(`g strut_${t.label}`);
    for (const [a, b, type] of g.edges) if (type === i) out.push(`l ${a + 1} ${b + 1}`);
  });
  return `${out.join('\n')}\n`;
}

/** ASCII STL of the panel shell, for 3D printing a model. */
export function domeStl(g: DomeGeometry, radius: number): string {
  const p = (i: number) => {
    const [x, y, z] = g.vertices[i];
    return [x * radius, (y - g.baseY) * radius, z * radius];
  };
  const out = [`solid ${g.spec.id}`];
  for (const [a, b, c] of g.faces) {
    const [A, B, C] = [p(a), p(b), p(c)];
    const u = [B[0] - A[0], B[1] - A[1], B[2] - A[2]];
    const v = [C[0] - A[0], C[1] - A[1], C[2] - A[2]];
    const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const l = Math.hypot(n[0], n[1], n[2]) || 1;
    out.push(` facet normal ${(n[0] / l).toFixed(6)} ${(n[1] / l).toFixed(6)} ${(n[2] / l).toFixed(6)}`, '  outer loop');
    for (const P of [A, B, C]) out.push(`   vertex ${P[0].toFixed(5)} ${P[1].toFixed(5)} ${P[2].toFixed(5)}`);
    out.push('  endloop', ' endfacet');
  }
  out.push(`endsolid ${g.spec.id}`);
  return `${out.join('\n')}\n`;
}

export function download(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
