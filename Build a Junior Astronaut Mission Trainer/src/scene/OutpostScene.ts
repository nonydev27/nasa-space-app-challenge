// Real-time 3D outpost (Moon: Artemis Base Camp at Shackleton rim · Mars: Jezero Crater).
// Plain three.js driven by the simulation through `applyView`, with cinematic camera
// shots for story beats, a walkable player astronaut, bloom post-processing, floating
// telemetry labels and an optional WebXR "Enter VR" session.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DObject, CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

import type { AvatarConfig, Location, SceneViewState, ShotId } from '../game/types';
import { CREW_NPC } from '../game/avatars';
import { buildAstronaut, type AstronautRig } from './astronaut';
import { fbm, rng } from './noise';
import { earthTexture, glowTexture, habitatPanelTexture, regolithTexture, solarCellTexture } from './textures';

export type ModuleId = 'eclss' | 'greenhouse' | 'power' | 'comms' | 'rover' | 'bunker';

export interface OutpostSceneOptions {
  location: Location;
  avatar: AvatarConfig;
  callsign: string;
  onModuleClick?: (module: ModuleId) => void;
}

// ---------------------------------------------------------------- layout (metres)
const HAB = new THREE.Vector3(0, 0, 0);
const GREENHOUSE = new THREE.Vector3(-15, 0, 3);
const BUNKER = new THREE.Vector3(5, 0, -12);
const BUNKER_DOOR = new THREE.Vector3(5, 0, -6.6);
const SOLAR_A = new THREE.Vector3(18, 0, -12);
const SOLAR_B = new THREE.Vector3(27, 0, -3);
const RTG = new THREE.Vector3(-10, 0, -18);
const COMMS = new THREE.Vector3(-24, 0, -8);
const ROVER_DOCK = new THREE.Vector3(10, 0, 10);
const LANDER = new THREE.Vector3(-36, 0, -30);

const COLLIDERS: Array<{ x: number; z: number; r: number }> = [
  { x: HAB.x, z: HAB.z, r: 7.6 },
  { x: GREENHOUSE.x, z: GREENHOUSE.z, r: 5.3 },
  { x: BUNKER.x, z: BUNKER.z, r: 4.6 },
  { x: RTG.x, z: RTG.z, r: 2.6 },
  { x: COMMS.x, z: COMMS.z, r: 2.6 },
  { x: LANDER.x, z: LANDER.z, r: 4.2 },
  { x: SOLAR_A.x, z: SOLAR_A.z, r: 0.8 },
  { x: SOLAR_B.x, z: SOLAR_B.z, r: 0.8 }
];

const PATROL: THREE.Vector3[] = [
  [11.2, 0], [12, 7], [2, 10.5], [-12, 10.5], [-22, 9], [-21, -3], [-19, -12], [-10, -14.2],
  [4.6, -6.4], [15, -6], [12, -1]
].map(([x, z]) => new THREE.Vector3(x, 0, z));

const SHOTS: Record<Exclude<ShotId, 'avatar' | 'helmet' | 'rover' | 'sky'>, { pos: [number, number, number]; target: [number, number, number] }> = {
  overview: { pos: [24, 15, 27], target: [-2, 1, -3] },
  establishing: { pos: [38, 9, 40], target: [-4, 2, -4] },
  habitat: { pos: [17, 5, 15], target: [0, 3, 0] },
  greenhouse: { pos: [-7, 4.2, 13], target: [-15, 2, 3] },
  power: { pos: [31, 6, 5], target: [21, 4, -9] },
  bunker: { pos: [9.5, 3.4, -0.5], target: [5, 1.5, -10] },
  comms: { pos: [-13, 4, 3], target: [-24, 4.5, -8] }
};

// ---------------------------------------------------------------- helpers
const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const damp = (current: number, target: number, rate: number, dt: number) => current + (target - current) * (1 - Math.exp(-rate * dt));

interface Crater { x: number; z: number; r: number; depth: number }

function makeCraters(isMoon: boolean): Crater[] {
  const r = rng(isMoon ? 1969 : 2021);
  const list: Crater[] = [];
  const count = isMoon ? 46 : 14;
  for (let i = 0; i < count; i++) {
    const ang = r() * Math.PI * 2;
    const dist = 62 + r() * 190;
    const rad = isMoon ? 3 + Math.pow(r(), 2) * 28 : 5 + r() * 20;
    list.push({ x: Math.cos(ang) * dist, z: Math.sin(ang) * dist, r: rad, depth: rad * (isMoon ? 0.22 : 0.14) });
  }
  return list;
}

function makeHeightFn(isMoon: boolean) {
  const craters = makeCraters(isMoon);
  const seed = isMoon ? 7 : 13;
  return (x: number, z: number): number => {
    const d = Math.hypot(x, z);
    let h = (fbm(x * 0.012, z * 0.012, 5, seed) - 0.5) * (isMoon ? 9 : 7);
    h += (fbm(x * 0.07, z * 0.07, 3, seed + 5) - 0.5) * 1.1;
    if (!isMoon) h += Math.sin(x * 0.06 + fbm(x * 0.01, z * 0.01, 2, 9) * 7) * 0.7;
    for (const c of craters) {
      const cd = Math.hypot(x - c.x, z - c.z) / c.r;
      if (cd < 2.2) {
        if (cd < 1) h -= c.depth * (1 - cd * cd);
        h += c.depth * 0.45 * Math.exp(-(((cd - 1) / 0.22) ** 2));
      }
    }
    if (d > 150) {
      const t = (d - 150) / 110;
      h += t * t * (isMoon ? 58 : 42) * (0.55 + fbm(x * 0.008, z * 0.008, 4, seed + 3));
    }
    return h * smoothstep(38, 60, d);
  };
}

function sunDirection(hour: number, isMoon: boolean, out: THREE.Vector3): THREE.Vector3 {
  const dayT = (hour - 6) / 12; // 0 = sunrise, 1 = sunset
  const az = Math.PI * dayT;
  // At the lunar south pole the Sun skims the horizon; on Mars it climbs high.
  const el = Math.sin(Math.PI * dayT) * (isMoon ? 0.42 : 1.05);
  const x = Math.cos(az) * Math.cos(el);
  const z = -Math.sin(az) * Math.cos(el);
  const yaw = -0.55;
  return out.set(x * Math.cos(yaw) - z * Math.sin(yaw), Math.sin(el), x * Math.sin(yaw) + z * Math.cos(yaw)).normalize();
}

// ---------------------------------------------------------------- shaders
const SKY_VERT = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const SKY_FRAG = /* glsl */ `
uniform vec3 uSunDir;
uniform float uDust;
uniform float uDay;
uniform vec3 uHorizon;
uniform vec3 uZenith;
uniform vec3 uDustTint;
uniform vec3 uBlue;
varying vec3 vDir;
void main() {
  vec3 d = normalize(vDir);
  float h = clamp(d.y, 0.0, 1.0);
  vec3 day = mix(uHorizon, uZenith, pow(h, 0.55));
  day = mix(day, uDustTint, uDust * 0.75);
  float sd = max(dot(d, normalize(uSunDir)), 0.0);
  float sunset = 1.0 - smoothstep(0.0, 0.4, uSunDir.y);
  // Mars sunsets are blue: fine dust scatters blue light forward around the Sun.
  day = mix(day, uBlue, pow(sd, 14.0) * (0.25 + 0.65 * sunset) * (1.0 - uDust * 0.7));
  day += vec3(1.0, 0.92, 0.8) * pow(sd, 600.0) * 3.0 * (1.0 - uDust);
  vec3 night = vec3(0.004, 0.004, 0.007) + uBlue * pow(sd, 10.0) * 0.08;
  gl_FragColor = vec4(mix(night, day, uDay), 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

const FIELD_VERT = /* glsl */ `
varying vec3 vN;
varying vec3 vView;
varying vec3 vPos;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vPos = position;
  vN = normalize(mat3(modelMatrix) * normal);
  vView = normalize(cameraPosition - wp.xyz);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const FIELD_FRAG = /* glsl */ `
uniform float uTime;
uniform float uStrength;
uniform vec3 uColor;
varying vec3 vN;
varying vec3 vView;
varying vec3 vPos;
void main() {
  float f = pow(1.0 - abs(dot(normalize(vN), normalize(vView))), 2.4);
  float bands = 0.5 + 0.5 * sin(vPos.y * 1.3 - uTime * 2.2);
  float cells = smoothstep(0.9, 1.0, abs(sin(vPos.x * 0.7 + uTime * 0.3) * sin(vPos.z * 0.7)));
  float a = (f * 0.85 + bands * 0.05 + cells * 0.12) * uStrength;
  gl_FragColor = vec4(uColor * (0.7 + f * 1.4), a);
}`;

// ---------------------------------------------------------------- scene class
interface Walker {
  rig: AstronautRig;
  pos: THREE.Vector3;
  heading: number;
  path: THREE.Vector3[];
  idx: number;
  pause: number;
  speed: number;
}

export class OutpostScene {
  private readonly container: HTMLElement;
  private readonly opts: OutpostSceneOptions;
  private readonly isMoon: boolean;
  private readonly heightAt: (x: number, z: number) => number;

  private renderer: THREE.WebGLRenderer;
  private labelRenderer: CSS2DRenderer;
  private composer: EffectComposer;
  private bloom: UnrealBloomPass;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private dolly = new THREE.Group();
  private controls: OrbitControls;
  private timer = new THREE.Timer();
  private elapsed = 0;
  private disposables: Array<{ dispose(): void }> = [];

  // environment
  private sunDir = new THREE.Vector3();
  private sunLight!: THREE.DirectionalLight;
  private hemi!: THREE.HemisphereLight;
  private earthshine!: THREE.AmbientLight;
  private sunSprite!: THREE.Sprite;
  private skyGroup = new THREE.Group();
  private skyMat?: THREE.ShaderMaterial;
  private starsMat!: THREE.PointsMaterial;
  private earth?: THREE.Mesh;
  private earthDir = new THREE.Vector3(-0.42, 0.17, -0.89).normalize();
  private dustPoints?: THREE.Points;
  private flareLines!: THREE.LineSegments;
  private flareData: Array<{ start: THREE.Vector3; end: THREE.Vector3; p: number; v: number }> = [];
  private field!: THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>;

  // modules
  private pickables: THREE.Object3D[] = [];
  private solarHeads: Array<{ head: THREE.Group; tilt: THREE.Group }> = [];
  private solarMat!: THREE.MeshStandardMaterial;
  private windowMat!: THREE.MeshStandardMaterial;
  private lampMat!: THREE.MeshStandardMaterial;
  private floodLights: THREE.SpotLight[] = [];
  private beaconMat!: THREE.MeshStandardMaterial;
  private rtgGlowMat!: THREE.MeshStandardMaterial;
  private rtgLight!: THREE.PointLight;
  private growLight!: THREE.PointLight;
  private growBarMat!: THREE.MeshStandardMaterial;
  private plants!: THREE.InstancedMesh;
  private plantBase: THREE.Matrix4[] = [];
  private plantMat!: THREE.MeshStandardMaterial;
  private bunkerDoor!: THREE.Mesh;
  private bunkerLampMat!: THREE.MeshStandardMaterial;
  private commsRings: THREE.Mesh[] = [];
  private commsDir = new THREE.Vector3();
  private rover = new THREE.Group();
  private roverWheels: THREE.Group[] = [];
  private roverCurve!: THREE.CatmullRomCurve3;
  private roverU = 0;
  private labels: Partial<Record<ModuleId | 'rtg', HTMLDivElement>> = {};

  // characters
  private player!: Walker;
  private playerHidden = false;
  private playerTag!: CSS2DObject;
  private npcs: Walker[] = [];
  private manual = false;
  private manualIdle = 0;
  private keys = new Set<string>();
  private helmetPitch = 0;

  // camera direction
  private shot: ShotId = 'establishing';
  private cinematic = true;
  private labelsVisible = false;
  private tween: { fromPos: THREE.Vector3; fromTarget: THREE.Vector3; toPos: THREE.Vector3; toTarget: THREE.Vector3; t: number; dur: number } | null = null;
  private followPrev = new THREE.Vector3();
  private pointerDown: { x: number; y: number } | null = null;
  private raycaster = new THREE.Raycaster();

  // live state (smoothed)
  private view: SceneViewState | null = null;
  private hour = 9;
  private dust = 0;
  private flare = 0;
  private shield = 0;
  private inXR = false;

  constructor(container: HTMLElement, opts: OutpostSceneOptions) {
    this.container = container;
    this.opts = opts;
    this.isMoon = opts.location === 'moon';
    this.heightAt = makeHeightFn(this.isMoon);

    const { clientWidth: w, clientHeight: h } = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.setSize(w, h);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = this.isMoon ? 1.0 : 1.1;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.xr.enabled = true;
    this.renderer.domElement.className = 'outpost-canvas';
    container.appendChild(this.renderer.domElement);

    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.setSize(w, h);
    this.labelRenderer.domElement.className = 'outpost-labels';
    container.appendChild(this.labelRenderer.domElement);

    this.camera = new THREE.PerspectiveCamera(48, w / h, 0.1, 3000);
    this.dolly.add(this.camera);
    this.scene.add(this.dolly);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = envTex;
    this.scene.environmentIntensity = 0.3;
    this.disposables.push(envTex, pmrem);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.07;
    this.controls.minDistance = 3;
    this.controls.maxDistance = 150;
    this.controls.maxPolarAngle = Math.PI * 0.49;
    this.controls.autoRotateSpeed = 0.35;

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.55, 0.5, 0.82);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());

    this.buildSky();
    this.buildLights();
    this.buildTerrain();
    this.buildBase();
    this.buildCharacters();
    this.buildEffects();

    const s = SHOTS.establishing;
    this.camera.position.set(...s.pos);
    this.controls.target.set(...s.target);

    this.bindInput();
    this.renderer.setAnimationLoop(this.frame);
  }

  // ============================================================ public API
  applyView(v: SceneViewState): void {
    if (!this.view) this.hour = v.hour;
    this.view = v;
  }

  setShot(shot: ShotId, cinematic: boolean): void {
    this.cinematic = cinematic;
    this.labelRenderer.domElement.style.display = cinematic || !this.labelsVisible ? 'none' : '';
    if (shot === this.shot && this.tween) return;
    this.shot = shot;
    this.manual = false;
    this.controls.autoRotate = cinematic && shot !== 'avatar' && shot !== 'helmet' && shot !== 'rover';
    if (shot === 'helmet') {
      this.tween = null;
      this.controls.enabled = false;
      this.helmetPitch = 0;
      return;
    }
    const [pos, target] = this.shotFrame(shot);
    this.tween = {
      fromPos: this.camera.position.clone(),
      fromTarget: this.controls.target.clone(),
      toPos: pos,
      toTarget: target,
      t: 0,
      dur: cinematic ? 3.2 : 1.8
    };
    this.controls.enabled = false;
  }

  setLabelsVisible(visible: boolean): void {
    this.labelsVisible = visible;
    this.labelRenderer.domElement.style.display = this.cinematic || !visible ? 'none' : '';
  }

  async vrSupported(): Promise<boolean> {
    try {
      return Boolean(await navigator.xr?.isSessionSupported('immersive-vr'));
    } catch {
      return false;
    }
  }

  async enterVR(): Promise<void> {
    if (!navigator.xr) throw new Error('WebXR is not available in this browser.');
    const session = await navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor', 'bounded-floor'] });
    this.inXR = true;
    // Stand the viewer on the regolith, looking at the habitat.
    this.dolly.position.set(13, 0, 16);
    this.dolly.rotation.y = Math.atan2(13, 16);
    session.addEventListener('end', () => {
      this.inXR = false;
      this.dolly.position.set(0, 0, 0);
      this.dolly.rotation.set(0, 0, 0);
      this.setShot('overview', false);
    });
    await this.renderer.xr.setSession(session);
  }

  dispose(): void {
    this.renderer.setAnimationLoop(null);
    this.unbindInput();
    this.resizeObserver.disconnect();
    this.controls.dispose();
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      const mat = m.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
      else mat?.dispose();
    });
    this.disposables.forEach((d) => d.dispose());
    this.player.rig.dispose();
    this.npcs.forEach((n) => n.rig.dispose());
    this.composer.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
    this.labelRenderer.domElement.remove();
  }

  // ============================================================ building
  private buildSky(): void {
    this.scene.add(this.skyGroup);
    if (this.isMoon) {
      this.scene.background = new THREE.Color('#000000');
    } else {
      this.skyMat = new THREE.ShaderMaterial({
        vertexShader: SKY_VERT,
        fragmentShader: SKY_FRAG,
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          uSunDir: { value: new THREE.Vector3(0, 1, 0) },
          uDust: { value: 0 },
          uDay: { value: 1 },
          uHorizon: { value: new THREE.Color('#d6a77c') },
          uZenith: { value: new THREE.Color('#8f5e40') },
          uDustTint: { value: new THREE.Color('#a8714a') },
          uBlue: { value: new THREE.Color('#7fa6d8') }
        }
      });
      const dome = new THREE.Mesh(new THREE.SphereGeometry(950, 48, 24), this.skyMat);
      dome.renderOrder = -2;
      this.skyGroup.add(dome);
    }

    // Stars
    const r = rng(99);
    const n = 5000;
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const u = r() * 2 - 1;
      const th = r() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      pos.set([Math.cos(th) * s * 900, u * 900, Math.sin(th) * s * 900], i * 3);
      const tint = r();
      const b = 0.5 + r() * 0.5;
      col.set(tint > 0.85 ? [b, b * 0.85, b * 0.7] : tint < 0.12 ? [b * 0.75, b * 0.85, b] : [b, b, b], i * 3);
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    sg.setAttribute('color', new THREE.BufferAttribute(col, 3));
    this.starsMat = new THREE.PointsMaterial({ size: 1.7, sizeAttenuation: false, vertexColors: true, transparent: true, depthWrite: false, fog: false });
    const stars = new THREE.Points(sg, this.starsMat);
    stars.renderOrder = -1;
    this.skyGroup.add(stars);

    // Sun
    const sunTex = glowTexture('rgba(255,255,255,1)', 'rgba(255,236,190,0.35)');
    this.disposables.push(sunTex);
    this.sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: sunTex, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, transparent: true }));
    this.sunSprite.scale.setScalar(this.isMoon ? 95 : 58);
    this.skyGroup.add(this.sunSprite);

    if (this.isMoon) {
      const tex = earthTexture();
      this.disposables.push(tex);
      this.earth = new THREE.Mesh(
        new THREE.SphereGeometry(26, 48, 32),
        new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: 0.22, roughness: 0.85, metalness: 0, fog: false })
      );
      this.earth.rotation.z = 0.41;
      const haloTex = glowTexture('rgba(120,170,255,0.0)', 'rgba(110,160,255,0.35)');
      this.disposables.push(haloTex);
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false }));
      halo.scale.setScalar(80);
      this.earth.add(halo);
      this.skyGroup.add(this.earth);
    } else {
      // Phobos — a lumpy little moon
      const geo = new THREE.IcosahedronGeometry(5, 3);
      const p = geo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < p.count; i++) {
        const v = new THREE.Vector3().fromBufferAttribute(p, i);
        v.multiplyScalar(0.8 + fbm(v.x * 0.4 + 3, v.y * 0.4 + v.z * 0.3, 3, 4) * 0.4).multiply(new THREE.Vector3(1.3, 1, 1));
        p.setXYZ(i, v.x, v.y, v.z);
      }
      geo.computeVertexNormals();
      const phobos = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: '#7b6a5c', roughness: 1, fog: false }));
      phobos.position.set(260, 420, -620);
      phobos.name = 'phobos';
      this.skyGroup.add(phobos);
    }
  }

  private buildLights(): void {
    this.sunLight = new THREE.DirectionalLight('#fff6e8', 3);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(2048, 2048);
    const sc = this.sunLight.shadow.camera;
    sc.left = -75; sc.right = 75; sc.top = 75; sc.bottom = -75; sc.near = 1; sc.far = 450;
    this.sunLight.shadow.bias = -0.0004;
    this.sunLight.shadow.normalBias = 0.04;
    this.scene.add(this.sunLight, this.sunLight.target);

    this.hemi = this.isMoon
      ? new THREE.HemisphereLight('#2a3550', '#5d5a56', 0.2)
      : new THREE.HemisphereLight('#e2b48d', '#6b3b24', 0.6);
    this.scene.add(this.hemi);
    this.earthshine = new THREE.AmbientLight(this.isMoon ? '#6f8fd6' : '#4a3a4a', 0);
    this.scene.add(this.earthshine);
  }

  private buildTerrain(): void {
    const size = 520;
    const seg = 200;
    const geo = new THREE.PlaneGeometry(size, size, seg, seg);
    geo.rotateX(-Math.PI / 2);
    const p = geo.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(p.count * 3);
    const base = this.isMoon ? new THREE.Color('#a9a7a3') : new THREE.Color('#b8653c');
    const alt = this.isMoon ? new THREE.Color('#77746f') : new THREE.Color('#7a3d24');
    const c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const z = p.getZ(i);
      const h = this.heightAt(x, z);
      p.setY(i, h);
      const n = fbm(x * 0.03, z * 0.03, 4, 21);
      c.copy(base).lerp(alt, Math.min(1, Math.max(0, (n - 0.35) * 1.6 + (h < -1 ? 0.25 : 0))));
      const d = Math.hypot(x, z);
      if (d < 36) c.multiplyScalar(0.9 + 0.1 * (d / 36)); // compacted pad around the base
      colors.set([c.r, c.g, c.b], i * 3);
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const grain = regolithTexture(this.isMoon ? 3 : 8);
    grain.repeat.set(70, 70);
    this.disposables.push(grain);
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, map: grain, bumpMap: grain, bumpScale: 2.2, roughness: 1, metalness: 0 });
    const ground = new THREE.Mesh(geo, mat);
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Boulders
    const rockGeo = new THREE.DodecahedronGeometry(1, 1);
    const rp = rockGeo.attributes.position as THREE.BufferAttribute;
    const rr = rng(5);
    for (let i = 0; i < rp.count; i++) rp.setXYZ(i, rp.getX(i) * (0.8 + rr() * 0.4), rp.getY(i) * (0.6 + rr() * 0.3), rp.getZ(i) * (0.8 + rr() * 0.4));
    rockGeo.computeVertexNormals();
    const rockMat = new THREE.MeshStandardMaterial({ color: this.isMoon ? '#8d8a85' : '#8a4a2c', map: grain, roughness: 0.95 });
    const count = 420;
    const rocks = new THREE.InstancedMesh(rockGeo, rockMat, count);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    for (let i = 0; i < count; i++) {
      const ang = rr() * Math.PI * 2;
      const dist = 26 + Math.pow(rr(), 0.7) * 200;
      const x = Math.cos(ang) * dist;
      const z = Math.sin(ang) * dist;
      const s = (0.15 + Math.pow(rr(), 3) * 2.2) * (dist < 40 ? 0.5 : 1);
      q.setFromEuler(e.set(rr() * 3, rr() * 3, rr() * 3));
      m.compose(new THREE.Vector3(x, this.heightAt(x, z) + s * 0.25, z), q, new THREE.Vector3(s, s * (0.6 + rr() * 0.5), s));
      rocks.setMatrixAt(i, m);
    }
    rocks.castShadow = true;
    rocks.receiveShadow = true;
    this.scene.add(rocks);
  }

  private buildBase(): void {
    const panelTex = habitatPanelTexture();
    panelTex.repeat.set(5, 1);
    const cellTex = solarCellTexture();
    cellTex.repeat.set(3, 2);
    this.disposables.push(panelTex, cellTex);

    const hab = new THREE.MeshStandardMaterial({ color: '#ffffff', map: panelTex, roughness: 0.55, metalness: 0.08 });
    const white = new THREE.MeshStandardMaterial({ color: '#eceae5', roughness: 0.5, metalness: 0.1 });
    const metal = new THREE.MeshStandardMaterial({ color: '#9aa3ad', roughness: 0.35, metalness: 0.85 });
    const dark = new THREE.MeshStandardMaterial({ color: '#2a2f37', roughness: 0.55, metalness: 0.5 });
    const gold = new THREE.MeshStandardMaterial({ color: '#d4a640', roughness: 0.28, metalness: 1 });
    const hazard = new THREE.MeshStandardMaterial({ color: '#f2b705', roughness: 0.6 });
    const regolithMat = new THREE.MeshStandardMaterial({ color: this.isMoon ? '#8f8c86' : '#9a5232', roughness: 1 });
    this.windowMat = new THREE.MeshStandardMaterial({ color: '#2a1c08', emissive: '#ffc77a', emissiveIntensity: 1.5 });
    this.lampMat = new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#fff1d0', emissiveIntensity: 0.2 });
    this.beaconMat = new THREE.MeshStandardMaterial({ color: '#400', emissive: '#ff2a2a', emissiveIntensity: 3 });

    const add = (parent: THREE.Object3D, geo: THREE.BufferGeometry, mat: THREE.Material, x = 0, y = 0, z = 0) => {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    };
    const module = (id: ModuleId | 'rtg', at: THREE.Vector3, labelY: number) => {
      const g = new THREE.Group();
      g.position.copy(at);
      g.userData.module = id === 'rtg' ? 'power' : id;
      this.scene.add(g);
      this.pickables.push(g);
      const el = document.createElement('div');
      el.className = 'scene-label';
      const obj = new CSS2DObject(el);
      obj.position.set(0, labelY, 0);
      g.add(obj);
      this.labels[id] = el;
      return g;
    };

    // ---- Main habitat (ECLSS)
    const habG = module('eclss', HAB, 10.5);
    add(habG, new THREE.CylinderGeometry(6, 6, 3, 48, 1, true), hab, 0, 1.5, 0);
    add(habG, new THREE.SphereGeometry(6, 48, 20, 0, Math.PI * 2, 0, Math.PI / 2), hab, 0, 3, 0);
    add(habG, new THREE.CylinderGeometry(6.05, 6.05, 0.25, 48), metal, 0, 3, 0);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + 0.3;
      const w = add(habG, new THREE.BoxGeometry(0.9, 0.55, 0.12), this.windowMat, Math.cos(a) * 6.02, 2.1, Math.sin(a) * 6.02);
      w.lookAt(Math.cos(a) * 20, 2.1, Math.sin(a) * 20);
      w.castShadow = false;
    }
    add(habG, new THREE.CylinderGeometry(0.9, 0.9, 0.5, 20), metal, 0, 9.1, 0);
    add(habG, new THREE.CylinderGeometry(0.05, 0.05, 3, 6), metal, 1.5, 9.5, 0);
    add(habG, new THREE.SphereGeometry(0.14, 10, 8), this.beaconMat, 1.5, 11, 0);
    // regolith berm (sandbagged radiation shielding)
    const berm = new THREE.LatheGeometry([new THREE.Vector2(6.1, 0), new THREE.Vector2(8.4, 0), new THREE.Vector2(7.4, 1.1), new THREE.Vector2(6.1, 1.6)], 48);
    add(habG, berm, regolithMat);
    // airlock tube + hatch
    const tube = add(habG, new THREE.CylinderGeometry(1.35, 1.35, 5, 24), hab, 8.2, 1.45, 0);
    tube.rotation.z = Math.PI / 2;
    add(habG, new THREE.BoxGeometry(0.25, 2.2, 1.7), dark, 10.75, 1.4, 0);
    add(habG, new THREE.BoxGeometry(0.3, 0.12, 1.9), hazard, 10.8, 2.6, 0);
    add(habG, new THREE.BoxGeometry(0.1, 0.1, 0.3), this.lampMat, 10.95, 2.75, 0);

    // ---- Greenhouse (OSDR food bay)
    const gh = module('greenhouse', GREENHOUSE, 7.6);
    add(gh, new THREE.CylinderGeometry(4.7, 4.7, 0.8, 40), hab, 0, 0.4, 0);
    const glass = new THREE.MeshPhysicalMaterial({ color: '#d8ecff', transparent: true, opacity: 0.2, roughness: 0.05, metalness: 0.1, side: THREE.DoubleSide, depthWrite: false });
    const dome = add(gh, new THREE.SphereGeometry(4.6, 40, 18, 0, Math.PI * 2, 0, Math.PI / 2), glass, 0, 0.8, 0);
    dome.castShadow = false;
    add(gh, new THREE.SphereGeometry(4.62, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#c7ccd2', wireframe: true }), 0, 0.8, 0).castShadow = false;
    for (const z of [-1.6, 0, 1.6]) add(gh, new THREE.BoxGeometry(5.6, 0.35, 0.9), dark, 0, 1.0, z);
    this.growBarMat = new THREE.MeshStandardMaterial({ color: '#331144', emissive: '#d06bff', emissiveIntensity: 2 });
    for (const z of [-1.6, 0, 1.6]) add(gh, new THREE.BoxGeometry(5, 0.06, 0.2), this.growBarMat, 0, 3.4, z).castShadow = false;
    this.growLight = new THREE.PointLight('#c76bff', 12, 14, 1.5);
    this.growLight.position.set(0, 3, 0);
    gh.add(this.growLight);
    this.plantMat = new THREE.MeshStandardMaterial({ color: '#3fae4a', roughness: 0.7, emissive: '#0b2a0d', emissiveIntensity: 0.4 });
    const plantGeo = new THREE.IcosahedronGeometry(0.32, 1);
    this.plants = new THREE.InstancedMesh(plantGeo, this.plantMat, 27);
    let k = 0;
    for (const z of [-1.6, 0, 1.6]) {
      for (let i = 0; i < 9; i++) {
        const mtx = new THREE.Matrix4().makeTranslation(-2.4 + i * 0.6, 1.35, z + (i % 2 ? 0.15 : -0.15));
        this.plantBase.push(mtx);
        this.plants.setMatrixAt(k++, mtx);
      }
    }
    this.plants.castShadow = true;
    gh.add(this.plants);
    // pressurised tunnel to habitat
    const tun = add(this.scene, new THREE.CylinderGeometry(1.05, 1.05, 5.2, 20), hab, -8.3, 1.1, 2.4);
    tun.rotation.z = Math.PI / 2;

    // ---- Solar arrays (sun-tracking)
    this.solarMat = new THREE.MeshStandardMaterial({ color: '#ffffff', map: cellTex, roughness: 0.22, metalness: 0.65 });
    for (const [i, at] of [SOLAR_A, SOLAR_B].entries()) {
      const g = i === 0 ? module('power', at, 9) : new THREE.Group();
      if (i !== 0) { g.position.copy(at); g.userData.module = 'power'; this.scene.add(g); this.pickables.push(g); }
      add(g, new THREE.CylinderGeometry(0.22, 0.32, 5.6, 12), metal, 0, 2.8, 0);
      add(g, new THREE.CylinderGeometry(0.8, 1, 0.3, 16), dark, 0, 0.15, 0);
      const head = new THREE.Group();
      head.position.y = 5.6;
      g.add(head);
      const tilt = new THREE.Group();
      head.add(tilt);
      const boom = add(tilt, new THREE.CylinderGeometry(0.1, 0.1, 13, 8), metal);
      boom.rotation.z = Math.PI / 2;
      add(tilt, new THREE.BoxGeometry(5.6, 0.08, 3.2), this.solarMat, -3.4, 0, 0);
      add(tilt, new THREE.BoxGeometry(5.6, 0.08, 3.2), this.solarMat, 3.4, 0, 0);
      this.solarHeads.push({ head, tilt });
    }

    // ---- RTG (fenced off from the crew)
    const rtg = module('rtg', RTG, 4.2);
    add(rtg, new THREE.CylinderGeometry(0.55, 0.55, 2.2, 20), dark, 0, 1.3, 0);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const fin = add(rtg, new THREE.BoxGeometry(0.5, 2, 0.05), metal, Math.cos(a) * 0.75, 1.3, Math.sin(a) * 0.75);
      fin.rotation.y = -a;
    }
    this.rtgGlowMat = new THREE.MeshStandardMaterial({ color: '#331100', emissive: '#ff7a1a', emissiveIntensity: 2.5 });
    add(rtg, new THREE.CylinderGeometry(0.62, 0.62, 0.12, 20), this.rtgGlowMat, 0, 0.35, 0);
    add(rtg, new THREE.CylinderGeometry(1.1, 1.1, 0.2, 20), metal, 0, 0.1, 0);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      add(rtg, new THREE.CylinderGeometry(0.06, 0.06, 1.1, 6), hazard, Math.cos(a) * 2.2, 0.55, Math.sin(a) * 2.2);
    }
    this.rtgLight = new THREE.PointLight('#ff8a3a', 5, 9, 1.6);
    this.rtgLight.position.set(0, 1, 0);
    rtg.add(this.rtgLight);

    // ---- Deep-space comms dish
    const comms = module('comms', COMMS, 7.2);
    add(comms, new THREE.CylinderGeometry(0.35, 0.6, 3, 12), white, 0, 1.5, 0);
    const dishG = new THREE.Group();
    dishG.position.y = 3.4;
    comms.add(dishG);
    const prof: THREE.Vector2[] = [];
    for (let i = 0; i <= 12; i++) { const r = (i / 12) * 2.8; prof.push(new THREE.Vector2(r, (r * r) / 6)); }
    add(dishG, new THREE.LatheGeometry(prof, 40), new THREE.MeshStandardMaterial({ color: '#f2f2f0', roughness: 0.35, metalness: 0.3, side: THREE.DoubleSide }));
    add(dishG, new THREE.CylinderGeometry(0.04, 0.04, 1.6, 6), metal, 0, 0.8, 0);
    add(dishG, new THREE.SphereGeometry(0.16, 12, 8), this.beaconMat, 0, 1.65, 0);
    this.commsDir.copy(this.isMoon ? this.earthDir : new THREE.Vector3(0.25, 0.75, -0.6).normalize());
    dishG.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), this.commsDir);
    const ringMat = new THREE.MeshBasicMaterial({ color: '#7fe9ff', transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false });
    for (let i = 0; i < 4; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.04, 6, 40), ringMat.clone());
      ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), this.commsDir);
      ring.userData.offset = i / 4;
      ring.position.copy(COMMS).add(new THREE.Vector3(0, 3.4, 0));
      this.scene.add(ring);
      this.commsRings.push(ring);
    }
    ringMat.dispose();

    // ---- Storm bunker (regolith-covered)
    const bunker = module('bunker', BUNKER, 5.4);
    const mound = add(bunker, new THREE.SphereGeometry(4.6, 32, 14, 0, Math.PI * 2, 0, Math.PI / 2), regolithMat);
    mound.scale.y = 0.55;
    add(bunker, new THREE.BoxGeometry(2.8, 2.6, 2), hab, 0, 1.3, 4.2);
    add(bunker, new THREE.BoxGeometry(2.9, 0.18, 2.05), hazard, 0, 2.7, 4.2);
    this.bunkerDoor = add(bunker, new THREE.BoxGeometry(1.9, 2.05, 0.12), dark, 0, 1.05, 5.25);
    this.bunkerLampMat = new THREE.MeshStandardMaterial({ color: '#111', emissive: '#ffb000', emissiveIntensity: 2.5 });
    add(bunker, new THREE.SphereGeometry(0.14, 10, 8), this.bunkerLampMat, 0, 2.95, 5.2);

    // ---- Rover
    this.rover.userData.module = 'rover';
    this.scene.add(this.rover);
    this.pickables.push(this.rover);
    add(this.rover, new THREE.BoxGeometry(1.8, 0.5, 2.9), white, 0, 0.95, 0);
    add(this.rover, new THREE.BoxGeometry(1.5, 0.95, 1.4), white, 0, 1.6, 0.55);
    add(this.rover, new THREE.BoxGeometry(1.35, 0.55, 0.06), new THREE.MeshPhysicalMaterial({ color: '#1a2a3a', metalness: 0.9, roughness: 0.05 }), 0, 1.75, 1.27);
    add(this.rover, new THREE.BoxGeometry(1.6, 0.05, 1.2), this.solarMat, 0, 1.22, -0.8);
    add(this.rover, new THREE.CylinderGeometry(0.04, 0.04, 1, 6), metal, 0.6, 2.4, 0.2);
    add(this.rover, new THREE.BoxGeometry(0.3, 0.18, 0.18), dark, 0.6, 2.9, 0.25);
    add(this.rover, new THREE.BoxGeometry(1.2, 0.08, 0.08), this.lampMat, 0, 2.1, 1.25);
    for (const x of [-1.02, 1.02]) {
      for (const z of [-1, 0, 1]) {
        const w = new THREE.Group();
        w.position.set(x, 0.45, z);
        const tire = add(w, new THREE.CylinderGeometry(0.45, 0.45, 0.32, 18), dark);
        tire.rotation.z = Math.PI / 2;
        add(w, new THREE.CylinderGeometry(0.2, 0.2, 0.34, 10), metal).rotation.z = Math.PI / 2;
        this.rover.add(w);
        this.roverWheels.push(w);
      }
    }
    const roverLabel = document.createElement('div');
    roverLabel.className = 'scene-label';
    const rl = new CSS2DObject(roverLabel);
    rl.position.set(0, 3.6, 0);
    this.rover.add(rl);
    this.labels.rover = roverLabel;
    const pts = [[10, 10], [22, 30], [5, 52], [-22, 46], [-34, 24], [-14, 20], [4, 16]].map(([x, z]) => new THREE.Vector3(x, this.heightAt(x, z), z));
    this.roverCurve = new THREE.CatmullRomCurve3(pts, true, 'centripetal');
    this.placeRover(0, 0);

    // ---- Artemis lander (the ride home)
    const lander = new THREE.Group();
    lander.position.copy(LANDER);
    lander.position.y = this.heightAt(LANDER.x, LANDER.z) - 0.2;
    this.scene.add(lander);
    add(lander, new THREE.CylinderGeometry(2, 2.2, 8, 24), white, 0, 5.5, 0);
    add(lander, new THREE.CylinderGeometry(2.25, 2.25, 1.6, 24), gold, 0, 2.4, 0);
    add(lander, new THREE.ConeGeometry(2, 2.4, 24), white, 0, 10.7, 0);
    add(lander, new THREE.CylinderGeometry(0.6, 1.1, 1.3, 16), dark, 0, 1.1, 0);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const leg = add(lander, new THREE.CylinderGeometry(0.12, 0.12, 4.2, 8), metal, Math.cos(a) * 2.9, 1.7, Math.sin(a) * 2.9);
      leg.rotation.set(Math.sin(a) * 0.45, 0, -Math.cos(a) * 0.45);
      add(lander, new THREE.CylinderGeometry(0.55, 0.6, 0.12, 12), metal, Math.cos(a) * 3.8, 0.06, Math.sin(a) * 3.8);
    }
    add(lander, new THREE.BoxGeometry(0.9, 1.5, 0.1), dark, 0, 4, 2.15);

    // ---- Floodlight masts
    for (const [x, z] of [[13, 5], [-7, 12], [-3, -9]]) {
      add(this.scene, new THREE.CylinderGeometry(0.08, 0.1, 6.5, 8), metal, x, 3.25, z);
      const head = add(this.scene, new THREE.BoxGeometry(0.7, 0.35, 0.3), this.lampMat, x, 6.6, z);
      head.lookAt(0, 0, 0);
      const spot = new THREE.SpotLight('#fff1d6', 0, 55, 0.75, 0.6, 1.3);
      spot.position.set(x, 6.6, z);
      spot.target.position.set(x * 0.2, 0, z * 0.2);
      this.scene.add(spot, spot.target);
      this.floodLights.push(spot);
    }
  }

  private buildCharacters(): void {
    const rig = buildAstronaut(this.opts.avatar);
    const start = PATROL[0].clone();
    this.player = { rig, pos: start, heading: Math.PI / 2, path: PATROL, idx: 1, pause: 1, speed: this.isMoon ? 1.7 : 1.45 };
    this.scene.add(rig.group);
    const tag = document.createElement('div');
    tag.className = 'scene-label player-tag';
    tag.textContent = this.opts.callsign;
    this.playerTag = new CSS2DObject(tag);
    this.playerTag.position.set(0, 2.45, 0);
    rig.group.add(this.playerTag);

    const npcPaths = [
      [[-11, 8.5], [-20, 8], [-21, 0]],
      [[15, -4], [23, -8], [21, 3]]
    ].map((path) => path.map(([x, z]) => new THREE.Vector3(x, 0, z)));
    npcPaths.forEach((path, i) => {
      const npc = buildAstronaut({ ...CREW_NPC, accent: i === 0 ? '#3fa34d' : '#f2c12e', id: `npc-${i}` });
      this.scene.add(npc.group);
      this.npcs.push({ rig: npc, pos: path[0].clone(), heading: 0, path, idx: 1, pause: i * 2, speed: 1.2 });
    });
  }

  private buildEffects(): void {
    // Magnetic deflector field
    this.field = new THREE.Mesh(
      new THREE.SphereGeometry(36, 64, 32),
      new THREE.ShaderMaterial({
        vertexShader: FIELD_VERT,
        fragmentShader: FIELD_FRAG,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uStrength: { value: 0 }, uColor: { value: new THREE.Color('#38d9ff') } }
      })
    );
    this.field.visible = false;
    this.scene.add(this.field);

    // Solar energetic particle streaks
    const n = 520;
    const r = rng(77);
    const pos = new Float32Array(n * 6);
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    for (let i = 0; i < n; i++) {
      this.flareData.push({
        start: new THREE.Vector3((r() - 0.5) * 80, (r() - 0.5) * 60, (r() - 0.5) * 80),
        end: new THREE.Vector3((r() - 0.5) * 70, r() * 8, (r() - 0.5) * 70),
        p: r(),
        v: 0.35 + r() * 0.5
      });
    }
    this.flareLines = new THREE.LineSegments(
      lg,
      new THREE.LineBasicMaterial({ color: '#ffb35c', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    this.flareLines.frustumCulled = false;
    this.scene.add(this.flareLines);

    if (!this.isMoon) {
      const dn = 4500;
      const dp = new Float32Array(dn * 3);
      for (let i = 0; i < dn; i++) dp.set([(r() - 0.5) * 180, r() * 28, (r() - 0.5) * 180], i * 3);
      const dg = new THREE.BufferGeometry();
      dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
      this.dustPoints = new THREE.Points(dg, new THREE.PointsMaterial({ color: '#c78b5c', size: 0.32, transparent: true, opacity: 0, depthWrite: false }));
      this.dustPoints.frustumCulled = false;
      this.scene.add(this.dustPoints);
      this.scene.fog = new THREE.FogExp2('#c99a73', 0.003);
    }
  }

  // ============================================================ input
  private resizeObserver = new ResizeObserver(() => this.resize());

  private onKeyDown = (e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    const k = e.key.toLowerCase();
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
      if (this.shot === 'avatar' || this.shot === 'helmet') e.preventDefault();
      this.keys.add(k);
    }
  };
  private onKeyUp = (e: KeyboardEvent) => this.keys.delete(e.key.toLowerCase());
  private onBlur = () => this.keys.clear();

  private onPointerDown = (e: PointerEvent) => {
    this.pointerDown = { x: e.clientX, y: e.clientY };
    if (this.tween && !this.cinematic) {
      // user grabbed the camera mid-flight — hand control back immediately
      this.tween = null;
      this.controls.enabled = this.shot !== 'helmet';
    }
    this.controls.autoRotate = false;
  };

  private onPointerMove = (e: PointerEvent) => {
    if (this.shot === 'helmet' && this.pointerDown && !this.cinematic) {
      this.player.heading -= e.movementX * 0.005;
      this.helmetPitch = Math.max(-0.6, Math.min(0.9, this.helmetPitch - e.movementY * 0.004));
      this.manual = true;
      this.manualIdle = 0;
    }
  };

  private onPointerUp = (e: PointerEvent) => {
    const down = this.pointerDown;
    this.pointerDown = null;
    if (!down || this.cinematic || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.camera);
    const hit = this.raycaster.intersectObjects(this.pickables, true)[0];
    let o: THREE.Object3D | null = hit?.object ?? null;
    while (o && !o.userData.module) o = o.parent;
    if (o) this.opts.onModuleClick?.(o.userData.module as ModuleId);
  };

  private bindInput(): void {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
    const el = this.renderer.domElement;
    el.addEventListener('pointerdown', this.onPointerDown);
    el.addEventListener('pointermove', this.onPointerMove);
    el.addEventListener('pointerup', this.onPointerUp);
    this.resizeObserver.observe(this.container);
  }

  private unbindInput(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    const el = this.renderer.domElement;
    el.removeEventListener('pointerdown', this.onPointerDown);
    el.removeEventListener('pointermove', this.onPointerMove);
    el.removeEventListener('pointerup', this.onPointerUp);
  }

  private resize(): void {
    const { clientWidth: w, clientHeight: h } = this.container;
    if (!w || !h) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.composer.setSize(w, h);
    this.bloom.setSize(w, h);
    this.labelRenderer.setSize(w, h);
  }

  // ============================================================ camera shots
  private shotFrame(shot: ShotId): [THREE.Vector3, THREE.Vector3] {
    if (shot === 'avatar') {
      const p = this.player.pos;
      const fwd = new THREE.Vector3(Math.sin(this.player.heading), 0, Math.cos(this.player.heading));
      const side = new THREE.Vector3(fwd.z, 0, -fwd.x);
      const target = p.clone().add(new THREE.Vector3(0, 1.55, 0));
      const pos = p.clone().addScaledVector(fwd, 4.2).addScaledVector(side, 1.4).add(new THREE.Vector3(0, 2, 0));
      return [pos, target];
    }
    if (shot === 'rover') {
      const target = this.rover.position.clone().add(new THREE.Vector3(0, 1.2, 0));
      return [target.clone().add(new THREE.Vector3(7, 4, 8)), target];
    }
    if (shot === 'sky') {
      const pos = new THREE.Vector3(13, 1.9, 21);
      const look = this.isMoon ? this.earthDir.clone() : sunDirection(this.view?.hour ?? 12, false, new THREE.Vector3()).setY(0.32).normalize();
      return [pos, pos.clone().addScaledVector(look, 60)];
    }
    const s = SHOTS[shot === 'helmet' ? 'overview' : shot];
    return [new THREE.Vector3(...s.pos), new THREE.Vector3(...s.target)];
  }

  // ============================================================ per-frame
  private frame = () => {
    this.timer.update();
    const dt = Math.min(0.05, this.timer.getDelta());
    this.elapsed += dt;
    const v = this.view;

    if (v) {
      // wrap-aware hour smoothing so midnight doesn't spin the sun backwards
      let dh = (((v.hour - this.hour) % 24) + 24) % 24;
      if (dh > 12) dh -= 24;
      this.hour = (this.hour + dh * Math.min(1, dt * 1.6) + 24) % 24;
      this.dust = damp(this.dust, v.dust ? Math.min(1, v.dustTau / 4) : 0, 0.8, dt);
      this.flare = damp(this.flare, v.flare ? 1 : 0, 1.5, dt);
      this.shield = damp(this.shield, v.shield ? 1 : 0, 2.5, dt);
    }

    this.updateEnvironment(dt);
    if (v) this.updateModules(dt, v);
    this.updateCharacters(dt);
    this.updateCamera(dt);

    if (this.inXR) {
      this.renderer.render(this.scene, this.camera);
    } else {
      this.composer.render(dt);
      if (!this.cinematic && this.labelsVisible) this.labelRenderer.render(this.scene, this.camera);
    }
  };

  private updateEnvironment(dt: number): void {
    sunDirection(this.hour, this.isMoon, this.sunDir);
    const sunUp = smoothstep(-0.05, 0.12, this.sunDir.y);
    const dustK = this.dust;
    const flareK = this.flare;
    const pulse = 0.5 + 0.5 * Math.sin(this.elapsed * 6);

    // sky follows the camera like a skybox
    const camWorld = this.camera.getWorldPosition(new THREE.Vector3());
    this.skyGroup.position.copy(camWorld);
    this.sunSprite.position.copy(this.sunDir).multiplyScalar(800);
    this.sunSprite.visible = this.sunDir.y > -0.08;
    const sunMat = this.sunSprite.material;
    sunMat.color.set(flareK > 0.05 ? '#ffd2a0' : '#ffffff').lerp(new THREE.Color('#ff7a3a'), flareK * pulse * 0.6);
    sunMat.opacity = 1 - dustK * 0.65;
    this.sunSprite.scale.setScalar((this.isMoon ? 95 : 58) * (1 + flareK * (0.6 + pulse * 0.5)));

    if (this.earth) {
      this.earth.position.copy(this.earthDir).multiplyScalar(700);
      this.earth.rotation.y += dt * 0.02;
    }
    if (this.skyMat) {
      this.skyMat.uniforms.uSunDir.value.copy(this.sunDir);
      this.skyMat.uniforms.uDust.value = dustK;
      this.skyMat.uniforms.uDay.value = sunUp;
    }
    this.starsMat.opacity = this.isMoon ? 0.9 : Math.max(0, 1 - sunUp * 1.4) * (1 - dustK * 0.8);

    // lights
    const sunI = (this.isMoon ? 3.6 : 2.4) * sunUp * (1 - dustK * 0.72);
    this.sunLight.intensity = sunI + flareK * pulse * 1.2;
    this.sunLight.color.set('#fff6e8').lerp(new THREE.Color('#ff9a5a'), flareK * 0.5);
    this.sunLight.position.copy(this.sunDir).multiplyScalar(160);
    this.sunLight.castShadow = sunUp > 0.05;
    this.hemi.intensity = this.isMoon ? 0.12 + 0.18 * sunUp : (0.12 + 0.6 * sunUp) * (1 - dustK * 0.3) + dustK * 0.25;
    this.earthshine.intensity = (1 - sunUp) * (this.isMoon ? 0.35 : 0.12) + flareK * pulse * 0.15;
    this.earthshine.color.set(this.isMoon ? '#6f8fd6' : '#4a3a4a').lerp(new THREE.Color('#ff4a2a'), flareK * 0.6);
    this.scene.environmentIntensity = 0.12 + 0.25 * sunUp;

    if (this.scene.fog instanceof THREE.FogExp2) {
      const day = new THREE.Color('#c99a73').lerp(new THREE.Color('#9a6a48'), dustK);
      this.scene.fog.color.copy(new THREE.Color('#06050a').lerp(day, sunUp));
      this.scene.fog.density = 0.0022 + dustK * 0.014;
    }

    // magnetic field
    this.field.visible = this.shield > 0.01;
    this.field.material.uniforms.uStrength.value = this.shield;
    this.field.material.uniforms.uTime.value = this.elapsed;

    // flare particle streaks
    const lines = this.flareLines;
    lines.visible = flareK > 0.02;
    if (lines.visible) {
      (lines.material as THREE.LineBasicMaterial).opacity = flareK * 0.9;
      const attr = lines.geometry.attributes.position as THREE.BufferAttribute;
      const origin = this.sunDir.clone().multiplyScalar(240);
      const a = new THREE.Vector3();
      const tail = this.sunDir.clone().multiplyScalar(3.5);
      this.flareData.forEach((f, i) => {
        f.p += dt * f.v;
        if (f.p > 1) f.p -= 1;
        a.copy(origin).add(f.start).lerp(f.end, f.p);
        attr.setXYZ(i * 2, a.x, a.y, a.z);
        attr.setXYZ(i * 2 + 1, a.x + tail.x, a.y + tail.y, a.z + tail.z);
      });
      attr.needsUpdate = true;
    }

    // Martian dust
    if (this.dustPoints) {
      const mat = this.dustPoints.material as THREE.PointsMaterial;
      mat.opacity = dustK * 0.75;
      this.dustPoints.visible = dustK > 0.02;
      if (this.dustPoints.visible) {
        const attr = this.dustPoints.geometry.attributes.position as THREE.BufferAttribute;
        const cx = this.controls.target.x;
        const cz = this.controls.target.z;
        for (let i = 0; i < attr.count; i++) {
          let x = attr.getX(i) + dt * (9 + (i % 7));
          let z = attr.getZ(i) + dt * 2.5;
          if (x - cx > 90) x -= 180;
          if (x - cx < -90) x += 180;
          if (z - cz > 90) z -= 180;
          if (z - cz < -90) z += 180;
          attr.setXYZ(i, x, attr.getY(i) + Math.sin(this.elapsed + i) * dt * 0.4, z);
        }
        attr.needsUpdate = true;
      }
    }
  }

  private updateModules(dt: number, v: SceneViewState): void {
    const night = 1 - smoothstep(-0.05, 0.12, this.sunDir.y);
    const blink = Math.sin(this.elapsed * 3) > 0.6 ? 1 : 0.1;

    // solar arrays track the sun; stow flat at night
    const az = Math.atan2(this.sunDir.x, this.sunDir.z);
    const tiltTarget = night > 0.6 ? 0 : Math.min(1.45, Math.max(0.15, Math.PI / 2 - Math.asin(Math.max(0, this.sunDir.y))));
    for (const s of this.solarHeads) {
      let d = az - s.head.rotation.y;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      s.head.rotation.y += d * Math.min(1, dt * 0.8);
      s.tilt.rotation.x = damp(s.tilt.rotation.x, tiltTarget, 0.8, dt);
    }
    this.solarMat.color.set('#ffffff').lerp(new THREE.Color('#b77a52'), this.dust * 0.6);

    this.windowMat.emissiveIntensity = 0.6 + night * 2.2;
    this.lampMat.emissiveIntensity = 0.2 + night * 6;
    this.floodLights.forEach((l) => (l.intensity = night * 65));
    this.beaconMat.emissiveIntensity = blink * 4;
    this.rtgGlowMat.emissiveIntensity = 2 + Math.sin(this.elapsed * 1.7) * 0.6;
    this.rtgLight.intensity = 4 + Math.sin(this.elapsed * 1.7) * 1.2;

    const ghPower = Math.min(1.2, v.greenhouseKW / 16);
    this.growLight.intensity = 4 + ghPower * 14;
    this.growBarMat.emissiveIntensity = 0.4 + ghPower * 2.4;
    const growth = 0.45 + (v.cropGrowth / 100) * 0.9;
    const healthy = Math.max(0, Math.min(1, v.cropHealth / 100));
    this.plantMat.color.set('#8a6a3a').lerp(new THREE.Color('#3fae4a'), healthy);
    const tmp = new THREE.Matrix4();
    this.plantBase.forEach((base, i) => {
      const sway = 1 + Math.sin(this.elapsed * 1.3 + i) * 0.03;
      tmp.copy(base).multiply(new THREE.Matrix4().makeScale(growth * sway, growth * (0.7 + healthy * 0.5), growth * sway));
      this.plants.setMatrixAt(i, tmp);
    });
    this.plants.instanceMatrix.needsUpdate = true;

    // bunker blast door
    const doorX = v.bunker ? 0 : 1.95;
    this.bunkerDoor.position.x = damp(this.bunkerDoor.position.x, doorX, 3, dt);
    this.bunkerLampMat.emissive.set(v.bunker ? '#ff2a2a' : '#ffb000');
    this.bunkerLampMat.emissiveIntensity = v.bunker ? blink * 5 : 2;

    // comms pulses
    this.commsRings.forEach((ring) => {
      const t = (this.elapsed * 0.35 + (ring.userData.offset as number)) % 1;
      ring.position.copy(COMMS).add(new THREE.Vector3(0, 3.4, 0)).addScaledVector(this.commsDir, 1.5 + t * 26);
      ring.scale.setScalar(0.8 + t * 3.5);
      (ring.material as THREE.MeshBasicMaterial).opacity = (1 - t) * 0.55;
    });

    // rover drives its EVA loop once the player has boarded
    const len = this.roverCurve.getLength();
    const driving = v.eva && this.playerHidden && this.player.idx === -2;
    const returning = !v.eva && this.roverU > 0.0001;
    if (driving || returning) {
      const prev = this.roverU;
      this.roverU += (4.2 * dt) / len;
      if (returning && this.roverU >= 1) this.roverU = 0;
      else this.roverU %= 1;
      this.placeRover(this.roverU, (this.roverU - prev + 1) % 1 * len);
    }

    // floating telemetry labels
    if (this.labelsVisible && !this.cinematic) {
      const set = (k: ModuleId | 'rtg', html: string) => {
        const el = this.labels[k];
        if (el && el.innerHTML !== html) el.innerHTML = html;
      };
      set('power', `<b>☀️ ${Math.round(v.solarKW)} kW</b><span>Solar · battery ${Math.round(v.batteryPct)}%</span>`);
      set('rtg', `<b>⚛️ ${Math.round(v.rtgKW)} kW</b><span>RTG baseload</span>`);
      set('eclss', `<b>🫁 O₂ ${Math.round(v.oxygen)}%</b><span>Habitat · ECLSS</span>`);
      set('greenhouse', `<b>🌱 ${Math.round(v.cropGrowth)}%</b><span>Crop health ${Math.round(v.cropHealth)}%</span>`);
      set('comms', `<b>📡 ${this.isMoon ? '1.3 s' : '4–24 min'}</b><span>Delay to Earth</span>`);
      set('rover', v.eva ? '<b>🔬 EVA</b><span>Collecting samples</span>' : '<b>🚙 Docked</b><span>Charging</span>');
      set('bunker', v.bunker ? '<b>🔒 SEALED</b><span>Crew sheltered</span>' : '<b>🏰 Shelter</b><span>2.5 m regolith</span>');
    }
  }

  private placeRover(u: number, dist: number): void {
    const p = this.roverCurve.getPointAt(u);
    const t = this.roverCurve.getTangentAt(u);
    p.y = this.heightAt(p.x, p.z);
    this.rover.position.copy(p);
    this.rover.rotation.y = Math.atan2(t.x, t.z);
    this.roverWheels.forEach((w) => (w.rotation.x += dist / 0.45));
  }

  private resolveCollisions(p: THREE.Vector3): void {
    for (const c of COLLIDERS) {
      const dx = p.x - c.x;
      const dz = p.z - c.z;
      const d = Math.hypot(dx, dz);
      if (d < c.r && d > 1e-4) {
        p.x = c.x + (dx / d) * c.r;
        p.z = c.z + (dz / d) * c.r;
      }
    }
    const d = Math.hypot(p.x, p.z);
    if (d > 140) p.multiplyScalar(140 / d);
  }

  private stepWalker(w: Walker, target: THREE.Vector3, dt: number): boolean {
    const dx = target.x - w.pos.x;
    const dz = target.z - w.pos.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 0.35) return true;
    const want = Math.atan2(dx, dz);
    let d = want - w.heading;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    w.heading += d * Math.min(1, dt * 5);
    const step = Math.min(dist, w.speed * dt);
    w.pos.x += Math.sin(w.heading) * step;
    w.pos.z += Math.cos(w.heading) * step;
    this.resolveCollisions(w.pos);
    return false;
  }

  private updateCharacters(dt: number): void {
    const v = this.view;
    const low = this.isMoon;
    const p = this.player;
    let moving = false;

    const keyMove = new THREE.Vector2(
      (this.keys.has('d') || this.keys.has('arrowright') ? 1 : 0) - (this.keys.has('a') || this.keys.has('arrowleft') ? 1 : 0),
      (this.keys.has('w') || this.keys.has('arrowup') ? 1 : 0) - (this.keys.has('s') || this.keys.has('arrowdown') ? 1 : 0)
    );
    const canDrive = !this.cinematic && !this.inXR && (this.shot === 'avatar' || this.shot === 'helmet') && !v?.bunker && !v?.eva;

    if (canDrive && keyMove.lengthSq() > 0) {
      this.manual = true;
      this.manualIdle = 0;
      if (this.playerHidden) this.playerHidden = false;
      if (this.shot === 'helmet') {
        p.heading -= keyMove.x * dt * 1.8;
        const step = keyMove.y * p.speed * 1.3 * dt;
        p.pos.x += Math.sin(p.heading) * step;
        p.pos.z += Math.cos(p.heading) * step;
        moving = keyMove.y !== 0;
      } else {
        const fwd = new THREE.Vector3();
        this.camera.getWorldDirection(fwd);
        fwd.y = 0;
        fwd.normalize();
        const right = new THREE.Vector3(-fwd.z, 0, fwd.x);
        const dir = fwd.multiplyScalar(keyMove.y).addScaledVector(right, keyMove.x).normalize();
        const want = Math.atan2(dir.x, dir.z);
        let d = want - p.heading;
        d = Math.atan2(Math.sin(d), Math.cos(d));
        p.heading += d * Math.min(1, dt * 10);
        p.pos.addScaledVector(dir, p.speed * 1.3 * dt);
        moving = true;
      }
      this.resolveCollisions(p.pos);
    } else if (this.manual) {
      this.manualIdle += dt;
      if (this.manualIdle > 12 || v?.bunker || v?.eva) {
        this.manual = false;
        // resume patrol from the nearest waypoint
        let best = 0;
        PATROL.forEach((w, i) => { if (w.distanceToSquared(p.pos) < PATROL[best].distanceToSquared(p.pos)) best = i; });
        p.idx = best;
      }
    } else if (v?.bunker) {
      if (!this.playerHidden && this.stepWalker(p, BUNKER_DOOR, dt)) { this.playerHidden = true; p.idx = -1; }
      moving = !this.playerHidden;
    } else if (v?.eva) {
      const boardAt = this.rover.position.clone().add(new THREE.Vector3(-1.8, 0, 0));
      if (!this.playerHidden && this.roverU < 0.001 && this.stepWalker(p, boardAt, dt)) { this.playerHidden = true; p.idx = -2; }
      moving = !this.playerHidden;
    } else {
      if (this.playerHidden) {
        // step out of wherever we were sheltering
        p.pos.copy(p.idx === -2 ? ROVER_DOCK.clone().add(new THREE.Vector3(-2, 0, 0)) : BUNKER_DOOR.clone().add(new THREE.Vector3(0, 0, 1)));
        if (p.idx === -2 && this.roverU > 0.0001) { /* wait for rover to return */ }
        else { this.playerHidden = false; p.idx = 8; p.pause = 1.5; }
      } else if (p.pause > 0) {
        p.pause -= dt;
      } else if (p.idx >= 0 && this.stepWalker(p, p.path[p.idx], dt)) {
        p.pause = 2 + ((p.idx * 7) % 3);
        p.idx = (p.idx + 1) % p.path.length;
      } else {
        moving = p.idx >= 0;
      }
    }

    p.pos.y = this.heightAt(p.pos.x, p.pos.z);
    p.rig.group.position.copy(p.pos);
    p.rig.group.rotation.y = p.heading;
    p.rig.group.visible = !this.playerHidden && !(this.shot === 'helmet' && !this.cinematic);
    p.rig.update(dt, moving, low);
    this.playerTag.visible = p.rig.group.visible && this.labelsVisible;

    for (const n of this.npcs) {
      const hidden = Boolean(v?.bunker);
      n.rig.group.visible = !hidden;
      if (hidden) continue;
      let walking = false;
      if (n.pause > 0) n.pause -= dt;
      else if (this.stepWalker(n, n.path[n.idx], dt)) { n.pause = 3 + Math.random() * 3; n.idx = (n.idx + 1) % n.path.length; }
      else walking = true;
      n.pos.y = this.heightAt(n.pos.x, n.pos.z);
      n.rig.group.position.copy(n.pos);
      n.rig.group.rotation.y = n.heading;
      n.rig.update(dt, walking, low);
    }
  }

  private updateCamera(dt: number): void {
    if (this.inXR) return;

    if (this.shot === 'helmet' && !this.tween) {
      const head = new THREE.Vector3();
      this.player.rig.head.getWorldPosition(head);
      const fwd = new THREE.Vector3(Math.sin(this.player.heading), 0, Math.cos(this.player.heading));
      this.camera.position.copy(head).addScaledVector(fwd, 0.28);
      const look = this.camera.position.clone().addScaledVector(fwd, 10);
      look.y += Math.tan(this.helmetPitch) * 10;
      this.camera.lookAt(look);
      this.controls.target.copy(look);
      return;
    }

    // things the camera tracks
    const follow = this.shot === 'avatar' ? this.player.pos : this.shot === 'rover' ? this.rover.position : null;

    if (this.tween) {
      const tw = this.tween;
      tw.t = Math.min(1, tw.t + dt / tw.dur);
      const k = easeInOut(tw.t);
      if (follow) {
        const [pos, target] = this.shotFrame(this.shot);
        tw.toPos.copy(pos);
        tw.toTarget.copy(target);
      }
      this.camera.position.lerpVectors(tw.fromPos, tw.toPos, k);
      this.controls.target.lerpVectors(tw.fromTarget, tw.toTarget, k);
      this.camera.lookAt(this.controls.target);
      if (tw.t >= 1) {
        this.tween = null;
        this.controls.enabled = !this.cinematic;
        if (follow) this.followPrev.copy(follow);
      }
      return;
    }

    if (follow) {
      const delta = follow.clone().sub(this.followPrev);
      this.camera.position.add(delta);
      this.controls.target.add(delta);
      this.followPrev.copy(follow);
    }
    this.controls.update(dt);
    // never let the camera clip into the ground
    const ground = this.heightAt(this.camera.position.x, this.camera.position.z) + 1.2;
    if (this.camera.position.y < ground) this.camera.position.y = ground;
  }
}
