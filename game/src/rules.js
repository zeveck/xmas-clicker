// Chief Toy Officer: all the numbers and the pure rules. No DOM, so node can import it.

export const TOYS = [
  { id: 'toy-01', name: 'Wooden Tractor', work: 10, cookies: 2, cheer: 1 },
  { id: 'toy-02', name: 'Yo-yo', work: 25, cookies: 6, cheer: 3 },
  { id: 'toy-03', name: 'Puzzle Cube', work: 60, cookies: 16, cheer: 8 },
  { id: 'toy-04', name: 'Wooden Sword', work: 150, cookies: 45, cheer: 22 },
  { id: 'toy-05', name: 'Doodle Dial', work: 400, cookies: 130, cheer: 65 },
  { id: 'toy-06', name: 'Fidget Spinner', work: 1000, cookies: 350, cheer: 180 },
  { id: 'toy-07', name: 'Chess', work: 2500, cookies: 950, cheer: 500 },
  { id: 'toy-08', name: 'Pixel Play', work: 6000, cookies: 2600, cheer: 1400 },
  { id: 'toy-09', name: 'Bike', work: 15000, cookies: 7000, cheer: 3800 },
  { id: 'toy-10', name: 'Smartphone', work: 150000, cookies: 75000, cheer: 41250 },
];

export const RANKS = [
  { title: 'Assistant Junior Toy Maker', cheer: 0 },
  { title: 'Junior Toy Maker', cheer: 14 },
  { title: 'Assistant Toy Maker', cheer: 90 },
  { title: 'Pretty Good Toy Maker', cheer: 550 },
  { title: 'Crafty Toy Maker', cheer: 2200 },
  { title: 'Master Toy Maker', cheer: 8000 },
  { title: 'Senior Master Toy Maker', cheer: 28000 },
  { title: 'Principal Toy Maker', cheer: 130000 },
  { title: 'Assistant Toy Officer', cheer: 470000 },
  { title: 'Chief Toy Officer', cheer: 1100000 },
];

export const HAMMERS = [
  { id: 'hammer-1', name: 'Cheap Hammer', work: 1, cost: 0, rank: 1 },
  { id: 'hammer-2', name: 'Heavy Hammer', work: 4, cost: 150, rank: 3 },
  { id: 'hammer-3', name: 'Supreme Hammer', work: 20, cost: 6000, rank: 6 },
  { id: 'hammer-4', name: 'Thunder Mallet', work: 100, cost: 40000, rank: 8 },
];

export const HELPERS = [
  { id: 'elf', name: 'Elf', img: 'elf-helper', wps: 1, cost: 15, rank: 1 },
  { id: 'machine', name: 'Toy Machine', img: 'toy-machine', wps: 30, cost: 1800, rank: 5 },
  { id: 'deer', name: 'Reindeer Team', img: 'reindeer-team', wps: 150, cost: 10000, rank: 7 },
];

export const UPGRADES = [
  { id: 'elfH', name: 'Elf Hammers', img: 'upg-elf-hammers', effect: 'Elves ×2', cost: 200, rank: 2 },
  { id: 'cocoa', name: 'Hot Cocoa', img: 'upg-hot-cocoa', effect: 'Hammer hits ×1.5', cost: 500, rank: 3 },
  { id: 'steelElf', name: 'Steel Elf Hammers', img: 'upg-steel-elf-hammers', effect: 'Elves ×2', cost: 3000, rank: 5 },
  { id: 'wrap', name: 'Wrapping Station', img: 'upg-wrapping-station', effect: 'Cookies +25%', cost: 6000, rank: 6 },
  { id: 'conveyor', name: 'Conveyor Belt', img: 'upg-conveyor-belt', effect: 'Toy Machines ×2', cost: 30000, rank: 7 },
  { id: 'goldElf', name: 'Golden Elf Hammers', img: 'upg-golden-elf-hammers', effect: 'Elves ×2', cost: 60000, rank: 9 },
];

/** Most elves you can have at each rank (the workshop only has so many benches); unlimited at the top. */
export let ELF_CAP = [4, 8, 12, 25, 30, 36, 42, 48, 56, Infinity];
export const setElfCap = (c) => { ELF_CAP = c; };
export const elfCap = (s) => ELF_CAP[Math.min(s.rank, ELF_CAP.length) - 1];
/** The first rank with room for more elves than you have now (null if none is still to come). */
export function moreElvesAt(s) {
  for (let r = s.rank + 1; r <= ELF_CAP.length; r++) if (ELF_CAP[r - 1] > s.helpers[0]) return r;
  return null;
}
export const CREW_TAP = 0.15;      // each tap also adds this share of the crew's work per second
export const PHONE_CAP = 0.9;      // helpers build the first Smartphone only this far
export const HELPER_GROWTH = 1.15; // each helper costs 15% more than the last
export const RUSH_SECONDS = 20, RUSH_HAMMER = 5, RUSH_HELPERS = 2;
export const STAR_RANK = 4, STAR_MIN = 60, STAR_MAX = 120, STAR_DRIFT = 8;
export const AWAY_FULL = 600, AWAY_MAX = 4 * 3600;
export const SAVE_VERSION = 1;

export function newState() {
  return {
    version: SAVE_VERSION,
    cookies: 0, cheer: 0, rank: 1, toy: 0,
    progress: TOYS.map(() => 0), made: TOYS.map(() => 0),
    hammer: 0, helpers: HELPERS.map(() => 0), upgrades: {},
    pile: 0, pileToys: [], phoneDone: false, eveSeen: false, phoneTask: false,
    stats: { taps: 0, toys: 0, stars: 0, played: 0, cookies: 0 },
    settings: { music: true, sfx: true, muted: false },
    leftAt: 0, started: false, firstElf: false, tab: 'toys',
  };
}

const up = (s, id) => !!s.upgrades[id];
export const elfMul = (s) => (up(s, 'elfH') ? 2 : 1) * (up(s, 'steelElf') ? 2 : 1) * (up(s, 'goldElf') ? 2 : 1);
export function helperWps(s, i) {
  const h = HELPERS[i];
  return h.wps * (i === 0 ? elfMul(s) : 1) * (i === 1 && up(s, 'conveyor') ? 2 : 1);
}
/** The crew's work per second (Rush doubles it). */
export function crewWps(s, rush = false) {
  let w = 0;
  for (let i = 0; i < HELPERS.length; i++) w += s.helpers[i] * helperWps(s, i);
  return w * (rush ? RUSH_HELPERS : 1);
}
/** The hammer's part of a tap. */
export const hammerWork = (s, rush = false, hammer = s.hammer) =>
  HAMMERS[hammer].work * (up(s, 'cocoa') ? 1.5 : 1) * (rush ? RUSH_HAMMER : 1);
/** A whole tap: the hammer's part plus a share of the crew's work. */
export const tapWork = (s, rush = false) => hammerWork(s, rush) + CREW_TAP * crewWps(s, rush);
export const cookieMul = (s) => (up(s, 'wrap') ? 1.25 : 1);
export const helperCost = (i, owned) => Math.ceil(HELPERS[i].cost * HELPER_GROWTH ** owned);
export const toyUnlocked = (s, i) => i < s.rank;
export const isFirstPhone = (s, i = s.toy) => i === 9 && s.rank >= 10 && !s.phoneDone;
export const nextRankCheer = (s) => (s.rank < RANKS.length ? RANKS[s.rank].cheer : null);

/** What a shop item costs now, and whether it can be bought. */
export function shopItem(s, kind, i) {
  if (kind === 'hammer') {
    const h = HAMMERS[i];
    const owned = s.hammer >= i;
    return { cost: h.cost, unlocked: s.rank >= h.rank, owned, canBuy: !owned && s.rank >= h.rank && i === s.hammer + 1 };
  }
  if (kind === 'helper') {
    const h = HELPERS[i];
    const full = i === 0 && s.helpers[0] >= elfCap(s);
    return { cost: helperCost(i, s.helpers[i]), unlocked: s.rank >= h.rank, owned: false, full, canBuy: s.rank >= h.rank && !full };
  }
  const u = UPGRADES[i];
  return { cost: u.cost, unlocked: s.rank >= u.rank, owned: up(s, u.id), canBuy: s.rank >= u.rank && !up(s, u.id) };
}

/** Buy something. Returns { ok, reason, cost }. */
export function buy(s, kind, i) {
  const it = shopItem(s, kind, i);
  if (!it.unlocked) return { ok: false, reason: 'locked', cost: it.cost };
  if (!it.canBuy) return { ok: false, reason: it.owned ? 'owned' : it.full ? 'full' : 'order', cost: it.cost };
  if (s.cookies < it.cost) return { ok: false, reason: 'cookies', cost: it.cost };
  s.cookies -= it.cost;
  if (kind === 'hammer') s.hammer = i;
  else if (kind === 'helper') s.helpers[i]++;
  else s.upgrades[UPGRADES[i].id] = true;
  return { ok: true, cost: it.cost };
}

/**
 * Put work into a toy. tap: work from taps; crew: work from helpers.
 * Finishes every toy the work covers and carries the rest over.
 * opts.away: promotions don't switch toys; opts.cheerCap caps total cheer.
 * Returns { made, cookies, cheer, promotions: [rank numbers reached], phoneDone }.
 */
export function addWork(s, tap, crew, opts = {}) {
  const i = s.toy, toy = TOYS[i];
  if (isFirstPhone(s, i)) {
    // Helpers stop at 90%; taps finish it.
    crew = Math.max(0, Math.min(crew, PHONE_CAP * toy.work - s.progress[i]));
  }
  let p = s.progress[i] + tap + crew;
  let made = 0;
  if (p >= toy.work) {
    made = Math.floor(p / toy.work);
    p -= made * toy.work;
  }
  const res = { made, cookies: 0, cheer: 0, promotions: [], phoneDone: false, toy: i };
  if (made) {
    let firstPhoneNow = false;
    if (isFirstPhone(s, i)) { s.phoneDone = true; res.phoneDone = true; firstPhoneNow = true; p = 0; made = 1; res.made = 1; }
    const ck = toy.cookies * made * cookieMul(s);
    let ch = toy.cheer * made;
    if (opts.cheerCap != null) ch = Math.max(0, Math.min(ch, opts.cheerCap - s.cheer));
    s.cookies += ck; s.cheer += ch; s.made[i] += made;
    s.stats.toys += made; s.stats.cookies += ck; s.pile += made;
    fillPile(s, i);
    res.cookies = ck; res.cheer = ch;
    if (firstPhoneNow) s.phoneTask = false;
  }
  s.progress[i] = p;
  while (s.rank < RANKS.length && s.cheer >= RANKS[s.rank].cheer) {
    s.rank++;
    res.promotions.push(s.rank);
    if (!opts.away) s.toy = s.rank - 1;
    if (s.rank === RANKS.length) s.phoneTask = true;
  }
  return res;
}

/** One economy step of dt seconds of helpers (no taps). */
export const crewStep = (s, dt, rush = false) => addWork(s, 0, crewWps(s, rush) * dt);

/**
 * Time away (page hidden or game closed). Full speed under 10 minutes, half
 * after, at most 4 hours. All cookies kept; cheer capped just below the rank
 * after next. Never finishes the first Smartphone. Doesn't switch toys.
 */
export function away(s, seconds) {
  seconds = Math.max(0, seconds);
  const long = seconds >= AWAY_FULL;
  const eff = long ? Math.min(seconds, AWAY_MAX) * 0.5 : seconds;
  const next2 = s.rank + 1 < RANKS.length ? RANKS[s.rank + 1].cheer - 1 : null;
  const before = { cookies: s.cookies, made: s.made[s.toy] };
  const r = addWork(s, 0, crewWps(s) * eff, { away: true, cheerCap: next2 });
  return { seconds, effective: eff, long, toy: s.toy, made: s.made[s.toy] - before.made, cookies: s.cookies - before.cookies, promotions: r.promotions };
}

/** The pile under the tree: 40 drawn spots, spot n filling at 2^(n/4) toys made. */
export const PILE_SLOTS = 40;
export const pileSpots = (pile) => { let n = 0; while (n < PILE_SLOTS && pile >= 2 ** ((n + 1) / 4)) n++; return n; };
/** How many spots each kind of toy should have: shares by the cheer it has earned, at least one each. */
function pileTargets(s, n) {
  const w = TOYS.map((t, i) => s.made[i] * t.cheer), total = w.reduce((a, b) => a + b, 0) || 1;
  return w.map((x, i) => (s.made[i] > 0 ? Math.max(1, (x / total) * n) : 0));
}
/**
 * The pile under the tree shows the toys you made. A new spot shows the toy that filled it;
 * after that, a toy that has less than its share can take over one spot from the toy with the most
 * over its share, so newer toys show up and every kind you've made keeps a place.
 */
export function fillPile(s, toy) {
  const n = pileSpots(s.pile);
  while (s.pileToys.length < n) s.pileToys.push(toy);
  if (n < 4) return;
  const tgt = pileTargets(s, n), cur = TOYS.map(() => 0);
  for (const t of s.pileToys) cur[t]++;
  if (cur[toy] + 0.5 > tgt[toy]) return;
  let worst = -1, over = 0.5;
  for (let k = 0; k < TOYS.length; k++) if (k !== toy && cur[k] - tgt[k] > over && cur[k] > 1) { over = cur[k] - tgt[k]; worst = k; }
  if (worst < 0) return;
  const spots = []; s.pileToys.forEach((t, i) => t === worst && spots.push(i));
  s.pileToys[spots[(s.stats.toys * 7) % spots.length]] = toy;
}
/** For a save from before toys were remembered: share the spots out, mixed through the heap. */
export function derivePile(s) {
  const n = pileSpots(s.pile);
  if (s.pileToys.length >= n) { s.pileToys.length = n; return; }
  const tgt = pileTargets(s, n), counts = tgt.map((x) => Math.floor(x));
  let left = n - counts.reduce((a, b) => a + b, 0);
  const frac = tgt.map((x, i) => [x - Math.floor(x), i]).sort((a, b) => b[0] - a[0]);
  for (let k = 0; left > 0 && k < frac.length; k++) if (tgt[frac[k][1]] > 0) { counts[frac[k][1]]++; left--; }
  while (left > 0) { counts[0]++; left--; }
  while (counts.reduce((a, b) => a + b, 0) > n) counts[counts.indexOf(Math.max(...counts))]--;
  const list = []; counts.forEach((c, i) => { for (let k = 0; k < c; k++) list.push(i); });
  const out = Array(n);
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const step = [17, 13, 11, 7, 5, 3, 1].find((x) => gcd(x, n) === 1);
  list.forEach((t, k) => { out[(k * step) % n] = t; });
  for (let k = 0; k < n; k++) if (out[k] == null) out[k] = list[k % list.length] ?? 0;
  s.pileToys = out;
}

/** Cheer-bar fraction toward the next rank (1 at the top). */
export function cheerFrac(s) {
  if (s.rank >= RANKS.length) return 1;
  const a = RANKS[s.rank - 1].cheer, b = RANKS[s.rank].cheer;
  return Math.max(0, Math.min(1, (s.cheer - a) / (b - a)));
}

/** "12.4K", "3.2M". */
export function format(n) {
  n = Math.floor(n);
  if (n < 10000) return n.toLocaleString('en-US');
  const units = [['T', 1e12], ['B', 1e9], ['M', 1e6], ['K', 1e3]];
  for (const [u, v] of units) if (n >= v) {
    const x = n / v;
    return (x >= 100 ? Math.floor(x) : Math.floor(x * 10) / 10) + u;
  }
  return String(n);
}
/** Tally plates: 4 digits zero-padded, then short form. */
export const tally = (n) => (n <= 9999 ? String(Math.floor(n)).padStart(4, '0') : format(n));

/** A small seeded random number generator (for stars). */
export function rng(seed) {
  let a = seed >>> 0 || 1;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/** Check and repair a loaded save. */
export function migrate(raw) {
  const s = newState();
  if (!raw || typeof raw !== 'object') throw new Error('bad save');
  if (typeof raw.version !== 'number' || raw.version > SAVE_VERSION) throw new Error('unknown save version');
  for (const k of Object.keys(s)) if (k in raw) s[k] = raw[k];
  const num = (x, d = 0) => (Number.isFinite(x) && x >= 0 ? x : d);
  s.cookies = num(s.cookies); s.cheer = num(s.cheer);
  s.rank = Math.max(1, Math.min(RANKS.length, Math.floor(num(s.rank, 1))));
  s.toy = Math.max(0, Math.min(s.rank - 1, Math.floor(num(s.toy))));
  s.progress = TOYS.map((_, i) => num(raw.progress?.[i]));
  s.made = TOYS.map((_, i) => num(raw.made?.[i]));
  s.helpers = HELPERS.map((_, i) => Math.floor(num(raw.helpers?.[i])));
  s.hammer = Math.max(0, Math.min(HAMMERS.length - 1, Math.floor(num(s.hammer))));
  s.upgrades = typeof raw.upgrades === 'object' && raw.upgrades ? { ...raw.upgrades } : {};
  s.stats = { ...newState().stats, ...(raw.stats || {}) };
  s.settings = { ...newState().settings, ...(raw.settings || {}) };
  s.pile = num(s.pile);
  s.pileToys = Array.isArray(raw.pileToys) ? raw.pileToys.filter((t) => Number.isInteger(t) && t >= 0 && t < TOYS.length).slice(0, PILE_SLOTS) : [];
  derivePile(s);
  return s;
}
