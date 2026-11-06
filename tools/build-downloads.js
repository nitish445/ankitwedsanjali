#!/usr/bin/env node
/*
 * Builds the downloadable invitation files from index.html:
 *   assets/downloads/Ankit-Anjali-Invitation-hi.pdf   (Hindi)
 *   assets/downloads/Ankit-Anjali-Invitation-bho.pdf  (Bhojpuri)
 *   assets/downloads/Ankit-Anjali-Invitation-en.pdf   (English)
 *   assets/downloads/Ankit-Anjali-Invitation-Video.mp4 (Hindi, 720x1280, with music)
 *
 * Needs: Node, Playwright (Chromium) and ffmpeg.
 * Usage: node tools/build-downloads.js [--music path/to/audio-or-video] [--pdf-only] [--video-only]
 * Re-run it whenever the invitation text changes.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'assets', 'downloads');
const args = process.argv.slice(2);
const opt = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const MUSIC = opt('--music') || path.join(ROOT, 'assets', 'invitation.mp4');
const ONLY_PDF = args.includes('--pdf-only'), ONLY_VIDEO = args.includes('--video-only');

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp4': 'video/mp4', '.pdf': 'application/pdf' };
function serve(){
  return new Promise(res => {
    const srv = http.createServer((req, rsp) => {
      const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html');
      if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()){ rsp.writeHead(404); return rsp.end(); }
      rsp.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(rsp);
    }).listen(0, '127.0.0.1', () => res(srv));
  });
}

const HIDE_UI = `#langBtn,.fab,.petal{display:none !important}`;

async function buildPdfs(browser, base){
  for (const lang of ['hi', 'bho', 'en']){
    const ctx = await browser.newContext({ viewport: { width: 540, height: 960 } });
    const page = await ctx.newPage();
    await page.goto(`${base}/index.html?lang=${lang}&thanks=0`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => window.prepareStatic && window.prepareStatic());
    await page.emulateMedia({ media: 'print' });
    await page.waitForTimeout(500);
    const file = path.join(OUT, `Ankit-Anjali-Invitation-${lang}.pdf`);
    await page.pdf({ path: file, width: '540px', height: '960px', printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
    console.log('PDF  ', path.relative(ROOT, file), (fs.statSync(file).size / 1e6).toFixed(1) + ' MB');
    await ctx.close();
  }
}

async function buildVideo(browser, base){
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'aa-video-'));
  const ctx = await browser.newContext({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  // slow-motion support for the door-opening clip, and 11 lit diyas for the diya section
  await page.addInitScript(() => {
    try { localStorage.setItem('aa-diyas', '11'); } catch(e){}
    const st = window.setTimeout; window.__slow = 1;
    window.setTimeout = (fn, ms, ...a) => st(fn, (ms || 0) * window.__slow, ...a);
  });
  await page.goto(`${base}/index.html?lang=hi&thanks=0`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: HIDE_UI + `#fx{display:none !important}` });
  await page.waitForTimeout(4200);                         // cover entrance animation finishes
  const shots = [];
  const snap = async (name, dur) => { const f = path.join(tmp, name + '.png'); await page.screenshot({ path: f }); shots.push({ f, dur }); };
  await snap('00-cover', 3.2);

  // door opening, captured in slow motion (1/10 speed) and played back in real time
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Animation.enable');
  await cdp.send('Animation.setPlaybackRate', { playbackRate: 0.1 });
  await page.evaluate(() => { window.__slow = 10; });
  await page.evaluate(() => document.getElementById('open').click());
  const intro = [], t0 = Date.now();
  while (Date.now() - t0 < 21000){
    const f = path.join(tmp, `intro-${String(intro.length).padStart(3, '0')}.png`);
    await page.screenshot({ path: f }); intro.push({ f, t: (Date.now() - t0) / 10000 });
  }
  await cdp.send('Animation.setPlaybackRate', { playbackRate: 1 });
  await page.evaluate(() => { window.__slow = 1; });
  await page.waitForTimeout(3000);

  // static states for every section
  await page.addStyleTag({ content: `#fx{display:block !important} .actions,.dl-row,.countdown,#palette,.hint-sm,[data-open-aarti]{display:none !important}` });
  await page.evaluate(() => {
    window.prepareStatic && window.prepareStatic();
    document.querySelectorAll('.reveal').forEach(e => e.classList.add('in'));
    const sc = document.getElementById('scratchCv'); if (sc) sc.classList.add('done');
  });
  const sections = [
    ['section.first', 'ganesh', 4.2], ['#blessing', 'blessing', 4.2], ['#varmala', 'couple', 4.2], ['#letter', 'letter', 5.2],
    ['#events', 'events', 4.6], ['#noteSec', 'note', 4], ['#weather', 'weather', 4], ['#scratch', 'surprise', 3.6],
    ['#rangoli', 'rangoli', 3.6], ['#deep', 'diya', 3.6], ['section.closing', 'closing', 4.6],
  ];
  for (const [sel, name, dur] of sections){
    await page.evaluate(sel => {
      const el = document.querySelector(sel);
      (el.closest('section') || el).scrollIntoView({ block: 'center' });
      document.querySelectorAll('.petal').forEach(p => p.remove());
    }, sel);
    await page.waitForTimeout(700);
    await snap(name, dur);
  }
  // the shareable card image as the last slide
  await page.evaluate(() => document.querySelector('[data-card]').click());
  await page.waitForSelector('#cardImg[src]', { timeout: 20000 });
  const b64 = await page.evaluate(async () => { const r = await fetch(document.getElementById('cardImg').src); const b = await r.blob();
    return await new Promise(res => { const fr = new FileReader(); fr.onload = () => res(fr.result.split(',')[1]); fr.readAsDataURL(b); }); });
  const cardF = path.join(tmp, 'zz-card.jpg'); fs.writeFileSync(cardF, Buffer.from(b64, 'base64')); shots.push({ f: cardF, dur: 5 });
  await ctx.close();

  // ---- ffmpeg: intro clip ----
  const W = 720, H = 1280, FPS = 30;
  const introList = path.join(tmp, 'intro.txt');
  let txt = '';
  intro.forEach((fr, i) => { const next = i < intro.length - 1 ? intro[i + 1].t : fr.t + 0.4; txt += `file '${fr.f}'\nduration ${(next - fr.t).toFixed(3)}\n`; });
  txt += `file '${intro[intro.length - 1].f}'\n`;
  fs.writeFileSync(introList, txt);
  const introMp4 = path.join(tmp, 'intro.mp4');
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', introList,
    '-vf', `scale=${W}:${H}:flags=lanczos,fps=${FPS},format=yuv420p`, '-c:v', 'libx264', '-crf', '22', '-preset', 'medium', introMp4]);
  const introDur = parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', introMp4]).toString());

  // ---- ffmpeg: slides with gentle zoom + varied transitions ----
  const T = 0.8, TRANS = ['fade', 'smoothup', 'circleopen', 'slideleft', 'dissolve', 'smoothleft', 'fade', 'smoothright', 'slideup', 'dissolve', 'circleopen', 'smoothdown'];
  const order = [shots[0], ...shots.slice(1)];   // cover first, then sections, then card
  const inputs = [], filters = [];
  // stream 0: cover still, stream 1: intro clip, then sections
  const clips = [{ type: 'img', s: order[0] }, { type: 'mp4', f: introMp4, dur: introDur }, ...order.slice(1).map(s => ({ type: 'img', s }))];
  clips.forEach((c, i) => {
    if (c.type === 'img'){
      const frames = Math.round(c.s.dur * FPS);
      inputs.push('-i', c.s.f);
      const zoomIn = i % 2 === 0;
      const z = zoomIn ? `min(1+0.05*on/${frames},1.05)` : `max(1.05-0.05*on/${frames},1)`;
      filters.push(`[${i}:v]scale=${W * 2}:${H * 2}:force_original_aspect_ratio=increase,crop=${W * 2}:${H * 2},zoompan=z='${z}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${W}x${H}:fps=${FPS},setsar=1,format=yuv420p[v${i}]`);
      c.dur = c.s.dur;
    } else {
      inputs.push('-i', c.f);
      filters.push(`[${i}:v]fps=${FPS},setsar=1,format=yuv420p[v${i}]`);
    }
  });
  let last = 'v0', offset = 0;
  for (let i = 1; i < clips.length; i++){
    const tr = i === 1 ? 0.25 : T;
    offset += clips[i - 1].dur - tr;
    const outName = `x${i}`;
    filters.push(`[${last}][v${i}]xfade=transition=${i === 1 ? 'fade' : TRANS[(i - 2) % TRANS.length]}:duration=${tr}:offset=${offset.toFixed(3)}[${outName}]`);
    last = outName;
  }
  const total = offset + clips[clips.length - 1].dur;
  const audioIdx = clips.length;
  inputs.push('-i', MUSIC);
  filters.push(`[${audioIdx}:a]atrim=0:${total.toFixed(2)},asetpts=PTS-STARTPTS,afade=t=in:d=1,afade=t=out:st=${(total - 2.5).toFixed(2)}:d=2.5[a]`);
  const file = path.join(OUT, 'Ankit-Anjali-Invitation-Video.mp4');
  execFileSync('ffmpeg', ['-y', '-v', 'error', ...inputs, '-filter_complex', filters.join(';'), '-map', `[${last}]`, '-map', '[a]',
    '-c:v', 'libx264', '-crf', '24', '-preset', 'slow', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k',
    '-movflags', '+faststart', '-t', total.toFixed(2), file], { maxBuffer: 1 << 26 });
  console.log('VIDEO', path.relative(ROOT, file), total.toFixed(1) + ' s', (fs.statSync(file).size / 1e6).toFixed(1) + ' MB');
  fs.rmSync(tmp, { recursive: true, force: true });
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const srv = await serve();
  const base = `http://127.0.0.1:${srv.address().port}`;
  const browser = await chromium.launch();
  try {
    if (!ONLY_VIDEO) await buildPdfs(browser, base);
    if (!ONLY_PDF) await buildVideo(browser, base);
  } finally { await browser.close(); srv.close(); }
})().catch(e => { console.error(e); process.exit(1); });
