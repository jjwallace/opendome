// Geodesic dome geometry, built procedurally on a unit sphere (y-up).
// Every measurement is a factor of the sphere radius, so a single build per
// dome type serves every size the calculator is asked for.

export type Vec3 = [number, number, number];
export type Polyhedron = 'icosahedron' | 'octahedron';

export interface DomeSpec {
  id: string;
  name: string;
  polyhedron: Polyhedron;
  frequency: number;
  /** Nominal height as a fraction of the sphere diameter (1/2, 5/8, ...). */
  fraction: [number, number];
  blurb: string;
  /** Smallest hub allowed on the rim; rejects cuts that leave dangling triangles. Default 4. */
  minHubDegree?: number;
}

export interface StrutType {
  label: string;
  /** Strut length / sphere radius. */
  chordFactor: number;
  count: number;
}

export interface DomeGeometry {
  spec: DomeSpec;
  vertices: Vec3[];
  /** [a, b, strutTypeIndex] */
  edges: [number, number, number][];
  faces: [number, number, number][];
  strutTypes: StrutType[];
  /** Hub count keyed by how many struts meet there. */
  hubs: { degree: number; count: number }[];
  /** True when every base vertex sits on the cut plane. */
  flatBase: boolean;
  /** Height difference between the lowest and highest rim hub. */
  baseVariationFactor: number;
  /** y of the cut plane (unit sphere). */
  baseY: number;
  heightFactor: number;
  floorRadiusFactor: number;
  floorAreaFactor: number;
  floorPerimeterFactor: number;
  surfaceAreaFactor: number;
  volumeFactor: number;
}

const EPS = 1e-6;

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const len = (a: Vec3) => Math.hypot(a[0], a[1], a[2]);
const normalize = (a: Vec3): Vec3 => {
  const l = len(a);
  return [a[0] / l, a[1] / l, a[2] / l];
};

/** Base solids, oriented with a vertex at the zenith. */
function baseSolid(kind: Polyhedron): { v: Vec3[]; f: [number, number, number][] } {
  if (kind === 'octahedron') {
    const v: Vec3[] = [[0, 1, 0], [1, 0, 0], [0, 0, 1], [-1, 0, 0], [0, 0, -1], [0, -1, 0]];
    const f: [number, number, number][] = [];
    for (let k = 0; k < 4; k++) {
      const a = 1 + k;
      const b = 1 + ((k + 1) % 4);
      f.push([0, a, b], [5, b, a]);
    }
    return { v, f };
  }
  const v: Vec3[] = [[0, 1, 0]];
  const y = 1 / Math.sqrt(5);
  const r = 2 / Math.sqrt(5);
  for (let k = 0; k < 5; k++) {
    const t = (k * 2 * Math.PI) / 5;
    v.push([r * Math.cos(t), y, r * Math.sin(t)]);
  }
  for (let k = 0; k < 5; k++) {
    const t = ((k + 0.5) * 2 * Math.PI) / 5;
    v.push([r * Math.cos(t), -y, r * Math.sin(t)]);
  }
  v.push([0, -1, 0]);
  const f: [number, number, number][] = [];
  for (let k = 0; k < 5; k++) {
    const u0 = 1 + k;
    const u1 = 1 + ((k + 1) % 5);
    const l0 = 6 + k;
    const l1 = 6 + ((k + 1) % 5);
    f.push([0, u1, u0], [u0, u1, l0], [l0, u1, l1], [11, l0, l1]);
  }
  return { v, f };
}

/** Class I subdivision of every face, projected to the unit sphere. */
function subdivide(kind: Polyhedron, freq: number) {
  const base = baseSolid(kind);
  const vertices: Vec3[] = [];
  const index = new Map<string, number>();
  const faces: [number, number, number][] = [];

  const vid = (p: Vec3) => {
    const n = normalize(p);
    const key = n.map((c) => Math.round(c * 1e6)).join(',');
    let i = index.get(key);
    if (i === undefined) {
      i = vertices.length;
      vertices.push(n);
      index.set(key, i);
    }
    return i;
  };

  for (const [ia, ib, ic] of base.f) {
    const A = base.v[ia];
    const B = base.v[ib];
    const C = base.v[ic];
    const P = (i: number, j: number) =>
      vid([
        A[0] + ((B[0] - A[0]) * i + (C[0] - A[0]) * j) / freq,
        A[1] + ((B[1] - A[1]) * i + (C[1] - A[1]) * j) / freq,
        A[2] + ((B[2] - A[2]) * i + (C[2] - A[2]) * j) / freq,
      ]);
    for (let i = 0; i < freq; i++) {
      for (let j = 0; i + j < freq; j++) {
        faces.push([P(i, j), P(i + 1, j), P(i, j + 1)]);
        if (i + j <= freq - 2) faces.push([P(i + 1, j), P(i + 1, j + 1), P(i, j + 1)]);
      }
    }
  }
  return { vertices, faces };
}

const triArea = (a: Vec3, b: Vec3, c: Vec3) => len(cross(sub(b, a), sub(c, a))) / 2;

export function buildDome(spec: DomeSpec): DomeGeometry {
  const sphere = subdivide(spec.polyhedron, spec.frequency);

  // Cut on the vertex layer closest to the nominal height that leaves a clean
  // rim (no hub with fewer than minHubDegree struts).
  const targetY = 1 - 2 * (spec.fraction[0] / spec.fraction[1]);
  const levels = [...new Set(sphere.vertices.map((p) => Math.round(p[1] * 1e6)))]
    .map((y) => y / 1e6)
    .filter((y) => y < 1 - EPS)
    .sort((a, b) => Math.abs(a - targetY) - Math.abs(b - targetY));
  const minHub = spec.minHubDegree ?? 4;
  for (const baseY of levels) {
    const dome = cutDome(spec, sphere, baseY);
    if (Math.min(...dome.hubs.map((h) => h.degree)) >= minHub) return dome;
  }
  throw new Error(`No clean cut for ${spec.name}`);
}

function cutDome(spec: DomeSpec, sphere: { vertices: Vec3[]; faces: [number, number, number][] }, baseY: number): DomeGeometry {
  const keptFaces = sphere.faces.filter((f) => f.every((i) => sphere.vertices[i][1] >= baseY - EPS));

  // Reindex to only the vertices the dome uses.
  const remap = new Map<number, number>();
  const vertices: Vec3[] = [];
  const faces = keptFaces.map(
    (f) =>
      f.map((i) => {
        let j = remap.get(i);
        if (j === undefined) {
          j = vertices.length;
          vertices.push(sphere.vertices[i]);
          remap.set(i, j);
        }
        return j;
      }) as [number, number, number],
  );

  // Edges, and how many faces share each (1 = on the base rim).
  const edgeUse = new Map<string, number>();
  for (const [a, b, c] of faces) {
    for (const [p, q] of [[a, b], [b, c], [c, a]]) {
      const key = p < q ? `${p}-${q}` : `${q}-${p}`;
      edgeUse.set(key, (edgeUse.get(key) ?? 0) + 1);
    }
  }
  const rawEdges = [...edgeUse.keys()].map((k) => k.split('-').map(Number) as [number, number]);

  // Group edges into strut types by length, shortest = A.
  const lengths = rawEdges.map(([a, b]) => len(sub(vertices[a], vertices[b])));
  const distinct: number[] = [];
  for (const l of [...lengths].sort((x, y) => x - y)) {
    if (!distinct.length || l - distinct[distinct.length - 1] > 1e-5) distinct.push(l);
  }
  const typeOf = (l: number) => distinct.findIndex((d) => Math.abs(d - l) <= 1e-5);
  const edges = rawEdges.map(([a, b], i) => [a, b, typeOf(lengths[i])] as [number, number, number]);
  const strutTypes: StrutType[] = distinct.map((d, i) => ({
    label: String.fromCharCode(65 + i),
    chordFactor: d,
    count: edges.filter((e) => e[2] === i).length,
  }));

  const degree = new Array(vertices.length).fill(0);
  for (const [a, b] of edges) {
    degree[a]++;
    degree[b]++;
  }
  const hubMap = new Map<number, number>();
  for (const d of degree) hubMap.set(d, (hubMap.get(d) ?? 0) + 1);
  const hubs = [...hubMap].map(([d, count]) => ({ degree: d, count })).sort((x, y) => y.degree - x.degree);

  // Base ring = vertices on rim edges, ordered around the axis.
  const rim = new Set<number>();
  for (const [key, uses] of edgeUse) {
    if (uses === 1) for (const i of key.split('-').map(Number)) rim.add(i);
  }
  const ring = [...rim]
    .map((i) => vertices[i])
    .sort((p, q) => Math.atan2(p[2], p[0]) - Math.atan2(q[2], q[0]));
  const rimYs = ring.map((p) => p[1]);
  const baseVariationFactor = Math.max(...rimYs) - Math.min(...rimYs);
  const flatBase = baseVariationFactor < 1e-4;

  let floorAreaFactor = 0;
  let floorPerimeterFactor = 0;
  for (let i = 0; i < ring.length; i++) {
    const p = ring[i];
    const q = ring[(i + 1) % ring.length];
    floorAreaFactor += p[0] * q[2] - q[0] * p[2];
    floorPerimeterFactor += Math.hypot(q[0] - p[0], q[2] - p[2]);
  }
  floorAreaFactor = Math.abs(floorAreaFactor) / 2;

  let surfaceAreaFactor = 0;
  let tetraSum = 0;
  for (const [a, b, c] of faces) {
    const A = vertices[a];
    const B = vertices[b];
    const C = vertices[c];
    surfaceAreaFactor += triArea(A, B, C);
    tetraSum += Math.abs(dot(A, cross(B, C))) / 6;
  }
  // Enclosed volume: fan of tetrahedra from the centre, corrected by the cone
  // from the centre to the floor (added below the equator, removed above it).
  const volumeFactor = tetraSum - (floorAreaFactor * baseY) / 3;

  return {
    spec,
    vertices,
    edges,
    faces,
    strutTypes,
    hubs,
    flatBase,
    baseVariationFactor,
    baseY,
    heightFactor: 1 - baseY,
    floorRadiusFactor: Math.sqrt(Math.max(0, 1 - baseY * baseY)),
    floorAreaFactor,
    floorPerimeterFactor,
    surfaceAreaFactor,
    volumeFactor,
  };
}

/**
 * One face of the base solid, subdivided, laid flat for diagrams. Edges carry
 * their strut type (A = shortest) as it appears on the sphere.
 */
export function frequencyTriangle(kind: Polyhedron, freq: number) {
  const base = baseSolid(kind);
  const [ia, ib, ic] = base.f[0];
  const [A, B, C] = [base.v[ia], base.v[ib], base.v[ic]];
  const at = (i: number, j: number): Vec3 =>
    normalize([
      A[0] + ((B[0] - A[0]) * i + (C[0] - A[0]) * j) / freq,
      A[1] + ((B[1] - A[1]) * i + (C[1] - A[1]) * j) / freq,
      A[2] + ((B[2] - A[2]) * i + (C[2] - A[2]) * j) / freq,
    ]);
  // Flat layout: apex on top, i runs down-left, j down-right.
  const flat = (i: number, j: number): [number, number] => [(j - i) / 2, ((i + j) * Math.sqrt(3)) / 2];
  const edges: { a: [number, number]; b: [number, number]; length: number }[] = [];
  for (let i = 0; i < freq; i++) {
    for (let j = 0; i + j < freq; j++) {
      const tri: [number, number][] = [[i, j], [i + 1, j], [i, j + 1]];
      for (let k = 0; k < 3; k++) {
        const [p, q] = [tri[k], tri[(k + 1) % 3]];
        edges.push({ a: flat(...p), b: flat(...q), length: len(sub(at(...p), at(...q))) });
      }
    }
  }
  const distinct: number[] = [];
  for (const l of edges.map((e) => e.length).sort((x, y) => x - y)) {
    if (!distinct.length || l - distinct[distinct.length - 1] > 1e-5) distinct.push(l);
  }
  return {
    size: freq,
    edges: edges.map((e) => ({ ...e, type: distinct.findIndex((d) => Math.abs(d - e.length) <= 1e-5) })),
  };
}
