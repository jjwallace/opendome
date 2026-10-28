import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { DIM_COLORS, STRUT_COLORS } from './calc';
import type { DomeGeometry } from './geodesic';

const UP = new THREE.Vector3(0, 1, 0);
const PANEL_OPACITY = 0.6;

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const easeOutQuart = (x: number) => 1 - (1 - x) ** 4;
const easeInCubic = (x: number) => x * x * x;
const easeOutBack = (x: number) => 1 + 2.4 * (x - 1) ** 3 + 1.4 * (x - 1) ** 2;
/** Deterministic 0..1 noise per index, so a dome assembles the same way every time. */
const noise = (i: number) => {
  const s = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
};

/** Dome on the unit sphere, translated so its base rests on y = 0. */
export function domeObject(g: DomeGeometry, opts: { strut: number; hub: number }): THREE.Group {
  const group = new THREE.Group();
  const v = g.vertices.map(([x, y, z]) => new THREE.Vector3(x, y - g.baseY, z));
  group.add(new THREE.Mesh(panelGeometry(g, v), panelMaterial()));

  const struts = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(opts.strut, opts.strut, 1, 8, 1),
    new THREE.MeshStandardMaterial({ roughness: 0.45, metalness: 0.1 }),
    g.edges.length,
  );
  const m = new THREE.Matrix4();
  const color = new THREE.Color();
  g.edges.forEach(([a, b, type], i) => {
    const { mid, quat, scale } = strutPose(v[a], v[b]);
    struts.setMatrixAt(i, m.compose(mid, quat, scale));
    struts.setColorAt(i, color.set(STRUT_COLORS[type % STRUT_COLORS.length]));
  });
  group.add(struts);
  return group;
}

function strutPose(a: THREE.Vector3, b: THREE.Vector3) {
  const dir = b.clone().sub(a);
  return {
    mid: a.clone().add(b).multiplyScalar(0.5),
    quat: new THREE.Quaternion().setFromUnitVectors(UP, dir.clone().normalize()),
    scale: new THREE.Vector3(1, dir.length(), 1),
  };
}

function panelGeometry(g: DomeGeometry, v: THREE.Vector3[]) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(g.faces.flatMap((f) => f.flatMap((i) => v[i].toArray())), 3));
  geo.computeVertexNormals();
  return geo;
}

const panelMaterial = () =>
  new THREE.MeshStandardMaterial({
    color: 0x0a0a0a,
    transparent: true,
    opacity: PANEL_OPACITY,
    side: THREE.DoubleSide,
    depthWrite: false,
    roughness: 0.9,
  });

/** Standard material with a per-instance `instanceAlpha` attribute. */
function fadingMaterial(params: THREE.MeshStandardMaterialParameters) {
  const mat = new THREE.MeshStandardMaterial({ ...params, transparent: true });
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = `attribute float instanceAlpha;\nvarying float vInstanceAlpha;\n${shader.vertexShader.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\n  vInstanceAlpha = instanceAlpha;',
    )}`;
    shader.fragmentShader = `varying float vInstanceAlpha;\n${shader.fragmentShader.replace(
      '#include <dithering_fragment>',
      '#include <dithering_fragment>\n  gl_FragColor.a *= vInstanceAlpha;',
    )}`;
  };
  mat.customProgramCacheKey = () => 'instance-alpha';
  return mat;
}

function dispose(obj: THREE.Object3D) {
  obj.traverse((o) => {
    const mesh = o as THREE.Mesh;
    mesh.geometry?.dispose();
    const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
    if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
    else mat?.dispose();
  });
}

function lights(scene: THREE.Scene) {
  scene.add(new THREE.HemisphereLight(0xffffff, 0x303030, 1.6));
  const key = new THREE.DirectionalLight(0xffffff, 1.8);
  key.position.set(3, 5, 4);
  scene.add(key);
}

/** Seconds from `show()` at which each part of the arriving dome lands. */
export interface Timeline {
  /** When the old dome has gone and the new one starts arriving. */
  enter: number;
  /** First landing of each strut type, by index. */
  struts: number[];
  guides: { C: number; D: number; R: number; H: number; A: number };
  done: number;
}

const FLY = 0.95;
const HUB_POP = 0.35;
const LEAVE = 0.32;
const LEAVE_STAGGER = 0.14;
const GUIDE_DRAW = 0.5;

interface Guide {
  line: THREE.Line;
  start: number;
  /** Grows along this axis from its origin, or by draw range when null. */
  axis: 'x' | 'y' | null;
  points: number;
}

/**
 * One dome in the main view, with its assembly and teardown animation.
 * Struts never rotate: they translate along a fixed line and fade in or out.
 */
class AssembledDome {
  readonly group = new THREE.Group();
  readonly guides = new THREE.Group();
  readonly timeline: Omit<Timeline, 'enter'>;

  private struts: THREE.InstancedMesh;
  private hubs: THREE.InstancedMesh;
  private panels: THREE.MeshStandardMaterial;
  private guideParts: Guide[] = [];
  private strutAlpha: THREE.InstancedBufferAttribute;
  private hubAlpha: THREE.InstancedBufferAttribute;

  private home: THREE.Vector3[];
  private quat: THREE.Quaternion[];
  private scale: THREE.Vector3[];
  private from: THREE.Vector3[];
  private delay: number[];
  private hubHome: THREE.Vector3[];
  private hubFrom: THREE.Vector3[];
  private hubDelay: number[];
  private panelStart: number;

  /** Rendered state, so leaving can start from wherever arriving had got to. */
  private cur: THREE.Vector3[];
  private curAlpha: number[];
  private hubCur: THREE.Vector3[];
  private hubCurAlpha: number[];
  private leaveFrom?: { pos: THREE.Vector3[]; alpha: number[]; hubPos: THREE.Vector3[]; hubAlpha: number[]; panel: number };

  private enterAt = Number.POSITIVE_INFINITY;
  private leaveAt = Number.POSITIVE_INFINITY;
  private settled = false;
  private m = new THREE.Matrix4();
  private tmp = new THREE.Vector3();
  private one = new THREE.Vector3(1, 1, 1);

  constructor(g: DomeGeometry) {
    const v = g.vertices.map(([x, y, z]) => new THREE.Vector3(x, y - g.baseY, z));
    const centre = new THREE.Vector3(0, g.heightFactor * 0.3, 0);
    const n = g.edges.length;

    this.panels = panelMaterial();
    this.panels.opacity = 0;
    this.group.add(new THREE.Mesh(panelGeometry(g, v), this.panels));

    const rod = new THREE.CylinderGeometry(0.011, 0.011, 1, 8, 1);
    this.strutAlpha = new THREE.InstancedBufferAttribute(new Float32Array(n), 1);
    rod.setAttribute('instanceAlpha', this.strutAlpha);
    this.struts = new THREE.InstancedMesh(rod, fadingMaterial({ roughness: 0.45, metalness: 0.1 }), n);
    this.struts.frustumCulled = false;
    this.group.add(this.struts);

    const ball = new THREE.SphereGeometry(0.019, 10, 8);
    this.hubAlpha = new THREE.InstancedBufferAttribute(new Float32Array(v.length), 1);
    ball.setAttribute('instanceAlpha', this.hubAlpha);
    this.hubs = new THREE.InstancedMesh(ball, fadingMaterial({ color: 0xd8d8d8, roughness: 0.3, metalness: 0.6 }), v.length);
    this.hubs.frustumCulled = false;
    this.group.add(this.hubs);

    const poses = g.edges.map(([a, b]) => strutPose(v[a], v[b]));
    this.home = poses.map((p) => p.mid);
    this.quat = poses.map((p) => p.quat);
    this.scale = poses.map((p) => p.scale);
    const color = new THREE.Color();
    g.edges.forEach(([, , type], i) => this.struts.setColorAt(i, color.set(STRUT_COLORS[type % STRUT_COLORS.length])));

    // Each strut flies in from far out along its own radial line, lifted a little.
    this.from = this.home.map((p, i) => {
      const out = p.clone().sub(centre).normalize();
      out.y += 0.25 + noise(i) * 0.5;
      return out.normalize().multiplyScalar(5.5 + noise(i + 7) * 3.5);
    });

    this.delay = assemblyOrder(this.home, g.spec.frequency);
    const landed = (i: number) => this.delay[i] + FLY;

    // A hub appears as the first strut reaches it.
    this.hubHome = v;
    this.hubDelay = v.map(() => Number.POSITIVE_INFINITY);
    g.edges.forEach(([a, b], i) => {
      const t = landed(i) - 0.12;
      this.hubDelay[a] = Math.min(this.hubDelay[a], t);
      this.hubDelay[b] = Math.min(this.hubDelay[b], t);
    });
    this.hubFrom = v.map((p) => p.clone().sub(centre).normalize().multiplyScalar(6));

    this.cur = this.home.map((p, i) => p.clone().add(this.from[i]));
    this.curAlpha = new Array(n).fill(0);
    this.hubCur = v.map((p) => p.clone());
    this.hubCurAlpha = new Array(v.length).fill(0);

    const last = Math.max(...this.delay) + FLY;
    this.panelStart = last - 0.45;
    const struts = g.strutTypes.map((_, t) =>
      Math.min(...g.edges.map((e, i) => (e[2] === t ? landed(i) : Number.POSITIVE_INFINITY))),
    );
    // Dimensions draw in early, while struts are still arriving, at the same pace on every dome.
    const guides = { D: 0.35, R: 0.5, H: 0.65, C: 0.8, A: 0.95 };
    this.timeline = { struts, guides, done: Math.max(last, guides.A + GUIDE_DRAW) };
    this.buildGuides(g, guides);
    this.write();
  }

  private buildGuides(g: DomeGeometry, at: Timeline['guides']) {
    const add = (pts: THREE.Vector3[], hex: string, dashed: boolean, start: number, axis: Guide['axis']) => {
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const params = { color: hex, depthTest: false, transparent: true };
      const mat = dashed
        ? new THREE.LineDashedMaterial({ ...params, dashSize: 0.05, gapSize: 0.035 })
        : new THREE.LineBasicMaterial(params);
      const line = new THREE.Line(geo, mat);
      line.renderOrder = 10;
      if (dashed) line.computeLineDistances();
      line.visible = false;
      this.guides.add(line);
      this.guideParts.push({ line, start, axis, points: pts.length });
      return line;
    };
    const r = g.floorRadiusFactor;
    const circle = Array.from({ length: 97 }, (_, i) => {
      const t = (i / 96) * Math.PI * 2;
      return new THREE.Vector3(Math.cos(t) * r, 0.004, Math.sin(t) * r);
    });
    add(circle, '#8a8a8a', true, at.C, null);
    // Sphere diameter sits at the equator, which is below the floor on tall domes.
    const eq = -g.baseY;
    add([new THREE.Vector3(-1.08, 0, 0), new THREE.Vector3(1.08, 0, 0)], DIM_COLORS.D, true, at.D, 'x').position.y = eq;
    add([new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 0, 0)], DIM_COLORS.R, false, at.R, 'x').position.set(0, eq, 0.002);
    add([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, g.heightFactor, 0)], DIM_COLORS.H, true, at.H, 'y');
  }

  enter(at: number) {
    this.enterAt = at;
    this.settled = false;
  }

  leave(at: number) {
    this.leaveAt = at;
    this.settled = false;
    this.leaveFrom = {
      pos: this.cur.map((p) => p.clone()),
      alpha: [...this.curAlpha],
      hubPos: this.hubCur.map((p) => p.clone()),
      hubAlpha: [...this.hubCurAlpha],
      panel: this.panels.opacity,
    };
  }

  get leaveDone() {
    return this.leaveAt + LEAVE + LEAVE_STAGGER;
  }

  update(now: number) {
    if (this.settled) return;
    if (now >= this.leaveAt) this.updateLeave(now - this.leaveAt);
    else this.updateEnter(now - this.enterAt);
    this.write();
  }

  private updateEnter(t: number) {
    for (let i = 0; i < this.home.length; i++) {
      const k = clamp01((t - this.delay[i]) / FLY);
      const e = easeOutQuart(k);
      this.cur[i].copy(this.from[i]).multiplyScalar(1 - e).add(this.home[i]);
      this.curAlpha[i] = clamp01(k * 1.4);
    }
    for (let i = 0; i < this.hubHome.length; i++) {
      const k = clamp01((t - this.hubDelay[i]) / HUB_POP);
      this.hubCur[i].copy(this.hubHome[i]);
      this.hubCurAlpha[i] = k;
    }
    this.panels.opacity = PANEL_OPACITY * clamp01((t - this.panelStart) / 0.7);
    for (const gd of this.guideParts) {
      const k = clamp01((t - gd.start) / GUIDE_DRAW);
      const e = easeOutQuart(k);
      gd.line.visible = k > 0;
      (gd.line.material as THREE.Material).opacity = 1;
      if (gd.axis === null) gd.line.geometry.setDrawRange(0, Math.max(2, Math.round(gd.points * e)));
      else gd.line.scale[gd.axis] = Math.max(1e-4, e);
    }
    if (t > this.timeline.done) this.settled = true;
  }

  private updateLeave(t: number) {
    const from = this.leaveFrom!;
    const n = this.home.length;
    // Top of the dome goes first; everything is gone inside LEAVE + LEAVE_STAGGER.
    for (let i = 0; i < n; i++) {
      const order = 1 - this.home[i].y / 2.2;
      const k = clamp01((t - order * LEAVE_STAGGER) / LEAVE);
      const e = easeInCubic(k);
      this.cur[i].copy(this.from[i]).multiplyScalar(e).add(from.pos[i]);
      this.curAlpha[i] = from.alpha[i] * (1 - k);
    }
    const kHub = clamp01(t / (LEAVE * 0.6));
    for (let i = 0; i < this.hubHome.length; i++) {
      this.hubCur[i].copy(this.hubFrom[i]).multiplyScalar(easeInCubic(kHub)).add(from.hubPos[i]);
      this.hubCurAlpha[i] = from.hubAlpha[i] * (1 - kHub);
    }
    const kFade = clamp01(t / 0.15);
    this.panels.opacity = from.panel * (1 - kFade);
    for (const gd of this.guideParts) (gd.line.material as THREE.Material).opacity = 1 - kFade;
  }

  private write() {
    for (let i = 0; i < this.home.length; i++) {
      this.struts.setMatrixAt(i, this.m.compose(this.cur[i], this.quat[i], this.scale[i]));
      this.strutAlpha.setX(i, this.curAlpha[i]);
    }
    for (let i = 0; i < this.hubHome.length; i++) {
      const a = this.hubCurAlpha[i];
      // Hubs pop in with a small overshoot while arriving.
      const s = this.leaveFrom ? 1 : Math.max(1e-4, easeOutBack(a));
      this.hubs.setMatrixAt(i, this.m.compose(this.hubCur[i], new THREE.Quaternion(), this.tmp.copy(this.one).multiplyScalar(s)));
      this.hubAlpha.setX(i, a);
    }
    this.struts.instanceMatrix.needsUpdate = true;
    this.hubs.instanceMatrix.needsUpdate = true;
    this.strutAlpha.needsUpdate = true;
    this.hubAlpha.needsUpdate = true;
  }

  dispose() {
    dispose(this.group);
    dispose(this.guides);
  }
}

/**
 * Start time for each strut, built bottom-up the way a dome is raised: one course
 * (ring of struts at about the same height) at a time, each swept around the ring,
 * alternating direction, with a pause between courses.
 */
function assemblyOrder(mids: THREE.Vector3[], frequency: number): number[] {
  const byHeight = mids.map((_, i) => i).sort((a, b) => mids[a].y - mids[b].y);
  const courses: number[][] = [];
  let lastY = Number.NEGATIVE_INFINITY;
  for (const i of byHeight) {
    if (mids[i].y - lastY > 0.012) courses.push([]);
    courses[courses.length - 1].push(i);
    lastY = mids[i].y;
  }

  const raw = new Array<number>(mids.length);
  let t = 0;
  courses.forEach((course, c) => {
    const turn = c * 2.399963; // golden angle, so each course starts somewhere new
    const angle = (i: number) => {
      const a = Math.atan2(mids[i].z, mids[i].x) - turn;
      return ((a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    };
    const sorted = [...course].sort((a, b) => angle(a) - angle(b));
    if (c % 2) sorted.reverse();
    const sweep = 0.18 + 0.006 * course.length;
    sorted.forEach((i, k) => {
      raw[i] = t + (k / Math.max(1, sorted.length - 1)) * sweep + (noise(i) - 0.5) * 0.05;
    });
    t += sweep + 0.07;
  });

  // Same feel at any size: bigger domes get a little longer, never past ~3s.
  const budget = Math.min(3, 1.1 + 0.32 * frequency);
  const max = Math.max(...raw);
  return raw.map((x) => (Math.max(0, x) / max) * budget);
}

export class MainView {
  readonly renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(35, 1, 0.05, 50);
  private controls: OrbitControls;
  private dome?: AssembledDome;
  private leaving: AssembledDome[] = [];
  private userRotate = true;
  private animatingUntil = 0;
  showGuides = true;

  constructor(private host: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    host.appendChild(this.renderer.domElement);
    lights(this.scene);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(1.7, 64),
      new THREE.MeshStandardMaterial({ color: 0x2c2c2c, roughness: 1 }),
    );
    floor.rotation.x = -Math.PI / 2;
    this.scene.add(floor);

    this.camera.position.set(2.9, 2.0, 3.5);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.autoRotateSpeed = 0.8;
    this.controls.minDistance = 1.5;
    this.controls.maxDistance = 9;
    this.controls.maxPolarAngle = Math.PI * 0.495;
    new ResizeObserver(() => this.resize()).observe(host);
    this.resize();
  }

  set autoRotate(on: boolean) {
    this.userRotate = on;
  }

  /** Send the current dome out, then assemble `g`. Times are seconds from now. */
  show(g: DomeGeometry): Timeline {
    const now = performance.now() / 1000;
    let enter = now;
    if (this.dome) {
      this.dome.leave(now);
      enter = this.dome.leaveDone;
      this.leaving.push(this.dome);
    }
    const dome = new AssembledDome(g);
    dome.guides.visible = this.showGuides;
    dome.enter(enter);
    this.scene.add(dome.group, dome.guides);
    this.dome = dome;
    this.controls.target.set(0, g.heightFactor * 0.45, 0);
    const lead = enter - now;
    this.animatingUntil = enter + dome.timeline.done;
    const shift = (x: number) => x + lead;
    const tl = dome.timeline;
    return {
      enter: lead,
      struts: tl.struts.map(shift),
      guides: { C: shift(tl.guides.C), D: shift(tl.guides.D), R: shift(tl.guides.R), H: shift(tl.guides.H), A: shift(tl.guides.A) },
      done: shift(tl.done),
    };
  }

  setGuides(on: boolean) {
    this.showGuides = on;
    if (this.dome) this.dome.guides.visible = on;
  }

  private resize() {
    const w = this.host.clientWidth;
    const h = this.host.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  render() {
    const now = performance.now() / 1000;
    this.leaving = this.leaving.filter((d) => {
      if (now < d.leaveDone) {
        d.update(now);
        return true;
      }
      this.scene.remove(d.group, d.guides);
      d.dispose();
      return false;
    });
    this.dome?.update(now);
    // Hold the camera still while a dome is arriving or leaving.
    this.controls.autoRotate = this.userRotate && now > this.animatingUntil;
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}

/** One offscreen renderer drawing every preview box into its own 2D canvas. */
export class ThumbnailRenderer {
  private renderer: THREE.WebGLRenderer;
  private items: { canvas: HTMLCanvasElement; scene: THREE.Scene; dome: THREE.Group; camera: THREE.PerspectiveCamera }[] = [];

  constructor(private width: number, private height: number) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(width, height, false);
  }

  add(canvas: HTMLCanvasElement, g: DomeGeometry) {
    canvas.width = this.width;
    canvas.height = this.height;
    const scene = new THREE.Scene();
    lights(scene);
    const dome = domeObject(g, { strut: 0.016, hub: 0 });
    scene.add(dome);
    // Frame the dome's bounding sphere (it spins, so use its full footprint) with a margin.
    const fov = 30;
    const camera = new THREE.PerspectiveCamera(fov, this.width / this.height, 0.1, 30);
    const midY = g.heightFactor / 2;
    const radius = Math.hypot(1, midY) * 1.04;
    const distance = radius / Math.sin(THREE.MathUtils.degToRad(fov / 2));
    const tilt = THREE.MathUtils.degToRad(16);
    camera.position.set(0, midY + Math.sin(tilt) * distance, Math.cos(tilt) * distance);
    camera.lookAt(0, midY, 0);
    this.items.push({ canvas, scene, dome, camera });
  }

  render(dt: number, fast: (i: number) => boolean) {
    this.items.forEach((it, i) => {
      it.dome.rotation.y += dt * (fast(i) ? 0.9 : 0.25);
      this.renderer.render(it.scene, it.camera);
      const ctx = it.canvas.getContext('2d')!;
      ctx.clearRect(0, 0, this.width, this.height);
      ctx.drawImage(this.renderer.domElement, 0, 0);
    });
  }
}
