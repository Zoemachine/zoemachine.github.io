// ZOE AI — the comparison below the hero: standard cloud AI versus ZOE AI.
// Each diagram is drawn from the layout data below (a wide one, and a compact tall one that fits a phone
// screen) and animated with the Web Animations API (transform and opacity, nothing else). The cloud
// panel plays once and holds on its caption, then flips to ZOE AI; the ZOE panel's motion loops gently.

(() => {
  'use strict';

  const section = document.getElementById('dataflow');
  if (!section) return;
  const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tallMQ = window.matchMedia('(max-width: 699px)');
  const LOOP_MS = 8000;
  const FLIP_MS = 5000;   // after the cloud panel's caption has typed, before it flips to ZOE AI
  const TYPE_MS = 24;     // the cloud caption's added sentence, per character (the hero's pace)

  // ---------- Layouts ----------

  // Standard cloud AI: the chain the file travels, then the vendor's orchestration fanning it out to
  // subprocessors, with more behind the last of them (the trailing boxes, unlabeled). Every node past
  // the control line is an attack surface: eight labeled, three trailing, eleven in all.
  // Boxes are [x, y, w, h]; a title may be two lines.
  const CAP = "Multiple hops. Every system past the router is one you don't control.";
  const POINT = 'A chain of AI vendors and subprocessors is a larger attack surface than traditional cloud software.';
  const CLOUD_TITLE = "In a standard cloud AI, your client's file leaves your laptop, crosses your office router and your internet provider (ISP) to the vendor's cloud, which orchestrates it across confidentiality services (PII), a search index (RAG), frontier models (LLM), logging and evaluation, and additional subprocessors behind them: eleven attack surfaces, none of them under your control.";
  const CLOUD = {
    wide: {
      view: [1200, 580],
      control: { x: 168, y1: 44, y2: 476, badge: [68, 8, 200, 26] },
      hops: [
        { id: 'laptop', box: [12, 206, 136, 88], t: 'Your laptop', s: "your client's file", safe: true },
        { id: 'router', box: [190, 214, 128, 72], t: 'Office router' },
        { id: 'isp', box: [340, 214, 214, 72], t: 'Internet provider (ISP)' },
        { id: 'vendor', box: [578, 202, 178, 96], t: 'Vendor cloud', s: 'orchestration' },
      ],
      down: [
        { box: [812, 15, 304, 70], t: 'Confidentiality services (PII)', s: 'reads every name in your file' },
        { box: [812, 115, 304, 70], t: 'Search index (RAG)', s: 'your clauses, stored on their disk' },
        { box: [812, 215, 304, 70], t: 'Frontier models (LLM)', s: 'generate from your text' },
        { box: [812, 315, 304, 70], t: 'Logging & evaluation', s: 'more copies, more vendors' },
        { box: [812, 415, 304, 70], t: 'Additional subprocessors', faded: true },
      ],
      trail: { from: [1116, 450], boxes: [[1144, 404, 76, 26], [1158, 437, 76, 26], [1144, 470, 76, 26]] },
      tag: [110, 22],
      caption: [12, 532, 'start'],
      cap: [CAP],
      point: [POINT],
    },
    // Compact, so the heading, the choices and the whole panel fit one phone screen (390 x 664): the chain
    // runs down the left, the fan-out down the right.
    tall: {
      view: [400, 520],
      control: { y: 62, badge: [118, 51, 164, 22] },
      hops: [
        { id: 'laptop', box: [6, 4, 140, 44], t: 'Your laptop', s: "your client's file", safe: true },
        { id: 'router', box: [6, 84, 140, 40], t: 'Office router' },
        { id: 'isp', box: [6, 146, 140, 52], t: ['Internet', 'provider (ISP)'] },
        { id: 'vendor', box: [6, 222, 140, 54], t: 'Vendor cloud', s: 'orchestration' },
      ],
      down: [
        { box: [160, 80, 234, 46], t: 'Confidentiality services (PII)', s: 'reads every name in your file' },
        { box: [160, 138, 234, 46], t: 'Search index (RAG)', s: 'your clauses, on their disk' },
        { box: [160, 196, 234, 46], t: 'Frontier models (LLM)', s: 'generate from your text' },
        { box: [160, 254, 234, 46], t: 'Logging & evaluation', s: 'more copies, more vendors' },
        { box: [160, 312, 234, 36], t: 'Additional subprocessors', faded: true },
      ],
      trail: { from: [277, 348], boxes: [[262, 364, 70, 14], [300, 382, 70, 14], [338, 400, 70, 14]] },
      tag: [86, 17],
      small: true,
      caption: [200, 446, 'middle'],
      cap: ['Multiple hops. Every system past the router', "is one you don't control."],
      point: ['A chain of AI vendors and subprocessors is a larger', 'attack surface than traditional cloud software.'],
    },
  };

  const ZOE = {
    wide: {
      view: [1160, 530],
      badge: [130, 12, 286, 28],
      laptop: [130, 56, 770, 372],
      base: [96, 434, 838, 16],
      core: [430, 203, 200, 76],
      doc: [530, 312],
      parts: [
        { box: [170, 108, 196, 64], t: 'Name finder', s: 'finds every identifier' },
        { box: [692, 108, 196, 64], t: 'Clause library', s: 'your templates and clauses' },
        { box: [170, 314, 196, 64], t: 'Document reader', s: 'reads your files locally' },
        { box: [692, 314, 196, 64], t: 'Signature reader', s: 'reads signature pages' },
      ],
      line: [904, 241, 994, 241],
      cloud: [1066, 241],
      blurb: ['frontier model, or a high-end', "model on the firm's own server"],
      caption: [530, 486, 'middle'],
    },
    tall: {
      view: [400, 552],
      badge: [57, 4, 286, 24],
      laptop: [16, 36, 368, 310],
      base: [0, 352, 400, 12],
      core: [120, 142, 160, 60],
      doc: [200, 238],
      parts: [
        { box: [30, 52, 166, 54], t: 'Name finder', s: 'finds every identifier' },
        { box: [204, 52, 166, 54], t: 'Clause library', s: 'templates and clauses' },
        { box: [30, 280, 166, 54], t: 'Document reader', s: 'reads files locally' },
        { box: [204, 280, 166, 54], t: 'Signature reader', s: 'reads signature pages' },
      ],
      line: [200, 368, 200, 398],
      cloud: [200, 436],
      blurb: ['frontier model, or a high-end', "model on the firm's own server"],
      caption: [200, 520, 'middle'],
    },
  };

  // ---------- Drawing ----------

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const mid = ([x, y, w, h]) => ({ x: x + w / 2, y: y + h / 2 });
  const docGlyph = (cls) => `<g class="${cls}"><rect x="-11" y="-14" width="22" height="28" rx="3"/><path d="M-6 -6h12M-6 -1h12M-6 4h8"/></g>`;

  // A box with its title (one line or two) and an optional line under it.
  function box(b, t, s, cls) {
    const c = mid(b);
    const lines = Array.isArray(t) ? t : [t];
    const lh = 17;
    const top = c.y - ((lines.length - 1) * lh) / 2 + (s ? -4 : 5);
    const sm = /\bis-sm\b/.test(cls || '') ? ' is-sm' : '';
    const title = lines.map((l, i) => `<text class="fl-t${sm}" x="${c.x}" y="${top + i * lh}">${esc(l)}</text>`).join('');
    return `<rect class="fl-box ${cls || ''}" x="${b[0]}" y="${b[1]}" width="${b[2]}" height="${b[3]}" rx="${Math.min(14, b[3] / 3)}"/>` +
      title + (s ? `<text class="fl-s${sm}" x="${c.x}" y="${c.y + (sm ? 14 : 16)}">${esc(s)}</text>` : '');
  }

  function drawCloud(L) {
    const [W, H] = L.view;
    const tall = W < H;
    let out = `<svg class="flow-svg${tall ? ' is-tall' : ''}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="cloudTitle"><title id="cloudTitle">${esc(CLOUD_TITLE)}</title>`;
    if (tall) {
      out += `<line class="fl-edge" x1="12" y1="${L.control.y}" x2="388" y2="${L.control.y}" stroke-dasharray="5 6"/>`;
    } else {
      out += `<line class="fl-edge" x1="${L.control.x}" y1="${L.control.y1}" x2="${L.control.x}" y2="${L.control.y2}" stroke-dasharray="5 6"/>`;
    }
    const bd = L.control.badge;
    out += `<rect class="fl-pill" x="${bd[0]}" y="${bd[1]}" width="${bd[2]}" height="${bd[3]}" rx="${bd[3] / 2}"/><text class="fl-badge" x="${bd[0] + bd[2] / 2}" y="${bd[1] + bd[3] / 2 + 4}">Your control ends here</text>`;
    // Links along the chain, the fan-out from the vendor cloud, and the trail behind the last box.
    for (let i = 0; i < L.hops.length - 1; i += 1) {
      const a = mid(L.hops[i].box);
      const b = mid(L.hops[i + 1].box);
      out += `<line class="fl-link" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/>`;
    }
    const v = mid(L.hops[3].box);
    L.down.forEach((d) => {
      const c = mid(d.box);
      out += `<line class="fl-link is-fan${d.faded ? ' is-faded' : ''}" x1="${v.x}" y1="${v.y}" x2="${c.x}" y2="${c.y}"/>`;
    });
    const [fx, fy] = L.trail.from;
    out += '<g class="fl-trail">';
    L.trail.boxes.forEach((b, i) => {
      const c = mid(b);
      out += `<line class="fl-link is-fan" x1="${fx}" y1="${fy}" x2="${c.x}" y2="${c.y}" style="opacity:${0.7 - i * 0.2}"/>` +
        `<rect class="fl-box is-risk is-ghost" x="${b[0]}" y="${b[1]}" width="${b[2]}" height="${b[3]}" rx="${b[3] / 3}" style="opacity:${0.6 - i * 0.18}"/>`;
    });
    out += '</g>';
    // The boxes, each risky one with its flash and its attack-surface tag.
    const [tw, th] = L.tag;
    const risky = [];
    L.hops.forEach((h) => {
      out += box(h.box, h.t, h.s, h.safe ? '' : 'is-risk');
      if (!h.safe) risky.push(h.box);
    });
    L.down.forEach((d) => {
      out += box(d.box, d.t, d.s, `is-risk${d.faded ? ' is-faded' : ''}${L.small ? ' is-sm' : ''}`);
      risky.push(d.box);
    });
    risky.forEach((b, i) => {
      out += `<rect class="fl-hit" data-i="${i}" x="${b[0]}" y="${b[1]}" width="${b[2]}" height="${b[3]}" rx="${Math.min(14, b[3] / 3)}"/>`;
      const tx = b[0] + b[2] - tw - 8;
      const ty = b[1] - th / 2;
      out += `<g class="fl-tag" data-i="${i}"><rect x="${tx}" y="${ty}" width="${tw}" height="${th}" rx="${th / 2}"/><text x="${tx + tw / 2}" y="${ty + th / 2 + 4}">attack surface</text></g>`;
    });
    out += '<g class="fl-trail-hit">' + L.trail.boxes.map((b) => `<rect class="fl-hit" x="${b[0]}" y="${b[1]}" width="${b[2]}" height="${b[3]}" rx="${b[3] / 3}"/>`).join('') + '</g>';
    L.down.forEach((d, i) => { out += docGlyph(`mv-copy mv-copy-${i}`); });
    out += docGlyph('mv-doc');
    // The caption, then the point: typed once the picture is complete, then held.
    const [cx, cy, anchor] = L.caption;
    const step = tall ? 19 : 26;
    let y = cy;
    out += `<g class="fl-captions${anchor === 'start' ? ' is-start' : ''}">`;
    L.cap.forEach((t, i) => { y = cy + i * step; out += `<text class="fl-cap is-risk fl-type" x="${cx}" y="${y}" data-text="${esc(t)}"></text>`; });
    L.point.forEach((t) => { y += step + (tall ? 0 : 2); out += `<text class="fl-point fl-type" x="${cx}" y="${y}" data-text="${esc(t)}"></text>`; });
    out += '</g></svg>';
    return out;
  }

  function drawZoe(L) {
    const [W, H] = L.view;
    const c = mid(L.core);
    let out = `<svg class="flow-svg${W < H ? ' is-tall' : ''}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="zoeTitle"><title id="zoeTitle">With ZOE AI, everything runs inside your laptop and the document never moves. The one thing that can cross to the frontier model, or to a high-end model on the firm's own server, is a masked question.</title>`;
    const bd = L.badge;
    out += `<rect class="fl-pill is-zoe" x="${bd[0]}" y="${bd[1]}" width="${bd[2]}" height="${bd[3]}" rx="${bd[3] / 2}"/><text class="fl-badge is-zoe" x="${bd[0] + bd[2] / 2}" y="${bd[1] + bd[3] / 2 + 4}">Everything below runs on this machine</text>`;
    const lp = L.laptop;
    out += `<rect class="fl-laptop-glow" x="${lp[0]}" y="${lp[1]}" width="${lp[2]}" height="${lp[3]}" rx="18"/>`;
    out += `<rect class="fl-laptop" x="${lp[0]}" y="${lp[1]}" width="${lp[2]}" height="${lp[3]}" rx="18"/>`;
    out += `<rect class="fl-base" x="${L.base[0]}" y="${L.base[1]}" width="${L.base[2]}" height="${L.base[3]}" rx="${L.base[3] / 2}"/>`;
    L.parts.forEach((p) => {
      const m = mid(p.box);
      out += `<line class="fl-web" x1="${c.x}" y1="${c.y}" x2="${m.x}" y2="${m.y}"/>`;
    });
    L.parts.forEach((p, i) => {
      out += box(p.box, p.t, p.s, '');
      out += `<rect class="fl-lit" data-i="${i}" x="${p.box[0]}" y="${p.box[1]}" width="${p.box[2]}" height="${p.box[3]}" rx="14"/>`;
    });
    const co = L.core;
    out += `<rect class="fl-core" x="${co[0]}" y="${co[1]}" width="${co[2]}" height="${co[3]}" rx="15"/><text class="fl-ot" x="${c.x}" y="${c.y - 2}">ZOE</text><text class="fl-os" x="${c.x}" y="${c.y + 18}">on your laptop</text>`;
    L.parts.forEach((p, i) => { out += `<circle class="mv-bit mv-bit-${i}" r="6"/>`; });
    out += `<g transform="translate(${L.doc[0]} ${L.doc[1]})">${docGlyph('fl-stay')}<text class="fl-ns" y="30">your document</text></g>`;
    const ln = L.line;
    out += `<line class="fl-opt" x1="${ln[0]}" y1="${ln[1]}" x2="${ln[2]}" y2="${ln[3]}" stroke-dasharray="6 6"/>`;
    const [kx, ky] = L.cloud;
    out += `<path class="fl-cloud" transform="translate(${kx - 66} ${ky - 50})" d="M32 62 a26 26 0 0 1 4 -51 a34 34 0 0 1 63 8 a22 22 0 0 1 -3 43 z"/>`;
    const bx = Math.min(kx, W - 106);
    L.blurb.forEach((t, i) => { out += `<text class="fl-ns" x="${bx}" y="${ky + 34 + i * 17}">${esc(t)}</text>`; });
    out += `<g class="mv-packet"><rect x="-62" y="-13" width="124" height="26" rx="13"/><text y="5">masked question</text></g>`;
    const [cx, cy] = L.caption;
    out += `<g class="fl-captions"><text class="fl-cap is-zoe" x="${cx}" y="${cy}">Zero hops. The document never leaves this box.</text>` +
      `<text class="fl-cap2" x="${cx}" y="${cy + 26}">What can travel is a masked question you approved.</text></g></svg>`;
    return out;
  }

  // ---------- Animation ----------

  const tr = (p) => `translate(${p.x}px, ${p.y}px)`;

  // Easing belongs to each move between keyframes, not to the whole 8 s loop.
  function play(el, frames, opts = {}) {
    const { easing, ...timing } = opts;
    const kf = easing ? frames.map((f) => Object.assign({ easing }, f)) : frames;
    return el.animate(kf, Object.assign({ duration: LOOP_MS, iterations: Infinity }, timing));
  }

  // When each attack surface lights, as a share of the 8 s play: the hops as the document reaches them,
  // the fan-out boxes as their copies land, then the trailing boxes together.
  const HOP_AT = [0.15, 0.25, 0.36];
  const FAN_AT = (i) => 0.47 + i * 0.035;
  const TRAIL_AT = 0.68;
  function cloudCount(k) {
    let n = HOP_AT.filter((t) => k >= t).length;
    for (let i = 0; i < 5; i += 1) if (k >= FAN_AT(i)) n += 1;
    if (k >= TRAIL_AT) n += 3;
    return n;
  }

  function animateCloud(svg, L) {
    const anims = [];
    const run = (el, frames, opts) => { if (el) anims.push(play(el, frames, Object.assign({ iterations: 1, fill: 'forwards' }, opts))); };
    const P = L.hops.map((h) => mid(h.box));
    run(svg.querySelector('.mv-doc'), [
      { offset: 0, transform: tr(P[0]), opacity: 0 },
      { offset: 0.03, transform: tr(P[0]), opacity: 1 },
      { offset: 0.08, transform: tr(P[0]), opacity: 1 },
      { offset: HOP_AT[0], transform: tr(P[1]), opacity: 1 },
      { offset: 0.18, transform: tr(P[1]), opacity: 1 },
      { offset: HOP_AT[1], transform: tr(P[2]), opacity: 1 },
      { offset: 0.28, transform: tr(P[2]), opacity: 1 },
      { offset: HOP_AT[2], transform: tr(P[3]), opacity: 1 },
      { offset: 0.4, transform: tr(P[3]), opacity: 0 },
      { offset: 1, transform: tr(P[3]), opacity: 0 },
    ], { easing: 'ease-in-out' });
    const flash = (i, at) => {
      run(svg.querySelector(`.fl-hit[data-i="${i}"]`), [
        { offset: 0, opacity: 0 }, { offset: at, opacity: 0 }, { offset: at + 0.015, opacity: 1 },
        { offset: at + 0.07, opacity: 0.4 }, { offset: 1, opacity: 0.4 },
      ]);
      run(svg.querySelector(`.fl-tag[data-i="${i}"]`), [
        { offset: 0, opacity: 0 }, { offset: at + 0.01, opacity: 0 }, { offset: at + 0.03, opacity: 1 }, { offset: 1, opacity: 1 },
      ]);
    };
    HOP_AT.forEach((at, i) => flash(i, at));
    L.down.forEach((d, i) => {
      const end = { x: d.box[0] + (L.view[0] < L.view[1] ? 2 : 20), y: d.box[1] + d.box[3] / 2 };
      const at = FAN_AT(i);
      run(svg.querySelector(`.mv-copy-${i}`), [
        { offset: 0, transform: tr(P[3]), opacity: 0 },
        { offset: 0.38, transform: tr(P[3]), opacity: 0 },
        { offset: 0.4, transform: tr(P[3]), opacity: 1 },
        { offset: at, transform: tr(end), opacity: 1 },
        { offset: 1, transform: tr(end), opacity: 1 },
      ], { easing: 'ease-out' });
      flash(3 + i, at);
    });
    // The trailing boxes behind the last fan-out box flash as a group.
    run(svg.querySelector('.fl-trail-hit'), [
      { offset: 0, opacity: 0 }, { offset: TRAIL_AT, opacity: 0 }, { offset: TRAIL_AT + 0.015, opacity: 1 },
      { offset: TRAIL_AT + 0.08, opacity: 0.35 }, { offset: 1, opacity: 0.35 },
    ]);
    run(svg.querySelector('.fl-captions'), [
      { offset: 0, opacity: 0 }, { offset: 0.8, opacity: 0 }, { offset: 0.82, opacity: 1 },
      { offset: 1, opacity: 1 },
    ]);
    return anims;
  }

  function animateZoe(svg, L) {
    const anims = [];
    const run = (el, frames, opts) => { if (el) anims.push(play(el, frames, opts)); };
    const c = mid(L.core);
    run(svg.querySelector('.fl-laptop-glow'), [{ opacity: 0.25 }, { opacity: 0.85 }, { opacity: 0.25 }], { duration: 2800, easing: 'ease-in-out' });
    // The information bounces between the local parts and ZOE, one part after another.
    L.parts.forEach((p, i) => {
      const m = mid(p.box);
      const t0 = 0.04 + i * 0.15;
      run(svg.querySelector(`.mv-bit-${i}`), [
        { offset: 0, transform: tr(c), opacity: 0 },
        { offset: t0, transform: tr(c), opacity: 0 },
        { offset: t0 + 0.01, transform: tr(c), opacity: 1 },
        { offset: t0 + 0.07, transform: tr(m), opacity: 1 },
        { offset: t0 + 0.14, transform: tr(c), opacity: 1 },
        { offset: t0 + 0.15, transform: tr(c), opacity: 0 },
        { offset: 1, transform: tr(c), opacity: 0 },
      ], { easing: 'ease-in-out' });
      run(svg.querySelector(`.fl-lit[data-i="${i}"]`), [
        { offset: 0, opacity: 0 }, { offset: t0 + 0.06, opacity: 0 }, { offset: t0 + 0.08, opacity: 1 },
        { offset: t0 + 0.13, opacity: 0 }, { offset: 1, opacity: 0 },
      ]);
    });
    // The one thing that crosses the dotted line: a small masked question.
    const [x1, y1, x2, y2] = L.line;
    const from = { x: x1, y: y1 };
    const to = { x: x2 + (x2 - x1) * 0.25, y: y2 + (y2 - y1) * 0.25 };
    run(svg.querySelector('.mv-packet'), [
      { offset: 0, transform: tr(from), opacity: 0 },
      { offset: 0.66, transform: tr(from), opacity: 0 },
      { offset: 0.68, transform: tr(from), opacity: 1 },
      { offset: 0.8, transform: tr(to), opacity: 1 },
      { offset: 0.84, transform: tr(to), opacity: 0 },
      { offset: 1, transform: tr(to), opacity: 0 },
    ], { easing: 'ease-in-out' });
    // The caption fades in once and stays; the motion above it keeps looping.
    run(svg.querySelector('.fl-captions'), [
      { offset: 0, opacity: 0 }, { offset: 0.8, opacity: 0 }, { offset: 0.84, opacity: 1 }, { offset: 1, opacity: 1 },
    ], { iterations: 1, fill: 'forwards' });
    return anims;
  }

  // ---------- The choice ----------

  const pills = Array.from(section.querySelectorAll('.flow-pick'));
  const panels = { cloud: section.querySelector('#flow-cloud'), zoe: section.querySelector('#flow-zoe') };
  let picked = null;
  let anims = [];
  let onScreen = false;

  let timers = [];
  let typed = false;
  const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };

  // The pills on the drawing size themselves to their text, so it never overflows in any font.
  function fitBadges(svg) {
    svg.querySelectorAll('.fl-badge').forEach((t) => {
      const r = t.previousElementSibling;
      const b = t.getBBox();
      if (!r || !b.width) return;
      r.setAttribute('x', (b.x - 12).toFixed(1));
      r.setAttribute('width', (b.width + 24).toFixed(1));
    });
  }

  // The cloud's caption and point, typed out after the picture completes.
  function typePoint(svg) {
    const lines = Array.from(svg.querySelectorAll('.fl-type'));
    if (RM) {
      lines.forEach((t) => { t.textContent = t.dataset.text; });
      typed = true;
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      let i = 0;
      let c = 0;
      const tick = () => {
        const t = lines[i];
        if (!t) { typed = true; resolve(); return; }
        c += 1;
        t.textContent = t.dataset.text.slice(0, c);
        if (c >= t.dataset.text.length) { i += 1; c = 0; }
        later(tick, TYPE_MS);
      };
      tick();
    });
  }

  // The tally beside the cloud panel's title counts the attack surfaces as they light, on the
  // animation's own clock (so it also follows a pause or a seek).
  const tally = section.querySelector('#flow-cloud .flow-tally');
  let tallyRaf = 0;
  function showTally() {
    cancelAnimationFrame(tallyRaf);
    if (!tally) return;
    const lead = picked === 'cloud' && anims[0];
    if (!lead) { tally.textContent = ''; return; }
    const n = cloudCount((lead.currentTime || 0) / LOOP_MS);
    tally.textContent = n ? `${n} attack surface${n === 1 ? '' : 's'}` : '';
    tally.classList.toggle('is-on', n > 0);
    if (lead.playState !== 'finished') tallyRaf = requestAnimationFrame(showTally);
  }

  function render() {
    anims.forEach((a) => a.cancel());
    anims = [];
    timers.forEach(clearTimeout);
    timers = [];
    typed = false;
    if (!picked) return;
    const panel = panels[picked];
    const holder = panel.querySelector('.flow-draw');
    const tall = tallMQ.matches;
    const L = (picked === 'cloud' ? CLOUD : ZOE)[tall ? 'tall' : 'wide'];
    holder.innerHTML = picked === 'cloud' ? drawCloud(L) : drawZoe(L);
    const svg = holder.querySelector('svg');
    fitBadges(svg);
    anims = picked === 'cloud' ? animateCloud(svg, L) : animateZoe(svg, L);
    showTally();
    if (RM) {
      // Reduced motion: the finished picture, still, with the point in full; it does not flip by itself.
      anims.forEach((a) => { a.pause(); a.currentTime = (a.effect.getTiming().duration || LOOP_MS) * (picked === 'cloud' ? 1 : 0.9); });
      if (picked === 'cloud') { typePoint(svg); showTally(); }
      return;
    }
    if (!onScreen) anims.forEach((a) => a.pause());
    if (picked === 'cloud') {
      const mine = anims;
      Promise.all(mine.map((a) => a.finished)).then(() => {
        if (anims !== mine) return;
        return typePoint(svg).then(() => {
          // Then, unless the visitor has chosen for themselves, it moves on to ZOE AI.
          // The flip counts as the choice too: from then on neither pill glows, and it never flips again.
          if (anims === mine && !section.classList.contains('user-picked')) later(() => { section.classList.add('user-picked'); pick('zoe'); }, FLIP_MS);
        });
      }).catch(() => {});
    }
  }

  function pick(which) {
    picked = which;
    section.classList.add('is-picked');
    pills.forEach((p) => {
      const on = p.dataset.pick === which;
      p.setAttribute('aria-selected', String(on));
      p.classList.toggle('is-on', on);
    });
    Object.entries(panels).forEach(([k, el]) => { el.hidden = k !== which; });
    render();
  }

  // A click is the visitor's choice: it cancels any pending flip, for good.
  pills.forEach((p) => p.addEventListener('click', () => {
    section.classList.add('user-picked');
    pick(p.dataset.pick);
  }));
  tallMQ.addEventListener('change', render);

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      onScreen = entries.some((e) => e.isIntersecting);
      if (RM) return;
      anims.forEach((a) => {
        if (onScreen && a.playState === 'paused') a.play();
        else if (!onScreen && a.playState === 'running') a.pause();
      });
      showTally();
    }, { threshold: 0.15 }).observe(section);
  } else {
    onScreen = true;
  }

  // Standard cloud AI is chosen to begin with; ZOE AI breathes until the visitor picks for themselves.
  pick('cloud');

  // For hero.js (the end button lands here) and tools/shots.spec.js.
  window.__zoeCompare = {
    pick,
    get picked() { return picked; },
    get running() { return anims.length > 0 && anims.every((a) => a.playState === 'running'); },
    get finished() { return anims.length > 0 && anims.every((a) => a.playState === 'finished'); },
    get typed() { return typed; },
    seek(ms) { anims.forEach((a) => { a.pause(); a.currentTime = ms; }); showTally(); },
  };
})();
