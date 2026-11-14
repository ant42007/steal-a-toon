// Turntable lookbook for checking avatars (hair, faces, clothing) from every angle. Not part of any video.
import * as THREE from 'three';
import { faceTick, resetPose, idle } from '../rbx/avatar.js';
import { M, sky, lights, ground } from '../rbx/world.js';
import { CAST } from '../rbx/cast.js';

export const STYLE = { fov: 30, faceTick, captions: 'single', bubbles: false, grade: 'saturate(1.2) contrast(1.05)', bloom: 0.25 };
const V = (x, y, z) => new THREE.Vector3(x, y, z);

export const SCENES = {
  turn(ctx) {
    const scene = new THREE.Scene();
    sky(scene, { bright: true });
    ground(scene, M.baseplate([32, 32]), 200);
    lights(scene, { area: 12, sun: [20, 40, 30] });
    const row = [CAST.leo(), CAST.ellie({ number: null }), CAST.mom({ number: null }), CAST.townie(3, null), CAST.townie(1, null)];
    const chars = row.map((a, i) => { a.group.position.set((i - 2) * 2.6, 0, 0); scene.add(a.group); return a; });
    return {
      scene, chars, speakers: {}, anchors: {}, vignette: 0,
      cam: { path: [[V(0, 4.2, 22), V(0, 4.1, 0)], [V(0, 4.2, 22), V(0, 4.1, 0)]] },
      update: (lt) => chars.forEach((c, i) => { resetPose(c); idle(c, lt); c.group.rotation.y = lt * Math.PI / 3; c.face.set({ expr: 'smile' }); }),
    };
  },
  close(ctx) {
    const s = SCENES.turn(ctx);
    s.cam = { path: [[V(-5.2, 3.85, 4.6), V(-5.2, 3.8, 0)], [V(-5.2, 3.85, 4.6), V(-5.2, 3.8, 0)]], fov: 40 };
    return s;
  },
};
