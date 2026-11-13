// Procedural spacesuit character (≈1.9 m) modelled loosely on NASA's xEMU / AxEMU
// suits: white pressure garment, life-support backpack (PLSS), reflective visor,
// coloured identification stripes. Animated with a low-gravity "bunny hop" on the
// Moon and a heavier stride on Mars.

import * as THREE from 'three';
import type { AvatarConfig } from '../game/types';

export interface AstronautRig {
  group: THREE.Group;
  /** Head anchor used for the helmet-cam view and name tag */
  head: THREE.Object3D;
  /** Jetpack nozzle anchors (in group space), for exhaust effects */
  nozzles: THREE.Object3D[];
  update(dt: number, moving: boolean, lowGravity: boolean, airborne?: boolean): void;
  dispose(): void;
}

export function buildAstronaut(av: AvatarConfig): AstronautRig {
  const group = new THREE.Group();
  group.name = `astronaut-${av.id}`;

  const suit = new THREE.MeshStandardMaterial({ color: av.suit, roughness: 0.78, metalness: 0.02 });
  const accent = new THREE.MeshStandardMaterial({ color: av.accent, roughness: 0.55, metalness: 0.1 });
  const dark = new THREE.MeshStandardMaterial({ color: '#2b3038', roughness: 0.6, metalness: 0.35 });
  const metal = new THREE.MeshStandardMaterial({ color: '#b8bec6', roughness: 0.3, metalness: 0.85 });
  const skin = new THREE.MeshStandardMaterial({ color: av.skin, roughness: 0.65 });
  const visor = new THREE.MeshPhysicalMaterial({
    color: av.visor,
    metalness: 0.95,
    roughness: 0.06,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    transparent: true,
    opacity: 0.72
  });
  const lamp = new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#fff4d6', emissiveIntensity: 2.2 });
  const materials = [suit, accent, dark, metal, skin, visor, lamp];
  const geometries: THREE.BufferGeometry[] = [];

  const mesh = (geo: THREE.BufferGeometry, mat: THREE.Material, parent: THREE.Object3D, x = 0, y = 0, z = 0) => {
    geometries.push(geo);
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  };

  const body = new THREE.Group();
  group.add(body);

  // Torso + hard upper torso ring
  mesh(new THREE.CapsuleGeometry(0.27, 0.42, 6, 16), suit, body, 0, 1.33, 0);
  mesh(new THREE.TorusGeometry(0.2, 0.035, 8, 24), metal, body, 0, 1.63, 0).rotation.x = Math.PI / 2;
  mesh(new THREE.BoxGeometry(0.3, 0.16, 0.08), accent, body, 0, 1.3, 0.25); // display & control module
  mesh(new THREE.BoxGeometry(0.05, 0.05, 0.02), lamp, body, 0.09, 1.32, 0.3);
  mesh(new THREE.CylinderGeometry(0.29, 0.29, 0.05, 20), accent, body, 0, 1.08, 0); // waist band

  // PLSS backpack
  const pack = mesh(new THREE.BoxGeometry(0.52, 0.66, 0.26), suit, body, 0, 1.38, -0.3);
  mesh(new THREE.BoxGeometry(0.44, 0.12, 0.04), dark, pack, 0, 0.2, -0.14);
  mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.25, 8), metal, pack, 0.2, 0.42, 0);

  // Helmet
  const head = new THREE.Group();
  head.position.set(0, 1.84, 0.02);
  body.add(head);
  // Shell is built in three pieces so the front stays open behind the visor (+Z is forward).
  const shell = new THREE.MeshStandardMaterial({ color: av.suit, roughness: 0.5, side: THREE.DoubleSide });
  materials.push(shell);
  const P = Math.PI;
  mesh(new THREE.SphereGeometry(0.235, 28, 20, P * 0.92, P * 1.16), shell, head); // back
  mesh(new THREE.SphereGeometry(0.235, 20, 8, P * 0.08, P * 0.84, 0, P * 0.18), shell, head); // front crown
  mesh(new THREE.SphereGeometry(0.235, 20, 8, P * 0.08, P * 0.84, P * 0.7, P * 0.3), shell, head); // chin
  mesh(new THREE.SphereGeometry(0.15, 20, 16), skin, head, 0, -0.01, 0.04);
  mesh(new THREE.SphereGeometry(0.245, 28, 20, P * 0.08, P * 0.84, P * 0.18, P * 0.52), visor, head);
  // helmet lamps (EVVA)
  mesh(new THREE.BoxGeometry(0.06, 0.04, 0.05), lamp, head, 0.17, 0.12, 0.13);
  mesh(new THREE.BoxGeometry(0.06, 0.04, 0.05), lamp, head, -0.17, 0.12, 0.13);
  mesh(new THREE.TorusGeometry(0.2, 0.03, 8, 24), accent, head, 0, -0.2, 0).rotation.x = Math.PI / 2;

  // Limbs on pivots so we can swing them
  const limb = (x: number, y: number, len: number, radius: number, glove: boolean) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, y, 0);
    body.add(pivot);
    mesh(new THREE.CapsuleGeometry(radius, len, 6, 12), suit, pivot, 0, -len / 2 - radius * 0.6, 0);
    mesh(new THREE.CylinderGeometry(radius * 1.08, radius * 1.08, 0.06, 14), accent, pivot, 0, -len * 0.35, 0);
    if (glove) mesh(new THREE.SphereGeometry(radius * 1.05, 12, 10), dark, pivot, 0, -len - radius * 1.2, 0);
    else mesh(new THREE.BoxGeometry(radius * 2.3, 0.12, radius * 3.2), dark, pivot, 0, -len - radius * 1.3, radius * 0.4);
    return pivot;
  };
  const armL = limb(0.36, 1.56, 0.5, 0.085, true);
  const armR = limb(-0.36, 1.56, 0.5, 0.085, true);
  const legL = limb(0.14, 0.96, 0.62, 0.105, false);
  const legR = limb(-0.14, 0.96, 0.62, 0.105, false);
  armL.rotation.z = 0.12;
  armR.rotation.z = -0.12;

  const nozzles = [0.16, -0.16].map((x) => {
    const n = new THREE.Object3D();
    n.position.set(x, 1.0, -0.42);
    body.add(n);
    mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.1, 10), dark, n, 0, 0.04, 0);
    return n;
  });

  let phase = 0;
  let idleT = Math.random() * 10;

  return {
    group,
    head,
    nozzles,
    update(dt, moving, lowGravity, airborne = false) {
      idleT += dt;
      if (airborne) {
        // knees tucked, arms out for balance
        const ease = Math.min(1, dt * 8);
        legL.rotation.x += (-0.55 - legL.rotation.x) * ease;
        legR.rotation.x += (-0.25 - legR.rotation.x) * ease;
        armL.rotation.x += (-0.5 - armL.rotation.x) * ease;
        armR.rotation.x += (-0.5 - armR.rotation.x) * ease;
        armL.rotation.z += (0.7 - armL.rotation.z) * ease;
        armR.rotation.z += (-0.7 - armR.rotation.z) * ease;
        body.position.y += (0 - body.position.y) * ease;
        body.rotation.x += (0.18 - body.rotation.x) * ease;
        return;
      }
      armL.rotation.z += (0.12 - armL.rotation.z) * Math.min(1, dt * 6);
      armR.rotation.z += (-0.12 - armR.rotation.z) * Math.min(1, dt * 6);
      if (moving) {
        phase += dt * (lowGravity ? 6.2 : 8.5);
        const s = Math.sin(phase);
        const swing = lowGravity ? 0.35 : 0.55;
        legL.rotation.x = s * swing;
        legR.rotation.x = -s * swing;
        armL.rotation.x = -s * swing * 0.8;
        armR.rotation.x = s * swing * 0.8;
        // Apollo-style lunar hop vs. a heavier Martian stride
        body.position.y = lowGravity ? Math.abs(Math.sin(phase)) * 0.22 : Math.abs(Math.sin(phase)) * 0.05;
        body.rotation.x = lowGravity ? 0.12 : 0.06;
      } else {
        const ease = Math.min(1, dt * 6);
        legL.rotation.x += (0 - legL.rotation.x) * ease;
        legR.rotation.x += (0 - legR.rotation.x) * ease;
        armL.rotation.x += (Math.sin(idleT * 0.8) * 0.06 - armL.rotation.x) * ease;
        armR.rotation.x += (-Math.sin(idleT * 0.8) * 0.06 - armR.rotation.x) * ease;
        body.position.y += (Math.sin(idleT * 1.6) * 0.008 - body.position.y) * ease;
        body.rotation.x += (0 - body.rotation.x) * ease;
        head.rotation.y = Math.sin(idleT * 0.45) * 0.45;
      }
    },
    dispose() {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
    }
  };
}
