// The stage: the workshop drawn on one canvas, by the stage map (x in % of
// width, y in % of height, 4:3). You (the elf), the hammer, the toy, the crew, the tree
// and its lights, the present pile, particles, the shooting star and the finale.
import { TOYS, HAMMERS } from './rules.js';

// ---- The stage map ----
export const MAP = {
  window: { x0: 16, x1: 52, y0: 10, y1: 58 },
  starBand: { x0: 18, x1: 50, y0: 13, y1: 40 },
  tree: { x: 71, w: 29, foot: 89 },
  bench: { x: 36, w: 40, foot: 91 },
  toy: { cx: 52.5, w: 14, foot: 68.5, xMin: 46, xMax: 62 },
  pip: { x: 12, w: 40, foot: 86.2 }, // the elf stands on a step stool, so the strike reaches the bench top
  stool: { x: 23.6, w: 17, foot: 98.5 },
  crew: [ // [x0, x1, y0, y1] boxes, feet at y1
    { kind: 0, n: 1, box: [1, 11.5, 52, 66] },
    { kind: 0, n: 2, box: [7.5, 18, 51, 65] },
    { kind: 1, n: 1, box: [12, 22.5, 50, 64] },
    { kind: 0, n: 3, box: [0, 12, 71, 87] },
    { kind: 2, n: 1, box: [9, 25, 66, 87.5] },
  ],
  pile: { x0: 66, x1: 100, y0: 80, y1: 99 },
  globe: { cx: 81.2, w: 5.2, foot: 36.7 }, // the snow globe on the lower shelf, left of the tree's tip
};

const IMG = {};
let META = {}, LIGHTS = null, PIVOTS = null, HAMMERJ = null;
const files = [
  'bg/workshop-bg', 'bg/bench', 'bg/stool', 'bg/tree', 'bg/finale-sky', 'bg/sleigh', 'items/tree-star', 'items/shooting-star', 'items/snow-globe',
  'sprites/elf-helper', 'sprites/toy-machine', 'sprites/reindeer-team',
  ...[0, 1, 2, 3].map((i) => `sprites/pip-swing/frame-${i}`),
  ...TOYS.map((t) => 'items/' + t.id), ...HAMMERS.map((h) => `items/${h.id}-hand`),
];
function loadImg(p) {
  return new Promise((res) => { const im = new Image(); im.onload = () => { IMG[p] = im; res(); }; im.onerror = () => res(); im.src = `assets/${p}.webp`; });
}
const getJSON = (u) => fetch(u).then((r) => r.json()).catch(() => null);
export const ready = Promise.all([
  ...files.map(loadImg),
  getJSON('assets/meta.json').then((j) => { META = j || {}; }),
  getJSON('assets/tree-lights.json').then((j) => { LIGHTS = j; }),
  getJSON('assets/sprites/pip-swing/pivots.json').then((j) => { PIVOTS = normPivots(j); }),
  getJSON('assets/items/hammers.json').then((j) => { HAMMERJ = j; }),
]);
function normPivots(j) {
  if (!j) return null;
  const arr = Array.isArray(j) ? j : j.frames || Object.keys(j).sort().map((k) => j[k]);
  return arr.map((f) => ({ fist: f.fist, angle: f.angle, crop: f.fistCrop || f.crop }));
}

// ---- Canvas ----
let cv, g, W = 400, H = 300, dpr = 1, cssW = 400;
export function init(canvas) { cv = canvas; g = cv.getContext('2d'); }
export function resize() {
  const r = cv.getBoundingClientRect();
  if (!r.width) return;
  dpr = Math.min(2, window.devicePixelRatio || 1);
  cssW = r.width;
  W = Math.round(r.width * dpr); H = Math.round(W * 0.75);
  cv.width = W; cv.height = H;
  layoutCache = null;
}
const X = (p) => (p * W) / 100, Y = (p) => (p * H) / 100;
const bboxOf = (p) => { const m = META[p]; const im = IMG[p]; return m ? m : im ? [im.width, im.height, 0, 0, im.width, im.height] : [1, 1, 0, 0, 1, 1]; };

/** Where an image goes: canvas width wPct at left x, lowest opaque pixel at foot. */
function placeCanvas(p, x, wPct, foot) {
  const [iw, ih, , , , y1] = bboxOf(p);
  const s = X(wPct) / iw;
  return { x: X(x), y: Y(foot) - y1 * s, w: iw * s, h: ih * s, s };
}
/** Fit an image's opaque box into a stage box, feet at its bottom. */
function fitBox(p, [x0, x1, y0, y1]) {
  const [iw, ih, bx0, by0, bx1, by1] = bboxOf(p);
  const bw = bx1 - bx0, bh = by1 - by0;
  const s = Math.min(X(x1 - x0) / bw, Y(y1 - y0) / bh);
  const cx = X((x0 + x1) / 2);
  return { x: cx - (bx0 + bw / 2) * s, y: Y(y1) - by1 * s, w: iw * s, h: ih * s, s };
}

let layoutCache = null;
function layout(toyIdx) {
  if (layoutCache && layoutCache.toy === toyIdx && layoutCache.W === W) return layoutCache;
  const L = { toy: toyIdx, W };
  L.bench = placeCanvas('bg/bench', MAP.bench.x, MAP.bench.w, MAP.bench.foot);
  L.tree = placeCanvas('bg/tree', MAP.tree.x, MAP.tree.w, MAP.tree.foot);
  L.stool = placeCanvas('bg/stool', MAP.stool.x, MAP.stool.w, MAP.stool.foot);
  L.pip = placeCanvas('sprites/pip-swing/frame-0', MAP.pip.x, MAP.pip.w, MAP.pip.foot);
  const [, , , py0, , py1] = bboxOf('sprites/pip-swing/frame-0');
  L.pipH = (py1 - py0) * L.pip.s;
  // The hammer: same reach for every hammer (grip to head centre = 35% of the elf's height).
  L.hammerLen = 0.35 * L.pipH;
  // The toy: top centre where the hammer head lands on the strike frame.
  const tp = 'items/' + TOYS[toyIdx].id;
  const [tw, , tx0, ty0, tx1, ty1] = bboxOf(tp);
  const ts = X(MAP.toy.w) / tw;
  const toyTop = Y(MAP.toy.foot) - (ty1 - ty0) * ts;
  let cx = X(MAP.toy.cx), angle = 85;
  const pv = PIVOTS?.[2];
  const hj = HAMMERJ && HAMMERJ['hammer-1'];
  if (pv) {
    const fx = L.pip.x + pv.fist[0] * (L.pip.w / 512), fy = L.pip.y + pv.fist[1] * (L.pip.h / 512);
    const headHalf = hj ? ((hj.headBottom ?? hj.head[1] + 60) - hj.head[1]) / (hj.grip[1] - hj.head[1]) * L.hammerLen : L.hammerLen * 0.2;
    const aimY = toyTop - headHalf * 0.3;
    const dy = fy - aimY;
    const dx = Math.sqrt(Math.max(0, L.hammerLen ** 2 - dy ** 2));
    cx = Math.min(X(MAP.toy.xMax), Math.max(X(MAP.toy.xMin), fx + dx));
    angle = (Math.atan2(cx - fx, dy) * 180) / Math.PI;
  }
  L.strikeAngle = angle;
  L.toyBox = { x: cx - ((tx0 + tx1) / 2) * ts, y: Y(MAP.toy.foot) - ty1 * ts, w: tw * ts, h: tw * ts, s: ts, top: toyTop, cx };
  L.crew = MAP.crew.map((c) => fitBox(c.kind === 0 ? 'sprites/elf-helper' : c.kind === 1 ? 'sprites/toy-machine' : 'sprites/reindeer-team', c.box));
  { const [gw, , gx0, , gx1] = bboxOf('items/snow-globe'); L.globe = placeCanvas('items/snow-globe', MAP.globe.cx - ((gx0 + gx1) / 2 / gw) * MAP.globe.w, MAP.globe.w, MAP.globe.foot); }
  L.slots = pileSlots();
  layoutCache = L;
  return L;
}

// ---- The pile under the tree: 40 fixed spots, each showing a toy you made ----
function pileSlots() {
  const slots = [];
  const { x0, x1, y0, y1 } = MAP.pile;
  // Rows from the floor up, narrower as they rise.
  const rows = [[12, 0], [10, 1], [8, 2], [6, 3], [4, 4]];
  let k = 0;
  for (const [n, r] of rows) {
    const rowW = (x1 - x0) * (1 - r * 0.13), left = x0 + ((x1 - x0) - rowW) / 2 + 1;
    for (let i = 0; i < n; i++) {
      const jitter = ((k * 37) % 7) / 7 - 0.5;
      const sz = 5.2 - r * 0.35 + (((k * 53) % 5) / 5) * 1.6;
      slots.push({ cx: left + (rowW - 2) * ((i + 0.5) / n) + jitter * 0.8, foot: y1 - 0.5 - r * 3.6 + Math.abs(jitter) * 0.6, size: sz, img: 1 + ((k * 7 + r) % 6), r, i });
      k++;
    }
  }
  // Fill order: bottom row centre outwards first, then up.
  const ord = slots.map((s, i) => [s.r * 100 + Math.abs(s.i - (rows[s.r][0] - 1) / 2), i]).sort((a, b) => a[0] - b[0]).map((a) => slots[a[1]]);
  return ord.slice(0, 40);
}
export const slotsFilled = (pile) => { let n = 0; while (n < 40 && pile >= 2 ** ((n + 1) / 4)) n++; return n; };

// ---- Animation state ----
const A = {
  swingAt: -1e9, spinAt: -1e9, squashAt: -1e9, popAt: -1e9, popCount: 1, shakeAt: -1e9,
  sparks: [], floaters: [], flying: [], crewSeen: [0, 0, 0], crewIn: {}, lastToy: -1,
};
export function hit(amount, { gold = false, heavy = false } = {}) {
  const now = performance.now();
  A.swingAt = now;
  if (heavy) A.shakeAt = now + 40;
}
function strikeEffects(now, L) {
  A.squashAt = now;
  const n = A.pendingGold ? 14 : 8;
  for (let i = 0; i < n && A.sparks.length < 40; i++) {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2, v = (0.5 + Math.random()) * W * 0.006;
    A.sparks.push({ x: L.toyBox.cx, y: L.toyBox.top + 4, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, gold: A.pendingGold });
  }
}
export function floater(text, { big = false } = {}) {
  const L = layoutCache; if (!L) return;
  if (A.floaters.length > 12) A.floaters.shift();
  A.floaters.push({ text, x: L.toyBox.cx + (Math.random() - 0.5) * X(4), y: L.toyBox.top - Y(2), t: performance.now(), big });
}
let pendingStrike = null;
export function tapFx(amount, opts = {}) {
  hit(amount, opts);
  A.pendingGold = !!opts.gold;
  pendingStrike = performance.now() + 45;
  floater('+' + amount);
}
/** A finished toy (or many at once). */
export function toyDone(count, toyIdx) {
  const now = performance.now();
  A.popAt = now; A.popCount = count;
  if (count === 1) A.spinAt = now;
  if (A.flying.length < 3) A.flying.push({ t: now, toy: toyIdx });
}

// ---- The snow globe: shakes when you're promoted, then its snow swirls and settles ----
const GLOBE = { cx: 128, cy: 94, r: 72, floor: 146 }; // the dome, in the 256 px image
let flakes = [];
export function shakeGlobe() {
  A.globeAt = performance.now();
  flakes = Array.from({ length: 26 }, () => {
    const a = Math.random() * Math.PI * 2, d = Math.sqrt(Math.random()) * GLOBE.r * 0.9;
    return { x: GLOBE.cx + Math.cos(a) * d, y: GLOBE.cy + Math.sin(a) * d * 0.9 - 10, ph: Math.random() * 7, sw: 8 + Math.random() * 14, v: 7 + Math.random() * 9, s: 1.6 + Math.random() * 1.6 };
  });
}
export const globeState = () => ({ shaking: performance.now() - (A.globeAt ?? -1e9) < 1600, flakes: flakes.length });
function drawGlobe(L, now) {
  const im = IMG['items/snow-globe'], b = L.globe;
  if (!im || !b) return;
  const t = (now - (A.globeAt ?? -1e9)) / 1000;
  const k = b.w / 256;
  const px = b.x + 128 * k, py = b.y + 242 * k; // rocks on the middle of its base
  g.save();
  g.translate(px, py);
  if (t >= 0 && t < 1.6) {
    const e = Math.exp(-t * 2.4);
    g.rotate(0.3 * Math.sin(t * Math.PI * 2 * 3.1) * e);
    g.translate(0, -Math.abs(Math.sin(t * Math.PI * 2 * 3.1)) * b.h * 0.05 * e);
  }
  g.translate(-px, -py);
  g.drawImage(im, b.x, b.y, b.w, b.h);
  if (flakes.length && t < 7) {
    g.save();
    g.beginPath(); g.arc(b.x + GLOBE.cx * k, b.y + GLOBE.cy * k, GLOBE.r * k, 0, 7); g.clip();
    g.fillStyle = '#fffdf6';
    for (const f of flakes) {
      const swirl = Math.exp(-t * 0.7);
      const x = f.x + Math.sin(t * 2.2 + f.ph) * f.sw * swirl;
      const y = Math.min(GLOBE.floor, f.y + f.v * t - Math.cos(t * 2.2 + f.ph) * f.sw * 0.5 * swirl);
      const alpha = t > 5.5 ? Math.max(0, (7 - t) / 1.5) : 1;
      g.globalAlpha = alpha * 0.95;
      g.beginPath(); g.arc(b.x + x * k, b.y + y * k, Math.max(0.9 * dpr, f.s * k), 0, 7); g.fill();
    }
    g.restore();
  } else if (flakes.length) flakes = [];
  g.restore();
  // A few gold glints around the dome as it starts to shake.
  if (t >= 0 && t < 1.1) {
    const cx = b.x + GLOBE.cx * k, cy = b.y + GLOBE.cy * k, R = GLOBE.r * k;
    for (let i = 0; i < 5; i++) {
      const lt = t - i * 0.12; if (lt < 0 || lt > 0.55) continue;
      const a = -2.6 + i * 1.15, d = R * (1.25 + (i % 2) * 0.2), sz = Math.max(3 * dpr, R * 0.34) * Math.sin((lt / 0.55) * Math.PI);
      const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
      g.fillStyle = 'rgba(255,224,130,0.95)';
      g.beginPath(); g.moveTo(x, y - sz); g.quadraticCurveTo(x, y, x + sz * 0.6, y); g.quadraticCurveTo(x, y, x, y + sz); g.quadraticCurveTo(x, y, x - sz * 0.6, y); g.quadraticCurveTo(x, y, x, y - sz); g.fill();
    }
  }
}

// ---- Star ----
export function starPos(f) { // f: 0..1 through its 8 s
  const b = MAP.starBand;
  return { x: b.x0 + (b.x1 - b.x0) * f, y: b.y0 + 3 + (b.y1 - b.y0 - 12) * f };
}
/** Is a click at stage-css (px, py) on the star at fraction f? */
export function hitStar(px, py, f) {
  const p = starPos(f);
  const sx = (p.x / 100) * cssW, sy = (p.y / 100) * cssW * 0.75;
  return Math.hypot(px - sx, py - sy) <= 44;
}

// ---- Drawing ----
function drawImg(p, b, alpha = 1) { const im = IMG[p]; if (!im) return; if (alpha !== 1) g.globalAlpha = alpha; g.drawImage(im, b.x, b.y, b.w, b.h); if (alpha !== 1) g.globalAlpha = 1; }

const snow = Array.from({ length: 34 }, (_, i) => ({ x: (i * 37) % 100 / 100, y: (i * 61) % 100 / 100, s: 0.6 + ((i * 13) % 10) / 10, v: 0.025 + ((i * 7) % 10) / 400 }));
function drawSnow(t) {
  const w = MAP.window;
  g.save();
  g.beginPath();
  const cx = X((w.x0 + w.x1) / 2), rx = X((w.x1 - w.x0) / 2) * 0.92;
  g.ellipse(cx, Y(w.y0 + 14), rx, Y(13), 0, Math.PI, 0);
  g.rect(cx - rx, Y(w.y0 + 14), rx * 2, Y(w.y1 - w.y0 - 17));
  g.clip();
  g.fillStyle = 'rgba(255,255,255,0.75)';
  for (const f of snow) {
    const yy = ((f.y + (t / 1000) * f.v) % 1), xx = f.x + Math.sin(t / 1500 + f.y * 9) * 0.01;
    g.beginPath(); g.arc(cx - rx + xx * rx * 2, Y(w.y0) + yy * Y(w.y1 - w.y0), f.s * W / 700, 0, 7); g.fill();
  }
  g.restore();
}

function drawLights(L, now, view) {
  if (!LIGHTS) return;
  const t = L.tree, sc = t.w / LIGHTS.width;
  const lit = view.lightsLit; // number of strands lit (eve), or 99 for all
  const strands = Math.min(LIGHTS.strands.length, view.strands);
  const cols = ['#ff5a4f', '#ffd65a', '#6fd38a', '#7fc8ff', '#ff9ad5'];
  for (let i = 0; i < strands; i++) {
    const pts = LIGHTS.strands[i];
    g.strokeStyle = 'rgba(35,25,15,0.8)'; g.lineWidth = Math.max(1.2, W / 600);
    g.beginPath();
    pts.forEach(([x, y], k) => (k ? g.lineTo(t.x + x * sc, t.y + y * sc) : g.moveTo(t.x + x * sc, t.y + y * sc)));
    g.stroke();
    const on = i < lit;
    pts.forEach(([x, y], k) => {
      const bx = t.x + x * sc, by = t.y + y * sc, r = Math.max(2, W / 210);
      const c = cols[(k + i) % cols.length];
      if (on) {
        const tw = 0.75 + 0.25 * Math.sin(now / 300 + k * 1.7 + i);
        const gr = g.createRadialGradient(bx, by, 0, bx, by, r * 4);
        gr.addColorStop(0, c); gr.addColorStop(1, 'rgba(255,220,120,0)');
        g.globalAlpha = tw; g.fillStyle = gr; g.beginPath(); g.arc(bx, by, r * 4, 0, 7); g.fill(); g.globalAlpha = 1;
        g.fillStyle = '#fff8e0';
      } else g.fillStyle = shade(c);
      g.beginPath(); g.arc(bx, by, r, 0, 7); g.fill();
    });
  }
}
const shade = (c) => ({ '#ff5a4f': '#a8443c', '#ffd65a': '#a8904a', '#6fd38a': '#4f8a60', '#7fc8ff': '#4f7aa0', '#ff9ad5': '#a06a88' })[c];

function drawTreeStar(L, view, now) {
  if (!LIGHTS || !IMG['items/tree-star']) return;
  const t = L.tree, sc = t.w / LIGHTS.width;
  const [tx, ty] = LIGHTS.tip;
  const size = X(6.5);
  const x = t.x + tx * sc, y = t.y + ty * sc;
  if (view.starLit) {
    const gr = g.createRadialGradient(x, y - size * 0.35, 0, x, y - size * 0.35, size * 1.6);
    gr.addColorStop(0, 'rgba(255,230,140,0.9)'); gr.addColorStop(1, 'rgba(255,200,80,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y - size * 0.35, size * 1.6, 0, 7); g.fill();
    g.drawImage(IMG['items/tree-star'], x - size / 2, y - size * 0.85, size, size);
  } else {
    g.globalAlpha = 0.85; g.filter = 'brightness(0.55) saturate(0.6)';
    g.drawImage(IMG['items/tree-star'], x - size / 2, y - size * 0.85, size, size);
    g.filter = 'none'; g.globalAlpha = 1;
  }
}

function drawPile(L, filled, liftF, toys = []) {
  // Higher rows sit further back in the heap: draw them first.
  const order = [...Array(filled).keys()].sort((a, b) => L.slots[b].r - L.slots[a].r || a - b);
  for (const i of order) {
    const s = L.slots[i], t = toys[i] ?? 0, p = 'items/' + TOYS[t].id, im = IMG[p];
    if (!im) continue;
    const sz = X(s.size) * 1.3;
    let x = X(s.cx) - sz / 2, y = Y(s.foot) - sz * 0.93;
    if (liftF != null) {
      const d = Math.max(0, Math.min(1, liftF * 1.6 - (i / 40) * 0.6));
      if (d >= 1) continue;
      y -= d * d * H * 1.1; x += Math.sin(d * 6 + i) * X(1.5) * d;
    }
    g.drawImage(im, x, y, sz, sz);
  }
}

let tags = [];
function drawCrew(L, helpers, now) {
  tags = [];
  // Back row first: elf1, elf2, machine; then front: elf3, reindeer.
  MAP.crew.forEach((c, idx) => {
    const owned = helpers[c.kind];
    if (owned < c.n) return;
    const b = L.crew[idx];
    const key = idx;
    if (A.crewIn[key] == null) A.crewIn[key] = A.crewInit ? now : -1e9;
    const walk = Math.min(1, (now - A.crewIn[key]) / 1300);
    const dx = (1 - walk) * -(b.x + b.w + X(2));
    const bob = Math.abs(Math.sin(now / (c.kind === 1 ? 260 : 340) + idx)) * Y(c.kind === 1 ? 0.3 : 0.7) * (walk < 1 ? 2 : 1);
    const p = c.kind === 0 ? 'sprites/elf-helper' : c.kind === 1 ? 'sprites/toy-machine' : 'sprites/reindeer-team';
    const im = IMG[p]; if (!im) return;
    g.drawImage(im, b.x + dx, b.y - bob, b.w, b.h);
    // ×N tag on the last figure of a kind
    const lastOfKind = c.kind === 0 ? c.n === 3 : true;
    const extra = c.kind === 0 ? owned - 3 : owned - 1;
    if (lastOfKind && extra > 0 && walk >= 1) {
      tags.push(['×' + owned, X(c.box[0] + (c.box[1] - c.box[0]) * (c.kind === 2 ? 0.75 : 0.5)), Y(c.box[3] - (c.kind === 0 && c.n === 3 ? 0.5 : 1.5))]);
    }
  });
  A.crewInit = true;
  // Counts last, on top of every figure.
  for (const t of tags) tag(...t);
}
function tag(text, x, y) {
  const fs = Math.max(11 * dpr, W / 52);
  g.font = `900 ${fs}px Nunito, sans-serif`;
  const w = g.measureText(text).width + fs * 0.8, h = fs * 1.35;
  g.fillStyle = '#f6ead2'; g.strokeStyle = '#3b2414'; g.lineWidth = Math.max(1.5, W / 500);
  roundRect(x - w / 2, y - h, w, h, h / 2); g.fill(); g.stroke();
  g.fillStyle = '#3b2414'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, x, y - h / 2 + fs * 0.05);
}
function roundRect(x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

const SWING = [[0, 1], [45, 2], [125, 3], [190, 0]]; // ms -> frame
function swingFrame(now) {
  const dt = now - A.swingAt;
  let f = 0;
  for (const [t, fr] of SWING) if (dt >= t) f = fr;
  return f;
}

function drawPip(L, hammer, now) {
  const fr = swingFrame(now);
  const p = 'sprites/pip-swing/frame-' + fr;
  const im = IMG[p]; if (!im) return;
  const b = L.pip;
  g.drawImage(im, b.x, b.y, b.w, b.h);
  const pv = PIVOTS?.[fr];
  const hp = `items/${HAMMERS[hammer].id}-hand`, him = IMG[hp];
  const hj = HAMMERJ?.[HAMMERS[hammer].id];
  if (!pv || !him || !hj) return;
  const k = b.w / 512;
  const fx = b.x + pv.fist[0] * k, fy = b.y + pv.fist[1] * k;
  // The strike aims at the toy's top; the follow-through carries on just a little past it.
  let ang = fr === 2 ? L.strikeAngle : fr === 3 ? L.strikeAngle + 8 : pv.angle;
  // The spin after a finished toy: one full turn while idle.
  const sp = (now - A.spinAt) / 380;
  if (sp >= 0 && sp < 1 && fr === 0) ang += 360 * (1 - (1 - sp) ** 2);
  const hs = L.hammerLen / (hj.grip[1] - hj.head[1]);
  g.save(); g.translate(fx, fy); g.rotate((ang * Math.PI) / 180);
  g.drawImage(him, -hj.grip[0] * hs, -hj.grip[1] * hs, 512 * hs, 512 * hs);
  g.restore();
  // Fingers over the handle.
  if (pv.crop) {
    const [cx, cy, cw, ch] = pv.crop, sx = im.width / 512;
    g.drawImage(im, cx * sx, cy * sx, cw * sx, ch * sx, b.x + cx * k, b.y + cy * k, cw * k, ch * k);
  }
}

function drawToy(L, toyIdx, now) {
  const p = 'items/' + TOYS[toyIdx].id, im = IMG[p]; if (!im) return;
  const b = L.toyBox;
  let sx = 1, sy = 1, lift = 0;
  const sq = (now - A.squashAt) / 140;
  if (sq >= 0 && sq < 1) { const e = Math.sin(sq * Math.PI); sx = 1 + 0.12 * e; sy = 1 - 0.14 * e; }
  const pop = (now - A.popAt) / 420;
  if (pop >= 0 && pop < 1) { const e = Math.sin(pop * Math.PI); lift = e * Y(5); sx *= 1 + 0.15 * e; sy *= 1 + 0.15 * e; }
  const footY = Y(MAP.toy.foot);
  g.save();
  g.translate(b.cx, footY - lift);
  g.scale(sx, sy);
  g.drawImage(im, b.x - b.cx, b.y - footY, b.w, b.h);
  g.restore();
  if (pop >= 0 && pop < 1.6) {
    // Wrapping flash and the ×N tag.
    if (pop < 0.35) { g.globalAlpha = (0.35 - pop) * 2; g.fillStyle = '#ffe9a8'; g.beginPath(); g.arc(b.cx, b.top + (footY - b.top) / 2, (footY - b.top) * 0.8, 0, 7); g.fill(); g.globalAlpha = 1; }
    if (A.popCount > 1) { g.globalAlpha = Math.min(1, 1.6 - pop); tag('×' + A.popCount, b.cx, b.top - Y(1)); g.globalAlpha = 1; }
  }
}

function drawFlying(L, now, filled) {
  A.flying = A.flying.filter((f) => now - f.t < 700);
  for (const f of A.flying) {
    const k = (now - f.t) / 700;
    const dest = L.slots[Math.min(39, Math.max(0, filled - 1))] || L.slots[0];
    const x0 = L.toyBox.cx, y0 = L.toyBox.top, x1 = X(dest.cx), y1 = Y(dest.foot) - X(dest.size) / 2;
    const x = x0 + (x1 - x0) * k, y = y0 + (y1 - y0) * k - Math.sin(k * Math.PI) * Y(16);
    const sz = X(6.5) * (1 - 0.15 * k), im = IMG['items/' + TOYS[f.toy].id];
    if (im) { g.save(); g.translate(x, y); g.rotate(Math.sin(k * Math.PI) * 0.6); g.drawImage(im, -sz / 2, -sz / 2, sz, sz); g.restore(); }
  }
}

function drawParticles(now) {
  for (const s of A.sparks) {
    s.x += s.vx * dpr; s.y += s.vy * dpr; s.vy += 0.06 * dpr * (W / 800); s.life -= 0.045;
    g.strokeStyle = s.gold ? `rgba(255,210,90,${s.life})` : `rgba(255,244,200,${s.life})`;
    g.lineWidth = Math.max(1.5, W / 400);
    g.beginPath(); g.moveTo(s.x, s.y); g.lineTo(s.x - s.vx * 2.2, s.y - s.vy * 2.2); g.stroke();
  }
  A.sparks = A.sparks.filter((s) => s.life > 0);
  const fs = Math.max(13 * dpr, W / 36);
  g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  A.floaters = A.floaters.filter((f) => now - f.t < 800);
  for (const f of A.floaters) {
    const k = (now - f.t) / 800;
    g.globalAlpha = 1 - k * k;
    g.font = `900 ${f.big ? fs * 1.25 : fs}px Nunito, sans-serif`;
    g.lineWidth = Math.max(3, fs / 5); g.strokeStyle = '#3b2414'; g.lineJoin = 'round';
    const y = f.y - k * Y(10);
    g.strokeText(f.text, f.x, y); g.fillStyle = f.big ? '#ffd65a' : '#fff4c9'; g.fillText(f.text, f.x, y);
  }
  g.globalAlpha = 1;
}

function drawStar(f, now) {
  const im = IMG['items/shooting-star']; if (!im) return;
  const p = starPos(f);
  const w = X(17), h = w / 2, hx = X(p.x), hy = Y(p.y);
  const a = Math.min(1, f * 8, (1 - f) * 8);
  const gr = g.createRadialGradient(hx, hy, 0, hx, hy, w * 0.35);
  gr.addColorStop(0, `rgba(255,250,220,${0.7 * a})`); gr.addColorStop(1, 'rgba(255,240,180,0)');
  g.fillStyle = gr; g.beginPath(); g.arc(hx, hy, w * 0.35, 0, 7); g.fill();
  g.globalAlpha = a * (0.85 + 0.15 * Math.sin(now / 90));
  // The image's head sits near its right edge, at about 60% of its height.
  g.save(); g.translate(hx, hy); g.rotate(0.28); g.drawImage(im, -w * 0.93, -h * 0.6, w, h); g.restore();
  g.globalAlpha = 1;
}

function vignette(alpha, color = '255,200,70') {
  const gr = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.7);
  gr.addColorStop(0, `rgba(${color},0)`); gr.addColorStop(1, `rgba(${color},${alpha})`);
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
}

/**
 * Draw one frame. view: { toy, hammer, helpers, pile, strands, lightsLit, starLit,
 *   star (0..1 or null), rush (0..1 or 0), eve: null | { phase, t } }
 */
export function draw(view) {
  if (!g || !IMG['bg/workshop-bg']) return;
  const now = performance.now();
  const L = layout(view.toy);
  if (pendingStrike && now >= pendingStrike) { strikeEffects(now, L); pendingStrike = null; }
  const eve = view.eve;
  if (eve && eve.phase === 'sky') return drawSky(eve.t, now);
  if (eve && eve.phase === 'card') return drawSky(99, now);
  g.save();
  const sh = (now - A.shakeAt) / 160;
  if (sh >= 0 && sh < 1) g.translate((Math.random() - 0.5) * W * 0.008 * (1 - sh), (Math.random() - 0.5) * W * 0.008 * (1 - sh));
  g.drawImage(IMG['bg/workshop-bg'], 0, 0, W, H);
  drawSnow(now);
  if (view.star != null) drawStar(view.star, now);
  drawCrew(L, view.helpers, now);
  drawGlobe(L, now);
  drawImg('bg/tree', L.tree);
  drawLights(L, now, view);
  drawTreeStar(L, view, now);
  drawImg('bg/bench', L.bench);
  const filled = slotsFilled(view.pile);
  if (!eve || eve.phase !== 'lift') drawPile(L, filled, null, view.pileToys);
  if (view.pile > 0 && filled >= 40 && !eve) tag('×' + fmtShort(view.pile), X(84), Y(81));
  drawToy(L, view.toy, now);
  drawImg('bg/stool', L.stool);
  drawPip(L, view.hammer, now);
  drawParticles(now);
  drawFlying(L, now, filled);
  if (view.rush) vignette(0.35 + 0.1 * Math.sin(now / 200));
  if (eve && eve.phase === 'lights') { g.fillStyle = `rgba(10,12,40,${Math.min(0.55, eve.t * 0.4)})`; g.fillRect(0, 0, W, H); drawLights(L, now, view); drawTreeStar(L, view, now); }
  if (eve && eve.phase === 'lift') { g.fillStyle = 'rgba(10,12,40,0.55)'; g.fillRect(0, 0, W, H); drawLights(L, now, view); drawTreeStar(L, view, now); drawPile(L, filled, eve.t, view.pileToys); }
  g.restore();
}
const fmtShort = (n) => (n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e4 ? Math.floor(n / 1000) + 'K' : String(n));

function drawSky(t, now) {
  // t: seconds into the sky scene. Fades in over 0.6 s; the sleigh crosses the moon.
  const sky = IMG['bg/finale-sky'];
  const pan = Math.min(1, t / 7);
  if (sky) {
    const z = 1.08 - 0.06 * pan;
    g.drawImage(sky, -(W * (z - 1)) / 2, -(H * (z - 1)) * (0.8 - 0.6 * pan), W * z, H * z);
  }
  const sl = IMG['bg/sleigh'];
  if (sl && t < 99) {
    const k = Math.min(1, t / 5.5);
    const w = X(38), h = (w * sl.height) / sl.width;
    const x = -w + (W + w) * k, y = Y(30) - Math.sin(k * Math.PI) * Y(8) + Math.sin(now / 300) * Y(0.6);
    g.drawImage(sl, x, y - h / 2, w, h);
  }
  if (t < 0.6) { g.fillStyle = `rgba(10,12,40,${1 - t / 0.6})`; g.fillRect(0, 0, W, H); }
}

/** The stage as a PNG (for bug reports). */
export const grab = () => new Promise((r) => cv.toBlob(r, 'image/png'));
export const toyTopCss = () => (layoutCache ? { x: layoutCache.toyBox.cx / dpr, y: layoutCache.toyBox.top / dpr } : null);
export const isReady = () => !!IMG['bg/workshop-bg'];
export const debugLayout = () => layoutCache && { W, H, pip: layoutCache.pip, toyBox: layoutCache.toyBox, strikeAngle: layoutCache.strikeAngle, hammerLen: layoutCache.hammerLen, pivot2: PIVOTS?.[2], h1: HAMMERJ?.['hammer-1'] };
