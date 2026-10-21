// Drives the five-act hero at both viewports: screenshots into shots/<project>-<name>.png,
// measurements into shots/<project>-metrics.json, a WebM of the untouched run, and
// the acceptance rows that can be checked in emulation.
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');

const ROOT = path.join(__dirname, '..');
const SHOTS = path.join(ROOT, 'shots');
fs.mkdirSync(SHOTS, { recursive: true });
const BASE = process.env.BASE_URL || 'http://127.0.0.1:8000/';

const shot = (page, info, name) =>
  page.screenshot({ path: path.join(SHOTS, `${info.project.name}-${name}.png`) });
const hero = (page, prop) => page.evaluate((p) => window.__zoeHero[p], prop);
const isWide = (info) => info.project.name === 'wide';

// Restricted words for the page, its CSS, its JS and their comments ({re, cs: case-sensitive}).
// Stored encoded so this file does not itself put the words into the public repo.
const RESTRICTED = JSON.parse(Buffer.from('W3sicmUiOiAiXFxiR0xpTkVSXFxiIiwgImNzIjogZmFsc2V9LCB7InJlIjogIlxcYkdlbW1hXFxiIiwgImNzIjogZmFsc2V9LCB7InJlIjogIlxcYk9jdGVuXFxiIiwgImNzIjogZmFsc2V9LCB7InJlIjogIlxcYlRlc3NlcmFjdFxcYiIsICJjcyI6IGZhbHNlfSwgeyJyZSI6ICJcXGJSQUdcXGIiLCAiY3MiOiB0cnVlfSwgeyJyZSI6ICJcXGJNQ1BcXGIiLCAiY3MiOiB0cnVlfSwgeyJyZSI6ICJcXGJORVJcXGIiLCAiY3MiOiB0cnVlfSwgeyJyZSI6ICJcXGJPQ1JcXGIiLCAiY3MiOiB0cnVlfSwgeyJyZSI6ICJcXGJ2ZWN0b3IiLCAiY3MiOiBmYWxzZX0sIHsicmUiOiAiXFxiZW1iZWRkaW5nIiwgImNzIjogZmFsc2V9LCB7InJlIjogInRvb2wgY2FsbCIsICJjcyI6IGZhbHNlfSwgeyJyZSI6ICJcXGJkZW5zZVxcYiIsICJjcyI6IGZhbHNlfSwgeyJyZSI6ICJcXGJzcGFyc2VcXGIiLCAiY3MiOiBmYWxzZX0sIHsicmUiOiAiXFxiQXJjdGljXFxiIiwgImNzIjogdHJ1ZX0sIHsicmUiOiAiU3BpZGVyID93ZWIiLCAiY3MiOiBmYWxzZX0sIHsicmUiOiAiU3BpZGVyIEdyYXBoIiwgImNzIjogZmFsc2V9LCB7InJlIjogIk1hdHJ5b3Noa2EiLCAiY3MiOiBmYWxzZX0sIHsicmUiOiAiXFxiU01GVlxcYiIsICJjcyI6IHRydWV9LCB7InJlIjogIk1pc3Npb24gW0FCQ1JdXFxiIiwgImNzIjogZmFsc2V9LCB7InJlIjogInRoZSBzcGluZSIsICJjcyI6IGZhbHNlfSwgeyJyZSI6ICJcXGJDKD86MTB8WzAtOV0pXFxiIiwgImNzIjogdHJ1ZX0sIHsicmUiOiAiV2lsbGlhbSBXYXkiLCAiY3MiOiBmYWxzZX0sIHsicmUiOiAiXFxiTGl0ZVxcYiIsICJjcyI6IHRydWV9LCB7InJlIjogIlxcYlByb1xcYiIsICJjcyI6IHRydWV9LCB7InJlIjogIlxcYjRCXFxiIiwgImNzIjogdHJ1ZX0sIHsicmUiOiAiemVybyB0cnVzdCIsICJjcyI6IGZhbHNlfSwgeyJyZSI6ICJoYWxsdWNpbmF0IiwgImNzIjogZmFsc2V9LCB7InJlIjogIlxcYm9ubHlcXGIiLCAiY3MiOiBmYWxzZX0sIHsicmUiOiAiXFxiQm9hdFxcYiIsICJjcyI6IHRydWV9LCB7InJlIjogIlxcYktpdGNoZW5cXGIiLCAiY3MiOiB0cnVlfSwgeyJyZSI6ICJcXGJzY2FubmVkXFxiIiwgImNzIjogZmFsc2V9LCB7InJlIjogIlxcYmlQaG9uZSIsICJjcyI6IGZhbHNlfSwgeyJyZSI6ICJcXGJ0YWJsZXQiLCAiY3MiOiBmYWxzZX0sIHsicmUiOiAiemVybyBoYWxsdWNpbmF0aW9ucyIsICJjcyI6IGZhbHNlfV0=', 'base64').toString());
// The hero's one device: allowed in the hero's Act I text (its no-JS line), forbidden below the hero and on the other pages.
const PHONE = JSON.parse(Buffer.from('eyJyZSI6ICJcXGJwaG9uZXM/XFxiIiwgImFsbG93ZWRUZXh0IjogWyJ0aGUgcGhvbmUgaGFuZHMgaXQgdG8gdGhlIGxhcHRvcCJdfQ==', 'base64').toString());
// Product names: the four frontier products under the cloud, in hero.js's PROVIDERS block and nowhere else.
const PRODUCTS = JSON.parse(Buffer.from('eyJhbGxvd2VkSW4iOiAiaGVyby5qcyIsICJmcm9tIjogIi8vIFRoZSBmcm9udGllciBtb2RlbHMgbmFtZWQgdW5kZXIgdGhlIGNsb3VkIiwgInRvIjogIl07IiwgImFsbG93ZWQiOiBbIkNoYXRHUFQiLCAiQ2xhdWRlIiwgIkdlbWluaSIsICJDb3BpbG90Il0sICJmb3JiaWRkZW4iOiBbIlxcYkdQVC0/XFxkIiwgIlxcYkxsYW1hXFxiIiwgIlxcYk1pc3RyYWxcXGIiLCAiXFxiR3Jva1xcYiIsICJcXGJCYXJkXFxiIiwgIlxcYlNvbm5ldFxcYiIsICJcXGJPcHVzXFxiIiwgIlxcYkhhaWt1XFxiIiwgIlxcYkZhYmxlXFxiIiwgIlxcYkRlZXBTZWVrXFxiIiwgIlxcYlF3ZW5cXGIiXX0=', 'base64').toString());
const SITE_FILES = ['index.html', 'styles.css', 'hero.js', 'pages.css', 'book-demo.html', 'nda.html',
  'tools/playwright.config.js', 'tools/make-site-images.js', 'tools/record-gif.js'];
const SECTIONS = ['how', 'dataflow', 'workflows', 'evidence', 'why', 'servers', 'founder', 'advisory', 'contact', 'site-footer'];

// All-caps words allowed on screen: AI and PII, plus names, mask tokens and emphasis that are not acronyms.
const CAPS_OK = new Set(['AI', 'PII', 'ZOE', 'LLC', 'LP', 'EIN', 'ORG', 'PERSON', 'ADDRESS', 'ON', 'OFF', 'NO',
  'THEIR', 'OFFICE', 'MINUTES', 'TERM', 'SHEET', 'MASKED', 'INFORMATION', 'MATTER']);

async function open(page) {
  await page.goto('/');
  await page.waitForFunction(() => window.__zoeHero && window.__zoeHero.act >= 1);
}

const waitGesture = (page, name, timeout = 30000) =>
  page.waitForFunction((n) => window.__zoeHero.gesture === n, name, { timeout });

// Performs gestures (as a tap or click) until the story reaches `name` or the end.
async function runTo(page, name) {
  for (;;) {
    const g = await hero(page, 'gesture');
    if (name && g === name) return;
    if (await hero(page, 'ended')) return;
    if (g) {
      if (g === 'lid') await page.waitForFunction(() => window.__zoeHero.framesReady, null, { timeout: 20000 });
      await page.evaluate(() => window.__zoeHero.perform('tap'));
    }
    await page.waitForTimeout(120);
  }
}

async function runToEnd(page) {
  await runTo(page, null);
  await page.waitForFunction(() => window.__zoeHero.ended > 0, null, { timeout: 120000 });
}

async function center(page, sel) {
  const b = await page.locator(sel).first().boundingBox();
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
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

async function dragPath(d, from, to, steps) {
  for (let i = 1; i <= steps; i += 1) {
    await d.move(from.x + ((to.x - from.x) * i) / steps, from.y + ((to.y - from.y) * i) / steps);
  }
}

async function tapAt(page, p) {
  if (await page.evaluate(() => matchMedia('(hover: none)').matches)) await page.touchscreen.tap(p.x, p.y);
  else await page.mouse.click(p.x, p.y);
}

async function lidPoint(page) {
  const box = await page.locator('.scene').boundingBox();
  return { x: box.x + box.width * 0.5, y: box.y + box.height * 0.66 };
}

async function toLid(page) {
  await open(page);
  await runTo(page, 'lid');
  await page.waitForFunction(() => window.__zoeHero.framesReady, null, { timeout: 20000 });
  await page.waitForTimeout(900); // the camera settles on the laptop
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

// Logs Wi-Fi state changes and spoken lines with timestamps.
async function startJournal(page) {
  await page.evaluate(() => {
    window.__journal = [];
    const log = (k, v) => window.__journal.push({ t: performance.now(), k, v });
    const live = document.getElementById('live');
    new MutationObserver(() => log('line', live.textContent)).observe(live, { childList: true, characterData: true, subtree: true });
    let last = '';
    new MutationObserver(() => {
      const w = document.querySelector('.wifi');
      const v = w ? (w.classList.contains('is-off') ? 'off' : 'on') : '';
      if (v && v !== last) { last = v; log('wifi', v); }
    }).observe(document.querySelector('.screen'), { attributes: true, subtree: true, childList: true });
  });
}

const metrics = {};
test.afterAll(async ({}, info) => {
  const file = path.join(SHOTS, `${info.project.name}-metrics.json`);
  const prev = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
  fs.writeFileSync(file, JSON.stringify(Object.assign(prev, metrics), null, 2));
});

test('restricted words: none in the page, CSS, JS or comments', async ({}, info) => {
  test.skip(!isWide(info), 'checked once');
  const hits = [];
  for (const f of SITE_FILES) {
    const text = fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/data:image\/webp;base64,[^"]+/, '');
    RESTRICTED.forEach(({ re, cs }) => {
      const m = text.match(new RegExp(re, cs ? 'g' : 'gi'));
      if (m) hits.push(`${f}: ${m[0]}`);
    });
  }
  expect(hits).toEqual([]);
});

test('product names: the four under the cloud, there and nowhere else', async ({}, info) => {
  test.skip(!isWide(info), 'checked once');
  const hits = [];
  for (const f of SITE_FILES) {
    let text = fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/data:image\/webp;base64,[^"]+/, '');
    if (f === PRODUCTS.allowedIn) {
      const a = text.indexOf(PRODUCTS.from);
      const b = text.indexOf(PRODUCTS.to, a);
      expect(a).toBeGreaterThan(-1);
      text = text.slice(0, a) + text.slice(b);
    }
    PRODUCTS.allowed.concat(PRODUCTS.forbidden).forEach((w) => {
      const re = new RegExp(w.startsWith('\\') ? w : `\\b${w}\\b`, 'g');
      const m = text.match(re);
      if (m) hits.push(`${f}: ${m[0]}`);
    });
  }
  expect(hits).toEqual([]);
});

test('phone: named in the hero\'s Act I text and nowhere else', async ({}, info) => {
  test.skip(!isWide(info), 'checked once');
  const re = new RegExp(PHONE.re, 'gi');
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const below = html.slice(html.indexOf('<section class="sec" id="how"'));
  expect(below.match(re) || []).toEqual([]);
  for (const f of ['book-demo.html', 'nda.html', 'pages.css']) {
    expect(fs.readFileSync(path.join(ROOT, f), 'utf8').match(re) || []).toEqual([]);
  }
  // In the page's text and labels (class names and code aside), the allowed lines are the only mentions.
  const text = html.replace(/<(script|style)[\s\S]*?<\/\1>/g, '').replace(/\sclass="[^"]*"/g, '').replace(/<[^>]*?>/g, (tag) => (tag.match(/(?:aria-label|alt|title)="[^"]*"/g) || []).join(' '));
  let rest = text;
  PHONE.allowedText.forEach((t) => { rest = rest.split(t).join(''); });
  expect(rest.match(re) || []).toEqual([]);
});

test('Act I: chat types in under 7 s (measured 6.2 s), pops land, term sheet and phone arrive', async ({ page }, info) => {
  await page.goto('/');
  const t0 = await page.evaluate(() => performance.now());
  await page.waitForFunction(() => {
    const m = document.querySelectorAll('.strip .msg');
    return m.length === 3 && m[2].textContent.endsWith('10 MINUTES.');
  }, null, { timeout: 8000 });
  metrics.act1_chat_ms = Math.round((await page.evaluate(() => performance.now())) - t0);
  expect(metrics.act1_chat_ms).toBeLessThan(7000);
  const pops = await page.$$eval('.strip .em.is-pop', (els) => els.map((e) => e.textContent));
  expect(pops).toEqual(['THEIR OFFICE', '10 MINUTES']);
  await expect(page.locator('.sheet')).toHaveClass(/is-in/);
  await expect(page.locator('.phone')).toHaveClass(/is-in/);
  await page.waitForTimeout(600);
  await shot(page, info, 'act1');
});

test('Act I: drag the phone onto the term sheet, then into the laptop', async ({ page }, info) => {
  await open(page);
  await waitGesture(page, 'phone');
  await page.waitForTimeout(700);
  const from = await center(page, '.phone');
  const sheetC = await center(page, '.sheet');
  const sheetBox = await page.locator('.sheet').boundingBox();
  const d = await startDrag(page, info, from);
  // Over the page's edge: the viewfinder shows the paper beneath as the camera sees it,
  // scaled by --vk about the screen's centre and aligned with the real page.
  const edge = isWide(info)
    ? { x: sheetBox.x + sheetBox.width + 20, y: sheetC.y }
    : { x: sheetC.x + 10, y: sheetBox.y + sheetBox.height + 20 };
  await dragPath(d, from, edge, 16);
  await expect(page.locator('.phone')).not.toHaveClass(/is-snapped/);
  const viewBox = await page.locator('.phone-view').boundingBox();
  const scr = await page.locator('.phone-screen').boundingBox();
  const k = await page.evaluate(() => parseFloat(document.querySelector('.phone').style.getPropertyValue('--vk')));
  const c = { x: scr.x + scr.width / 2, y: scr.y + scr.height / 2 };
  expect(Math.abs(viewBox.x - (c.x + k * (sheetBox.x - c.x)))).toBeLessThan(3);
  expect(Math.abs(viewBox.y - (c.y + k * (sheetBox.y - c.y)))).toBeLessThan(3);
  expect(Math.abs(viewBox.width - k * sheetBox.width)).toBeLessThan(3);
  await shot(page, info, 'act1-viewfinder');
  // Record whether the captured card flies on the bump.
  await page.evaluate(() => {
    const f = document.querySelector('.fly');
    window.__flew = false;
    const tick = () => { if (f.getAnimations().length) window.__flew = true; else requestAnimationFrame(tick); };
    tick();
  });
  await dragPath(d, edge, sheetC, 8);
  await expect(page.locator('.phone')).toHaveClass(/is-snapped/);
  // The photo settles inside the phone, fully within its screen.
  await page.waitForTimeout(700);
  const shotBox = await page.locator('.phone-view').boundingBox();
  const scr2 = await page.locator('.phone-screen').boundingBox();
  expect(shotBox.x).toBeGreaterThanOrEqual(scr2.x - 1);
  expect(shotBox.x + shotBox.width).toBeLessThanOrEqual(scr2.x + scr2.width + 1);
  expect(shotBox.y + shotBox.height).toBeLessThanOrEqual(scr2.y + scr2.height + 1);
  await page.waitForTimeout(150);
  await shot(page, info, 'act1-snap');
  const lap = await page.locator('.scene').boundingBox();
  const target = { x: lap.x + lap.width * 0.5, y: lap.y + lap.height * 0.66 };
  await dragPath(d, sheetC, target, 20);
  await d.end();
  await page.waitForFunction(() => parseFloat(getComputedStyle(document.querySelector('.transfer')).opacity) > 0.95, null, { timeout: 4000 });
  await page.waitForTimeout(300);
  const px = await page.$eval('.transfer', (el) => parseFloat(getComputedStyle(el).fontSize));
  expect(px).toBeGreaterThanOrEqual(13);
  await shot(page, info, 'act1-transfer');
  await waitGesture(page, 'lid', 8000);
  await expect(page.locator('.phone')).toBeHidden({ timeout: 3000 });
  expect(await page.evaluate(() => window.__flew)).toBe(true);
});

test('Act I: a tap on the phone performs both moves', async ({ page }) => {
  await open(page);
  await waitGesture(page, 'phone');
  await page.waitForTimeout(700);
  await tapAt(page, await center(page, '.phone'));
  await waitGesture(page, 'lid', 8000);
});

test('Act II: the lid scrubs under the finger, mid-scrub and open', async ({ page }, info) => {
  await toLid(page);
  await shot(page, info, 'act2');
  const p = await lidPoint(page);
  const d = await startDrag(page, info, p);
  const stop = await startFpsProbe(page);
  await dragPath(d, p, { x: p.x, y: p.y - 8 }, 2);
  await dragPath(d, { x: p.x, y: p.y - 8 }, { x: p.x, y: p.y - 168 }, 40); // 160 px past the slop = 50% of 320
  metrics.lid_scrub = await stop();
  const lag = await hero(page, 'progress');
  await page.waitForTimeout(400); // the lid catches up with the finger
  metrics.lid_trail = +lag.toFixed(3);
  const mid = await hero(page, 'progress');
  expect(mid).toBeGreaterThan(0.45);
  expect(mid).toBeLessThan(0.55);
  await shot(page, info, 'act2-midscrub');
  await d.end();
  await waitGesture(page, 'mark', 8000);
  await page.waitForTimeout(1000);
  await shot(page, info, 'act2-open');
});

test('Act II: release below 40% snaps shut; a quick flick opens', async ({ page }, info) => {
  await toLid(page);
  const p = await lidPoint(page);
  let d = await startDrag(page, info, p);
  await dragPath(d, p, { x: p.x, y: p.y - 68 }, 14);
  await page.waitForTimeout(400);
  await d.end();
  await page.waitForTimeout(1400);
  expect(await hero(page, 'progress')).toBe(0);
  expect(await hero(page, 'gesture')).toBe('lid');
  d = await startDrag(page, info, p);
  await dragPath(d, p, { x: p.x, y: p.y - 75 }, 3);
  await d.end();
  await waitGesture(page, 'mark', 8000);
});

test('Act II: tap opens the lid in about 1.8 s', async ({ page }) => {
  await toLid(page);
  const p = await lidPoint(page);
  const t0 = Date.now();
  await tapAt(page, p);
  await page.waitForFunction(() => window.__zoeHero.progress === 1, null, { timeout: 4000 });
  metrics.lid_play_ms = Date.now() - t0;
});

test('Act II, desktop: a wheel tick opens the lid without scrolling; so does ArrowUp', async ({ page }, info) => {
  test.skip(!isWide(info));
  await toLid(page);
  await page.mouse.move(700, 400);
  await page.mouse.wheel(0, 100);
  await page.waitForFunction(() => window.__zoeHero.progress === 1, null, { timeout: 4000 });
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await toLid(page);
  await page.keyboard.press('ArrowUp');
  await page.waitForFunction(() => window.__zoeHero.progress === 1, null, { timeout: 4000 });
});

test('Acts III-IV: Wi-Fi OFF before ZOE speaks, marking, scrub, ON after "Data cleaned"', async ({ page }, info) => {
  await open(page);
  await startJournal(page);
  await runTo(page, 'mark');
  await page.waitForTimeout(1300);
  await shot(page, info, 'act3');
  const stop = await startFpsProbe(page);
  await page.locator('.btn-mark').click();
  await page.waitForTimeout(1000);
  await shot(page, info, 'act3-sweep');
  await page.waitForFunction(() => Array.from(document.querySelectorAll('.editor > .ed-page .pii')).every((e) => e.classList.contains('is-amber')), null, { timeout: 15000 });
  metrics.sweep = await stop();
  metrics.pii_items = await page.$$eval('.editor > .ed-page .pii', (els) => els.length);
  expect(metrics.pii_items).toBeGreaterThanOrEqual(19);
  // Contract text renders at 13 px or more (font size x camera scale).
  const px = await page.evaluate(() => {
    const p = document.querySelector('.editor > .ed-page');
    const s = parseFloat(document.querySelector('.scene').style.getPropertyValue('--cam-s')) || 1;
    return +(parseFloat(getComputedStyle(p).fontSize) * s).toFixed(1);
  });
  metrics.contract_px = px;
  expect(px).toBeGreaterThanOrEqual(13);
  await waitGesture(page, 'scrub');
  await page.waitForTimeout(1300);
  await shot(page, info, 'act3-ready');
  await page.locator('.btn-scrub').click();
  await page.waitForFunction(() => Array.from(document.querySelectorAll('.editor > .ed-page .pii')).every((e) => e.classList.contains('is-masked')), null, { timeout: 15000 });
  await page.waitForTimeout(500);
  await shot(page, info, 'act4-scrub');
  const masked = await page.$$eval('.editor > .ed-page .pii', (els) => els.map((e) => e.textContent));
  ['[ORG_1]', '[ORG_2]', '[ORG_3]', '[ORG_4]', '[ORG_5]', '[PERSON_1]', '[PERSON_2]', '[ADDRESS_1]', '[ADDRESS_2]', '$18,200,000'].forEach((t) => expect(masked).toContain(t));
  expect(masked).not.toContain('[ORG_6]'); // the parent is not on the sheet: that is the catch
  const pageText = await page.$eval('.editor > .ed-page', (el) => el.textContent);
  expect(pageText).not.toMatch(/Kestrel|Meridian|Okonkwo|Harborline|Lakeshore|Vantage|Daniel Park|45,000,000|84-2219876|4417-0093/);
  expect(pageText).toMatch(/limited liability company/); // generic deal language stays
  const stop2 = await startFpsProbe(page);
  await page.waitForFunction(() => document.querySelector('.stream-label').classList.contains('is-on'), null, { timeout: 8000 });
  await page.waitForTimeout(900);
  await shot(page, info, 'act4-stream');
  metrics.stream = await stop2();
  metrics.label_px = await page.$eval('.stream-label', (el) => parseFloat(getComputedStyle(el).fontSize));
  expect(metrics.label_px).toBeGreaterThanOrEqual(16);
  const j = await page.evaluate(() => window.__journal);
  const firstZoe = j.find((e) => e.k === 'line' && e.v.startsWith('ZOE:'));
  const firstOff = j.find((e) => e.k === 'wifi' && e.v === 'off');
  const cleaned = j.find((e) => e.k === 'line' && e.v.includes('Data cleaned'));
  const firstOn = j.find((e) => e.k === 'wifi' && e.v === 'on' && e.t > firstOff.t);
  expect(firstOff.t).toBeLessThan(firstZoe.t);
  expect(firstOn.t).toBeGreaterThanOrEqual(cleaned.t);
});

test('Act IV: the catch is spoken by ZOE, the fix by the cloud, then the rehydration snap', async ({ page }, info) => {
  await open(page);
  await startJournal(page);
  await runTo(page, 'scrub');
  await page.evaluate(() => window.__zoeHero.perform('click'));
  await page.waitForFunction(() => document.querySelector('.zoe-say').textContent.includes('empty shell'), null, { timeout: 20000 });
  await page.waitForTimeout(700);
  await shot(page, info, 'act4-catch');
  await page.waitForFunction(() => document.querySelector('.packet').classList.contains('is-in'), null, { timeout: 8000 });
  await page.waitForTimeout(400);
  await expect(page.locator('.stream-label')).toHaveClass(/is-on/);
  await shot(page, info, 'act4-packet');
  await page.waitForFunction(() => document.querySelector('.draft').classList.contains('is-in'), null, { timeout: 12000 });
  await page.waitForTimeout(350);
  const before = await page.$eval('.draft', (el) => el.textContent);
  expect(before).toContain('[ORG_6] (Parent Guarantor)');
  expect(before).toContain('$18,200,000');
  await shot(page, info, 'act4-draft-masked');
  await page.waitForFunction(() => document.querySelector('.draft').textContent.includes('Meridian Holdings LLC (Parent Guarantor)'), null, { timeout: 3000 });
  expect(await page.$eval('.draft', (el) => el.textContent)).toContain('$45,000,000');
  await page.waitForTimeout(400);
  await shot(page, info, 'act4-rehydrated');
  const lines = (await page.evaluate(() => window.__journal)).filter((e) => e.k === 'line').map((e) => e.v);
  expect(lines.find((l) => l.includes('empty shell'))).toMatch(/^ZOE:/);
  expect(lines.find((l) => l.includes('parent guaranty'))).toMatch(/^Frontier AI:/);
});

test('Act V: pills, inspect view, how-it-works scroll, replay twice, analytics', async ({ page }, info) => {
  test.setTimeout(500000);
  const events = [];
  page.on('console', (m) => { const t = m.text(); if (t.startsWith('[track]')) events.push(t.split(' ')[1]); });
  await open(page);
  await runToEnd(page);
  await page.waitForTimeout(700);
  await shot(page, info, 'act5');
  // Text across the stage (as written, before CSS capitals): no acronyms but AI and PII (names and tokens excepted).
  const stageText = await page.evaluate(() => document.querySelector('.stage').textContent);
  await page.locator('.pill', { hasText: 'Inspect' }).click();
  await page.waitForTimeout(600);
  await expect(page.locator('.insp-col').first()).toContainText('Kestrel Robotics Inc.');
  await expect(page.locator('.insp-col.is-out')).toContainText('[ORG_1]');
  await expect(page.locator('.insp-col.is-out')).not.toContainText('Kestrel Robotics');
  await expect(page.locator('.timeline')).toContainText('Wi-Fi OFF');
  await shot(page, info, 'inspect');
  const inspectText = await page.evaluate(() => document.querySelector('.inspect').textContent);
  const caps = Array.from(new Set(`${stageText} ${inspectText}`.match(/\b[A-Z]{2,}\b/g) || [])).filter((w) => !CAPS_OK.has(w));
  expect(caps).toEqual([]);
  await page.locator('.insp-back .pill').click();
  await page.waitForTimeout(500);
  await expect(page.locator('.inspect')).toBeHidden();
  await page.locator('.pill', { hasText: 'How does it work' }).click();
  await page.waitForTimeout(1300);
  const top = await page.locator('#how').evaluate((el) => el.getBoundingClientRect().top);
  expect(Math.abs(top)).toBeLessThan(4);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(800);
  await expect(page.locator('.pill', { hasText: 'Replay' })).toBeInViewport();
  for (let i = 0; i < 2; i += 1) {
    await page.locator('.pill', { hasText: 'Replay' }).click();
    await page.waitForTimeout(400);
    const clean = await page.evaluate(() => ({
      act: window.__zoeHero.act,
      screenHidden: document.querySelector('.screen').hidden,
      pills: document.querySelectorAll('.pills .pill').length,
      progress: window.__zoeHero.progress,
      camera: window.__zoeHero.camera,
      cloud: document.querySelector('.cloud').classList.contains('is-in'),
      phoneHidden: document.querySelector('.phone').hidden,
    }));
    expect(clean).toEqual({ act: 1, screenHidden: true, pills: 0, progress: 0, camera: 'home', cloud: false, phoneHidden: false });
    await runToEnd(page);
    await page.waitForTimeout(700);
  }
  await shot(page, info, 'act5-after-two-replays');
  for (const ev of ['phone_snapped', 'lid_opened', 'marked', 'scrubbed', 'reached_cloud', 'pill_inspect', 'pill_how', 'pill_replay', 'deep_dive_reached']) {
    expect(events).toContain(ev);
  }
});

test('untouched: the story plays through by itself in about 127 s (recorded)', async ({ browser }, info) => {
  test.setTimeout(280000);
  const { viewport, isMobile, hasTouch } = info.project.use;
  const dir = path.join(SHOTS, `video-${info.project.name}`);
  const ctx = await browser.newContext({ viewport, isMobile, hasTouch, deviceScaleFactor: 1, recordVideo: { dir, size: viewport } });
  const page = await ctx.newPage();
  await page.goto(BASE);
  await page.waitForFunction(() => window.__zoeHero.ended > 0, null, { timeout: 170000 });
  metrics.untouched_ms = await hero(page, 'ended');
  await page.waitForTimeout(1500);
  const video = page.video();
  await ctx.close();
  fs.renameSync(await video.path(), path.join(SHOTS, `${info.project.name}-run-untouched.webm`));
  fs.rmSync(dir, { recursive: true, force: true });
  expect(metrics.untouched_ms).toBeGreaterThan(115000);
  expect(metrics.untouched_ms).toBeLessThan(140000);
});

test('keyboard: Tab reaches each gesture and Enter performs it', async ({ page }, info) => {
  test.skip(!isWide(info));
  await open(page);
  await waitGesture(page, 'phone');
  await page.keyboard.press('Tab');
  await expect(page.locator('.phone')).toBeFocused();
  await page.keyboard.press('Enter');
  await waitGesture(page, 'lid', 8000);
  await page.waitForFunction(() => window.__zoeHero.framesReady);
  await expect(page.locator('.lid-hit')).toBeFocused();
  await page.keyboard.press('Enter');
  await waitGesture(page, 'mark', 8000);
  await expect(page.locator('.btn-mark')).toBeFocused();
  await page.keyboard.press('Enter');
  await waitGesture(page, 'scrub', 40000);
  await expect(page.locator('.btn-scrub')).toBeFocused();
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.__zoeHero.act === 4);
  await expect(page.locator('#live')).toHaveAttribute('aria-live', 'polite');
  expect((await page.locator('#live').textContent()).length).toBeGreaterThan(0);
});

test('reduced motion: five stills, advanced by the Next pill', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page);
  for (let i = 1; i <= 6; i += 1) {
    await page.waitForTimeout(300);
    await shot(page, info, `reduced-motion-${i}`);
    const next = page.locator('.pill', { hasText: 'Next' });
    if (!(await next.count())) break;
    await next.click();
  }
  expect(await hero(page, 'act')).toBe(5);
  await expect(page.locator('.pill', { hasText: 'Inspect' })).toBeVisible();
});

test('no JavaScript: open laptop and the five acts as text, matching hero.js', async ({ browser }, info) => {
  const { viewport, deviceScaleFactor, isMobile, hasTouch } = info.project.use;
  const ctx = await browser.newContext({ viewport, deviceScaleFactor, isMobile, hasTouch, javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(BASE);
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SHOTS, `${info.project.name}-noscript.png`), fullPage: true });
  const noscript = await page.evaluate(() => Array.from(document.querySelectorAll('noscript')).map((n) => n.textContent).join(' '));
  const src = fs.readFileSync(path.join(ROOT, 'hero.js'), 'utf8');
  const start = src.indexOf('const LINES = {');
  const block = src.slice(start, src.indexOf('};', start));
  const lines = Array.from(block.matchAll(/^\s+\w+:\s+(['"])(.*)\1,$/gm)).map((m) => m[2].replace(/\*/g, '').replace(/\\'/g, "'"));
  expect(lines.length).toBeGreaterThan(20);
  lines.forEach((l) => expect(noscript).toContain(l));
  await ctx.close();
});

test('below the hero: every section, both modals, numbers and image sizes', async ({ page }, info) => {
  const images = [];
  page.on('response', async (r) => {
    if (r.request().resourceType() === 'image') images.push({ url: r.url(), kb: Math.round((await r.body().catch(() => Buffer.alloc(0))).length / 1024) });
  });
  await page.goto('/');
  for (const id of SECTIONS) {
    await page.locator('#' + id).scrollIntoViewIfNeeded();
    await page.waitForTimeout(250);
    await page.locator('#' + id).screenshot({ path: path.join(SHOTS, `${info.project.name}-sec-${id}.png`) });
  }
  await page.waitForTimeout(800);
  // Every image the drawer loads is under 200 KB (the lid frames belong to the hero).
  const big = images.filter((i) => !/\/frames\//.test(i.url) && i.kb > 200);
  expect(big).toEqual([]);
  // Numbers that are claims: these and no others below the hero.
  const text = await page.evaluate((ids) => ids.map((id) => document.getElementById(id).textContent).join(' '), SECTIONS);
  const nums = Array.from(new Set(text.replace(/\[[A-Z]+_\d+\]/g, '').match(/\$?\d[\d,.]*(\s?GB|%\+?)?/g) || []));
  const allowed = ['99%+', '99%', '90%', '16 GB', '$0', '01', '02', '03', '2026'];
  expect(nums.filter((n) => !allowed.includes(n))).toEqual([]);
  for (const id of ['privacy', 'terms']) {
    await page.locator(`.site-footer a[href="#${id}"]`).click();
    await expect(page.locator('#' + id)).toBeVisible();
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(SHOTS, `${info.project.name}-modal-${id}.png`) });
    await page.keyboard.press('Escape');
    await expect(page.locator('#' + id)).toBeHidden();
  }
  const privacy = await page.locator('#privacy').textContent();
  ['no servers of its own', 'GitHub Pages', 'formsubmit.co', 'Google Sheets', 'Google Apps Script', 'No visitor analytics'].forEach((t) => expect(privacy).toContain(t));
  expect(privacy).not.toMatch(/private servers/);
});

test('the booking and NDA pages, on the new styles (nothing submitted)', async ({ browser }, info) => {
  const { viewport, deviceScaleFactor, isMobile, hasTouch } = info.project.use;
  const ctx = await browser.newContext({ viewport, deviceScaleFactor, isMobile, hasTouch });
  await ctx.route(/script\.google\.com|formsubmit\.co/, (r) => r.abort());
  const page = await ctx.newPage();
  await page.goto(BASE + 'book-demo.html');
  await expect(page.locator('link[href="pages.css"]')).toHaveCount(1);
  await page.screenshot({ path: path.join(SHOTS, `${info.project.name}-page-book-demo.png`), fullPage: true });
  await page.locator('.calendar-day:not(:disabled):not(.day-other-month):not(.day-weekend)').first().click();
  await expect(page.locator('#step-2')).toHaveClass(/active/);
  await page.locator('.time-slot').first().click();
  await expect(page.locator('#step-3')).toHaveClass(/active/);
  await page.screenshot({ path: path.join(SHOTS, `${info.project.name}-page-book-demo-step3.png`), fullPage: true });
  await ctx.addInitScript(() => sessionStorage.setItem('bookingData', JSON.stringify({ name: 'Test Visitor', email: 'test@example.test', date: '2026-10-28', time: '10:00 AM' })));
  const nda = await ctx.newPage();
  await nda.goto(BASE + 'nda.html');
  await nda.waitForTimeout(500);
  await expect(nda.locator('#nda-date')).toContainText('2026');
  await nda.screenshot({ path: path.join(SHOTS, `${info.project.name}-page-nda.png`), fullPage: true });
  await ctx.close();
});

test('first paint on throttled 4G, total transfer', async ({ page }) => {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  // Lighthouse's mobile profile: 150 ms RTT, 1.6 Mbps down, 750 kbps up.
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8,
  });
  let bytes = 0;
  let requests = 0;
  cdp.on('Network.loadingFinished', (e) => { bytes += e.encodedDataLength; requests += 1; });
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
  await page.waitForFunction(() => window.__zoeHero.framesReady, null, { timeout: 30000 });
  const framesReadyMs = await page.evaluate(() => Math.round(performance.now()));
  // Then the whole page: scroll through the drawer so every lazy image and the badge load.
  for (let y = 0; y < 30; y += 1) {
    await page.mouse.wheel(0, 900);
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(4000);
  metrics.throttled = {
    profile: '150 ms RTT, 1.6 Mbps (Lighthouse mobile)',
    first_contentful_paint_ms: paint['first-contentful-paint'],
    lcp_ms: paint.lcp,
    lcp_element: paint.lcp_element,
    all_frames_decoded_ms: framesReadyMs,
    total_transfer_kb: Math.round(bytes / 1024),
    requests,
  };
  expect(paint['first-contentful-paint']).toBeLessThan(1000);
  expect(bytes).toBeLessThan(2 * 1024 * 1024);
});
