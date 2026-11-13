// Deterministic frame renderer: window.renderAt(t) draws the frame at time t (seconds).
// The story module (timeline.story) supplies SCENES and an optional STYLE.
import * as THREE from 'three';
import { faceTick as crackFaceTick } from './lib/char.js';
import { Overlay } from './lib/overlay.js';

const W = 1080, H = 1920;
const params = new URLSearchParams(location.search);
const T = await (await fetch(params.get('tl'))).json();
const mod = await import(!T.story || T.story === 'cracks' ? './lib/scenes.js' : `./stories/${T.story}.js`);
const SCENES = mod.SCENES;
const STYLE = { fov: 50, faceTick: crackFaceTick, captions: 'groups', bubbles: false, grade: null, bloom: 0, endFade: '#000', ...(mod.STYLE || {}) };
await Promise.all(['100px "Lilita One"', '900 100px "Nunito"', '800 100px "Nunito"', '60px "Patrick Hand"'].map(f => document.fonts.load(f)));

const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: params.get('aa') !== '0', preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
if (params.get('rs')) renderer.setSize(W * +params.get('rs'), H * +params.get('rs'), false);
renderer.shadowMap.enabled = params.get('sh') !== '0';
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = STYLE.exposure ?? 1.05;
if (STYLE.grade) canvas.style.filter = STYLE.grade;

// cheap bloom: a blurred, thresholded quarter-res copy screened over the frame
const bloomCv = document.getElementById('bloom');
const bloomCtx = STYLE.bloom ? bloomCv.getContext('2d') : null;
if (bloomCtx) { bloomCv.style.opacity = STYLE.bloom; bloomCv.style.display = 'block'; }

const camera = new THREE.PerspectiveCamera(STYLE.fov, W / H, 0.05, 900);
const overlay = new Overlay(document.getElementById('ui'), T, { captions: STYLE.captions, bubbles: STYLE.bubbles, endFadeColor: STYLE.endFade });

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
    word: (li, wi) => { const l = lines[li]; const w = l && l.words[Math.min(wi, l.words.length - 1)]; return w ? { s: w.s - sc.start, e: w.e - sc.start } : { s: 1e9, e: 1e9 }; },
  };
}

const shots = T.scenes.map(sc => {
  const ctx = ctxFor(sc);
  const shot = SCENES[sc.id](ctx);
  const cam = shot.cam;
  if (cam.keys) {
    // time-keyed move: one continuous Catmull-Rom path, time mapped piecewise-linearly onto it
    const keys = typeof cam.keys === 'function' ? cam.keys(ctx) : cam.keys;
    cam._keys = keys;
    cam._pos = new THREE.CatmullRomCurve3(keys.map(k => k.pos), false, 'centripetal');
    cam._look = new THREE.CatmullRomCurve3(keys.map(k => k.look), false, 'centripetal');
  } else if (cam.path.length > 2) {
    cam._pos = new THREE.CatmullRomCurve3(cam.path.map(q => q[0]), false, 'centripetal');
    cam._look = new THREE.CatmullRomCurve3(cam.path.map(q => q[1]), false, 'centripetal');
  }
  return { sc, ctx, shot };
});

for (const { shot } of shots) renderer.compile(shot.scene, camera);

function mouthFor(speaker, t) {
  const l = T.lines.find(l => l.speaker === speaker && t >= l.start && t < l.end && l.fx !== 'echo');
  if (!l) return 0;
  const v = l.env[Math.floor((t - l.start) * T.fps)] ?? 0;
  return Math.max(0, Math.min(1, (v - 0.12) * 1.6));
}

function cameraAt(cam, lt, dur) {
  if (cam._keys) {
    const k = cam._keys, n = k.length;
    let u;
    if (lt <= k[0].t) u = 0;
    else if (lt >= k[n - 1].t) u = 1;
    else {
      let i = 0; while (lt > k[i + 1].t) i++;
      const f = (lt - k[i].t) / (k[i + 1].t - k[i].t);
      const fe = (i === 0 || i === n - 2) ? ease.inout(f) * 0.5 + f * 0.5 : f;  // soft start/end, steady middle
      u = (i + fe) / (n - 1);
    }
    return [cam._pos.getPoint(u), cam._look.getPoint(u)];
  }
  const u = ease[cam.ease || 'inout'](Math.min(1, Math.max(0, lt / dur)));
  const p = cam.path;
  return [cam._pos ? cam._pos.getPoint(u) : p[0][0].clone().lerp(p[1][0], u), cam._look ? cam._look.getPoint(u) : p[0][1].clone().lerp(p[1][1], u)];
}

const tmp = new THREE.Vector3();
function toScreen(v) { tmp.copy(v).project(camera); return { x: (tmp.x * 0.5 + 0.5) * W, y: (-tmp.y * 0.5 + 0.5) * H, behind: tmp.z > 1 }; }

window.renderAt = (t) => {
  const cur = shots.find(s => t >= s.sc.start && t < s.sc.end) || shots[shots.length - 1];
  const { shot, sc, ctx } = cur;
  const lt = t - sc.start;
  shot.update(lt, t);
  const speakerOf = new Map(Object.entries(shot.speakers).map(([k, ch]) => [ch, k]));
  for (const ch of shot.chars) STYLE.faceTick(ch, t, speakerOf.has(ch) ? mouthFor(speakerOf.get(ch), t) : 0);

  // the one camera move
  const [pos, look] = cameraAt(shot.cam, lt, ctx.dur);
  camera.fov = shot.cam.fov || STYLE.fov;
  camera.position.copy(pos);
  camera.lookAt(look);
  camera.updateProjectionMatrix();
  for (const c of ctx.cues) {
    const d = lt - c.lt;
    const amp = { crack: 0.07, goldcrack: 0.03, reveal: 0.05 }[c.name] || 0;
    if (amp && d >= 0 && d < 0.4) {
      const k = amp * (1 - d / 0.4) ** 2;
      camera.translateX(Math.sin(d * 97) * k);
      camera.translateY(Math.cos(d * 131) * k);
    }
  }
  camera.updateMatrixWorld();
  renderer.render(shot.scene, camera);
  if (bloomCtx) {
    bloomCtx.filter = 'brightness(0.8) contrast(3.2) saturate(1.4) blur(7px)';
    bloomCtx.clearRect(0, 0, bloomCv.width, bloomCv.height);
    bloomCtx.drawImage(canvas, 0, 0, bloomCv.width, bloomCv.height);
  }

  overlay.update(t, {
    vignette: shot.vignette,
    project: (cue) => { const fn = shot.anchors[cue.name]; return fn ? toScreen(fn()) : null; },
    speakerAt: (speaker) => {
      const ch = shot.speakers[speaker];
      if (!ch || !ch.head || !ch.group.visible) return null;
      const v = new THREE.Vector3(); ch.head.getWorldPosition(v);
      v.y += (shot.bubbleLift ?? 1.9) * ch.group.scale.y;
      return toScreen(v);
    },
  });
  return cur.sc.id;
};

window.__timeline = T;
window.__shots = shots;
window.__info = () => ({ calls: renderer.info.render.calls, tris: renderer.info.render.triangles });
window.__ready = true;
