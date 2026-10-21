// ZOE AI — the comparison below the hero: standard cloud AI versus ZOE AI, behind a choice.
// Each diagram is drawn from the layout data below (a wide one and a tall one for phones) and
// animated with the Web Animations API (transform and opacity, nothing else), looping while it is on screen.

(() => {
  'use strict';

  const section = document.getElementById('dataflow');
  if (!section) return;
  const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tallMQ = window.matchMedia('(max-width: 699px)');
  const LOOP_MS = 8000;

  // ---------- Layouts ----------

  const CLOUD = {
    wide: {
      view: [1160, 500],
      control: { x: 184, y1: 40, y2: 372, badge: [86, 6, 196, 26] },
      hops: [
        { id: 'laptop', box: [24, 226, 140, 88], t: 'Your laptop', s: "your client's file", safe: true },
        { id: 'router', box: [204, 226, 130, 88], t: 'Router', s: 'your office' },
        { id: 'isp', box: [370, 226, 166, 88], t: 'Internet provider', s: 'public internet' },
        { id: 'vendor', box: [572, 214, 180, 112], t: 'Vendor cloud', s: 'their servers' },
      ],
      down: [
        { box: [812, 46, 324, 72], t: 'Name reader', s: 'reads every name in your file' },
        { box: [812, 172, 324, 72], t: 'Search index', s: 'your clauses, stored on their disk' },
        { box: [812, 298, 324, 72], t: 'Drafting model', s: 'generates from your text' },
        { box: [812, 424, 324, 72], t: 'Page renderer', s: 'your pages turned into images' },
      ],
      caption: [24, 412, 'start'],
    },
    tall: {
      view: [400, 900],
      control: { y: 132, badge: [118, 120, 164, 24] },
      hops: [
        { id: 'laptop', box: [120, 30, 160, 70], t: 'Your laptop', s: "your client's file", safe: true },
        { id: 'router', box: [120, 164, 160, 70], t: 'Router', s: 'your office' },
        { id: 'isp', box: [120, 270, 160, 70], t: 'Internet provider', s: 'public internet' },
        { id: 'vendor', box: [110, 376, 180, 80], t: 'Vendor cloud', s: 'their servers' },
      ],
      down: [
        { box: [10, 520, 185, 76], t: 'Name reader', s: 'reads every name' },
        { box: [205, 520, 185, 76], t: 'Search index', s: 'your clauses, their disk' },
        { box: [10, 640, 185, 76], t: 'Drafting model', s: 'generates from your text' },
        { box: [205, 640, 185, 76], t: 'Page renderer', s: 'your pages as images' },
      ],
      caption: [200, 790, 'middle'],
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
      caption: [530, 486, 'middle'],
    },
    tall: {
      view: [400, 900],
      badge: [57, 14, 286, 28],
      laptop: [16, 56, 368, 560],
      base: [0, 622, 400, 14],
      core: [110, 300, 180, 80],
      doc: [200, 450],
      parts: [
        { box: [32, 96, 160, 70], t: 'Name finder', s: 'finds every identifier' },
        { box: [208, 96, 160, 70], t: 'Clause library', s: 'templates and clauses' },
        { box: [32, 520, 160, 70], t: 'Document reader', s: 'reads files locally' },
        { box: [208, 520, 160, 70], t: 'Signature reader', s: 'reads signature pages' },
      ],
      line: [200, 640, 200, 724],
      cloud: [200, 760],
      caption: [200, 830, 'middle'],
    },
  };

  // ---------- Drawing ----------

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const mid = ([x, y, w, h]) => ({ x: x + w / 2, y: y + h / 2 });
  const docGlyph = (cls) => `<g class="${cls}"><rect x="-11" y="-14" width="22" height="28" rx="3"/><path d="M-6 -6h12M-6 -1h12M-6 4h8"/></g>`;

  function box(b, t, s, cls) {
    const c = mid(b);
    return `<rect class="fl-box ${cls || ''}" x="${b[0]}" y="${b[1]}" width="${b[2]}" height="${b[3]}" rx="14"/>` +
      `<text class="fl-t" x="${c.x}" y="${c.y - 4}">${esc(t)}</text><text class="fl-s" x="${c.x}" y="${c.y + 16}">${esc(s)}</text>`;
  }

  function drawCloud(L) {
    const [W, H] = L.view;
    const tall = W < H;
    let out = `<svg class="flow-svg${tall ? ' is-tall' : ''}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="cloudTitle"><title id="cloudTitle">In a standard cloud AI, the document leaves your laptop, passes your office router and your internet provider to a vendor's cloud, which hands it to four systems you do not control.</title>`;
    if (tall) {
      out += `<line class="fl-edge" x1="12" y1="${L.control.y}" x2="388" y2="${L.control.y}" stroke-dasharray="5 6"/>`;
    } else {
      out += `<line class="fl-edge" x1="${L.control.x}" y1="${L.control.y1}" x2="${L.control.x}" y2="${L.control.y2}" stroke-dasharray="5 6"/>`;
    }
    const bd = L.control.badge;
    out += `<rect class="fl-pill" x="${bd[0]}" y="${bd[1]}" width="${bd[2]}" height="${bd[3]}" rx="${bd[3] / 2}"/><text class="fl-badge" x="${bd[0] + bd[2] / 2}" y="${bd[1] + bd[3] / 2 + 4}">Your control ends here</text>`;
    // links between hops and the fan-out
    for (let i = 0; i < L.hops.length - 1; i += 1) {
      const a = mid(L.hops[i].box);
      const b = mid(L.hops[i + 1].box);
      out += `<line class="fl-link" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/>`;
    }
    const v = mid(L.hops[3].box);
    L.down.forEach((d) => {
      const c = mid(d.box);
      out += `<line class="fl-link is-fan" x1="${v.x}" y1="${v.y}" x2="${c.x}" y2="${c.y}"/>`;
    });
    L.hops.forEach((h) => { out += box(h.box, h.t, h.s, h.safe ? '' : 'is-risk'); });
    L.down.forEach((d, i) => {
      out += box(d.box, d.t, d.s, 'is-risk');
      out += `<rect class="fl-hit" data-i="${i}" x="${d.box[0]}" y="${d.box[1]}" width="${d.box[2]}" height="${d.box[3]}" rx="14"/>`;
      const tx = d.box[0] + d.box[2] - 118;
      const ty = d.box[1] - 12;
      out += `<g class="fl-tag" data-i="${i}"><rect x="${tx}" y="${ty}" width="110" height="22" rx="11"/><text x="${tx + 55}" y="${ty + 15}">attack surface</text></g>`;
    });
    L.down.forEach((d, i) => { out += docGlyph(`mv-copy mv-copy-${i}`); });
    out += docGlyph('mv-doc');
    const [cx, cy, anchor] = L.caption;
    out += `<g class="fl-captions${anchor === 'start' ? ' is-start' : ''}"><text class="fl-cap is-risk" x="${cx}" y="${cy}">Four hops. Three systems you don't control.</text>` +
      `<text class="fl-cap2" x="${cx}" y="${cy + 26}">The file left the building at hop one, and every</text><text class="fl-cap2" x="${cx}" y="${cy + 48}">system downstream reads it in the clear.</text></g></svg>`;
    return out;
  }

  function drawZoe(L) {
    const [W, H] = L.view;
    const c = mid(L.core);
    let out = `<svg class="flow-svg${W < H ? ' is-tall' : ''}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="zoeTitle"><title id="zoeTitle">With ZOE AI, everything runs inside your laptop and the document never moves. The one thing that can cross to the optional frontier model is a masked question.</title>`;
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
    out += `<text class="fl-ns" x="${kx}" y="${ky + 34}">frontier model</text><text class="fl-ns" x="${kx}" y="${ky + 52}">(optional)</text>`;
    out += `<g class="mv-packet"><rect x="-62" y="-13" width="124" height="26" rx="13"/><text y="5">masked question</text></g>`;
    const [cx, cy] = L.caption;
    out += `<g class="fl-captions"><text class="fl-cap is-zoe" x="${cx}" y="${cy}">Zero hops. The document never leaves this box.</text>` +
      `<text class="fl-cap2" x="${cx}" y="${cy + 26}">What can travel: a masked question you approved.</text></g></svg>`;
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

  function animateCloud(svg, L) {
    const anims = [];
    const run = (el, frames, opts) => { if (el) anims.push(play(el, frames, opts)); };
    const P = L.hops.map((h) => mid(h.box));
    run(svg.querySelector('.mv-doc'), [
      { offset: 0, transform: tr(P[0]), opacity: 0 },
      { offset: 0.04, transform: tr(P[0]), opacity: 1 },
      { offset: 0.1, transform: tr(P[0]), opacity: 1 },
      { offset: 0.18, transform: tr(P[1]), opacity: 1 },
      { offset: 0.24, transform: tr(P[1]), opacity: 1 },
      { offset: 0.32, transform: tr(P[2]), opacity: 1 },
      { offset: 0.38, transform: tr(P[2]), opacity: 1 },
      { offset: 0.48, transform: tr(P[3]), opacity: 1 },
      { offset: 0.52, transform: tr(P[3]), opacity: 0 },
      { offset: 1, transform: tr(P[3]), opacity: 0 },
    ], { easing: 'ease-in-out' });
    L.down.forEach((d, i) => {
      const end = { x: d.box[0] + (L.view[0] < L.view[1] ? 16 : 20), y: d.box[1] + d.box[3] / 2 };
      const arrive = 0.6 + i * 0.03;
      run(svg.querySelector(`.mv-copy-${i}`), [
        { offset: 0, transform: tr(P[3]), opacity: 0 },
        { offset: 0.5, transform: tr(P[3]), opacity: 0 },
        { offset: 0.52, transform: tr(P[3]), opacity: 1 },
        { offset: arrive, transform: tr(end), opacity: 1 },
        { offset: 0.93, transform: tr(end), opacity: 1 },
        { offset: 0.98, transform: tr(end), opacity: 0 },
        { offset: 1, transform: tr(end), opacity: 0 },
      ], { easing: 'ease-out' });
      run(svg.querySelector(`.fl-hit[data-i="${i}"]`), [
        { offset: 0, opacity: 0 }, { offset: arrive, opacity: 0 }, { offset: arrive + 0.02, opacity: 1 },
        { offset: arrive + 0.08, opacity: 0.45 }, { offset: 0.93, opacity: 0.45 }, { offset: 0.98, opacity: 0 }, { offset: 1, opacity: 0 },
      ]);
      run(svg.querySelector(`.fl-tag[data-i="${i}"]`), [
        { offset: 0, opacity: 0 }, { offset: arrive + 0.02, opacity: 0 }, { offset: arrive + 0.05, opacity: 1 },
        { offset: 0.93, opacity: 1 }, { offset: 0.98, opacity: 0 }, { offset: 1, opacity: 0 },
      ]);
    });
    run(svg.querySelector('.fl-captions'), [
      { offset: 0, opacity: 0 }, { offset: 0.74, opacity: 0 }, { offset: 0.78, opacity: 1 },
      { offset: 0.93, opacity: 1 }, { offset: 0.98, opacity: 0 }, { offset: 1, opacity: 0 },
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
    run(svg.querySelector('.fl-captions'), [
      { offset: 0, opacity: 0 }, { offset: 0.8, opacity: 0 }, { offset: 0.84, opacity: 1 },
      { offset: 0.95, opacity: 1 }, { offset: 0.99, opacity: 0 }, { offset: 1, opacity: 0 },
    ]);
    return anims;
  }

  // ---------- The choice ----------

  const pills = Array.from(section.querySelectorAll('.flow-pick'));
  const panels = { cloud: section.querySelector('#flow-cloud'), zoe: section.querySelector('#flow-zoe') };
  let picked = null;
  let anims = [];
  let onScreen = false;

  function render() {
    anims.forEach((a) => a.cancel());
    anims = [];
    if (!picked) return;
    const panel = panels[picked];
    const holder = panel.querySelector('.flow-draw');
    const tall = tallMQ.matches;
    const L = (picked === 'cloud' ? CLOUD : ZOE)[tall ? 'tall' : 'wide'];
    holder.innerHTML = picked === 'cloud' ? drawCloud(L) : drawZoe(L);
    const svg = holder.querySelector('svg');
    anims = picked === 'cloud' ? animateCloud(svg, L) : animateZoe(svg, L);
    if (RM) {
      // Reduced motion: the finished picture, still.
      anims.forEach((a) => { a.pause(); a.currentTime = (a.effect.getTiming().duration || LOOP_MS) * 0.9; });
    } else if (!onScreen) {
      anims.forEach((a) => a.pause());
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

  pills.forEach((p) => p.addEventListener('click', () => pick(p.dataset.pick)));
  tallMQ.addEventListener('change', render);

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      onScreen = entries.some((e) => e.isIntersecting);
      if (RM) return;
      anims.forEach((a) => (onScreen ? a.play() : a.pause()));
    }, { threshold: 0.15 }).observe(section);
  } else {
    onScreen = true;
  }

  // For tools/shots.spec.js.
  window.__zoeCompare = {
    get picked() { return picked; },
    get running() { return anims.length > 0 && anims.every((a) => a.playState === 'running'); },
    seek(ms) { anims.forEach((a) => { a.pause(); a.currentTime = ms; }); },
  };
})();
