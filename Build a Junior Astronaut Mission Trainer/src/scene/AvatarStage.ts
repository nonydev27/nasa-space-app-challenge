// Small turntable scene used on the avatar-selection screen.

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { AvatarConfig } from '../game/types';
import { buildAstronaut, type AstronautRig } from './astronaut';
import { rng } from './noise';

/** Launch speed for the gravity lab, m/s (a strong two-footed hop in a suit). */
export const JUMP_SPEED = 2.6;

export class AvatarStage {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private rig: AstronautRig | null = null;
  private turntable = new THREE.Group();
  private timer = new THREE.Timer();
  private container: HTMLElement;
  private ro: ResizeObserver;
  private walkT = 0;
  private envTex: THREE.Texture;
  // interaction
  private spinVel = 0;
  private dragX: number | null = null;
  private jumpY = 0;
  private jumpV = 0;
  private gravity = 0;
  private peak = 0;
  private onLand?: (peak: number) => void;
  private marker: THREE.Mesh;

  constructor(container: HTMLElement) {
    this.container = container;
    const { clientWidth: w, clientHeight: h } = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(w, h);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.shadowMap.enabled = true;
    this.renderer.domElement.className = 'avatar-stage-canvas';
    container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(32, w / h, 0.1, 200);
    this.camera.position.set(0, 1.5, 6.6);
    this.camera.lookAt(0, 0.95, 0);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    this.scene.environment = this.envTex;
    this.scene.environmentIntensity = 0.25;

    const key = new THREE.DirectionalLight('#fff4e0', 1.6);
    key.position.set(3, 5, 4);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    const rim = new THREE.DirectionalLight('#5fd8ff', 1.0);
    rim.position.set(-4, 3, -4);
    const fill = new THREE.HemisphereLight('#9ab7ff', '#20160f', 0.35);
    this.scene.add(key, rim, fill);

    // Launch-pad platform
    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(1.3, 1.4, 0.16, 48),
      new THREE.MeshStandardMaterial({ color: '#1d2433', metalness: 0.7, roughness: 0.35 })
    );
    pad.position.y = -0.08;
    pad.receiveShadow = true;
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.32, 0.02, 8, 64),
      new THREE.MeshStandardMaterial({ color: '#000', emissive: '#38d9ff', emissiveIntensity: 3 })
    );
    ring.rotation.x = Math.PI / 2;
    this.scene.add(pad, ring, this.turntable);

    // distant stars
    const r = rng(4);
    const pts = new Float32Array(900 * 3);
    for (let i = 0; i < 900; i++) pts.set([(r() - 0.5) * 80, (r() - 0.2) * 40, -20 - r() * 40], i * 3);
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.BufferAttribute(pts, 3));
    this.scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: '#cfd8ff', size: 0.08, transparent: true, opacity: 0.8 })));

    this.ro = new ResizeObserver(() => {
      const { clientWidth: cw, clientHeight: ch } = this.container;
      if (!cw || !ch) return;
      this.camera.aspect = cw / ch;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(cw, ch);
    });
    // peak-height marker for the gravity lab
    this.marker = new THREE.Mesh(
      new THREE.TorusGeometry(0.55, 0.015, 6, 48),
      new THREE.MeshBasicMaterial({ color: '#ffb547', transparent: true, opacity: 0 })
    );
    this.marker.rotation.x = Math.PI / 2;
    this.scene.add(this.marker);

    this.ro.observe(container);
    const el = this.renderer.domElement;
    el.style.touchAction = 'none';
    el.addEventListener('pointerdown', this.onDown);
    window.addEventListener('pointermove', this.onMove);
    window.addEventListener('pointerup', this.onUp);
    this.renderer.setAnimationLoop(this.frame);
  }

  private downAt = 0;
  private onDown = (e: PointerEvent) => {
    this.dragX = e.clientX;
    this.downAt = performance.now();
  };
  private onMove = (e: PointerEvent) => {
    if (this.dragX === null) return;
    const dx = e.clientX - this.dragX;
    this.dragX = e.clientX;
    this.turntable.rotation.y += dx * 0.012;
    this.spinVel = dx * 0.6;
  };
  private onUp = () => {
    if (this.dragX !== null && performance.now() - this.downAt < 220 && Math.abs(this.spinVel) < 2) this.wave();
    this.dragX = null;
  };

  /** Little celebration: a quick spin and a few steps. */
  wave(): void {
    this.spinVel = 9;
    this.walkT = 1.2;
  }

  /**
   * Jump with the same push on different worlds (gravity in m/s²).
   * Peak height = v² / 2g, so the Moon's weak gravity sends you about 6× higher than Earth.
   */
  jump(gravity: number, onLand?: (peak: number) => void): void {
    if (this.jumpY > 0.001) return;
    this.gravity = gravity;
    this.jumpV = JUMP_SPEED;
    this.peak = 0;
    this.onLand = onLand;
    this.marker.position.y = (JUMP_SPEED * JUMP_SPEED) / (2 * gravity) + 1.85;
    (this.marker.material as THREE.MeshBasicMaterial).opacity = 0.9;
  }

  setAvatar(av: AvatarConfig): void {
    if (this.rig) {
      this.turntable.remove(this.rig.group);
      this.rig.dispose();
    }
    this.rig = buildAstronaut(av);
    this.turntable.add(this.rig.group);
    this.walkT = 1.4; // little showcase step whenever the avatar changes
  }

  private frame = () => {
    this.timer.update();
    const dt = Math.min(0.05, this.timer.getDelta());
    if (this.dragX === null) {
      this.spinVel *= Math.pow(0.04, dt);
      this.turntable.rotation.y += dt * (0.5 + this.spinVel);
    }
    this.walkT = Math.max(0, this.walkT - dt);
    if (this.jumpV !== 0 || this.jumpY > 0) {
      this.jumpV -= this.gravity * dt;
      this.jumpY = Math.max(0, this.jumpY + this.jumpV * dt);
      this.peak = Math.max(this.peak, this.jumpY);
      if (this.jumpY === 0 && this.jumpV < 0) {
        this.jumpV = 0;
        this.onLand?.(this.peak);
        this.onLand = undefined;
      }
    }
    this.turntable.position.y = this.jumpY;
    // camera rises and pulls back so even a Moon jump stays in frame
    const lift = Math.min(this.jumpY, 2.4);
    this.camera.position.y += (1.5 + lift * 0.75 - this.camera.position.y) * Math.min(1, dt * 6);
    this.camera.position.z += (6.6 + lift * 1.6 - this.camera.position.z) * Math.min(1, dt * 6);
    this.camera.lookAt(0, 0.95 + lift * 0.8, 0);
    const mm = this.marker.material as THREE.MeshBasicMaterial;
    if (this.jumpY === 0) mm.opacity = Math.max(0, mm.opacity - dt * 0.5);
    this.rig?.update(dt, this.walkT > 0, true, this.jumpY > 0.02);
    this.renderer.render(this.scene, this.camera);
  };

  dispose(): void {
    this.renderer.setAnimationLoop(null);
    this.renderer.domElement.removeEventListener('pointerdown', this.onDown);
    window.removeEventListener('pointermove', this.onMove);
    window.removeEventListener('pointerup', this.onUp);
    this.ro.disconnect();
    this.rig?.dispose();
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
      const mat = m.material as THREE.Material | undefined;
      if (mat && !Array.isArray(mat)) mat.dispose();
    });
    this.envTex.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss(); // free the GPU context now (browsers cap live WebGL contexts)
    this.renderer.domElement.remove();
  }
}
