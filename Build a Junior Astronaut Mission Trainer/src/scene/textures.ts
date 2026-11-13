// Procedurally painted canvas textures — the whole 3D world ships with zero image downloads.

import * as THREE from 'three';
import { fbm, rng } from './noise';

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('2D canvas unavailable');
  return [c, ctx];
}

/** Greyscale regolith grain: fine noise + scattered pebbles. Tiled across the terrain. */
export function regolithTexture(seed = 3): THREE.CanvasTexture {
  const size = 512;
  const [c, ctx] = canvas(size, size);
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // tileable by sampling on a torus-ish wrap
      const n = fbm((x / size) * 8, (y / size) * 8, 5, seed) * 0.7 + fbm(x / 6, y / 6, 2, seed + 9) * 0.3;
      const v = Math.floor(150 + (n - 0.5) * 140);
      const i = (y * size + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const r = rng(seed);
  for (let i = 0; i < 900; i++) {
    const g = Math.floor(90 + r() * 120);
    ctx.fillStyle = `rgba(${g},${g},${g},${0.35 + r() * 0.4})`;
    ctx.beginPath();
    ctx.arc(r() * size, r() * size, 0.5 + r() * 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

/** Equirectangular Earth with oceans, continents, ice caps and clouds. */
export function earthTexture(): THREE.CanvasTexture {
  const w = 512;
  const h = 256;
  const [c, ctx] = canvas(w, h);
  const img = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    const lat = Math.abs(y / h - 0.5) * 2;
    for (let x = 0; x < w; x++) {
      const land = fbm(x / 70, y / 70, 6, 42);
      const cloud = fbm(x / 30 + 100, y / 22, 5, 7);
      let r = 12, g = 46, b = 110; // ocean
      if (land > 0.53) {
        const t = fbm(x / 20, y / 20, 3, 5);
        if (lat > 0.55 && t > 0.45) { r = 170; g = 140; b = 95; } // desert
        else { r = 48 + t * 40; g = 98 + t * 50; b = 42; }
      }
      if (lat > 0.84) { r = g = b = 235; } // polar ice
      if (cloud > 0.56) {
        const k = Math.min(1, (cloud - 0.56) * 4);
        r += (250 - r) * k; g += (250 - g) * k; b += (255 - b) * k;
      }
      const i = (y * w + x) * 4;
      img.data[i] = r; img.data[i + 1] = g; img.data[i + 2] = b; img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Soft radial glow sprite for the Sun, lamps and atmosphere halos. */
export function glowTexture(inner = 'rgba(255,255,255,1)', mid = 'rgba(255,240,200,0.35)'): THREE.CanvasTexture {
  const s = 256;
  const [c, ctx] = canvas(s, s);
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, inner);
  g.addColorStop(0.18, inner);
  g.addColorStop(0.32, mid);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Photovoltaic cell grid. */
export function solarCellTexture(): THREE.CanvasTexture {
  const s = 256;
  const [c, ctx] = canvas(s, s);
  ctx.fillStyle = '#0b1a3a';
  ctx.fillRect(0, 0, s, s);
  const cells = 8;
  const cs = s / cells;
  for (let y = 0; y < cells; y++) {
    for (let x = 0; x < cells; x++) {
      const shade = 30 + ((x * 7 + y * 13) % 5) * 4;
      ctx.fillStyle = `rgb(${shade * 0.4},${shade * 0.7},${shade * 2})`;
      ctx.fillRect(x * cs + 2, y * cs + 2, cs - 4, cs - 4);
      ctx.strokeStyle = 'rgba(180,200,230,0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x * cs + cs / 2, y * cs + 2);
      ctx.lineTo(x * cs + cs / 2, y * cs + cs - 2);
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/** Off-white habitat cladding with panel seams and a stencil band. */
export function habitatPanelTexture(): THREE.CanvasTexture {
  const w = 512;
  const h = 256;
  const [c, ctx] = canvas(w, h);
  ctx.fillStyle = '#e9e7e1';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(90,90,90,0.35)';
  ctx.lineWidth = 2;
  for (let x = 0; x <= w; x += 64) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  for (let y = 0; y <= h; y += 64) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  const r = rng(11);
  for (let i = 0; i < 400; i++) {
    ctx.fillStyle = `rgba(120,110,100,${r() * 0.08})`;
    ctx.fillRect(r() * w, r() * h, 2 + r() * 10, 1 + r() * 4);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}
