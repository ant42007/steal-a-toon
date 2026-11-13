// Sculpted hair for the classic Roblox head: a scalp shell that follows the head's lathe profile
// (hairline high at the forehead, framing the face, low at the nape) plus tapered, flattened,
// curved strand clumps, like a sculpted hair accessory mesh. Glossy, darker at the roots.
import * as THREE from 'three';

// head profile (must match avatar.js): radius, half-height, fillet; head centre at y = 0.62 in headPivot space
const R = 0.62, HH = 0.6, F = 0.24, CY = 0.62;

function rng(seed) { let s = (seed * 2654435761) >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

// point on the head profile offset outward by d, at arc length s from the top centre, azimuth a (0 = face)
function profile(s, d) {
  const r = R + d, h = HH + d, f = F + d;
  const L1 = r - f, L2 = Math.PI / 2 * f;
  if (s < L1) return { r: s, y: h, nr: 0, ny: 1 };
  if (s < L1 + L2) { const t = (s - L1) / f; return { r: r - f + f * Math.sin(t), y: h - f + f * Math.cos(t), nr: Math.sin(t), ny: Math.cos(t) }; }
  return { r, y: h - f - (s - L1 - L2), nr: 1, ny: 0 };
}
export function scalpPoint(a, s, d = 0.05) {
  const p = profile(s, d);
  return { p: new THREE.Vector3(p.r * Math.sin(a), CY + p.y, p.r * Math.cos(a)), n: new THREE.Vector3(p.nr * Math.sin(a), p.ny, p.nr * Math.cos(a)) };
}
const SIDE0 = (R + 0.05) - (F + 0.05) + Math.PI / 2 * (F + 0.05);   // arc length where the straight side starts

// hairline: how far down the side the hair reaches at azimuth a (front high, sides mid, nape low)
function hairline(a, { front = 0.17, side = 0.42, back = 0.82 } = {}) {
  const c = Math.cos(a);
  const k = (back + front) / 2 - side;
  return SIDE0 + side - ((back - front) / 2) * c + k * c * c;
}

function scalp(hp, mat, opts = {}) {
  const NA = 64, NS = 18, pos = [], uv = [], col = [], idx = [];
  for (let i = 0; i <= NA; i++) {
    const a = (i / NA) * Math.PI * 2 - Math.PI;
    const sb = hairline(a, opts);
    for (let j = 0; j <= NS; j++) {
      const s = (j / NS) * sb;
      const edge = j === NS;
      const ridge = 0.012 * Math.sin(a * 16 + s * 6) * Math.min(1, s * 3);
      const { p } = scalpPoint(a, s, edge ? 0.012 : 0.05 + ridge);
      pos.push(p.x, p.y, p.z); uv.push(i / NA, j / NS);
      const v = 0.82 + 0.18 * (j / NS);
      col.push(v, v, v);
    }
  }
  for (let i = 0; i < NA; i++) for (let j = 0; j < NS; j++) {
    const a = i * (NS + 1) + j, b = (i + 1) * (NS + 1) + j;
    idx.push(a, a + 1, b, b, a + 1, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat); m.castShadow = true; hp.add(m);
  return m;
}

// a tapered, flattened tube along a smooth curve; the flat side faces away from the head
const UP = new THREE.Vector3(0, 1, 0);
function clump(hp, mat, pts, { r0 = 0.19, r1 = 0.015, flat = 0.5, seg = 18, radial = 10, round = 1.25 } = {}) {
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  const C = new THREE.Vector3(0, CY, 0);
  const pos = [], col = [], idx = [];
  const T = new THREE.Vector3(), O = new THREE.Vector3(), B = new THREE.Vector3(), N = new THREE.Vector3();
  for (let i = 0; i <= seg; i++) {
    const t = i / seg;
    const p = curve.getPointAt(t); curve.getTangentAt(t, T);
    O.copy(p).sub(C); if (O.lengthSq() < 1e-6) O.copy(UP); O.normalize();
    B.crossVectors(T, O); if (B.lengthSq() < 1e-6) B.set(1, 0, 0); B.normalize();
    N.crossVectors(B, T).normalize();
    const r = r1 + (r0 - r1) * Math.pow(1 - t, round) * (t < 0.08 ? 0.6 + 5 * t : 1);   // swell then taper to a point
    for (let j = 0; j < radial; j++) {
      const ang = (j / radial) * Math.PI * 2;
      const x = Math.cos(ang) * r, y = Math.sin(ang) * r * flat;
      pos.push(p.x + B.x * x + N.x * y, p.y + B.y * x + N.y * y, p.z + B.z * x + N.z * y);
      const v = 0.78 + 0.22 * t;
      col.push(v, v, v);
    }
  }
  for (let i = 0; i < seg; i++) for (let j = 0; j < radial; j++) {
    const a = i * radial + j, b = i * radial + (j + 1) % radial, c = (i + 1) * radial + j, d = (i + 1) * radial + (j + 1) % radial;
    idx.push(a, c, b, b, c, d);
  }
  // close the tip
  const tip = curve.getPointAt(1);
  const ti = pos.length / 3; pos.push(tip.x, tip.y, tip.z); col.push(1, 1, 1);
  for (let j = 0; j < radial; j++) idx.push(seg * radial + j, ti, seg * radial + (j + 1) % radial);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat); m.castShadow = true; hp.add(m);
  return m;
}
const at = (a, s, out = 0.05) => { const { p, n } = scalpPoint(a, s, 0.05); return p.addScaledVector(n, out); };

// ---------------------------------------------------------------- styles
export function buildHair(hp, style, color, seed = 1, opts = {}) {
  if (style === 'none') return;
  const mat = new THREE.MeshPhongMaterial({ color, shininess: 85, specular: 0x6a6a6a, vertexColors: true });
  const R_ = rng(seed + 101);
  const j = (k) => (R_() - 0.5) * k;

  if (style === 'bald') {
    for (const sx of [-1, 1]) clump(hp, mat, [at(sx * 1.45, SIDE0 + 0.2, 0.0), at(sx * 1.75, SIDE0 + 0.32, 0.03), at(sx * 2.1, SIDE0 + 0.42, 0.02)], { r0: 0.13, r1: 0.04, flat: 0.45 });
    return;
  }

  if (style === 'swoop') {          // Leo: messy, side-swept fringe, layered back (Roblox "messy brown hair" style)
    const leoHL = { front: 0.15, side: 0.4, back: 0.78 };
    scalp(hp, mat, leoHL);
    // swept fringe: roots near the crown-front, sweeping forward and to the side, tips resting just above the eyes
    for (let i = 0; i < 7; i++) {
      const a = -0.95 + i * 0.3, sw = 0.55;
      const sb = hairline(a, leoHL);
      clump(hp, mat, [at(a - 0.15, 0.18, 0.02), at(a + sw * 0.25, sb * 0.45, 0.11 + j(0.03)), at(a + sw * 0.6, sb - 0.06, 0.12), at(a + sw * 0.85 + j(0.08), sb + 0.03 + j(0.03), 0.07)],
        { r0: 0.2 + j(0.03), r1: 0.012, flat: 0.48 });
    }
    // top layer: clumps that lie along the crown with a little lift, for volume (no antennae)
    for (let i = 0; i < 6; i++) {
      const a = -2.4 + i * 0.95 + j(0.2);
      clump(hp, mat, [at(a + Math.PI, 0.1, 0.03), at(a, 0.06, 0.1), at(a, 0.26, 0.13 + j(0.03)), at(a + 0.15, 0.46, 0.1)], { r0: 0.2, r1: 0.014, flat: 0.42 });
    }
    // layered sides and back
    for (let i = 0; i < 12; i++) {
      const a = 1.0 + i * ((2 * Math.PI - 2.0) / 11) + j(0.1);
      const sb = hairline(a, leoHL);
      clump(hp, mat, [at(a, 0.15, 0.02), at(a + j(0.1), sb * 0.5, 0.1), at(a + j(0.15), sb - 0.02, 0.12), at(a + j(0.2), sb + 0.12, 0.13 + j(0.05))], { r0: 0.21, r1: 0.014, flat: 0.45 });
    }
    return;
  }

  if (style === 'spiky') {
    scalp(hp, mat, { front: 0.2, side: 0.38, back: 0.7 });
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + j(0.2), s0 = 0.12 + R_() * 0.15;
      clump(hp, mat, [at(a, s0, 0.0), at(a, s0 + 0.12, 0.2), at(a + j(0.3), s0 + 0.2, 0.42 + j(0.1))], { r0: 0.17, r1: 0.01, flat: 0.6 });
    }
    for (let i = 0; i < 5; i++) { const a = -0.7 + i * 0.35; const sb = hairline(a, { front: 0.2 }); clump(hp, mat, [at(a, 0.2, 0.02), at(a, sb * 0.6, 0.12), at(a + 0.1, sb + 0.06, 0.08)], { r0: 0.17, r1: 0.012 }); }
    return;
  }

  if (style === 'pigtails') {       // Ellie: straight bangs, centre part, two pigtails with ties
    const hl = { front: 0.15, side: 0.42, back: 0.62 };
    scalp(hp, mat, hl);
    for (let i = 0; i < 8; i++) {
      const a = -0.9 + i * 0.257;
      const sb = hairline(a, hl);
      clump(hp, mat, [at(a, 0.22, 0.03), at(a, sb * 0.6, 0.1), at(a, sb - 0.04, 0.1), at(a + j(0.04), sb + 0.03, 0.07)], { r0: 0.17, r1: 0.02, flat: 0.45 });
    }
    for (let i = 0; i < 8; i++) { const a = 1.2 + i * 0.55; const sb = hairline(a, hl); clump(hp, mat, [at(a, 0.12, 0.02), at(a, sb * 0.6, 0.08), at(a, sb + 0.04, 0.08)], { r0: 0.2, r1: 0.03, flat: 0.45 }); }
    for (const sx of [-1, 1]) {
      const t = new THREE.Group(); t.position.set(sx * 0.7, CY + 0.32, -0.12); hp.add(t);
      const tie = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 10), new THREE.MeshPhongMaterial({ color: '#ff5ca8', shininess: 60 })); t.add(tie);
      const V = (x, y, z) => new THREE.Vector3(x, y, z);
      for (let k = 0; k < 3; k++) {
        const o = (k - 1) * 0.08;
        const pts = [V(0, 0, o), V(sx * 0.18, -0.25, o + 0.03), V(sx * 0.24, -0.6, o + 0.05), V(sx * 0.14 + j(0.05), -0.95, o + 0.1)];
        const g = new THREE.Group(); t.add(g);
        clump(g, mat, pts.map(p => p.clone().add(new THREE.Vector3(0, CY, 0))), { r0: 0.16, r1: 0.02, flat: 0.7 }).position.y = -CY;
      }
      hp.userData.tails = (hp.userData.tails || []).concat([t]);
    }
    return;
  }

  if (style === 'bob' || style === 'long') {   // Mom (bob) / long hair: side-swept bangs, strands to the jaw or shoulders
    const hl = { front: 0.15, side: 0.4, back: 0.7 };
    scalp(hp, mat, hl);
    for (let i = 0; i < 5; i++) {
      const a = -0.8 + i * 0.32;
      const sb = hairline(a, hl);
      clump(hp, mat, [at(a - 0.2, 0.16, 0.02), at(a + 0.1, sb * 0.5, 0.12), at(a + 0.32, sb - 0.05, 0.12), at(a + 0.5, sb + 0.02, 0.08)], { r0: 0.2, r1: 0.015, flat: 0.45 });
    }
    const drop = style === 'bob' ? 0.38 : 1.25;
    for (let i = 0; i < 14; i++) {
      const a = 0.95 + i * ((2 * Math.PI - 1.9) / 13);
      const sb = hairline(a, hl);
      const tip = at(a, SIDE0 + 0.4 + drop, style === 'bob' ? 0.06 : 0.16);
      clump(hp, mat, [at(a, 0.12, 0.02), at(a, sb * 0.6, 0.12), at(a, SIDE0 + 0.4, 0.14), tip], { r0: 0.24, r1: 0.03, flat: 0.42 });
    }
    return;
  }

  if (style === 'bun') {
    scalp(hp, mat, { front: 0.18, side: 0.35, back: 0.62 });
    const bun = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 14), mat); bun.position.set(0, CY + 0.6, -0.42); bun.castShadow = true; hp.add(bun);
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; clump(hp, mat, [at(a, 0.3, 0.02), at(a + 0.6, 0.45, 0.07), at(Math.PI, 0.3, 0.12)], { r0: 0.13, r1: 0.05, flat: 0.5 }); }
    return;
  }

  if (style === 'curly') {
    scalp(hp, mat, { front: 0.15, side: 0.35, back: 0.6 });
    for (let i = 0; i < 26; i++) {
      const a = R_() * Math.PI * 2, s = 0.05 + R_() * 0.55;
      if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < 0.8 && s > 0.45) continue;
      const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.17, 1), mat); m.position.copy(at(a, s, 0.06)); m.castShadow = true; hp.add(m);
    }
    return;
  }

  if (style === 'cap' || style === 'beanie') {
    const hl = { front: 0.18, side: 0.32, back: 0.55 };
    scalp(hp, mat, hl);
    for (const sx of [-1, 1]) clump(hp, mat, [at(sx * 1.4, SIDE0 + 0.1, 0.02), at(sx * 1.55, SIDE0 + 0.28, 0.06), at(sx * 1.7, SIDE0 + 0.42, 0.05)], { r0: 0.15, r1: 0.03 });
    const hat = new THREE.MeshPhongMaterial({ color: opts.capColor || (style === 'cap' ? '#2b4fa8' : '#c0392b'), shininess: 25 });
    const crown = new THREE.Mesh(new THREE.SphereGeometry(0.72, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5), hat);
    crown.position.set(0, CY + 0.3, -0.02); crown.scale.set(1, 0.72, 1); crown.castShadow = true; hp.add(crown);
    if (style === 'cap') {
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.06, 28, 1, false, -Math.PI / 2, Math.PI), hat);
      brim.position.set(0, CY + 0.34, 0.46); brim.scale.set(1.15, 1, 0.95); brim.rotation.x = 0.1; hp.add(brim);
    } else {
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.2, 32), new THREE.MeshPhongMaterial({ color: '#962d22', shininess: 20 })); band.position.y = CY + 0.32; hp.add(band);
    }
  }
}
