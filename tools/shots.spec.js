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
// Allowed in the comparison's Standard cloud AI panel and nowhere else (William, 2026-10-22): its layout block
// in compare.js, from PANEL_FROM to PANEL_TO, is the one place they may appear.
const PANEL_ONLY = JSON.parse(Buffer.from('W3sicmUiOiAiXFxiUkFHXFxiIiwgImNzIjogdHJ1ZX0sIHsicmUiOiAiXFxiTExNXFxiIiwgImNzIjogdHJ1ZX0sIHsicmUiOiAiXFxiSVNQXFxiIiwgImNzIjogdHJ1ZX0sIHsicmUiOiAic3VicHJvY2Vzc29yIiwgImNzIjogZmFsc2V9XQ==', 'base64').toString());
const PANEL_FROM = '// Standard cloud AI: the chain';
const PANEL_TO = 'const ZOE = {';
const SITE_FILES = ['index.html', 'styles.css', 'hero.js', 'agreement.js', 'compare.js', 'drawer.css', 'pages.css', 'book-demo.html', 'nda.html',
  'tools/playwright.config.js', 'tools/make-site-images.js', 'tools/make-agreement.js', 'tools/record-gif.js'];
// Below the hero, in order (William, 2026-10-21): the comparison first, ZOE Servers removed.
const SECTIONS = ['dataflow', 'workflows', 'evidence', 'why', 'how', 'founder', 'advisory', 'contact', 'site-footer'];

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
    let text = fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/data:image\/webp;base64,[^"]+/, '');
    if (f === 'compare.js') {
      const a = text.indexOf(PANEL_FROM);
      const b = text.indexOf(PANEL_TO, a);
      expect(a).toBeGreaterThan(-1);
      text = text.slice(0, a) + text.slice(b);
    }
    RESTRICTED.concat(PANEL_ONLY).forEach(({ re, cs }) => {
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

const opacity = (page, sel) => page.$eval(sel, (el) => parseFloat(getComputedStyle(el).opacity));

test('Act I: a bare stage, the chat dead centre, then the strip moves and the paper and phone arrive', async ({ page }, info) => {
  await page.goto('/');
  const t0 = await page.evaluate(() => performance.now());
  const vp = page.viewportSize();
  // First paint: the small wordmark and no laptop.
  await page.waitForTimeout(300);
  expect(await opacity(page, '.scene')).toBe(0);
  expect(await opacity(page, '.brand')).toBe(1);
  await page.waitForFunction(() => {
    const m = document.querySelectorAll('.strip .msg');
    return m.length === 3 && m[2].textContent.endsWith('You have 10 MINUTES.');
  }, null, { timeout: 12000 });
  metrics.act1_chat_ms = Math.round((await page.evaluate(() => performance.now())) - t0);
  // The longer Act I lines of 2026-10-22 type in about 8.8 s at the same speed; the limit moved, not the pace.
  expect(metrics.act1_chat_ms).toBeLessThan(10000);
  const pops = await page.$$eval('.strip .em.is-pop', (els) => els.map((e) => e.textContent));
  expect(pops).toEqual(['THEIR OFFICE', '10 MINUTES']);
  // Dead centre, and larger than the strip's own size.
  await page.waitForTimeout(450);
  const c = await page.locator('.strip').boundingBox();
  expect(Math.abs(c.x + c.width / 2 - vp.width / 2)).toBeLessThan(24);
  expect(Math.abs(c.y + c.height / 2 - vp.height / 2)).toBeLessThan(90);
  metrics.act1_centre_bubble_px = await page.$eval('.strip .bubble', (el) => parseFloat(getComputedStyle(el).fontSize));
  expect(metrics.act1_centre_bubble_px).toBeGreaterThanOrEqual(isWide(info) ? 19 : 16.5);
  expect(await opacity(page, '.scene')).toBe(0);
  await shot(page, info, 'act1-chat-centre');
  // The strip shrinks to the top (top-left on desktop) and the paper comes down into the middle, the biggest thing there.
  await page.waitForFunction(() => window.__zoeHero.opening === 'sheet', null, { timeout: 4000 });
  await page.waitForTimeout(1400);
  const st = await page.locator('.strip').boundingBox();
  expect(st.y).toBeLessThan(isWide(info) ? 40 : 100);
  if (isWide(info)) expect(st.x).toBeLessThan(40);
  const sh = await page.locator('.sheet').boundingBox();
  expect(Math.abs(sh.x + sh.width / 2 - vp.width / 2)).toBeLessThan(30);
  if (isWide(info)) expect(sh.height).toBeGreaterThan(vp.height * 0.33);
  else expect(sh.width).toBeGreaterThan(vp.width * 0.5);
  await shot(page, info, 'act1-strip-moved');
  // The phone slides in, glowing, and the laptop is still not on stage.
  await page.waitForFunction(() => window.__zoeHero.opening === 'phone', null, { timeout: 4000 });
  await page.waitForTimeout(1300);
  await expect(page.locator('.phone')).toHaveClass(/is-in/);
  expect(await page.$eval('.phone-halo', (el) => el.getAnimations().length)).toBeGreaterThan(0);
  const ph = await page.locator('.phone').boundingBox();
  expect(sh.width * sh.height).toBeGreaterThan(ph.width * ph.height);
  expect(await opacity(page, '.scene')).toBe(0);
  await shot(page, info, 'act1-phone-in');
  await shot(page, info, 'act1');
});

test('Act I: drag the phone onto the term sheet, press the shutter; the phone hands over by itself', async ({ page }, info) => {
  await open(page);
  await waitGesture(page, 'phone');
  await page.waitForTimeout(700);
  const from = await center(page, '.phone');
  const sheetC = await center(page, '.sheet');
  const sheetBox = await page.locator('.sheet').boundingBox();
  const d = await startDrag(page, info, from);
  // Half over the page's edge: the viewfinder shows the paper beneath, 1:1 and aligned with the real one.
  const edge = isWide(info)
    ? { x: sheetBox.x + sheetBox.width - 6, y: sheetC.y + 10 }
    : { x: sheetC.x + 8, y: sheetBox.y + sheetBox.height - 4 };
  await dragPath(d, from, edge, 16);
  await expect(page.locator('.phone')).not.toHaveClass(/is-snapped/);
  const viewBox = await page.locator('.phone-view').boundingBox();
  expect(Math.abs(viewBox.x - sheetBox.x)).toBeLessThan(3);
  expect(Math.abs(viewBox.y - sheetBox.y)).toBeLessThan(3);
  expect(Math.abs(viewBox.width - sheetBox.width)).toBeLessThan(3);
  await shot(page, info, 'act1-viewfinder');
  // Record whether the captured card flies on the bump.
  await page.evaluate(() => {
    const f = document.querySelector('.fly');
    window.__flew = false;
    const tick = () => { if (f.getAnimations().length) window.__flew = true; else requestAnimationFrame(tick); };
    tick();
  });
  await dragPath(d, edge, sheetC, 8);
  // Locked on: no picture yet; the phone settles, the box brightens, the shutter lights up.
  await page.waitForFunction(() => window.__zoeHero.shutterArmed && document.querySelector('.phone').classList.contains('shutter-armed'), null, { timeout: 3000 });
  await expect(page.locator('.phone')).not.toHaveClass(/is-snapped/);
  await d.end();
  await page.waitForTimeout(300);
  await shot(page, info, 'act1-locked');
  // Press the shutter.
  const shutter = await center(page, '.phone-shutter');
  await tapAt(page, shutter);
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
  // Still holding the phone: the captured page shows in it, then the laptop slides in and the small wordmark goes.
  await page.waitForFunction(() => window.__zoeHero.opening === 'laptop-ready', null, { timeout: 5000 });
  await page.waitForTimeout(300);
  const scr = await page.locator('.phone-screen').boundingBox();
  const cap = await page.locator('.phone-view').boundingBox();
  expect(cap.x).toBeGreaterThan(scr.x);
  expect(cap.x + cap.width).toBeLessThan(scr.x + scr.width);
  expect(cap.width).toBeGreaterThan(scr.width * 0.6);
  expect(await opacity(page, '.phone-view')).toBe(1);
  expect(await opacity(page, '.scene')).toBe(1);
  expect(await opacity(page, '.brand')).toBeLessThan(0.05);
  await shot(page, info, 'act1-laptop-in');
  // No second drag: the phone goes to the laptop and bumps it by itself, and there is no `Drag` cue for it.
  expect(await opacity(page, '.phone-cue')).toBeLessThan(0.05);
  await page.waitForFunction(() => parseFloat(getComputedStyle(document.querySelector('.transfer')).opacity) > 0.95, null, { timeout: 4000 });
  await page.waitForTimeout(300);
  const px = await page.$eval('.transfer', (el) => parseFloat(getComputedStyle(el).fontSize));
  expect(px).toBeGreaterThanOrEqual(13);
  await shot(page, info, 'act1-transfer');
  await waitGesture(page, 'lid', 8000);
  await expect(page.locator('.phone')).toBeHidden({ timeout: 3000 });
  expect(await page.evaluate(() => window.__flew)).toBe(true);
});

test('Act I: locked on the page, Enter presses the shutter; left alone, the idle clock does', async ({ page }, info) => {
  test.setTimeout(240000);
  test.skip(!isWide(info), 'keyboard and idle checked once');
  for (const how of ['key', 'idle']) {
    await open(page);
    await waitGesture(page, 'phone');
    await page.waitForTimeout(700);
    const from = await center(page, '.phone');
    const to = await center(page, '.sheet');
    const d = await startDrag(page, info, from);
    await dragPath(d, from, to, 16);
    await d.end();
    await page.waitForFunction(() => window.__zoeHero.shutterArmed, null, { timeout: 3000 });
    const t0 = Date.now();
    if (how === 'key') {
      await page.locator('.phone').focus();
      await page.keyboard.press('Enter');
    }
    await page.waitForFunction(() => document.querySelector('.phone').classList.contains('is-snapped'), null, { timeout: 20000 });
    if (how === 'idle') {
      metrics.shutter_idle_ms = Date.now() - t0;
      expect(metrics.shutter_idle_ms).toBeGreaterThan(11000);
    }
  }
});

test('Act I: a tap on the phone performs both moves', async ({ page }) => {
  await open(page);
  await waitGesture(page, 'phone');
  await page.waitForTimeout(700);
  await tapAt(page, await center(page, '.phone'));
  await waitGesture(page, 'lid', 15000);
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

test('Act IV: ZOE finds and redacts, the cloud speaks the catch and the fix, then the rehydration snap', async ({ page }, info) => {
  await open(page);
  await startJournal(page);
  await runTo(page, 'scrub');
  await page.evaluate(() => window.__zoeHero.perform('click'));
  // Six pages, each scrubbed line by line, then sent: about 5 s in all.
  await page.waitForFunction(() => document.querySelector('.page6.is-in'), null, { timeout: 15000 });
  const t0 = Date.now();
  await page.waitForTimeout(450);
  expect(await page.locator('.page6').first().locator('i.is-on').count()).toBeGreaterThan(2);
  await expect(page.locator('.stream-label')).toHaveClass(/is-on/);
  await shot(page, info, 'act4-packet');
  await page.waitForFunction(() => document.querySelectorAll('.page6.is-flying').length === 6, null, { timeout: 15000 });
  metrics.six_pages_ms = Date.now() - t0 + 700;
  expect(metrics.six_pages_ms).toBeGreaterThan(4000);
  expect(metrics.six_pages_ms).toBeLessThan(6500);
  expect(await page.locator('.page6 i.is-on').count()).toBe(48);
  expect(await page.locator('.zoe-say').textContent()).toContain('Found 25 paragraphs across 6 files. Redacting.');
  await page.waitForFunction(() => document.querySelector('.cloud-say').textContent.includes('empty shell'), null, { timeout: 20000 });
  await page.waitForTimeout(900);
  await shot(page, info, 'act4-catch');
  // The returned draft is the whole agreement, and it arrives masked: tokens and dummy figures, readable.
  await page.waitForFunction(() => document.querySelector('.draft').classList.contains('is-in'), null, { timeout: 20000 });
  const tDraft = Date.now();
  // Locked down before anything is applied: the Wi-Fi is OFF when the agreement starts to fill.
  expect(await page.locator('.wifi.is-off').count()).toBe(1);
  await expect(page.locator('.cloud')).toHaveClass(/is-out/);
  expect(await page.$eval('.draft .ed-bar', (el) => el.textContent)).toContain('Business Combination Agreement · draft');
  const before = await page.$eval('.draft .ag', (el) => el.textContent);
  expect(before.split(/\s+/).filter(Boolean).length).toBeGreaterThan(3500);
  ['BUSINESS COMBINATION AGREEMENT', 'ARTICLE I — DEFINITIONS', 'ARTICLE X — MISCELLANEOUS', 'SIGNATURE PAGE (FORM OF; UNSIGNED)',
    '[ORG_6], a Delaware limited liability company (“Parent”)', '$18,200,000', '[PERSON_3]', '[ADDRESS_1]'].forEach((t) => expect(before).toContain(t));
  // The fix is the parent made a party, not a guaranty; the buyer is never described as newly formed.
  expect(before).not.toMatch(/guarant|newly formed|formed for the merger/i);
  const ins = await page.$$eval('.draft .ag .ins', (els) => els.map((e) => e.textContent));
  ['Parent and Merger Sub, jointly and severally, represent and warrant to the Company as follows:', 'PARENT AND ',
    'Parent and Merger Sub, jointly and severally,'].forEach((t) => expect(ins).toContain(t));
  expect(ins.some((t) => t.startsWith('B. Parent, as the sole member of Merger Sub, has agreed to become a party'))).toBe(true);
  ['Meridian Holdings LLC', '$45,000,000', 'Calder', 'Kestrel Robotics'].forEach((t) => expect(before).not.toContain(t));
  await page.waitForTimeout(1800);
  await shot(page, info, 'act4-agreement-masked');
  // The camera is in close enough that the agreement's type renders at 13 px or more.
  metrics.agreement_px = await page.evaluate(() => {
    const s = parseFloat(document.querySelector('.scene').style.getPropertyValue('--cam-s')) || 1;
    return +(parseFloat(getComputedStyle(document.querySelector('.ag')).fontSize) * s).toFixed(1);
  });
  expect(metrics.agreement_px).toBeGreaterThanOrEqual(13);
  // The run down the agreement: each token flips to the real name or figure as it passes the flip line.
  await page.waitForFunction(() => document.querySelector('.ag-view.is-flipping'), null, { timeout: 8000 });
  const stopFps = await startFpsProbe(page);
  // First the flip line comes down over the title block, then the page runs slowly through the parties:
  // caught mid-flip, a title-block name restored while the preamble's parties are still masked.
  await page.waitForFunction(() => document.querySelector('.ag .ag-b .pii.is-real') && document.querySelector('.ag [data-id="preamble"] .pii.is-masked'), null, { timeout: 8000 });
  await shot(page, info, 'act4-agreement-titleflip');
  const tFlip = Date.now();
  // The parties paragraph takes its time: still not all restored a second later.
  await page.waitForTimeout(1000);
  expect(await page.locator('.ag [data-id="preamble"] .pii.is-masked').count()).toBeGreaterThan(0);
  await page.waitForTimeout(Math.max(0, 5000 - (Date.now() - tFlip)));
  await shot(page, info, 'act4-agreement-flipping');
  const mid = await page.evaluate(() => ({ real: document.querySelectorAll('.ag .pii.is-real').length, masked: document.querySelectorAll('.ag .pii.is-masked').length }));
  expect(mid.real).toBeGreaterThan(0);
  expect(mid.masked).toBeGreaterThan(0);
  await page.waitForFunction(() => !document.querySelector('.ag-view.is-flipping'), null, { timeout: 20000 });
  metrics.agreement_scroll = await stopFps();
  await page.waitForFunction(() => !document.querySelector('.ag .pii.is-masked'), null, { timeout: 8000 });
  metrics.agreement_fill_ms = Date.now() - tDraft;
  expect(metrics.agreement_fill_ms).toBeGreaterThan(14000);
  expect(metrics.agreement_fill_ms).toBeLessThan(23000);
  const after = await page.$eval('.draft .ag', (el) => el.textContent);
  ['Meridian Holdings LLC, a Delaware limited liability company (“Parent”)', '$45,000,000', 'James “Jimmy” Calder'].forEach((t) => expect(after).toContain(t));
  expect(after).not.toMatch(/\[(ORG|PERSON|ADDRESS)_\d+\]/);
  // It settles on Article V, the green lead-in naming Parent and Merger Sub in view.
  await page.waitForTimeout(3600);
  const inView = (sel) => page.evaluate((q) => {
    const v = document.querySelector('.ag-view').getBoundingClientRect();
    const r = document.querySelector(q).getBoundingClientRect();
    return r.top >= v.top - 1 && r.bottom <= v.bottom + 1;
  }, sel);
  expect(await inView('.ag [data-id="art5"]')).toBe(true);
  expect(await inView('.ag [data-id="art5lead"]')).toBe(true);
  await shot(page, info, 'act4-article5');
  await page.waitForFunction(() => window.__journal.some((e) => e.k === 'line' && e.v.includes('Caught it')), null, { timeout: 15000 });
  const lines = (await page.evaluate(() => window.__journal)).filter((e) => e.k === 'line').map((e) => e.v);
  const order = ['ZOE: Searching the vault…', 'ZOE: Found 25 paragraphs across 6 files. Redacting.', 'ZOE: Sent.',
    'Frontier AI: [ORG_5] is an empty shell. [ORG_6] is the parent, and it is not in this deal.',
    'Frontier AI: Adding the parent [ORG_6] as a party, it should make reps and warranties along with its subsidiary [ORG_5].', 'Frontier AI: Receiving suggestions.',
    "ZOE: Received. Wi-Fi no longer needed. We're locked down.", 'ZOE: Applying draft edits.',
    'Bob (thinking): They left the parent off the hook. Caught it.'];
  const at = order.map((l) => lines.indexOf(l));
  if (!at.every((i, k) => i >= 0 && (k === 0 || i > at[k - 1]))) console.log('[journal]', JSON.stringify(lines));
  expect(at.every((i) => i >= 0)).toBe(true);
  expect(at).toEqual([...at].sort((a, b) => a - b));
  expect(lines.some((l) => l.startsWith('ZOE:') && l.includes('empty shell'))).toBe(false);
});

test('Act IV, the clause library: Wi-Fi OFF again, ten results, the pick lit, § 9.3 inserted', async ({ page }, info) => {
  test.setTimeout(150000);
  await open(page);
  await startJournal(page);
  await runTo(page, 'scrub');
  await page.evaluate(() => window.__zoeHero.perform('click'));
  await page.waitForFunction(() => window.__journal.some((e) => e.k === 'line' && e.v.includes('Not bad for a first draft')), null, { timeout: 120000 });
  expect(await hero(page, 'step')).toBe(4.5);
  await expect(page.locator('.cloud')).toHaveClass(/is-out/);
  await expect(page.locator('.wifi')).toHaveClass(/is-off/);
  // The search: the counter runs to 225,000 over the side panel, then ten results, one line each.
  await page.waitForFunction(() => document.querySelector('.scan.is-on') && document.querySelector('.side.is-library'), null, { timeout: 30000 });
  await page.waitForFunction(() => document.querySelector('.scan-count b').textContent === '225,000', null, { timeout: 5000 });
  await page.waitForFunction(() => document.querySelectorAll('.clause.is-in').length === 10, null, { timeout: 10000 });
  await page.waitForTimeout(500);
  await shot(page, info, 'act4-library');
  const cards = await page.$$eval('.clause', (els) => els.map((e) => ({ text: e.textContent, h: e.getBoundingClientRect().height, bottom: e.getBoundingClientRect().bottom })));
  expect(cards.length).toBe(10);
  expect(cards.some((c) => /BOB/.test(c.text))).toBe(false);
  expect(cards[0].text).toContain('Knowledge; No Sandbagging');
  const lineH = cards[0].h;
  cards.forEach((c) => expect(c.h).toBeLessThan(lineH + 1));
  const side = await page.$eval('.screen', (el) => el.getBoundingClientRect().bottom);
  cards.forEach((c) => expect(c.bottom).toBeLessThanOrEqual(side + 1));
  // Bob picks one: it lights up, the others dim.
  await page.waitForFunction(() => document.querySelector('.clause.is-picked'), null, { timeout: 20000 });
  await page.waitForTimeout(800);
  await shot(page, info, 'act4-pick');
  expect(await page.locator('.clause.is-picked').count()).toBe(1);
  const op = await page.$$eval('.clause', (els) => els.map((e) => parseFloat(getComputedStyle(e).opacity)));
  expect(op.filter((o) => o > 0.9).length).toBe(1);
  expect(op.filter((o) => o < 0.5).length).toBe(9);
  // "Inserting now.": § 9.3 replaces the [Reserved.] slot, in green, line by line, and settles in view.
  await page.waitForFunction(() => document.querySelector('.ag [data-id="s93new"]'), null, { timeout: 20000 });
  const t0 = Date.now();
  await page.waitForTimeout(600);
  await shot(page, info, 'act4-inserting');
  expect(await page.locator('.ag [data-id="s93new"] .w:not(.is-on)').count()).toBeGreaterThan(0);
  await page.waitForFunction(() => document.querySelectorAll('.ag [data-id="s93new"] .w:not(.is-on)').length === 0, null, { timeout: 5000 });
  metrics.insert_ms = Date.now() - t0 + 600;
  await page.waitForTimeout(1200);
  await shot(page, info, 'act4-inserted');
  expect(await page.locator('.ag [data-id="s93"]').count()).toBe(0);
  expect(await page.$eval('.ag [data-id="s93new"]', (el) => el.classList.contains('ins') && el.textContent.startsWith('Section 9.3 Knowledge; No Sandbagging.'))).toBe(true);
  const both = await page.evaluate(() => {
    const v = document.querySelector('.ag-view').getBoundingClientRect();
    return ['s93new'].map((id) => {
      const r = document.querySelector(`.ag [data-id="${id}"]`).getBoundingClientRect();
      return r.bottom >= v.top + 24 && r.top + 24 <= v.bottom;
    });
  });
  expect(both).toEqual([true]);
  // Order of the lines, and the Wi-Fi: OFF once the draft is received, before the edits are applied.
  await page.waitForFunction(() => window.__journal.some((e) => e.k === 'line' && e.v.startsWith('Jimmy: Ten minutes')), null, { timeout: 30000 });
  const j = await page.evaluate(() => window.__journal);
  const lines = j.filter((e) => e.k === 'line').map((e) => e.v);
  const order = ["ZOE: Received. Wi-Fi no longer needed. We're locked down.", 'ZOE: Applying draft edits.',
    'Bob (thinking): They left the parent off the hook. Caught it.',
    'Bob (thinking): Not bad for a first draft. But I need an anti-sandbagging clause.',
    'ZOE: Searching your local secure clause library…', 'ZOE: Top 10 matches.',
    "Bob (thinking): That's the one. Perfect.", 'ZOE: Inserting now.',
    "Jimmy: Ten minutes. Tell me you've got something."];
  const at = order.map((l) => lines.indexOf(l));
  if (!at.every((i) => i >= 0)) console.log('[journal]', JSON.stringify(lines));
  expect(at.every((i) => i >= 0)).toBe(true);
  expect(at).toEqual([...at].sort((a, b) => a - b));
  const wifi = j.filter((e) => e.k === 'wifi').map((e) => e.v);
  expect(wifi.slice(-2)).toEqual(['on', 'off']);
  const offAt = j.filter((e) => e.k === 'wifi' && e.v === 'off').pop().t;
  const lineAt = (l) => j.find((e) => e.k === 'line' && e.v === l).t;
  expect(offAt).toBeGreaterThan(lineAt("ZOE: Received. Wi-Fi no longer needed. We're locked down."));
  expect(offAt).toBeLessThan(lineAt('ZOE: Applying draft edits.'));
});

test('Act V: one button and Replay; the button unlocks and lands on the comparison; replay twice; analytics', async ({ page }, info) => {
  test.setTimeout(500000);
  const events = [];
  page.on('console', (m) => { const t = m.text(); if (t.startsWith('[track]')) events.push(t.split(' ')[1]); });
  await open(page);
  await runToEnd(page);
  await page.waitForTimeout(700);
  await shot(page, info, 'act5');
  expect(await page.$$eval('.pills .pill', (els) => els.map((e) => e.textContent))).toEqual(['Why is ZOE AI different?', 'Replay']);
  // The inspect view is no longer offered, but its code still works (through the test hook).
  // The agreement is left out: a legal document as written, with its headings and parties in capitals.
  const stageText = await page.evaluate(() => {
    const c = document.querySelector('.stage').cloneNode(true);
    c.querySelectorAll('.ag').forEach((el) => el.remove());
    return c.textContent;
  });
  await page.evaluate(() => window.__zoeHero.inspect());
  await page.waitForTimeout(600);
  await expect(page.locator('.insp-col.is-out')).toContainText('[ORG_1]');
  const inspectText = await page.evaluate(() => document.querySelector('.inspect').textContent);
  const caps = Array.from(new Set(`${stageText} ${inspectText}`.match(/\b[A-Z]{2,}\b/g) || [])).filter((w) => !CAPS_OK.has(w));
  expect(caps).toEqual([]);
  await page.locator('.insp-back .pill').click();
  await page.waitForTimeout(500);
  // Replay twice: a clean Act I each time, still locked.
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
      laptopIn: document.querySelector('.stage').classList.contains('laptop-in'),
      locked: window.__zoeHero.locked,
      scrollY: window.scrollY,
    }));
    expect(clean).toEqual({ act: 1, screenHidden: true, pills: 0, progress: 0, camera: 'arrive', cloud: false, phoneHidden: false, laptopIn: false, locked: true, scrollY: 0 });
    await runToEnd(page);
    await page.waitForTimeout(700);
  }
  await shot(page, info, 'act5-after-two-replays');
  // The button: unlock, land on the comparison with its heading at the top, Standard cloud AI playing.
  await page.locator('.pill', { hasText: 'Why is ZOE AI different?' }).click();
  await page.waitForFunction(() => window.__zoeCompare && window.__zoeCompare.running, null, { timeout: 8000 });
  await page.waitForTimeout(1500);
  const land = await page.evaluate(() => ({ top: Math.round(document.getElementById('flow-h').getBoundingClientRect().top), picked: window.__zoeCompare.picked, locked: window.__zoeHero.locked }));
  expect(Math.abs(land.top - 24)).toBeLessThan(3);
  expect(land.picked).toBe('cloud');
  expect(land.locked).toBe(false);
  await expect(page.locator('.flow-pick[data-pick="cloud"]')).toHaveAttribute('aria-selected', 'true');
  await shot(page, info, 'landing');
  const before = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, 600);
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(before + 100);
  for (const ev of ['phone_snapped', 'lid_opened', 'marked', 'scrubbed', 'reached_cloud', 'pill_why', 'pill_replay', 'deep_dive_reached']) {
    expect(events).toContain(ev);
  }
});

test('skip: none before the lid opens, quiet from Act III; each press jumps a step; spam reaches the end pills; never unlocks', async ({ page }, info) => {
  test.setTimeout(150000);
  const events = [];
  page.on('console', (m) => { const t = m.text(); if (t.startsWith('[track] skip')) events.push(t); });
  const hidden = () => page.$eval('.skip-step', (e) => !e.classList.contains('is-in')
    && getComputedStyle(e).opacity === '0' && getComputedStyle(e).visibility === 'hidden');
  await open(page);
  const btn = page.locator('.skip-step');
  await expect(btn).toHaveAttribute('aria-label', 'Skip to the next step');
  // Acts I and II, past the old 10 s mark: no skip.
  await page.waitForTimeout(11000);
  expect(await hero(page, 'act')).toBeLessThan(3);
  expect(await hidden()).toBe(true);
  await runTo(page, 'lid');
  await page.waitForFunction(() => window.__zoeHero.framesReady, null, { timeout: 20000 });
  expect(await hidden()).toBe(true);
  await page.evaluate(() => window.__zoeHero.perform('tap'));
  await page.waitForFunction(() => window.__zoeHero.progress === 1, null, { timeout: 4000 });
  expect(await hidden()).toBe(true);
  // Act III: it fades in.
  await page.waitForFunction(() => window.__zoeHero.act === 3, null, { timeout: 15000 });
  await expect(btn).toHaveClass(/is-in/);
  await page.waitForTimeout(900);
  await page.locator('.stage').screenshot({ path: path.join(SHOTS, `${info.project.name}-skip-button.png`) });
  // One press: the rest of Act III happens at once, and it stays for Act IV.
  await btn.click({ force: true });
  await page.waitForFunction(() => window.__zoeHero.act === 4, null, { timeout: 15000 });
  await expect(btn).toHaveClass(/is-in/);
  // The next stops at the clause-library beat, a step of its own.
  await btn.click({ force: true });
  await page.waitForFunction(() => window.__zoeHero.step === 4.5, null, { timeout: 15000 });
  expect(await hero(page, 'act')).toBe(4);
  // Quick presses take it the rest of the way.
  for (let i = 0; i < 2; i += 1) await btn.click({ force: true });
  await page.waitForFunction(() => window.__zoeHero.ended > 0, null, { timeout: 30000 });
  expect(await page.$$eval('.pills .pill', (els) => els.map((e) => e.textContent))).toEqual(['Why is ZOE AI different?', 'Replay']);
  expect(await page.$eval('.draft', (el) => el.textContent)).toContain('Parent and Merger Sub, jointly and severally, represent and warrant');
  expect(await page.$eval('.draft', (el) => el.textContent)).toContain('Section 9.3 Knowledge; No Sandbagging.');
  expect(await page.locator('.editor > .ed-page .pii.is-masked').count()).toBeGreaterThanOrEqual(19);
  expect(await hero(page, 'locked')).toBe(true);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  expect(events.length).toBeGreaterThanOrEqual(2);
  expect(events[0]).toContain('act: 3');
  await shot(page, info, 'skip-end');
  // Replay: gone again until Act III, then Enter on it works.
  await page.locator('.pill', { hasText: 'Replay' }).click();
  await page.waitForTimeout(1200);
  expect(await hidden()).toBe(true);
  await runTo(page, 'mark');
  await expect(btn).toHaveClass(/is-in/);
  await btn.focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.__zoeHero.act === 4, null, { timeout: 15000 });
});

test('the hero is its own screen: wheel, touch and keys do not scroll it', async ({ page }, info) => {
  await open(page);
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => document.documentElement.classList.contains('hero-lock'))).toBe(true);
  await page.mouse.move(info.project.use.viewport.width / 2, info.project.use.viewport.height - 60);
  await page.mouse.wheel(0, 800);
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  if (info.project.use.hasTouch) {
    const cdp = await page.context().newCDPSession(page);
    const x = 40;
    const y = info.project.use.viewport.height - 80;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    for (let i = 1; i <= 10; i += 1) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - i * 40 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } else {
    await page.keyboard.press('PageDown');
    await page.keyboard.press('End');
    await page.keyboard.press('Space');
  }
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page.locator('.skip')).toHaveCount(0);
  await shot(page, info, 'hero-locked');
});

// Text at half speed and every gesture wait at 3x (18 s for the phone, 12 s for each later one). Measured
// 179.0 s on the phone size with the full agreement and the clause-library beat (2026-10-22, midday).
const UNTOUCHED_LIMIT_MS = 200000;

test('untouched: the story plays through by itself (recorded), with the opening timed', async ({ browser }, info) => {
  test.setTimeout(360000);
  const { viewport, isMobile, hasTouch } = info.project.use;
  const dir = path.join(SHOTS, `video-${info.project.name}`);
  const ctx = await browser.newContext({ viewport, isMobile, hasTouch, deviceScaleFactor: 1, recordVideo: { dir, size: viewport } });
  const page = await ctx.newPage();
  // The opening's beats, timed from navigation: act changes, Act I stages, the lid landing.
  await page.addInitScript(() => {
    window.__beats = [];
    document.addEventListener('DOMContentLoaded', () => {
      const st = document.querySelector('.stage');
      const note = (k) => window.__beats.push([k, Math.round(performance.now())]);
      new MutationObserver(() => note(`act${st.dataset.act}:${st.dataset.open || ''}`)).observe(st, { attributes: true, attributeFilter: ['data-act', 'data-open'] });
      const poll = () => { if (window.__zoeHero && window.__zoeHero.progress === 1) note('lid-open'); else requestAnimationFrame(poll); };
      requestAnimationFrame(poll);
    });
  });
  await page.goto(BASE);
  await page.waitForFunction(() => window.__zoeHero.ended > 0, null, { timeout: 300000 });
  metrics.untouched_ms = await hero(page, 'ended');
  const beats = await page.evaluate(() => window.__beats);
  const fcp = await page.evaluate(() => Math.round((performance.getEntriesByName('first-contentful-paint')[0] || {}).startTime || 0));
  const first = (k) => (beats.find(([b]) => b === k || b.endsWith(`:${k}`)) || [])[1];
  metrics.opening = {
    first_contentful_paint_ms: fcp,
    chat_starts_ms: first('act1:chat'),
    strip_moves_ms: first('sheet'),
    phone_in_ms: first('phone'),
    snapped_ms: first('snapped'),
    laptop_slides_in_ms: first('laptop'),
    laptop_ready_ms: first('laptop-ready'),
    transfer_ms: first('transfer'),
    laptop_centred_ms: first('done'),
    lid_open_ms: first('lid-open'),
  };
  await page.waitForTimeout(1500);
  const video = page.video();
  await ctx.close();
  fs.renameSync(await video.path(), path.join(SHOTS, `${info.project.name}-run-untouched.webm`));
  fs.rmSync(dir, { recursive: true, force: true });
  expect(metrics.untouched_ms).toBeGreaterThan(115000);
  expect(metrics.untouched_ms).toBeLessThan(UNTOUCHED_LIMIT_MS);
});

test('keyboard: Tab reaches each gesture and Enter performs it', async ({ page }, info) => {
  test.skip(!isWide(info));
  await open(page);
  await waitGesture(page, 'phone');
  await page.keyboard.press('Tab');
  await expect(page.locator('.phone')).toBeFocused();
  await page.keyboard.press('Enter');
  await waitGesture(page, 'lid', 15000);
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
  // The Next path ends at the same button; reduced motion never locks the page.
  await expect(page.locator('.pill', { hasText: 'Why is ZOE AI different?' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.classList.contains('hero-lock'))).toBe(false);
  await page.locator('.pill', { hasText: 'Why is ZOE AI different?' }).click();
  await page.waitForFunction(() => window.__zoeCompare && window.__zoeCompare.picked === 'cloud', null, { timeout: 8000 });
  await page.waitForTimeout(300);
  expect(Math.abs(await page.locator('#flow-h').evaluate((e) => e.getBoundingClientRect().top) - 24)).toBeLessThan(3);
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
  // Every spoken line has its own key (a repeated key silently replaces an earlier line).
  const keys = Array.from(block.matchAll(/^\s+(\w+):\s+['"]/gm)).map((m) => m[1]);
  expect(keys.filter((k, i) => keys.indexOf(k) !== i)).toEqual([]);
  expect(lines.length).toBeGreaterThan(20);
  lines.forEach((l) => expect(noscript).toContain(l));
  // The buyer reads as an ordinary company on paper: the shell is found only through the related files.
  for (const f of ['hero.js', 'index.html', 'agreement.js']) {
    expect(fs.readFileSync(path.join(ROOT, f), 'utf8')).not.toMatch(/newly formed|formed for the merger/i);
  }
  await ctx.close();
});

test('below the hero: every section, both modals, numbers and image sizes', async ({ page }, info) => {
  const images = [];
  page.on('response', async (r) => {
    if (r.request().resourceType() === 'image') images.push({ url: r.url(), kb: Math.round((await r.body().catch(() => Buffer.alloc(0))).length / 1024) });
  });
  // A link to a section below the hero arrives unlocked (as from the other pages).
  await page.goto('/#dataflow');
  const order = await page.evaluate(() => Array.from(document.querySelectorAll('main > section.sec, footer.site-footer')).map((e) => e.id));
  expect(order).toEqual(SECTIONS);
  await expect(page.locator('#servers')).toHaveCount(0);
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
  // (The cloud panel's tally counts the boxes it draws; it is not a claim, so it is left out.)
  const text = await page.evaluate((ids) => ids.map((id) => {
    const c = document.getElementById(id).cloneNode(true);
    c.querySelectorAll('.flow-tally').forEach((el) => el.remove());
    return c.textContent;
  }).join(' '), SECTIONS);
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
  ['no servers of its own', 'GitHub Pages', 'formsubmit.co', 'Booking a tech demo sends your name', 'No visitor analytics'].forEach((t) => expect(privacy).toContain(t));
  ['Google Sheets', 'Google Apps Script', 'non-disclosure'].forEach((t) => expect(privacy).not.toContain(t));
  expect(privacy).not.toMatch(/private servers/);
});

test('the living O: the wordmark overlay rides the drift, the bubble O grows, the small O turns', async ({ page }, info) => {
  await page.goto('/');
  await page.waitForTimeout(800);
  // The overlay's centre sits on the ring's measured centre (frame 1: 851.56, 207.45 of 1920 x 1080).
  await page.waitForFunction(() => window.__zoeHero.gesture === 'phone', null, { timeout: 30000 });
  await page.evaluate(() => window.__zoeHero.perform('tap'));
  await page.waitForFunction(() => window.__zoeHero.gesture === 'lid', null, { timeout: 40000 });
  await page.waitForTimeout(1500);
  const at = async (fx, fy) => {
    const s = await page.locator('.scene').boundingBox();
    const o = await page.locator('.logo-o').boundingBox();
    return { dx: o.x + o.width / 2 - (s.x + fx * s.width), dy: o.y + o.height / 2 - (s.y + fy * s.height) };
  };
  const f1 = await at(851.56 / 1920, 207.45 / 1080);
  expect(Math.abs(f1.dx)).toBeLessThan(1.5);
  expect(Math.abs(f1.dy)).toBeLessThan(1.5);
  expect(await page.locator('.logo-o-a').evaluate((e) => e.getAnimations()[0].playState)).toBe('running');
  await runTo(page, 'mark');
  // Frame 45 after the lid opened: the ring has drifted to (841.48, 199.63); the scene may be zoomed, so measure unscaled.
  const drift = await page.evaluate(() => {
    const st = getComputedStyle(document.querySelector('.logo-o'));
    return [st.getPropertyValue('--odx'), st.getPropertyValue('--ody')].map(Number);
  });
  expect(Math.abs(drift[0] * 1920 - (841.48 - 851.56))).toBeLessThan(0.6);
  expect(Math.abs(drift[1] * 1920 - (199.63 - 207.45))).toBeLessThan(0.6);
  await page.waitForFunction(() => document.querySelector('.zoe').classList.contains('is-talking') || document.querySelector('.zoe').classList.contains('is-working'), null, { timeout: 30000 });
  const grown = await page.locator('.zoe-mark .o-wrap').evaluate((e) => new DOMMatrix(getComputedStyle(e).transform).a);
  expect(grown).toBeGreaterThan(1.5);
  expect(await page.locator('.foot-logo .wordmark-o').evaluate((e) => e.getAnimations()[0].playState)).toBe('running');
  await page.locator('.logo-o').screenshot({ path: path.join(SHOTS, `${info.project.name}-logo-o.png`) }).catch(() => {});
});

test('the living O under reduced motion: still', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.waitForTimeout(500);
  expect(await page.locator('.logo-o-a').evaluate((e) => e.getAnimations().length)).toBe(0);
});

test('portrait round trip: the cloud above the laptop, the stream rising to it', async ({ page }, info) => {
  test.skip(isWide(info), 'portrait layout');
  await open(page);
  await runTo(page, 'scrub');
  await page.evaluate(() => window.__zoeHero.perform('click'));
  await page.waitForFunction(() => document.querySelector('.stream-label').classList.contains('is-on'), null, { timeout: 60000 });
  await page.waitForTimeout(1200);
  const cloud = await page.locator('.cloud').boundingBox();
  const screen = await page.locator('.screen').boundingBox();
  const label = await page.locator('.stream-label').boundingBox();
  expect(cloud.y + cloud.height).toBeLessThan(screen.y);
  expect(label.y).toBeGreaterThan(cloud.y + cloud.height - 4);
  expect(label.y + label.height).toBeLessThan(screen.y);
  expect(await page.locator('.stream-label').evaluate((e) => parseFloat(getComputedStyle(e).fontSize))).toBeGreaterThanOrEqual(16);
});

test('comparison: Standard cloud AI chosen to begin with, each panel animates, switching works', async ({ page }, info) => {
  await page.goto('/#dataflow');
  await page.locator('#dataflow').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => window.__zoeCompare && window.__zoeCompare.running, null, { timeout: 8000 });
  await expect(page.locator('#flow-cloud')).toBeVisible();
  await expect(page.locator('#flow-zoe')).toBeHidden();
  await expect(page.locator('.flow-pick[data-pick="cloud"]')).toHaveAttribute('aria-selected', 'true');
  for (const [which, t] of [['cloud', 6800], ['zoe', 6000]]) {
    await page.locator(`.flow-pick[data-pick="${which}"]`).click();
    await expect(page.locator(`#flow-${which}`)).toBeVisible();
    await expect(page.locator(`#flow-${which === 'cloud' ? 'zoe' : 'cloud'}`)).toBeHidden();
    await page.waitForFunction(() => window.__zoeCompare.running, null, { timeout: 3000 });
    await page.evaluate((ms) => window.__zoeCompare.seek(ms), t);
    await page.waitForTimeout(100);
    await page.locator('#dataflow').screenshot({ path: path.join(SHOTS, `${info.project.name}-compare-${which}.png`) });
  }
  await page.locator('.flow-pick[data-pick="cloud"]').click();
  // Part way: the document has reached the vendor cloud, and the tally has counted the three hops.
  await page.evaluate(() => window.__zoeCompare.seek(3200));
  expect(await page.locator('#flow-cloud .fl-tag').evaluateAll((els) => els.filter((e) => +getComputedStyle(e).opacity > 0.9).length)).toBe(3);
  await expect(page.locator('#flow-cloud .flow-tally')).toHaveText('3 attack surfaces');
  await page.locator('#dataflow').screenshot({ path: path.join(SHOTS, `${info.project.name}-compare-cloud-hops.png`) });
  // At the end: every node past the control line is tagged; the trailing boxes count too.
  await page.evaluate(() => window.__zoeCompare.seek(6800));
  expect(await page.locator('#flow-cloud .fl-tag').evaluateAll((els) => els.filter((e) => +getComputedStyle(e).opacity > 0.9).length)).toBe(8);
  await expect(page.locator('#flow-cloud .flow-tally')).toHaveText('11 attack surfaces');
  const labels = await page.locator('#flow-cloud .fl-t').allTextContents();
  ['Your laptop', 'Office router', 'Vendor cloud', 'Confidentiality services (PII)', 'Search index (RAG)', 'Frontier models (LLM)',
    'Logging & evaluation', 'Additional subprocessors'].forEach((t) => expect(labels).toContain(t));
  expect(labels.join(' ').replace(/\s+/g, ' ')).toContain('provider (ISP)');
  // Every label fits its box.
  const over = await page.$$eval('#flow-cloud .fl-box', (rs) => rs.flatMap((r) => {
    const b = r.getBBox();
    const out = [];
    for (let t = r.nextElementSibling; t && t.tagName === 'text'; t = t.nextElementSibling) {
      const tb = t.getBBox();
      if (tb.x < b.x || tb.x + tb.width > b.x + b.width) out.push(t.textContent);
    }
    return out;
  }));
  expect(over).toEqual([]);
  // The panel's own words stay in the panel: nowhere else on the page.
  const outside = await page.evaluate(() => {
    const c = document.body.cloneNode(true);
    c.querySelectorAll('#flow-cloud, script, noscript').forEach((el) => el.remove());
    return c.textContent;
  });
  PANEL_ONLY.forEach(({ re, cs }) => expect(outside.match(new RegExp(re, cs ? 'g' : 'gi'))).toBeNull());
  await page.locator('.flow-pick[data-pick="zoe"]').click();
  await page.evaluate(() => window.__zoeCompare.seek(6000));
  expect(+(await page.locator('#flow-zoe .mv-packet').evaluate((e) => getComputedStyle(e).opacity))).toBeGreaterThan(0.9);
});


// Whether a comparison pill is glowing (its ::after ring breathing).
const glowing = (page, which) => page.locator(`.flow-pick[data-pick="${which}"]`).evaluate((e) => {
  const a = getComputedStyle(e, '::after');
  return a.content !== 'none' && a.animationName !== 'none';
});

test('comparison: the cloud panel plays once, types its point, holds, then flips to ZOE AI; a click cancels the flip', async ({ page }, info) => {
  test.setTimeout(90000);
  await page.goto('/');
  await page.waitForTimeout(400);
  await page.evaluate(() => window.__zoeHero.toComparison());
  await expect(page.locator('#flow-h')).toHaveText('Why is ZOE different?');
  await page.waitForFunction(() => window.__zoeCompare && window.__zoeCompare.running, null, { timeout: 8000 });
  // On arrival: Standard cloud AI selected and still; the ZOE AI System pill glows, with its tag.
  await expect(page.locator('.flow-pick[data-pick="zoe"]')).toContainText('ZOE AI System');
  await expect(page.locator('.flow-pick[data-pick="zoe"] .patent')).toHaveText('Patent pending');
  expect(await glowing(page, 'cloud')).toBe(false);
  expect(await glowing(page, 'zoe')).toBe(true);
  await page.waitForTimeout(600);
  await page.locator('#dataflow .flow-choose').screenshot({ path: path.join(SHOTS, `${info.project.name}-pills-arrival.png`) });
  await page.waitForFunction(() => window.__zoeCompare.finished, null, { timeout: 15000 });
  await page.waitForFunction(() => window.__zoeCompare.typed, null, { timeout: 8000 });
  const typedAt = Date.now();
  const cap = await page.locator('#flow-cloud .fl-cap').evaluateAll((els) => els.map((e) => e.textContent).join(' '));
  expect(cap).toBe("Multiple hops. Every system past the router is one you don't control.");
  const point = await page.locator('#flow-cloud .fl-point').evaluateAll((els) => els.map((e) => e.textContent).join(' '));
  expect(point).toBe('A chain of AI vendors and subprocessors is a larger attack surface than traditional cloud software.');
  expect(await page.locator('#flow-cloud svg title').textContent()).toContain('eleven attack surfaces');
  // It holds: the caption stays, nothing loops.
  await page.waitForTimeout(2500);
  expect(await page.locator('#flow-cloud .fl-captions').evaluate((e) => getComputedStyle(e).opacity)).toBe('1');
  expect(await page.evaluate(() => window.__zoeCompare.picked)).toBe('cloud');
  await page.locator('#dataflow').screenshot({ path: path.join(SHOTS, `${info.project.name}-compare-cloud-done.png`) });
  await page.waitForFunction(() => window.__zoeCompare.picked === 'zoe', null, { timeout: 8000 });
  metrics.compare_flip_after_typed_ms = Date.now() - typedAt;
  // After the flip neither pill glows, for the rest of the visit.
  await page.waitForTimeout(400);
  expect(await glowing(page, 'cloud')).toBe(false);
  expect(await glowing(page, 'zoe')).toBe(false);
  await page.locator('#dataflow .flow-choose').screenshot({ path: path.join(SHOTS, `${info.project.name}-pills-after-flip.png`) });
  expect(metrics.compare_flip_after_typed_ms).toBeGreaterThan(4000);
  expect(metrics.compare_flip_after_typed_ms).toBeLessThan(6500);
  // ZOE AI: the pill fits its text; the blurb replaces "(optional)"; the caption stays once in.
  const pill = await page.locator('#flow-zoe .fl-badge').evaluate((t) => { const b = t.getBBox(); const r = t.previousElementSibling.getBBox(); return b.x >= r.x && b.x + b.width <= r.x + r.width; });
  expect(pill).toBe(true);
  const zoeText = await page.locator('#flow-zoe svg').textContent();
  expect(zoeText).toContain("frontier model, or a high-end");
  expect(zoeText).not.toContain('(optional)');
  await page.waitForTimeout(9000);
  expect(await page.locator('#flow-zoe .fl-captions').evaluate((e) => getComputedStyle(e).opacity)).toBe('1');
  await page.locator('#dataflow').screenshot({ path: path.join(SHOTS, `${info.project.name}-compare-zoe-held.png`) });
  // A click back to Standard plays it again and never flips by itself.
  await page.locator('.flow-pick[data-pick="cloud"]').click();
  await page.waitForFunction(() => window.__zoeCompare.typed, null, { timeout: 20000 });
  await page.waitForTimeout(6500);
  expect(await page.evaluate(() => window.__zoeCompare.picked)).toBe('cloud');
});

test('comparison fits one phone screen: heading, choices and the whole panel at 390x664 and 390x844', async ({ browser }, info) => {
  test.skip(isWide(info), 'phone sizes');
  for (const height of [664, 844]) {
    const ctx = await browser.newContext({ viewport: { width: 390, height }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await page.goto(BASE);
    await page.waitForTimeout(400);
    await page.evaluate(() => window.__zoeHero.toComparison());
    await page.waitForFunction(() => window.__zoeCompare && window.__zoeCompare.picked === 'cloud', null, { timeout: 8000 });
    await page.waitForTimeout(1200);
    for (const which of ['cloud', 'zoe']) {
      if (which === 'zoe') { await page.locator('.flow-pick[data-pick="zoe"]').click(); await page.waitForTimeout(400); }
      const r = await page.evaluate((w) => ({ head: document.getElementById('flow-h').getBoundingClientRect().top, bottom: document.getElementById(`flow-${w}`).getBoundingClientRect().bottom, vh: innerHeight }), which);
      expect(r.head).toBeGreaterThanOrEqual(0);
      expect(r.bottom).toBeLessThanOrEqual(r.vh);
      await page.screenshot({ path: path.join(SHOTS, `phone-${height}-compare-${which}.png`) });
    }
    await ctx.close();
  }
});

test('comparison under reduced motion: a still picture', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.locator('#dataflow').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => window.__zoeCompare, null, { timeout: 8000 });
  await page.locator('.flow-pick[data-pick="cloud"]').click();
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => window.__zoeCompare.running)).toBe(false);
  await expect(page.locator('#flow-cloud .fl-captions')).toHaveCSS('opacity', '1');
});

test('the booking page: no NDA, the booking relayed to email (intercepted, nothing sent)', async ({ browser }, info) => {
  const { viewport, deviceScaleFactor, isMobile, hasTouch } = info.project.use;
  const ctx = await browser.newContext({ viewport, deviceScaleFactor, isMobile, hasTouch });
  // The relay is answered here, so no booking ever leaves the test.
  const sent = [];
  await ctx.route(/formsubmit\.co/, (r) => {
    sent.push({ url: r.request().url(), body: JSON.parse(r.request().postData() || '{}') });
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: 'true', message: 'The form was submitted successfully.' }) });
  });
  await ctx.route(/script\.google\.com/, (r) => r.abort());
  const page = await ctx.newPage();
  await page.goto(BASE + 'book-demo.html');
  await expect(page.locator('link[href="pages.css"]')).toHaveCount(1);
  // Demos start on December 1, 2026: the calendar opens there and nothing earlier can be picked.
  await expect(page.locator('#cal-month-year')).toHaveText('December 2026');
  await expect(page.locator('#cal-prev')).toBeDisabled();
  await page.screenshot({ path: path.join(SHOTS, `${info.project.name}-page-book-demo.png`), fullPage: true });
  await page.locator('.calendar-day:not(:disabled):not(.day-other-month):not(.day-weekend)').first().click();
  await expect(page.locator('#step-2')).toHaveClass(/active/);
  await expect(page.locator('#selected-date-display')).toHaveText('Tuesday, December 1, 2026');
  await page.locator('.time-slot').first().click();
  await expect(page.locator('#step-3')).toHaveClass(/active/);
  await expect(page.locator('#bk-submit')).toHaveText('Book Demo');
  expect(await page.locator('body').innerText()).not.toMatch(/\bNDA\b|non-disclosure/i);
  await page.locator('#bk-name').fill('Test Visitor');
  await page.locator('#bk-email').fill('test@example.test');
  await page.screenshot({ path: path.join(SHOTS, `${info.project.name}-page-book-demo-step3.png`), fullPage: true });
  await page.locator('#bk-submit').click();
  await expect(page.locator('#step-done')).toHaveClass(/active/);
  await expect(page.locator('#conf-date')).toHaveText('Tuesday, December 1, 2026');
  expect(sent.length).toBe(1);
  expect(sent[0].url).toBe('https://formsubmit.co/ajax/info@zoemachine.com');
  expect(sent[0].body).toMatchObject({ name: 'Test Visitor', email: 'test@example.test', preferred_date: 'Tuesday, December 1, 2026' });
  await page.screenshot({ path: path.join(SHOTS, `${info.project.name}-page-book-demo-done.png`), fullPage: true });
  // The old NDA address sends visitors back to booking.
  const old = await ctx.newPage();
  await old.goto(BASE + 'nda.html');
  await old.waitForURL(/book-demo\.html$/, { timeout: 5000 });
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
  await page.evaluate(() => window.__zoeHero.toComparison());
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
