// Roblox-style world kit: material textures (Grass, Concrete, Brick, WoodPlanks, siding, shingles, Baseplate),
// a skybox dome with wispy clouds, lighting rig and suburban/interior props.
import * as THREE from 'three';
import { plastic, gloss, rng } from './avatar.js';

const texCache = new Map();
export function tex(key, w, h, draw, repeat = [1, 1]) {
  let base = texCache.get(key);
  if (!base) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    base = new THREE.CanvasTexture(c); base.colorSpace = THREE.SRGBColorSpace; base.anisotropy = 8;
    base.wrapS = base.wrapT = THREE.RepeatWrapping;
    texCache.set(key, base);
  }
  const t = base.clone(); t.needsUpdate = true; t.repeat.set(repeat[0], repeat[1]);
  return t;
}
const speck = (c, w, h, n, cols, R, sz = [1, 3]) => { for (let i = 0; i < n; i++) { c.fillStyle = cols[Math.floor(R() * cols.length)]; const s = sz[0] + R() * (sz[1] - sz[0]); c.fillRect(R() * w, R() * h, s, s); } };

// --------------------------------------------------------------- materials (Roblox 2022+ material look)
export const M = {
  grass: (rep = [40, 40]) => plastic(0xffffff, { map: tex('grass', 512, 512, (c, w, h) => {
    c.fillStyle = '#56a83a'; c.fillRect(0, 0, w, h);
    const R = rng(3);
    for (let i = 0; i < 5000; i++) {
      const x = R() * w, y = R() * h, l = 4 + R() * 9;
      c.strokeStyle = ['#3f8f2a', '#6cc04a', '#4c9e33', '#7fcf57', '#38812a'][Math.floor(R() * 5)];
      c.lineWidth = 1.5 + R(); c.beginPath(); c.moveTo(x, y); c.lineTo(x + (R() - 0.5) * 4, y - l); c.stroke();
    }
  }, rep) }),
  concrete: (rep = [1, 1]) => plastic(0xffffff, { map: tex('concrete', 512, 512, (c, w, h) => {
    c.fillStyle = '#d3cfc5'; c.fillRect(0, 0, w, h);
    speck(c, w, h, 9000, ['rgba(0,0,0,0.06)', 'rgba(255,255,255,0.08)', 'rgba(90,80,60,0.05)'], rng(5));
    c.strokeStyle = 'rgba(0,0,0,0.22)'; c.lineWidth = 3; c.strokeRect(0, 0, w, h);
  }, rep) }),
  asphalt: (rep = [1, 1]) => plastic(0xffffff, { map: tex('asphalt', 512, 512, (c, w, h) => {
    c.fillStyle = '#3d3f45'; c.fillRect(0, 0, w, h);
    speck(c, w, h, 14000, ['rgba(255,255,255,0.07)', 'rgba(0,0,0,0.12)', 'rgba(120,110,100,0.08)'], rng(9));
  }, rep) }),
  brick: (rep = [1, 1], col = '#a5452f') => plastic(0xffffff, { map: tex('brick' + col, 512, 512, (c, w, h) => {
    c.fillStyle = '#c9bfae'; c.fillRect(0, 0, w, h);
    const R = rng(11), bh = 32, bw = 85;
    for (let r = 0; r < h / bh; r++) for (let x = (r % 2) * -bw / 2; x < w; x += bw) {
      const v = 0.82 + R() * 0.3;
      const cc = new THREE.Color(col).multiplyScalar(v);
      c.fillStyle = '#' + cc.getHexString(); c.fillRect(x + 3, r * bh + 3, bw - 6, bh - 6);
      c.fillStyle = 'rgba(255,255,255,0.08)'; c.fillRect(x + 3, r * bh + 3, bw - 6, 4);
    }
  }, rep) }),
  wood: (rep = [1, 1], col = '#9a6a3e') => plastic(0xffffff, { map: tex('wood' + col, 512, 512, (c, w, h) => {
    const R = rng(13), ph = 64;
    for (let i = 0; i < h / ph; i++) {
      const cc = new THREE.Color(col).multiplyScalar(0.85 + R() * 0.3);
      c.fillStyle = '#' + cc.getHexString(); c.fillRect(0, i * ph, w, ph);
      c.strokeStyle = 'rgba(0,0,0,0.12)'; c.lineWidth = 2;
      for (let k = 0; k < 6; k++) { c.beginPath(); const y = i * ph + 6 + R() * (ph - 12); c.moveTo(0, y); c.bezierCurveTo(w * 0.3, y + (R() - 0.5) * 10, w * 0.6, y + (R() - 0.5) * 10, w, y); c.stroke(); }
      c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(0, i * ph, w, 3); c.fillRect((i * 173) % w, i * ph, 3, ph);
    }
  }, rep) }),
  siding: (rep = [1, 1], col = '#9fc3e6') => plastic(0xffffff, { map: tex('siding' + col, 512, 512, (c, w, h) => {
    const n = 8, bh = h / n;
    for (let i = 0; i < n; i++) {
      const g = c.createLinearGradient(0, i * bh, 0, (i + 1) * bh);
      const cc = new THREE.Color(col);
      g.addColorStop(0, '#' + cc.clone().multiplyScalar(1.06).getHexString()); g.addColorStop(1, '#' + cc.clone().multiplyScalar(0.86).getHexString());
      c.fillStyle = g; c.fillRect(0, i * bh, w, bh);
      c.fillStyle = 'rgba(0,0,0,0.28)'; c.fillRect(0, (i + 1) * bh - 4, w, 4);
    }
  }, rep) }),
  shingles: (rep = [1, 1], col = '#4a4d57') => plastic(0xffffff, { map: tex('shingle' + col, 512, 512, (c, w, h) => {
    const R = rng(17), rh = 42, sw = 64;
    for (let r = 0; r < h / rh; r++) for (let x = (r % 2) * -sw / 2; x < w; x += sw) {
      const cc = new THREE.Color(col).multiplyScalar(0.8 + R() * 0.35);
      c.fillStyle = '#' + cc.getHexString(); c.fillRect(x + 1, r * rh, sw - 2, rh);
      c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(x, r * rh + rh - 5, sw, 5);
    }
  }, rep) }),
  paint: (col, rep = [1, 1]) => plastic(0xffffff, { map: tex('paint' + col, 256, 256, (c, w, h) => {
    c.fillStyle = col; c.fillRect(0, 0, w, h); speck(c, w, h, 2500, ['rgba(0,0,0,0.04)', 'rgba(255,255,255,0.05)'], rng(19));
  }, rep) }),
  carpet: (col, rep = [1, 1]) => plastic(0xffffff, { map: tex('carpet' + col, 256, 256, (c, w, h) => {
    c.fillStyle = col; c.fillRect(0, 0, w, h); speck(c, w, h, 9000, ['rgba(0,0,0,0.08)', 'rgba(255,255,255,0.07)'], rng(23), [1, 2]);
  }, rep) }),
  baseplate: (rep = [1, 1]) => plastic(0xffffff, { map: tex('baseplate', 512, 512, (c, w, h) => {
    c.fillStyle = '#6a6c70'; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#7d8085'; c.lineWidth = 6;
    for (let i = 0; i <= 4; i++) { c.beginPath(); c.moveTo(i * w / 4, 0); c.lineTo(i * w / 4, h); c.stroke(); c.beginPath(); c.moveTo(0, i * h / 4); c.lineTo(w, i * h / 4); c.stroke(); }
    speck(c, w, h, 3000, ['rgba(0,0,0,0.05)', 'rgba(255,255,255,0.04)'], rng(29));
  }, rep) }),
};
export const neon = (col, k = 1.6) => new THREE.MeshLambertMaterial({ color: col, emissive: col, emissiveIntensity: k });

// box helper with optional per-material repeat scaling by size (studs ~ 1 unit)
export function part(parent, size, pos, material, o = {}) {
  const [w, h, d] = size;
  const geo = new THREE.BoxGeometry(w, h, d);
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.set(pos[0], pos[1], pos[2]);
  if (o.ry) mesh.rotation.y = o.ry; if (o.rx) mesh.rotation.x = o.rx; if (o.rz) mesh.rotation.z = o.rz;
  mesh.castShadow = o.cast !== false; mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
export function cylinder(parent, r, h, pos, material, o = {}) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(o.r2 ?? r, r, h, o.seg || 24), material);
  mesh.position.set(...pos); if (o.rx) mesh.rotation.x = o.rx; if (o.rz) mesh.rotation.z = o.rz;
  mesh.castShadow = o.cast !== false; mesh.receiveShadow = true; parent.add(mesh); return mesh;
}
export function label(text, { w = 512, h = 128, bg = '#ffffff', fg = '#222', size = 80, font = '900 {s}px "Nunito"' } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d'); x.fillStyle = bg; x.fillRect(0, 0, w, h);
  x.fillStyle = fg; x.font = font.replace('{s}', size); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, w / 2, h / 2 + 4);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

// --------------------------------------------------------------- sky + light
const skyCache = new Map();
export function sky(scene, { night = false, clouds = true, bright = false } = {}) {
  const key = [night, clouds, bright].join();
  let t = skyCache.get(key);
  if (!t) { t = skyTexture(night, clouds, bright); skyCache.set(key, t); }
  const dome = new THREE.Mesh(new THREE.SphereGeometry(450, 48, 24), new THREE.MeshBasicMaterial({ map: t, side: THREE.BackSide, fog: false, depthWrite: false }));
  dome.renderOrder = -1;
  scene.add(dome);
  scene.background = new THREE.Color(night ? '#0a0f24' : '#a8c8e6');
  return dome;
}
function skyTexture(night, clouds, bright) {
  const c = document.createElement('canvas'); c.width = 2048; c.height = 1024;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 1024);
  if (night) { g.addColorStop(0, '#04081c'); g.addColorStop(0.45, '#0d1a46'); g.addColorStop(0.52, '#24316e'); g.addColorStop(1, '#0a0f24'); }
  else if (bright) { g.addColorStop(0, '#5fa6ff'); g.addColorStop(0.42, '#a9d3ff'); g.addColorStop(0.5, '#e8f4ff'); g.addColorStop(1, '#cfe4f7'); }
  else { g.addColorStop(0, '#0e4fc2'); g.addColorStop(0.3, '#2a76e6'); g.addColorStop(0.47, '#7fb8f7'); g.addColorStop(0.52, '#cfe6ff'); g.addColorStop(1, '#a8c8e6'); }
  x.fillStyle = g; x.fillRect(0, 0, 2048, 1024);
  const R = rng(night ? 41 : 43);
  if (night) {
    for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(255,255,255,${0.3 + R() * 0.7})`; const s = R() < 0.1 ? 3 : 1.6; x.fillRect(R() * 2048, R() * 480, s, s); }
    x.fillStyle = '#fff6da'; x.shadowColor = 'rgba(255,240,200,0.9)'; x.shadowBlur = 60; x.beginPath(); x.arc(1350, 230, 42, 0, 7); x.fill(); x.shadowBlur = 0;
  } else if (clouds) {
    // draw every cloud sharp on its own layer, then blur each layer once (one filter pass instead of one per cloud)
    const layer = (blurPx, n, yMin, ySpan, rwMin, rwSpan, rhMin, rhSpan, aMin, aSpan, tilt) => {
      const L = document.createElement('canvas'); L.width = 2048; L.height = 1024; const k = L.getContext('2d');
      for (let i = 0; i < n; i++) {
        const cx = R() * 2048, cy = yMin + R() * ySpan, rw = rwMin + R() * rwSpan, rh = rhMin + R() * rhSpan, rot = tilt ? (R() - 0.5) * 0.2 : 0;
        k.fillStyle = `rgba(255,255,255,${aMin + R() * aSpan})`;
        for (const off of [-2048, 0, 2048]) {             // wrap clouds that touch the u=0/1 seam
          if (off && Math.abs(cx + off - 1024) > 1024 + rw + 40) continue;
          k.beginPath(); k.ellipse(cx + off, cy, rw, rh, rot, 0, 7); k.fill();
        }
      }
      x.filter = `blur(${blurPx}px)`; x.drawImage(L, 0, 0); x.filter = 'none';
    };
    layer(14, 70, 180, 320, 60, 220, 12, 30, 0.25, 0.45, true);
    layer(4, 40, 260, 230, 40, 90, 8, 14, 0.3, 0.4, false);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function lights(scene, { night = false, sun = [40, 60, 30], target = [0, 0, 0], area = 26, intensity = null, hemi = null } = {}) {
  const h = new THREE.HemisphereLight(night ? 0x5a70b8 : 0xcfe4ff, night ? 0x121428 : 0x6d5d48, hemi ?? (night ? 0.55 : 1.45));
  scene.add(h);
  const d = new THREE.DirectionalLight(night ? 0x9fb3ff : 0xfff1d6, intensity ?? (night ? 0.6 : 2.9));
  d.position.set(sun[0] + target[0], sun[1] + target[1], sun[2] + target[2]); d.target.position.set(...target);
  d.castShadow = true; d.shadow.mapSize.set(2048, 2048);
  Object.assign(d.shadow.camera, { left: -area, right: area, top: area, bottom: -area, near: 1, far: 220 });
  d.shadow.bias = -0.0004; d.shadow.normalBias = 0.04;
  scene.add(d, d.target);
  return { hemi: h, sun: d };
}

// --------------------------------------------------------------- exterior props
export function ground(scene, material, size = 600) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), material); m.rotation.x = -Math.PI / 2; m.receiveShadow = true; scene.add(m); return m;
}

export function street(scene, { z0 = 40, z1 = -260, x = 0, width = 14 } = {}) {
  const len = z0 - z1, cz = (z0 + z1) / 2;
  part(scene, [width, 0.2, len], [x, 0.1, cz], M.asphalt([width / 14, len / 14]), { cast: false });
  for (let z = z0 - 2; z > z1; z -= 9) part(scene, [0.35, 0.22, 4], [x, 0.12, z], plastic('#f2cf3c'), { cast: false });
  for (const sx of [-1, 1]) {
    part(scene, [0.6, 0.55, len], [x + sx * (width / 2 + 0.3), 0.275, cz], plastic('#bdb8ad'), { cast: false });
    part(scene, [5, 0.5, len], [x + sx * (width / 2 + 3.1), 0.25, cz], M.concrete([1, len / 5]), { cast: false });
  }
}

export function house(scene, x, z, { w = 16, d = 12, h = 10, col = '#9fc3e6', roof = '#4a4d57', door = '#7a2b22', face = 0 } = {}) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = face; scene.add(g);
  const side = M.siding([w / 8, h / 6], col), sideD = M.siding([d / 8, h / 6], col);
  part(g, [w, h, d], [0, h / 2, 0], [sideD, sideD, plastic(col), plastic(col), side, side]);
  const trim = plastic('#f6f4ef');
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) part(g, [0.5, h, 0.5], [sx * (w / 2), h / 2, sz * (d / 2)], trim);
  // roof
  const pitch = 0.62, half = w / 2 + 0.8, slabL = half / Math.cos(pitch);
  const rm = M.shingles([slabL / 6, (d + 2) / 6], roof);
  for (const sx of [-1, 1]) part(g, [slabL, 0.5, d + 2], [sx * half / 2, h + Math.tan(pitch) * half / 2, 0], rm, { rz: -sx * pitch });
  const tri = new THREE.Shape([new THREE.Vector2(-w / 2, 0), new THREE.Vector2(w / 2, 0), new THREE.Vector2(0, Math.tan(pitch) * w / 2)]);
  for (const sz of [-1, 1]) { const m = new THREE.Mesh(new THREE.ShapeGeometry(tri), M.siding([w / 8, 1], col)); m.position.set(0, h, sz * (d / 2 + 0.01)); if (sz < 0) m.rotation.y = Math.PI; g.add(m); }
  // windows + door (+z face)
  const glass = new THREE.MeshPhongMaterial({ color: '#7fa6c9', shininess: 90, specular: 0x99aabb });
  const win = (wx, wy) => {
    part(g, [3.4, 3.2, 0.3], [wx, wy, d / 2 + 0.1], trim);
    part(g, [2.8, 2.6, 0.32], [wx, wy, d / 2 + 0.12], glass);
    part(g, [0.18, 2.6, 0.36], [wx, wy, d / 2 + 0.14], trim); part(g, [2.8, 0.18, 0.36], [wx, wy, d / 2 + 0.14], trim);
    part(g, [3.8, 0.3, 0.6], [wx, wy - 1.75, d / 2 + 0.25], trim);
  };
  win(-w / 2 + 3.2, h * 0.62); win(w / 2 - 3.2, h * 0.62);
  part(g, [3.0, 5.4, 0.3], [0, 2.7, d / 2 + 0.12], plastic(door));
  part(g, [3.6, 5.8, 0.24], [0, 2.9, d / 2 + 0.06], trim);
  part(g, [0.35, 0.35, 0.3], [1.0, 2.7, d / 2 + 0.35], gloss('#d9b44a'));
  const br = M.brick([1, 0.4]);
  part(g, [6, 0.6, 2], [0, 0.3, d / 2 + 1.3], br); part(g, [6, 0.6, 1], [0, 0.9, d / 2 + 0.8], br);
  part(g, [1.6, 4, 1.6], [w / 2 - 3, h + 2.5, -d / 4], M.brick([0.4, 1]));
  return g;
}

export function tree(scene, x, z, s = 1, seed = 1, y = 0) {
  const R = rng(seed);
  const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(s); scene.add(g);
  cylinder(g, 0.45, 6, [0, 3, 0], plastic('#6b4a2e'), { r2: 0.35 });
  const greens = ['#3f9a35', '#4fae3f', '#2f8a2c', '#5bbb48'];
  for (let i = 0; i < 6; i++) {
    const r = 1.7 + R() * 1.3;
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), new THREE.MeshLambertMaterial({ color: greens[i % 4], flatShading: true }));
    m.position.set((R() - 0.5) * 3, 6.2 + R() * 2.6, (R() - 0.5) * 3); m.rotation.set(R() * 3, R() * 3, 0);
    m.castShadow = true; m.receiveShadow = true; g.add(m);
  }
  return g;
}

export function lampPost(scene, x, z, on = false, y = 0) {
  const g = new THREE.Group(); g.position.set(x, y, z); scene.add(g);
  const blk = plastic('#22252b');
  cylinder(g, 0.18, 8, [0, 4, 0], blk); cylinder(g, 0.45, 0.6, [0, 0.3, 0], blk);
  part(g, [1.0, 1.2, 1.0], [0, 8.5, 0], on ? neon('#ffe2a0', 1.8) : plastic('#f3ecd2'));
  part(g, [1.3, 0.25, 1.3], [0, 9.2, 0], blk);
  return g;
}

export function fence(scene, x0, x1, z, col = '#f7f5ef') {
  const m = plastic(col);
  for (let x = x0; x <= x1; x += 1.1) part(scene, [0.35, 2.2, 0.2], [x, 1.1, z], m);
  part(scene, [x1 - x0 + 0.4, 0.25, 0.15], [(x0 + x1) / 2, 1.6, z - 0.12], m);
  part(scene, [x1 - x0 + 0.4, 0.25, 0.15], [(x0 + x1) / 2, 0.7, z - 0.12], m);
}

export function mailbox(scene, x, z, ry = 0) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g);
  part(g, [0.3, 3, 0.3], [0, 1.5, 0], plastic('#5b4128'));
  const m = gloss('#2a54b8', 40);
  part(g, [1.0, 0.9, 1.6], [0, 3.3, 0], m);
  cylinder(g, 0.5, 1.6, [0, 3.75, 0], m, { rx: Math.PI / 2 });
  part(g, [0.08, 0.7, 0.15], [0.55, 3.9, -0.4], plastic('#d32f2f'));
  return g;
}

export function schoolBus(scene, x, z, ry = 0) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g);
  const y = gloss('#f5b800', 40), blk = plastic('#1d1d1f');
  part(g, [6, 5.2, 15.2], [0, 3.6, -2.4], y);                       // solid passenger section
  // hollow driver's cab so the driver shows through the glass
  part(g, [6, 0.3, 4.8], [0, 1.15, 7.6], plastic('#3a3d44'));
  part(g, [6, 0.5, 4.8], [0, 5.95, 7.6], y);
  for (const sx of [-1, 1]) { part(g, [0.2, 2.6, 4.8], [sx * 2.9, 2.4, 7.6], y); part(g, [0.2, 0.35, 4.8], [sx * 2.9, 5.55, 7.6], y); }
  part(g, [6, 2.6, 0.2], [0, 2.4, 9.9], y);
  part(g, [1.2, 1.0, 0.8], [1.6, 3.2, 9.2], plastic('#2b2b2b'));   // dashboard
  part(g, [6, 3, 3.5], [0, 2.4, 11.6], y);
  const tint = new THREE.MeshPhongMaterial({ color: '#30475e', shininess: 90 });
  const clear = new THREE.MeshPhongMaterial({ color: '#9fc0d8', shininess: 90, transparent: true, opacity: 0.28, depthWrite: false });
  for (let i = 0; i < 5; i++) for (const sx of [-1, 1]) part(g, [0.1, 1.8, 2.3], [sx * 3.02, 4.6, -7.6 + i * 2.8], tint);
  for (const sx of [-1, 1]) part(g, [0.1, 1.85, 4.6], [sx * 2.92, 4.62, 7.6], clear, { cast: false });
  part(g, [5.6, 2.0, 0.1], [0, 4.8, 10.02], new THREE.MeshPhongMaterial({ color: '#30475e', shininess: 90 }));
  for (const sx of [-1, 1]) part(g, [0.12, 0.35, 20], [sx * 3.03, 3.1, 0], blk);
  part(g, [3.5, 0.8, 0.1], [0, 6.6, 10.06], plastic(0xffffff, { map: label('SCHOOL BUS', { w: 512, h: 120, bg: '#f5b800', fg: '#111', size: 78 }) }));
  for (const [wx, wz] of [[-3, 8], [3, 8], [-3, -6], [3, -6]]) cylinder(g, 1.1, 0.8, [wx, 1.1, wz], blk, { rz: Math.PI / 2 });
  return g;
}

export function stopSign(r = 0.9) {
  const g = new THREE.Group();
  cylinder(g, 0.07, 2.6, [0, 1.3, 0], plastic('#9aa0a6'));
  const oct = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.08, 8), [plastic('#ffffff'), plastic(0xffffff, { map: label('STOP', { w: 256, h: 256, bg: '#c62828', fg: '#fff', size: 80 }) }), plastic('#c62828')]);
  oct.rotation.x = Math.PI / 2; oct.rotation.y = Math.PI / 8; oct.position.y = 2.9; g.add(oct);
  return g;
}

// --------------------------------------------------------------- interiors
export function room(scene, { w = 16, d = 16, h = 10, wall = '#cfe2f3', floor = 'wood', floorCol = '#a0703f', ceiling = true } = {}) {
  const g = new THREE.Group(); scene.add(g);
  const fm = floor === 'wood' ? M.wood([w / 8, d / 8], floorCol) : floor === 'carpet' ? M.carpet(floorCol, [w / 8, d / 8]) : M.concrete([w / 6, d / 6]);
  const f = new THREE.Mesh(new THREE.PlaneGeometry(w, d), fm); f.rotation.x = -Math.PI / 2; f.receiveShadow = true; g.add(f);
  const wm = M.paint(wall, [w / 8, h / 8]);
  part(g, [w, h, 0.5], [0, h / 2, -d / 2], wm, { cast: false });
  part(g, [0.5, h, d], [-w / 2, h / 2, 0], wm, { cast: false });
  part(g, [0.5, h, d], [w / 2, h / 2, 0], wm, { cast: false });
  if (ceiling) part(g, [w, 0.5, d], [0, h, 0], plastic('#f4f1ea'), { cast: false });
  const trim = plastic('#ffffff');
  part(g, [w, 0.5, 0.2], [0, 0.25, -d / 2 + 0.35], trim, { cast: false });
  part(g, [0.2, 0.5, d], [-w / 2 + 0.35, 0.25, 0], trim, { cast: false });
  part(g, [0.2, 0.5, d], [w / 2 - 0.35, 0.25, 0], trim, { cast: false });
  return g;
}

export function windowOn(scene, x, y, z, w, h, { night = false, ry = 0, curtains = null } = {}) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; scene.add(g);
  const c = document.createElement('canvas'); c.width = 256; c.height = 256; const k = c.getContext('2d');
  const gr = k.createLinearGradient(0, 0, 0, 256);
  if (night) { gr.addColorStop(0, '#071033'); gr.addColorStop(1, '#22306a'); } else { gr.addColorStop(0, '#3f8ff0'); gr.addColorStop(1, '#cfe6ff'); }
  k.fillStyle = gr; k.fillRect(0, 0, 256, 256);
  if (night) { k.fillStyle = '#fff6da'; k.beginPath(); k.arc(180, 70, 22, 0, 7); k.fill(); k.fillStyle = 'rgba(255,255,255,0.8)'; const R = rng(2); for (let i = 0; i < 40; i++) k.fillRect(R() * 256, R() * 160, 2, 2); }
  else { k.fillStyle = '#4fae45'; k.fillRect(0, 196, 256, 60); k.fillStyle = '#3c9a3a'; k.beginPath(); k.arc(60, 196, 44, 0, 7); k.arc(200, 200, 36, 0, 7); k.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  part(g, [w, h, 0.1], [0, 0, 0], new THREE.MeshBasicMaterial({ map: t }), { cast: false });
  const tr = plastic('#ffffff');
  part(g, [w + 0.6, 0.4, 0.4], [0, h / 2, 0.1], tr); part(g, [w + 0.6, 0.4, 0.7], [0, -h / 2, 0.2], tr);
  part(g, [0.4, h, 0.4], [-w / 2, 0, 0.1], tr); part(g, [0.4, h, 0.4], [w / 2, 0, 0.1], tr);
  part(g, [0.2, h, 0.25], [0, 0, 0.1], tr); part(g, [w, 0.2, 0.25], [0, 0, 0.1], tr);
  if (curtains) for (const sx of [-1, 1]) part(g, [w * 0.3, h + 1.4, 0.2], [sx * (w / 2 + w * 0.12), 0, 0.5], plastic(curtains));
  return g;
}

export function bed(scene, x, z, { ry = 0, blanket = '#6fa8dc', len = 7, wid = 4.4 } = {}) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g);
  const wood = M.wood([1, 1], '#8a5a34');
  part(g, [wid + 0.4, 1.2, len + 0.4], [0, 0.6, 0], wood);
  part(g, [wid + 0.4, 3.4, 0.4], [0, 1.7, -len / 2 - 0.2], wood);
  part(g, [wid, 0.8, len], [0, 1.6, 0], plastic('#f4f4f4'));
  part(g, [wid + 0.1, 0.5, len * 0.62], [0, 2.1, len * 0.18], plastic(blanket));
  part(g, [wid * 0.7, 0.6, 1.4], [0, 2.3, -len / 2 + 1.0], plastic('#ffffff'));
  g.userData.top = 2.0;
  return g;
}

export function desk(scene, x, z, ry = 0, H = 3.2) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g);
  const wood = M.wood([1, 1], '#b07a45');
  part(g, [6, 0.3, 3], [0, H, 0], wood);
  for (const sx of [-1, 1]) part(g, [0.3, H, 2.8], [sx * 2.85, H / 2, 0], wood);
  part(g, [1.8, H - 0.6, 2.8], [1.9, H / 2 + 0.15, 0], wood);
  g.userData.top = H + 0.15;
  return g;
}

export function deskLamp(scene, x, y, z, on = true) {
  const g = new THREE.Group(); g.position.set(x, y, z); scene.add(g);
  const m = gloss('#2f6fdc', 50);
  cylinder(g, 0.45, 0.15, [0, 0.07, 0], m); cylinder(g, 0.07, 1.6, [0, 0.85, 0], m);
  const shade = cylinder(g, 0.25, 0.7, [0.3, 1.6, 0.2], m, { r2: 0.55 }); shade.rotation.z = -0.6; shade.rotation.x = 0.4;
  const bulb = part(g, [0.3, 0.2, 0.3], [0.45, 1.35, 0.35], on ? neon('#fff1c4', 2) : plastic('#eee'));
  const pl = new THREE.PointLight('#ffd9a0', on ? 14 : 0, 14, 1.6); pl.position.set(0.5, 1.2, 0.5); g.add(pl);
  return { group: g, light: pl };
}

export function spawnPad(scene, x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
  const c = document.createElement('canvas'); c.width = c.height = 512; const k = c.getContext('2d');
  k.fillStyle = '#a3a2a5'; k.fillRect(0, 0, 512, 512);
  k.strokeStyle = '#2a2a2d'; k.lineWidth = 30; k.beginPath(); k.arc(256, 256, 170, 0, 7); k.stroke();
  k.fillStyle = '#2a2a2d';
  for (let i = 0; i < 4; i++) { k.save(); k.translate(256, 256); k.rotate(i * Math.PI / 2); k.beginPath(); k.moveTo(-36, -60); k.lineTo(36, -60); k.lineTo(0, -140); k.closePath(); k.fill(); k.restore(); }
  k.beginPath(); k.arc(256, 256, 40, 0, 7); k.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  const pm = plastic('#a3a2a5');
  part(g, [6, 1, 6], [0, 0.5, 0], [pm, pm, plastic(0xffffff, { map: t }), pm, pm, pm]);
  return g;
}

export function sparkleField(scene, n, center, spread, seed = 1, color = '#ffffff', size = [0.1, 0.35]) {
  const R = rng(seed);
  const c = document.createElement('canvas'); c.width = c.height = 64; const k = c.getContext('2d');
  const g = k.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); k.fillStyle = g; k.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  const list = [];
  for (let i = 0; i < n; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.6 }));
    s.position.set(center[0] + (R() - 0.5) * spread[0], center[1] + (R() - 0.5) * spread[1], center[2] + (R() - 0.5) * spread[2]);
    const z = size[0] + R() * (size[1] - size[0]); s.scale.set(z, z, 1);
    s.userData = { base: s.position.clone(), ph: R() * 6.28, sp: 0.3 + R() * 0.8 };
    scene.add(s); list.push(s);
  }
  return list;
}
