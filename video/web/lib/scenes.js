// The 12 shots of CRACKS. Each shot: build once, then update(lt) is a pure function of local time.
// Every shot has exactly one camera move (shot.cam), evaluated by main.js across the shot's duration.
import * as THREE from 'three';
import {
  makeCharacter, resetPose, idle, talk, walk, crossArms, hipHands, point, sit, smooth, clamp, lerp, mat,
} from './char.js';
import {
  box, cyl, skyGradient, lights, tex, text, ground, house, tree, lamp, cloud, car, fence, room, windowPane,
  table, chair, plate, fridge, counterRun, pendant, bokeh, canvasTex, emissive, rng,
} from './env.js';

// ---------------------------------------------------------------- cast (same look in every shot)

const CAST = {
  lily: () => makeCharacter({ skin: '#f6d2b0', shirt: '#2ec4b6', shirtKind: 'hoodie', shirtAccent: '#ffd166', pants: '#3d405b', shoes: '#ffffff', hair: 'ponytail', hairColor: '#5b3a29', scale: 0.75, seed: 11, faceOpts: { blush: true, lashes: true } }),
  lilyPJ: () => makeCharacter({ skin: '#f6d2b0', shirt: '#8fb3ea', shirtKind: 'pajama', shirtAccent: '#ffffff', pants: '#8fb3ea', hair: 'ponytail', hairColor: '#5b3a29', scale: 0.75, seed: 11, faceOpts: { blush: true, lashes: true } }),
  mom: () => makeCharacter({ skin: '#f0c7a2', shirt: '#c25b72', shirtKind: 'apron', shirtAccent: '#f4efe6', pants: '#3b3f5c', shoes: '#2a2a30', hair: 'bun', hairColor: '#4a3125', seed: 23, faceOpts: { lashes: true } }),
  dad: () => makeCharacter({ skin: '#d9a47c', shirt: '#4d7c5a', pants: '#2f3542', shoes: '#1e1e22', hair: 'short', hairColor: '#2a1d16', seed: 31 }),
  kid: () => makeCharacter({ skin: '#e8b48a', shirt: '#ff8c42', shirtKind: 'stripe', shirtAccent: '#ffd8b0', pants: '#3a6fb0', shoes: '#ffffff', hair: 'spiky', hairColor: '#3b2a20', scale: 0.72, seed: 41, faceOpts: { blush: true } }),
  landlord: () => makeCharacter({ skin: '#e2b08a', shirt: '#f2f2f2', shirtKind: 'vest', shirtAccent: '#4b3a2a', pants: '#3c3c44', shoes: '#1e1e22', hair: 'bald', hairColor: '#8a8a8a', seed: 53, faceOpts: { glasses: true } }),
  clerk: () => makeCharacter({ skin: '#a8714f', shirt: '#2f9e5b', shirtKind: 'apron', shirtAccent: '#e6f2e9', pants: '#2b2f3a', hair: 'cap', hairColor: '#d04a3a', seed: 61 }),
  doctor: () => makeCharacter({ skin: '#c98e6a', shirt: '#ffffff', shirtKind: 'coat', shirtAccent: '#7fb7d6', pants: '#7fb7d6', shoes: '#ffffff', hair: 'short', hairColor: '#1d1d1d', seed: 71, faceOpts: { glasses: true } }),
  politician: () => makeCharacter({ skin: '#f0c7a2', shirt: '#1f2a44', shirtKind: 'suit', shirtAccent: '#c0392b', pants: '#1f2a44', shoes: '#111', hair: 'none', seed: 83, faceOpts: { mask: true } }),
  townie: (i) => {
    const R = rng(100 + i);
    const shirts = ['#e74c3c', '#9b59b6', '#f1c40f', '#1abc9c', '#e67e22', '#34495e', '#ff6fa8', '#5dade2'];
    const hairs = ['short', 'long', 'curly', 'spiky', 'bun', 'cap', 'ponytail'];
    const skins = ['#f2c9a0', '#d9a47c', '#a8714f', '#7a4e33', '#f6d2b0'];
    return makeCharacter({ skin: skins[Math.floor(R() * skins.length)], shirt: shirts[i % shirts.length], pants: ['#2c3e50', '#3a6fb0', '#555', '#6d4c41'][i % 4], hair: hairs[i % hairs.length], hairColor: ['#2a1d16', '#5b3a29', '#c49a63', '#111', '#8a3b1f'][i % 5], seed: 200 + i, scale: R() < 0.3 ? 0.75 : 1, faceOpts: { lashes: i % 2 === 0 } });
  },
};

const faceTo = (ch, x, z) => { const p = ch.group.position; ch.group.rotation.y = Math.atan2(x - p.x, z - p.z); };
const place = (scene, ch, x, y, z, ry = 0) => { ch.group.position.set(x, y, z); ch.group.rotation.y = ry; scene.add(ch.group); return ch; };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const headPos = (ch) => { const v = new THREE.Vector3(); ch.head.getWorldPosition(v); return v; };

// crack state helper: base count, +1 at cue time with a quick grow
function crackAt(face, base, lt, cueT, extra = {}) {
  if (lt >= cueT) face.set({ cracks: base + 1, grow: smooth(cueT, cueT + 0.22, lt), ...extra });
  else face.set({ cracks: base, grow: 1, ...extra });
}

class Shot {
  constructor(ctx) {
    this.ctx = ctx;
    this.scene = new THREE.Scene();
    this.chars = [];
    this.speakers = {};
    this.cam = null;
    this.vignette = 0.35;
    this.anchors = {};
  }
  add(ch, x, y, z, ry = 0) { place(this.scene, ch, x, y, z, ry); this.chars.push(ch); return ch; }
}

// ---------------------------------------------------------------- shared sets

function sunnyStreet(s, { houses = true } = {}) {
  const sc = s.scene;
  skyGradient(sc, '#3f8fe0', '#d4ecff', '#8cc4f5');
  sc.fog = new THREE.Fog('#cfe7ff', 80, 220);
  lights(sc, { dir: [30, 50, 35], area: 34, hemi: 1.5, sun: 2.8 });
  ground(sc, null, 700, tex.grass());
  box(sc, 9, 0.1, 300, null, 0, 0.05, -100, { material: mat(0xffffff, { map: tex.asphalt() }), cast: false });
  for (let z = 30; z > -240; z -= 7) box(sc, 0.3, 0.12, 3, '#f2d14b', 0, 0.06, z, { cast: false });
  for (const sx of [-1, 1]) box(sc, 3, 0.3, 300, '#d9d4c7', sx * 6, 0.15, -100, { cast: false });
  if (houses) {
    const cols = ['#e8d8b0', '#9ec5e8', '#f2b5a0', '#b8d8a8', '#f0e6d2', '#d7b8e8', '#ffd59e'];
    const roofs = ['#7a3b2e', '#4a4f5a', '#8a5a3a', '#5a3d6b'];
    for (let i = 0; i < 9; i++) {
      const z = 10 - i * 18;
      house(sc, -16, z, { color: cols[i % 7], roof: roofs[i % 4], face: 'L', w: 11, d: 9 });
      house(sc, 16, z - 8, { color: cols[(i + 3) % 7], roof: roofs[(i + 1) % 4], face: 'R', w: 11, d: 9 });
      tree(sc, -10.5, z - 9, 1.1, i * 3 + 1);
      tree(sc, 10.5, z - 2, 1.0, i * 3 + 2);
      lamp(sc, -7.9, z - 4); lamp(sc, 7.9, z - 12);
    }
  }
  for (let i = 0; i < 7; i++) cloud(sc, -60 + i * 22, 48 + (i % 3) * 6, -90 - (i % 2) * 40, 1.4, i + 1);
}

function kitchen(s, { night = true, pendantOn = true, warm = 1, chairs = true } = {}) {
  const sc = s.scene;
  sc.background = new THREE.Color(night ? '#0b1026' : '#bfe3ff');
  const r = room(sc, { w: 12, d: 12, h: 8, wallTex: tex.wallpaper('#f3dca5', '#ecd093'), floorTex: tex.checker('#c94f4f', '#f6efe1', 8, [3, 3]) });
  // counters along the back wall + upper cabinets
  counterRun(sc, 1.6, -5, 7.6, { color: '#e9e4d8', top: '#5b5f68', ry: 0 });
  for (let i = 0; i < 4; i++) box(sc, 1.8, 2.2, 1.2, '#e9e4d8', -1.1 + i * 1.9, 6.3, -5.3, { round: 0.06 });
  // stove
  box(sc, 2, 0.12, 1.6, '#2d2f36', 3.6, 2.82, -4.9);
  cyl(sc, 0.45, 0.6, '#8a8f99', 3.6, 3.15, -4.9);
  windowPane(sc, 1.2, 4.6, -5.75, 3, 2.2, { night });
  const fr = fridge(sc, -3.9, -4.4, {});
  cyl(sc, 0.6, 0.12, '#ffffff', 5.75, 5.6, -1, { rz: Math.PI / 2 });  // wall clock
  const tb = table(sc, 0, 0.5, { w: 4.6, d: 3, h: 2.35, color: '#b07a45' });
  if (chairs) { chair(sc, -2.9, 0.5, Math.PI / 2); chair(sc, 2.9, 0.5, -Math.PI / 2); }
  const hemi = new THREE.HemisphereLight(night ? 0x8090c0 : 0xfff2dc, 0x5a4030, night ? 0.55 * warm : 1.2);
  sc.add(hemi);
  const key = new THREE.DirectionalLight(night ? 0x9fb4ff : 0xfff2dc, night ? 0.55 : 1.8);
  key.position.set(-4, 14, 10); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 50 });
  key.shadow.bias = -0.0005; key.shadow.normalBias = 0.03;
  sc.add(key);
  let pd = null;
  if (pendantOn) pd = pendant(sc, 0, 7.6, 0.5, '#ffcf8a', 28 * warm, 22);
  return { fridge: fr, table: tb, hemi, key, pendant: pd };
}

// ---------------------------------------------------------------- shots

export const SCENES = {
  // 1. In this world, every lie you tell cracks your face.
  town(ctx) {
    const s = new Shot(ctx);
    sunnyStreet(s);
    const guy = s.add(CAST.townie(1), -7.4, 0.3, 5.4, 0.45);
    const gal = s.add(CAST.townie(2), -5.0, 0.3, 4.9, -0.35);
    guy.face.set({ expr: 'happy', cracks: 2 });
    gal.face.set({ expr: 'smile', cracks: 1 });
    const walkers = [3, 4, 5, 6].map((i, k) => s.add(CAST.townie(i), k % 2 ? 6 : -6, 0.3, -10 - k * 12, k % 2 ? 0 : Math.PI));
    walkers.forEach((w, k) => w.face.set({ expr: 'smile', cracks: k % 3 }));
    car(s.scene, 3, -14, '#d84a3a');
    car(s.scene, -3, -46, '#3a7bd5', Math.PI);
    s.cam = { path: [[V(-2, 40, 42), V(-2, 0, -30)], [V(-4.4, 5.6, 14.8), V(-6.0, 4.7, 5.0)]], ease: 'inout' };
    s.update = (lt) => {
      for (const c of s.chars) { resetPose(c); idle(c, lt); }
      walkers.forEach((w, k) => { walk(w, lt); w.group.position.z = -10 - k * 12 + (k % 2 ? -1 : 1) * lt * 2.4; });
      talk(guy, lt, 0.6);
      guy.headPivot.rotation.y = -0.35; gal.headPivot.rotation.y = 0.3;
    };
    return s;
  },

  // 2. "Did you brush your teeth?" "Totally!" CRACK
  teeth(ctx) {
    const s = new Shot(ctx);
    sunnyStreet(s, { houses: false });
    house(s.scene, 0, -10, { color: '#9ec5e8', roof: '#4a4f5a', w: 14, d: 9 });
    house(s.scene, -18, -12, { color: '#f2b5a0', w: 11 });
    house(s.scene, 18, -12, { color: '#b8d8a8', w: 11 });
    tree(s.scene, -9, -3, 1.2, 4); tree(s.scene, 9, -4, 1.1, 5);
    fence(s.scene, -14, -8, -2); fence(s.scene, 8, 14, -2);
    box(s.scene, 0.25, 3, 0.25, '#555', 5.2, 1.5, 2.5); box(s.scene, 0.9, 0.8, 1.5, '#3a7bd5', 5.2, 3.2, 2.5, { round: 0.2 });
    const dad = s.add(CAST.dad(), -1.8, 0, -2.4);
    const kid = s.add(CAST.kid(), 1.5, 0, -0.6);
    faceTo(dad, 1.5, 0.6); kid.group.rotation.y = -0.45;
    box(kid.torso, 1.6, 1.8, 0.7, '#ffcc33', 0, 0, -0.75, { round: 0.2 }); // backpack
    s.speakers = { DAD: dad, KID: kid };
    const crackT = ctx.cue('crack');
    s.anchors.crack = () => headPos(kid);
    s.cam = { path: [[V(0.4, 4.6, 10.5), V(0, 3.5, -1.5)], [V(1.2, 3.5, 3.6), V(1.45, 3.3, -0.6)]], ease: 'out' };
    s.update = (lt) => {
      resetPose(dad); resetPose(kid); idle(dad, lt); idle(kid, lt);
      crossArms(dad);
      const kidLine = ctx.lines[1];
      dad.face.set({ expr: lt > crackT ? 'smirk' : 'neutral' });
      kid.face.set({ expr: lt > crackT + 0.05 ? 'shock' : lt > kidLine.ls - 0.15 ? 'grin' : 'neutral' });
      crackAt(kid.face, 0, lt, crackT);
      if (lt > kidLine.ls && lt < crackT) { kid.armR.rotation.set(-2.6, 0, 0.2); } // thumbs up
      if (lt > crackT) { kid.armL.rotation.set(-2.2, 0, -0.3); kid.headPivot.rotation.x = -0.1; } // hand to face
      kid.headPivot.rotation.y = lt < crackT ? -0.5 : -0.1;
    };
    return s;
  },

  // 3. (v1) Little lies, little cracks. Big lies? ...politician wears a mask. So nobody lies.
  plaza(ctx) {
    const s = new Shot(ctx);
    const sc = s.scene;
    skyGradient(sc, '#3f8fe0', '#d4ecff', '#8cc4f5');
    sc.fog = new THREE.Fog('#cfe7ff', 60, 180);
    lights(sc, { dir: [25, 45, 30], area: 26 });
    ground(sc, null, 400, tex.paving());
    box(sc, 12, 1, 5, '#8a5a3a', 0, 0.5, -6.5);
    const pod = box(sc, 2.4, 3, 1.4, '#f2f2f2', 0, 2.5, -4.9, { round: 0.1 });
    box(sc, 1.2, 1.2, 0.1, '#c0392b', 0, 3, -4.15);
    const banner = box(sc, 12, 2.4, 0.2, null, 0, 8.4, -8.5, { material: mat(0xffffff, { map: text('VOTE HONEST!', { w: 1024, h: 200, bg: '#1f3a93', fg: '#ffffff', size: 140 }) }) });
    for (const x of [-6.2, 6.2]) box(sc, 0.3, 9.6, 0.3, '#ddd', x, 4.8, -8.5);
    for (const [x, c] of [[-4.5, '#c0392b'], [4.5, '#2e86de']]) { box(sc, 0.15, 7, 0.15, '#999', x, 4.5, -7.5); box(sc, 1.8, 1.1, 0.05, c, x + 0.95, 7.3, -7.5); }
    house(sc, -18, -14, { color: '#f0e6d2', w: 12 }); house(sc, 18, -14, { color: '#d7b8e8', w: 12 });
    tree(sc, -11, -10, 1.2, 8); tree(sc, 11, -9, 1.2, 9);
    const pol = s.add(CAST.politician(), 0, 1, -5.9);
    const crowd = [];
    const spots = [[-3, 2.0], [-1, 2.6], [1.2, 2.2], [3.2, 2.8], [-2.2, 4.4], [0.4, 4.8], [2.6, 5.0]];
    spots.forEach(([x, z], i) => { const c = s.add(CAST.townie(10 + i), x, 0, z, Math.PI); c.face.set({ cracks: i % 3 }); crowd.push(c); });
    const mom1 = s.add(CAST.townie(20), -5.0, 0, 5.0, 0.35);
    const kid1 = s.add(CAST.townie(21), -3.6, 0, 5.6, -0.25);
    kid1.group.scale.setScalar(0.72);
    mom1.face.set({ expr: 'smile', cracks: 1 }); kid1.face.set({ expr: 'grin', cracks: 1 });
    s.cam = { path: [[V(-5.6, 4.2, 10.8), V(-4.4, 3.9, 5.0)], [V(-1.4, 7.4, 8.6), V(0, 5.6, -5.9)], [V(0.6, 8.8, 15.5), V(0, 5.0, -4)]], ease: 'inout' };
    s.update = (lt) => {
      for (const c of s.chars) { resetPose(c); idle(c, lt); }
      talk(pol, lt, 1);
      pol.armL.rotation.set(-0.6 - 0.3 * Math.sin(lt * 5), 0, -0.2);
      crowd.forEach((c, i) => { if (i % 3 === 0) c.armR.rotation.x = -2.6 - 0.2 * Math.sin(lt * 6 + i); });
    };
    return s;
  },

  // 4. Nobody except Lily's mom. Her face had more cracks than anyone in town. "Rent's coming Friday, I promise!"
  hallway(ctx) {
    const s = new Shot(ctx);
    const sc = s.scene;
    sc.background = new THREE.Color('#1a1410');
    room(sc, { w: 7, d: 12, h: 8, wallTex: tex.wallpaper('#e3d6b8', '#d6c6a2', [3, 2]), floorTex: tex.carpet('#7a2e3a', '#a8434f', [2, 6]) });
    for (const x of [-3.3, 3.3]) box(sc, 0.2, 2.6, 12, '#7b5a3c', x, 1.3, 0);
    box(sc, 7, 2.6, 0.2, '#7b5a3c', 0, 1.3, -5.7);
    // side doors
    for (const [x, z, n] of [[-3.35, -1, '4A'], [-3.35, 3.5, '3B'], [3.35, 1.5, '4C']]) {
      box(sc, 0.15, 5, 2.6, '#6b3f26', x, 2.5, z);
      box(sc, 0.1, 0.5, 0.9, null, x + Math.sign(-x) * 0.1, 4.4, z, { material: mat(0xffffff, { map: text(n, { w: 128, h: 64, bg: '#d4af37', fg: '#222', size: 44 }) }) });
    }
    // mom's open doorway in the back wall
    box(sc, 2.6, 5.2, 0.1, '#0c0a08', 0, 2.6, -5.72, { cast: false });
    box(sc, 0.3, 5.4, 0.4, '#5a3520', -1.45, 2.7, -5.6); box(sc, 0.3, 5.4, 0.4, '#5a3520', 1.45, 2.7, -5.6); box(sc, 3.2, 0.3, 0.4, '#5a3520', 0, 5.35, -5.6);
    const door = new THREE.Group(); door.position.set(1.3, 0, -5.6); door.rotation.y = 1.2; sc.add(door);
    box(door, 2.5, 5.0, 0.2, '#6b3f26', -1.25, 2.5, 0);
    box(sc, 0.9, 0.5, 0.1, null, 0, 5.9, -5.65, { material: mat(0xffffff, { map: text('4B', { w: 128, h: 64, bg: '#d4af37', fg: '#222', size: 44 }) }) });
    for (const z of [-3, 1, 5]) { box(sc, 1.6, 0.1, 1.0, null, 0, 7.9, z, { material: emissive('#fff1cf', 1.6), cast: false }); }
    sc.add(new THREE.HemisphereLight(0xfff0d8, 0x5a3a2a, 0.9));
    const pl = new THREE.PointLight('#ffe2b0', 30, 20, 1.4); pl.position.set(0, 7.2, -1.5); sc.add(pl);
    const key = new THREE.DirectionalLight(0xffe8c8, 1.2); key.position.set(3, 12, 8); key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8 }); key.shadow.bias = -0.0005; sc.add(key);
    const mom = s.add(CAST.mom(), 0, 0, -4.3);
    const ll = s.add(CAST.landlord(), 1.7, 0, -1.2);
    faceTo(ll, 0, -4.3);
    const clip = box(ll.armL, 1.2, 1.5, 0.1, '#b9915e', 0, -1.9, 0.7, { rx: -0.6 });
    s.speakers = { MOM: mom };
    const crackT = ctx.cue('crack');
    s.anchors.crack = () => headPos(mom);
    s.cam = { path: [[V(-0.2, 4.7, -2.15), V(0, 4.64, -4.3)], [V(-1.5, 4.8, 0.4), V(0.1, 4.5, -3.9)], [V(-2.4, 5.0, 3.6), V(0.4, 4.1, -2.9)]], ease: 'inout' };
    s.update = (lt) => {
      resetPose(mom); resetPose(ll); idle(mom, lt); idle(ll, lt);
      crossArms(ll); ll.armL.rotation.set(-0.9, 0, -0.2);
      const momLine = ctx.lines[2];
      const speaking = lt > momLine.ls - 0.1 && lt < momLine.le;
      mom.face.set({ expr: lt > crackT ? 'worried' : speaking ? 'happy' : 'tired', look: speaking ? 0.4 : 0 });
      crackAt(mom.face, 12, lt, crackT);
      if (speaking) { talk(mom, lt, 1); mom.armL.rotation.set(-1.0, 0, -0.2); }
      mom.headPivot.rotation.y = speaking || lt > crackT ? 0.35 : 0;
      ll.face.set({ expr: 'determined' });
    };
    return s;
  },

  // 5. "I'll pay you back tomorrow." CRACK
  store(ctx) {
    const s = new Shot(ctx);
    const sc = s.scene;
    sc.background = new THREE.Color('#222');
    room(sc, { w: 14, d: 12, h: 8, wall: '#f7e7c4', floorTex: tex.tiles('#e9e6df', '#cfc9bd', [8, 8]), front: true });
    // shelves along the far (+z) wall
    const R = rng(77);
    const prods = ['#e74c3c', '#f1c40f', '#3498db', '#2ecc71', '#e67e22', '#9b59b6', '#ecf0f1', '#ff6fa8'];
    for (let sx = -5; sx <= 5; sx += 5) {
      box(sc, 4.4, 6, 1.2, '#c9b38a', sx, 3, 5.3);
      for (let row = 0; row < 4; row++) {
        box(sc, 4.4, 0.12, 1.3, '#a88f63', sx, 0.8 + row * 1.5, 4.9);
        for (let k = 0; k < 6; k++) box(sc, 0.55, 0.8 + R() * 0.4, 0.6, prods[Math.floor(R() * 8)], sx - 1.8 + k * 0.72, 1.3 + row * 1.5, 4.7, { round: 0.05 });
      }
    }
    box(sc, 6, 1.0, 0.1, null, 0, 7.0, 5.9, { material: mat(0xffffff, { map: text('CORNER MART', { w: 1024, h: 160, bg: '#c0392b', fg: '#fff', size: 120 }) }) });
    counterRun(sc, 0, 0, 7, { color: '#6c7a89', top: '#3b4048' });
    box(sc, 1.4, 1.0, 1.2, '#2d2f36', -1.8, 3.3, -0.2, { round: 0.1 });
    box(sc, 1.2, 0.6, 0.1, '#7ce07c', -1.8, 4.0, 0.3, { material: emissive('#58d058', 0.8) });
    sc.add(new THREE.HemisphereLight(0xfff8e8, 0x6b5a45, 1.2));
    const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(-6, 14, -8); key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9 }); key.shadow.bias = -0.0005; sc.add(key);
    const fill = new THREE.PointLight('#fff6e0', 30, 20, 1.4); fill.position.set(-2, 7, -2); sc.add(fill);
    const mom = s.add(CAST.mom(), 0.6, 0, 2.0);
    const clerk = s.add(CAST.clerk(), -0.9, 0, -1.9);
    faceTo(mom, -0.9, -1.9); faceTo(clerk, 0.6, 2.0);
    const bag = new THREE.Group(); bag.position.set(0, 3.0, 0.95); mom.body.add(bag);
    box(bag, 1.4, 1.5, 0.9, '#c8a46e', 0, 0, 0);
    box(bag, 0.5, 0.7, 0.5, '#f5deb3', -0.3, 0.95, 0, { round: 0.2 });
    box(bag, 0.4, 0.9, 0.4, '#ffffff', 0.3, 1.0, 0.05);
    s.speakers = { MOM: mom };
    const crackT = ctx.cue('crack');
    s.anchors.crack = () => headPos(mom);
    s.cam = { path: [[V(-3.6, 4.8, -3.8), V(0.6, 4.4, 2.0)], [V(-2.5, 4.75, -2.7), V(0.6, 4.55, 2.0)]], ease: 'inout' };
    s.update = (lt) => {
      resetPose(mom); resetPose(clerk); idle(mom, lt); idle(clerk, lt);
      mom.armL.rotation.set(-0.95, 0, 0.15); mom.armR.rotation.set(-0.95, 0, -0.15);
      hipHands(clerk);
      mom.face.set({ expr: lt > crackT ? 'worried' : 'happy' });
      crackAt(mom.face, 13, lt, crackT);
      clerk.face.set({ expr: 'determined' });
    };
    return s;
  },

  // 6. At school, they called Lily the liar's kid. So Lily swore she'd never tell a single lie.
  school(ctx) {
    const s = new Shot(ctx);
    const sc = s.scene;
    sc.background = new THREE.Color('#ddd');
    room(sc, { w: 10, d: 22, h: 8, wall: '#e9eef2', floorTex: tex.checker('#d8d2c2', '#f3efe6', 8, [3, 6]) });
    for (const sx of [-1, 1]) {
      for (let z = -10; z < 9; z += 1.25) {
        box(sc, 1.0, 5, 1.2, (Math.round(z / 1.25) % 2) ? '#3a6fb0' : '#3566a3', sx * 4.35, 2.5, z, { round: 0.03 });
        box(sc, 0.05, 0.6, 0.8, '#2a4f80', sx * 3.83, 4.1, z, { cast: false });
      }
    }
    box(sc, 8, 1.6, 0.1, null, 0, 6.2, -10.75, { material: mat(0xffffff, { map: text('GO GOLDFISH!', { w: 1024, h: 200, bg: '#f39c12', fg: '#fff', size: 130 }) }) });
    for (let z = -8; z < 9; z += 5) box(sc, 1.8, 0.1, 1.0, null, 0, 7.9, z, { material: emissive('#ffffff', 1.4), cast: false });
    sc.add(new THREE.HemisphereLight(0xffffff, 0x8a8070, 1.3));
    const key = new THREE.DirectionalLight(0xffffff, 1.4); key.position.set(4, 14, 9); key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9 }); key.shadow.bias = -0.0005; sc.add(key);
    const lily = s.add(CAST.lily(), 0, 0, -1);
    const a = s.add(CAST.townie(30), -2.3, 0, 1.4); a.group.scale.setScalar(0.75);
    const b = s.add(CAST.townie(31), 2.4, 0, 1.0); b.group.scale.setScalar(0.75);
    const c = s.add(CAST.townie(32), -1.9, 0, 4.0); c.group.scale.setScalar(0.75);
    for (const k of [a, b, c]) faceTo(k, 0, -1);
    box(lily.torso, 1.6, 1.8, 0.7, '#ff6f91', 0, 0, -0.75, { round: 0.2 });
    s.cam = { path: [[V(0.2, 4.4, 11.5), V(0, 2.9, -1)], [V(0.0, 3.55, 1.55), V(0, 3.42, -1)]], ease: 'inout' };
    s.update = (lt) => {
      for (const ch of s.chars) { resetPose(ch); idle(ch, lt); }
      const swear = ctx.lines[1].ls;
      for (const [k, i] of [[a, 0], [b, 1], [c, 2]]) {
        point(k, i === 1 ? 'L' : 'R', 0.05 * Math.sin(lt * 9 + i));
        k.face.set({ expr: 'grin', mouth: 0 });
        k.body.position.y = Math.abs(Math.sin(lt * 9 + i)) * 0.12;
      }
      lily.face.set({ expr: lt > swear ? 'determined' : 'sad', cracks: 0 });
      lily.headPivot.rotation.x = lt > swear ? lerp(0.3, 0, smooth(swear, swear + 0.6, lt)) : 0.3;
    };
    s.laughers = [a, b, c];
    return s;
  },

  // 7. And every night, her mom said the same thing. "Eat, baby. I already ate." (tick)
  dinner(ctx) {
    const s = new Shot(ctx);
    const k = kitchen(s, { night: true });
    const lily = s.add(CAST.lily(), -2.9, 0.75, 0.5, Math.PI / 2);
    const mom = s.add(CAST.mom(), 2.4, 0, -1.6);
    faceTo(mom, -2.9, 0.5);
    plate(s.scene, -1.55, 2.48, 0.5, true);
    const pot = new THREE.Group(); mom.armR.add(pot); pot.position.set(0, -2.1, 0.4);
    cyl(pot, 0.6, 0.8, '#9aa0a8', 0, 0, 0.3);
    s.speakers = { MOM: mom };
    const tickT = ctx.cue('tick');
    s.cam = { path: [[V(4.8, 4.9, 2.4), V(-2.9, 3.3, 0.5)], [V(0.4, 5.8, 6.4), V(0, 3.7, 0)], [V(-4.4, 4.9, 3.0), V(2.4, 4.4, -1.6)]], ease: 'inout' };
    s.update = (lt) => {
      resetPose(lily); resetPose(mom); idle(lily, lt); idle(mom, lt);
      sit(lily);
      lily.armR.rotation.x = -1.3 - 0.25 * Math.max(0, Math.sin(lt * 4));     // eating
      lily.armL.rotation.x = -1.0;
      mom.armR.rotation.set(-0.7, 0, 0);
      const line = ctx.lines[1];
      const speaking = lt > line.ls && lt < line.le;
      if (speaking) talk(mom, lt, 0.5);
      mom.face.set({ expr: 'smile' });
      crackAt(mom.face, 14, lt, tickT);
      lily.face.set({ expr: lt > line.ls ? 'happy' : 'smile' });
      lily.headPivot.rotation.y = lt > line.ls ? 0.25 : 0;
    };
    return s;
  },

  // 8. Then one day, her mom collapsed. "One more crack, and she won't wake up." "Then stop lying!"
  hospital(ctx) {
    const s = new Shot(ctx);
    const sc = s.scene;
    sc.background = new THREE.Color('#cfd8da');
    room(sc, { w: 13, d: 13, h: 8, wall: '#dbe8ea', floorTex: tex.tiles('#cfd8da', '#b7c2c5', [6, 6]) });
    windowPane(sc, -2.5, 4.6, -6.25, 3.4, 2.6, { night: false });
    box(sc, 3.4, 6.5, 0.1, '#9cc7c2', 4.5, 3.6, -6.2);  // curtain
    // bed
    box(sc, 3.6, 1.6, 6.6, '#b8c4c8', 0, 0.9, -1.2);
    box(sc, 3.4, 0.6, 6.4, '#ffffff', 0, 2.0, -1.2);
    box(sc, 3.8, 3.6, 0.3, '#8fa3aa', 0, 2.0, -4.6);
    // patient: mom sitting up against a raised backrest, blanket over her legs
    const mom = makeCharacter({ skin: '#f0c7a2', shirt: '#a9c8e8', shirtKind: 'pajama', shirtAccent: '#ffffff', pants: '#a9c8e8', hair: 'bun', hairColor: '#4a3125', seed: 23, faceOpts: { lashes: true } });
    place(sc, mom, 0, 1.3, -3.0); s.chars.push(mom);
    box(sc, 3.4, 3.6, 0.5, '#e9eef0', 0, 4.0, -3.85, { rx: -0.08 });
    box(sc, 2.3, 1.1, 0.5, '#ffffff', 0, 5.0, -3.55, { round: 0.22 });
    box(sc, 3.6, 0.4, 3.2, '#7fa7c9', 0, 2.75, -0.8, { round: 0.12 });
    // monitor + IV
    box(sc, 0.3, 4.2, 0.3, '#888', 3.1, 2.1, -3.8);
    const ecgCv = document.createElement('canvas'); ecgCv.width = 256; ecgCv.height = 160;
    const ecg = new THREE.CanvasTexture(ecgCv); ecg.colorSpace = THREE.SRGBColorSpace;
    box(sc, 2.0, 1.4, 0.8, '#2d2f36', 3.1, 4.8, -3.8, { round: 0.1 });
    box(sc, 1.7, 1.1, 0.05, null, 3.1, 4.8, -3.38, { material: new THREE.MeshBasicMaterial({ map: ecg }), cast: false });
    box(sc, 0.12, 6.5, 0.12, '#bbb', -2.4, 3.25, -4.2); box(sc, 0.6, 0.9, 0.3, '#d6f0ff', -2.4, 6.0, -4.2, { mat: { transparent: true, opacity: 0.8 } });
    const doc = s.add(CAST.doctor(), 2.8, 0, -0.6, -0.75);
    const lily = s.add(CAST.lily(), -2.4, 0, -2.0, 1.0);
    const clip = box(doc.armR, 1.1, 1.4, 0.1, '#b9915e', 0, -1.9, 0.7, { rx: -0.6 });
    sc.add(new THREE.HemisphereLight(0xf2fbff, 0x8aa0a8, 1.25));
    const key = new THREE.DirectionalLight(0xffffff, 1.5); key.position.set(-5, 14, 8); key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9 }); key.shadow.bias = -0.0005; sc.add(key);
    s.speakers = { DOCTOR: doc, LILY: lily };
    s.cam = { path: [[V(1.2, 7.3, 10.5), V(0, 4.2, -1.6)], [V(-1.4, 5.6, 4.2), V(-0.9, 4.3, -2.6)]], ease: 'inout' };
    const L = ctx.lines;
    s.update = (lt, t) => {
      resetPose(mom); resetPose(doc); resetPose(lily); idle(doc, lt); idle(lily, lt); idle(mom, lt, 0.3);
      sit(mom); mom.armL.rotation.x = -0.5; mom.armR.rotation.x = -0.5;
      const docOn = lt > L[1].ls - 0.1, lilyOn = lt > L[2].ls - 0.1;
      const turnAway = lilyOn ? smooth(L[2].le, L[2].le + 0.6, lt) : 0;
      mom.face.set({ expr: lilyOn ? (turnAway > 0.5 ? 'sad' : 'tired') : docOn ? 'sleep' : 'sleep', cracks: 17, grow: 1 });
      mom.headPivot.rotation.y = 0.75 * turnAway;
      doc.face.set({ expr: 'worried' });
      doc.armR.rotation.set(-0.9, 0, 0);
      if (docOn && lt < L[1].le) talk(doc, lt, 0.4);
      lily.face.set({ expr: lilyOn ? 'cry' : docOn ? 'shock' : 'worried', tear: lilyOn ? clamp((lt - L[2].ls) / 1.2) : 0 });
      lily.headPivot.rotation.y = 0.2;
      if (lilyOn && lt < L[2].le + 0.2) { lily.armL.rotation.set(-0.3, 0, -0.4); lily.armR.rotation.set(-0.3, 0, 0.4); lily.body.position.y = 0.06 * Math.sin(lt * 20); }
      // ECG
      const c = ecgCv.getContext('2d');
      c.fillStyle = '#071a0c'; c.fillRect(0, 0, 256, 160);
      c.strokeStyle = '#3cff6b'; c.lineWidth = 4; c.beginPath();
      for (let x = 0; x < 256; x++) {
        const ph = ((x / 256) * 2.2 + lt * 1.1) % 1;
        const y = ph > 0.42 && ph < 0.46 ? 30 : ph > 0.46 && ph < 0.5 ? 130 : 80 + 6 * Math.sin(ph * 30);
        x ? c.lineTo(x, y) : c.moveTo(x, y);
      }
      c.stroke(); ecg.needsUpdate = true;
    };
    return s;
  },

  // 9. That night, Lily opened the fridge. Empty. It had been empty for months.
  fridge(ctx) {
    const s = new Shot(ctx);
    const k = kitchen(s, { night: true, pendantOn: false });
    k.hemi.intensity = 0.42; k.key.intensity = 0.45;
    const moon = new THREE.DirectionalLight(0x7f9cff, 0.6); moon.position.set(2, 10, -14); s.scene.add(moon);
    const lily = s.add(CAST.lilyPJ(), -3.9, 0, -1.4, Math.PI);
    s.vignette = 0.6;
    const openT = ctx.cue('fridgeOpen');
    s.cam = { path: [[V(-1.4, 4.9, 4.6), V(-3.9, 3.3, -4.4)], [V(-3.05, 4.55, 0.25), V(-3.9, 3.0, -4.6)]], ease: 'inout' };
    s.update = (lt) => {
      resetPose(lily); idle(lily, lt, 0.5);
      const op = smooth(openT - 0.3, openT + 0.5, lt);
      k.fridge.hinge.rotation.y = -1.9 * op;
      k.fridge.light.intensity = 9 * op;
      k.fridge.lampM.emissiveIntensity = 1.2 * op;
      lily.armL.rotation.set(lerp(-1.35, -0.2, op), 0, 0);
      lily.headPivot.rotation.x = lerp(0, 0.25, smooth(openT + 0.6, openT + 1.4, lt));
      lily.face.set({ expr: 'sad' });
    };
    return s;
  },

  // 10. Every lie her mom ever told... was so Lily could eat. (echo) "I already ate."
  goldface(ctx) {
    const s = new Shot(ctx);
    const sc = s.scene;
    sc.background = new THREE.Color('#0d0906');
    const mom = s.add(CAST.mom(), 0, 0, 0);
    sc.add(new THREE.HemisphereLight(0xffe2b0, 0x1a1008, 0.5));
    const keyL = new THREE.SpotLight(0xffd7a0, 60, 20, 0.6, 0.6, 1.2); keyL.position.set(-2.5, 6.5, 5); keyL.target.position.set(0, 4.6, 0); sc.add(keyL, keyL.target);
    const rim = new THREE.PointLight(0xffb84d, 20, 10, 1.5); rim.position.set(1.8, 6, -2); sc.add(rim);
    const glow = new THREE.PointLight(0xffc24a, 0, 6, 1.5); glow.position.set(0, 4.7, 2.2); sc.add(glow);
    const dust = bokeh(sc, 46, [10, 8, 4], [0, 4.6, -5], ['#ffb347', '#ffd27a', '#ff8c42', '#fff1c1'], 5);
    const sparks = bokeh(sc, 30, [2.4, 2.4, 1.2], [0, 4.6, 1.2], ['#ffd34d', '#fff1c1'], 9);
    sparks.forEach(p => p.scale.multiplyScalar(0.12));
    const g0 = ctx.cue('goldStart');
    s.vignette = 0.7;
    s.cam = { path: [[V(0, 4.66, 2.4), V(0, 4.62, 0)], [V(0.35, 4.45, 5.6), V(0, 4.4, 0)]], ease: 'inout' };
    s.update = (lt) => {
      resetPose(mom); idle(mom, lt, 0.4);
      const gold = smooth(g0 + 0.3, g0 + 4.3, lt);
      mom.face.set({ expr: 'bliss', cracks: 17, grow: 1, gold });
      glow.intensity = 6 * gold;
      for (const p of dust) { const u = p.userData; p.position.y = u.base.y + Math.sin(lt * u.sp + u.ph) * 0.4 + lt * 0.12; }
      for (const p of sparks) { const u = p.userData; p.position.y = u.base.y + ((lt * u.sp * 0.6 + u.ph) % 2.4) - 1.2; p.material.opacity = gold * (0.4 + 0.5 * Math.sin(lt * 4 + u.ph) ** 2); }
    };
    return s;
  },

  // 11. The next night, there was one plate. "Eat, baby. I alr—" "I already ate, Mom." GOLD CRACK
  lastdinner(ctx) {
    const s = new Shot(ctx);
    const k = kitchen(s, { night: true, warm: 0.8 });
    const lily = s.add(CAST.lily(), -2.9, 0.75, 0.5, Math.PI / 2);
    const mom = s.add(CAST.mom(), 2.9, 0.5, 0.5, -Math.PI / 2);
    const pl = plate(s.scene, 0.6, 2.48, 0.5, true);
    s.speakers = { MOM: mom, LILY: lily };
    const L = ctx.lines;
    const goldT = ctx.cue('goldcrack');
    s.anchors.goldcrack = () => headPos(lily);
    s.cam = { path: [[V(5.8, 5.2, 3.6), V(-2.9, 3.4, 0.5)], [V(0.4, 3.75, 1.5), V(-2.9, 3.45, 0.5)]], ease: 'inout' };
    s.update = (lt) => {
      resetPose(lily); resetPose(mom); idle(lily, lt); idle(mom, lt);
      sit(lily); sit(mom);
      const push = smooth(L[1].ls, L[1].le, lt);
      pl.position.x = lerp(0.6, -1.4, push);
      mom.armR.rotation.x = lerp(-0.6, -1.45, push);
      mom.armL.rotation.x = -0.6;
      lily.armL.rotation.x = -0.9; lily.armR.rotation.x = -0.9;
      mom.face.set({ expr: lt > goldT ? 'smile' : lt > L[2].ls ? 'shock' : 'smile', tear: lt > goldT + 0.3 ? clamp((lt - goldT - 0.3) / 1.2) : 0 });
      lily.face.set({ expr: lt > goldT + 0.25 ? 'happy' : 'smile', cracks: lt >= goldT ? 1 : 0, grow: smooth(goldT, goldT + 0.35, lt), gold: 1 });
      if (lt > L[2].ls && lt < L[2].le) { lily.armR.rotation.x = lerp(-0.9, -1.5, smooth(L[2].ls, L[2].ls + 0.3, lt)); } // pushes plate back
      if (lt > L[2].ls) pl.position.x = lerp(-1.4, 0.4, smooth(L[2].ls, L[2].le, lt));
      lily.headPivot.rotation.y = -0.15;
    };
    return s;
  },

  // 12. It was the first lie Lily ever told. Because in this world... the ones who love you most.
  ending(ctx) {
    const s = new Shot(ctx);
    const sc = s.scene;
    kitchen(s, { night: true, warm: 0.9, chairs: false });
    skyGradient(sc, '#050818', '#2c2557', '#141a40');
    // both at the far side of the table, facing the window the camera exits through
    chair(sc, -1.05, -1.9, 0); chair(sc, 1.35, -1.9, 0);
    const lily = s.add(CAST.lily(), -1.05, 0.75, -1.9, 0.12);
    const mom = s.add(CAST.mom(), 1.35, 0.5, -1.9, -0.12);
    plate(sc, 1.35, 2.48, -0.2, true);
    // building: facade with a real window hole at z = 6
    const brick = canvasTex(256, 256, (c) => {
      c.fillStyle = '#8f4f40'; c.fillRect(0, 0, 256, 256); c.fillStyle = '#6e3a2f';
      for (let y = 0; y < 256; y += 32) { c.fillRect(0, y, 256, 4); for (let x = (y / 32) % 2 ? 0 : 32; x < 256; x += 64) c.fillRect(x, y, 4, 32); }
    }, [4, 6]);
    const inner = mat(0xffffff, { map: tex.wallpaper('#f3dca5', '#ecd093') });
    const outer = mat(0xffffff, { map: brick });
    const fm = [outer, outer, outer, outer, outer, inner];
    const hx = 1.9, y0 = 2.4, y1 = 6.2, Z = 6, X = 9, B = -14, TOP = 16;
    box(sc, X - hx, TOP - B, 0.6, null, -(X + hx) / 2, (TOP + B) / 2, Z, { material: fm, cast: false });
    box(sc, X - hx, TOP - B, 0.6, null, (X + hx) / 2, (TOP + B) / 2, Z, { material: fm, cast: false });
    box(sc, 2 * hx, y0 - B, 0.6, null, 0, (y0 + B) / 2, Z, { material: fm, cast: false });
    box(sc, 2 * hx, TOP - y1, 0.6, null, 0, (TOP + y1) / 2, Z, { material: fm, cast: false });
    for (const sx of [-1, 1]) box(sc, 0.6, TOP - B, 20, null, sx * X, (TOP + B) / 2, Z - 10, { material: outer, cast: false });
    box(sc, 2 * X + 1, 0.8, 21, '#5a3028', 0, TOP + 0.4, Z - 10, { cast: false });
    box(sc, 2 * hx + 0.6, 0.3, 1.0, '#e8e2d6', 0, y0, Z + 0.3);
    box(sc, 2 * hx + 0.2, 0.6, 0.8, '#7a4a2a', 0, y0 - 0.45, Z + 0.7);
    for (let i = 0; i < 5; i++) box(sc, 0.4, 0.4, 0.4, ['#ff6f91', '#ffd166', '#ff9f43'][i % 3], -1.4 + i * 0.7, y0 + 0.05, Z + 0.7, { round: 0.15 });
    const R = rng(4);
    for (const fx of [-5.5, 0, 5.5]) for (const fy of [-10.7, -3.2, 4.3, 11.8]) {
      if (fx === 0 && fy === 4.3) continue;
      const lit = R() < 0.55;
      box(sc, 3.8, 3.8, 0.1, null, fx, fy, Z + 0.32, { material: lit ? emissive(['#ffcf7a', '#ffe2a8', '#ffc06a'][Math.floor(R() * 3)], 1.0) : mat('#1d2340'), cast: false });
      box(sc, 4.2, 0.3, 0.5, '#e8e2d6', fx, fy - 2.0, Z + 0.4, { cast: false });
    }
    // street below
    box(sc, 300, 0.2, 300, '#1c2233', 0, B, 40, { cast: false });
    box(sc, 300, 0.25, 9, '#2a2f3d', 0, B + 0.05, 16, { cast: false });
    for (const x of [-16, 0, 16]) { const l = lamp(sc, x, 11, true); l.position.y = B; }
    for (const x of [-13, 13]) { const t = tree(sc, x, 9, 1.4, x + 50); t.position.y = B; }
    const stars = new THREE.BufferGeometry();
    const pos = []; for (let i = 0; i < 500; i++) pos.push((R() - 0.5) * 260, 10 + R() * 120, -70 - R() * 40);
    stars.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    sc.add(new THREE.Points(stars, new THREE.PointsMaterial({ color: '#ffffff', size: 0.7, sizeAttenuation: true })));
    const moon = new THREE.Mesh(new THREE.SphereGeometry(5, 32, 16), new THREE.MeshBasicMaterial({ color: '#fff6d8' }));
    moon.position.set(24, 44, -70); sc.add(moon);
    sc.add(new THREE.HemisphereLight(0x6a7cc8, 0x101020, 0.45));
    const moonL = new THREE.DirectionalLight(0x9fb0ff, 0.5); moonL.position.set(20, 30, 40); sc.add(moonL);
    const spill = new THREE.PointLight('#ffcf8a', 14, 12, 1.5); spill.position.set(0, 4.3, 7.5); sc.add(spill);
    s.cam = { path: [[V(0.6, 4.3, 5.1), V(0.6, 3.5, -1.2)], [V(0.45, 4.5, 9.5), V(0.4, 3.8, -1)], [V(0, 7, 52), V(0, 3.5, 0)]], ease: 'inout', fov: 62 };
    s.vignette = 0.45;
    s.update = (lt) => {
      resetPose(lily); resetPose(mom); idle(lily, lt); idle(mom, lt);
      sit(lily); sit(mom);
      mom.armR.rotation.x = -1.3 - 0.35 * Math.max(0, Math.sin(lt * 3.2)); // eating
      mom.armL.rotation.x = -0.8;
      lily.armL.rotation.x = -0.9; lily.armR.rotation.x = -0.9;
      mom.face.set({ expr: 'happy', cracks: 17, grow: 1, gold: 1 });
      lily.face.set({ expr: 'happy', cracks: 1, grow: 1, gold: 1 });
      mom.headPivot.rotation.y = -0.35; lily.headPivot.rotation.y = 0.3;
    };
    return s;
  },
};
