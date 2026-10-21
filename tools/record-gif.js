// Records a full run of the hero as an animated GIF (and reports its running time).
//   node tools/record-gif.js <narrow|wide> <untouched|touched|drawer|lid|compare-cloud|compare-zoe> [out.gif] [--throttle]
// Needs playwright, gifenc and pngjs on NODE_PATH; serve the site on :8000 first.
// Frames come from the browser's own screencast, resampled to a steady 8 fps.
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { GIFEncoder, quantize, applyPalette } = require('gifenc');
const { PNG } = require('pngjs');

const [viewName = 'narrow', mode = 'untouched', outArg] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const throttle = process.argv.includes('--throttle');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:8000/';
const VIEWS = {
  narrow: { ctx: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, gifW: 390 },
  wide: { ctx: { viewport: { width: 1440, height: 900 } }, gifW: 720 },
};
const FPS = 8;
const out = outArg || path.join(__dirname, '..', 'shots', `${viewName}-run-${mode}.gif`);

(async () => {
  const view = VIEWS[viewName];
  const browser = await chromium.launch();
  const context = await browser.newContext(view.ctx);
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  if (throttle) {
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8,
    });
  }
  const frames = [];
  cdp.on('Page.screencastFrame', async (f) => {
    frames.push({ t: f.metadata.timestamp, data: f.data });
    try { await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }); } catch (_) { /* closing */ }
  });
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await cdp.send('Page.startScreencast', { format: 'png', maxWidth: view.gifW, maxHeight: 2000, everyNthFrame: 1 });

  if (mode === 'touched') {
    // A visitor who acts: drag the phone, scrub the lid, click the two buttons.
    const box = async (s) => page.locator(s).first().boundingBox();
    const drag = async (from, to, steps, hold = 0) => {
      await page.mouse.move(from.x, from.y);
      await page.mouse.down();
      for (let i = 1; i <= steps; i += 1) {
        await page.mouse.move(from.x + ((to.x - from.x) * i) / steps, from.y + ((to.y - from.y) * i) / steps);
        await page.waitForTimeout(16);
      }
      if (hold) await page.waitForTimeout(hold);
      await page.mouse.up();
    };
    await page.waitForFunction(() => window.__zoeHero.gesture === 'phone');
    await page.waitForTimeout(900);
    const ph = await box('.phone');
    const sh = await box('.sheet');
    const sc = await box('.scene');
    const p0 = { x: ph.x + ph.width / 2, y: ph.y + ph.height / 2 };
    const s0 = { x: sh.x + sh.width / 2, y: sh.y + sh.height / 2 };
    await page.mouse.move(p0.x, p0.y);
    await page.mouse.down();
    for (const [to, n] of [[s0, 40], [{ x: sc.x + sc.width / 2, y: sc.y + sc.height * 0.64 }, 30]]) {
      const from = await page.evaluate(() => { const r = document.querySelector('.phone').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
      for (let i = 1; i <= n; i += 1) {
        await page.mouse.move(from.x + ((to.x - from.x) * i) / n, from.y + ((to.y - from.y) * i) / n);
        await page.waitForTimeout(18);
      }
      await page.waitForTimeout(250);
    }
    await page.mouse.up();
    await page.waitForFunction(() => window.__zoeHero.gesture === 'lid' && window.__zoeHero.framesReady, null, { timeout: 30000 });
    await page.waitForTimeout(1300);
    const s2 = await box('.scene');
    const lp = { x: s2.x + s2.width * 0.5, y: s2.y + s2.height * 0.66 };
    await drag(lp, { x: lp.x, y: lp.y - 200 }, 60, 500);
    await page.waitForFunction(() => window.__zoeHero.gesture === 'mark', null, { timeout: 10000 });
    await page.waitForTimeout(1600);
    await page.locator('.btn-mark').click();
    await page.waitForFunction(() => window.__zoeHero.gesture === 'scrub', null, { timeout: 30000 });
    await page.waitForTimeout(1500);
    await page.locator('.btn-scrub').click();
  }
  let ended = 0;
  if (mode === 'lid') {
    // The lid under a hand: tap the phone through Act I, then lift the lid slowly, pause, lift on, release.
    await page.waitForFunction(() => window.__zoeHero.gesture === 'phone');
    await page.evaluate(() => window.__zoeHero.perform('tap'));
    await page.waitForFunction(() => window.__zoeHero.gesture === 'lid' && window.__zoeHero.framesReady, null, { timeout: 30000 });
    await page.waitForTimeout(1500);
    const sc = await page.locator('.scene').first().boundingBox();
    const p = { x: sc.x + sc.width * 0.5, y: sc.y + sc.height * 0.66 };
    await page.mouse.move(p.x, p.y);
    await page.mouse.down();
    const go = async (from, to, n) => { for (let i = 1; i <= n; i += 1) { await page.mouse.move(p.x, p.y - (from + ((to - from) * i) / n)); await page.waitForTimeout(16); } };
    await go(0, 110, 50);
    await page.waitForTimeout(700);
    await go(110, 60, 25);
    await page.waitForTimeout(400);
    await go(60, 190, 50);
    await page.waitForTimeout(300);
    await page.mouse.up();
    await page.waitForTimeout(2500);
  } else if (mode === 'compare-cloud' || mode === 'compare-zoe') {
    // The comparison: scroll to it, pick one, watch two loops.
    await page.locator('#dataflow').scrollIntoViewIfNeeded();
    await page.evaluate(() => document.getElementById('dataflow').scrollIntoView());
    await page.waitForTimeout(1500);
    await page.locator(`.flow-pick[data-pick="${mode.slice(8)}"]`).click();
    await page.waitForTimeout(16500);
  } else if (mode === 'drawer') {
    // Below the hero: skip link, then a slow scroll to the footer, then the Privacy Policy.
    await page.waitForTimeout(1200);
    await page.locator('.skip').click();
    await page.waitForTimeout(1500);
    const H = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = await page.evaluate(() => scrollY); y < H; y += 24) {
      await page.evaluate((v) => window.scrollTo(0, v), y);
      await page.waitForTimeout(40);
    }
    await page.waitForTimeout(800);
    await page.locator('.site-footer a[href="#privacy"]').click();
    await page.waitForTimeout(2500);
  } else {
    await page.waitForFunction(() => window.__zoeHero.ended > 0, null, { timeout: 160000, polling: 200 });
    ended = await page.evaluate(() => window.__zoeHero.ended);
  }
  await page.waitForTimeout(2000);
  await cdp.send('Page.stopScreencast');
  await browser.close();

  // Resample to a steady frame rate: each output frame shows the latest captured frame.
  const t0 = frames[0].t;
  const t1 = frames[frames.length - 1].t;
  const picks = [];
  for (let t = t0, j = 0; t <= t1; t += 1 / FPS) {
    while (j + 1 < frames.length && frames[j + 1].t <= t) j += 1;
    picks.push(j);
  }
  const gif = GIFEncoder();
  let last = -1;
  let delay = 0;
  let pending = null;
  const flush = () => {
    if (!pending) return;
    gif.writeFrame(pending.index, pending.w, pending.h, { palette: pending.palette, delay });
    pending = null;
    delay = 0;
  };
  for (const j of picks) {
    if (j === last && pending) { delay += 1000 / FPS; continue; }
    flush();
    const png = PNG.sync.read(Buffer.from(frames[j].data, 'base64'));
    const palette = quantize(png.data, 256);
    pending = { index: applyPalette(png.data, palette), palette, w: png.width, h: png.height };
    delay = 1000 / FPS;
    last = j;
  }
  flush();
  gif.finish();
  // --samples=<dir>: also write four evenly spaced frames as PNG, to check the content by eye.
  const samples = (process.argv.find((x) => x.startsWith('--samples=')) || '').slice(10);
  if (samples) {
    [0.1, 0.35, 0.6, 0.9].forEach((q, i) => {
      fs.writeFileSync(path.join(samples, `${viewName}-${mode}-sample${i + 1}.png`), Buffer.from(frames[picks[Math.floor(picks.length * q)]].data, 'base64'));
    });
  }
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, gif.bytes());
  console.log(JSON.stringify({ view: viewName, mode, throttle, story_ms: ended, captured_frames: frames.length,
    gif_frames: new Set(picks).size, gif_seconds: +(picks.length / FPS).toFixed(1), kb: Math.round(fs.statSync(out).size / 1024), out }));
})().catch((e) => { console.error(e); process.exit(1); });
