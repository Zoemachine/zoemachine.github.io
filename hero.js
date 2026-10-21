// ZOE AI hero — the boardroom term sheet, in five acts.
// Act I the ambush and the snap · II open the laptop, pull the plug · III local work, offline
// IV the scrub and the round trip · V ten minutes are up.

// Analytics sink. While empty, events are logged to the console.
const ANALYTICS_ENDPOINT = '';

// ---------- Story content: every name and line in one place ----------
// All parties, numbers, addresses and dates are invented. `mask` is what the frontier AI sees:
// names and addresses become stable tokens, numbers and dates become format-preserving dummies.
const PARTIES = {
  seller:    { real: 'Kestrel Robotics Inc.',          mask: '[ORG_1]' },
  escrowCo:  { real: 'Harborline Trust Company',       mask: '[ORG_2]' },
  lender:    { real: 'Lakeshore Capital Partners LP',  mask: '[ORG_3]' },
  landlord:  { real: 'Vantage Row Properties LLC',     mask: '[ORG_4]' },
  buyer:     { real: 'Meridian Acquisition LLC',       mask: '[ORG_5]' },
  parent:    { real: 'Meridian Holdings LLC',          mask: '[ORG_6]' },   // never on the sheet: that absence is the catch
  signer:    { real: 'Jane R. Okonkwo',                mask: '[PERSON_1]' },
  cto:       { real: 'Daniel Park',                    mask: '[PERSON_2]' },
  address:   { real: '1400 Kestrel Lane',              mask: '[ADDRESS_1]' },
  premises:  { real: '88 Vantage Row, Suite 400',      mask: '[ADDRESS_2]' },
  price:     { real: '$45,000,000',                    mask: '$18,200,000' },
  escrowAmt: { real: '$4,500,000',                     mask: '$2,750,000' },
  earnout:   { real: '$6,000,000',                     mask: '$3,400,000' },
  debt:      { real: '$30,000,000',                    mask: '$11,500,000' },
  retention: { real: '$750,000',                       mask: '$420,000' },
  signing:   { real: 'November 6, 2026',               mask: 'August 21, 2026' },
  outside:   { real: 'January 15, 2027',               mask: 'March 2, 2027' },
  earnEnd:   { real: 'December 31, 2027',              mask: 'October 31, 2028' },
  ein:       { real: '84-2219876',                     mask: '31-7748205' },
  escrow:    { real: '4417-0093-2281',                 mask: '7302-5518-0946' },
};

// The term sheet as it appears on the paper, in the editor and in the inspect view.
// [section, text]; {key} is a party from PARTIES. Everything else is generic deal language and is
// deliberately left as it is when the sheet is masked, so the viewer sees what is not removed.
const TERM_SHEET = [
  ['Parties', 'Seller: {seller}, {address} (EIN {ein}). Buyer: {buyer}, a newly formed Delaware limited liability company.'],
  ['Structure', 'Purchase of all outstanding shares of the Seller; cash-free, debt-free, with a normalized level of working capital.'],
  ['Purchase Price', '{price} in cash at closing, subject to customary working capital adjustments.'],
  ['Escrow', '{escrowAmt} held by {escrowCo} for 18 months as security for indemnification, escrow account {escrow}.'],
  ['Earn-out', 'Up to {earnout} payable on revenue milestones through {earnEnd}.'],
  ['Financing', 'Buyer to deliver a debt commitment letter from {lender} for {debt} before signing.'],
  ['Key Employees', '{cto}, Chief Technology Officer, to sign a new employment agreement with a {retention} retention bonus.'],
  ['Conditions', 'Consent of {landlord} to assignment of the lease at {premises}; customary regulatory approvals.'],
  ['Exclusivity', '45 days from signing of this term sheet.'],
  ['Confidentiality', 'The parties\u2019 existing confidentiality agreement continues to apply.'],
  ['Governing Law', 'Delaware.'],
  ['Non-binding', 'Not binding except Exclusivity, Confidentiality and Governing Law. Target signing {signing}; outside date {outside}.'],
  ['For Buyer', '{signer}'],
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

// The frontier models named under the cloud, as their product marks (24×24 paths).
// Marks from simple-icons (CC0): Claude and Google Gemini from v16.34.0; OpenAI (ChatGPT's mark) from v13.21.0;
// Microsoft from v11.15.0, standing in for Copilot because no free Copilot mark exists. Trademarks of their owners.
const PROVIDERS = [
  { name: 'ChatGPT', owner: 'OpenAI', hex: '#10A37F', d: 'M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z' },
  { name: 'Claude', owner: 'Anthropic', hex: '#D97757', d: 'm4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z' },
  { name: 'Gemini', owner: 'Google', hex: '#8E75B2', d: 'M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81' },
  { name: 'Copilot', owner: 'Microsoft', hex: '#00A4EF', d: 'M0 0v11.408h11.408V0zm12.594 0v11.408H24V0zM0 12.594V24h11.408V12.594zm12.594 0V24H24V12.594z' },
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
  const DRAG_FULL_PX = 320;    // upward travel for a full open: a real lid's lift, not a switch
  const DRAG_FOLLOW = 0.25;    // per frame, the lid closes this share of the gap to the finger
  const SNAP_AT = 0.4;         // release past this opens, below shuts
  const PLAY_MS = 1800;        // tap / click / wheel / key: frames 1 -> 45, ease-in-out
  const RELEASE_MS = 1200;     // after a drag: finish opening, or settle shut, ease-out
  const IDLE_FIRST_MS = 18000; // gesture 1 auto-performs after this long with no input
  const IDLE_LATER_MS = 12000; // gestures 2-4
  const TAP_SLOP_PX = 8;
  const FLICK_PX_PER_MS = 0.6; // upward release speed that opens regardless of distance
  // Pacing: the reading side (typing, holds, pauses) runs at half speed; the animations keep their durations.
  const TYPE_MS = 24;          // per character
  const SWEEP_MS = 1600;       // keep in step with .sweep.is-running in styles.css
  const SCROLL_MS = 450;       // the editor scrolling to the next screen of the sheet (styles.css .ed-page)
  const HOLD = 2;              // reading time: every spoken line and the pauses between beats
  const MOTION = 1;            // the file web, the streams, the six-file packet, the card flight, the rehydration
  const KEY_LINE_MS = 3000;    // the catch and the fix stay on screen at least this long
  const VIEW_K = 0.62;         // viewfinder scale: the page as the phone's camera sees it
  const SHEET_TYPE = 0.025;    // the paper's type size, as a share of its width: a full page of small type

  // Height of the lid's bright top edge per frame, % of frame height from the top
  // (measured on the 1280 set; 100 = lid still flat). Mid-swing the edge rises
  // into the tagline, so the tagline dims while the two overlap.
  const LID_EDGE = [
    100, 100, 100, 100, 100, 57.9, 55.1, 52.4, 49.4, 47.4, 45.3, 43.5, 41.8, 40.3, 38.9,
    37.2, 36.0, 34.9, 34.0, 33.2, 32.5, 31.8, 31.3, 30.7, 30.4, 30.3, 30.0, 30.0, 30.0, 30.1,
    30.4, 30.7, 31.1, 31.7, 32.2, 32.9, 33.8, 34.0, 34.4, 34.7, 35.0, 35.3, 35.4, 35.7, 35.8,
  ];

  // The baked wordmark's O, per frame: [dx, dy] from its frame-1 centre in frame widths, and its
  // scale, from a circle fit on all 45 frames (smoothed over five). Moves .logo-o with the drift.
  const LOGO_O = [[0.0, 0.0, 1.0], [0.0, -1e-05, 1.0], [-1e-05, 1e-05, 1.0003], [2e-05, -3e-05, 0.9994], [1e-05, -5e-05, 0.9997], [3e-05, -6e-05, 0.9991], [3e-05, -6e-05, 0.9991], [5e-05, -9e-05, 0.9986], [5e-05, -9e-05, 0.9986], [2e-05, -2e-05, 0.9994], [-2e-05, 2e-05, 1.0006], [-6e-05, 6e-05, 1.0014], [-0.0001, 6e-05, 1.0017], [-0.00022, 0.0001, 1.0034], [-0.00032, 6e-05, 1.004], [-0.00043, 1e-05, 1.004], [-0.00056, -5e-05, 1.0046], [-0.00072, -6e-05, 1.0057], [-0.00082, -0.00013, 1.0055], [-0.00094, -0.00019, 1.0055], [-0.00105, -0.00025, 1.0055], [-0.00114, -0.00037, 1.0043], [-0.00121, -0.00049, 1.0032], [-0.00129, -0.00061, 1.0023], [-0.00133, -0.00075, 1.0003], [-0.0014, -0.00088, 0.9991], [-0.00146, -0.00098, 0.9983], [-0.00153, -0.00109, 0.9971], [-0.00157, -0.00122, 0.9951], [-0.00164, -0.00134, 0.994], [-0.0017, -0.00145, 0.9925], [-0.00176, -0.00156, 0.9911], [-0.00182, -0.00166, 0.99], [-0.0019, -0.00175, 0.9891], [-0.00197, -0.00182, 0.9885], [-0.00203, -0.00191, 0.9877], [-0.00207, -0.00206, 0.9859], [-0.00212, -0.00218, 0.9845], [-0.00217, -0.0023, 0.9828], [-0.00222, -0.00242, 0.9811], [-0.00227, -0.00253, 0.9793], [-0.00232, -0.00261, 0.9782], [-0.00238, -0.0027, 0.977], [-0.00241, -0.00274, 0.9767], [-0.00243, -0.0028, 0.9761]];

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
  const logoO = $('.logo-o', stage);
  const logoOB = $('.logo-o-b', stage);
  const rim = $('.rim', stage);
  const screen = $('.screen', stage);
  const strip = $('.strip', stage);
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
  const dwell = (line) => HOLD * (220 + plain(line).length * 8);
  const beat = (ms) => wait(ms * HOLD);
  const motion = (ms) => wait(ms * MOTION);

  const maxMsgs = () => (portraitMQ.matches ? 3 : 4);

  function addMsg(who, thinking) {
    const msgs = strip.querySelectorAll('.msg:not(.is-out)');
    if (msgs.length >= maxMsgs()) msgs[0].remove();
    const m = document.createElement('div');
    m.className = `msg ${who}${thinking ? ' think' : ''}`;
    m.innerHTML = `<span class="avatar">${AVATARS[who]}</span><p class="bubble">${thinking ? '<span class="who">Bob, thinking</span>' : ''}<span class="txt"></span></p>`;
    strip.appendChild(m);
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

  // While ZOE talks, its O grows and turns; it settles back once the line has been read.
  let talkTimer = 0;
  async function zoeSay(key, hold = true) {
    const line = LINES[key];
    announce('zoe', line);
    clearTimeout(talkTimer);
    zoe.classList.add('is-talking');
    await typeInto($('.zoe-say', zoe), line);
    const settle = () => zoe.classList.remove('is-talking');
    if (hold) {
      await wait(dwell(line));
      settle();
    } else {
      talkTimer = setTimeout(settle, RM ? 0 : dwell(line));
      run.timers.add(talkTimer);
    }
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

  function layout() {
    const S = sceneBox();
    const V = stage.clientWidth;
    const VH = stage.clientHeight;
    const portrait = portraitMQ.matches;
    let cx = 0;
    let cy = 0;
    let cs = 1;

    const stripR = parseFloat(getComputedStyle(stage).getPropertyValue('--strip-r')) || 200;
    if (portrait) {
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

    const g = { S, V, VH, portrait, cs, scr };

    if (portrait) {
      // Act I: the term sheet above the laptop, the phone below it.
      const sw = 0.2 * S.w;
      g.sheet = { x: S.x + 0.3 * S.w, y: S.y + 0.3 * S.h, w: sw, h: sw * 1.29 };
      const pw = 76;
      const ph = pw * 2.05;
      g.phone = { x: V / 2 + 18, y: Math.min(S.y + 0.86 * S.h, VH - 74 - ph), w: pw, h: ph };
      g.laptop = { x0: S.x + 0.22 * S.w, x1: S.x + 0.78 * S.w, y0: S.y + 0.53 * S.h, y1: S.y + 0.8 * S.h };
      // Bump on the lid's right half, clear of the page above it.
      g.bump = { x: Math.max(V / 2 + 0.1 * S.w, g.sheet.x + g.sheet.w + pw * 0.55), y: S.y + 0.6 * S.h };
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
      // On wide screens the paper and the phone are the subject of Act I: a page you could read,
      // below the chat strip, and a phone big enough to frame a good part of it.
      const big = V >= 900;
      const sw = (big ? 0.22 : 0.13) * S.w;
      g.sheet = { x: S.x + (big ? 0.025 : 0.045) * S.w, y: big ? Math.min(Math.max(S.y + 0.33 * S.h, 290), VH - 60 - sw * 1.29) : S.y + 0.42 * S.h, w: sw, h: sw * 1.29 };
      const pw = big ? 0.1 * S.w : Math.max(70, 0.062 * S.w);
      const ph = pw * 2.05;
      g.phone = { x: S.x + 0.86 * S.w - pw / 2, y: S.y + (big ? 0.33 : 0.38) * S.h, w: pw, h: ph };
      g.laptop = { x0: S.x + 0.22 * S.w, x1: S.x + 0.78 * S.w, y0: S.y + 0.53 * S.h, y1: S.y + 0.8 * S.h };
      // Bump on the lid, just right of the page.
      g.bump = { x: Math.max(S.x + 0.3 * S.w, g.sheet.x + g.sheet.w + pw * 0.6), y: S.y + 0.62 * S.h };
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

    place(sheet, g.sheet.x, g.sheet.y, g.sheet.w, g.sheet.h);
    sheet.style.setProperty('--sheet-fs', `${(g.sheet.w * SHEET_TYPE).toFixed(2)}px`);
    place(phone, g.phone.x, g.phone.y, g.phone.w, g.phone.h);
    // Viewfinder offset: the paper's position relative to the phone's screen at the dock (see .phone-view).
    phone.style.setProperty('--vx', `${(g.sheet.x - g.phone.x - 0.06 * g.phone.w).toFixed(1)}px`);
    phone.style.setProperty('--vy', `${(g.sheet.y - g.phone.y - 0.045 * g.phone.h).toFixed(1)}px`);
    phone.style.setProperty('--vw', `${g.sheet.w.toFixed(1)}px`);
    phone.style.setProperty('--vh', `${g.sheet.h.toFixed(1)}px`);
    // The camera sees the page smaller than life, so a good part of it fits in the frame.
    phone.style.setProperty('--vk', String(VIEW_K));
    phone.style.setProperty('--cx', `${(g.phone.w * 0.88 / 2).toFixed(1)}px`);
    phone.style.setProperty('--cy', `${(g.phone.h * 0.91 / 2).toFixed(1)}px`);
    phone.style.setProperty('--sheet-fs', `${(g.sheet.w * SHEET_TYPE).toFixed(2)}px`);
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
    sheet.className = 'sheet';
    sheet.innerHTML = `<h4>TERM SHEET</h4>` +
      TERM_SHEET.map(([k, v]) => `<p><b>${esc(k)}.</b> ${esc(fill(v, 'real'))}</p>`).join('');
  }

  function buildPhone() {
    phone.className = 'phone';
    phone.hidden = false;
    phone.style.removeProperty('--px');
    phone.style.removeProperty('--py');
    phone.innerHTML = '<div class="phone-body" aria-hidden="true"><div class="phone-screen"><div class="phone-view"></div><div class="phone-grid"></div><div class="phone-shot"></div><div class="phone-shutter"></div><div class="phone-flash"></div></div><div class="phone-island"></div></div><span class="phone-cue" aria-hidden="true"></span>';
    phone.setAttribute('tabindex', '-1');
    // The viewfinder: a copy of the paper that stays aligned with the real one as the phone moves over it.
    $('.phone-view', phone).innerHTML = sheet.innerHTML;
  }

  function buildZoe() {
    zoe.className = 'zoe';
    zoe.innerHTML = '<div class="zoe-mark"><span class="zl">Z</span><span class="o-wrap"><svg viewBox="0 0 24 24"><g class="o-turn"><circle cx="12" cy="12" r="9" fill="none" stroke="#cfe0f5" stroke-width="3" stroke-dasharray="44 13"/><circle cx="12" cy="13" r="3.6" fill="#cfe0f5"/><circle cx="10.2" cy="7.6" r="1.1" fill="#cfe0f5"/><circle cx="13.4" cy="7.2" r="1.1" fill="#cfe0f5"/></g></svg></span><span class="zl">E</span></div><p class="zoe-say"></p>';
  }

  function buildCloud() {
    cloud.className = 'cloud';
    const marks = PROVIDERS.map((p) =>
      `<li class="mark" style="--brand:${p.hex}" role="img" aria-label="${esc(p.name)}" data-name="${esc(p.name)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${p.d}"/></svg></li>`).join('');
    cloud.innerHTML = `<div class="cloud-glow"></div><p class="cloud-name">${esc(UI.cloudName)}</p><ul class="cloud-marks">${marks}</ul><p class="cloud-say" aria-hidden="true"></p>`;
  }

  function buildWorkspace() {
    const doc = TERM_SHEET.map(([k, v]) => `<p><span class="k">${esc(k)}.</span> ${piiHtml(v)}</p>`).join('');
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
    camMode = 'home';
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

  // ---------- Act I: the phone ----------

  let phoneStage = 0;      // 0 needs the snap, 1 needs the bump, 2 done
  let phoneDrag = null;
  let phoneOff = { x: 0, y: 0 };

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
    cue.style.cssText = '';
    if (phoneStage === 1) {
      if (p) Object.assign(cue.style, { bottom: 'auto', top: '104%' });
      else Object.assign(cue.style, { right: 'auto', left: '112%' });
    }
  }

  async function glideTo(pt, ms = 420) {
    phone.classList.add('is-gliding');
    setPhoneOff(pt.x - (geo.phone.x + geo.phone.w / 2), pt.y - (geo.phone.y + geo.phone.h / 2));
    await wait(ms);
    phone.classList.remove('is-gliding');
  }

  function snap() {
    if (phoneStage !== 0) return;
    phoneStage = 1;
    // The shutter: a flash, then the framed page straightens and settles inside the phone as the photo.
    const view = $('.phone-view', phone);
    const scr = $('.phone-screen', phone);
    const k = (scr.clientWidth * 0.8) / Math.max(1, view.offsetWidth);
    view.style.transform = getComputedStyle(view).transform;
    void view.offsetWidth;
    view.classList.add('is-captured');
    view.style.transform = `translate(${((scr.clientWidth - view.offsetWidth * k) / 2).toFixed(1)}px, ${((scr.clientHeight * 0.86 - view.offsetHeight * k) / 2).toFixed(1)}px) scale(${k.toFixed(3)})`;
    phone.classList.add('is-snapped');
    $('.phone-flash', phone).classList.add('is-on');
    sheet.classList.add('is-flash');
    setCue();
    track('phone_snapped');
  }

  async function bump() {
    phoneStage = 2;
    phone.classList.add('is-bumped');
    const body = $('.phone-body', phone);
    body.classList.add('is-shake');
    const from = phoneCenter();
    const to = { x: (geo.laptop.x0 + geo.laptop.x1) / 2, y: (geo.laptop.y0 + geo.laptop.y1) / 2 };
    // The captured page card flies out of the phone into the laptop, under the label; the rim flashes as it lands.
    const cw = geo.phone.w * 0.49;
    const ch = geo.phone.h * 0.38;
    fly.style.width = `${cw}px`;
    fly.style.height = `${ch}px`;
    const f0 = `translate(${from.x - cw / 2}px, ${from.y - ch / 2}px) scale(1)`;
    const f1 = `translate(${to.x - cw / 2}px, ${to.y - ch / 2 + 6}px) scale(0.45) rotate(-6deg)`;
    animate(fly, [
      { transform: f0, opacity: 1 },
      { transform: f1, opacity: 1, offset: 0.8 },
      { transform: f1, opacity: 0 },
    ], { duration: 820 * MOTION, easing: 'cubic-bezier(0.5, 0, 0.3, 1)' });
    const t = setTimeout(() => {
      rim.classList.remove('is-glowing');
      void rim.offsetWidth;
      rim.classList.add('is-glowing');
    }, RM ? 0 : 600 * MOTION);
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
    ], { duration: 1900 * MOTION, easing: 'ease-in-out' });
    await wait(340 * MOTION);
    phone.classList.add('is-dropping');
    sheet.classList.add('is-gone');
    await wait(500 * MOTION);
    pulse.then(() => { phone.hidden = true; });
  }

  async function phoneAuto(method) {
    if (RM) {
      phoneStage = 2;
      phone.hidden = true;
      sheet.classList.add('is-gone');
      track('phone_snapped', { method });
      return;
    }
    if (phoneStage === 0) {
      const s = geo.sheet;
      await glideTo({ x: s.x + s.w / 2, y: s.y + s.h / 2 }, 460);
      snap();
      await wait(380 * HOLD);
    }
    await glideTo(geo.bump, 420);
    await bump();
  }

  const inside = (p, b, pad) => p.x > b.x0 - pad && p.x < b.x1 + pad && p.y > b.y0 - pad && p.y < b.y1 + pad;
  const sheetBox = () => ({ x0: geo.sheet.x, x1: geo.sheet.x + geo.sheet.w, y0: geo.sheet.y, y1: geo.sheet.y + geo.sheet.h });

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
    // The shutter fires once the phone is well over the page, so the viewfinder is seen first.
    if (phoneStage === 0 && inside(c, sheetBox(), -14)) snap();
    // The bump needs the phone on the laptop and clear of the page it just photographed.
    else if (phoneStage === 1 && inside(c, geo.laptop, 10) && !inside(c, sheetBox(), 12)) {
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
    const s = geo.sheet;
    const near = Math.hypot(c.x - (s.x + s.w / 2), c.y - (s.y + s.h / 2)) < 150;
    // Forgiving: after the snap, or near the page, the phone finishes the trip itself.
    if (phoneStage === 1 || near) gestureNow.perform('drag');
    else {
      phone.classList.add('is-gliding');
      setPhoneOff(0, 0);
      setTimeout(() => phone.classList.remove('is-gliding'), 450);
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
    placeLogoO(f);
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

  // The live O follows the baked one; the frame-45 crop fades in as the lid opens.
  function placeLogoO(f) {
    const [dx, dy, s] = LOGO_O[f];
    logoO.style.setProperty('--odx', String(dx));
    logoO.style.setProperty('--ody', String(dy));
    logoO.style.setProperty('--os', String(s));
    logoOB.style.opacity = String(Math.pow(f / (FRAMES - 1), 2).toFixed(3));
  }
  if (RM) placeLogoO(FRAMES - 1); // the open frame is shown from the start

  const easeOutCubic = (k) => 1 - Math.pow(1 - k, 3);
  const easeInOutCubic = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

  function cancelTween() {
    if (tweenRaf) cancelAnimationFrame(tweenRaf);
    tweenRaf = 0;
    if (followRaf) cancelAnimationFrame(followRaf);
    followRaf = 0;
  }

  // While dragging, the lid trails the finger: each frame it closes a quarter of the gap.
  let dragTarget = 0;
  let followRaf = 0;
  function follow() {
    followRaf = 0;
    const gap = dragTarget - progress;
    progress = Math.abs(gap) < 0.002 ? dragTarget : progress + gap * DRAG_FOLLOW;
    render();
    if (drag && progress >= 1 && frames[FRAMES - 1]) {
      const method = drag.type === 'mouse' ? 'drag-mouse' : 'drag';
      drag = null;
      lidDone = 'opening';
      if (gestureNow && gestureNow.name === 'lid') gestureNow.perform(method);
      return;
    }
    if (progress !== dragTarget) followRaf = requestAnimationFrame(follow);
  }

  function tweenTo(target, ms, done, ease = easeOutCubic) {
    cancelTween();
    const from = progress;
    const t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / ms);
      progress = from + (target - from) * ease(k);
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
    const r = run;
    const done = () => { if (!r.cancelled) landed(method); };
    // After a drag the lid finishes the lift it was given; a tap, click, wheel or key plays it whole.
    if (/drag/.test(method) && progress > 0.02) tweenTo(1, RELEASE_MS, done, easeOutCubic);
    else tweenTo(1, Math.max(400, PLAY_MS * (1 - progress)), done, easeInOutCubic);
  }

  function snapShut() {
    tweenTo(0, Math.max(400, RELEASE_MS * progress), () => {
      if (lidArmed) stage.classList.remove('cue-off');
      armIdle();
    }, easeOutCubic);
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
    dragTarget = progress;
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
    dragTarget = Math.min(1, Math.max(0, drag.p0 + travel / DRAG_FULL_PX));
    const now = performance.now();
    drag.vy = (drag.lastY - e.clientY) / Math.max(1, now - drag.lastT); // px/ms, + is upward
    drag.lastY = e.clientY;
    drag.lastT = now;
    if (!followRaf) followRaf = requestAnimationFrame(follow);
  });

  function endDrag(e, cancelled) {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    if (followRaf) cancelAnimationFrame(followRaf);
    followRaf = 0;
    noteInput(e);
    if (!d.moved) {
      if (!cancelled) gestureNow && gestureNow.name === 'lid' && gestureNow.perform(d.type === 'mouse' ? 'click' : 'tap');
      return;
    }
    // A quick upward flick opens even if it ends short of 40%.
    const flick = performance.now() - d.lastT < 100 && d.vy > FLICK_PX_PER_MS;
    // The finger's position decides (the lid trails it slightly).
    if (dragTarget >= SNAP_AT || flick) gestureNow && gestureNow.name === 'lid' && gestureNow.perform(d.type === 'mouse' ? 'drag-mouse' : 'drag');
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

  // The magnifier sweep: each item changes as the bar passes it. The sheet is longer than the
  // editor, so the page scrolls a screen at a time and the bar sweeps each screen, then scrolls back.
  async function sweep(apply) {
    const editor = ws('.editor');
    const page = ws('.editor > .ed-page');
    const bar = ws('.sweep');
    const items = allPii();
    if (RM) { items.forEach(apply); return; }
    const ew = editor.clientWidth;
    const viewH = editor.clientHeight - page.offsetTop;
    const total = page.offsetHeight;
    const step = Math.max(40, viewH - 24);
    const passes = Math.max(1, Math.ceil((total - 24) / step));
    const done = new Set();
    for (let i = 0; i < passes; i += 1) {
      const off = Math.min(i * step, Math.max(0, total - viewH));
      if (i > 0) {
        page.style.transform = `translateY(${-off}px)`;
        await wait(SCROLL_MS);
      }
      bar.classList.remove('is-running');
      void bar.offsetWidth;
      bar.classList.add('is-running');
      items.forEach((el) => {
        if (done.has(el)) return;
        const o = offsetIn(el, page);
        const mid = o.y + o.h / 2;
        if (mid < off || mid > off + viewH) return; // not on this screen
        done.add(el);
        const t = setTimeout(() => apply(el), ((o.x + o.w * 0.5) / ew) * SWEEP_MS);
        run.timers.add(t);
      });
      await wait(SWEEP_MS + 150);
      bar.classList.remove('is-running');
    }
    items.forEach((el) => { if (!done.has(el)) apply(el); });
    if (passes > 1) {
      page.style.transform = '';
      await wait(SCROLL_MS);
    }
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
      if (!RM && i % 4 === 3) await motion(40);
    }
    await motion(400);
    cards.forEach((c) => { c.style.transform = ''; });
    svg.classList.remove('is-on');
    await motion(700);
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
    await motion(420);
    cards.forEach((c) => c.classList.add('is-blue'));
    await motion(300);
    cards.forEach((c) => { c.style.transform = ''; c.classList.remove('is-in'); });
    packet.classList.add('is-in');
    await wait(60);
    packet.style.transform = `translate(${vec.x}px, ${vec.y}px)`;
    await motion(900);
    packet.classList.remove('is-in');
  }

  async function rehydrate() {
    const draft = ws('.draft');
    draft.classList.add('is-in');
    await motion(800);
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
    // Act I — the ambush and the snap (lines type fast; each stays up until the next replaces it)
    setAct(1);
    await beat(200);
    await say('jimmy', 'jimmy1');
    await say('bob', 'bob1');
    const bubble3 = say('jimmy', 'jimmy2', false);
    await beat(150);
    sheet.classList.add('is-in');
    await beat(250);
    phone.classList.add('is-in');
    setCue();
    // Each gesture is armed as soon as its prompt appears; its idle clock starts then.
    const g1 = gesture('phone', IDLE_FIRST_MS, phoneAuto, phone);
    await Promise.all([bubble3, g1]);
    phone.setAttribute('tabindex', '-1');
    clearStrip('.msg:not(.think)');

    // Act II — open the laptop, pull the plug
    setAct(2);
    const thoughts = think('snapped').then(() => think('noTrust', false));
    await beat(300);
    camera('center');
    let g2 = Promise.resolve();
    if (!RM) {
      setLidArmed(true);
      stage.classList.remove('cue-off');
      g2 = gesture('lid', IDLE_LATER_MS, lidGesture, lidHit);
    }
    await Promise.all([thoughts, g2]);
    mountScreen();
    await beat(250);
    wifi(false);                                   // OFF before any ZOE line
    await beat(200);
    camera('zoom');
    await think('wifiOff', false);
    zoe.classList.add('is-in');
    zoeWorking(true);
    await beat(450);

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
    await beat(250);
    zoeWorking(true);
    const found = zoeSay('found', false);
    await vaultWeb();
    await found;
    zoeWorking(false);
    ws('.card-t').classList.add('is-in');
    await beat(120);
    ws('.card-p').classList.add('is-in');
    const thought = beat(500).then(() => think('conserv', false));
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
    await beat(350);
    if (!geo.portrait) {
      zoe.classList.remove('is-in');
      await beat(250);
    }
    clearStrip();
    camera('slide');
    $('.zoe-say', zoe).textContent = '';
    zoe.classList.add('is-in');
    cloud.classList.add('is-in');
    await beat(400);
    stream.classList.add('is-on', 'is-out');
    label.classList.add('is-on');
    await zoeSay('toCloud', false);
    await beat(450);
    track('reached_cloud');
    stream.classList.remove('is-out');
    cloud.classList.add('is-busy');
    await cloudSay('ask');
    zoeWorking(true);
    ripple();
    await zoeSay('search', false);
    await beat(350);
    // The catch: ZOE's line stays up at least 3 s.
    await zoeSay('shell', false);
    await wait(Math.max(KEY_LINE_MS, dwell(LINES.shell)));
    const redacting = zoeSay('redact', false);
    await sendFiles();
    await redacting;
    zoeWorking(false);
    // The fix: the cloud's line stays up at least 3 s while the draft streams back.
    const fix = cloudSay('fix', false);
    stream.classList.add('is-back');
    await fix;
    await wait(Math.max(KEY_LINE_MS, 900 * MOTION));
    stream.classList.remove('is-back');
    cloud.classList.remove('is-busy');
    await rehydrate();
    await beat(300);
    await think('caught', false);
    await wait(dwell(LINES.caught));
    if (RM) await gesture('act5', 0, async () => {});

    // Act V — ten minutes are up
    setAct(5);
    cloud.classList.add('is-out');
    stream.classList.remove('is-on');
    label.classList.remove('is-on');
    zoe.classList.remove('is-in');
    clearStrip();
    camera(geo.portrait ? 'end' : 'home');
    await beat(300);
    await say('jimmy', 'jimmy3');
    await say('bob', 'bob3');
    await say('jimmy', 'jimmy4');
    await say('bob', 'bob4', false);
    await beat(300);
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

  // The comparison's script loads when its section comes near, so it never competes with first paint.
  const flow = document.getElementById('dataflow');
  if (flow) {
    const loadCompare = () => {
      if (document.querySelector('script[src="compare.js"]')) return;
      const s = document.createElement('script');
      s.src = 'compare.js';
      document.body.appendChild(s);
    };
    if ('IntersectionObserver' in window) {
      const cmpIo = new IntersectionObserver((entries) => {
        if (!entries.some((en) => en.isIntersecting)) return;
        cmpIo.disconnect();
        loadCompare();
      }, { rootMargin: '800px 0px' });
      cmpIo.observe(flow);
    } else {
      loadCompare();
    }
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
    perform: (method = 'debug') => gestureNow && gestureNow.perform(method),
    replay: start,
  };
})();
