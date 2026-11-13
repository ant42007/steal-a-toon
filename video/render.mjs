// Render a version to 1080x1920 @30fps MP4: Playwright drives web/index.html frame by frame,
// screenshots are piped into ffmpeg, then the mixed audio is muxed on.
//
//   node render.mjs v1                      full render -> ../renders/cracks-v1.mp4
//   node render.mjs v1 --stills 1,5.6,20    PNG stills -> build/v1/stills/
//   node render.mjs v1 --workers 3          parallel browsers (split by frame range)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const version = args[0];
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const BUILD = path.join(ROOT, 'build', version);
const timeline = JSON.parse(fs.readFileSync(path.join(BUILD, 'timeline.json'), 'utf8'));
const FPS = timeline.fps;
const total = Math.ceil(timeline.duration * FPS);

// ---------------------------------------------------------------- static server
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.ttf': 'font/ttf' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const URL_ = `http://127.0.0.1:${server.address().port}/web/index.html?tl=/build/${version}/timeline.json`;

async function openPage() {
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('[page error]', e.message));
  page.on('console', m => { if (m.type() === 'error') console.error('[console]', m.text()); });
  await page.goto(URL_);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 120000 });
  return { browser, page };
}

const stage = (page) => page.locator('#stage');

// ---------------------------------------------------------------- stills mode
if (opt('--stills')) {
  const dir = path.join(BUILD, 'stills');
  fs.mkdirSync(dir, { recursive: true });
  const { browser, page } = await openPage();
  for (const s of opt('--stills').split(',').map(Number)) {
    const id = await page.evaluate(t => window.renderAt(t), s);
    const f = path.join(dir, `t${s.toFixed(2).padStart(6, '0')}-${id}.png`);
    await stage(page).screenshot({ path: f });
    console.log(f);
  }
  await browser.close(); server.close();
  process.exit(0);
}

// ---------------------------------------------------------------- video mode
const workers = Number(opt('--workers', 3));
const segDir = path.join(BUILD, 'segments');
fs.rmSync(segDir, { recursive: true, force: true });
fs.mkdirSync(segDir, { recursive: true });
const chunk = Math.ceil(total / workers);
const t0 = Date.now();
let done = 0;

async function renderRange(w, f0, f1) {
  const out = path.join(segDir, `seg${w}.mp4`);
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', String(FPS), out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const { browser, page } = await openPage();
  for (let f = f0; f < f1; f++) {
    await page.evaluate(t => window.renderAt(t), f / FPS);
    const buf = await stage(page).screenshot({ type: 'jpeg', quality: 94 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    done++;
    if (done % 60 === 0) {
      const el = (Date.now() - t0) / 1000;
      console.log(`${done}/${total} frames  ${(done / el).toFixed(2)} fps  eta ${Math.round((total - done) / (done / el))}s`);
    }
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await browser.close();
  return out;
}

const segs = await Promise.all(Array.from({ length: workers }, (_, w) => renderRange(w, w * chunk, Math.min(total, (w + 1) * chunk))));
server.close();
const list = path.join(segDir, 'list.txt');
fs.writeFileSync(list, segs.map(s => `file '${s}'`).join('\n'));
const silent = path.join(BUILD, 'video.mp4');
execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', silent]);
const outDir = path.join(ROOT, '..', 'renders');
fs.mkdirSync(outDir, { recursive: true });
const final = opt('--out', path.join(outDir, `cracks-${version}.mp4`));
execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', silent, '-i', path.join(BUILD, 'audio.wav'), '-map', '0:v', '-map', '1:a',
  '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', final]);
console.log(`done in ${Math.round((Date.now() - t0) / 1000)}s -> ${final}`);
