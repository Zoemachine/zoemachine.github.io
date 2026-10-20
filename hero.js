// ZOE AI hero — the stage and the lid (Step 1: States 0 and 1).

// Analytics sink. While empty, events are logged to the console.
const ANALYTICS_ENDPOINT = '';

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

  const FRAMES = 45;
  const DRAG_FULL_PX = 220;   // upward travel for a full open
  const SNAP_AT = 0.4;        // release past this opens, below shuts
  const PLAY_MS = 900;        // tap / click / wheel / key: frames 1 -> 45
  const IDLE_MS = 6000;       // auto-open after this long with no input
  const TAP_SLOP_PX = 8;
  const FLICK_PX_PER_MS = 0.6; // upward release speed that opens regardless of distance

  // Height of the lid's bright top edge per frame, % of frame height from the top
  // (measured on the 1280 set; 100 = lid still flat). Mid-swing the edge rises
  // into the tagline, so the tagline dims while the two overlap.
  const LID_EDGE = [
    100, 100, 100, 100, 100, 57.9, 55.1, 52.4, 49.4, 47.4, 45.3, 43.5, 41.8, 40.3, 38.9,
    37.2, 36.0, 34.9, 34.0, 33.2, 32.5, 31.8, 31.3, 30.7, 30.4, 30.3, 30.0, 30.0, 30.0, 30.1,
    30.4, 30.7, 31.1, 31.7, 32.2, 32.9, 33.8, 34.0, 34.4, 34.7, 35.0, 35.3, 35.4, 35.7, 35.8,
  ];

  const NARRATION = {
    0: '',
    1: 'ZOE runs on the laptop you already own.',
  };

  const stage = document.querySelector('.stage');
  const poster = document.getElementById('lid-poster');
  const canvas = stage.querySelector('.lid');
  const ctx = canvas.getContext('2d', { alpha: false });
  const lidHit = stage.querySelector('.lid-hit');
  const tagline = stage.querySelector('.tagline');
  const screen = stage.querySelector('.screen');
  const docs = stage.querySelector('.docs');
  const narration = stage.querySelector('.narration');
  const narrationLive = document.getElementById('narration-live');

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const frameSet = window.matchMedia('(min-width: 900px)').matches ? 1920 : 1280;
  const frameUrl = (i) => `assets/frames/${frameSet}/lid_${String(i + 1).padStart(2, '0')}.webp`;

  let state = 0;
  let progress = 0;        // 0 = closed, 1 = open
  let shownFrame = -1;
  let renderRaf = 0;
  let tweenRaf = 0;
  let drag = null;
  let pendingOpen = null;  // open requested before every frame was decoded
  let idleTimer = 0;
  let typeTimer = 0;
  let wheelGuardUntil = 0;

  // ---------- State ----------

  function setState(next) {
    state = next;
    stage.dataset.state = String(next);
    narrate(NARRATION[next] || '');
  }

  function narrate(text) {
    clearInterval(typeTimer);
    narrationLive.textContent = text;
    if (reducedMotion || !text) {
      narration.textContent = text;
      return;
    }
    let n = 0;
    narration.textContent = '';
    typeTimer = setInterval(() => {
      n += 1;
      narration.textContent = text.slice(0, n);
      if (n >= text.length) clearInterval(typeTimer);
    }, 28);
  }

  // ---------- Reduced motion: the lid is already open ----------

  if (reducedMotion) {
    // The <picture> already shows lid_45 for this media query; no frames are fetched.
    stage.classList.add('cue-off');
    lidHit.setAttribute('tabindex', '-1');
    lidHit.setAttribute('aria-hidden', 'true');
    screen.hidden = false;
    screen.classList.add('is-on');
    docs.classList.add('is-up');
    setState(1);
    return;
  }

  // ---------- Frames ----------
  // Frame 1 is the inline poster; the rest load coarse-to-fine (45, 23, 12, 34, ...)
  // so an early scrub always has a nearby frame to show.

  const frames = new Array(FRAMES).fill(null);
  let settled = 0;
  let allReady = false;

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

  loadOrder(FRAMES).forEach(loadFrame);

  function nearestFrame(i) {
    for (let d = 0; d < FRAMES; d += 1) {
      if (i - d >= 0 && frames[i - d]) return i - d;
      if (i + d < FRAMES && frames[i + d]) return i + d;
    }
    return 0;
  }

  function render() {
    renderRaf = 0;
    const f = nearestFrame(Math.round(progress * (FRAMES - 1)));
    if (f === shownFrame && canvas.classList.contains('is-live')) return;
    const img = frames[f];
    if (!img || !img.complete) return;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    shownFrame = f;
    dimTagline(f);
    canvas.classList.add('is-live');
  }

  let taglineBottom = 0; // % of scene height
  function measureTagline() {
    const scene = tagline.offsetParent;
    taglineBottom = ((tagline.offsetTop + tagline.offsetHeight) / scene.offsetHeight) * 100;
  }
  function dimTagline(f) {
    const clearance = LID_EDGE[f] - taglineBottom;
    tagline.style.opacity = String(Math.min(1, Math.max(0, (clearance + 1.5) / 3)));
  }
  measureTagline();
  window.addEventListener('resize', () => { measureTagline(); if (shownFrame >= 0) dimTagline(shownFrame); });

  function requestRender() {
    if (!renderRaf) renderRaf = requestAnimationFrame(render);
  }

  // ---------- Motion ----------

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

  function hideCue() {
    stage.classList.add('cue-off');
  }

  function playOpen(method) {
    if (state !== 0) return;
    if (!allReady) {
      // The chevrons keep drifting; the lid opens the moment the last frame decodes.
      pendingOpen = pendingOpen || method;
      return;
    }
    hideCue();
    const ms = Math.max(200, PLAY_MS * (1 - progress));
    tweenTo(1, ms, () => mountOpen(method));
  }

  function snapShut() {
    tweenTo(0, Math.max(180, 520 * progress), () => {
      stage.classList.remove('cue-off');
      armIdle();
    });
  }

  // Frame 45 has landed: State 1.
  function mountOpen(method) {
    if (state !== 0) return;
    progress = 1;
    render();
    clearTimeout(idleTimer);
    pendingOpen = null;
    wheelGuardUntil = performance.now() + 600;
    lidHit.setAttribute('tabindex', '-1');
    lidHit.setAttribute('aria-disabled', 'true');
    if (document.activeElement === lidHit) stage.focus({ preventScroll: true });
    screen.hidden = false;
    requestAnimationFrame(() => {
      screen.classList.add('is-on');
      docs.classList.add('is-up');
    });
    setState(1);
    track('lid_opened', { method });
  }

  // ---------- Idle auto-open ----------

  function armIdle() {
    clearTimeout(idleTimer);
    if (state !== 0) return;
    idleTimer = setTimeout(() => {
      const inView = stage.getBoundingClientRect().bottom > window.innerHeight * 0.5;
      if (state === 0 && !drag && document.visibilityState === 'visible' && inView) {
        playOpen('auto');
      } else {
        armIdle();
      }
    }, IDLE_MS);
  }

  function noteInput() {
    if (state === 0 && !pendingOpen) armIdle();
  }

  // ---------- Pointer: drag to scrub, tap to play ----------

  lidHit.addEventListener('pointerdown', (e) => {
    if (state !== 0 || drag) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    noteInput();
    cancelTween();
    drag = {
      id: e.pointerId, y0: e.clientY, x0: e.clientX, p0: progress, moved: false, type: e.pointerType,
      lastY: e.clientY, lastT: performance.now(), vy: 0,
    };
    try { lidHit.setPointerCapture(e.pointerId); } catch (_) { /* capture is best-effort */ }
  });

  lidHit.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id || state !== 0) return;
    const dy = drag.y0 - e.clientY;
    if (!drag.moved) {
      if (Math.hypot(dy, e.clientX - drag.x0) < TAP_SLOP_PX) return;
      drag.moved = true;
      hideCue();
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
      mountOpen(method);
    }
  });

  function endDrag(e, cancelled) {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    noteInput();
    if (!d.moved) {
      if (!cancelled) playOpen(d.type === 'mouse' ? 'click' : 'tap');
      return;
    }
    // A quick upward flick opens even if it ends short of 40%.
    const flick = performance.now() - d.lastT < 100 && d.vy > FLICK_PX_PER_MS;
    if (progress >= SNAP_AT || flick) playOpen(d.type === 'mouse' ? 'drag-mouse' : 'drag');
    else snapShut();
  }

  lidHit.addEventListener('pointerup', (e) => endDrag(e, false));
  lidHit.addEventListener('pointercancel', (e) => endDrag(e, true));
  lidHit.addEventListener('contextmenu', (e) => e.preventDefault());

  // ---------- Desktop: a scroll tick or an arrow key plays the opening ----------

  window.addEventListener('wheel', (e) => {
    if (performance.now() < wheelGuardUntil) {
      // Swallow trackpad momentum left over from the tick that opened the lid.
      e.preventDefault();
      return;
    }
    if (state !== 0 || window.scrollY > 4) return;
    if (Math.abs(e.deltaY) < 1) return;
    e.preventDefault();
    noteInput();
    playOpen('wheel');
  }, { passive: false });

  document.addEventListener('keydown', (e) => {
    if (state !== 0 || e.altKey || e.ctrlKey || e.metaKey) return;
    const t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    const onLid = t === lidHit;
    const opens = e.key === 'ArrowUp' || e.key === 'ArrowDown' ||
      (onLid && (e.key === 'Enter' || e.key === ' '));
    if (!opens || (window.scrollY > 4 && !onLid)) {
      noteInput();
      return;
    }
    e.preventDefault();
    noteInput();
    playOpen('key');
  });

  window.addEventListener('scroll', noteInput, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') armIdle();
  });

  // ---------- Go ----------

  setState(0);
  requestRender();
  armIdle();

  // Exposed for tools/shots.spec.js and for tuning in the console.
  window.__zoeHero = {
    get state() { return state; },
    get progress() { return progress; },
    get framesReady() { return allReady; },
    get frameSet() { return frameSet; },
    seek(p) { cancelTween(); progress = Math.min(1, Math.max(0, p)); hideCue(); render(); },
    open: () => playOpen('debug'),
  };
})();
