// Other players' astronauts. Poses arrive ~10×/s over the network and are
// smoothed here so movement, jumps and jetpack flights look continuous.

import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import type { AvatarConfig } from '../game/types';
import { buildAstronaut, type AstronautRig } from './astronaut';
import { JetFlames, type ParticlePool } from './fx';

export interface PeerPose {
  x: number;
  y: number;
  z: number;
  h: number;
  /** walking */
  m: boolean;
  /** airborne */
  a: boolean;
  /** jetpack firing */
  t: boolean;
  /** visible (false while sheltered in bunker / riding rover) */
  v: boolean;
}

interface RemoteAstronaut {
  rig: AstronautRig;
  flames: JetFlames;
  tag: CSS2DObject;
  bubble: HTMLDivElement;
  bubbleTimer: number;
  target: PeerPose | null;
  pos: THREE.Vector3;
  heading: number;
}

export class RemoteCrew {
  private peers = new Map<string, RemoteAstronaut>();
  private readonly scene: THREE.Scene;
  private readonly exhaust: ParticlePool;
  private readonly lowGravity: boolean;

  constructor(scene: THREE.Scene, exhaust: ParticlePool, lowGravity: boolean) {
    this.scene = scene;
    this.exhaust = exhaust;
    this.lowGravity = lowGravity;
  }

  add(id: string, name: string, avatar: AvatarConfig): void {
    if (this.peers.has(id)) return;
    const rig = buildAstronaut(avatar);
    rig.group.visible = false; // until the first pose arrives
    this.scene.add(rig.group);
    const el = document.createElement('div');
    el.className = 'scene-label player-tag peer';
    el.style.background = avatar.accent;
    el.textContent = name;
    const tag = new CSS2DObject(el);
    tag.position.set(0, 2.45, 0);
    rig.group.add(tag);
    const bubble = document.createElement('div');
    bubble.className = 'emote-bubble';
    const bubbleObj = new CSS2DObject(bubble);
    bubbleObj.position.set(0, 3.1, 0);
    rig.group.add(bubbleObj);
    this.peers.set(id, { rig, flames: new JetFlames(rig), tag, bubble, bubbleTimer: 0, target: null, pos: new THREE.Vector3(), heading: 0 });
  }

  remove(id: string): void {
    const p = this.peers.get(id);
    if (!p) return;
    p.tag.element.remove();
    p.bubble.remove();
    this.scene.remove(p.rig.group);
    p.rig.dispose();
    this.peers.delete(id);
  }

  clear(): void {
    [...this.peers.keys()].forEach((id) => this.remove(id));
  }

  setPose(id: string, pose: PeerPose): void {
    const p = this.peers.get(id);
    if (!p) return;
    if (!p.target) {
      p.pos.set(pose.x, pose.y, pose.z);
      p.heading = pose.h;
    }
    p.target = pose;
  }

  emote(id: string, emoji: string): void {
    const p = this.peers.get(id);
    if (!p) return;
    p.bubble.textContent = emoji;
    p.bubble.classList.remove('show');
    void p.bubble.offsetWidth; // restart the pop animation
    p.bubble.classList.add('show');
    p.bubbleTimer = 3.2;
  }

  update(dt: number, time: number, showTags: boolean): void {
    for (const p of this.peers.values()) {
      const t = p.target;
      if (!t) continue;
      const k = 1 - Math.exp(-12 * dt);
      p.pos.x += (t.x - p.pos.x) * k;
      p.pos.y += (t.y - p.pos.y) * k;
      p.pos.z += (t.z - p.pos.z) * k;
      let dh = t.h - p.heading;
      dh = Math.atan2(Math.sin(dh), Math.cos(dh));
      p.heading += dh * k;
      p.rig.group.position.copy(p.pos);
      p.rig.group.rotation.y = p.heading;
      p.rig.group.visible = t.v;
      p.rig.update(dt, t.m, this.lowGravity, t.a);
      p.flames.update(dt, t.t && t.v, time, this.exhaust);
      p.tag.visible = t.v && showTags;
      if (p.bubbleTimer > 0) {
        p.bubbleTimer -= dt;
        if (p.bubbleTimer <= 0) p.bubble.classList.remove('show');
      }
    }
  }
}
