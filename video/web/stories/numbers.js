// THE NUMBERS: "In this world, everyone has a number above their head."
// Built on the Roblox-accurate kit in ../rbx/. One camera move per shot.
// Staging rule: the camera sees what Leo sees, so Leo's own number is never shown until Ellie reads it.
import * as THREE from 'three';
import {
  makeAvatar, addTag, numberTag, resetPose, idle, walk, jumpPose, sit, hug, holdHand, scaredPose, wave, faceTick,
  despawn, spawnIn, plastic, gloss, rng, smooth, clamp, lerp,
} from '../rbx/avatar.js';
import {
  M, neon, part, cylinder, label, sky, lights, ground, street, house, tree, lampPost, fence, mailbox, schoolBus,
  stopSign, room, windowOn, bed, desk, deskLamp, spawnPad, sparkleField,
} from '../rbx/world.js';

export const STYLE = {
  fov: 62, faceTick, captions: 'single', bubbles: true,
  grade: 'saturate(1.25) contrast(1.06) brightness(1.02)', bloom: 0.36, endFade: '#ffffff', exposure: 1.0,
};

const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------------------------------------------------------------- cast
const SKIN = '#f3d2b1';
const CAST = {
  leo: (o = {}) => makeAvatar({ skin: SKIN, scale: 0.82, seed: 11, hair: 'swoop', hairColor: '#4a2c19',
    shirt: { kind: 'hoodie', color: '#2f7de1', accent: '#f4f4f4' }, pants: { kind: 'jeans', color: '#3b5a8c', shoes: '#f2f2f2', sole: '#d9d9d9' }, ...o }),
  leoPJ: (o = {}) => makeAvatar({ skin: SKIN, scale: 0.82, seed: 11, hair: 'swoop', hairColor: '#4a2c19',
    shirt: { kind: 'pajama', color: '#5d8fd8', accent: '#ffffff' }, pants: { kind: 'pjpants', color: '#5d8fd8', shoes: '#5d8fd8', sole: '#5d8fd8' }, ...o }),
  ellie: (o = {}) => makeAvatar({ skin: SKIN, scale: 0.68, seed: 21, hair: 'pigtails', hairColor: '#8a4a26', number: '21',
    shirt: { kind: 'dress', color: '#ff8fc2', graphic: 'heart', accent: '#ff3d7f' }, pants: { kind: 'skirt', color: '#9b59d0', shoes: '#ff5ca8', sole: '#ffffff', socks: '#ffffff' },
    face: {}, ...o }),
  elliePJ: (o = {}) => makeAvatar({ skin: SKIN, scale: 0.68, seed: 21, hair: 'pigtails', hairColor: '#8a4a26', number: '21',
    shirt: { kind: 'pajama', color: '#f7a8cf', accent: '#ffffff' }, pants: { kind: 'pjpants', color: '#f7a8cf', shoes: '#f7a8cf', sole: '#f7a8cf' }, ...o }),
  mom: (o = {}) => makeAvatar({ skin: '#f0c8a4', seed: 31, hair: 'bob', hairColor: '#3d2618', number: '4,000,112',
    shirt: { kind: 'sweater', color: '#c85a7c' }, pants: { kind: 'slacks', color: '#3b3f5c', shoes: '#2b2b2b', belt: null }, ...o }),
  mailman: (o = {}) => makeAvatar({ skin: '#c98e6a', seed: 41, hair: 'cap', capColor: '#2a3f8f', hairColor: '#1d1d1d', number: '17',
    shirt: { kind: 'uniform', color: '#9cc6ea', accent: '#2a3f8f' }, pants: { kind: 'slacks', color: '#2a3f6f', shoes: '#1d1d1d' }, ...o }),
  driver: (o = {}) => makeAvatar({ skin: '#8d5a3b', seed: 51, hair: 'curly', hairColor: '#1b1b1b', number: '18',
    shirt: { kind: 'tee', color: '#6c7a89', graphic: 'stripe', accent: '#f5b800' }, pants: { kind: 'jeans', color: '#2f3d55', shoes: '#3b2a1e' }, ...o }),
  guard: (o = {}) => makeAvatar({ skin: '#f0c8a4', seed: 61, hair: 'bun', hairColor: '#b9b9b9', number: '19',
    shirt: { kind: 'vest', color: '#ff7a1a', inner: '#f4f4f4' }, pants: { kind: 'slacks', color: '#30343c', shoes: '#1d1d1d' }, ...o }),
  scientist: (o = {}) => makeAvatar({ skin: '#e2b08a', seed: 71, hair: 'bald', hairColor: '#8a8a8a', face: { glasses: true },
    shirt: { kind: 'labcoat', color: '#f4f4f4', inner: '#9cc6ea', accent: '#c0392b' }, pants: { kind: 'slacks', color: '#3c3c44', shoes: '#1d1d1d' }, ...o }),
  townie: (i, number) => {
    const R = rng(300 + i);
    const shirts = [
      { kind: 'tee', color: '#e74c3c', graphic: 'star', accent: '#ffd23f' }, { kind: 'hoodie', color: '#27ae60', accent: '#f4f4f4' },
      { kind: 'tee', color: '#f1c40f', graphic: 'stripe', accent: '#1d1d1d' }, { kind: 'suit', color: '#1f2a44', inner: '#f4f4f4', accent: '#c0392b' },
      { kind: 'hoodie', color: '#8e44ad', accent: '#f4f4f4' }, { kind: 'tee', color: '#1abc9c', graphic: 'heart', accent: '#ffffff' },
      { kind: 'sweater', color: '#e67e22' }, { kind: 'tee', color: '#ecf0f1', graphic: 'star', accent: '#3498db' },
      { kind: 'suit', color: '#7a1f2b', inner: '#f4f4f4', accent: '#1d1d1d' }, { kind: 'hoodie', color: '#34495e', accent: '#f4f4f4' },
    ];
    const pants = [{ kind: 'jeans', color: '#3b5a8c', shoes: '#f2f2f2' }, { kind: 'slacks', color: '#2b2b2b', shoes: '#111' }, { kind: 'jeans', color: '#4a6fa5', shoes: '#c0392b' }, { kind: 'shorts', color: '#c8a46e', shoes: '#ffffff' }, { kind: 'skirt', color: '#2c3e50', shoes: '#111' }];
    const hairs = ['swoop', 'long', 'curly', 'spiky', 'bob', 'cap', 'pigtails', 'bun'];
    const skins = ['#f3d2b1', '#e2b08a', '#c98e6a', '#8d5a3b', '#f0c8a4', '#6b4430'];
    const hairCols = ['#2a1d16', '#4a2c19', '#c49a63', '#111111', '#8a3b1f', '#d9c37a'];
    return makeAvatar({ skin: skins[Math.floor(R() * skins.length)], shirt: shirts[i % shirts.length], pants: pants[i % pants.length],
      hair: hairs[i % hairs.length], hairColor: hairCols[i % hairCols.length], seed: 400 + i, number, scale: i % 4 === 3 ? 0.8 : 1, capColor: '#c0392b' });
  },
};

const headPos = (av) => { const v = new THREE.Vector3(); av.head.getWorldPosition(v); return v; };

class Shot {
  constructor(ctx) { this.ctx = ctx; this.scene = new THREE.Scene(); this.chars = []; this.speakers = {}; this.cam = null; this.vignette = 0.22; this.anchors = {}; }
  add(av, x, y, z, ry = 0) { av.group.position.set(x, y, z); av.group.rotation.y = ry; this.scene.add(av.group); this.chars.push(av); return av; }
}

function suburb(s, { houses = true, lamps = true, streetX = 0, zSpan = [60, -220], nearSide = true } = {}) {
  const sc = s.scene;
  sky(sc, {});
  sc.fog = new THREE.Fog('#c6dff4', 170, 720);
  ground(sc, M.grass([60, 60]), 700);
  street(sc, { x: streetX, z0: zSpan[0], z1: zSpan[1] });
  if (houses) {
    const cols = ['#9fc3e6', '#f2e3c6', '#c9e2b8', '#f4c7b8', '#e6e2f2', '#ffe6a6'];
    for (let i = 0; i < 8; i++) {
      const z = 30 - i * 26;
      house(sc, streetX - 26, z, { col: cols[i % 6], face: Math.PI / 2 });
      house(sc, streetX + 26, z - 12, { col: cols[(i + 3) % 6], face: -Math.PI / 2 });
      tree(sc, streetX - 15.5, z - 12, 1.15, i * 3 + 1);
      if (nearSide) tree(sc, streetX + 15.5, z + 2, 1.05, i * 3 + 2);
      if (lamps) { lampPost(sc, streetX - 8.2, z - 6); if (nearSide) lampPost(sc, streetX + 8.2, z - 19); }
    }
  }
}

// ---------------------------------------------------------------- notebook page
function notebook(scene, x, y, z, ry = 0) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; scene.add(g);
  const cv = document.createElement('canvas'); cv.width = 768; cv.height = 1024;
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const W = 2.0, H = 2.67;
  part(g, [W * 2 + 0.3, 0.08, H + 0.2], [0.01, 0.04, 0], plastic('#2b3a67'));
  const left = new THREE.Mesh(new THREE.PlaneGeometry(W, H), plastic(0xffffff, { map: (() => {
    const c = document.createElement('canvas'); c.width = 384; c.height = 512; const k = c.getContext('2d');
    k.fillStyle = '#fbf8ef'; k.fillRect(0, 0, 384, 512); k.strokeStyle = '#9cc3e6'; k.lineWidth = 2; for (let yy = 70; yy < 512; yy += 34) { k.beginPath(); k.moveTo(0, yy); k.lineTo(384, yy); k.stroke(); }
    k.strokeStyle = '#2b4fa8'; k.lineWidth = 4; k.beginPath(); k.arc(190, 250, 70, 0, 7); k.stroke(); k.font = '46px "Patrick Hand"'; k.fillStyle = '#2b4fa8'; k.fillText('?', 178, 266); k.fillText('#?', 150, 420);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })() }));
  left.rotation.x = -Math.PI / 2; left.position.set(-W / 2, 0.1, 0); left.receiveShadow = true; g.add(left);
  const right = new THREE.Mesh(new THREE.PlaneGeometry(W, H), plastic(0xffffff, { map: tex }));
  right.rotation.x = -Math.PI / 2; right.position.set(W / 2 + 0.02, 0.1, 0); right.receiveShadow = true; g.add(right);
  const rows = [
    ['NUMBERS I SAW', ''], ['Mom', '4,000,112'], ['Mr. Patel', '902,114'], ['Coach Rivera', '54,330'],
    ['Mailman', '17'], ['Bus driver', '18'], ['Crossing guard', '19'], ['Ellie', '21'],
  ];
  const state = { rows: 7, write: 1, strikes: [0, 0, 0], circle: 0 };
  let key = '';
  const rowY = (i) => 150 + i * 104;
  function draw() {
    const c = cv.getContext('2d');
    c.fillStyle = '#fbf8ef'; c.fillRect(0, 0, 768, 1024);
    c.strokeStyle = '#a9cbe9'; c.lineWidth = 3; for (let yy = 110; yy < 1024; yy += 52) { c.beginPath(); c.moveTo(0, yy); c.lineTo(768, yy); c.stroke(); }
    c.strokeStyle = '#ef8a8a'; c.lineWidth = 3; c.beginPath(); c.moveTo(70, 0); c.lineTo(70, 1024); c.stroke();
    c.fillStyle = '#1f3a8a'; c.textBaseline = 'alphabetic';
    for (let i = 0; i < rows.length; i++) {
      if (i > state.rows) break;
      const frac = i === state.rows ? state.write : 1;
      if (frac <= 0) continue;
      const [name, num] = rows[i];
      c.save(); c.beginPath(); c.rect(0, rowY(i) - 90, 90 + 680 * frac, 120); c.clip();
      if (i === 0) { c.font = '64px "Patrick Hand"'; c.fillText(name, 96, rowY(i)); c.fillRect(96, rowY(i) + 10, 400, 4); }
      else { c.font = '66px "Patrick Hand"'; c.fillText(name, 96, rowY(i)); c.textAlign = 'right'; c.font = '74px "Patrick Hand"'; c.fillText(num, 730, rowY(i)); c.textAlign = 'left'; }
      c.restore();
    }
    c.strokeStyle = '#d62828'; c.lineCap = 'round'; c.lineWidth = 11;
    state.strikes.forEach((k, j) => {
      if (k <= 0) return;
      const y = rowY(4 + j) - 22;
      c.beginPath(); c.moveTo(84, y + 6); for (let x = 84; x <= 84 + 660 * k; x += 30) c.lineTo(x, y + Math.sin(x * 0.07 + j) * 5); c.stroke();
    });
    if (state.circle > 0) {
      const y = rowY(7) - 24;
      c.lineWidth = 9; c.beginPath();
      c.ellipse(410, y, 360, 64, -0.03, -Math.PI * 0.6, -Math.PI * 0.6 + Math.PI * 2.15 * state.circle); c.stroke();
    }
  }
  draw();
  return {
    group: g, state,
    set(s) { Object.assign(state, s); const k = JSON.stringify(state); if (k !== key) { key = k; draw(); tex.needsUpdate = true; } },
  };
}

function leoRoom(s, { night = false } = {}) {
  const sc = s.scene;
  sc.background = new THREE.Color(night ? '#060a1c' : '#cfe6ff');
  room(sc, { w: 18, d: 16, h: 10, wall: night ? '#a9c3de' : '#cfe2f3', floor: 'wood', floorCol: '#a0703f' });
  windowOn(sc, -3.2, 6.0, -7.7, 4.4, 3.6, { night, curtains: '#f2c14e' });
  const dk = desk(sc, 2.4, -5.6, 0, 2.6);
  const lamp = deskLamp(sc, 4.4, dk.userData.top, -6.2, night);
  // poster + shelf
  part(sc, [3.2, 4.2, 0.1], [7.0, 6.0, -7.7], plastic(0xffffff, { map: label('SPACE', { w: 256, h: 340, bg: '#2b2d6e', fg: '#ffd23f', size: 70 }) }), { cast: false });
  part(sc, [4, 0.3, 1.2], [-7.2, 5.5, -7.2], M.wood([1, 1], '#8a5a34'));
  for (let i = 0; i < 5; i++) part(sc, [0.5, 1.1 + (i % 2) * 0.3, 0.9], [-8.6 + i * 0.6, 6.2, -7.2], plastic(['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6'][i]));
  bed(sc, -6.2, -1.5, { blanket: '#3d6fbf' });
  // chair
  const ch = new THREE.Group(); ch.position.set(2.4, 0, -3.2); sc.add(ch);
  part(ch, [2, 0.3, 2], [0, 1.45, 0], M.wood([1, 1], '#7a4a2a')); for (const [a, b] of [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]]) part(ch, [0.25, 1.45, 0.25], [a, 0.72, b], plastic('#5a3820'));
  part(ch, [2, 2.4, 0.25], [0, 2.8, 0.9], M.wood([1, 1], '#7a4a2a'));
  const nb = notebook(sc, 1.7, dk.userData.top, -5.0);
  const hemi = new THREE.HemisphereLight(night ? 0x6f86c9 : 0xfff2dc, 0x4a3828, night ? 0.5 : 1.3); sc.add(hemi);
  const key = new THREE.DirectionalLight(night ? 0x8fa6ff : 0xfff0d6, night ? 0.5 : 1.9);
  key.position.set(-6, 16, 10); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 60 }); key.shadow.bias = -0.0005; key.shadow.normalBias = 0.04; sc.add(key);
  if (night) { lamp.light.intensity = 22; lamp.light.distance = 16; }
  return { notebook: nb, lamp };
}

function ellieRoom(s, { night = false, morning = false } = {}) {
  const sc = s.scene;
  sc.background = new THREE.Color(night ? '#060a1c' : '#ffe9c9');
  room(sc, { w: 16, d: 16, h: 10, wall: night ? '#c9a6cf' : '#f6cfe0', floor: 'carpet', floorCol: night ? '#a48bb8' : '#e7d3f0' });
  windowOn(sc, 3.4, 6.0, -7.7, 4.2, 3.6, { night, curtains: '#ffffff' });
  const b = bed(sc, -3.2, -2.6, { blanket: '#ff8fc2', len: 7.4, wid: 4.6 });
  // bedside table + star night light
  part(sc, [2, 2.4, 2], [0.6, 1.2, -5.6], M.wood([1, 1], '#f2e6da'));
  const star = part(sc, [0.6, 0.6, 0.3], [0.6, 2.8, -5.6], night ? neon('#ffe27a', 2.2) : plastic('#ffe27a'));
  const nl = new THREE.PointLight('#ffcf7a', night ? 9 : 0, 10, 1.6); nl.position.set(0.6, 3.4, -5.2); sc.add(nl);
  // toys
  part(sc, [1.2, 1.2, 1.2], [5.6, 0.6, 2.2], plastic('#7fb3ff')); part(sc, [1, 1, 1], [6.2, 1.7, 2.0], plastic('#ffb36b'));
  const hemi = new THREE.HemisphereLight(night ? 0x6f86c9 : 0xfff0e0, 0x3a2a30, night ? 0.75 : 1.25); sc.add(hemi);
  const key = new THREE.DirectionalLight(night ? 0x7f98ff : (morning ? 0xffd9a8 : 0xfff0d6), night ? 0.55 : 2.0);
  key.position.set(8, 14, -4 + (night ? 6 : 0)); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 60 }); key.shadow.bias = -0.0005; key.shadow.normalBias = 0.04; sc.add(key);
  return { bed: b };
}

// ---------------------------------------------------------------- shots
export const SCENES = {
  // 1. In this world, everyone has a number above their head.
  crowd(ctx) {
    const s = new Shot(ctx);
    suburb(s);
    lights(s.scene, { target: [0, 0, 0], area: 34 });
    const nums = ['2,018,442', '77', '4,812,003', '350', '6,602,118', '903,377', '1,209', '88,104', '5', '2,991', '61,450', '12,804'];
    const spots = [[-3, 6, 0], [2.4, 3, -0.4], [-6.5, 1, 0.5], [5, -2, -0.6], [-1, -5, 0.2], [9.5, 7, -0.8], [-10, -3, 0.9], [1.5, -11, 0], [-4.5, -15, 0.3], [6.5, -17, -0.3], [11, -8, -1], [-12, 9, 1.2]];
    const people = spots.map(([x, z, ry], i) => s.add(CAST.townie(i, nums[i]), x, Math.abs(x) > 7.3 ? 0.5 : 0, z, ry));
    const exprs = ['smile', 'happy', 'smile', 'smug', 'smile', 'happy', 'neutral', 'smile', 'happy', 'smile', 'smug', 'smile'];
    s.cam = { path: [[V(-3, 5.05, 10.0), V(-3, 5.35, 6)], [V(-2, 9.5, 20), V(-1, 3.8, -2)], [V(-0.5, 13, 30), V(0, 2.6, -8)]], ease: 'inout' };
    s.update = (lt) => {
      people.forEach((p, i) => {
        resetPose(p); idle(p, lt);
        p.face.set({ expr: exprs[i] });
        if (i % 4 === 1) { walk(p, lt, 0.8); p.group.position.z = spots[i][1] + Math.cos(spots[i][2]) * lt * 2.2; }
        if (i === 0) { p.headPivot.rotation.x = -0.12; }
        if (i === 2 || i === 6) wave(p, lt + i);
      });
    };
    return s;
  },

  // 2. Nobody knows what it means.
  lab(ctx) {
    const s = new Shot(ctx);
    const sc = s.scene;
    sc.background = new THREE.Color('#dfe8ee');
    room(sc, { w: 20, d: 16, h: 11, wall: '#e8eef2', floor: 'concrete' });
    const board = document.createElement('canvas'); board.width = 1024; board.height = 560;
    const b = board.getContext('2d'); b.fillStyle = '#fbfbf7'; b.fillRect(0, 0, 1024, 560);
    b.font = '64px "Patrick Hand"'; b.fillStyle = '#2b4fa8';
    [['77 = ?', 60, 110], ['4,812,003 ??', 520, 120], ['5 → ???', 80, 260], ['age? NO', 560, 260], ['height? NO', 90, 400], ['luck??', 600, 400]].forEach(([tx, x, y]) => b.fillText(tx, x, y));
    b.fillStyle = '#d62828'; b.font = '120px "Patrick Hand"'; b.fillText('???', 400, 520);
    b.strokeStyle = '#d62828'; b.lineWidth = 6; b.beginPath(); b.moveTo(540, 240); b.lineTo(760, 285); b.moveTo(80, 380); b.lineTo(330, 420); b.stroke();
    const bt = new THREE.CanvasTexture(board); bt.colorSpace = THREE.SRGBColorSpace;
    part(sc, [11, 6, 0.2], [0, 6.2, -7.6], plastic(0xffffff, { map: bt }), { cast: false });
    part(sc, [11.4, 6.4, 0.15], [0, 6.2, -7.72], plastic('#9aa3ad'), { cast: false });
    // bench + glowing beakers
    part(sc, [9, 0.4, 3], [0, 3.0, -3.6], plastic('#2d3e50')); part(sc, [8.6, 2.8, 2.6], [0, 1.4, -3.6], plastic('#e9ecef'));
    const cols = ['#39ff88', '#3fd0ff', '#ff4fd8', '#ffe14a'];
    for (let i = 0; i < 4; i++) {
      cylinder(sc, 0.38, 1.0, [-3 + i * 2, 3.7, -3.5], new THREE.MeshPhongMaterial({ color: '#dff4ff', transparent: true, opacity: 0.35, shininess: 100 }));
      cylinder(sc, 0.33, 0.6, [-3 + i * 2, 3.5, -3.5], neon(cols[i], 1.4));
    }
    const a = s.add(CAST.scientist({ number: '6,108,330' }), -2.6, 0, -0.6, 0.35);
    const b2 = s.add(CAST.scientist({ number: '41,977', seed: 73, hair: 'curly', hairColor: '#5a3825', skin: '#8d5a3b', face: { glasses: true } }), 2.8, 0, -0.2, -0.4);
    sc.add(new THREE.HemisphereLight(0xffffff, 0x8a8f99, 1.35));
    const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(6, 16, 12); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12 }); key.shadow.bias = -0.0005; key.shadow.normalBias = 0.04; sc.add(key);
    s.cam = { path: [[V(-3.6, 5.4, 13.8), V(-0.3, 5.3, -2)], [V(1.6, 5.6, 12.6), V(0.4, 5.4, -2)]], ease: 'inout' };
    s.update = (lt) => {
      resetPose(a); resetPose(b2); idle(a, lt); idle(b2, lt);
      a.armR.rotation.set(-2.75, 0, 0.55 + 0.1 * Math.sin(lt * 10)); a.face.set({ expr: 'worried' });
      const sh = 0.5 + 0.5 * Math.sin(lt * 5);
      b2.armL.rotation.set(-0.5, 0, -1.1 - 0.2 * sh); b2.armR.rotation.set(-0.5, 0, 1.1 + 0.2 * sh); b2.face.set({ expr: 'worried' });
      b2.headPivot.rotation.z = 0.12 * Math.sin(lt * 5);
    };
    return s;
  },

  // 3. And you can see everyone's number... except your own.
  yard(ctx) {
    const s = new Shot(ctx);
    const sc = s.scene;
    sky(sc, {}); sc.fog = new THREE.Fog('#c6dff4', 170, 700);
    ground(sc, M.grass([60, 60]), 600);
    house(sc, 0, -16, { col: '#9fc3e6', w: 18, d: 12 });
    house(sc, -26, -18, { col: '#f2e3c6' }); house(sc, 26, -18, { col: '#c9e2b8' });
    tree(sc, -10, -8, 1.2, 4); tree(sc, 11, -9, 1.1, 5);
    fence(sc, -16, -9, -4); fence(sc, 9, 16, -4);
    part(sc, [3.2, 0.2, 14], [0, 0.1, -4], M.concrete([1, 3]), { cast: false });
    mailbox(sc, 6.5, 6, -0.3);
    lights(sc, { target: [0, 0, -2], area: 22 });
    const mom = s.add(CAST.mom(), -3.2, 0, -0.8, 0.45);
    const ellie = s.add(CAST.ellie(), 3.3, 0, -0.3, -0.5);
    const leo = s.add(CAST.leo(), 0, 0, 1.2);
    const stop = ctx.word(0, 6).s; // "except"
    s.cam = { path: [[V(0.2, 4.6, 17.5), V(0, 4.4, 0)], [V(0.4, 4.3, 11.2), V(0, 4.9, 0)]], ease: 'inout' };
    s.update = (lt) => {
      for (const c of [mom, ellie, leo]) { resetPose(c); idle(c, lt); }
      mom.face.set({ expr: 'smile' });
      ellie.face.set({ expr: 'happy' }); ellie.armL.rotation.x = -0.4 * Math.abs(Math.sin(lt * 6));
      if (lt < stop) {
        const ph = (lt % 0.9) / 0.9;
        const air = ph < 0.78;
        leo.group.position.y = air ? 2.6 * Math.sin(Math.PI * ph / 0.78) : 0;
        if (air) jumpPose(leo);
        leo.group.rotation.y = lt * 3.2;
        leo.headPivot.rotation.x = -0.45;
        leo.face.set({ expr: 'determined' });
      } else {
        const k = smooth(stop, stop + 0.4, lt);
        leo.group.position.y = 0;
        leo.group.rotation.y = lerp(stop * 3.2 % (Math.PI * 2), Math.PI * 2, k);
        leo.headPivot.rotation.x = -0.55;
        leo.armL.rotation.set(-0.4, 0, -0.9 * k); leo.armR.rotation.set(-0.4, 0, 0.9 * k);   // shrug
        leo.face.set({ expr: 'worried' });
      }
    };
    return s;
  },

  // 4. Leo wrote down every number he ever saw. His little sister, Ellie, was twenty-one.
  desk(ctx) {
    const s = new Shot(ctx);
    const r = leoRoom(s);
    const leo = s.add(CAST.leo(), 2.4, 0.78, -3.2, Math.PI);
    const ellie = s.add(CAST.ellie(), -4.8, 0, 4.5, -2.6);
    const w0 = ctx.word(1, 3).s, w1 = ctx.word(1, 5).e;  // "Ellie," → "twenty-one."
    s.cam = { path: [[V(6.4, 7.0, 1.8), V(2.2, 3.3, -4.4)], [V(3.4, 6.4, -2.2), V(2.4, 2.9, -4.8)], [V(2.72, 6.75, -4.45), V(2.72, 2.75, -5.0)]], ease: 'inout' };
    s.update = (lt) => {
      resetPose(leo); resetPose(ellie); idle(ellie, lt);
      sit(leo);
      leo.armR.rotation.set(-1.45 + 0.06 * Math.sin(lt * 14), 0, 0.12); leo.armL.rotation.set(-0.15, 0, -0.05);   // free arm down so the 21 stays readable
      leo.headPivot.rotation.x = 0.35;
      ellie.face.set({ expr: 'smile' });
      r.notebook.set({ rows: 7, write: smooth(w0, w1 + 0.2, lt) });
    };
    return s;
  },

  // 5. So Leo made Ellie a promise. "You'll never go anywhere alone. I'll always go first."
  walk(ctx) {
    const s = new Shot(ctx);
    suburb(s, { zSpan: [80, -200] });
    lights(s.scene, { target: [10, 0, 0], area: 30, sun: [30, 55, 45] });
    const leo = s.add(CAST.leo(), 9.0, 0.5, -8);
    const ellie = s.add(CAST.ellie(), 10.9, 0.5, -8);
    s.speakers = { LEO: leo };
    const speed = 3.2, z0 = -9;
    const L = ctx.lines;
    s.cam = { path: [[V(9.6, 4.6, z0 + 7.6), V(10.0, 3.6, z0)], [V(9.4, 4.0, z0 + speed * ctx.dur + 5.8), V(9.9, 3.5, z0 + speed * ctx.dur)]], ease: 'linear' };
    s.update = (lt) => {
      for (const c of [leo, ellie]) { resetPose(c); walk(c, lt, 0.72); c.group.position.z = z0 + speed * lt; }
      holdHand(leo, 'R'); holdHand(ellie, 'L');
      leo.armR.rotation.x = -0.3; ellie.armL.rotation.x = -0.3;
      leo.headPivot.rotation.y = lt > L[1].ls ? 0.4 : 0.15;
      ellie.headPivot.rotation.y = lt > L[1].ls ? -0.35 : -0.1;
      leo.face.set({ expr: 'smile' });
      ellie.face.set({ expr: lt > L[1].le - 0.4 ? 'happy' : 'worried' });
    };
    return s;
  },

  // 6. Then people started disappearing. The mailman. The bus driver. The crossing guard.
  street(ctx) {
    const s = new Shot(ctx);
    suburb(s, { zSpan: [80, -200], nearSide: false });
    lights(s.scene, { target: [0, 0, 0], area: 32, sun: [-30, 55, 40] });
    // crosswalk
    for (let i = 0; i < 7; i++) part(s.scene, [1.2, 0.22, 4], [-6 + i * 2, 0.11, -8], plastic('#f4f4f4'), { cast: false });
    mailbox(s.scene, 9.4, 10.6, Math.PI / 2);
    const mail = s.add(CAST.mailman(), 9.2, 0.5, 8.2, Math.PI / 2);
    const letter = part(s.scene, [0.1, 0.7, 1.0], [0, 0, 0], plastic('#ffffff'));
    const bus = schoolBus(s.scene, -3.2, 26, Math.PI);
    const driver = CAST.driver(); bus.add(driver.group); driver.group.position.set(-1.6, 1.0, 8.4); s.chars.push(driver);
    driver.tag.position.y = 7.6;
    const guard = s.add(CAST.guard(), 3.0, 0, -8.0, Math.PI / 2);
    const sign = stopSign(); s.scene.add(sign);
    const c1 = ctx.cue('despawn', 0), c2 = ctx.cue('despawn', 1), c3 = ctx.cue('despawn', 2);
    const busZ = (lt) => 26 - 6.2 * lt;   // bus drives toward screen-right (−z)
    s.cam = {
      keys: [
        { t: 0, pos: V(17.5, 6.4, 15.5), look: V(7, 4.8, 7.5) },
        { t: c1, pos: V(17.0, 6.0, 8.6), look: V(9.2, 5.1, 8.2) },
        { t: c2, pos: V(15, 5.2, 0.5), look: V(-3, 4.8, busZ(c2) - 9) },
        { t: c3, pos: V(15, 5.0, -7.2), look: V(3, 4.2, -8.0) },
        { t: ctx.dur, pos: V(15, 5.2, -10), look: V(3, 3.4, -8.5) },
      ],
    };
    s.update = (lt) => {
      for (const c of [mail, driver, guard]) { resetPose(c); idle(c, lt); }
      // mailman holds out a letter, then is gone; the letter falls
      mail.armR.rotation.x = -1.3; mail.face.set({ expr: 'smile' });
      const f1 = clamp((lt - c1 - 0.25) / 0.6);
      letter.position.set(11.2, lerp(3.9, 0.85, f1 * f1), 6.9);
      letter.rotation.set(f1 * 1.4, 0, 0);
      despawn(mail, clamp((lt - c1) / 1.1));
      // the bus keeps rolling after its driver vanishes
      bus.position.z = busZ(lt);
      sit(driver); driver.armL.rotation.x = -1.3; driver.armR.rotation.x = -1.3; driver.face.set({ expr: 'neutral' });
      despawn(driver, clamp((lt - c2) / 1.1));
      // crossing guard: stop sign drops when she goes
      guard.armR.rotation.x = -1.45; guard.face.set({ expr: 'smile' });
      const f3 = clamp((lt - c3 - 0.2) / 0.5);
      sign.position.set(5.0, lerp(1.2, 0.15, f3 * f3), -9.5);
      sign.rotation.set(0, Math.PI / 2, -1.45 * f3);
      despawn(guard, clamp((lt - c3) / 1.1));
    };
    return s;
  },

  // 7. Leo checked his notebook. Seventeen. Eighteen. Nineteen. They were disappearing in order. And after nineteen... came Ellie.
  notebook(ctx) {
    const s = new Shot(ctx);
    const r = leoRoom(s, { night: true });
    const leo = s.add(CAST.leoPJ(), 2.4, 0.78, -3.2, Math.PI);
    s.vignette = 0.55;
    const strikes = [0, 1, 2].map(i => ctx.cue('scribble', i));
    const circ = ctx.cue('circle');
    s.cam = { path: [[V(6.8, 4.6, -6.0), V(2.4, 3.8, -3.4)], [V(4.6, 6.6, -3.2), V(2.5, 2.9, -4.8)], [V(2.72, 6.75, -4.45), V(2.72, 2.75, -5.0)]], ease: 'inout' };
    s.update = (lt) => {
      resetPose(leo); sit(leo);
      leo.armR.rotation.set(-1.45, 0, 0.1); leo.armL.rotation.set(-0.15, 0, -0.05);
      leo.headPivot.rotation.x = 0.3;
      leo.face.set({ expr: lt > strikes[2] + 0.5 ? 'scared' : 'worried' });
      r.notebook.set({ rows: 7, write: 1, strikes: strikes.map(t0 => smooth(t0, t0 + 0.35, lt)), circle: smooth(circ - 0.15, circ + 0.45, lt) });
    };
    return s;
  },

  // 8. That night, Leo held her hand and didn't sleep. "Leo? Why is your number twenty?" ... Leo had never seen his own number. He was next.
  vigil(ctx) {
    const s = new Shot(ctx);
    const r = ellieRoom(s, { night: true });
    const bx = -3.2;
    const ellie = s.add(CAST.elliePJ({ number: null }), bx, 2.34, -1.1); ellie.group.rotation.x = -Math.PI / 2;
    const tag21 = numberTag('21'); tag21.position.set(bx, 4.35, -4.6); s.scene.add(tag21);
    part(s.scene, [4.7, 0.5, 2.8], [bx, 2.55, -2.0], plastic('#ff8fc2'), { cast: true });
    part(s.scene, [1.4, 1.4, 1.4], [bx + 1.6, 0.7, 0.9], M.wood([1, 1], '#f2e6da'));         // stool
    const leo = s.add(CAST.leoPJ(), bx + 3.3, 0.7, -2.6, -Math.PI / 2);
    const fill = new THREE.PointLight('#ffd9b0', 16, 9, 1.4); fill.position.set(bx + 1.2, 4.6, -2.4); s.scene.add(fill);
    const rim = new THREE.PointLight('#8fb0ff', 10, 10, 1.4); rim.position.set(bx + 5.5, 6.5, -4.5); s.scene.add(rim);
    s.speakers = { ELLIE: ellie };
    s.bubbleLift = 0.3;
    s.vignette = 0.6;
    const rev = ctx.cue('reveal');
    const tag20 = addTag(leo, '20', { glow: 'rgba(255,40,40,0.95)' });
    const L = ctx.lines;
    s.cam = { path: [[V(bx + 6.5, 6.6, 6.5), V(bx + 1.2, 2.6, -2.8)], [V(bx + 1.4, 5.4, 1.2), V(bx + 2.4, 3.4, -3.0)], [V(bx + 0.4, 3.5, -2.65), V(bx + 3.3, 4.3, -2.6)]], ease: 'inout' };
    s.update = (lt) => {
      resetPose(ellie); resetPose(leo); idle(leo, lt, 0.4);
      ellie.face.set({ expr: lt > L[1].ls ? 'worried' : 'smile', look: lt > L[1].ls ? -0.6 : 0 });
      ellie.headPivot.rotation.y = 0.4;
      sit(leo);
      leo.armL.rotation.set(-1.15, 0, 0.1);   // hand resting on the bed, holding hers
      leo.armR.rotation.set(-0.3, 0, 0.05);
      leo.face.set({ expr: lt > L[3].ls ? 'sad' : lt > rev ? 'shock' : 'smile' });
      leo.headPivot.rotation.x = lt > rev + 0.4 ? -0.35 * smooth(rev + 0.4, rev + 1.4, lt) : 0;
      // the number appears for the first time
      const k = clamp((lt - rev) / 0.5);
      tag20.visible = lt >= rev;
      const bounce = k < 1 ? Math.sin(k * Math.PI * 0.85) * 1.25 : 1;
      tag20.scale.set(0.6 * (tag20.material.map.image.width / tag20.material.map.image.height) * Math.max(0.05, bounce), 0.6 * Math.max(0.05, bounce), 1);
    };
    return s;
  },

  // 9. "Don't go!" "Hey. I promised. I always go first."
  goodbye(ctx) {
    const s = new Shot(ctx);
    ellieRoom(s, { morning: true });
    const ellie = s.add(CAST.elliePJ(), -1.4, 1.42, -1.2, Math.PI / 2);
    const leo = s.add(CAST.leoPJ(), 2.6, 0, -1.2, -Math.PI / 2);
    addTag(leo, '20', { glow: 'rgba(255,40,40,0.8)' });
    s.speakers = { ELLIE: ellie, LEO: leo };
    const d0 = ctx.cue('despawn');
    const L = ctx.lines;
    s.cam = { path: [[V(0.4, 4.7, 7.4), V(0.5, 3.4, -1.2)], [V(3.6, 4.2, 3.6), V(-1.0, 3.1, -1.2)]], ease: 'inout' };
    s.update = (lt) => {
      resetPose(ellie); resetPose(leo); idle(leo, lt);
      sit(ellie);
      ellie.armL.rotation.set(-1.4, 0, 0.15); ellie.armR.rotation.set(-1.4, 0, -0.15);   // reaching for him
      ellie.face.set({ expr: 'cry', tear: clamp(lt / 1.5) });
      leo.face.set({ expr: lt > L[1].ls ? 'smile' : 'sad' });
      leo.armL.rotation.set(-0.9 * smooth(L[1].ls, L[1].ls + 0.5, lt), 0, 0.2);
      despawn(leo, clamp((lt - d0) / 1.3));
    };
    return s;
  },

  // 10. The next morning, it was Ellie's turn.
  turn(ctx) {
    const s = new Shot(ctx);
    ellieRoom(s, { morning: true });
    const ellie = s.add(CAST.elliePJ(), -1.4, 1.42, -1.6, 0.5);
    const plush = new THREE.Group(); s.scene.add(plush);
    part(plush, [0.9, 1.0, 0.7], [0, 0, 0], plastic('#2f7de1')); part(plush, [0.7, 0.6, 0.6], [0, 0.8, 0], plastic('#2f7de1'));
    const d0 = ctx.cue('despawn');
    s.cam = { path: [[V(2.6, 4.0, 6.6), V(-1.2, 2.9, -1.6)], [V(0.6, 3.3, 3.0), V(-1.3, 3.1, -1.6)]], ease: 'inout' };
    s.update = (lt) => {
      resetPose(ellie); idle(ellie, lt, 0.5); sit(ellie);
      ellie.armL.rotation.set(-1.2, 0, 0.35); ellie.armR.rotation.set(-1.2, 0, -0.35);   // hugging the plush
      ellie.face.set({ expr: lt > 1.0 ? 'bliss' : 'sad' });
      ellie.group.updateMatrixWorld(true);
      const hp = new THREE.Vector3(); ellie.torso.localToWorld(hp.set(0, -0.2, 1.4));
      const f = clamp((lt - d0 - 0.3) / 0.45);
      plush.position.set(hp.x, lt < d0 + 0.3 ? hp.y : lerp(hp.y, 2.5, f * f), hp.z);
      plush.rotation.set(f * 0.4, 0.5, f * 1.2);
      despawn(ellie, clamp((lt - d0) / 1.2));
    };
    return s;
  },

  // 11. (spawn) And somebody was waiting. "Told you. You'll never go anywhere alone."
  spawn(ctx) {
    const s = new Shot(ctx);
    const sc = s.scene;
    sky(sc, { bright: true });
    sc.fog = new THREE.Fog('#e4f1ff', 80, 420);
    ground(sc, M.baseplate([64, 64]), 512);
    spawnPad(sc, 0, 0);
    lights(sc, { target: [0, 0, 0], area: 24, sun: [25, 60, 35], hemi: 1.7, intensity: 2.4 });
    const ellie = s.add(CAST.ellie({ number: null }), 0, 1.0, 0, 0);
    const leo = s.add(CAST.leo(), 9, 0, 0.4, -Math.PI / 2);
    s.speakers = { LEO: leo };
    // Roblox ForceField shimmer
    const ff = new THREE.Mesh(new THREE.SphereGeometry(2.3, 32, 16), new THREE.MeshBasicMaterial({ color: '#9fd8ff', transparent: true, opacity: 0.0, depthWrite: false, blending: THREE.AdditiveBlending }));
    ff.position.set(0, 3.2, 0); sc.add(ff);
    const sparks = sparkleField(sc, 40, [0, 3.2, 0], [4.2, 4.6, 4.2], 7, '#cfefff', [0.12, 0.35]);
    const L = ctx.lines;
    const walkEnd = L[1].ls - 0.1;
    s.cam = { path: [[V(0.5, 22, 17), V(0, 2.4, 0)], [V(-2.0, 7.5, 12), V(0.8, 3.0, 0)], [V(-2.6, 4.1, 8.4), V(1.1, 3.4, 0.2)]], ease: 'inout' };
    s.update = (lt) => {
      resetPose(ellie); resetPose(leo); idle(ellie, lt); idle(leo, lt);
      spawnIn(ellie, clamp(lt / 1.0));
      const ffk = 1 - smooth(1.2, 2.6, lt);
      ff.material.opacity = 0.18 * ffk * (0.7 + 0.3 * Math.sin(lt * 12)); ff.rotation.y = lt;
      sparks.forEach(p => { const u = p.userData; p.position.y = u.base.y + Math.sin(lt * 3 * u.sp + u.ph) * 0.4; p.material.opacity = 0.8 * ffk; });
      // Ellie looks around, then turns to Leo
      const turn = smooth(L[0].le, L[0].le + 0.6, lt);
      ellie.group.rotation.y = lerp(0.6 * Math.sin(lt * 2.2), Math.PI / 2, turn);
      ellie.face.set({ expr: lt > L[1].ls ? 'happy' : lt > L[0].ls ? 'shock' : 'scared' });
      // Leo walks in from the right
      const wk = clamp(lt / walkEnd);
      leo.group.position.x = lerp(11, 2.6, smooth(0, 1, wk));
      if (wk < 1) walk(leo, lt, 0.8);
      leo.face.set({ expr: 'happy' });
      if (lt > L[1].le - 0.3) { const h = smooth(L[1].le - 0.3, L[1].le + 0.3, lt); hug(leo, h); hug(ellie, h); leo.group.position.x = lerp(2.6, 2.0, h); }
    };
    return s;
  },

  // 12. Now Ellie knows what the numbers mean. It's the order we leave in... so nobody ever arrives alone.
  ending(ctx) {
    const s = new Shot(ctx);
    const sc = s.scene;
    sky(sc, { bright: true });
    sc.fog = new THREE.Fog('#e4f1ff', 70, 380);
    ground(sc, M.baseplate([64, 64]), 512);
    spawnPad(sc, 0, 4);
    lights(sc, { target: [0, 0, -8], area: 30, sun: [25, 60, 35], hemi: 1.7, intensity: 2.4 });
    const leo = s.add(CAST.leo(), -1.0, 0, 2.5, Math.PI);
    const ellie = s.add(CAST.ellie({ number: null }), 0.9, 0, 2.5, Math.PI);
    const mail = s.add(CAST.mailman({ number: null }), -4.5, 0, -12, 0.15);
    const driver = s.add(CAST.driver({ number: null }), 0.2, 0, -13.5, 0);
    const guard = s.add(CAST.guard({ number: null }), 4.6, 0, -12, -0.15);
    const crowd = [0, 1, 2, 3, 4, 5].map(i => s.add(CAST.townie(20 + i, null), -12 + i * 4.8, 0, -24 - (i % 2) * 3, 0));
    s.cam = { path: [[V(0.2, 4.0, 9.0), V(0, 3.4, -2)], [V(0.6, 8.0, 18), V(0, 2.4, -8)], [V(0.8, 16, 34), V(0, 1.5, -14)]], ease: 'inout' };
    s.update = (lt) => {
      for (const c of s.chars) { resetPose(c); idle(c, lt); }
      for (const c of [leo, ellie]) { walk(c, lt, 0.7); c.group.position.z = 2.5 - lt * 2.2; }
      holdHand(leo, 'L'); holdHand(ellie, 'R');
      for (const [i, c] of [mail, driver, guard].entries()) { wave(c, lt + i * 0.4, i === 2 ? 'L' : 'R'); c.face.set({ expr: 'happy' }); }
      crowd.forEach((c, i) => { if (i % 2 === 0) wave(c, lt + i); c.face.set({ expr: 'smile' }); });
      leo.face.set({ expr: 'happy' }); ellie.face.set({ expr: 'happy' });
    };
    return s;
  },
};
