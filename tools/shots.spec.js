// Drives each hero state and screenshots it into shots/<project>-<state>.png.
// Also checks the Step 1 acceptance rows that can be checked in emulation and
// writes the measurements to shots/<project>-metrics.json.
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');

const SHOTS = path.join(__dirname, '..', 'shots');
fs.mkdirSync(SHOTS, { recursive: true });

const shot = (page, info, name) =>
  page.screenshot({ path: path.join(SHOTS, `${info.project.name}-${name}.png`) });

const hero = (page, prop) => page.evaluate((p) => window.__zoeHero[p], prop);

async function waitFrames(page) {
  await page.waitForFunction(() => window.__zoeHero && window.__zoeHero.framesReady, null, { timeout: 20000 });
}

// Point on the closed lid (centre of the lid, a little above the glowing lip).
async function lidPoint(page) {
  const box = await page.locator('.scene').boundingBox();
  return { x: box.x + box.width * 0.5, y: box.y + box.height * 0.66 };
}

// A touch drag on the touch viewport (real touch events through CDP), a mouse drag on the wide one.
async function startDrag(page, info, p) {
  if (info.project.use.hasTouch) {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: p.x, y: p.y }] });
    return {
      move: (x, y) => cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] }),
      end: () => cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }),
    };
  }
  await page.mouse.move(p.x, p.y);
  await page.mouse.down();
  return { move: (x, y) => page.mouse.move(x, y), end: () => page.mouse.up() };
}

async function dragBy(d, p, dy, steps) {
  for (let i = 1; i <= steps; i += 1) {
    await d.move(p.x, p.y - (dy * i) / steps);
  }
}

// Collects requestAnimationFrame intervals until stop() is called.
async function startFpsProbe(page) {
  await page.evaluate(() => {
    window.__fps = [];
    let last = performance.now();
    const tick = (now) => {
      window.__fps.push(now - last);
      last = now;
      if (window.__fpsOn) requestAnimationFrame(tick);
    };
    window.__fpsOn = true;
    requestAnimationFrame(tick);
  });
  return async () => page.evaluate(() => {
    window.__fpsOn = false;
    const d = window.__fps.slice(1);
    const avg = d.reduce((a, b) => a + b, 0) / d.length;
    const sorted = d.slice().sort((a, b) => a - b);
    return {
      frames: d.length,
      avg_fps: +(1000 / avg).toFixed(1),
      worst_frame_ms: +sorted[sorted.length - 1].toFixed(1),
      p95_frame_ms: +sorted[Math.floor(sorted.length * 0.95)].toFixed(1),
    };
  });
}

const metrics = {};
test.afterAll(async ({}, info) => {
  fs.writeFileSync(path.join(SHOTS, `${info.project.name}-metrics.json`), JSON.stringify(metrics, null, 2));
});

test('state 0: closed laptop, tagline, chevrons, skip link', async ({ page }, info) => {
  await page.goto('/');
  await expect(page.locator('.tagline')).toHaveText('Safe. Sovereign. System-bound.');
  await expect(page.locator('.skip')).toBeVisible();
  await page.waitForTimeout(1200); // chevrons mid-drift
  expect(await hero(page, 'state')).toBe(0);
  await shot(page, info, 'state0');
});

test('state 1: drag scrubs, mid-scrub and fully open', async ({ page }, info) => {
  await page.goto('/');
  await waitFrames(page);
  const p = await lidPoint(page);
  const d = await startDrag(page, info, p);
  const stop = await startFpsProbe(page);
  // 8 px slop, then 110 px of travel = 50%.
  await dragBy(d, p, 8, 2);
  await dragBy(d, { x: p.x, y: p.y - 8 }, 110, 30);
  metrics.scrub = await stop();
  const mid = await hero(page, 'progress');
  expect(mid).toBeGreaterThan(0.45);
  expect(mid).toBeLessThan(0.55);
  await shot(page, info, 'state1-midscrub');
  await d.end(); // past 40%: snaps open
  await page.waitForFunction(() => window.__zoeHero.state === 1, null, { timeout: 3000 });
  await page.waitForTimeout(1600); // screen, stack and narration settle
  await expect(page.locator('.narration')).toHaveText('ZOE runs on the laptop you already own.');
  await shot(page, info, 'state1-open');
});

test('release below 40% snaps shut', async ({ page }, info) => {
  await page.goto('/');
  await waitFrames(page);
  const p = await lidPoint(page);
  const d = await startDrag(page, info, p);
  await dragBy(d, p, 8, 2);
  await dragBy(d, { x: p.x, y: p.y - 8 }, 60, 12); // ~27%
  await page.waitForTimeout(250); // finger rests: not a flick
  await d.end();
  await page.waitForTimeout(700);
  expect(await hero(page, 'state')).toBe(0);
  expect(await hero(page, 'progress')).toBe(0);
});

test('a quick upward flick opens from under 40%', async ({ page }, info) => {
  await page.goto('/');
  await waitFrames(page);
  const p = await lidPoint(page);
  const d = await startDrag(page, info, p);
  await dragBy(d, p, 75, 3); // ~30%, released while moving (~0.75 px/ms under CDP touch)
  await d.end();
  await page.waitForFunction(() => window.__zoeHero.state === 1, null, { timeout: 3000 });
});

test('one large pointer move still scrubs (no distance lost to the tap slop)', async ({ page }, info) => {
  await page.goto('/');
  await waitFrames(page);
  const p = await lidPoint(page);
  const d = await startDrag(page, info, p);
  await d.move(p.x, p.y - 118); // 110 px past the slop = 50%
  const prog = await hero(page, 'progress');
  expect(prog).toBeGreaterThan(0.45);
  await d.end();
});

test('tap / click plays the opening in about 0.9 s', async ({ page }, info) => {
  await page.goto('/');
  await waitFrames(page);
  const p = await lidPoint(page);
  const stop = await startFpsProbe(page);
  const t0 = Date.now();
  if (info.project.use.hasTouch) await page.touchscreen.tap(p.x, p.y);
  else await page.mouse.click(p.x, p.y);
  await page.waitForFunction(() => window.__zoeHero.state === 1, null, { timeout: 3000 });
  metrics.play_ms = Date.now() - t0;
  metrics.play = await stop();
});

test('desktop: a wheel tick opens the lid', async ({ page }, info) => {
  test.skip(info.project.name !== 'wide');
  await page.goto('/');
  await waitFrames(page);
  await page.mouse.move(700, 400);
  await page.mouse.wheel(0, 100);
  await page.waitForFunction(() => window.__zoeHero.state === 1, null, { timeout: 3000 });
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});

test('desktop: ArrowUp opens the lid; Tab + Enter opens it too', async ({ page }, info) => {
  test.skip(info.project.name !== 'wide');
  await page.goto('/');
  await waitFrames(page);
  await page.keyboard.press('ArrowUp');
  await page.waitForFunction(() => window.__zoeHero.state === 1, null, { timeout: 3000 });
  await page.goto('/');
  await waitFrames(page);
  await page.keyboard.press('Tab');
  await expect(page.locator('.lid-hit')).toBeFocused();
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.__zoeHero.state === 1, null, { timeout: 3000 });
});

test('auto-opens after 6 s idle', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(5000);
  expect(await hero(page, 'state')).toBe(0);
  await page.waitForFunction(() => window.__zoeHero.state === 1, null, { timeout: 3500 });
});

test('skip link scrolls to #how', async ({ page }) => {
  await page.goto('/');
  await page.locator('.skip').click();
  await page.waitForTimeout(1200);
  const top = await page.locator('#how').evaluate((el) => el.getBoundingClientRect().top);
  expect(Math.abs(top)).toBeLessThan(4);
});

test('reduced motion: lid pre-opened', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.waitForTimeout(600);
  await expect(page.locator('.stage')).toHaveAttribute('data-state', '1');
  await shot(page, info, 'reduced-motion');
});

test('no JavaScript: open frame and the narration line', async ({ browser }, info) => {
  const { viewport, deviceScaleFactor, isMobile, hasTouch } = info.project.use;
  const ctx = await browser.newContext({ viewport, deviceScaleFactor, isMobile, hasTouch, javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(process.env.BASE_URL || 'http://127.0.0.1:8000/');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SHOTS, `${info.project.name}-noscript.png`) });
  await ctx.close();
});

test('first paint on throttled 4G, total transfer', async ({ page }, info) => {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  // Lighthouse's mobile profile: 150 ms RTT, 1.6 Mbps down, 750 kbps up.
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8,
  });
  let bytes = 0;
  const byType = {};
  cdp.on('Network.loadingFinished', (e) => { bytes += e.encodedDataLength; });
  cdp.on('Network.responseReceived', (e) => { byType[e.requestId] = e.response.url.replace(/^.*\/\/[^/]+\//, ''); });
  await page.goto('/', { waitUntil: 'commit' });
  const paint = await page.evaluate(() => new Promise((resolve) => {
    const out = {};
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) out[e.name] = Math.round(e.startTime);
    }).observe({ type: 'paint', buffered: true });
    new PerformanceObserver((l) => {
      const e = l.getEntries().pop();
      out.lcp = Math.round(e.startTime);
      out.lcp_element = e.element ? e.element.className || e.element.tagName : '';
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    addEventListener('load', () => setTimeout(() => resolve(out), 300));
  }));
  await waitFrames(page);
  const framesReadyMs = await page.evaluate(() => Math.round(performance.now()));
  await page.waitForTimeout(500);
  metrics.throttled = {
    profile: '150 ms RTT, 1.6 Mbps (Lighthouse mobile)',
    first_contentful_paint_ms: paint['first-contentful-paint'],
    lcp_ms: paint.lcp,
    lcp_element: paint.lcp_element,
    all_frames_decoded_ms: framesReadyMs,
    total_transfer_kb: Math.round(bytes / 1024),
    requests: Object.keys(byType).length,
  };
});

// A recording of the run (WebM; there is no GIF encoder on this machine).
test('record the run', async ({ browser }, info) => {
  const { viewport, deviceScaleFactor, isMobile, hasTouch } = info.project.use;
  const dir = path.join(SHOTS, `video-${info.project.name}`);
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, isMobile, hasTouch, recordVideo: { dir, size: viewport } });
  const page = await ctx.newPage();
  await page.goto(process.env.BASE_URL || 'http://127.0.0.1:8000/');
  await waitFrames(page);
  await page.waitForTimeout(1500);
  const p = await lidPoint(page);
  const d = await startDrag(page, info, p);
  await dragBy(d, p, 8, 2);
  await dragBy(d, { x: p.x, y: p.y - 8 }, 70, 40);      // slow scrub up
  await page.waitForTimeout(500);
  await dragBy(d, { x: p.x, y: p.y - 78 }, -40, 20);    // and back down a little
  await dragBy(d, { x: p.x, y: p.y - 38 }, 80, 40);     // then past 40%
  await page.waitForTimeout(300);
  await d.end();
  await page.waitForTimeout(2500);
  const video = page.video();
  await ctx.close();
  fs.renameSync(await video.path(), path.join(SHOTS, `${info.project.name}-run.webm`));
  fs.rmSync(dir, { recursive: true, force: true });
});
