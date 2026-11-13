// Environment + prop builders for the blocky world. Everything is boxes, cylinders and canvas textures.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mat } from './char.js';

export function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

export function canvasTex(w, h, draw, repeat = null) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  draw(cv.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}

// box centred at (x,y,z)
export function box(parent, w, h, d, color, x = 0, y = 0, z = 0, o = {}) {
  const geo = o.round ? new RoundedBoxGeometry(w, h, d, 2, Math.min(o.round, w / 2.01, h / 2.01, d / 2.01)) : new THREE.BoxGeometry(w, h, d);
  const m = o.material || (Array.isArray(color) ? color : mat(color, o.mat || {}));
  const mesh = new THREE.Mesh(geo, m);
  mesh.position.set(x, y, z);
  if (o.ry) mesh.rotation.y = o.ry;
  if (o.rx) mesh.rotation.x = o.rx;
  if (o.rz) mesh.rotation.z = o.rz;
  mesh.castShadow = o.cast !== false;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

export function cyl(parent, r, h, color, x, y, z, o = {}) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(o.r2 ?? r, r, h, o.seg || 24), o.material || mat(color, o.mat || {}));
  mesh.position.set(x, y, z);
  if (o.rx) mesh.rotation.x = o.rx;
  if (o.rz) mesh.rotation.z = o.rz;
  mesh.castShadow = o.cast !== false; mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

export const emissive = (color, intensity = 1) => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity, roughness: 1 });

// ---------------------------------------------------------------- sky + light

export function skyGradient(scene, top, bottom, mid = null) {
  scene.background = canvasTex(4, 512, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, top);
    if (mid) g.addColorStop(0.55, mid);
    g.addColorStop(1, bottom);
    c.fillStyle = g; c.fillRect(0, 0, w, h);
  });
}

export function lights(scene, o = {}) {
  const hemi = new THREE.HemisphereLight(o.sky ?? 0xcfe8ff, o.ground ?? 0x6b5a45, o.hemi ?? 1.4);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(o.sunColor ?? 0xfff2dc, o.sun ?? 2.6);
  sun.position.set(...(o.dir || [20, 40, 18]));
  sun.target.position.set(...(o.target || [0, 0, 0]));
  sun.castShadow = o.shadow !== false;
  sun.shadow.mapSize.set(2048, 2048);
  const s = o.area || 25;
  Object.assign(sun.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 1, far: 200 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  sun.shadow.radius = 3;
  scene.add(sun, sun.target);
  return { hemi, sun };
}

// ---------------------------------------------------------------- textures

export const tex = {
  grass: () => canvasTex(256, 256, (c) => {
    c.fillStyle = '#5daa3c'; c.fillRect(0, 0, 256, 256);
    const R = rng(3);
    for (let i = 0; i < 900; i++) { c.fillStyle = `rgba(${R() < 0.5 ? '30,90,20' : '140,200,90'},${0.12 + R() * 0.15})`; c.fillRect(R() * 256, R() * 256, 3, 6); }
  }, [60, 60]),
  asphalt: () => canvasTex(256, 256, (c) => {
    c.fillStyle = '#44464d'; c.fillRect(0, 0, 256, 256);
    const R = rng(9);
    for (let i = 0; i < 1500; i++) { c.fillStyle = `rgba(255,255,255,${R() * 0.05})`; c.fillRect(R() * 256, R() * 256, 2, 2); }
  }, [2, 30]),
  checker: (a, b, n = 8, rep = [4, 4]) => canvasTex(256, 256, (c) => {
    const s = 256 / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { c.fillStyle = (i + j) % 2 ? a : b; c.fillRect(i * s, j * s, s, s); }
  }, rep),
  planks: (a, b, rep = [3, 3]) => canvasTex(256, 256, (c) => {
    for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? a : b; c.fillRect(0, i * 32, 256, 32); c.fillStyle = 'rgba(0,0,0,0.18)'; c.fillRect(0, i * 32, 256, 2); c.fillRect((i * 97) % 256, i * 32, 2, 32); }
  }, rep),
  tiles: (a, line, rep = [6, 6]) => canvasTex(128, 128, (c) => {
    c.fillStyle = a; c.fillRect(0, 0, 128, 128); c.strokeStyle = line; c.lineWidth = 3; c.strokeRect(0, 0, 128, 128);
  }, rep),
  carpet: (a, b, rep = [4, 12]) => canvasTex(128, 128, (c) => {
    c.fillStyle = a; c.fillRect(0, 0, 128, 128);
    c.fillStyle = b; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { c.save(); c.translate(16 + i * 32, 16 + j * 32); c.rotate(Math.PI / 4); c.fillRect(-6, -6, 12, 12); c.restore(); }
  }, rep),
  wallpaper: (a, b, rep = [6, 3]) => canvasTex(128, 128, (c) => {
    c.fillStyle = a; c.fillRect(0, 0, 128, 128); c.fillStyle = b; for (let i = 0; i < 4; i++) c.fillRect(i * 32 + 12, 0, 8, 128);
  }, rep),
  paving: (rep = [20, 20]) => canvasTex(128, 128, (c) => {
    c.fillStyle = '#cfc4ae'; c.fillRect(0, 0, 128, 128); c.strokeStyle = '#b3a78f'; c.lineWidth = 4;
    c.strokeRect(0, 0, 64, 64); c.strokeRect(64, 64, 64, 64); c.strokeRect(64, 0, 64, 64); c.strokeRect(0, 64, 64, 64);
  }, rep),
};

export function text(content, { w = 512, h = 128, bg = '#ffffff', fg = '#222', font = 'Lilita One', size = 80 } = {}) {
  return canvasTex(w, h, (c) => {
    c.fillStyle = bg; c.fillRect(0, 0, w, h);
    c.fillStyle = fg; c.font = `${size}px "${font}"`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(content, w / 2, h / 2 + 4);
  });
}

export function ground(scene, color = null, size = 400, texture = null) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), texture ? mat(0xffffff, { map: texture }) : mat(color));
  m.rotation.x = -Math.PI / 2;
  m.receiveShadow = true;
  scene.add(m);
  return m;
}

// ---------------------------------------------------------------- exterior props

export function house(parent, x, z, { w = 10, d = 8, h = 6, color = '#e8d8b0', roof = '#7a3b2e', door = '#8a4b2a', face = 1 } = {}) {
  const g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g);
  if (face === -1) g.rotation.y = Math.PI;
  if (face === 'L') g.rotation.y = Math.PI / 2;
  if (face === 'R') g.rotation.y = -Math.PI / 2;
  box(g, w, h, d, color, 0, h / 2, 0);
  // gable roof: two slabs
  const slope = Math.atan2(h * 0.45, w / 2);
  const len = Math.hypot(w / 2, h * 0.45) + 0.6;
  box(g, len, 0.5, d + 1, roof, -w / 4, h + h * 0.22, 0, { rz: slope });
  box(g, len, 0.5, d + 1, roof, w / 4, h + h * 0.22, 0, { rz: -slope });
  // gable fill
  const tri = new THREE.Shape([new THREE.Vector2(-w / 2, 0), new THREE.Vector2(w / 2, 0), new THREE.Vector2(0, h * 0.45)]);
  const tg = new THREE.ExtrudeGeometry(tri, { depth: d - 0.2, bevelEnabled: false });
  const tm = new THREE.Mesh(tg, mat(color)); tm.position.set(0, h, -(d - 0.2) / 2); tm.castShadow = true; g.add(tm);
  // door + windows on +z face
  box(g, 1.8, 3.4, 0.3, door, 0, 1.7, d / 2 + 0.05);
  box(g, 0.25, 0.25, 0.2, '#e6c35c', 0.6, 1.7, d / 2 + 0.25);
  for (const wx of [-w / 2 + 2, w / 2 - 2]) {
    box(g, 2.2, 2.0, 0.2, '#ffffff', wx, h * 0.55, d / 2 + 0.05);
    box(g, 1.8, 1.6, 0.25, '#9fd3f0', wx, h * 0.55, d / 2 + 0.06, { mat: { roughness: 0.2 } });
    box(g, 0.12, 1.6, 0.3, '#ffffff', wx, h * 0.55, d / 2 + 0.08);
  }
  box(g, 3, 0.4, 2, '#bfb6a5', 0, 0.2, d / 2 + 1);
  return g;
}

export function tree(parent, x, z, s = 1, seed = 1) {
  const R = rng(seed);
  const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); parent.add(g);
  box(g, 0.9, 4, 0.9, '#7a5233', 0, 2, 0);
  const greens = ['#3f9a3a', '#4fae45', '#358a33'];
  for (let i = 0; i < 4; i++) {
    const sz = 2.4 + R() * 1.4;
    box(g, sz, sz, sz, greens[i % 3], (R() - 0.5) * 1.8, 4.6 + R() * 1.6, (R() - 0.5) * 1.8, { round: 0.5, ry: R() });
  }
  return g;
}

export function lamp(parent, x, z, on = false) {
  const g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g);
  cyl(g, 0.15, 7, '#2d2f36', 0, 3.5, 0);
  box(g, 0.8, 0.9, 0.8, on ? '#fff3c4' : '#f4ecd6', 0, 7.3, 0, { material: on ? emissive('#ffe7a3', 2) : undefined });
  box(g, 1.0, 0.2, 1.0, '#2d2f36', 0, 7.85, 0);
  return g;
}

export function cloud(parent, x, y, z, s = 1, seed = 1) {
  const R = rng(seed);
  const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(s); parent.add(g);
  const m = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, emissive: '#ffffff', emissiveIntensity: 0.35 });
  for (let i = 0; i < 5; i++) {
    const w = 4 + R() * 5;
    const b = new THREE.Mesh(new RoundedBoxGeometry(w, 2 + R() * 2, 3 + R() * 2, 2, 0.8), m);
    b.position.set((i - 2) * 3 + R(), R() * 1.2, R() * 2);
    g.add(b);
  }
  return g;
}

export function car(parent, x, z, color = '#d84a3a', ry = 0) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; parent.add(g);
  box(g, 3.4, 1.4, 7, color, 0, 1.3, 0, { round: 0.3 });
  box(g, 3.0, 1.3, 3.6, color, 0, 2.6, -0.3, { round: 0.3 });
  box(g, 3.05, 0.9, 3.2, '#9fd3f0', 0, 2.65, -0.3, { mat: { roughness: 0.15 } });
  for (const [wx, wz] of [[-1.6, 2.2], [1.6, 2.2], [-1.6, -2.2], [1.6, -2.2]]) cyl(g, 0.65, 0.5, '#1d1d22', wx, 0.65, wz, { rz: Math.PI / 2 });
  return g;
}

export function fence(parent, x0, x1, z, color = '#ffffff') {
  for (let x = x0; x <= x1; x += 1.2) box(parent, 0.3, 1.8, 0.3, color, x, 0.9, z);
  box(parent, x1 - x0 + 0.3, 0.25, 0.2, color, (x0 + x1) / 2, 1.4, z);
  box(parent, x1 - x0 + 0.3, 0.25, 0.2, color, (x0 + x1) / 2, 0.7, z);
}

// ---------------------------------------------------------------- interiors

export function room(scene, { w = 12, d = 12, h = 8, wall = '#efe3c8', wallTex = null, floorTex = null, floor = '#c9a27a', ceiling = true, front = false } = {}) {
  const g = new THREE.Group(); scene.add(g);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(w, d), floorTex ? mat(0xffffff, { map: floorTex }) : mat(floor));
  fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; g.add(fl);
  const wm = wallTex ? mat(0xffffff, { map: wallTex }) : mat(wall);
  box(g, w, h, 0.4, null, 0, h / 2, -d / 2, { material: wm, cast: false });
  box(g, 0.4, h, d, null, -w / 2, h / 2, 0, { material: wm, cast: false });
  box(g, 0.4, h, d, null, w / 2, h / 2, 0, { material: wm, cast: false });
  if (front) box(g, w, h, 0.4, null, 0, h / 2, d / 2, { material: wm, cast: false });
  if (ceiling) box(g, w, 0.4, d, '#f6f2ea', 0, h, 0, { cast: false });
  // baseboards
  box(g, w, 0.4, 0.15, '#ffffff', 0, 0.2, -d / 2 + 0.25, { cast: false });
  return g;
}

export function windowPane(parent, x, y, z, w, h, { night = false, ry = 0 } = {}) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; parent.add(g);
  const sky = canvasTex(128, 128, (c) => {
    const gr = c.createLinearGradient(0, 0, 0, 128);
    if (night) { gr.addColorStop(0, '#0d1433'); gr.addColorStop(1, '#2b3570'); }
    else { gr.addColorStop(0, '#6db6ff'); gr.addColorStop(1, '#d6efff'); }
    c.fillStyle = gr; c.fillRect(0, 0, 128, 128);
    if (night) { c.fillStyle = '#fff7d6'; c.beginPath(); c.arc(92, 34, 12, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,0.8)'; for (let i = 0; i < 20; i++) c.fillRect((i * 53) % 128, (i * 31) % 80, 2, 2); }
    else { c.fillStyle = '#4fae45'; c.fillRect(0, 96, 128, 32); c.fillStyle = '#3f9a3a'; c.beginPath(); c.arc(30, 96, 22, 0, 7); c.arc(100, 100, 18, 0, 7); c.fill(); }
  });
  box(g, w, h, 0.1, null, 0, 0, 0, { material: new THREE.MeshBasicMaterial({ map: sky }), cast: false });
  const fc = '#ffffff';
  box(g, w + 0.4, 0.3, 0.3, fc, 0, h / 2, 0.05); box(g, w + 0.4, 0.3, 0.3, fc, 0, -h / 2, 0.05);
  box(g, 0.3, h, 0.3, fc, -w / 2, 0, 0.05); box(g, 0.3, h, 0.3, fc, w / 2, 0, 0.05);
  box(g, 0.15, h, 0.2, fc, 0, 0, 0.05); box(g, w, 0.15, 0.2, fc, 0, 0, 0.05);
  return g;
}

export function table(parent, x, z, { w = 5, d = 3, h = 2.3, color = '#a8743f', cloth = null } = {}) {
  const g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g);
  box(g, w, 0.25, d, cloth || color, 0, h, 0, { round: 0.05 });
  for (const [lx, lz] of [[-w / 2 + 0.3, -d / 2 + 0.3], [w / 2 - 0.3, -d / 2 + 0.3], [-w / 2 + 0.3, d / 2 - 0.3], [w / 2 - 0.3, d / 2 - 0.3]]) box(g, 0.3, h, 0.3, color, lx, h / 2, lz);
  g.userData.top = h + 0.125;
  return g;
}

export function chair(parent, x, z, ry = 0, { seat = 1.4, color = '#8a5a33' } = {}) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; parent.add(g);
  box(g, 1.8, 0.2, 1.8, color, 0, seat, 0);
  for (const [lx, lz] of [[-0.75, -0.75], [0.75, -0.75], [-0.75, 0.75], [0.75, 0.75]]) box(g, 0.2, seat, 0.2, color, lx, seat / 2, lz);
  box(g, 1.8, 2.2, 0.2, color, 0, seat + 1.1, -0.85);
  return g;
}

export function plate(parent, x, y, z, food = true, scale = 1) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(scale); parent.add(g);
  cyl(g, 0.75, 0.08, '#ffffff', 0, 0.04, 0, { r2: 0.9, seg: 32 });
  if (food) {
    box(g, 0.9, 0.3, 0.7, '#f3d27a', -0.1, 0.22, 0, { round: 0.14 });        // mash
    box(g, 0.5, 0.25, 0.45, '#9c4a2a', 0.35, 0.2, 0.15, { round: 0.1 });       // meat
    for (let i = 0; i < 5; i++) box(g, 0.14, 0.14, 0.14, '#4caf50', -0.2 + i * 0.12, 0.38, 0.3 - (i % 2) * 0.12, { round: 0.06 });
  }
  return g;
}

export function fridge(parent, x, z, { color = '#e9ecef', ry = 0 } = {}) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; parent.add(g);
  const W = 3.2, H = 6.6, D = 2.6, t = 0.2;
  const inner = mat('#f7fbff', { roughness: 0.4 });
  box(g, W, H, t, color, 0, H / 2, -D / 2 + t / 2);                    // back
  box(g, t, H, D, color, -W / 2 + t / 2, H / 2, 0);                     // sides
  box(g, t, H, D, color, W / 2 - t / 2, H / 2, 0);
  box(g, W, t, D, color, 0, H - t / 2, 0);                              // top
  box(g, W, 0.6, D, color, 0, 0.3, 0);                                   // bottom
  box(g, W - 2 * t - 0.02, H - 1.0, 0.05, null, 0, H / 2 + 0.2, -D / 2 + t + 0.03, { material: inner, cast: false });
  for (const sy of [2.0, 3.6, 5.0]) box(g, W - 2 * t - 0.05, 0.08, D - 0.4, null, 0, sy, 0, { material: new THREE.MeshStandardMaterial({ color: '#dff4ff', transparent: true, opacity: 0.55, roughness: 0.1 }), cast: false });
  box(g, W - 2 * t - 0.05, 0.1, D - 0.4, '#ffffff', 0, 0.65, 0, { cast: false });
  // interior lamp panel
  const lampM = emissive('#fff6e6', 0.0);
  box(g, 1.2, 0.08, 0.6, null, 0, H - t - 0.05, -0.4, { material: lampM, cast: false });
  const light = new THREE.PointLight('#e8f4ff', 0, 14, 1.6);
  light.position.set(0, H - 1.2, 0.2);
  g.add(light);
  // door on a hinge at the left edge
  const hinge = new THREE.Group(); hinge.position.set(-W / 2, 0, D / 2); g.add(hinge);
  box(hinge, W, H - 0.1, 0.3, color, W / 2, H / 2, 0.15, { round: 0.08 });
  box(hinge, 0.18, 2.4, 0.25, '#b7bcc2', W - 0.4, H * 0.62, 0.4, { round: 0.06 });
  box(hinge, W - 0.4, 0.08, 0.02, '#cfd4d9', W / 2, H * 0.38, 0.31);
  // magnets / a child's drawing on the door
  const drawing = canvasTex(128, 160, (c) => {
    c.fillStyle = '#fff'; c.fillRect(0, 0, 128, 160);
    c.strokeStyle = '#e8546b'; c.lineWidth = 6; c.beginPath(); c.arc(64, 60, 30, 0, 7); c.stroke();
    c.fillStyle = '#3a7bd5'; c.fillRect(30, 100, 20, 40); c.fillStyle = '#ff9eb5'; c.fillRect(74, 96, 26, 44);
    c.fillStyle = '#222'; c.font = '20px sans-serif'; c.fillText('ME + MOM', 14, 30);
  });
  box(hinge, 0.9, 1.15, 0.03, null, W * 0.62, H * 0.6, 0.31, { material: mat(0xffffff, { map: drawing }), cast: false });
  return { group: g, hinge, light, lampM };
}

export function counterRun(parent, x, z, len, { color = '#f2efe8', top = '#6b6f78', ry = 0, h = 2.6 } = {}) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; parent.add(g);
  box(g, len, h, 2, color, 0, h / 2, 0);
  box(g, len + 0.1, 0.2, 2.2, top, 0, h + 0.1, 0.05);
  for (let i = 0; i < Math.floor(len / 2); i++) {
    box(g, 1.7, h - 0.5, 0.06, '#e4ded2', -len / 2 + 1 + i * 2, h / 2, 1.02);
    box(g, 0.5, 0.12, 0.12, '#9aa0a8', -len / 2 + 1 + i * 2, h - 0.6, 1.08);
  }
  return g;
}

export function pendant(parent, x, y, z, color = '#ffd9a0', intensity = 18, dist = 16, shadow = false) {
  const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g);
  cyl(g, 0.04, 2, '#222', 0, 1, 0, { cast: false });
  cyl(g, 0.3, 0.7, '#3b3b3b', 0, -0.2, 0, { r2: 0.9, cast: false });
  const bulb = box(g, 0.45, 0.25, 0.45, null, 0, -0.6, 0, { material: emissive(color, 3), cast: false });
  const pl = new THREE.PointLight(color, intensity, dist, 1.5);
  pl.position.set(0, -0.9, 0);
  pl.castShadow = shadow; pl.shadow.mapSize.set(1024, 1024); pl.shadow.bias = -0.002;
  g.add(pl);
  return { group: g, light: pl, bulb };
}

export function bokeh(parent, n, spread, center, colors, seed = 1) {
  const R = rng(seed);
  const t = canvasTex(64, 64, (c) => {
    const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(0.6, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(0, 0, 64, 64);
  });
  const sprites = [];
  for (let i = 0; i < n; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, color: colors[i % colors.length], transparent: true, opacity: 0.5 + R() * 0.4, depthWrite: false, blending: THREE.AdditiveBlending }));
    s.position.set(center[0] + (R() - 0.5) * spread[0], center[1] + (R() - 0.5) * spread[1], center[2] + (R() - 0.5) * spread[2]);
    const sc = 0.4 + R() * 1.4; s.scale.set(sc, sc, 1);
    s.userData = { base: s.position.clone(), ph: R() * 6.28, sp: 0.2 + R() * 0.5 };
    parent.add(s); sprites.push(s);
  }
  return sprites;
}
