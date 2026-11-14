// Small turntable scene used on the avatar-selection screen.

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { AvatarConfig } from '../game/types';
import { buildAstronaut, type AstronautRig } from './astronaut';
import { rng } from './noise';

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
    this.ro.observe(container);
    this.renderer.setAnimationLoop(this.frame);
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
    this.turntable.rotation.y += dt * 0.5;
    this.walkT = Math.max(0, this.walkT - dt);
    this.rig?.update(dt, this.walkT > 0, true);
    this.renderer.render(this.scene, this.camera);
  };

  dispose(): void {
    this.renderer.setAnimationLoop(null);
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
    this.renderer.domElement.remove();
  }
}
