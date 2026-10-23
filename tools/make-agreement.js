// Builds agreement.js (the returned draft, the inserted § 9.3 and the clause library) from the
// fictional agreement text kept with the rebuild notes:
//   node tools/make-agreement.js "<path to 10_Fictional_BCA_Text.md>"
// The text is used as written: straight quotes become typographic ones, and nothing else changes
// except the edits listed in EDITS below.
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(process.argv[2], 'utf8');

// Wording changes against the source, each with its reason.
const EDITS = [
  // The site's word rules keep one capitalised prefix off the page (the original is stored encoded,
  // as tools/shots.spec.js stores its word list, so this file does not carry it either).
  [Buffer.from('UHJvLVNhbmRiYWdnaW5nOyBSZWxpYW5jZSBQcmVzZXJ2ZWQgUmVnYXJkbGVzcyBvZiBLbm93bGVkZ2U=', 'base64').toString(), 'Sandbagging Permitted; Reliance Preserved Regardless of Knowledge'],
];

const curly = (s) => s
  .replace(/(^|[\s(\[—-])"/g, '$1“').replace(/"/g, '”')
  .replace(/'/g, '’');

const part = (a, b) => {
  const i = src.indexOf(a);
  const j = b ? src.indexOf(b, i) : src.length;
  if (i < 0 || j < 0) throw new Error(`missing ${a}`);
  return src.slice(i + a.length, j);
};

// ---------- Part A: the agreement, as blocks ----------
// [type, text, lead?, id?]: title, c (centred), cb (centred, bold), note, rule, h (heading),
// p (paragraph, optional bold lead), sub (lettered paragraph), lines (kept line breaks), sb (signature party).
const blocks = [];
let inTitle = true;
let inSig = false;
for (let para of part('## Part A — Business Combination Agreement', '*End of Part A*').split(/\n\s*\n/)) {
  para = para.trim();
  if (!para) continue;
  para = curly(para);
  const rows = para.split('\n').map((r) => r.trim());
  const bold = (r) => /^\*\*.*\*\*$/.test(r);
  const unb = (r) => r.replace(/^\*\*|\*\*$/g, '');
  if (para === '---') { blocks.push(['rule', '']); inTitle = false; continue; }
  if (para.startsWith('### ')) {
    const t = para.slice(4);
    blocks.push(['h', t, null, /^ARTICLE IX\b/.test(t) ? 'art9' : null]);
    continue;
  }
  if (rows.every(bold)) {
    rows.forEach((r) => {
      const t = unb(r);
      if (/^SIGNATURE PAGE/.test(t)) { inSig = true; blocks.push(['h', t]); }
      else if (inSig) blocks.push(['sb', t]);
      else blocks.push([blocks.length ? 'cb' : 'title', t]);
    });
    continue;
  }
  if (inTitle) { blocks.push([/^Form of/.test(para) ? 'note' : 'c', para]); continue; }
  const lead = para.match(/^\*\*(.+?)\*\*\s*([\s\S]*)$/);
  if (lead && rows.length === 1) {
    const id = /^Section 9\.3\b/.test(lead[1]) ? 's93' : (/^Section 9\.4\b/.test(lead[1]) ? 's94' : null);
    blocks.push(['p', lead[2], lead[1], id]);
    continue;
  }
  if (rows.length > 1) { blocks.push(['lines', rows.join('\n')]); continue; }
  if (/^\([a-z]\)\s/.test(para)) { blocks.push(['sub', para]); continue; }
  blocks.push(['p', para, null, /^B\. Parent has agreed to guarantee/.test(para) ? 'recB' : null]);
}

// ---------- Part B: the clause Bob picks ----------
const b = curly(part('## Part B — Anti-sandbagging clause (the one Bob picks)', '---').trim()).match(/^\*\*(.+?)\*\*\s*([\s\S]*)$/);
const insert = { lead: b[1], text: b[2].trim() };

// ---------- Part C: the clause library's ten results ----------
let lib = part('## Part C — Clause library: top 10 results', '---');
EDITS.forEach(([a, c]) => { lib = lib.split(a).join(c); });
const clauses = lib.split('\n').map((r) => r.match(/^\d+\.\s+(\[BOB'S PICK\]\s+)?(.+?)\s+—\s+(.+)$/)).filter(Boolean)
  .map((m) => ({ title: curly(m[2]), source: curly(m[3]), pick: !!m[1] }));
if (clauses.length !== 10 || clauses.filter((c) => c.pick).length !== 1) throw new Error('expected ten clauses and one pick');

// ---------- What the frontier AI sees: tokens for names and addresses, dummies for figures ----------
// Tokens match the term sheet's (hero.js PARTIES); [ADDRESS_2] is the term sheet's premises.
const PII = [
  ['Kestrel Robotics Inc.', '[ORG_1]'], ['KESTREL ROBOTICS INC.', '[ORG_1]'],
  ['Harborline Trust Company', '[ORG_2]'],
  ['Lakeshore Capital Partners LP', '[ORG_3]'],
  ['Vantage Row Properties LLC', '[ORG_4]'],
  ['Meridian Acquisition LLC', '[ORG_5]'], ['MERIDIAN ACQUISITION LLC', '[ORG_5]'],
  ['Meridian Holdings LLC', '[ORG_6]'], ['MERIDIAN HOLDINGS LLC', '[ORG_6]'],
  ['Dunmore Ketteridge LLP', '[ORG_7]'],
  ['Corvane Ashby LLP', '[ORG_8]'],
  ['Jane R. Okonkwo', '[PERSON_1]'],
  ['Daniel Park', '[PERSON_2]'],
  ['James “Jimmy” Calder', '[PERSON_3]'], ['James Calder', '[PERSON_3]'],
  ['1400 Kestrel Lane, Brindlewick, ME', '[ADDRESS_1]'],
  ['2200 Tallowmere Avenue, Suite 400, Port Halvering, NJ', '[ADDRESS_3]'],
  ['310 Ferrowick Street, Oxbury Glen, MN', '[ADDRESS_4]'],
  ['77 Pellimore Square, Sallowmere, NY', '[ADDRESS_5]'],
  ['$45,000,000', '$18,200,000'], ['$2,750,000', '$1,960,000'], ['$3,400,000', '$2,150,000'],
  ['$1,400,000', '$870,000'], ['$2,000,000', '$1,280,000'], ['$18,000,000', '$11,600,000'],
  ['$24,000,000', '$15,300,000'], ['$22,000,000', '$13,900,000'], ['$337,500', '$136,500'],
  ['$250,000', '$180,000'], ['$200,000', '$140,000'], ['$100,000', '$65,000'],
  ['10,000,000', '7,500,000'], ['6,200,000', '4,750,000'], ['84 employees', '61 employees'],
  ['November 6, 2026', 'August 21, 2026'], ['January 15, 2027', 'March 2, 2027'],
  ['October 31, 2027', 'June 30, 2028'], ['October 31, 2028', 'June 30, 2029'],
  ['December 31, 2024', 'March 31, 2024'], ['September 30, 2026', 'May 31, 2026'],
  ['September 14, 2026', 'April 3, 2026'], ['January 1, 2023', 'July 1, 2022'],
];
const all = blocks.map((x) => `${x[2] || ''} ${x[1]}`).join('\n');
PII.forEach(([real]) => { if (!all.includes(real)) throw new Error(`not in the agreement: ${real}`); });

const words = all.split(/\s+/).filter(Boolean).length;
const out = `// The returned draft: a fictional business combination agreement, the § 9.3 clause Bob picks and
// the clause library's ten results. Every party, figure and term is invented.
// Generated by tools/make-agreement.js from the rebuild notes' 10_Fictional_BCA_Text.md; do not edit by hand.
window.ZOE_AGREEMENT = ${JSON.stringify({ blocks, insert, clauses, pii: PII }, null, 1)};
`;
fs.writeFileSync(path.join(__dirname, '..', 'agreement.js'), out);
console.log(`agreement.js: ${blocks.length} blocks, ${words} words, ${clauses.length} clauses, ${PII.length} masks, ${out.length} bytes`);
