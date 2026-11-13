// Blocky R6-style characters with canvas-drawn faces (expressions, lip flap, cracks).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Lambert shading: matte plastic look, and several times cheaper than PBR on a software GPU.
export const mat = (color, o = {}) => {
  const { roughness, metalness, ...rest } = o; // PBR-only options are ignored
  return new THREE.MeshLambertMaterial({ color, ...rest });
};

function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

const geoCache = {};
function rbox(w, h, d, r = 0.08, seg = 3) {
  const k = [w, h, d, r, seg].join();
  return geoCache[k] || (geoCache[k] = new RoundedBoxGeometry(w, h, d, seg, r));
}

// ---------------------------------------------------------------- face

function makeCracks(seed, count) {
  const R = rng(seed * 7919 + 13);
  const cracks = [];
  for (let i = 0; i < count; i++) {
    // start at the rim of the face and wander inward
    const ang = R() * Math.PI * 2;
    let x = 256 + Math.cos(ang) * 250, y = 256 + Math.sin(ang) * 250;
    let dir = ang + Math.PI + (R() - 0.5) * 0.9;
    const len = 8 + Math.floor(R() * 6);
    const pts = [[x, y]];
    const branches = [];
    for (let k = 0; k < len; k++) {
      dir += (R() - 0.5) * 1.1;
      const step = 20 + R() * 16;
      x += Math.cos(dir) * step; y += Math.sin(dir) * step;
      pts.push([x, y]);
      if (R() < 0.3 && k > 1) {
        const bp = [[x, y]];
        let bx = x, by = y, bd = dir + (R() < 0.5 ? 1 : -1) * (0.6 + R() * 0.6);
        for (let j = 0; j < 3; j++) { bd += (R() - 0.5) * 0.8; bx += Math.cos(bd) * (12 + R() * 14); by += Math.sin(bd) * (12 + R() * 14); bp.push([bx, by]); }
        branches.push({ at: k / len, pts: bp });
      }
    }
    cracks.push({ pts, branches });
  }
  return cracks;
}

function strokePartial(ctx, pts, frac) {
  if (frac <= 0) return;
  const segs = pts.length - 1;
  const upto = frac * segs;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i <= segs; i++) {
    if (i <= upto) ctx.lineTo(pts[i][0], pts[i][1]);
    else {
      const f = upto - (i - 1);
      if (f > 0) ctx.lineTo(pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f);
      break;
    }
  }
  ctx.stroke();
}

export class Face {
  constructor(skin, seed, opts = {}) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.canvas.height = 512;
    this.ctx = this.canvas.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.canvas);
    this.tex.colorSpace = THREE.SRGBColorSpace;
    this.tex.anisotropy = 4;
    this.skin = skin;
    this.seed = seed;
    this.opts = opts; // {blush, lashes, freckles, mask}
    this.allCracks = makeCracks(seed, 40);
    this.state = { expr: 'smile', mouth: 0, blink: false, cracks: 0, grow: 1, gold: 0, fresh: 0, look: 0, tear: 0 };
    this._key = '';
    this.material = mat(0xffffff, { map: this.tex });
    this.draw();
  }
  set(s) { Object.assign(this.state, s); }
  update() {
    const k = JSON.stringify(this.state);
    if (k !== this._key) { this._key = k; this.draw(); this.tex.needsUpdate = true; }
  }
  draw() {
    const c = this.ctx, S = this.state;
    c.fillStyle = this.skin;
    c.fillRect(0, 0, 512, 512);
    if (this.opts.mask) { this.drawMask(); return; }
    const ex = S.expr;
    const lookX = S.look * 14;
    // blush
    if (this.opts.blush) {
      c.fillStyle = 'rgba(255,120,120,0.28)';
      c.beginPath(); c.ellipse(150, 320, 38, 20, 0, 0, Math.PI * 2); c.ellipse(362, 320, 38, 20, 0, 0, Math.PI * 2); c.fill();
    }
    // eyes
    const eyeY = 228, eyeDX = 78;
    c.fillStyle = '#1b1b1f';
    c.strokeStyle = '#1b1b1f';
    c.lineCap = 'round'; c.lineJoin = 'round';
    const closed = S.blink || ex === 'sleep' || ex === 'bliss';
    for (const sx of [-1, 1]) {
      const x = 256 + sx * eyeDX + lookX;
      if (closed) {
        c.lineWidth = 11;
        c.beginPath();
        if (ex === 'bliss') c.arc(x, eyeY + 10, 26, Math.PI * 1.15, Math.PI * 1.85);
        else c.arc(x, eyeY - 8, 26, Math.PI * 0.15, Math.PI * 0.85);
        c.stroke();
      } else {
        const h = ex === 'shock' ? 50 : ex === 'squint' ? 18 : 40, w = ex === 'shock' ? 30 : 24;
        c.beginPath(); c.ellipse(x, eyeY, w, h, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#ffffff';
        c.beginPath(); c.ellipse(x + 7, eyeY - h * 0.4, w * 0.32, h * 0.26, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#1b1b1f';
      }
      if (this.opts.glasses) {
        c.save(); c.strokeStyle = '#2b2b30'; c.lineWidth = 9;
        c.beginPath(); c.roundRect(x - 40, eyeY - 38, 80, 76, 18); c.stroke();
        if (sx === 1) { c.beginPath(); c.moveTo(256 - eyeDX + 40 + lookX, eyeY - 6); c.lineTo(256 + eyeDX - 40 + lookX, eyeY - 6); c.stroke(); }
        c.restore();
      }
      if (this.opts.lashes && !closed) {
        c.lineWidth = 6;
        c.beginPath(); c.moveTo(x + sx * 20, eyeY - 30); c.lineTo(x + sx * 34, eyeY - 44); c.stroke();
      }
    }
    // brows
    c.lineWidth = 12;
    const brow = { angry: [0.35, 12], sad: [-0.4, -6], worried: [-0.3, -10], shock: [0, -30], determined: [0.25, 6], tired: [-0.15, 0], cry: [-0.45, -8] }[ex];
    if (brow) {
      // brow[0] > 0 tilts the inner end down (angry), < 0 lifts it (sad)
      for (const sx of [-1, 1]) {
        const x = 256 + sx * eyeDX + lookX, y = eyeY - 66 + brow[1];
        c.beginPath();
        c.moveTo(x - sx * 30, y + brow[0] * 40);
        c.lineTo(x + sx * 30, y - brow[0] * 40);
        c.stroke();
      }
    }
    // tears
    if (S.tear > 0) {
      c.fillStyle = 'rgba(120,200,255,0.9)';
      for (const sx of [-1, 1]) {
        const x = 256 + sx * eyeDX + 18 * sx, y = eyeY + 46 + S.tear * 60;
        c.beginPath(); c.ellipse(x, y, 9, 15, 0, 0, Math.PI * 2); c.fill();
      }
      c.fillStyle = '#1b1b1f';
    }
    // mouth
    const my = 340, open = S.mouth;
    c.lineWidth = 12;
    if (open > 0.12) {
      const h = 14 + open * 46, w = ex === 'shock' ? 30 : 44 + open * 10;
      c.fillStyle = '#5a1620';
      c.beginPath();
      if (ex === 'smile' || ex === 'happy' || ex === 'grin' || ex === 'bliss') {
        c.moveTo(256 - w, my - 6); c.quadraticCurveTo(256, my + h * 1.6, 256 + w, my - 6); c.closePath();
      } else c.ellipse(256, my + 4, w * 0.8, h * 0.6, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#e86a7a';
      c.beginPath(); c.ellipse(256, my + h * 0.45, w * 0.45, h * 0.22, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#1b1b1f';
    } else if (ex === 'grin' || ex === 'happy') {
      c.fillStyle = '#ffffff'; c.strokeStyle = '#1b1b1f'; c.lineWidth = 10;
      c.beginPath(); c.moveTo(186, my - 14); c.quadraticCurveTo(256, my + 70, 326, my - 14); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#1b1b1f';
    } else if (ex === 'smile' || ex === 'bliss') {
      c.beginPath(); c.arc(256, my - 34, 54, Math.PI * 0.2, Math.PI * 0.8); c.stroke();
    } else if (ex === 'sad' || ex === 'cry' || ex === 'tired') {
      c.beginPath(); c.arc(256, my + 44, 44, Math.PI * 1.22, Math.PI * 1.78); c.stroke();
    } else if (ex === 'shock') {
      c.beginPath(); c.ellipse(256, my + 8, 20, 26, 0, 0, Math.PI * 2); c.fillStyle = '#5a1620'; c.fill(); c.fillStyle = '#1b1b1f';
    } else if (ex === 'angry' || ex === 'determined') {
      c.beginPath(); c.moveTo(214, my + 6); c.lineTo(298, my + 6); c.stroke();
    } else if (ex === 'smirk') {
      c.beginPath(); c.moveTo(210, my); c.quadraticCurveTo(270, my + 18, 300, my - 16); c.stroke();
    } else { // neutral, worried, sleep
      c.beginPath(); c.moveTo(222, my + 4); c.quadraticCurveTo(256, my + (ex === 'worried' ? -6 : 8), 290, my + 4); c.stroke();
    }
    this.drawCracks();
  }
  drawCracks() {
    const c = this.ctx, S = this.state;
    const n = Math.min(S.cracks, this.allCracks.length);
    if (n <= 0) return;
    const nGold = Math.round(S.gold * n);
    c.lineCap = 'round'; c.lineJoin = 'round';
    for (let i = 0; i < n; i++) {
      const cr = this.allCracks[i];
      const frac = i === n - 1 ? S.grow : 1;
      const gold = i < nGold;
      // gold cracks glow
      if (gold) {
        c.shadowColor = 'rgba(255,190,40,0.95)'; c.shadowBlur = 22;
        c.strokeStyle = '#ffd34d'; c.lineWidth = 17;
      } else {
        c.shadowBlur = 0;
        c.strokeStyle = 'rgba(25,20,22,0.95)'; c.lineWidth = 12;
      }
      strokePartial(c, cr.pts, frac);
      for (const b of cr.branches) if (frac > b.at) strokePartial(c, b.pts, Math.min(1, (frac - b.at) * 3));
      if (!gold) {
        c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 2.5;
        c.save(); c.translate(3, 3); strokePartial(c, cr.pts, frac); c.restore();
        if (i === n - 1 && S.fresh > 0.02) {   // a brand-new crack flashes red-hot, then cools
          c.save(); c.globalAlpha = S.fresh;
          c.shadowColor = 'rgba(255,70,30,1)'; c.shadowBlur = 26; c.strokeStyle = '#ff5a2a'; c.lineWidth = 15;
          strokePartial(c, cr.pts, frac);
          for (const b of cr.branches) if (frac > b.at) strokePartial(c, b.pts, Math.min(1, (frac - b.at) * 3));
          c.shadowBlur = 0; c.strokeStyle = '#ffe9a8'; c.lineWidth = 5; strokePartial(c, cr.pts, frac);
          c.restore();
        }
      } else {
        c.shadowBlur = 0; c.strokeStyle = '#fff6c8'; c.lineWidth = 5; strokePartial(c, cr.pts, frac);
      }
    }
    c.shadowBlur = 0;
  }
  drawMask() {
    // paper-bag mask for politicians
    const c = this.ctx;
    c.fillStyle = '#c49a63'; c.fillRect(0, 0, 512, 512);
    c.fillStyle = '#1b1b1f';
    c.beginPath(); c.ellipse(176, 230, 34, 30, 0, 0, Math.PI * 2); c.ellipse(336, 230, 34, 30, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#1b1b1f'; c.lineWidth = 10; c.lineCap = 'round';
    c.beginPath(); c.arc(256, 300, 70, Math.PI * 0.2, Math.PI * 0.8); c.stroke();
    c.strokeStyle = 'rgba(0,0,0,0.15)'; c.lineWidth = 4;
    for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(40 + i * 85, 0); c.lineTo(60 + i * 80, 512); c.stroke(); }
  }
}

// ---------------------------------------------------------------- shirt textures

function shirtTex(base, kind, accent) {
  if (!kind) return null;
  const cv = document.createElement('canvas');
  cv.width = cv.height = 256;
  const c = cv.getContext('2d');
  c.fillStyle = base; c.fillRect(0, 0, 256, 256);
  c.lineCap = 'round';
  if (kind === 'hoodie') {
    c.fillStyle = 'rgba(0,0,0,0.12)';
    c.beginPath(); c.moveTo(70, 170); c.lineTo(186, 170); c.lineTo(200, 240); c.lineTo(56, 240); c.closePath(); c.fill();
    c.strokeStyle = '#ffffff'; c.lineWidth = 6;
    c.beginPath(); c.moveTo(108, 20); c.lineTo(104, 90); c.moveTo(148, 20); c.lineTo(152, 90); c.stroke();
    if (accent) { c.fillStyle = accent; c.beginPath(); c.arc(128, 120, 26, 0, Math.PI * 2); c.fill(); }
  } else if (kind === 'apron') {
    c.fillStyle = accent || '#f4efe6';
    c.fillRect(50, 70, 156, 186);
    c.fillRect(80, 0, 14, 80); c.fillRect(162, 0, 14, 80);
    c.fillStyle = 'rgba(0,0,0,0.08)'; c.fillRect(85, 160, 86, 50);
  } else if (kind === 'suit') {
    c.fillStyle = '#f2f2f2';
    c.beginPath(); c.moveTo(96, 0); c.lineTo(128, 120); c.lineTo(160, 0); c.closePath(); c.fill();
    c.fillStyle = accent || '#b3202a';
    c.beginPath(); c.moveTo(120, 14); c.lineTo(136, 14); c.lineTo(142, 110); c.lineTo(128, 130); c.lineTo(114, 110); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = 5;
    c.beginPath(); c.moveTo(96, 0); c.lineTo(128, 140); c.lineTo(160, 0); c.stroke();
    c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.arc(128, 180, 6, 0, 7); c.arc(128, 220, 6, 0, 7); c.fill();
  } else if (kind === 'coat') {
    c.fillStyle = accent || '#7fb7d6'; c.fillRect(96, 0, 64, 256);
    c.fillStyle = base; c.beginPath(); c.moveTo(70, 0); c.lineTo(128, 150); c.lineTo(186, 0); c.closePath(); c.fill();
    c.strokeStyle = '#333'; c.lineWidth = 6; c.beginPath(); c.arc(128, 70, 40, 0.2, Math.PI - 0.2); c.stroke();
    c.fillStyle = '#9aa'; c.beginPath(); c.arc(128, 112, 10, 0, 7); c.fill();
    c.fillStyle = '#3a6fd8'; c.fillRect(40, 150, 40, 8);
  } else if (kind === 'vest') {
    c.fillStyle = accent || '#4b3a2a';
    c.fillRect(0, 0, 90, 256); c.fillRect(166, 0, 90, 256);
    c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.arc(70, 150, 5, 0, 7); c.arc(70, 200, 5, 0, 7); c.fill();
  } else if (kind === 'stripe') {
    c.fillStyle = accent || '#ffffff';
    for (let y = 20; y < 256; y += 56) c.fillRect(0, y, 256, 22);
  } else if (kind === 'pajama') {
    c.fillStyle = accent || '#ffffff';
    for (let i = 0; i < 18; i++) { c.beginPath(); c.arc((i * 73) % 256, (i * 97) % 256, 10, 0, 7); c.fill(); }
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ---------------------------------------------------------------- character

export function makeCharacter(o) {
  const {
    skin = '#f2c9a0', shirt = '#3a7bd5', pants = '#2c3e50', shoes = null,
    hair = 'short', hairColor = '#3b2a20', shirtKind = null, shirtAccent = null,
    scale = 1, seed = 1, faceOpts = {}, sleeves = true,
  } = o;
  const g = new THREE.Group();
  const body = new THREE.Group();
  g.add(body);
  const skinM = mat(skin);
  const shirtM = mat(shirt);
  const pantsM = mat(pants);
  const shoeM = mat(shoes || pants);
  const st = shirtTex(shirt, shirtKind, shirtAccent);
  const torsoMats = [shirtM, shirtM, shirtM, shirtM, st ? mat(0xffffff, { map: st }) : shirtM, shirtM];

  const torso = new THREE.Mesh(rbox(2, 2, 1, 0.08), torsoMats);
  torso.position.y = 3;
  body.add(torso);

  const limb = (x, y, m, isLeg) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, y, 0);
    const mesh = new THREE.Mesh(rbox(0.98, 2, 0.98, 0.08), m);
    mesh.position.y = -1 + (isLeg ? 0 : 0.5);
    pivot.add(mesh);
    if (isLeg && shoes) {
      const sh = new THREE.Mesh(rbox(1.0, 0.35, 1.06, 0.06), shoeM);
      sh.position.y = -1.83; pivot.add(sh);
    }
    if (!isLeg && sleeves === false) mesh.material = skinM;
    if (!isLeg && sleeves === 'short') {
      mesh.material = skinM;
      const sl = new THREE.Mesh(rbox(1.02, 0.8, 1.02, 0.06), shirtM);
      sl.position.y = 0.1; pivot.add(sl);
    }
    body.add(pivot);
    return pivot;
  };
  const armL = limb(-1.5, 3.5, shirtM, false); // character's right side is -x when facing +z; naming by screen
  const armR = limb(1.5, 3.5, shirtM, false);
  const legL = limb(-0.5, 2, pantsM, true);
  const legR = limb(0.5, 2, pantsM, true);
  if (sleeves === true) {
    // hands
    for (const a of [armL, armR]) {
      const h = new THREE.Mesh(rbox(0.99, 0.45, 0.99, 0.07), skinM);
      h.position.y = -1.27; a.add(h);
    }
  }

  const headPivot = new THREE.Group();
  headPivot.position.y = 4;
  body.add(headPivot);
  const face = new Face(skin, seed, faceOpts);
  const headMats = [skinM, skinM, skinM, skinM, face.material, skinM];
  const head = new THREE.Mesh(rbox(1.25, 1.2, 1.2, 0.3, 4), headMats);
  head.position.y = 0.62;
  headPivot.add(head);
  if (faceOpts.mask) {
    // a paper grocery bag over the head, face drawn on the front
    const bagM = mat('#c49a63', { roughness: 0.9 });
    const bag = new THREE.Mesh(rbox(1.55, 1.85, 1.5, 0.05, 2), [bagM, bagM, bagM, bagM, face.material, bagM]);
    bag.position.y = 0.78;
    headPivot.add(bag);
    for (let i = 0; i < 4; i++) {
      const fold = new THREE.Mesh(rbox(0.5, 0.25, 1.5, 0.04), bagM);
      fold.position.set(-0.55 + i * 0.37, 1.76, 0); fold.rotation.z = (i % 2 ? 0.3 : -0.25);
      headPivot.add(fold);
    }
  }
  addHair(headPivot, hair, mat(hairColor), seed);

  g.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  g.scale.setScalar(scale);
  const ch = { group: g, body, torso, armL, armR, legL, legR, headPivot, head, face, seed, props: {} };
  ch.hold = (obj, side = 'R') => { const a = side === 'R' ? ch.armR : ch.armL; obj.position.set(0, -2.0, 0.2); a.add(obj); ch.props[side] = obj; return obj; };
  return ch;
}

function addHair(hp, style, m, seed) {
  const add = (w, h, d, x, y, z, r = 0.12, rx = 0, rz = 0) => {
    const mm = new THREE.Mesh(rbox(w, h, d, Math.min(r, w / 2 - 0.01, h / 2 - 0.01, d / 2 - 0.01)), m);
    mm.position.set(x, y, z); mm.rotation.x = rx; mm.rotation.z = rz; hp.add(mm); return mm;
  };
  if (style === 'none' || style === 'bald') {
    if (style === 'bald') { add(0.25, 0.5, 0.9, -0.66, 0.55, -0.05); add(0.25, 0.5, 0.9, 0.66, 0.55, -0.05); }
    return;
  }
  // base cap shared by most styles
  add(1.34, 0.36, 1.3, 0, 1.27, -0.02, 0.16);
  if (style === 'short') {
    add(1.3, 0.22, 0.3, 0, 1.13, 0.52, 0.1, 0.2);
    add(0.2, 0.55, 1.1, -0.66, 0.85, -0.08); add(0.2, 0.55, 1.1, 0.66, 0.85, -0.08);
  } else if (style === 'spiky') {
    for (let i = 0; i < 5; i++) add(0.38, 0.5, 0.38, -0.5 + i * 0.25, 1.45, 0.1 - (i % 2) * 0.3, 0.08, 0.3, (i - 2) * 0.25);
    add(1.3, 0.24, 0.3, 0, 1.13, 0.52, 0.1, 0.3);
  } else if (style === 'ponytail' || style === 'bun' || style === 'long') {
    add(1.36, 0.22, 0.3, 0, 1.12, 0.5, 0.1, 0.15);           // bangs
    add(0.22, 0.9, 1.2, -0.68, 0.72, -0.05); add(0.22, 0.9, 1.2, 0.68, 0.72, -0.05);   // sides
    add(1.36, 1.0, 0.25, 0, 0.75, -0.66);                     // back
    if (style === 'ponytail') {
      const tail = new THREE.Group(); tail.position.set(0, 1.15, -0.72); hp.add(tail);
      const t1 = new THREE.Mesh(rbox(0.45, 1.3, 0.45, 0.18), m); t1.position.set(0, -0.6, -0.15); t1.rotation.x = -0.35; tail.add(t1);
      const tie = new THREE.Mesh(rbox(0.5, 0.18, 0.5, 0.06), mat('#ff5c8a')); tie.position.set(0, -0.05, 0); tail.add(tie);
      hp.userData.tail = tail;
    } else if (style === 'bun') {
      add(0.7, 0.55, 0.7, 0, 1.5, -0.35, 0.25);
    } else {
      add(1.36, 1.4, 0.3, 0, 0.3, -0.62);
    }
  } else if (style === 'curly') {
    const R = rng(seed + 5);
    for (let i = 0; i < 10; i++) add(0.5, 0.5, 0.5, -0.55 + R() * 1.1, 1.2 + R() * 0.3, -0.5 + R() * 0.9, 0.2);
  } else if (style === 'cap') {
    add(1.42, 0.38, 1.38, 0, 1.25, -0.02, 0.15);
    add(1.1, 0.1, 0.6, 0, 1.08, 0.82, 0.04);
  }
}

// ---------------------------------------------------------------- posing

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const lerp = (a, b, t) => a + (b - a) * t;

export function resetPose(ch) {
  for (const k of ['armL', 'armR', 'legL', 'legR', 'headPivot', 'torso']) ch[k].rotation.set(0, 0, 0);
  ch.body.position.set(0, 0, 0);
  ch.body.rotation.set(0, 0, 0);
}

// idle: breathing + subtle sway, plus optional gestures. t is absolute seconds.
export function idle(ch, t, amt = 1) {
  const p = t * 1.7 + ch.seed;
  ch.armL.rotation.z = -0.05 - 0.03 * Math.sin(p) * amt;
  ch.armR.rotation.z = 0.05 + 0.03 * Math.sin(p) * amt;
  ch.headPivot.rotation.x = 0.03 * Math.sin(p * 0.5) * amt;
  ch.body.position.y = 0.03 * Math.sin(p) * amt;
  const tail = ch.headPivot.userData.tail;
  if (tail) tail.rotation.x = 0.08 * Math.sin(p * 1.3);
}

export function talk(ch, t, amount) {
  if (amount <= 0) return;
  const p = t * 6 + ch.seed;
  ch.armR.rotation.x += -0.35 * amount - 0.18 * Math.sin(p) * amount;
  ch.armR.rotation.z += 0.12 * amount;
  ch.headPivot.rotation.x += 0.05 * Math.sin(p * 0.7) * amount;
  ch.headPivot.rotation.y += 0.06 * Math.sin(p * 0.4) * amount;
}

export function walk(ch, t, speed = 1) {
  const p = t * 7 * speed + ch.seed;
  const s = Math.sin(p) * 0.7;
  ch.legL.rotation.x = s; ch.legR.rotation.x = -s;
  ch.armL.rotation.x = -s; ch.armR.rotation.x = s;
  ch.body.position.y = Math.abs(Math.cos(p)) * 0.12;
}

export function crossArms(ch) {
  ch.armL.rotation.set(-1.25, 0, -0.55);
  ch.armR.rotation.set(-1.25, 0, 0.55);
}
export function hipHands(ch) {
  ch.armL.rotation.set(0, 0, -0.55);
  ch.armR.rotation.set(0, 0, 0.55);
}
export function point(ch, side = 'R', up = 0) {
  const a = side === 'R' ? ch.armR : ch.armL;
  a.rotation.set(-1.5 - up, 0, side === 'R' ? 0.1 : -0.1);
}
export function sit(ch) {
  ch.legL.rotation.x = -1.5; ch.legR.rotation.x = -1.5;
  ch.body.position.y = -1.0;
}

// lip flap + blink driven by the timeline
export function faceTick(ch, t, mouth = 0) {
  const ph = (t + ch.seed * 0.73) % 3.4;
  ch.face.set({ mouth: Math.round(mouth * 6) / 6, blink: ph > 3.26 && ch.face.state.expr !== 'shock' });
  ch.face.update();
}
