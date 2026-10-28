import './style.css';
import {
  DIM_COLORS,
  FT_PER_M,
  STRUT_COLORS,
  type Unit,
  fields,
  fixed,
  precise,
  radiusFrom,
  stockNeeded,
  valueOf,
} from './calc';
import { DOMES } from './domes';
import { type DomeGeometry, buildDome } from './geodesic';
import { MainView, ThumbnailRenderer } from './scene';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const geometries = DOMES.map(buildDome);

const state = {
  index: Math.max(0, DOMES.findIndex((d) => d.id === location.hash.slice(1))),
  unit: 'ft' as Unit,
  /** Sphere radius in the current unit. The original calculator opened on a 24 ft dome. */
  radius: 12,
  hover: -1,
};
if (!location.hash) state.index = DOMES.findIndex((d) => d.id === '3v-5-8');

const current = () => geometries[state.index];

// ---------------------------------------------------------------- preview boxes

const thumbs = new ThumbnailRenderer(240, 180);
const picker = $('picker');
const boxes = geometries.map((g, i) => {
  const box = document.createElement('button');
  box.className = 'dome-box';
  box.type = 'button';
  const canvas = document.createElement('canvas');
  const lengths = g.strutTypes.length;
  box.innerHTML = `
    <span class="name">${g.spec.name}</span>
    <span class="meta">${g.edges.length} struts · ${lengths} length${lengths > 1 ? 's' : ''} · ${g.vertices.length} hubs</span>
    <span class="swatches">${g.strutTypes.map((_, t) => `<i style="background:${STRUT_COLORS[t]}"></i>`).join('')}</span>`;
  box.prepend(canvas);
  box.addEventListener('click', () => select(i));
  box.addEventListener('pointerenter', () => (state.hover = i));
  box.addEventListener('pointerleave', () => (state.hover = -1));
  picker.appendChild(box);
  thumbs.add(canvas, g);
  return box;
});

// ---------------------------------------------------------------- main view

const view = new MainView($('viewer'));
$<HTMLInputElement>('opt-rotate').addEventListener('change', (e) => {
  view.autoRotate = (e.target as HTMLInputElement).checked;
});
$<HTMLInputElement>('opt-guides').addEventListener('change', (e) => {
  view.setGuides((e.target as HTMLInputElement).checked);
});

// ---------------------------------------------------------------- calculator pills

interface Pill {
  key: string;
  label: string;
  labelColor: string;
  bg: string;
  dark: boolean;
  sub: (value: number) => string;
}

const unitLabel = () => state.unit;
const areaLabel = () => `${state.unit}²`;

function strutPills(g: DomeGeometry): Pill[] {
  return g.strutTypes.map((t, i) => ({
    key: `strut-${t.label}`,
    label: `${t.count} ×`,
    labelColor: STRUT_COLORS[i],
    bg: STRUT_COLORS[i],
    dark: false,
    sub: (v) => `${t.label} · ${precise(v, state.unit)}`,
  }));
}

const DIM_PILLS: Pill[] = [
  { key: 'D', label: 'D', labelColor: DIM_COLORS.D, bg: DIM_COLORS.D, dark: false, sub: () => `Sphere diameter, ${unitLabel()}` },
  { key: 'R', label: 'R', labelColor: DIM_COLORS.R, bg: DIM_COLORS.R, dark: false, sub: () => `Radius, ${unitLabel()}` },
  { key: 'A', label: 'A', labelColor: '#ffffff', bg: DIM_COLORS.A, dark: true, sub: () => `Floor area, ${areaLabel()}` },
  { key: 'C', label: 'C', labelColor: '#999999', bg: DIM_COLORS.C, dark: true, sub: () => `Floor perimeter, ${unitLabel()}` },
  { key: 'H', label: 'H', labelColor: DIM_COLORS.H, bg: DIM_COLORS.H, dark: true, sub: () => `Height, ${unitLabel()}` },
];

const inputs = new Map<string, { input: HTMLInputElement; sub: HTMLElement; pill: Pill }>();

function buildPills(form: HTMLElement, pills: Pill[]) {
  form.innerHTML = '';
  for (const pill of pills) {
    const label = document.createElement('label');
    label.textContent = pill.label;
    label.style.color = pill.labelColor;
    label.htmlFor = `pill-${pill.key}`;
    const wrap = document.createElement('div');
    wrap.className = 'pill-wrap';
    const input = document.createElement('input');
    input.id = `pill-${pill.key}`;
    input.className = `pill${pill.dark ? ' dark' : ''}`;
    input.inputMode = 'decimal';
    input.style.background = pill.bg;
    const sub = document.createElement('span');
    sub.className = 'pill-sub';
    wrap.append(input, sub);
    form.append(label, wrap);

    input.addEventListener('focus', () => input.select());
    input.addEventListener('input', () => {
      const value = Number.parseFloat(input.value.replace(/,/g, ''));
      const field = fields(current()).find((f) => f.key === pill.key);
      if (!field || !(value > 0)) return;
      state.radius = radiusFrom(field, value);
      update(pill.key);
    });
    input.addEventListener('blur', () => update());
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') input.blur();
    });
    inputs.set(pill.key, { input, sub, pill });
  }
}

for (const form of [$('struts'), $('dims')]) form.addEventListener('submit', (e) => e.preventDefault());

// ---------------------------------------------------------------- materials

const mat = {
  stock: $<HTMLInputElement>('m-stock'),
  kerf: $<HTMLInputElement>('m-kerf'),
  price: $<HTMLInputElement>('m-price'),
  hub: $<HTMLInputElement>('m-hub'),
  cover: $<HTMLInputElement>('m-cover'),
};
mat.stock.value = '10';
mat.kerf.value = '0.125';
for (const el of Object.values(mat)) el.addEventListener('input', () => update());

const num = (el: HTMLInputElement) => Math.max(0, Number.parseFloat(el.value) || 0);
const smallUnit = () => (state.unit === 'ft' ? 'in' : 'mm');
/** Kerf is entered in inches or millimetres. */
const kerfInUnit = () => (state.unit === 'ft' ? num(mat.kerf) / 12 : num(mat.kerf) / 1000);

// ---------------------------------------------------------------- render

function update(editing?: string) {
  const g = current();
  const r = state.radius;

  for (const f of fields(g)) {
    const entry = inputs.get(f.key);
    if (!entry) continue;
    const v = valueOf(f, r);
    if (f.key !== editing) entry.input.value = fixed(v);
    entry.sub.textContent = entry.pill.sub(v);
  }

  const u = state.unit;
  const badges = [
    `Floor Ø ${fixed(2 * g.floorRadiusFactor * r)} ${u}`,
    `Surface ${fixed(g.surfaceAreaFactor * r * r, 1)} ${u}²`,
    `Volume ${fixed(g.volumeFactor * r ** 3, 0)} ${u}³`,
  ];
  const variation = g.baseVariationFactor * r;
  $('badges').innerHTML =
    badges.map((b) => `<span>${b}</span>`).join('') +
    (g.flatBase
      ? '<span>Flat base</span>'
      : `<span class="warn">Base uneven by ${precise(variation, u)}: shim or use a riser wall</span>`);

  // Cut list
  let totalLength = 0;
  $('cutlist').innerHTML = g.strutTypes
    .map((t, i) => {
      const l = t.chordFactor * r;
      totalLength += l * t.count;
      return `<tr>
        <td><span class="tag" style="background:${STRUT_COLORS[i]}">${t.label}</span></td>
        <td>${t.count}</td>
        <td>${t.chordFactor.toFixed(5)}</td>
        <td>${fixed(l)} ${u}</td>
        <td>${precise(l, u)}</td>
      </tr>`;
    })
    .join('');
  $('cutlist-total').innerHTML = `<tr><td></td><td>${g.edges.length}</td><td></td><td colspan="2">${fixed(totalLength, 1)} ${u} total</td></tr>`;

  // Hubs: one bolt and two washers per hub, as in the original kit.
  const hubs = g.vertices.length;
  $('hardware').innerHTML = `
    <div><b>${hubs}</b>hubs / bolts</div>
    <div><b>${hubs * 2}</b>washers</div>
    <div><b>${g.edges.length * 2}</b>strut ends</div>`;
  $('hubs').innerHTML = g.hubs.map((h) => `<li><span>${h.degree}-way hub</span><b>${h.count}</b></li>`).join('');

  // Materials
  for (const el of document.querySelectorAll('[data-u]')) el.textContent = u;
  for (const el of document.querySelectorAll('[data-u-small]')) el.textContent = smallUnit();
  for (const el of document.querySelectorAll('[data-u2]')) el.textContent = `${u}²`;
  const stock = num(mat.stock);
  const lengths = g.strutTypes.flatMap((t) => Array<number>(t.count).fill(t.chordFactor * r));
  const { sticks, offcut } = stock > 0 ? stockNeeded(lengths, stock, kerfInUnit()) : { sticks: Number.POSITIVE_INFINITY, offcut: 0 };
  const surface = g.surfaceAreaFactor * r * r;
  const strutCost = Number.isFinite(sticks) ? sticks * num(mat.price) : 0;
  const hubCost = hubs * num(mat.hub);
  const coverCost = surface * num(mat.cover);
  $('mat-out').innerHTML = Number.isFinite(sticks)
    ? `<dt>Sticks of stock</dt><dd>${sticks}</dd>
       <dt>Offcut waste</dt><dd>${fixed(offcut, 1)} ${u}</dd>
       <dt>Struts</dt><dd>$${fixed(strutCost)}</dd>
       <dt>Hub hardware</dt><dd>$${fixed(hubCost)}</dd>
       <dt>Cover (${fixed(surface, 0)} ${u}²)</dt><dd>$${fixed(coverCost)}</dd>
       <dt class="grand">Total</dt><dd class="grand">$${fixed(strutCost + hubCost + coverCost)}</dd>`
    : `<dt>Longest strut is longer than the stock length.</dt><dd></dd>`;
}

function select(i: number) {
  state.index = i;
  const g = current();
  boxes.forEach((b, j) => b.classList.toggle('on', j === i));
  boxes[i].scrollIntoView({ block: 'nearest', inline: 'nearest' });
  history.replaceState(null, '', `#${g.spec.id}`);
  $('dome-name').textContent = g.spec.name;
  $('dome-blurb').textContent = g.spec.blurb;
  buildPills($('struts'), strutPills(g));
  buildPills($('dims'), DIM_PILLS);
  view.show(g);
  update();
}

function setUnit(unit: Unit) {
  if (unit === state.unit) return;
  const k = unit === 'm' ? 1 / FT_PER_M : FT_PER_M;
  state.radius *= k;
  mat.stock.value = unit === 'm' ? '3' : '10';
  mat.kerf.value = unit === 'm' ? '3' : '0.125';
  mat.cover.value = fixed(num(mat.cover) / (k * k));
  state.unit = unit;
  for (const b of document.querySelectorAll<HTMLButtonElement>('.units button')) {
    b.classList.toggle('on', b.dataset.unit === unit);
  }
  update();
}

for (const b of document.querySelectorAll<HTMLButtonElement>('.units button')) {
  b.addEventListener('click', () => setUnit(b.dataset.unit as Unit));
}

window.addEventListener('keydown', (e) => {
  if (e.target instanceof HTMLInputElement) return;
  if (e.key === 'ArrowRight') select((state.index + 1) % geometries.length);
  if (e.key === 'ArrowLeft') select((state.index - 1 + geometries.length) % geometries.length);
});

select(state.index);

let last = performance.now();
function frame(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  thumbs.render(dt, (i) => i === state.index || i === state.hover);
  view.render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
