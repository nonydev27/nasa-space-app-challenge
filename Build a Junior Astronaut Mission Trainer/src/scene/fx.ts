// Small reusable effects: a GPU particle pool (jet exhaust, landing dust),
// jetpack flames attached to an astronaut, and regolith bootprints.

import * as THREE from 'three';
import type { AstronautRig } from './astronaut';

const PARTICLE_VERT = /* glsl */ `
attribute float aAlpha;
attribute float aSize;
attribute vec3 aColor;
varying float vAlpha;
varying vec3 vColor;
void main() {
  vAlpha = aAlpha;
  vColor = aColor;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * (320.0 / max(0.1, -mv.z));
  gl_Position = projectionMatrix * mv;
}`;

const PARTICLE_FRAG = /* glsl */ `
varying float vAlpha;
varying vec3 vColor;
void main() {
  float r = length(gl_PointCoord - 0.5);
  if (r > 0.5) discard;
  gl_FragColor = vec4(vColor, vAlpha * smoothstep(0.5, 0.0, r));
}`;

/** Fixed-size particle pool with per-particle colour, size and fade. */
export class ParticlePool {
  readonly points: THREE.Points;
  private pos: Float32Array;
  private vel: Float32Array;
  private col: Float32Array;
  private alpha: Float32Array;
  private size: Float32Array;
  private baseSize: Float32Array;
  private life: Float32Array;
  private maxLife: Float32Array;
  private next = 0;
  private readonly max: number;
  private readonly drag: number;
  private readonly grow: number;

  constructor(max: number, opts: { additive: boolean; drag?: number; grow?: number }) {
    this.max = max;
    this.drag = opts.drag ?? 0.8;
    this.grow = opts.grow ?? 1.5;
    this.pos = new Float32Array(max * 3);
    this.vel = new Float32Array(max * 3);
    this.col = new Float32Array(max * 3);
    this.alpha = new Float32Array(max);
    this.size = new Float32Array(max);
    this.baseSize = new Float32Array(max);
    this.life = new Float32Array(max);
    this.maxLife = new Float32Array(max).fill(1);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aColor', new THREE.BufferAttribute(this.col, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aAlpha', new THREE.BufferAttribute(this.alpha, 1).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aSize', new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage));
    this.points = new THREE.Points(
      g,
      new THREE.ShaderMaterial({
        vertexShader: PARTICLE_VERT,
        fragmentShader: PARTICLE_FRAG,
        transparent: true,
        depthWrite: false,
        blending: opts.additive ? THREE.AdditiveBlending : THREE.NormalBlending
      })
    );
    this.points.frustumCulled = false;
  }

  emit(p: THREE.Vector3, v: THREE.Vector3, life: number, size: number, color: THREE.Color, alpha = 1): void {
    const i = this.next;
    this.next = (this.next + 1) % this.max;
    this.pos.set([p.x, p.y, p.z], i * 3);
    this.vel.set([v.x, v.y, v.z], i * 3);
    this.col.set([color.r, color.g, color.b], i * 3);
    this.life[i] = life;
    this.maxLife[i] = life;
    this.baseSize[i] = size;
    this.alpha[i] = alpha;
    this.size[i] = size;
  }

  update(dt: number, gravity: number): void {
    const damp = Math.exp(-this.drag * dt);
    for (let i = 0; i < this.max; i++) {
      if (this.life[i] <= 0) {
        this.alpha[i] = 0;
        continue;
      }
      this.life[i] -= dt;
      const k = Math.max(0, this.life[i] / this.maxLife[i]);
      const j = i * 3;
      this.vel[j] *= damp;
      this.vel[j + 1] = this.vel[j + 1] * damp - gravity * dt;
      this.vel[j + 2] *= damp;
      this.pos[j] += this.vel[j] * dt;
      this.pos[j + 1] = Math.max(0.02, this.pos[j + 1] + this.vel[j + 1] * dt);
      this.pos[j + 2] += this.vel[j + 2] * dt;
      this.alpha[i] = k * k;
      this.size[i] = this.baseSize[i] * (1 + (1 - k) * this.grow);
    }
    const a = this.points.geometry.attributes;
    a.position.needsUpdate = true;
    a.aAlpha.needsUpdate = true;
    a.aSize.needsUpdate = true;
    a.aColor.needsUpdate = true;
  }
}

/** Twin flame cones + glow light under an astronaut's backpack. */
export class JetFlames {
  private cones: THREE.Mesh[] = [];
  private light: THREE.PointLight;
  private level = 0;
  private emitAcc = 0;
  private readonly rig: AstronautRig;
  private static outer = new THREE.MeshBasicMaterial({ color: '#ff8a3c', transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
  private static inner = new THREE.MeshBasicMaterial({ color: '#cfeeff', transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
  private static geo = new THREE.ConeGeometry(0.075, 0.7, 12, 1, true).rotateX(Math.PI).translate(0, -0.35, 0); // wide at the nozzle, tip pointing down

  constructor(rig: AstronautRig) {
    this.rig = rig;
    for (const n of rig.nozzles) {
      const outer = new THREE.Mesh(JetFlames.geo, JetFlames.outer);
      const inner = new THREE.Mesh(JetFlames.geo, JetFlames.inner);
      inner.scale.set(0.5, 0.6, 0.5);
      outer.add(inner);
      outer.position.y = -0.02;
      outer.visible = false;
      n.add(outer);
      this.cones.push(outer);
    }
    this.light = new THREE.PointLight('#9fd6ff', 0, 4.5, 1.8);
    this.light.position.set(0, 0.7, -0.4);
    rig.group.add(this.light);
  }

  update(dt: number, on: boolean, time: number, exhaust?: ParticlePool): void {
    this.level += ((on ? 1 : 0) - this.level) * Math.min(1, dt * 14);
    const flicker = 0.85 + Math.sin(time * 60) * 0.1 + Math.random() * 0.12;
    for (const c of this.cones) {
      c.visible = this.level > 0.03;
      c.scale.set(1, this.level * flicker * 1.4, 1);
    }
    this.light.intensity = this.level * 1.8 * flicker;
    if (exhaust && this.level > 0.3) {
      this.emitAcc += dt * 70;
      const wp = new THREE.Vector3();
      while (this.emitAcc > 1) {
        this.emitAcc -= 1;
        const n = this.rig.nozzles[Math.random() < 0.5 ? 0 : 1];
        n.getWorldPosition(wp);
        wp.y -= 0.25;
        exhaust.emit(
          wp,
          new THREE.Vector3((Math.random() - 0.5) * 0.8, -4 - Math.random() * 3, (Math.random() - 0.5) * 0.8),
          0.35 + Math.random() * 0.25,
          0.18 + Math.random() * 0.12,
          JET_COLORS[(Math.random() * JET_COLORS.length) | 0]
        );
      }
    }
  }
}

const JET_COLORS = ['#ffd27a', '#ff9a4a', '#9fd6ff', '#ffffff'].map((c) => new THREE.Color(c));

/** Ring buffer of bootprint decals pressed into the regolith. */
export class Footprints {
  readonly mesh: THREE.InstancedMesh;
  private next = 0;
  private readonly max: number;
  private readonly m = new THREE.Matrix4();
  private readonly q = new THREE.Quaternion();

  constructor(max: number, isMoon: boolean) {
    this.max = max;
    const g = new THREE.PlaneGeometry(0.17, 0.32).rotateX(-Math.PI / 2);
    const mat = new THREE.MeshStandardMaterial({
      color: isMoon ? '#3c3a37' : '#4a2414',
      transparent: true,
      opacity: 0.45,
      roughness: 1,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2
    });
    this.mesh = new THREE.InstancedMesh(g, mat, max);
    this.mesh.count = 0;
    this.mesh.frustumCulled = false;
  }

  stamp(x: number, y: number, z: number, heading: number): void {
    this.q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), heading);
    this.m.compose(new THREE.Vector3(x, y + 0.03, z), this.q, new THREE.Vector3(1, 1, 1));
    this.mesh.setMatrixAt(this.next, this.m);
    this.next = (this.next + 1) % this.max;
    this.mesh.count = Math.min(this.max, this.mesh.count + 1);
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
