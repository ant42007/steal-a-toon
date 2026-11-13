// Deterministic frame renderer: window.renderAt(t) draws the frame at time t (seconds).
import * as THREE from 'three';
import { SCENES } from './lib/scenes.js';
import { faceTick } from './lib/char.js';
import { Overlay } from './lib/overlay.js';

const W = 1080, H = 1920;
const params = new URLSearchParams(location.search);
const T = await (await fetch(params.get('tl'))).json();
await document.fonts.load('100px "Lilita One"');

const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 1.05;

const camera = new THREE.PerspectiveCamera(50, W / H, 0.05, 600);
const overlay = new Overlay(document.getElementById('ui'), T);

const ease = {
  linear: (u) => u,
  inout: (u) => 0.5 - 0.5 * Math.cos(Math.PI * u),
  out: (u) => 1 - Math.pow(1 - u, 3),
  in: (u) => u * u,
};

function ctxFor(sc) {
  const lines = T.lines.filter(l => l.scene === sc.id).map(l => ({ ...l, ls: l.start - sc.start, le: l.end - sc.start }));
  const cues = T.cues.filter(c => c.scene === sc.id).map(c => ({ ...c, lt: c.t - sc.start }));
  return {
    id: sc.id, dur: sc.end - sc.start, start: sc.start, lines, cues,
    cue: (name, i = 0) => { const c = cues.filter(c => c.name === name)[i]; return c ? c.lt : 1e9; },
  };
}

const shots = T.scenes.map(sc => {
  const ctx = ctxFor(sc);
  const shot = SCENES[sc.id](ctx);
  const p = shot.cam.path;
  shot._pos = p.length > 2 ? new THREE.CatmullRomCurve3(p.map(q => q[0]), false, 'centripetal') : null;
  shot._look = p.length > 2 ? new THREE.CatmullRomCurve3(p.map(q => q[1]), false, 'centripetal') : null;
  return { sc, ctx, shot };
});

// warm up: compile every scene once so the first real frame of each shot is not slow
for (const { shot } of shots) renderer.compile(shot.scene, camera);

function mouthFor(speaker, t) {
  const l = T.lines.find(l => l.speaker === speaker && t >= l.start && t < l.end && l.fx !== 'echo');
  if (!l) return 0;
  const v = l.env[Math.floor((t - l.start) * T.fps)] ?? 0;
  return Math.max(0, Math.min(1, (v - 0.12) * 1.6));
}

const tmp = new THREE.Vector3();
window.renderAt = (t) => {
  const cur = shots.find(s => t >= s.sc.start && t < s.sc.end) || shots[shots.length - 1];
  const { shot, sc, ctx } = cur;
  const lt = t - sc.start;
  shot.update(lt, t);
  const speakerOf = new Map(Object.entries(shot.speakers).map(([k, ch]) => [ch, k]));
  for (const ch of shot.chars) faceTick(ch, t, speakerOf.has(ch) ? mouthFor(speakerOf.get(ch), t) : 0);

  // the one camera move
  const u = ease[shot.cam.ease || 'inout'](Math.min(1, Math.max(0, lt / ctx.dur)));
  const p = shot.cam.path;
  const pos = shot._pos ? shot._pos.getPoint(u) : p[0][0].clone().lerp(p[1][0], u);
  const look = shot._look ? shot._look.getPoint(u) : p[0][1].clone().lerp(p[1][1], u);
  camera.fov = shot.cam.fov || 50;
  camera.position.copy(pos);
  camera.lookAt(look);
  camera.updateProjectionMatrix();
  // impact shake on cracks
  for (const c of ctx.cues) {
    const d = lt - c.lt;
    const amp = c.name === 'crack' ? 0.07 : c.name === 'goldcrack' ? 0.03 : 0;
    if (amp && d >= 0 && d < 0.4) {
      const k = amp * (1 - d / 0.4) ** 2;
      camera.translateX(Math.sin(d * 97) * k);
      camera.translateY(Math.cos(d * 131) * k);
    }
  }
  camera.updateMatrixWorld();
  renderer.render(shot.scene, camera);

  overlay.update(t, {
    vignette: shot.vignette,
    project: (cue) => {
      const fn = shot.anchors[cue.name];
      if (!fn) return null;
      tmp.copy(fn()).project(camera);
      return { x: (tmp.x * 0.5 + 0.5) * W, y: (-tmp.y * 0.5 + 0.5) * H };
    },
  });
  return cur.sc.id;
};

window.__timeline = T;
window.__ready = true;
