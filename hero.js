// ZOE AI hero — the boardroom term sheet, in five acts.
// Act I the ambush and the snap · II open the laptop, pull the plug · III local work, offline
// IV the scrub and the round trip · V ten minutes are up.

// Analytics sink. While empty, events are logged to the console.
const ANALYTICS_ENDPOINT = '';

// ---------- Story content: every name and line in one place ----------
// All parties, numbers, addresses and dates are invented. `mask` is what the frontier AI sees:
// names and addresses become stable tokens, numbers and dates become format-preserving dummies.
const PARTIES = {
  seller:  { real: 'Kestrel Robotics Inc.',    mask: '[ORG_1]' },
  address: { real: '1400 Kestrel Lane',        mask: '[ADDRESS_1]' },
  buyer:   { real: 'Meridian Acquisition LLC', mask: '[ORG_5]' },
  parent:  { real: 'Meridian Holdings LLC',    mask: '[ORG_6]' },
  signer:  { real: 'Jane R. Okonkwo',          mask: '[PERSON_1]' },
  price:   { real: '$45,000,000',              mask: '$18,200,000' },
  signing: { real: 'November 6, 2026',         mask: 'August 21, 2026' },
  outside: { real: 'January 15, 2027',         mask: 'March 2, 2027' },
  ein:     { real: '84-2219876',               mask: '31-7748205' },
  escrow:  { real: '4417-0093-2281',           mask: '7302-5518-0946' },
};

// The term sheet as it appears on the paper, in the editor and in the inspect view.
// {key} is a party from PARTIES; [label, text].
const TERM_SHEET = [
  ['Seller', '{seller}, {address}'],
  ['Buyer', '{buyer}, a newly formed Delaware LLC'],
  ['Price', '{price} cash'],
  ['Signing', '{signing}'],
  ['Outside date', '{outside}'],
  ['EIN', '{ein}'],
  ['Escrow', '{escrow}'],
  ['For Buyer', '{signer}'],
];

// Boilerplate that fills out the paper; nothing confidential in it.
const SHEET_FILLER = [
  'Exclusivity: thirty days from signing.',
  'Conditions: key employee agreements and customary approvals.',
  'Governing law: Delaware. Non-binding except exclusivity and confidentiality.',
];

// What comes back from the frontier AI. `ins` lines are tracked insertions.
const DRAFT = [
  ['', 'Seller: {seller}'],
  ['', 'Buyer: {buyer}'],
  ['', 'Purchase price: {price}'],
  ['ins', '§ 9.4 Parent guaranty. {parent} (Parent Guarantor) guarantees Buyer’s obligations, including indemnification.'],
];

// The six vault files ZOE redacts and sends when the frontier AI asks.
const SENT_FILES = [
  'Mutual confidentiality agreement, signature page · signed by {parent}',
  'Certificate of formation · {buyer}',
  'Cover email · {signer}',
  'Earlier letter of intent · {parent}',
  'Board consent · {seller}',
  'Disclosure schedule · {seller}',
];

const VAULT_COUNT = 28;

// Spoken lines. *word* pops when it lands; [ORG_n] renders as a token.
const LINES = {
  jimmy1:  "Bob. They're buying us out. Term sheet's in my hand.",
  bob1:    "Right now? We're in *THEIR OFFICE*.",
  jimmy2:  'Momentum, Bob. Draft the agreement. You have *10 MINUTES*.',
  snapped: 'Picture taken. Into the laptop.',
  noTrust: "I don't trust their Wi-Fi. Going local.",
  wifiOff: "Wi-Fi off. Let's go.",
  zoeLook: "Looks like a term sheet. Let's mark the confidential data first.",
  marked:  'Marked. Nothing has left this laptop.',
  found:   'Found 28 files on this client in your vault.',
  loaded:  "Loaded your firm's buyout template and the conservative seller playbook.",
  conserv: "Conservative to start. We'll see what they come back with.",
  toDraft: "To draft, I need the frontier AI. I'll clean the data before the Wi-Fi comes back.",
  cleaned: 'Data cleaned. Wi-Fi on.',
  toCloud: 'Masked term sheet, template, playbook. Draft the agreement.',
  ask:     'Drafting. Who is [ORG_5]? Send what you have.',
  search:  'Searching the vault…',
  shell:   '[ORG_5] is an empty shell. [ORG_6] is the parent. [ORG_6] is not in this deal.',
  redact:  'Redacting 6 files. Sent.',
  fix:     'Adding [ORG_6]: parent guaranty, indemnification. Draft returning.',
  caught:  'They left the parent off the hook. Caught it.',
  jimmy3:  "Ten minutes. Tell me you've got something.",
  bob3:    "Draft's done. And their shell left the parent off the hook. It's in now.",
  jimmy4:  '…How?',
  bob4:    'ZOE.',
};

const UI = {
  mark: 'Mark confidential data',
  scrub: 'Scrub data & draft',
  template: ['Template', 'Buyout Agreement (Delaware)'],
  playbook: ['Playbook', 'Seller, conservative'],
  pills: { how: 'How does it work? ↓', inspect: 'Inspect what left the laptop', replay: 'Replay', back: 'Back', next: 'Next ›' },
  cloudName: 'any frontier model the firm chooses',
  cloudFirms: 'OpenAI · Anthropic · Google · Microsoft',
};

function track(event, data) {
  const payload = Object.assign({ event, t: Date.now() }, data);
  if (!ANALYTICS_ENDPOINT) {
    console.info('[track]', event, data || '');
    return;
  }
  try {
    navigator.sendBeacon(ANALYTICS_ENDPOINT, JSON.stringify(payload));
  } catch (_) { /* never let analytics break the page */ }
}

(() => {
  'use strict';

  // ---------- Tuning ----------
  const FRAMES = 45;
  const DRAG_FULL_PX = 220;    // upward travel for a full open
  const SNAP_AT = 0.4;         // release past this opens, below shuts
  const PLAY_MS = 900;         // tap / click / wheel / key: frames 1 -> 45
  const IDLE_FIRST_MS = 12000; // gesture 1 auto-performs after this long with no input
  const IDLE_LATER_MS = 10000; // the hand-over to the laptop, and gestures 2-4
  const TAP_SLOP_PX = 8;
  const FLICK_PX_PER_MS = 0.6; // upward release speed that opens regardless of distance
  const TYPE_MS = 20;          // per character
  const SWEEP_MS = 1600;
  const CAPTURE_HOLD_MS = 1100; // the captured page shows in the phone before the laptop comes in
  const LAPTOP_IN_MS = 1100;    // the laptop's slide in from the right (the .scene translate in styles.css)

  // Height of the lid's bright top edge per frame, % of frame height from the top
  // (measured on the 1280 set; 100 = lid still flat). Mid-swing the edge rises
  // into the tagline, so the tagline dims while the two overlap.
  const LID_EDGE = [
    100, 100, 100, 100, 100, 57.9, 55.1, 52.4, 49.4, 47.4, 45.3, 43.5, 41.8, 40.3, 38.9,
    37.2, 36.0, 34.9, 34.0, 33.2, 32.5, 31.8, 31.3, 30.7, 30.4, 30.3, 30.0, 30.0, 30.0, 30.1,
    30.4, 30.7, 31.1, 31.7, 32.2, 32.9, 33.8, 34.0, 34.4, 34.7, 35.0, 35.3, 35.4, 35.7, 35.8,
  ];

  // Screen rectangle on lid_45 as fractions of the frame (matches --screen-* in styles.css).
  const SCR = { x: 0.3068, y: 0.3602, w: 0.3839, h: 0.3963 };

  const $ = (sel, root = document) => root.querySelector(sel);
  const stage = $('.stage');
  const scene = $('.scene', stage);
  const poster = $('#lid-poster');
  const canvas = $('.lid', stage);
  const ctx2d = canvas.getContext('2d', { alpha: false });
  const lidHit = $('.lid-hit', stage);
  const tagline = $('.tagline', stage);
  const rim = $('.rim', stage);
  const screen = $('.screen', stage);
  const strip = $('.strip', stage);
  const brand = $('.brand', stage);
  const sheet = $('.sheet', stage);
  const phone = $('.phone', stage);
  const transfer = $('.transfer', stage);
  const fly = $('.fly', stage);
  const zoe = $('.zoe', stage);
  const cloud = $('.cloud', stage);
  const stream = $('.stream', stage);
  const label = $('.stream-label', stage);
  const fan = $('.fan', stage);
  const pills = $('.pills', stage);
  const inspect = $('.inspect', stage);
  const dots = Array.from(stage.querySelectorAll('.progress li'));
  const live = $('#live');

  const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const portraitMQ = window.matchMedia('(orientation: portrait)');
  const frameSet = window.matchMedia('(min-width: 900px)').matches ? 1920 : 1280;
  const frameUrl = (i) => `assets/frames/${frameSet}/lid_${String(i + 1).padStart(2, '0')}.webp`;

  // ---------- Text helpers ----------

  const fill = (tpl, which) => tpl.replace(/\{(\w+)\}/g, (_, k) => PARTIES[k][which]);
  const plain = (s) => s.replace(/\*/g, '');
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // {key} → a span that can flare amber, swap to its mask and snap back.
  function piiHtml(tpl, start = 'real') {
    return esc(tpl).replace(/\{(\w+)\}/g, (_, k) =>
      `<span class="pii${start === 'mask' ? ' is-masked' : ''}" data-k="${k}">${esc(PARTIES[k][start])}</span>`);
  }

  // Splits a line into typed segments: plain text, *emphasis* and [TOKENS].
  function segments(line) {
    const out = [];
    line.split(/(\*[^*]+\*|\[[A-Z]+_\d+\])/).forEach((part) => {
      if (!part) return;
      if (part[0] === '*') out.push({ text: part.slice(1, -1), cls: 'em' });
      else if (part[0] === '[') out.push({ text: part, cls: 'pii is-masked' });
      else out.push({ text: part, cls: '' });
    });
    return out;
  }

  // ---------- Runs, waits and cancellation (Replay cancels the running story) ----------

  let run = { id: 0, cancelled: false, timers: new Set() };
  class Cancelled extends Error {}

  function check(r = run) {
    if (r.cancelled) throw new Cancelled();
  }

  function wait(ms, instantOk = true) {
    const r = run;
    if (RM && instantOk) return Promise.resolve().then(() => check(r));
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => {
        r.timers.delete(t);
        if (r.cancelled) reject(new Cancelled());
        else resolve();
      }, ms);
      r.timers.add(t);
    });
  }

  function cancelRun() {
    run.cancelled = true;
    run.timers.forEach(clearTimeout);
    run.timers.clear();
    clearTimeout(idleTimer);
    gestureNow = null;
  }

  function animate(el, keyframes, opts) {
    if (RM || !el.animate) return Promise.resolve();
    return el.animate(keyframes, opts).finished.catch(() => {});
  }

  // ---------- Speech ----------

  const AVATARS = {
    jimmy: '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="20" fill="#f2994a"/><circle cx="20" cy="23" r="11" fill="#ffd8b5"/><path d="M8 18c1-8 7-12 13-11 5-3 11 1 12 6l-3-1 1 4-4-3-1 3-3-3-2 3-2-3-3 3-1-3-4 4z" fill="#5a3214"/><circle cx="16" cy="22" r="1.4" fill="#2a1a0e"/><circle cx="24" cy="22" r="1.4" fill="#2a1a0e"/><path d="M14.5 27c3 3.5 8 3.5 11 0" stroke="#2a1a0e" stroke-width="1.6" fill="#fff" stroke-linecap="round"/></svg>',
    bob: '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="20" fill="#3d6fb6"/><circle cx="20" cy="23" r="11" fill="#f1c9a5"/><path d="M9 20c0-8 6-12 11-12 6 0 11 4 11 10-4-1-9-3-11-6-2 4-6 6-11 8z" fill="#3a2a1f"/><rect x="12.5" y="19.5" width="6.5" height="5" rx="1.5" fill="none" stroke="#1b2430" stroke-width="1.2"/><rect x="21" y="19.5" width="6.5" height="5" rx="1.5" fill="none" stroke="#1b2430" stroke-width="1.2"/><path d="M19 21.5h2" stroke="#1b2430" stroke-width="1.2"/><path d="M16.5 28.5h7" stroke="#1b2430" stroke-width="1.5" stroke-linecap="round"/></svg>',
  };

  const NAMES = { jimmy: 'Jimmy', bob: 'Bob', zoe: 'ZOE', cloud: 'Frontier AI' };

  function announce(who, line, thinking) {
    live.textContent = `${NAMES[who]}${thinking ? ' (thinking)' : ''}: ${plain(line)}`;
  }

  // Types a line into el; *emphasis* pops when it lands.
  function typeInto(el, line) {
    const r = run;
    el.textContent = '';
    const segs = segments(line).map((s) => {
      const span = document.createElement('span');
      if (s.cls) span.className = s.cls;
      el.appendChild(span);
      return { s, span };
    });
    if (RM) {
      segs.forEach(({ s, span }) => { span.textContent = s.text; });
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      let i = 0;
      let c = 0;
      const tick = () => {
        if (r.cancelled) { reject(new Cancelled()); return; }
        const seg = segs[i];
        if (!seg) { resolve(); return; }
        // Tokens land whole, the way the product shows them.
        if (seg.s.cls.startsWith('pii')) { seg.span.textContent = seg.s.text; c = seg.s.text.length; }
        else { c += 1; seg.span.textContent = seg.s.text.slice(0, c); }
        if (stripMode === 'centre') placeStrip();
        if (c >= seg.s.text.length) {
          if (seg.s.cls === 'em') seg.span.classList.add('is-pop');
          i += 1;
          c = 0;
        }
        const t = setTimeout(tick, TYPE_MS);
        r.timers.add(t);
      };
      tick();
    });
  }

  // Reading time after a line has typed.
  const dwell = (line) => 450 + plain(line).length * 18;

  const maxMsgs = () => (portraitMQ.matches ? 3 : 4);

  function addMsg(who, thinking) {
    const msgs = strip.querySelectorAll('.msg:not(.is-out)');
    if (msgs.length >= maxMsgs()) msgs[0].remove();
    const m = document.createElement('div');
    m.className = `msg ${who}${thinking ? ' think' : ''}`;
    m.innerHTML = `<span class="avatar">${AVATARS[who]}</span><p class="bubble">${thinking ? '<span class="who">Bob, thinking</span>' : ''}<span class="txt"></span></p>`;
    strip.appendChild(m);
    placeStrip();
    void m.offsetWidth;
    m.classList.add('is-in');
    return m.querySelector('.txt');
  }

  // Chat bubble (Jimmy and Bob while Jimmy is in the room).
  async function say(who, key, hold = true) {
    const line = LINES[key];
    announce(who, line);
    await typeInto(addMsg(who, false), line);
    if (hold) await wait(dwell(line));
  }

  // Bob's thought bubble: one at a time, replacing the last.
  async function think(key, hold = true) {
    const line = LINES[key];
    strip.querySelectorAll('.msg.think').forEach((m) => m.remove());
    announce('bob', line, true);
    await typeInto(addMsg('bob', true), line);
    if (hold) await wait(dwell(line));
  }

  function clearStrip(selector = '.msg') {
    strip.querySelectorAll(selector).forEach((m) => {
      m.classList.add('is-out');
      const t = setTimeout(() => m.remove(), RM ? 0 : 320);
      run.timers.add(t);
    });
  }

  // The strip's place in Act I: 'centre' while the chat types, 'top' once the paper comes, null afterwards.
  let stripMode = null;
  const stripK = () => parseFloat(getComputedStyle(strip).getPropertyValue('--strip-k')) || 1;
  const brandFoot = () => brand.offsetTop + brand.offsetHeight;

  function stripTo(mode) {
    stripMode = mode;
    strip.classList.toggle('is-act1', !!mode);
    strip.classList.toggle('is-centre', mode === 'centre');
    placeStrip();
  }

  function placeStrip() {
    if (!stripMode) {
      strip.style.transform = '';
      return;
    }
    const V = stage.clientWidth;
    const VH = stage.clientHeight;
    const w = strip.offsetWidth;
    const h = strip.offsetHeight;
    let tx = 0;
    let ty = 0;
    let s = 1;
    if (stripMode === 'centre') {
      // Dead centre, unless that would crowd the small wordmark.
      tx = (V - w) / 2 - strip.offsetLeft;
      ty = Math.max(brandFoot() + 16, (VH - h) / 2) - strip.offsetTop;
    } else {
      // Desktop: the strip's own top-left corner. Portrait: centred under the small wordmark.
      s = 1 / stripK();
      if (portraitMQ.matches) {
        tx = (V - w * s) / 2 - strip.offsetLeft;
        ty = brandFoot() + 6 - strip.offsetTop;
      }
    }
    strip.style.transform = `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) scale(${s.toFixed(4)})`;
  }

  // While it is centred, the strip re-centres as each bubble grows (typeInto also calls it per character).
  if ('ResizeObserver' in window) new ResizeObserver(() => { if (stripMode) placeStrip(); }).observe(strip);

  async function zoeSay(key, hold = true) {
    const line = LINES[key];
    announce('zoe', line);
    await typeInto($('.zoe-say', zoe), line);
    if (hold) await wait(dwell(line));
  }

  async function cloudSay(key, hold = true) {
    const line = LINES[key];
    announce('cloud', line);
    await typeInto($('.cloud-say', cloud), line);
    if (hold) await wait(dwell(line));
  }

  const zoeWorking = (on) => zoe.classList.toggle('is-working', on);

  // ---------- Acts and progress ----------

  let act = 0;

  function setAct(n) {
    act = n;
    stage.dataset.act = String(n);
    dots.forEach((d, i) => {
      d.classList.toggle('is-on', i === n - 1);
      d.classList.toggle('is-done', i < n - 1);
    });
  }

  // ---------- Layout and camera ----------
  // Positions are set once per act change or resize (never animated); all motion is transform and opacity.

  let camMode = 'home';
  let geo = null;

  function sceneBox() {
    return { x: scene.offsetLeft, y: scene.offsetTop, w: scene.offsetWidth, h: scene.offsetHeight };
  }

  function place(el, x, y, w, h) {
    el.style.left = `${Math.round(x)}px`;
    el.style.top = `${Math.round(y)}px`;
    if (w != null) el.style.width = `${Math.round(w)}px`;
    if (h != null) el.style.height = `${Math.round(h)}px`;
  }

  function camera(mode) {
    camMode = mode;
    layout();
  }

  // Act I: the paper centred and large, the phone docked beside it (below right on portrait), and the
  // 'arrive' camera that brings the closed laptop in next to them once the picture is taken.
  function actOneGeometry(g) {
    const { S, V, VH } = g;
    const top = brandFoot();
    if (g.portrait) {
      const stripB = top + 6 + strip.offsetHeight / stripK() + 16;
      const floor = VH - 58;
      const sh = Math.min(0.64 * V * 1.29, 0.64 * (floor - stripB));
      const sw = sh / 1.29;
      g.sheet = { x: (V - sw) / 2, y: stripB, w: sw, h: sh };
      const pw = 0.55 * sw;
      const ph = pw * 2.05;
      g.phone = { x: V - 12 - pw, y: floor - ph, w: pw, h: ph };
      g.enter = { x: V - g.phone.x + 24, y: VH - g.phone.y + 24 };
      // The laptop comes in below the paper: frame rows 0.11 (its wordmark) to 0.75 (its base) fit above the dots.
      const zone = stripB + sh + 10;
      const cs = Math.max(0.45, Math.min(0.9, (floor - 6 - zone) / (0.64 * S.h)));
      g.arrive = { cs, cx: V / 2 - S.x - cs * 0.5 * S.w, cy: zone - S.y - cs * 0.11 * S.h };
    } else {
      const sh = Math.min(0.4 * VH, 0.3 * V * 1.29);
      const sw = sh / 1.29;
      const y = Math.max(top + 18, (VH - sh) / 2);
      g.sheet = { x: (V - sw) / 2, y, w: sw, h: sh };
      const pw = 0.62 * sw;
      const ph = pw * 2.05;
      g.phone = { x: g.sheet.x + sw + Math.max(96, 0.075 * V), y: y + sh / 2 - ph / 2, w: pw, h: ph };
      g.enter = { x: V - g.phone.x + 30, y: 0 };
      // The laptop settles centre-right, in the space right of the paper, its middle level with the page.
      const x0 = g.sheet.x + sw + 0.045 * V;
      const x1 = 0.97 * V;
      const cs = Math.min(0.66, (x1 - x0) / (0.57 * S.w));
      g.arrive = { cs, cx: (x0 + x1) / 2 - S.x - cs * 0.5 * S.w, cy: y + sh * 0.55 - S.y - cs * 0.65 * S.h };
    }
  }

  function layout() {
    const S = sceneBox();
    const V = stage.clientWidth;
    const VH = stage.clientHeight;
    const portrait = portraitMQ.matches;
    const g = { S, V, VH, portrait };
    actOneGeometry(g);
    let cx = 0;
    let cy = 0;
    let cs = 1;

    const stripR = parseFloat(getComputedStyle(stage).getPropertyValue('--strip-r')) || 200;
    if (camMode === 'arrive') {
      ({ cx, cy, cs } = g.arrive);
    } else if (portrait) {
      const zoomS = (V - 16) / (SCR.w * S.w);
      const screenTop = 112;
      if (camMode === 'center') {
        cy = Math.max(110, (VH - S.h) / 2) - S.y;
      } else if (camMode === 'zoom' || camMode === 'slide') {
        cs = zoomS;
        cx = 8 - S.x - cs * SCR.x * S.w;
        cy = screenTop - S.y - cs * SCR.y * S.h;
      } else if (camMode === 'end') {
        const top = stripR;
        cs = Math.min(1, (VH - top - 150) / S.h);
        cx = (V - cs * S.w) / 2 - S.x;
        cy = top - S.y;
      }
    } else if (camMode === 'slide') {
      // Laptop left and a little smaller, so the cloud fits on the right and the strip clears the logo.
      cs = 0.92;
      cx = -0.19 * S.w;
      cy = 0.05 * S.h;
    }
    stage.classList.toggle('is-zoomed', portrait && (camMode === 'zoom' || camMode === 'slide'));

    scene.style.setProperty('--cam-x', `${cx}px`);
    scene.style.setProperty('--cam-y', `${cy}px`);
    scene.style.setProperty('--cam-s', String(cs));

    // Scene-local point → stage point under the current camera.
    const at = (fx, fy) => ({ x: S.x + cx + cs * fx * S.w, y: S.y + cy + cs * fy * S.h });
    const scr = { tl: at(SCR.x, SCR.y), br: at(SCR.x + SCR.w, SCR.y + SCR.h) };
    Object.assign(g, { cs, scr });

    // The closed laptop under this camera (frame 1: body 0.215-0.785 across, 0.555-0.75 down),
    // and where the phone bumps it: its left edge on desktop, its top edge on portrait.
    g.laptop = { x0: at(0.215, 0).x, x1: at(0.785, 0).x, y0: at(0, 0.555).y, y1: at(0, 0.75).y };
    g.bump = portrait
      ? { x: (g.laptop.x0 + g.laptop.x1) / 2, y: g.laptop.y0 - g.phone.h * 0.36 }
      : { x: g.laptop.x0 - g.phone.w * 0.3, y: (g.laptop.y0 + g.laptop.y1) / 2 };

    if (portrait) {
      const below = scr.br.y + 12;
      g.zoe = { x: 12, y: below, w: V - 24 };
      g.labelFs = 17;
      g.label = { x: 8, y: below + 76, w: V - 16 };
      // The cloud sits above the progress dots; on short screens it gives up height first.
      const floor = VH - (RM ? 104 : 66);
      const cloudH = Math.max(112, Math.min(136, floor - (g.label.y + 72)));
      const cloudY = Math.max(g.label.y + 72, floor - cloudH);
      g.cloud = { x: 12, y: cloudY, w: V - 24, h: cloudH };
      g.stream = { x: V / 2, y: g.label.y + 30, len: Math.max(30, cloudY - (g.label.y + 30) - 6), rot: 90 };
      g.fan = { x: V / 2, y: scr.br.y };
      g.pills = { x: 12, y: camMode === 'end' ? stripR + cs * S.h * 0.93 : VH - 100, w: V - 24 };
    } else {
      const x0 = scr.br.x + 0.012 * S.w;
      const x1 = S.x + 0.79 * S.w;
      const y = at(0, 0.5).y;
      if (camMode === 'slide') g.zoe = { x: scr.br.x + 0.015 * S.w, y: y + 46, w: 0.21 * S.w };
      else g.zoe = { x: S.x + 0.775 * S.w, y: S.y + 0.36 * S.h, w: 0.205 * S.w };
      g.stream = { x: x0, y, len: x1 - x0, rot: 0 };
      g.labelFs = Math.max(16, Math.min(26, (x1 - x0 + 40) / 19));
      g.label = { x: x0 - 20, y: y - g.labelFs * 2.3, w: x1 - x0 + 40 };
      g.cloud = { x: x1 + 0.005 * S.w, y: y - 0.17 * S.h, w: 0.195 * S.w, h: 0.32 * S.h };
      g.fan = { x: scr.br.x, y: (scr.tl.y + scr.br.y) / 2 };
      g.pills = { x: 0, y: S.y + 0.905 * S.h, w: V };
    }

    // The paper's type scales with it: large enough to read as a page, too small to read the terms.
    const fs = `${(g.sheet.w * 0.026).toFixed(2)}px`;
    place(sheet, g.sheet.x, g.sheet.y, g.sheet.w, g.sheet.h);
    sheet.style.setProperty('--sheet-fs', fs);
    fly.style.setProperty('--sheet-fs', fs);
    place(phone, g.phone.x, g.phone.y, g.phone.w, g.phone.h);
    phone.style.setProperty('--enter-x', `${Math.round(g.enter.x)}px`);
    phone.style.setProperty('--enter-y', `${Math.round(g.enter.y)}px`);
    // Viewfinder offset: the paper's position relative to the phone's screen at the dock (see .phone-view).
    phone.style.setProperty('--vx', `${(g.sheet.x - g.phone.x - 0.06 * g.phone.w).toFixed(1)}px`);
    phone.style.setProperty('--vy', `${(g.sheet.y - g.phone.y - 0.045 * g.phone.h).toFixed(1)}px`);
    phone.style.setProperty('--vw', `${g.sheet.w.toFixed(1)}px`);
    phone.style.setProperty('--vh', `${g.sheet.h.toFixed(1)}px`);
    phone.style.setProperty('--sheet-fs', fs);
    place(zoe, g.zoe.x, g.zoe.y, g.zoe.w);
    place(cloud, g.cloud.x, g.cloud.y, g.cloud.w, g.cloud.h);
    place(stream, g.stream.x, g.stream.y, g.stream.len);
    stream.style.transform = g.stream.rot ? `rotate(${g.stream.rot}deg)` : '';
    place(label, g.label.x, g.label.y, g.label.w);
    label.style.setProperty('--label-fs', `${g.labelFs.toFixed(1)}px`);
    place(fan, g.fan.x, g.fan.y);
    place(pills, g.pills.x, g.pills.y, g.pills.w);
    geo = g;
    return g;
  }

  // ---------- Builders (fresh DOM on every run, so Replay starts clean) ----------

  function buildSheet() {
    sheet.className = 'sheet paper';
    sheet.innerHTML = `<h4>TERM SHEET</h4>` +
      TERM_SHEET.map(([k, v]) => `<p><b>${esc(k)}:</b> ${esc(fill(v, 'real'))}</p>`).join('') +
      SHEET_FILLER.map((t) => `<p>${esc(t)}</p>`).join('') +
      '<div class="type"></div>';
  }

  function buildPhone() {
    phone.className = 'phone';
    phone.hidden = false;
    phone.style.removeProperty('--px');
    phone.style.removeProperty('--py');
    phone.innerHTML = '<span class="phone-halo" aria-hidden="true"></span><div class="phone-body" aria-hidden="true"><div class="phone-screen"><div class="phone-view paper"></div><div class="phone-grid"></div><div class="phone-shutter"></div><div class="phone-flash"></div></div><div class="phone-island"></div></div><span class="phone-cue" aria-hidden="true"></span>';
    phone.setAttribute('tabindex', '-1');
    // The viewfinder: a copy of the paper that stays aligned with the real one as the phone moves over it.
    $('.phone-view', phone).innerHTML = sheet.innerHTML;
    // The same page is what flies into the laptop.
    fly.className = 'fly paper';
    fly.innerHTML = sheet.innerHTML;
  }

  function buildZoe() {
    zoe.className = 'zoe';
    zoe.innerHTML = '<div class="zoe-mark"><span>Z</span><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="#cfe0f5" stroke-width="3" stroke-dasharray="44 13"/><circle cx="12" cy="13" r="3.6" fill="#cfe0f5"/><circle cx="10.2" cy="7.6" r="1.1" fill="#cfe0f5"/><circle cx="13.4" cy="7.2" r="1.1" fill="#cfe0f5"/></svg><span>E</span></div><p class="zoe-say"></p>';
  }

  function buildCloud() {
    cloud.className = 'cloud';
    cloud.innerHTML = `<div class="cloud-glow"></div><p class="cloud-name">${esc(UI.cloudName)}</p><p class="cloud-firms">${esc(UI.cloudFirms)}</p><p class="cloud-say"></p>`;
  }

  function buildWorkspace() {
    const doc = TERM_SHEET.map(([k, v]) => `<p><span class="k">${esc(k)}</span> ${piiHtml(v)}</p>`).join('');
    const draft = DRAFT.map(([cls, v]) => `<p${cls ? ` class="${cls}"` : ''}>${piiHtml(v, 'mask')}</p>`).join('');
    screen.innerHTML = `
      <div class="ws">
        <header class="ws-top">
          <span class="ws-brand">ZOE <i>Workspace</i></span>
          <span class="ws-chip"><b>Matter</b><span class="files"></span><span class="ws-n">0</span><span class="ripple"></span></span>
          <span class="wifi">Wi-Fi ON</span>
        </header>
        <aside class="ws-matter"><p class="ws-h">Matter</p><p class="ws-count"><span class="ws-n">0</span> files</p><div class="files"></div><span class="ripple"></span></aside>
        <article class="editor">
          <div class="ed-bar"><span class="docx">.docx</span><span class="ed-name">Term Sheet</span></div>
          <div class="ed-page">${doc}</div>
          <div class="sweep"></div>
          <div class="draft">
            <div class="ed-bar"><span class="docx">.docx</span><span>Buyout Agreement · draft</span></div>
            <div class="ed-page">${draft}</div>
          </div>
        </article>
        <aside class="side">
          <p class="side-h">ZOE for Word</p>
          <button class="btn btn-mark" type="button" tabindex="-1">${esc(UI.mark)}</button>
          <div class="card card-t"><b>${esc(UI.template[0])}</b>${esc(UI.template[1])}</div>
          <div class="card card-p"><b>${esc(UI.playbook[0])}</b>${esc(UI.playbook[1])}</div>
          <button class="btn btn-scrub" type="button" tabindex="-1">${esc(UI.scrub)}</button>
        </aside>
        <svg class="web-lines"></svg>
      </div>`;
  }

  function buildFan() {
    fan.innerHTML = Array.from({ length: 6 }, () => '<span class="file"></span>').join('') + '<span class="packet">6 files</span>';
  }

  function resetStage() {
    stage.classList.add('is-resetting');
    strip.innerHTML = '';
    stripTo('centre');
    // A bare stage: the laptop waits off the right edge, the small wordmark shows.
    stage.classList.remove('laptop-in');
    stage.dataset.open = 'chat';
    laptopReady = false;
    arrival = Promise.resolve();
    transferDone = Promise.resolve();
    live.textContent = '';
    buildSheet();
    buildPhone();
    buildZoe();
    buildCloud();
    buildFan();
    transfer.style.opacity = '0';
    screen.hidden = true;
    screen.classList.remove('is-on');
    screen.innerHTML = '';
    stream.className = 'stream';
    label.className = 'stream-label';
    pills.innerHTML = '';
    inspect.hidden = true;
    inspect.className = 'inspect';
    inspect.innerHTML = '';
    stage.classList.add('cue-off');
    stage.classList.remove('lid-armed');
    setLidArmed(false);
    resetLid();
    camMode = 'arrive';
    setAct(0);
    layout();
    void stage.offsetWidth;
    requestAnimationFrame(() => stage.classList.remove('is-resetting'));
  }

  // ---------- Gestures: the moments the story waits for the visitor ----------

  let gestureNow = null;   // { name, perform, resolve, idleMs }
  let idleTimer = 0;

  function gesture(name, idleMs, perform, el) {
    return new Promise((resolve, reject) => {
      const r = run;
      if (RM) {
        // Reduced motion: each act is a still; the Next pill (or the gesture's own button) performs it instantly.
        let done = false;
        const go = async () => {
          if (done) return;
          done = true;
          pills.innerHTML = '';
          try { await perform('next'); resolve('next'); } catch (e) { reject(e); }
        };
        nextPill(go);
        if (el) {
          el.setAttribute('tabindex', '0');
          el.addEventListener('click', go, { once: true });
        }
        return;
      }
      gestureNow = {
        name,
        idleMs,
        r,
        busy: false,
        perform: async (method) => {
          const gn = gestureNow;
          if (!gn || gn.name !== name || gn.busy) return;
          gn.busy = true;
          clearTimeout(idleTimer);
          try {
            await perform(method);
            if (gestureNow === gn) gestureNow = null;
            if (r.cancelled) reject(new Cancelled()); else resolve(method);
          } catch (e) { reject(e); }
        },
      };
      if (el) {
        el.setAttribute('tabindex', '0');
        if (el.tagName === 'BUTTON') {
          el.addEventListener('click', (e) => {
            noteInput(e);
            if (gestureNow) gestureNow.perform(e.detail === 0 ? 'key' : 'click');
          }, { once: true });
        }
        // Keep keyboard users on the story: the next gesture takes focus if the last one had it.
        const ae = document.activeElement;
        if (keyboardMode && ae !== el && (!ae || ae === document.body || stage.contains(ae))) el.focus({ preventScroll: true });
      }
      armIdle();
    });
  }

  function armIdle() {
    clearTimeout(idleTimer);
    const g = gestureNow;
    if (!g || g.busy) return;
    idleTimer = setTimeout(() => {
      if (gestureNow !== g || g.busy) return;
      const inView = stage.getBoundingClientRect().bottom > window.innerHeight * 0.5;
      if (!drag && !phoneDrag && document.visibilityState === 'visible' && inView && !inspectOpen) g.perform('auto');
      else armIdle();
    }, g.idleMs);
  }

  let keyboardMode = false;
  function noteInput(e) {
    if (e && e.type === 'keydown') keyboardMode = true;
    if (e && e.type === 'pointerdown') keyboardMode = false;
    if (gestureNow && !gestureNow.busy) armIdle();
  }

  // ---------- Act I: the phone, and the laptop that arrives for it ----------

  let phoneStage = 0;      // 0 needs the snap, 1 needs the bump, 2 done
  let phoneDrag = null;
  let phoneOff = { x: 0, y: 0 };
  let laptopReady = false; // the laptop has slid in and can take the phone
  let arrival = Promise.resolve();
  let transferDone = Promise.resolve();
  let capturedScale = 0.3; // the captured page's scale inside the phone

  function setPhoneOff(x, y) {
    phoneOff = { x, y };
    phone.style.setProperty('--px', `${x}px`);
    phone.style.setProperty('--py', `${y}px`);
  }

  function phoneCenter() {
    return { x: geo.phone.x + geo.phone.w / 2 + phoneOff.x, y: geo.phone.y + geo.phone.h / 2 + phoneOff.y };
  }

  function setCue() {
    const cue = $('.phone-cue', phone);
    if (!cue) return;
    const p = geo.portrait;
    if (phoneStage === 0) cue.textContent = p ? 'Drag ↑' : 'Drag ←';
    else cue.textContent = p ? 'Drag ↓' : 'Drag →';
    phone.classList.toggle('cue-on', phoneStage > 0);
  }

  async function glideTo(pt, ms = 420) {
    phone.style.setProperty('--glide', `${ms}ms`);
    phone.classList.add('is-gliding');
    setPhoneOff(pt.x - (geo.phone.x + geo.phone.w / 2), pt.y - (geo.phone.y + geo.phone.h / 2));
    await wait(ms);
    phone.classList.remove('is-gliding');
  }

  function snap() {
    if (phoneStage !== 0) return;
    phoneStage = 1;
    // The shutter: a flash, then the page in the viewfinder straightens and settles in the middle of the screen.
    const view = $('.phone-view', phone);
    const scr = $('.phone-screen', phone);
    const w = view.offsetWidth;
    const h = view.offsetHeight;
    capturedScale = Math.min((scr.clientWidth * 0.8) / w, (scr.clientHeight * 0.68) / h);
    view.style.transform = getComputedStyle(view).transform;
    void view.offsetWidth;
    view.classList.add('is-captured');
    view.style.transform = `translate(${((scr.clientWidth - w) / 2).toFixed(1)}px, ${(scr.clientHeight * 0.43 - h / 2).toFixed(1)}px) scale(${capturedScale.toFixed(3)})`;
    phone.classList.add('is-snapped', 'cue-wait');
    $('.phone-flash', phone).classList.add('is-on');
    $('.phone-body', phone).classList.add('is-settle');
    sheet.classList.add('is-flash');
    setCue();
    stage.dataset.open = 'snapped';
    track('phone_snapped');
    arrival = laptopArrives();
    arrival.catch(() => {});
  }

  // After the picture: the captured page holds in the phone, then the closed laptop slides in from the right
  // and its baked wordmark takes over from the small one.
  async function laptopArrives() {
    await wait(CAPTURE_HOLD_MS);
    stage.classList.add('laptop-in');
    stage.dataset.open = 'laptop';
    await wait(LAPTOP_IN_MS);
    laptopReady = true;
    stage.dataset.open = 'laptop-ready';
    phone.classList.remove('cue-wait');
    // The hand-over waits for the visitor too, on the later idle clock.
    const g = gestureNow;
    if (g && g.name === 'phone' && !g.busy) {
      g.idleMs = IDLE_LATER_MS;
      armIdle();
    }
  }

  async function bump() {
    phoneStage = 2;
    stage.dataset.open = 'transfer';
    phone.classList.add('is-bumped');
    const body = $('.phone-body', phone);
    body.classList.remove('is-settle');
    body.classList.add('is-shake');
    const from = phoneCenter();
    const to = { x: (geo.laptop.x0 + geo.laptop.x1) / 2, y: (geo.laptop.y0 + geo.laptop.y1) / 2 };
    // The captured page flies out of the phone into the laptop, under the label; the rim flashes as it lands.
    const cw = geo.sheet.w;
    const ch = geo.sheet.h;
    const k = capturedScale;
    const fromY = geo.phone.y + phoneOff.y + geo.phone.h * (0.045 + 0.91 * 0.43);
    fly.style.width = `${cw}px`;
    fly.style.height = `${ch}px`;
    const f0 = `translate(${from.x - cw / 2}px, ${fromY - ch / 2}px) scale(${k.toFixed(3)})`;
    const f1 = `translate(${to.x - cw / 2}px, ${to.y - ch / 2 + 6}px) scale(${(k * 0.45).toFixed(3)}) rotate(-6deg)`;
    animate(fly, [
      { transform: f0, opacity: 1 },
      { transform: f1, opacity: 1, offset: 0.8 },
      { transform: f1, opacity: 0 },
    ], { duration: 900, easing: 'cubic-bezier(0.5, 0, 0.3, 1)' });
    const t = setTimeout(() => {
      rim.classList.remove('is-glowing');
      void rim.offsetWidth;
      rim.classList.add('is-glowing');
    }, RM ? 0 : 650);
    run.timers.add(t);
    // The local hand-over label: phone → laptop centre.
    const tw = transfer.offsetWidth;
    const th = transfer.offsetHeight;
    const p0 = `translate(${from.x - tw / 2}px, ${from.y - th / 2 - 30}px)`;
    const p1 = `translate(${to.x - tw / 2}px, ${to.y - th / 2 - 30}px)`;
    transfer.style.transform = p1;
    // Fades in on the phone, crosses to the laptop, and holds there long enough to read.
    const pulse = animate(transfer, [
      { transform: p0, opacity: 0 },
      { transform: p0, opacity: 1, offset: 0.1 },
      { transform: p1, opacity: 1, offset: 0.4 },
      { transform: p1, opacity: 1, offset: 0.85 },
      { transform: p1, opacity: 0 },
    ], { duration: 1900, easing: 'ease-in-out' });
    transferDone = pulse.then(() => { phone.hidden = true; });
    await wait(340);
    phone.classList.add('is-dropping');
    // The paper fades: it is in the laptop now.
    const t2 = setTimeout(() => sheet.classList.add('is-gone'), 380);
    run.timers.add(t2);
    await wait(500);
  }

  async function phoneAuto(method) {
    if (RM) {
      phoneStage = 2;
      phone.hidden = true;
      sheet.classList.add('is-gone');
      stage.classList.add('laptop-in');
      laptopReady = true;
      track('phone_snapped', { method });
      return;
    }
    if (phoneStage === 0) {
      const s = geo.sheet;
      await glideTo({ x: s.x + s.w / 2, y: s.y + s.h / 2 }, 650);
      snap();
    }
    await arrival;
    // Done for the visitor (tap, key or idle): the cue reads before the phone moves on.
    if (method !== 'drag') await wait(800);
    await glideTo(geo.bump, method === 'drag' ? 260 : 600);
    await bump();
  }

  const insideXY = (p, b, px, py) => p.x > b.x0 - px && p.x < b.x1 + px && p.y > b.y0 - py && p.y < b.y1 + py;
  const sheetMid = () => ({ x: geo.sheet.x + geo.sheet.w / 2, y: geo.sheet.y + geo.sheet.h / 2 });
  // The shutter fires once the phone is well over the page, so the viewfinder is seen first.
  const overPage = (c) => insideXY(c, { x0: geo.sheet.x, x1: geo.sheet.x + geo.sheet.w, y0: geo.sheet.y, y1: geo.sheet.y + geo.sheet.h },
    -0.26 * geo.sheet.w, -0.22 * geo.sheet.h);
  // The phone reaches the laptop once its leading edge is well onto it.
  const overLaptop = (c) => (geo.portrait
    ? insideXY(c, geo.laptop, 0, 0.36 * geo.phone.h)
    : insideXY(c, geo.laptop, 0.36 * geo.phone.w, 0.2 * geo.phone.h));
  const offStage = (c) => c.x < 0 || c.y < 0 || c.x > geo.V || c.y > geo.VH;

  phone.addEventListener('pointerdown', (e) => {
    if (!gestureNow || gestureNow.name !== 'phone' || gestureNow.busy) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    noteInput(e);
    phoneDrag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, ox: phoneOff.x, oy: phoneOff.y, moved: false };
    try { phone.setPointerCapture(e.pointerId); } catch (_) { /* best-effort */ }
  });

  phone.addEventListener('pointermove', (e) => {
    const d = phoneDrag;
    if (!d || e.pointerId !== d.id) return;
    const dx = e.clientX - d.x0;
    const dy = e.clientY - d.y0;
    if (!d.moved) {
      if (Math.hypot(dx, dy) < TAP_SLOP_PX) return;
      d.moved = true;
      phone.classList.add('is-dragging');
    }
    setPhoneOff(d.ox + dx, d.oy + dy);
    const c = phoneCenter();
    if (phoneStage === 0 && overPage(c)) snap();
    else if (phoneStage === 1 && laptopReady && overLaptop(c)) {
      phoneDrag = null;
      phone.classList.remove('is-dragging');
      gestureNow && gestureNow.perform('drag');
    }
  });

  function endPhoneDrag(e, cancelled) {
    const d = phoneDrag;
    if (!d || e.pointerId !== d.id) return;
    phoneDrag = null;
    phone.classList.remove('is-dragging');
    noteInput(e);
    if (!gestureNow || gestureNow.name !== 'phone') return;
    if (!d.moved) {
      if (!cancelled) gestureNow.perform('tap');
      return;
    }
    const c = phoneCenter();
    const s = sheetMid();
    if (phoneStage === 0) {
      // Forgiving: let go near the page and the phone lines up and takes the picture itself.
      if (Math.hypot(c.x - s.x, c.y - s.y) < 0.75 * Math.max(geo.sheet.w, geo.sheet.h)) glideTo(s, 360).then(snap, () => {});
      else glideTo({ x: geo.phone.x + geo.phone.w / 2, y: geo.phone.y + geo.phone.h / 2 }, 450).catch(() => {});
    } else if (phoneStage === 1) {
      if (laptopReady && overLaptop(c)) gestureNow.perform('drag');
      // Let go elsewhere and it holds the picture where it is, unless that is the laptop's place or off the stage.
      else if (overLaptop(c) || offStage(c)) glideTo(s, 450).catch(() => {});
    }
  }

  phone.addEventListener('pointerup', (e) => endPhoneDrag(e, false));
  phone.addEventListener('pointercancel', (e) => endPhoneDrag(e, true));
  phone.addEventListener('contextmenu', (e) => e.preventDefault());

  // Tapping the laptop while the phone is waiting nudges the phone's cue.
  scene.addEventListener('pointerdown', () => {
    if (gestureNow && gestureNow.name === 'phone') animate($('.phone-body', phone), [{ transform: 'translateY(0)' }, { transform: 'translateY(-8px)' }, { transform: 'translateY(0)' }], { duration: 360, fill: 'none' });
  });

  // ---------- Act II: the lid (Phase 1 scrub) ----------

  const frames = new Array(FRAMES).fill(null);
  let settled = 0;
  let allReady = RM;
  let progress = 0;
  let shownFrame = -1;
  let renderRaf = 0;
  let tweenRaf = 0;
  let drag = null;
  let pendingOpen = null;
  let wheelGuardUntil = 0;
  let lidArmed = false;
  let lidDone = null;

  canvas.width = frameSet;
  canvas.height = Math.round(frameSet * 0.5625);
  frames[0] = poster;

  function loadOrder(n) {
    const out = [0, n - 1];
    const queue = [[0, n - 1]];
    while (queue.length) {
      const [a, b] = queue.shift();
      if (b - a < 2) continue;
      const m = (a + b) >> 1;
      out.push(m);
      queue.push([a, m], [m, b]);
    }
    return out;
  }

  function onSettled() {
    settled += 1;
    if (settled < FRAMES) return;
    allReady = true;
    stage.classList.add('frames-ready');
    if (pendingOpen) {
      const method = pendingOpen;
      pendingOpen = null;
      playOpen(method);
    }
  }

  function loadFrame(i) {
    if (i === 0 && frameSet === 1280) {
      // The inline poster is lid_01 of this set already.
      (poster.decode ? poster.decode() : Promise.resolve()).catch(() => {}).then(() => {
        requestRender();
        onSettled();
      });
      return;
    }
    const img = new Image();
    img.decoding = 'async';
    img.src = frameUrl(i);
    img.decode()
      .then(() => {
        frames[i] = img;
        if (i === 0 || shownFrame !== Math.round(progress * (FRAMES - 1))) requestRender();
      })
      .catch(() => { /* a missing frame falls back to its nearest neighbour */ })
      .then(onSettled);
  }

  // Reduced motion never fetches the frames: the <picture> already shows lid_45.
  if (!RM) loadOrder(FRAMES).forEach(loadFrame);

  function nearestFrame(i) {
    for (let d = 0; d < FRAMES; d += 1) {
      if (i - d >= 0 && frames[i - d]) return i - d;
      if (i + d < FRAMES && frames[i + d]) return i + d;
    }
    return 0;
  }

  function render() {
    renderRaf = 0;
    if (RM) return;
    const f = nearestFrame(Math.round(progress * (FRAMES - 1)));
    if (f === shownFrame && canvas.classList.contains('is-live')) return;
    const img = frames[f];
    if (!img || !img.complete) return;
    ctx2d.drawImage(img, 0, 0, canvas.width, canvas.height);
    shownFrame = f;
    dimTagline(f);
    canvas.classList.add('is-live');
  }

  let taglineBottom = 0; // % of scene height
  function measureTagline() {
    taglineBottom = ((tagline.offsetTop + tagline.offsetHeight) / scene.offsetHeight) * 100;
  }
  function dimTagline(f) {
    const clearance = LID_EDGE[f] - taglineBottom;
    tagline.style.opacity = String(Math.min(1, Math.max(0, (clearance + 1.5) / 3)));
  }
  measureTagline();

  function requestRender() {
    if (!renderRaf) renderRaf = requestAnimationFrame(render);
  }

  const easeOutCubic = (k) => 1 - Math.pow(1 - k, 3);

  function cancelTween() {
    if (tweenRaf) cancelAnimationFrame(tweenRaf);
    tweenRaf = 0;
  }

  function tweenTo(target, ms, done) {
    cancelTween();
    const from = progress;
    const t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / ms);
      progress = from + (target - from) * easeOutCubic(k);
      render();
      if (k < 1) {
        tweenRaf = requestAnimationFrame(step);
      } else {
        tweenRaf = 0;
        if (done) done();
      }
    };
    tweenRaf = requestAnimationFrame(step);
  }

  function resetLid() {
    cancelTween();
    drag = null;
    pendingOpen = null;
    lidDone = null;
    progress = 0;
    shownFrame = -1;
    render();
  }

  function setLidArmed(on) {
    lidArmed = on;
    stage.classList.toggle('lid-armed', on);
    lidHit.setAttribute('aria-disabled', on ? 'false' : 'true');
    if (!on) lidHit.setAttribute('tabindex', '-1');
  }

  function playOpen(method) {
    if (!lidArmed || lidDone === 'opening') return;
    if (!allReady) {
      // The chevrons keep drifting; the lid opens the moment the last frame decodes.
      pendingOpen = pendingOpen || method;
      return;
    }
    lidDone = 'opening';
    stage.classList.add('cue-off');
    const ms = Math.max(200, PLAY_MS * (1 - progress));
    const r = run;
    tweenTo(1, ms, () => { if (!r.cancelled) landed(method); });
  }

  function snapShut() {
    tweenTo(0, Math.max(180, 520 * progress), () => {
      if (lidArmed) stage.classList.remove('cue-off');
      armIdle();
    });
  }

  // Frame 45 has landed.
  function landed(method) {
    progress = 1;
    render();
    pendingOpen = null;
    wheelGuardUntil = performance.now() + 600;
    setLidArmed(false);
    if (document.activeElement === lidHit) stage.focus({ preventScroll: true });
    track('lid_opened', { method });
    if (lidResolve) { const r = lidResolve; lidResolve = null; r(method); }
  }

  let lidResolve = null;
  function lidGesture(method) {
    if (RM) return Promise.resolve();
    return new Promise((resolve) => {
      lidResolve = resolve;
      if (progress >= 1) landed(method);   // the finger took it all the way
      else playOpen(method);
    });
  }

  lidHit.addEventListener('pointerdown', (e) => {
    if (!lidArmed || drag || lidDone) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    noteInput(e);
    cancelTween();
    drag = {
      id: e.pointerId, y0: e.clientY, x0: e.clientX, p0: progress, moved: false, type: e.pointerType,
      lastY: e.clientY, lastT: performance.now(), vy: 0,
    };
    try { lidHit.setPointerCapture(e.pointerId); } catch (_) { /* capture is best-effort */ }
  });

  lidHit.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id || !lidArmed) return;
    const dy = drag.y0 - e.clientY;
    if (!drag.moved) {
      if (Math.hypot(dy, e.clientX - drag.x0) < TAP_SLOP_PX) return;
      drag.moved = true;
      stage.classList.add('cue-off');
    }
    // The slop is subtracted so the lid starts from rest, but a fast first move keeps its distance.
    const travel = dy > 0 ? Math.max(0, dy - TAP_SLOP_PX) : dy;
    progress = Math.min(1, Math.max(0, drag.p0 + travel / DRAG_FULL_PX));
    const now = performance.now();
    drag.vy = (drag.lastY - e.clientY) / Math.max(1, now - drag.lastT); // px/ms, + is upward
    drag.lastY = e.clientY;
    drag.lastT = now;
    requestRender();
    if (progress >= 1 && frames[FRAMES - 1]) {
      const method = drag.type === 'mouse' ? 'drag-mouse' : 'drag';
      drag = null;
      lidDone = 'opening';
      if (gestureNow && gestureNow.name === 'lid') gestureNow.perform(method);
    }
  });

  function endDrag(e, cancelled) {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    noteInput(e);
    if (!d.moved) {
      if (!cancelled) gestureNow && gestureNow.name === 'lid' && gestureNow.perform(d.type === 'mouse' ? 'click' : 'tap');
      return;
    }
    // A quick upward flick opens even if it ends short of 40%.
    const flick = performance.now() - d.lastT < 100 && d.vy > FLICK_PX_PER_MS;
    if (progress >= SNAP_AT || flick) gestureNow && gestureNow.name === 'lid' && gestureNow.perform(d.type === 'mouse' ? 'drag-mouse' : 'drag');
    else snapShut();
  }

  lidHit.addEventListener('pointerup', (e) => endDrag(e, false));
  lidHit.addEventListener('pointercancel', (e) => endDrag(e, true));
  lidHit.addEventListener('contextmenu', (e) => e.preventDefault());

  // Desktop: a scroll tick or an arrow key opens the lid while it is the gesture.
  window.addEventListener('wheel', (e) => {
    if (performance.now() < wheelGuardUntil) {
      // Swallow trackpad momentum left over from the tick that opened the lid.
      e.preventDefault();
      return;
    }
    if (!lidArmed || window.scrollY > 4 || Math.abs(e.deltaY) < 1) return;
    e.preventDefault();
    noteInput(e);
    gestureNow && gestureNow.name === 'lid' && gestureNow.perform('wheel');
  }, { passive: false });

  document.addEventListener('keydown', (e) => {
    noteInput(e);
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    if (inspectOpen && e.key === 'Escape') { closeInspect(); return; }
    if (!gestureNow || gestureNow.busy) return;
    const activate = e.key === 'Enter' || e.key === ' ';
    if (gestureNow.name === 'phone' && t === phone && activate) {
      e.preventDefault();
      gestureNow.perform('key');
    } else if (gestureNow.name === 'lid' && ((t === lidHit && activate) ||
      ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && window.scrollY <= 4))) {
      e.preventDefault();
      gestureNow.perform('key');
    }
  });

  window.addEventListener('scroll', () => noteInput(), { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') armIdle();
  });

  // ---------- Act III / IV: the workspace ----------

  const ws = (sel) => $(sel, screen);
  const allPii = () => Array.from(screen.querySelectorAll('.editor > .ed-page .pii'));

  function mountScreen() {
    buildWorkspace();
    screen.hidden = false;
    void screen.offsetWidth;
    screen.classList.add('is-on');
    // Matter lives in the top bar on narrow screens, in its own column otherwise.
    const narrow = screen.clientWidth < 420;
    const files = ws(narrow ? '.ws-chip .files' : '.ws-matter .files');
    files.innerHTML = Array.from({ length: VAULT_COUNT }, () => '<span class="file"></span>').join('');
  }

  function wifi(on) {
    const w = ws('.wifi');
    w.classList.toggle('is-off', !on);
    w.textContent = on ? 'Wi-Fi ON' : 'Wi-Fi OFF · Air-gapped';
    w.classList.remove('is-flip');
    void w.offsetWidth;
    w.classList.add('is-flip');
  }

  function offsetIn(el, root) {
    let x = 0;
    let y = 0;
    let n = el;
    while (n && n !== root) {
      x += n.offsetLeft;
      y += n.offsetTop;
      n = n.offsetParent;
    }
    return { x, y, w: el.offsetWidth, h: el.offsetHeight };
  }

  // The magnifier sweep: each item changes as the bar passes it.
  async function sweep(apply) {
    const editor = ws('.editor');
    const bar = ws('.sweep');
    const items = allPii();
    if (RM) { items.forEach(apply); return; }
    const ew = editor.clientWidth;
    bar.classList.remove('is-running');
    void bar.offsetWidth;
    bar.classList.add('is-running');
    items.forEach((el) => {
      const o = offsetIn(el, editor);
      const t = setTimeout(() => apply(el), ((o.x + o.w * 0.5) / ew) * SWEEP_MS);
      run.timers.add(t);
    });
    await wait(SWEEP_MS + 150);
    bar.classList.remove('is-running');
  }

  const markItem = (el) => el.classList.add('is-amber');
  const scrubItem = (el) => {
    el.classList.remove('is-amber');
    el.classList.add('is-masked');
    el.textContent = PARTIES[el.dataset.k].mask;
  };

  // A web of the 28 vault files links up behind the editor, then settles into Matter.
  async function vaultWeb() {
    const box = ws('.ws');
    const cards = Array.from(screen.querySelectorAll('.files .file'));
    const W = box.clientWidth;
    const H = box.clientHeight;
    let seed = 7;
    const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    const pts = cards.map((c) => {
      const o = offsetIn(c, box);
      const tx = W * (0.12 + 0.76 * rnd());
      const ty = H * (0.18 + 0.7 * rnd());
      c.style.transform = `translate(${(tx - o.x - o.w / 2).toFixed(1)}px, ${(ty - o.y - o.h / 2).toFixed(1)}px) scale(1.5)`;
      return { x: tx, y: ty };
    });
    const svg = ws('.web-lines');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const line = (a, b) => `<line x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}"/>`;
    svg.innerHTML = pts.slice(1).map((p, i) => line(pts[i], p) + (i % 3 === 0 ? line(pts[i >> 1], p) : '')).join('');
    const counters = screen.querySelectorAll('.ws-n');
    void box.offsetWidth;
    for (let i = 0; i < cards.length; i += 1) {
      cards[i].classList.add('is-in');
      counters.forEach((n) => { n.textContent = String(i + 1); });
      if (i === 6) svg.classList.add('is-on');
      if (!RM && i % 4 === 3) await wait(40);
    }
    await wait(400);
    cards.forEach((c) => { c.style.transform = ''; });
    svg.classList.remove('is-on');
    await wait(700);
  }

  function flashFiles() {
    const cards = Array.from(screen.querySelectorAll('.files .file'));
    cards.forEach((c, i) => {
      if (RM) { c.classList.add('is-blue'); return; }
      const t = setTimeout(() => c.classList.add('is-blue'), i * 18);
      run.timers.add(t);
    });
  }

  function ripple() {
    screen.querySelectorAll('.ripple').forEach((r) => {
      r.classList.remove('is-on');
      void r.offsetWidth;
      r.classList.add('is-on');
    });
  }

  // Six redacted files fan out of the laptop, flash blue, and travel as one packet.
  async function sendFiles() {
    const cards = Array.from(fan.querySelectorAll('.file'));
    const packet = $('.packet', fan);
    const end = geo.portrait
      ? { x: geo.stream.x, y: geo.stream.y + geo.stream.len }
      : { x: geo.stream.x + geo.stream.len, y: geo.stream.y };
    const vec = { x: end.x - geo.fan.x, y: end.y - geo.fan.y };
    cards.forEach((c, i) => {
      const a = (i - 2.5) * 16;
      const spread = geo.portrait
        ? `translate(${(i - 2.5) * 26}px, 26px) rotate(${a}deg)`
        : `translate(30px, ${(i - 2.5) * 22}px) rotate(${a}deg)`;
      c.classList.add('is-in');
      c.style.transform = spread;
    });
    await wait(420);
    cards.forEach((c) => c.classList.add('is-blue'));
    await wait(300);
    cards.forEach((c) => { c.style.transform = ''; c.classList.remove('is-in'); });
    packet.classList.add('is-in');
    await wait(60);
    packet.style.transform = `translate(${vec.x}px, ${vec.y}px)`;
    await wait(900);
    packet.classList.remove('is-in');
  }

  async function rehydrate() {
    const draft = ws('.draft');
    draft.classList.add('is-in');
    await wait(800);
    draft.querySelectorAll('.pii').forEach((el) => {
      el.classList.remove('is-masked');
      el.classList.add('is-real');
      el.textContent = PARTIES[el.dataset.k].real;
    });
  }

  // ---------- Pills, inspect, replay ----------

  let inspectOpen = false;

  function pill(text, cls, onClick, href) {
    const el = document.createElement(href ? 'a' : 'button');
    el.className = `pill ${cls || ''}`;
    el.textContent = text;
    if (href) el.href = href; else el.type = 'button';
    el.addEventListener('click', onClick);
    pills.appendChild(el);
    requestAnimationFrame(() => el.classList.add('is-in'));
    return el;
  }

  function nextPill(onNext) {
    pills.innerHTML = '';
    const el = pill(UI.pills.next, 'is-main', () => {
      el.remove();
      onNext();
    });
    if (keyboardMode) el.focus({ preventScroll: true });
  }

  function endPills() {
    pills.innerHTML = '';
    pill(UI.pills.how, 'is-main', () => track('pill_how'), '#how');
    pill(UI.pills.inspect, 'is-main', openInspect);
    pill(UI.pills.replay, '', () => { track('pill_replay'); start(); });
  }

  function openInspect() {
    track('pill_inspect');
    inspectOpen = true;
    const realDoc = TERM_SHEET.map(([k, v]) => `<p><b>${esc(k)}:</b> ${piiHtml(v)}</p>`).join('');
    const maskDoc = TERM_SHEET.map(([k, v]) => `<p><b>${esc(k)}:</b> ${piiHtml(v, 'mask')}</p>`).join('');
    const sent = SENT_FILES.map((f) => `<li>${piiHtml(f, 'mask')}</li>`).join('');
    inspect.innerHTML = `
      <h2 class="insp-h">What left the laptop</h2>
      <div class="insp-cols">
        <section class="insp-col">
          <h3>On the laptop · the real term sheet</h3>
          <div class="insp-doc">${realDoc}</div>
        </section>
        <section class="insp-col is-out">
          <h3>Received by the frontier AI</h3>
          <div class="insp-doc">${maskDoc}</div>
          <ul class="insp-list">
            <li><b>Also sent:</b> ${esc(UI.template[0])} · ${esc(UI.template[1])}; ${esc(UI.playbook[0])} · ${esc(UI.playbook[1])}</li>
            <li><b>Request:</b> ${esc(plain(LINES.toCloud))}</li>
            <li><b>When asked, 6 redacted files:</b></li>
            ${sent}
          </ul>
        </section>
      </div>
      <ol class="timeline" aria-label="Wi-Fi timeline">
        <li class="off">Wi-Fi OFF · Air-gapped</li>
        <li class="off">Confidential data marked</li>
        <li class="off">Data scrubbed</li>
        <li class="on">Wi-Fi ON</li>
        <li class="on">Masked term sheet sent</li>
        <li class="on">6 redacted files sent</li>
        <li class="on">Draft returned · real names restored on the laptop</li>
      </ol>
      <div class="insp-back"></div>`;
    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'pill is-main is-in';
    back.textContent = UI.pills.back;
    back.addEventListener('click', closeInspect);
    $('.insp-back', inspect).appendChild(back);
    inspect.hidden = false;
    void inspect.offsetWidth;
    inspect.classList.add('is-in');
    back.focus({ preventScroll: true });
  }

  function closeInspect() {
    inspectOpen = false;
    inspect.classList.remove('is-in');
    const t = setTimeout(() => { inspect.hidden = true; inspect.innerHTML = ''; }, RM ? 0 : 360);
    run.timers.add(t);
    const p = pills.querySelector('.pill:nth-child(2)');
    if (p) p.focus({ preventScroll: true });
  }

  // ---------- The story ----------

  async function story() {
    // Act I — the ambush and the snap. A bare stage: the chat types dead centre, then makes room for the paper.
    setAct(1);
    await wait(400);
    await say('jimmy', 'jimmy1');
    await say('bob', 'bob1');
    await say('jimmy', 'jimmy2', false);
    await wait(600);
    stripTo('top');
    stage.dataset.open = 'sheet';
    layout();                                      // on portrait the paper sits under the strip's new place
    await wait(520);                               // the strip has mostly cleared the middle
    sheet.classList.add('is-in');
    await wait(1000);
    phone.classList.add('is-in');
    stage.dataset.open = 'phone';
    setCue();
    // Each gesture is armed as soon as its prompt appears; its idle clock starts then.
    await gesture('phone', IDLE_FIRST_MS, phoneAuto, phone);
    phone.setAttribute('tabindex', '-1');
    clearStrip('.msg:not(.think)');

    // Act II — open the laptop, pull the plug
    setAct(2);
    await wait(360);
    stripTo(null);                                 // the chat has gone; the strip is back to its own size
    const thoughts = think('snapped').then(() => think('noTrust', false));
    await transferDone;
    stage.dataset.open = 'done';
    camera('center');                              // the laptop glides to dead centre
    await wait(450);
    let g2 = Promise.resolve();
    if (!RM) {
      setLidArmed(true);
      stage.classList.remove('cue-off');
      g2 = gesture('lid', IDLE_LATER_MS, lidGesture, lidHit);
    }
    await Promise.all([thoughts, g2]);
    mountScreen();
    await wait(250);
    wifi(false);                                   // OFF before any ZOE line
    await wait(200);
    camera('zoom');
    await think('wifiOff', false);
    zoe.classList.add('is-in');
    zoeWorking(true);
    await wait(450);

    // Act III — local work, offline
    setAct(3);
    zoeWorking(false);
    const mark = ws('.btn-mark');
    mark.classList.add('is-armed');
    const look = zoeSay('zoeLook', false);
    const g3 = gesture('mark', IDLE_LATER_MS, async (method) => {
      mark.classList.remove('is-armed');
      mark.classList.add('is-done');
      mark.setAttribute('tabindex', '-1');
      track('marked', { method });
      await sweep(markItem);
    }, mark);
    await Promise.all([look, g3]);
    await zoeSay('marked', false);
    await wait(450);
    zoeWorking(true);
    const found = zoeSay('found', false);
    await vaultWeb();
    await found;
    zoeWorking(false);
    ws('.card-t').classList.add('is-in');
    await wait(120);
    ws('.card-p').classList.add('is-in');
    const thought = wait(500).then(() => think('conserv', false));
    await zoeSay('loaded');
    await thought;
    const scrub = ws('.btn-scrub');
    scrub.classList.add('is-armed');
    const toDraft = zoeSay('toDraft', false);
    const g4 = gesture('scrub', IDLE_LATER_MS, async (method) => {
      scrub.classList.remove('is-armed');
      scrub.classList.add('is-done');
      scrub.setAttribute('tabindex', '-1');
      track('scrubbed', { method });
      setAct(4);
      zoeWorking(true);
      await sweep(scrubItem);
      flashFiles();
    }, scrub);
    await Promise.all([toDraft, g4]);

    // Act IV — the scrub and the round trip
    zoeWorking(false);
    await zoeSay('cleaned', false);
    wifi(true);                                    // ON after the scrub, never before
    await wait(350);
    if (!geo.portrait) {
      zoe.classList.remove('is-in');
      await wait(250);
    }
    clearStrip();
    camera('slide');
    $('.zoe-say', zoe).textContent = '';
    zoe.classList.add('is-in');
    cloud.classList.add('is-in');
    await wait(400);
    stream.classList.add('is-on', 'is-out');
    label.classList.add('is-on');
    await zoeSay('toCloud', false);
    await wait(450);
    track('reached_cloud');
    stream.classList.remove('is-out');
    cloud.classList.add('is-busy');
    await cloudSay('ask');
    zoeWorking(true);
    ripple();
    await zoeSay('search', false);
    await wait(350);
    await zoeSay('shell');
    const redacting = zoeSay('redact', false);
    await sendFiles();
    await redacting;
    zoeWorking(false);
    const fix = cloudSay('fix', false);
    stream.classList.add('is-back');
    await wait(900);
    await fix;
    stream.classList.remove('is-back');
    cloud.classList.remove('is-busy');
    await rehydrate();
    await wait(300);
    await think('caught', false);
    await wait(800);
    if (RM) await gesture('act5', 0, async () => {});

    // Act V — ten minutes are up
    setAct(5);
    cloud.classList.add('is-out');
    stream.classList.remove('is-on');
    label.classList.remove('is-on');
    zoe.classList.remove('is-in');
    clearStrip();
    camera(geo.portrait ? 'end' : 'home');
    await wait(450);
    await say('jimmy', 'jimmy3');
    await say('bob', 'bob3');
    await say('jimmy', 'jimmy4');
    await say('bob', 'bob4', false);
    await wait(300);
    endPills();
    storyEndedAt = performance.now();
  }

  let storyStartedAt = 0;
  let storyEndedAt = 0;

  function start() {
    cancelRun();
    run = { id: run.id + 1, cancelled: false, timers: new Set() };
    phoneStage = 0;
    phoneDrag = null;
    phoneOff = { x: 0, y: 0 };
    inspectOpen = false;
    storyStartedAt = performance.now();
    storyEndedAt = 0;
    resetStage();
    story().catch((e) => { if (!(e instanceof Cancelled)) console.error(e); });
  }

  // ---------- Go ----------

  window.addEventListener('resize', () => {
    measureTagline();
    if (shownFrame >= 0) dimTagline(shownFrame);
    placeStrip();
    layout();
  });

  // Deep-dive reached: the drawer below the hero scrolls into view.
  if ('IntersectionObserver' in window) {
    const how = document.getElementById('how');
    const io = new IntersectionObserver((entries) => {
      if (entries.some((en) => en.isIntersecting)) {
        track('deep_dive_reached');
        io.disconnect();
      }
    }, { threshold: 0.3 });
    if (how) io.observe(how);
  }

  // Below the hero: the certification badge's script loads when the founder section comes near,
  // so the third-party request never competes with the first paint.
  const founder = document.getElementById('founder');
  if (founder && 'IntersectionObserver' in window) {
    const badgeIo = new IntersectionObserver((entries) => {
      if (!entries.some((en) => en.isIntersecting)) return;
      badgeIo.disconnect();
      const s = document.createElement('script');
      s.src = 'https://cdn.credly.com/assets/utilities/embed.js';
      s.async = true;
      document.body.appendChild(s);
    }, { rootMargin: '600px 0px' });
    badgeIo.observe(founder);
  }

  // Privacy and Terms are :target modals; Escape closes them.
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && /^#(privacy|terms)$/.test(location.hash)) location.hash = 'site-footer';
  });

  start();

  // Exposed for tools/shots.spec.js and for tuning in the console.
  window.__zoeHero = {
    get act() { return act; },
    get gesture() { return gestureNow ? gestureNow.name : (RM && pills.querySelector('.pill') ? 'next' : null); },
    get progress() { return progress; },
    get framesReady() { return allReady; },
    get frameSet() { return frameSet; },
    get ended() { return storyEndedAt ? Math.round(storyEndedAt - storyStartedAt) : 0; },
    get camera() { return camMode; },
    get opening() { return stage.dataset.open || ''; },
    perform: (method = 'debug') => gestureNow && gestureNow.perform(method),
    replay: start,
  };
})();
