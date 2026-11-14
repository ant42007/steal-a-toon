// DOM overlay: word-by-word captions, CRACK popups, flashes, vignette, fade. Pure function of t.
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

const SPEAKER_COLOR = { N: '#ffe14d', MOM: '#ff9ec7', LILY: '#7fe7ff', KID: '#9dff8a', DAD: '#9dff8a', DOCTOR: '#9dff8a' };

export function buildGroups(lines) {
  const groups = [];
  for (const line of lines) {
    const ws = line.words;
    let cur = [];
    ws.forEach((w, i) => {
      cur.push(w);
      const next = ws[i + 1];
      const punct = /[.,!?…—]$/.test(w.w);
      const gap = next ? next.s - w.e : 9;
      if (cur.length >= 3 || punct || gap > 0.3 || !next) {
        groups.push({ words: cur, speaker: line.speaker, fx: line.fx, start: cur[0].s - 0.03, end: line.end + 0.3 });
        cur = [];
      }
    });
  }
  for (let i = 0; i < groups.length - 1; i++) groups[i].end = Math.min(groups[i].end, Math.max(groups[i].words.at(-1).e + 0.15, groups[i + 1].start));
  return groups;
}

export class Overlay {
  constructor(root, timeline, opts = {}) {
    this.T = timeline;
    this.groups = buildGroups(timeline.lines);
    root.innerHTML = `
      <div id="vig"></div><div id="flash"></div>
      <div id="pop"></div>
      <div id="bubble"><span></span></div>
      <div id="cap"></div>
      <div id="fade"></div>`;
    this.el = Object.fromEntries(['vig', 'flash', 'pop', 'cap', 'fade', 'bubble'].map(id => [id, root.querySelector('#' + id)]));
    this.mode = opts.captions || 'groups';
    this.bubbles = !!opts.bubbles;
    if (this.mode === 'single') this.el.cap.classList.add('single');
    this.el.fade.style.background = opts.endFadeColor || '#000';
    this.words = timeline.lines.flatMap(l => l.words.map(w => ({ ...w, speaker: l.speaker, scene: l.scene, lineEnd: l.end })));
    this._capKey = '';
    this.sceneEnd = Object.fromEntries(timeline.scenes.map(sc => [sc.id, sc.end]));
    this.endFade = opts.endFade ?? 0.9;
  }

  update(t, { vignette = 0.35, project = null, speakerAt = null } = {}) {
    const { el, T } = this;
    if (this.mode === 'single') this.single(t); else this.grouped(t);
    if (this.bubbles) this.bubble(t, speakerAt);
    this.effects(t, vignette, project);
  }

  // one lowercase word at a time, upper third (Roblox story-video style)
  single(t) {
    const ws = this.words;
    let i = -1;
    for (let k = 0; k < ws.length; k++) { if (ws[k].s - 0.02 <= t) i = k; else break; }
    let html = '';
    if (i >= 0) {
      const w = ws[i], next = ws[i + 1];
      const hold = Math.min(next ? next.s : 1e9, Math.max(w.e + 0.35, w.e));
      if (t < hold && t < (this.sceneEnd[w.scene] ?? 1e9)) {
        const pop = 1 + 0.16 * (1 - smooth(w.s, w.s + 0.1, t));
        const word = w.w.toLowerCase().replace(/[.,!?…]+$/, '').replace(/^["“]|["”]$/g, '');
        html = `<span class="w" style="transform:scale(${pop.toFixed(3)})">${word}</span>`;
      }
    }
    if (html !== this._capKey) { this.el.cap.innerHTML = html; this._capKey = html; }
  }

  // Roblox bubble chat above the speaking character's head
  bubble(t, speakerAt) {
    const el = this.el.bubble;
    const l = this.T.lines.find(l => l.speaker !== 'N' && t >= l.start - 0.05 && t < l.end + 0.5 && t < (this.sceneEnd[l.scene] ?? 1e9));
    const p = l && speakerAt ? speakerAt(l.speaker) : null;
    if (!l || !p || p.behind) { el.style.opacity = 0; return; }
    const k = smooth(l.start - 0.05, l.start + 0.1, t) * (1 - smooth(l.end + 0.3, l.end + 0.5, t));
    const s = 0.85 + 0.15 * smooth(l.start - 0.05, l.start + 0.12, t);
    const x = clamp(p.x, 370, 710), y = clamp(p.y, 660, 1500);   // stays inside the frame, below the caption
    if (el._text !== l.text) { el.firstChild.textContent = l.text; el._text = l.text; }
    el.style.cssText = `opacity:${k.toFixed(3)};left:${x.toFixed(0)}px;top:${y.toFixed(0)}px;transform:translate(-50%,-100%) scale(${s.toFixed(3)})`;
  }

  grouped(t) {
    const { el } = this;
    const g = this.groups.find(g => t >= g.start && t < g.end);
    let html = '';
    if (g) {
      const col = SPEAKER_COLOR[g.speaker] || '#ffe14d';
      let active = -1;
      g.words.forEach((w, i) => { if (t >= w.s - 0.02) active = i; });
      html = g.words.map((w, i) => {
        const shown = i <= active;
        const isActive = i === active;
        const pop = isActive ? 1 + 0.22 * (1 - smooth(w.s, w.s + 0.12, t)) : 1;
        const color = isActive ? col : '#ffffff';
        return `<span class="w" style="visibility:${shown ? 'visible' : 'hidden'};color:${color};transform:scale(${pop.toFixed(3)})">${w.w.toUpperCase()}</span>`;
      }).join(' ');
      el.cap.className = g.fx === 'echo' ? 'echo' : g.speaker === 'N' ? 'narr' : 'dlg';
    }
    if (html !== this._capKey) { el.cap.innerHTML = html; this._capKey = html; }
  }

  effects(t, vignette, project) {
    const { el, T } = this;
    // flashes + popups from cues
    let flash = 0, flashCol = '255,255,255', pop = null;
    for (const c of T.cues) {
      const d = t - c.t;
      if (d < 0 || d > 1.2 || t >= (this.sceneEnd[c.scene] ?? 1e9)) continue;  // effects end at the cut
      if (c.name === 'crack') {
        flash = Math.max(flash, 0.55 * Math.exp(-d / 0.06));
        pop = { text: 'CRACK!', d, c };
      } else if (c.name === 'goldcrack') {
        flash = Math.max(flash, 0.6 * Math.exp(-d / 0.25)); flashCol = '255,206,84';
      } else if (c.name === 'spawn') {
        flash = Math.max(flash, 0.9 * Math.exp(-d / 0.35));
      } else if (c.name === 'reveal') {
        flash = Math.max(flash, 0.25 * Math.exp(-d / 0.12)); flashCol = '255,60,60';
      }
    }
    el.flash.style.opacity = flash.toFixed(3);
    el.flash.style.background = `rgb(${flashCol})`;
    if (pop && pop.d < 0.95) {
      const s = pop.d < 0.12 ? 0.4 + 1.1 * (pop.d / 0.12) : 1.5 - 0.5 * smooth(0.12, 0.28, pop.d);
      const o = 1 - smooth(0.7, 0.95, pop.d);
      let x = 540, y = 560;
      if (project) { const p = project(pop.c); if (p) { x = clamp(p.x + 230, 260, 820); y = clamp(p.y - 260, 260, 900); } }
      el.pop.style.cssText = `opacity:${o.toFixed(3)};left:${x}px;top:${y}px;transform:translate(-50%,-50%) rotate(-9deg) scale(${s.toFixed(3)})`;
      el.pop.textContent = pop.text;
    } else el.pop.style.opacity = 0;

    el.vig.style.opacity = vignette.toFixed(3);
    el.fade.style.opacity = smooth(T.duration - this.endFade, T.duration - 0.05, t).toFixed(3);
  }
}
