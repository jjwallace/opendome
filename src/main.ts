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
import { MainView, ThumbnailRenderer, type Timeline } from './scene';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

// Left to right from simplest to most complex.
const geometries = DOMES.map(buildDome).sort((a, b) => a.edges.length - b.edges.length);
const indexOf = (id: string) => geometries.findIndex((g) => g.spec.id === id);

const state = {
  index: Math.max(0, indexOf(location.hash.slice(1))),
  unit: 'ft' as Unit,
  /** Sphere radius in the current unit. The original calculator opened on a 24 ft dome. */
  radius: 12,
  hover: -1,
};
if (!location.hash) state.index = indexOf('3v-5-8');

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
  /** Strut count shown in the label, counted up as the pill arrives. */
  count?: number;
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
    count: t.count,
  }));
}

const DIM_PILLS: Pill[] = [
  { key: 'D', label: 'D', labelColor: DIM_COLORS.D, bg: DIM_COLORS.D, dark: false, sub: () => `Sphere diameter, ${unitLabel()}` },
  { key: 'R', label: 'R', labelColor: DIM_COLORS.R, bg: DIM_COLORS.R, dark: false, sub: () => `Radius, ${unitLabel()}` },
  { key: 'A', label: 'A', labelColor: '#ffffff', bg: DIM_COLORS.A, dark: true, sub: () => `Floor area, ${areaLabel()}` },
  { key: 'C', label: 'C', labelColor: '#999999', bg: DIM_COLORS.C, dark: true, sub: () => `Floor perimeter, ${unitLabel()}` },
  { key: 'H', label: 'H', labelColor: DIM_COLORS.H, bg: DIM_COLORS.H, dark: true, sub: () => `Height, ${unitLabel()}` },
];

const inputs = new Map<string, { input: HTMLInputElement; sub: HTMLElement; label: HTMLLabelElement; wrap: HTMLElement; pill: Pill }>();

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

    input.addEventListener('focus', () => {
      countUps.delete(pill.key);
      input.select();
    });
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
    inputs.set(pill.key, { input, sub, label, wrap, pill });
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
    if (f.key !== editing && !countUps.has(f.key)) entry.input.value = fixed(v);
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

// ---------------------------------------------------------------- transitions

/** Callbacks on the animation clock, dropped when a newer selection starts. */
let generation = 0;
const tasks: { at: number; gen: number; run: () => void }[] = [];
const later = (seconds: number, run: () => void) => tasks.push({ at: performance.now() + seconds * 1000, gen: generation, run });

/** Pill values counting up from zero while they arrive. */
const countUps = new Map<string, { at: number; dur: number }>();
const easeOut = (x: number) => 1 - (1 - x) ** 3;

function leavePills() {
  let k = 0;
  for (const { label, wrap } of inputs.values()) {
    for (const el of [label, wrap]) {
      el.animate([{ opacity: 1 }, { opacity: 0, transform: 'translateX(-24px)' }], {
        duration: 160,
        delay: k * 12,
        easing: 'ease-in',
        fill: 'forwards',
      });
    }
    k++;
  }
  for (const el of [$('dome-name'), $('dome-blurb'), $('badges')]) {
    el.animate([{ opacity: 1 }, { opacity: 0, transform: 'translateY(-6px)' }], { duration: 160, fill: 'forwards' });
  }
}

/** A pill arrives at `delay` seconds: label and pill slide together, the value counts up, then it glows in its colour. */
function arrivePill(key: string, delay: number) {
  const entry = inputs.get(key);
  if (!entry) return;
  const ms = delay * 1000;
  const spring = 'cubic-bezier(.2,1.5,.45,1)';
  entry.label.animate([{ opacity: 0, transform: 'translateX(-28px)' }, { opacity: 1, transform: 'none' }], {
    duration: 520,
    delay: ms,
    easing: spring,
    fill: 'backwards',
  });
  entry.wrap.animate([{ opacity: 0, transform: 'translateX(36px) scale(.8)' }, { opacity: 1, transform: 'none' }], {
    duration: 560,
    delay: ms + 40,
    easing: spring,
    fill: 'backwards',
  });
  entry.input.animate(
    [{ boxShadow: `0 0 0 0 ${entry.pill.bg}` }, { boxShadow: `0 0 0 10px ${entry.pill.bg}00` }],
    { duration: 650, delay: ms + 560, easing: 'ease-out' },
  );
  countUps.set(key, { at: performance.now() + ms + 40, dur: 700 });
  entry.input.value = fixed(0);
  if (entry.pill.count) entry.label.textContent = '0 ×';
}

/**
 * Strut pills arrive as the first struts of their colour land; dimension pills
 * arrive with their guide line. Cues closer than GAP are pushed apart so each
 * one reads on its own.
 */
function arrivePills(g: DomeGeometry, tl: Timeline) {
  const GAP = 0.14;
  const order = g.strutTypes.map((t, i) => ({ key: `strut-${t.label}`, at: tl.struts[i] })).sort((a, b) => a.at - b.at);
  let prev = Number.NEGATIVE_INFINITY;
  for (const cue of order) {
    prev = Math.max(cue.at, prev + GAP);
    arrivePill(cue.key, prev);
  }
  for (const key of ['C', 'D', 'R', 'H', 'A'] as const) arrivePill(key, tl.guides[key]);
}

function select(i: number) {
  const g = geometries[i];
  const first = generation === 0;
  generation++;
  countUps.clear();
  state.index = i;
  boxes.forEach((b, j) => b.classList.toggle('on', j === i));
  boxes[i].scrollIntoView({ block: 'nearest', inline: 'nearest' });
  history.replaceState(null, '', `#${g.spec.id}`);
  if (!first) leavePills();

  const tl = view.show(g);
  later(tl.enter, () => {
    $('dome-name').textContent = g.spec.name;
    $('dome-blurb').textContent = g.spec.blurb;
    inputs.clear();
    buildPills($('struts'), strutPills(g));
    buildPills($('dims'), DIM_PILLS);
    const fromNow = (t: number) => t - tl.enter;
    const struts = tl.struts.map(fromNow);
    const guides = Object.fromEntries(Object.entries(tl.guides).map(([k, t]) => [k, fromNow(t)])) as Timeline['guides'];
    arrivePills(g, { ...tl, struts, guides });
    for (const el of [$('dome-name'), $('dome-blurb')]) {
      el.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], {
        duration: 420,
        delay: el.id === 'dome-name' ? 0 : 120,
        easing: 'ease-out',
        fill: 'both',
      });
    }
    $('badges').animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], {
      duration: 400,
      delay: fromNow(tl.done) * 1000,
      easing: 'ease-out',
      fill: 'both',
    });
    update();
  });
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
  for (let i = tasks.length - 1; i >= 0; i--) {
    const task = tasks[i];
    if (task.gen !== generation) tasks.splice(i, 1);
    else if (now >= task.at) {
      tasks.splice(i, 1);
      task.run();
    }
  }
  const g = current();
  for (const [key, cu] of countUps) {
    const entry = inputs.get(key);
    const field = fields(g).find((f) => f.key === key);
    if (!entry || !field) {
      countUps.delete(key);
      continue;
    }
    const k = Math.min(1, Math.max(0, (now - cu.at) / cu.dur));
    const e = easeOut(k);
    entry.input.value = fixed(valueOf(field, state.radius) * e);
    if (entry.pill.count) entry.label.textContent = `${Math.round(entry.pill.count * e)} ×`;
    if (k >= 1) countUps.delete(key);
  }
  thumbs.render(dt, (i) => i === state.index || i === state.hover);
  view.render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
