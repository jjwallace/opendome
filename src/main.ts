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
import { CAPACITY_FT2, STRUT_MATERIALS, baseShims, courses, cutListCsv, domeObj, domeStl, download, panelTypes } from './analysis';
import { DOMES } from './domes';
import { type DomeGeometry, buildDome } from './geodesic';
import { Wiki } from './wiki';
import { MainView, ThumbnailRenderer, type Timeline } from './scene';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

// Left to right from simplest to most complex.
const geometries = DOMES.map(buildDome).sort((a, b) => a.edges.length - b.edges.length);
const indexOf = (id: string) => geometries.findIndex((g) => g.spec.id === id);

const state = {
  index: indexOf('3v-5-8'),
  unit: 'ft' as Unit,
  /** Sphere radius in the current unit. The original calculator opened on a 24 ft dome. */
  radius: 12,
  hover: -1,
};

// ---------------------------------------------------------------- routes

type Route = { page: 'calc'; id?: string } | { page: 'wiki'; slug?: string };

/** `#/calc/<dome>`, `#/wiki/<page>`; a bare `#<dome>` is the old calculator link. */
function parseRoute(hash: string): Route {
  const [page, arg] = hash.replace(/^#\/?/, '').split('/');
  if (page === 'wiki' || page === 'info') return { page: 'wiki', slug: arg };
  if (page === 'calc' || page === '') return { page: 'calc', id: arg };
  return { page: 'calc', id: page };
}

const initialRoute = parseRoute(location.hash);
if (initialRoute.page === 'calc' && initialRoute.id && indexOf(initialRoute.id) >= 0) state.index = indexOf(initialRoute.id);

const current = () => geometries[state.index];

// ---------------------------------------------------------------- preview boxes

/** The 3D views need WebGL; without it the calculator and wiki still work. */
function tryWebGL<T>(make: () => T): T | undefined {
  try {
    return make();
  } catch {
    return undefined;
  }
}

const thumbs = tryWebGL(() => new ThumbnailRenderer(240, 180));
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
  thumbs?.add(canvas, g);
  return box;
});

// ---------------------------------------------------------------- main view

const view = thumbs && tryWebGL(() => new MainView($('viewer')));
if (!view) $('viewer').innerHTML = '<p class="no-webgl">3D preview needs WebGL, which this browser has turned off.</p>';
$<HTMLInputElement>('opt-rotate').addEventListener('change', (e) => {
  if (view) view.autoRotate = (e.target as HTMLInputElement).checked;
});
$<HTMLInputElement>('opt-guides').addEventListener('change', (e) => {
  view?.setGuides((e.target as HTMLInputElement).checked);
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
  material: $<HTMLSelectElement>('m-material'),
};
mat.material.innerHTML = STRUT_MATERIALS.map((m) => `<option value="${m.id}">${m.name}</option>`).join('');
mat.material.value = 'emt-34';
mat.stock.value = '10';
mat.kerf.value = '0.125';
for (const el of Object.values(mat)) el.addEventListener('input', () => update());

for (const b of document.querySelectorAll<HTMLButtonElement>('[data-export]')) {
  b.addEventListener('click', () => {
    const g = current();
    const name = `${g.spec.id}-${fixed(2 * state.radius, 1).replace('.', '_')}${state.unit}`;
    if (b.dataset.export === 'csv') download(`${name}-cut-list.csv`, cutListCsv(g, state.radius, state.unit), 'text/csv');
    if (b.dataset.export === 'obj') download(`${name}.obj`, domeObj(g, state.radius, state.unit), 'model/obj');
    if (b.dataset.export === 'stl') download(`${name}.stl`, domeStl(g, state.radius), 'model/stl');
  });
}

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

  function frameWeight() {
    const m = STRUT_MATERIALS.find((x) => x.id === mat.material.value) ?? STRUT_MATERIALS[0];
    const feet = u === 'ft' ? totalLength : totalLength * FT_PER_M;
    const lb = feet * m.lbPerFt;
    return u === 'ft' ? `${fixed(lb, 0)} lb` : `${fixed(lb * 0.4536, 0)} kg`;
  }
  $('weight-out').innerHTML = `<dt>Frame weight</dt><dd>${frameWeight()}</dd><dt>Total strut length</dt><dd>${fixed(totalLength, 1)} ${u}</dd>`;
  renderPlanning(g, r);
}

const tag = (label: string) => {
  const i = label.charCodeAt(0) - 65;
  return `<span class="tag" style="background:${STRUT_COLORS[i]}">${label}</span>`;
};

function renderPlanning(g: DomeGeometry, r: number) {
  const u = state.unit;
  const panels = panelTypes(g);
  $('panels').innerHTML = panels
    .map(
      (p) => `<tr>
        <td>${[...p.key].map(tag).join('')}</td>
        <td>${p.count}</td>
        <td>${p.sides.map((s) => fixed(s * r)).join(' · ')}</td>
        <td>${fixed(p.areaFactor * r * r, 1)} ${u}²</td>
      </tr>`,
    )
    .join('');
  $('panels-total').innerHTML = `<tr><td></td><td>${g.faces.length}</td><td></td><td>${fixed(g.surfaceAreaFactor * r * r, 0)} ${u}²</td></tr>`;

  const shims = baseShims(g);
  $('shims').innerHTML =
    shims.length === 1
      ? `<p class="ok">Flat base: all ${shims[0].hubs} base hubs sit at the same height.</p>`
      : `<p class="muted">Base hubs sit at ${shims.length} heights. To level the base, raise the lower hubs (shims, blocks or a riser) by:</p>
        <ul class="hubs">${shims
          .map((s) => {
            const raise = (shims[shims.length - 1].lift - s.lift) * r;
            return `<li><span>${s.hubs} hubs</span><b>${raise > 1e-9 ? `raise ${precise(raise, u)}` : 'highest: no change'}</b></li>`;
          })
          .join('')}</ul>`;

  $('courses').innerHTML = courses(g)
    .map((c) => `<li>${c.map((n, i) => (n ? `<span class="course-item">${n}× ${tag(g.strutTypes[i].label)}</span>` : '')).join('')}</li>`)
    .join('');

  const floorFt2 = g.floorAreaFactor * r * r * (u === 'ft' ? 1 : FT_PER_M * FT_PER_M);
  const people = (per: number) => Math.floor(floorFt2 / per);
  $('capacity').innerHTML = `
    <div><b>${people(CAPACITY_FT2.standing)}</b>standing</div>
    <div><b>${people(CAPACITY_FT2.seated)}</b>seated in rows</div>
    <div><b>${people(CAPACITY_FT2.banquet)}</b>at tables</div>
    <div><b>${Math.floor(people(CAPACITY_FT2.banquet * 3))}</b>sleeping</div>`;
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
    duration: 440,
    delay: ms,
    easing: spring,
    fill: 'backwards',
  });
  entry.wrap.animate([{ opacity: 0, transform: 'translateX(36px) scale(.8)' }, { opacity: 1, transform: 'none' }], {
    duration: 480,
    delay: ms + 40,
    easing: spring,
    fill: 'backwards',
  });
  entry.input.animate(
    [{ boxShadow: `0 0 0 0 ${entry.pill.bg}` }, { boxShadow: `0 0 0 10px ${entry.pill.bg}00` }],
    { duration: 650, delay: ms + 480, easing: 'ease-out' },
  );
  countUps.set(key, { at: performance.now() + ms + 40, dur: 550 });
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
  for (const key of ['D', 'R', 'H', 'C', 'A'] as const) arrivePill(key, tl.guides[key]);
}

function select(i: number) {
  const g = geometries[i];
  const first = generation === 0;
  generation++;
  countUps.clear();
  state.index = i;
  boxes.forEach((b, j) => b.classList.toggle('on', j === i));
  boxes[i].scrollIntoView({ block: 'nearest', inline: 'nearest' });
  if (currentPage === 'calc') history.replaceState(null, '', `#/calc/${g.spec.id}`);
  if (!first) leavePills();

  const tl: Timeline = view?.show(g) ?? {
    enter: 0,
    struts: g.strutTypes.map((_, t) => 0.1 + t * 0.14),
    guides: { C: 0.5, D: 0.6, R: 0.7, H: 0.8, A: 0.9 },
    done: 1,
  };
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
  if (e.target instanceof HTMLInputElement || currentPage !== 'calc') return;
  if (e.key === 'ArrowRight') select((state.index + 1) % geometries.length);
  if (e.key === 'ArrowLeft') select((state.index - 1 + geometries.length) % geometries.length);
});

const pages = { calc: $('page-calc'), wiki: $('page-wiki') };
const ORDER = ['calc', 'wiki'] as const;
let currentPage: Route['page'] = initialRoute.page;
let wiki: Wiki | undefined;
let routeGen = 0;

function moveTabInk() {
  const tab = document.querySelector<HTMLElement>(`.tabs a[data-route="${currentPage}"]`);
  const ink = document.querySelector<HTMLElement>('.tab-ink');
  if (!tab || !ink) return;
  for (const a of document.querySelectorAll<HTMLElement>('.tabs a')) a.classList.toggle('on', a === tab);
  ink.style.width = `${tab.offsetWidth}px`;
  ink.style.transform = `translateX(${tab.offsetLeft}px)`;
  $('units').classList.toggle('off', currentPage !== 'calc');
}

function ensureWiki() {
  wiki ??= new Wiki(pages.wiki, geometries);
  return wiki;
}

function arrive(route: Route) {
  if (route.page === 'calc') {
    const i = route.id ? indexOf(route.id) : -1;
    // Coming back to the calculator replays the assembly.
    select(i >= 0 ? i : state.index);
  } else {
    ensureWiki().show(route.slug, false);
  }
}

/** Slide pages in the direction of the tab order: the old page drifts out, the new one glides in. */
async function go(route: Route) {
  const gen = ++routeGen;
  if (route.page === currentPage) {
    if (route.page === 'calc') {
      const i = route.id ? indexOf(route.id) : -1;
      if (i >= 0 && i !== state.index) select(i);
    } else ensureWiki().show(route.slug, true);
    return;
  }
  const from = pages[currentPage];
  const to = pages[route.page];
  const dir = ORDER.indexOf(route.page) > ORDER.indexOf(currentPage) ? 1 : -1;
  currentPage = route.page;
  moveTabInk();
  if (route.page === 'wiki') ensureWiki();

  await from
    .animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateX(${-48 * dir}px) scale(.985)` }], {
      duration: 200,
      easing: 'cubic-bezier(.5,0,.75,0)',
      fill: 'forwards',
    })
    .finished.catch(() => undefined);
  if (gen !== routeGen) return;
  from.hidden = true;
  from.getAnimations().forEach((a) => a.cancel());
  to.hidden = false;
  window.scrollTo({ top: 0 });
  to.animate([{ opacity: 0, transform: `translateX(${64 * dir}px)` }, { opacity: 1, transform: 'none' }], {
    duration: 460,
    easing: 'cubic-bezier(.2,.9,.3,1)',
  });
  if (route.page === 'calc') history.replaceState(null, '', `#/calc/${current().spec.id}`);
  arrive(route);
}

window.addEventListener('hashchange', () => go(parseRoute(location.hash)));
window.addEventListener('resize', moveTabInk);

pages.calc.hidden = currentPage !== 'calc';
pages.wiki.hidden = currentPage !== 'wiki';
if (initialRoute.page === 'wiki') ensureWiki().show(initialRoute.slug, false);
else select(state.index);
moveTabInk();
document.fonts?.ready.then(moveTabInk);

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
  if (!pages.calc.hidden) {
    thumbs?.render(dt, (i) => i === state.index || i === state.hover);
    view?.render();
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
