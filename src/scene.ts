import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { DIM_COLORS, STRUT_COLORS } from './calc';
import type { DomeGeometry } from './geodesic';

const UP = new THREE.Vector3(0, 1, 0);

/** Dome on the unit sphere, translated so its base rests on y = 0. */
export function domeObject(g: DomeGeometry, opts: { strut: number; hub: number }): THREE.Group {
  const group = new THREE.Group();
  const v = g.vertices.map(([x, y, z]) => new THREE.Vector3(x, y - g.baseY, z));

  const panels = new THREE.BufferGeometry();
  panels.setAttribute('position', new THREE.Float32BufferAttribute(g.faces.flatMap((f) => f.flatMap((i) => v[i].toArray())), 3));
  panels.computeVertexNormals();
  group.add(
    new THREE.Mesh(
      panels,
      new THREE.MeshStandardMaterial({
        color: 0x0a0a0a,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
        depthWrite: false,
        roughness: 0.9,
      }),
    ),
  );

  const rod = new THREE.CylinderGeometry(opts.strut, opts.strut, 1, 8, 1);
  const struts = new THREE.InstancedMesh(rod, new THREE.MeshStandardMaterial({ roughness: 0.45, metalness: 0.1 }), g.edges.length);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const color = new THREE.Color();
  g.edges.forEach(([a, b, type], i) => {
    const dir = v[b].clone().sub(v[a]);
    q.setFromUnitVectors(UP, dir.clone().normalize());
    s.set(1, dir.length(), 1);
    m.compose(v[a].clone().add(v[b]).multiplyScalar(0.5), q, s);
    struts.setMatrixAt(i, m);
    struts.setColorAt(i, color.set(STRUT_COLORS[type % STRUT_COLORS.length]));
  });
  group.add(struts);

  if (opts.hub > 0) {
    const hubs = new THREE.InstancedMesh(
      new THREE.SphereGeometry(opts.hub, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0xd8d8d8, roughness: 0.3, metalness: 0.6 }),
      v.length,
    );
    v.forEach((p, i) => hubs.setMatrixAt(i, m.makeTranslation(p.x, p.y, p.z)));
    group.add(hubs);
  }
  return group;
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

/** Dimension guides in the original calculator's colours: D purple, R yellow, H red. */
function guides(g: DomeGeometry): THREE.Group {
  const group = new THREE.Group();
  const line = (pts: THREE.Vector3[], hex: string, dashed: boolean) => {
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = dashed
      ? new THREE.LineDashedMaterial({ color: hex, dashSize: 0.05, gapSize: 0.035, depthTest: false })
      : new THREE.LineBasicMaterial({ color: hex, depthTest: false });
    const l = new THREE.Line(geo, mat);
    l.renderOrder = 10;
    if (dashed) l.computeLineDistances();
    group.add(l);
  };
  const r = g.floorRadiusFactor;
  const y = 0.004;
  const circle = Array.from({ length: 97 }, (_, i) => {
    const t = (i / 96) * Math.PI * 2;
    return new THREE.Vector3(Math.cos(t) * r, y, Math.sin(t) * r);
  });
  line(circle, '#8a8a8a', true);
  // Sphere diameter sits at the equator, which is below the floor on tall domes.
  const eq = -g.baseY;
  line([new THREE.Vector3(-1.08, eq, 0), new THREE.Vector3(1.08, eq, 0)], DIM_COLORS.D, true);
  line([new THREE.Vector3(0, eq, 0.002), new THREE.Vector3(1, eq, 0.002)], DIM_COLORS.R, false);
  line([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, g.heightFactor, 0)], DIM_COLORS.H, true);
  return group;
}

export class MainView {
  readonly renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(35, 1, 0.05, 50);
  private controls: OrbitControls;
  private dome?: THREE.Group;
  private guideLines?: THREE.Group;
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
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.8;
    this.controls.minDistance = 1.5;
    this.controls.maxDistance = 9;
    this.controls.maxPolarAngle = Math.PI * 0.495;
    new ResizeObserver(() => this.resize()).observe(host);
    this.resize();
  }

  set autoRotate(on: boolean) {
    this.controls.autoRotate = on;
  }

  show(g: DomeGeometry) {
    for (const old of [this.dome, this.guideLines]) {
      if (old) {
        this.scene.remove(old);
        dispose(old);
      }
    }
    this.dome = domeObject(g, { strut: 0.011, hub: 0.019 });
    this.guideLines = guides(g);
    this.guideLines.visible = this.showGuides;
    this.scene.add(this.dome, this.guideLines);
    this.controls.target.set(0, g.heightFactor * 0.45, 0);
  }

  setGuides(on: boolean) {
    this.showGuides = on;
    if (this.guideLines) this.guideLines.visible = on;
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
    const camera = new THREE.PerspectiveCamera(30, this.width / this.height, 0.1, 20);
    const midY = g.heightFactor * 0.5;
    camera.position.set(0, midY + 1.25, 3.5);
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
