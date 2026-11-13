// Roblox-accurate R6 avatars: lathe "classic head" with a face decal, 2x2x1 torso, 1x2x1 limbs,
// shirt/pants textures with baked shading (like real Roblox clothing templates), glossy hair accessories,
// BillboardGui-style overhead number tags, R6 poses, and despawn / spawn-in effects.
import * as THREE from 'three';
import { buildHair } from './hair.js';

export const plastic = (color, o = {}) => new THREE.MeshLambertMaterial({ color, ...o });
export const gloss = (color, shininess = 60) => new THREE.MeshPhongMaterial({ color, shininess, specular: 0x555555 });

export function rng(seed) {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const lerp = (a, b, t) => a + (b - a) * t;

function canvas(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}
function shadeHex(hex, f) {
  const c = new THREE.Color(hex); c.multiplyScalar(f); return '#' + c.getHexString();
}

// ---------------------------------------------------------------- classic head
const HEAD_R = 0.62, HEAD_H = 0.6, HEAD_F = 0.24;
const headGeo = (() => {
  const pts = [new THREE.Vector2(0.0001, -HEAD_H)];
  for (let i = 0; i <= 8; i++) { const a = -Math.PI / 2 + (i / 8) * (Math.PI / 2); pts.push(new THREE.Vector2(HEAD_R - HEAD_F + HEAD_F * Math.cos(a), -HEAD_H + HEAD_F + HEAD_F * Math.sin(a))); }
  for (let i = 0; i <= 8; i++) { const a = (i / 8) * (Math.PI / 2); pts.push(new THREE.Vector2(HEAD_R - HEAD_F + HEAD_F * Math.cos(a), HEAD_H - HEAD_F + HEAD_F * Math.sin(a))); }
  pts.push(new THREE.Vector2(0.0001, HEAD_H));
  return new THREE.LatheGeometry(pts, 48);
})();
const FACE_THETA = 1.9, FACE_H = 0.78;
const faceGeo = new THREE.CylinderGeometry(HEAD_R + 0.004, HEAD_R + 0.004, FACE_H, 40, 1, true, -FACE_THETA / 2, FACE_THETA);

// ---------------------------------------------------------------- face decal (classic Roblox style)
export class Face {
  constructor(opts = {}) {
    this.c = document.createElement('canvas'); this.c.width = 640; this.c.height = 420;
    this.ctx = this.c.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.c); this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.anisotropy = 8;
    this.material = new THREE.MeshLambertMaterial({ map: this.tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
    this.opts = opts;
    this.state = { expr: 'smile', mouth: 0, blink: false, tear: 0, look: 0 };
    this._key = '';
    this.draw();
  }
  set(s) { Object.assign(this.state, s); }
  update() { const k = JSON.stringify(this.state); if (k !== this._key) { this._key = k; this.draw(); this.tex.needsUpdate = true; } }
  draw() {
    const c = this.ctx, S = this.state, e = S.expr, cx = 320 + S.look * 18;
    c.clearRect(0, 0, 640, 420);
    c.fillStyle = '#141414'; c.strokeStyle = '#141414'; c.lineCap = 'round'; c.lineJoin = 'round';
    const ey = 172, dx = 66;
    const closed = S.blink || e === 'sleep' || e === 'bliss';
    // eyes
    for (const sx of [-1, 1]) {
      const x = cx + sx * dx;
      if (closed) {
        c.lineWidth = 9; c.beginPath();
        if (e === 'bliss') c.arc(x, ey + 14, 22, Math.PI * 1.15, Math.PI * 1.85); else c.arc(x, ey - 6, 22, Math.PI * 0.15, Math.PI * 0.85);
        c.stroke();
      } else if (e === 'smug') {
        c.beginPath(); c.ellipse(x, ey + 6, 18, 22, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = this.opts.skin || '#f3d2b1'; c.fillRect(x - 22, ey - 24, 44, 22); c.fillStyle = '#141414';
        c.lineWidth = 7; c.beginPath(); c.moveTo(x - 22, ey - 2); c.lineTo(x + 22, ey - 2); c.stroke();
      } else {
        const big = e === 'shock' || e === 'scared';
        const rw = big ? 21 : 16, rh = big ? 38 : 33;
        c.beginPath(); c.ellipse(x, ey, rw, rh, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(x + 5, ey - rh * 0.45, 5, 7, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = '#141414';
      }
      if (this.opts.glasses) { c.save(); c.lineWidth = 7; c.beginPath(); c.roundRect(x - 40, ey - 44, 80, 84, 16); c.stroke(); c.restore(); }
    }
    if (this.opts.glasses) { c.lineWidth = 7; c.beginPath(); c.moveTo(cx - dx + 40, ey - 8); c.lineTo(cx + dx - 40, ey - 8); c.stroke(); }
    // brows
    const brow = { worried: -0.5, sad: -0.45, scared: -0.6, cry: -0.55, angry: 0.5, determined: 0.35, shock: -0.1 }[e];
    if (brow !== undefined) {
      c.lineWidth = 9;
      for (const sx of [-1, 1]) {
        const x = cx + sx * dx, y = ey - 62 - (e === 'shock' ? 12 : 0);
        c.beginPath(); c.moveTo(x - sx * 24, y + brow * 22); c.lineTo(x + sx * 24, y - brow * 22); c.stroke();
      }
    }
    // tears: Roblox-style streams
    if (S.tear > 0) {
      c.fillStyle = 'rgba(90,180,255,0.92)';
      for (const sx of [-1, 1]) { const x = cx + sx * dx; c.beginPath(); c.roundRect(x - 7, ey + 30, 14, 20 + S.tear * 120, 7); c.fill(); }
      c.fillStyle = '#141414';
    }
    // mouth
    const my = 268, open = S.mouth;
    c.lineWidth = 9;
    if (open > 0.12) {
      const h = 10 + open * 34;
      c.fillStyle = '#3a0f14'; c.beginPath();
      if (['smile', 'happy', 'bliss', 'smug'].includes(e)) { c.moveTo(cx - 38, my - 8); c.quadraticCurveTo(cx, my + h * 1.5, cx + 38, my - 8); c.closePath(); }
      else c.ellipse(cx, my + 4, 22 + open * 6, h * 0.55, 0, 0, Math.PI * 2);
      c.fill(); c.fillStyle = '#141414';
    } else if (e === 'happy') {
      c.beginPath(); c.moveTo(cx - 52, my - 14); c.quadraticCurveTo(cx, my + 56, cx + 52, my - 14); c.closePath(); c.fill();
      c.fillStyle = '#ffffff'; c.fillRect(cx - 38, my - 12, 76, 10); c.fillStyle = '#141414';
    } else if (e === 'smile' || e === 'bliss') {
      c.beginPath(); c.arc(cx, my - 40, 56, Math.PI * 0.22, Math.PI * 0.78); c.stroke();
    } else if (e === 'smug') {
      c.beginPath(); c.moveTo(cx - 34, my + 4); c.quadraticCurveTo(cx + 10, my + 20, cx + 36, my - 10); c.stroke();
    } else if (e === 'sad' || e === 'cry') {
      c.beginPath(); c.arc(cx, my + 40, 40, Math.PI * 1.25, Math.PI * 1.75); c.stroke();
    } else if (e === 'shock' || e === 'scared') {
      c.beginPath(); c.ellipse(cx, my + 4, 15, 20, 0, 0, Math.PI * 2); c.fill();
    } else if (e === 'angry' || e === 'determined') {
      c.beginPath(); c.moveTo(cx - 28, my + 4); c.lineTo(cx + 28, my + 4); c.stroke();
    } else if (e === 'worried') {
      c.beginPath(); c.moveTo(cx - 30, my + 6); c.quadraticCurveTo(cx - 10, my - 6, cx + 6, my + 4); c.quadraticCurveTo(cx + 20, my + 12, cx + 30, my); c.stroke();
    } else { // neutral, sleep
      c.beginPath(); c.moveTo(cx - 22, my + 2); c.lineTo(cx + 22, my + 2); c.stroke();
    }
  }
}

// ---------------------------------------------------------------- clothing textures
// faces: 'front' | 'back' | 'side' | 'top' | 'bottom'
function fabricShade(c, w, h, strength = 1) {
  const gx = c.createLinearGradient(0, 0, w, 0);
  gx.addColorStop(0, `rgba(0,0,0,${0.22 * strength})`); gx.addColorStop(0.18, 'rgba(0,0,0,0)');
  gx.addColorStop(0.82, 'rgba(0,0,0,0)'); gx.addColorStop(1, `rgba(0,0,0,${0.22 * strength})`);
  c.fillStyle = gx; c.fillRect(0, 0, w, h);
  const gy = c.createLinearGradient(0, 0, 0, h);
  gy.addColorStop(0, `rgba(255,255,255,${0.10 * strength})`); gy.addColorStop(0.4, 'rgba(0,0,0,0)'); gy.addColorStop(1, `rgba(0,0,0,${0.16 * strength})`);
  c.fillStyle = gy; c.fillRect(0, 0, w, h);
}
function noise(c, w, h, amt, seed = 1) {
  const R = rng(seed);
  for (let i = 0; i < w * h * 0.04; i++) { c.fillStyle = `rgba(${R() < 0.5 ? '0,0,0' : '255,255,255'},${R() * amt})`; c.fillRect(R() * w, R() * h, 2, 2); }
}
function folds(c, w, h, seed, n = 4) {
  const R = rng(seed);
  c.strokeStyle = 'rgba(0,0,0,0.16)'; c.lineWidth = 3; c.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const x = R() * w, y = R() * h;
    c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + (R() - 0.5) * 40, y + 20, x + (R() - 0.5) * 30, y + 40 + R() * 40); c.stroke();
  }
}

function shirtFace(sh, face, w, h, skin, seed) {
  return canvas(w, h, (c) => {
    const base = sh.color, dark = shadeHex(base, 0.72);
    c.fillStyle = base; c.fillRect(0, 0, w, h);
    noise(c, w, h, 0.05, seed);
    const k = sh.kind;
    if (face === 'front') {
      if (k === 'hoodie') {
        c.fillStyle = dark; c.beginPath(); c.moveTo(w * 0.24, h * 0.66); c.lineTo(w * 0.76, h * 0.66); c.lineTo(w * 0.84, h * 0.93); c.lineTo(w * 0.16, h * 0.93); c.closePath(); c.fill();
        c.strokeStyle = shadeHex(base, 0.55); c.lineWidth = 3; c.stroke();
        c.fillStyle = shadeHex(base, 0.8); c.beginPath(); c.ellipse(w / 2, 0, w * 0.26, h * 0.14, 0, 0, Math.PI); c.fill();
        c.strokeStyle = sh.accent || '#f4f4f4'; c.lineWidth = 6; c.lineCap = 'round';
        for (const x of [0.42, 0.58]) { c.beginPath(); c.moveTo(w * x, h * 0.1); c.lineTo(w * x + (x < 0.5 ? -4 : 4), h * 0.42); c.stroke(); c.fillStyle = '#c9c9c9'; c.fillRect(w * x - 4 + (x < 0.5 ? -4 : 4), h * 0.42, 8, 12); }
        c.fillStyle = dark; c.fillRect(0, h * 0.93, w, h * 0.07);
      } else if (k === 'tee' || k === 'dress') {
        c.fillStyle = skin; c.beginPath(); c.ellipse(w / 2, 0, w * 0.2, h * 0.1, 0, 0, Math.PI); c.fill();
        c.strokeStyle = dark; c.lineWidth = 7; c.beginPath(); c.ellipse(w / 2, 0, w * 0.2, h * 0.1, 0, 0, Math.PI); c.stroke();
        if (sh.graphic === 'heart') {
          c.fillStyle = sh.accent || '#ff4f8b'; c.beginPath();
          const x = w / 2, y = h * 0.42, s = w * 0.15;
          c.moveTo(x, y + s * 0.9); c.bezierCurveTo(x - s * 1.6, y - s * 0.2, x - s * 0.6, y - s * 1.2, x, y - s * 0.35); c.bezierCurveTo(x + s * 0.6, y - s * 1.2, x + s * 1.6, y - s * 0.2, x, y + s * 0.9); c.fill();
        } else if (sh.graphic === 'star') {
          c.fillStyle = sh.accent || '#ffd23f'; c.beginPath();
          for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? w * 0.08 : w * 0.18; c.lineTo(w / 2 + Math.cos(a) * r, h * 0.45 + Math.sin(a) * r); }
          c.closePath(); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 3; c.stroke();
        } else if (sh.graphic === 'stripe') {
          c.fillStyle = sh.accent || '#ffffff'; c.fillRect(0, h * 0.38, w, h * 0.14);
        }
        c.fillStyle = dark; c.fillRect(0, h * 0.94, w, h * 0.06);
      } else if (k === 'suit' || k === 'labcoat') {
        c.fillStyle = sh.inner || '#f4f4f4'; c.beginPath(); c.moveTo(w * 0.34, 0); c.lineTo(w * 0.66, 0); c.lineTo(w * 0.5, h * 0.55); c.closePath(); c.fill();
        c.fillStyle = sh.accent || '#1c1c1c'; c.beginPath(); c.moveTo(w * 0.47, h * 0.04); c.lineTo(w * 0.53, h * 0.04); c.lineTo(w * 0.555, h * 0.42); c.lineTo(w * 0.5, h * 0.5); c.lineTo(w * 0.445, h * 0.42); c.closePath(); c.fill();
        c.strokeStyle = shadeHex(base, 0.6); c.lineWidth = 5;
        c.beginPath(); c.moveTo(w * 0.3, 0); c.lineTo(w * 0.42, h * 0.3); c.lineTo(w * 0.5, h * 0.62); c.lineTo(w * 0.58, h * 0.3); c.lineTo(w * 0.7, 0); c.stroke();
        c.beginPath(); c.moveTo(w * 0.5, h * 0.62); c.lineTo(w * 0.5, h); c.stroke();
        if (k === 'labcoat') { c.strokeRect(w * 0.12, h * 0.62, w * 0.22, h * 0.2); c.fillStyle = '#2d6cdf'; c.fillRect(w * 0.15, h * 0.56, 5, h * 0.1); c.fillStyle = '#d33'; c.fillRect(w * 0.2, h * 0.57, 5, h * 0.09); }
        else { c.fillStyle = shadeHex(base, 0.5); for (const y of [0.7, 0.84]) { c.beginPath(); c.arc(w * 0.54, h * y, 5, 0, 7); c.fill(); } }
      } else if (k === 'uniform') {
        c.strokeStyle = dark; c.lineWidth = 6;
        c.beginPath(); c.moveTo(w * 0.32, 0); c.lineTo(w * 0.5, h * 0.16); c.lineTo(w * 0.68, 0); c.stroke();
        c.beginPath(); c.moveTo(w * 0.5, h * 0.16); c.lineTo(w * 0.5, h); c.stroke();
        c.fillStyle = '#f2f2f2'; for (const y of [0.3, 0.5, 0.7]) { c.beginPath(); c.arc(w * 0.52, h * y, 4, 0, 7); c.fill(); }
        c.strokeStyle = dark; c.lineWidth = 3; c.strokeRect(w * 0.16, h * 0.28, w * 0.24, h * 0.2);
        c.fillStyle = sh.accent || '#2a3f8f'; c.beginPath(); c.roundRect(w * 0.62, h * 0.26, w * 0.2, h * 0.16, 6); c.fill();
        c.fillStyle = '#ffffff'; c.fillRect(w * 0.66, h * 0.32, w * 0.12, h * 0.03);
      } else if (k === 'vest') {
        c.fillStyle = sh.inner || '#f4f4f4'; c.fillRect(w * 0.4, 0, w * 0.2, h);
        c.fillStyle = '#ff7a1a'; c.fillRect(0, 0, w * 0.4, h); c.fillRect(w * 0.6, 0, w * 0.4, h);
        c.fillStyle = '#e8f05a'; c.fillRect(0, h * 0.55, w * 0.4, h * 0.1); c.fillRect(w * 0.6, h * 0.55, w * 0.4, h * 0.1);
        c.fillStyle = '#d8dde3'; c.fillRect(0, h * 0.57, w * 0.4, h * 0.04); c.fillRect(w * 0.6, h * 0.57, w * 0.4, h * 0.04);
        c.fillRect(w * 0.12, 0, w * 0.08, h * 0.55); c.fillRect(w * 0.8, 0, w * 0.08, h * 0.55);
      } else if (k === 'pajama') {
        c.fillStyle = sh.accent || '#ffffff';
        const R = rng(seed + 9); for (let i = 0; i < 16; i++) { const x = R() * w, y = R() * h; c.beginPath(); for (let j = 0; j < 10; j++) { const a = j * Math.PI / 5, r = j % 2 ? 4 : 9; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } c.fill(); }
        c.strokeStyle = shadeHex(base, 0.7); c.lineWidth = 4; c.beginPath(); c.moveTo(w * 0.5, h * 0.1); c.lineTo(w * 0.5, h); c.stroke();
        c.fillStyle = '#ffffff'; for (const y of [0.3, 0.5, 0.7]) { c.beginPath(); c.arc(w * 0.53, h * y, 5, 0, 7); c.fill(); }
      } else if (k === 'sweater') {
        c.strokeStyle = shadeHex(base, 0.8); c.lineWidth = 5;
        for (let x = 0.2; x < 0.9; x += 0.2) { c.beginPath(); for (let y = 0; y <= h; y += 16) c.lineTo(w * x + (y / 16 % 2 ? 6 : -6), y); c.stroke(); }
        c.fillStyle = dark; c.fillRect(w * 0.3, 0, w * 0.4, h * 0.08); c.fillRect(0, h * 0.92, w, h * 0.08);
      }
    } else if (face === 'back' && k === 'hoodie') {
      c.fillStyle = dark; c.beginPath(); c.roundRect(w * 0.25, 0, w * 0.5, h * 0.3, 30); c.fill();
      c.fillStyle = dark; c.fillRect(0, h * 0.93, w, h * 0.07);
    } else if (face === 'back' && k === 'vest') {
      c.fillStyle = '#ff7a1a'; c.fillRect(0, 0, w, h);
      c.fillStyle = '#e8f05a'; c.fillRect(0, h * 0.4, w, h * 0.12); c.fillRect(w * 0.44, 0, w * 0.12, h);
    }
    folds(c, w, h, seed + face.length, face === 'front' ? 3 : 2);
    fabricShade(c, w, h);
  });
}

function sleeveFace(sh, face, w, h, skin, seed) {
  return canvas(w, h, (c) => {
    const base = sh.kind === 'vest' ? (sh.inner || '#f4f4f4') : sh.color;
    const dark = shadeHex(base, 0.72);
    const short = sh.kind === 'tee' || sh.kind === 'uniform' || sh.kind === 'dress';
    if (face === 'bottom') { c.fillStyle = skin; c.fillRect(0, 0, w, h); return; }
    if (face === 'top') { c.fillStyle = base; c.fillRect(0, 0, w, h); fabricShade(c, w, h, 0.5); return; }
    c.fillStyle = skin; c.fillRect(0, 0, w, h);
    const sleeveEnd = short ? 0.42 : 0.86;
    c.fillStyle = base; c.fillRect(0, 0, w, h * sleeveEnd);
    noise(c, w, h * sleeveEnd, 0.05, seed);
    folds(c, w, h * sleeveEnd, seed + 3, 2);
    if (sh.kind === 'hoodie') { c.fillStyle = dark; c.fillRect(0, h * (sleeveEnd - 0.08), w, h * 0.08); }
    else if (sh.kind === 'suit' || sh.kind === 'labcoat') { c.fillStyle = sh.inner || '#f4f4f4'; c.fillRect(0, h * (sleeveEnd - 0.05), w, h * 0.05); c.fillStyle = dark; c.fillRect(0, h * (sleeveEnd - 0.1), w, h * 0.04); }
    else { c.fillStyle = dark; c.fillRect(0, h * (sleeveEnd - 0.04), w, h * 0.04); }
    // hand shading
    const g = c.createLinearGradient(0, h * sleeveEnd, 0, h); g.addColorStop(0, 'rgba(0,0,0,0.18)'); g.addColorStop(0.3, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(0, h * sleeveEnd, w, h * (1 - sleeveEnd));
    fabricShade(c, w, h, 0.8);
  });
}

function legFace(pt, face, w, h, skin, seed) {
  return canvas(w, h, (c) => {
    const base = pt.color, dark = shadeHex(base, 0.7);
    const shoe = pt.shoes || '#2b2b2b';
    if (face === 'bottom') { c.fillStyle = shoe; c.fillRect(0, 0, w, h); return; }
    if (face === 'top') { c.fillStyle = base; c.fillRect(0, 0, w, h); return; }
    c.fillStyle = base; c.fillRect(0, 0, w, h);
    const k = pt.kind;
    if (k === 'jeans') {
      const R = rng(seed);
      for (let i = 0; i < 260; i++) { c.fillStyle = `rgba(255,255,255,${R() * 0.08})`; c.fillRect(R() * w, R() * h, 1 + R() * 2, 6 + R() * 10); }
      const g = c.createRadialGradient(w / 2, h * 0.5, 4, w / 2, h * 0.5, w * 0.5); g.addColorStop(0, 'rgba(255,255,255,0.16)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
      c.strokeStyle = '#d6a23c'; c.lineWidth = 2; c.setLineDash([5, 4]); c.beginPath(); c.moveTo(face === 'side' ? w * 0.5 : w * 0.9, 0); c.lineTo(face === 'side' ? w * 0.5 : w * 0.9, h); c.stroke(); c.setLineDash([]);
    } else if (k === 'slacks') {
      c.strokeStyle = shadeHex(base, 1.3); c.lineWidth = 2; c.beginPath(); c.moveTo(w * 0.5, 0); c.lineTo(w * 0.5, h); c.stroke();
    } else if (k === 'skirt' || k === 'shorts') {
      const end = k === 'skirt' ? 0.42 : 0.4;
      c.fillStyle = skin; c.fillRect(0, h * end, w, h * (1 - end));
      c.fillStyle = base; c.fillRect(0, 0, w, h * end);
      if (k === 'skirt') { c.fillStyle = shadeHex(base, 1.25); for (let x = 0; x < w; x += 16) { c.beginPath(); c.arc(x + 8, h * end, 8, 0, Math.PI); c.fill(); } }
      c.fillStyle = pt.socks || '#ffffff'; c.fillRect(0, h * 0.76, w, h * 0.1);
    } else if (k === 'pjpants') {
      c.fillStyle = pt.accent || '#ffffff'; const R = rng(seed); for (let i = 0; i < 10; i++) { c.beginPath(); c.arc(R() * w, R() * h * 0.85, 6, 0, 7); c.fill(); }
    }
    noise(c, w, h, 0.05, seed + 2);
    folds(c, w, h * 0.85, seed + 5, 2);
    // shoes
    c.fillStyle = shoe; c.fillRect(0, h * 0.86, w, h * 0.14);
    c.fillStyle = pt.sole || '#f2f2f2'; c.fillRect(0, h * 0.965, w, h * 0.035);
    c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(0, h * 0.87, w, h * 0.02);
    fabricShade(c, w, h, 0.8);
  });
}

function torsoBelt(c, w, h, pt) {
  if (!pt.belt) return;
  c.fillStyle = pt.belt; c.fillRect(0, h * 0.9, w, h * 0.1);
}

// ---------------------------------------------------------------- overhead number (BillboardGui)
export function numberTag(text, { color = '#ffffff', glow = 'rgba(255,255,255,0.0)', size = 0.6 } = {}) {
  const fontPx = 150;
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  ctx.font = `900 ${fontPx}px "Nunito"`;
  const w = Math.ceil(ctx.measureText(text).width) + 80, h = fontPx + 70;
  c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.font = `900 ${fontPx}px "Nunito"`; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.lineJoin = 'round';
  x.shadowColor = glow; x.shadowBlur = 30;
  x.lineWidth = 22; x.strokeStyle = '#141414'; x.strokeText(text, w / 2, h / 2 + 6);
  x.shadowBlur = 0; x.fillStyle = color; x.fillText(text, w / 2, h / 2 + 6);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  sp.scale.set(size * w / h, size, 1);
  sp.renderOrder = 10;
  return sp;
}

// ---------------------------------------------------------------- avatar
const sparkTex = canvas(64, 64, (c) => {
  const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,0.8)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g; c.fillRect(0, 0, 64, 64);
  c.fillStyle = 'rgba(255,255,255,0.9)'; c.fillRect(30, 2, 4, 60); c.fillRect(2, 30, 60, 4);
});

export function makeAvatar(o) {
  const {
    skin = '#f3d2b1', shirt = { kind: 'tee', color: '#3a7bd5' }, pants = { kind: 'jeans', color: '#3b5b8f', shoes: '#2b2b2b' },
    hair = 'swoop', hairColor = '#4a3020', scale = 1, seed = 1, face = {}, number = null, capColor = null,
  } = o;
  const g = new THREE.Group();
  const body = new THREE.Group(); g.add(body);
  const mats = [];
  const M = (tex) => { const m = tex ? plastic(0xffffff, { map: tex }) : plastic(skin); mats.push(m); return m; };
  const skinM = plastic(skin); mats.push(skinM);

  // torso: [px, nx, py, ny, pz, nz]
  const tf = shirtFace(shirt, 'front', 256, 256, skin, seed), tb = shirtFace(shirt, 'back', 256, 256, skin, seed + 1), ts = shirtFace(shirt, 'side', 128, 256, skin, seed + 2);
  const torso = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 1), [M(ts), M(ts), M(shirtFace(shirt, 'top', 256, 128, skin, seed)), M(shirtFace(shirt, 'bottom', 256, 128, skin, seed)), M(tf), M(tb)]);
  torso.position.y = 3; body.add(torso);

  const limb = (x, y, isLeg, side) => {
    const pivot = new THREE.Group(); pivot.position.set(x, y, 0);
    const fn = isLeg ? legFace : sleeveFace;
    const src = isLeg ? pants : shirt;
    const f = fn(src, 'front', 128, 256, skin, seed + side * 7), s = fn(src, 'side', 128, 256, skin, seed + side * 7 + 1), bk = fn(src, 'back', 128, 256, skin, seed + side * 7 + 2);
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), [M(s), M(s), M(fn(src, 'top', 128, 128, skin, seed)), M(fn(src, 'bottom', 128, 128, skin, seed)), M(f), M(bk)]);
    mesh.position.y = isLeg ? -1 : -0.5;
    pivot.add(mesh); body.add(pivot);
    pivot.userData.base = pivot.position.clone();
    return pivot;
  };
  const armL = limb(-1.5, 3.5, false, 1), armR = limb(1.5, 3.5, false, 2);
  const legL = limb(-0.5, 2, true, 3), legR = limb(0.5, 2, true, 4);

  const headPivot = new THREE.Group(); headPivot.position.y = 4; body.add(headPivot);
  headPivot.userData.base = headPivot.position.clone();
  const head = new THREE.Mesh(headGeo, skinM); head.position.y = 0.62; headPivot.add(head);
  const fc = new Face({ ...face, skin });
  const decal = new THREE.Mesh(faceGeo, fc.material); decal.position.y = 0.62; decal.renderOrder = 2; headPivot.add(decal);
  mats.push(fc.material);
  buildHair(headPivot, hair, hairColor, seed, { capColor });
  headPivot.traverse(m => { if (m.isMesh && m.material !== fc.material && !mats.includes(m.material)) mats.push(m.material); });

  g.traverse(m => { if (m.isMesh) { m.castShadow = m.material !== fc.material; m.receiveShadow = true; } });
  g.scale.setScalar(scale);

  let tag = null;
  if (number !== null) { tag = numberTag(String(number)); tag.position.set(0, 6.25, 0); body.add(tag); }  // on the body so it drops when sitting

  // despawn / spawn sparkles
  const sparks = new THREE.Group(); g.add(sparks);
  const R = rng(seed + 77);
  for (let i = 0; i < 26; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: sparkTex, color: i % 3 ? '#ffffff' : '#bfe6ff', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    const d = new THREE.Vector3(R() - 0.5, R() * 0.9 + 0.1, R() - 0.5).normalize();
    s.userData = { d, sp: 1.2 + R() * 2.2, y0: 1 + R() * 4, sz: 0.25 + R() * 0.45 };
    s.visible = false; sparks.add(s);
  }
  torso.userData.base = torso.position.clone();
  const parts = [armL, armR, legL, legR, headPivot, torso];
  parts.forEach((p, i) => { p.userData.dir = new THREE.Vector3((R() - 0.5) * 2, 0.6 + R(), (R() - 0.5) * 1.2); p.userData.spin = new THREE.Vector3((R() - 0.5) * 6, (R() - 0.5) * 6, (R() - 0.5) * 6); });

  const av = { group: g, body, torso, armL, armR, legL, legR, headPivot, head, face: fc, tag, seed, mats, parts, sparks, _fade: false };
  return av;
}

export function addTag(av, text, opts) {
  if (av.tag) av.tag.parent.remove(av.tag);
  av.tag = numberTag(String(text), opts); av.tag.position.set(0, 6.25, 0); av.body.add(av.tag);
  return av.tag;
}

// ---------------------------------------------------------------- R6 poses / animation
export function resetPose(av) {
  for (const k of ['armL', 'armR', 'legL', 'legR', 'headPivot']) { av[k].rotation.set(0, 0, 0); av[k].position.copy(av[k].userData.base); av[k].scale.setScalar(1); }
  av.torso.position.copy(av.torso.userData.base); av.torso.rotation.set(0, 0, 0); av.torso.scale.setScalar(1);
  av.body.position.set(0, 0, 0); av.body.rotation.set(0, 0, 0); av.body.scale.setScalar(1);
  setOpacity(av, 1);
  av.sparks.children.forEach(s => (s.visible = false));
  if (av.tag) { av.tag.visible = true; av.tag.material.opacity = 1; }
  av.group.visible = true;
  const tails = av.headPivot.userData.tails; if (tails) tails.forEach((t, i) => (t.rotation.x = 0));
}
function setOpacity(av, o) {
  const fade = o < 0.999;
  if (fade !== av._fade) { av.mats.forEach(m => { m.transparent = fade || m === av.face.material; m.needsUpdate = true; }); av._fade = fade; }
  av.mats.forEach(m => { m.opacity = o; });
}
export function idle(av, t, amt = 1) {             // R6 idle: barely-there arm sway
  const p = t * 1.6 + av.seed;
  av.armL.rotation.x = 0.05 * Math.sin(p) * amt; av.armR.rotation.x = -0.05 * Math.sin(p) * amt;
  const tails = av.headPivot.userData.tails; if (tails) tails.forEach((tl, i) => (tl.rotation.x = 0.06 * Math.sin(p * 1.4 + i)));
}
export function walk(av, t, speed = 1) {           // R6 walk: stiff swing, no bob
  const s = Math.sin(t * 7.5 * speed + av.seed) * 0.8;
  av.legL.rotation.x = s; av.legR.rotation.x = -s; av.armL.rotation.x = -s; av.armR.rotation.x = s;
}
export function jumpPose(av) { av.armL.rotation.x = Math.PI; av.armR.rotation.x = Math.PI; av.armL.rotation.z = -0.08; av.armR.rotation.z = 0.08; }
export function sit(av) { av.legL.rotation.x = -Math.PI / 2; av.legR.rotation.x = -Math.PI / 2; av.body.position.y = -1.0; }
export function point(av, side = 'R') { (side === 'R' ? av.armR : av.armL).rotation.x = -Math.PI / 2; }
export function hug(av, amt = 1) { av.armL.rotation.set(-1.45 * amt, 0, 0.35 * amt); av.armR.rotation.set(-1.45 * amt, 0, -0.35 * amt); }
export function holdHand(av, side, amt = 1) { const a = side === 'R' ? av.armR : av.armL; a.rotation.x = -0.35 * amt; a.rotation.z = (side === 'R' ? 1 : -1) * 0.2 * amt; }
export function scaredPose(av) { av.armL.rotation.set(-2.7, 0, -0.5); av.armR.rotation.set(-2.7, 0, 0.5); }
export function wave(av, t, side = 'R') { const a = side === 'R' ? av.armR : av.armL; a.rotation.x = Math.PI - 0.2; a.rotation.z = (side === 'R' ? 1 : -1) * (0.3 + 0.35 * Math.sin(t * 9)); }

// lip flap + blink
export function faceTick(av, t, mouth = 0) {
  const ph = (t + av.seed * 0.61) % 3.7;
  av.face.set({ mouth: Math.round(mouth * 5) / 5, blink: ph > 3.58 && !['shock', 'scared', 'sleep', 'bliss'].includes(av.face.state.expr) });
  av.face.update();
}

// k in [0,1]: body parts break away, drift up, spin, shrink and fade into sparkles (Roblox-style despawn)
export function despawn(av, k) {
  if (k <= 0) return;
  if (k >= 1) { av.group.visible = false; return; }
  const e = k * k;
  for (const p of av.parts) {
    const b = p.userData.base, d = p.userData.dir, sp = p.userData.spin;
    p.position.set(b.x + d.x * e * 1.6, b.y + d.y * e * 2.4 + k * 0.6, b.z + d.z * e * 1.6);
    p.rotation.x += sp.x * e; p.rotation.y += sp.y * e; p.rotation.z += sp.z * e;
    p.scale.setScalar(1 - smooth(0.35, 0.95, k));
  }
  setOpacity(av, 1 - smooth(0.45, 0.95, k));
  if (av.tag) av.tag.material.opacity = 1 - smooth(0.0, 0.25, k);
  sparkle(av, k, false);
}
// k in [0,1]: the reverse, sparkles converge and the avatar fades in (with a ForceField shimmer drawn by the shot)
export function spawnIn(av, k) {
  if (k >= 1) return;
  if (k <= 0) { av.group.visible = false; return; }
  setOpacity(av, smooth(0.2, 0.7, k));
  const s = 0.4 + 0.6 * smooth(0.1, 0.7, k);
  av.body.scale.setScalar(s);
  sparkle(av, 1 - k, true);
}
function sparkle(av, k, inward) {
  for (const s of av.sparks.children) {
    const u = s.userData;
    s.visible = true;
    const r = k * u.sp;
    s.position.set(u.d.x * r * 1.6, u.y0 + u.d.y * r * 1.5, u.d.z * r * 1.6);
    const o = inward ? smooth(0, 0.3, k) * (1 - smooth(0.7, 1, k)) : Math.sin(Math.PI * clamp(k * 1.15)) ;
    s.material.opacity = clamp(o);
    s.scale.setScalar(u.sz * (inward ? 1 : 1 - k * 0.5));
  }
}
