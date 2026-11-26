// Xmas Clicker: the game. Screens, the loop, input, the shop, cards and the finale.
const SIDE = '(orientation: landscape) and (max-height: 500px), (orientation: landscape) and (max-width: 899px)';
import * as R from './rules.js';
import { TOYS, RANKS, HAMMERS, HELPERS, UPGRADES, format, tally } from './rules.js';
import * as Bench from './bench.js';
import * as Audio from './audio.js';
import * as Save from './state.js';

const $ = (id) => document.getElementById(id);
const DEBUG = new URLSearchParams(location.search).has('debug');

// ---------- State ----------
let loaded = Save.load();
let S = loaded.state;
let screen = 'title';          // title | howto | workshop
let paused = false;
let rushLeft = 0;              // seconds of Star Rush left
let star = null;               // { t: seconds shown } while a star drifts
let nextStarIn = null;         // seconds of active time until the next star
let starRand = R.rng(Date.now() & 0xffff);
let cards = [];                // queue: { type: 'welcome'|'promotion'|'eve', ... }
let card = null;               // the open card
let cardOpenedAt = 0;
let eve = null;                // { phase, start } during the finale
let levelStart = S.rank;       // for the debug hook's levelComplete
let eveStarted = false;
let dispCookies = S.cookies;
let lastSave = 0;
const frameLog = [];
const PLURAL = { Chess: 'Chess sets' };
const plural = (name, n) => (n === 1 ? name : PLURAL[name] || name + 's');

// ---------- Screens ----------
function show(name) {
  screen = name;
  $('title').hidden = name !== 'title';
  $('howto').hidden = name !== 'howto';
  $('game').hidden = name !== 'workshop';
  if (name === 'workshop') { layout(); refreshAll(); }
}
$('btn-start').textContent = S.started ? 'Keep building' : 'Start building';
$('btn-start').addEventListener('click', () => { Audio.unlock(); click(); startGame(); });
$('btn-howto').addEventListener('click', () => { Audio.unlock(); click(); show('howto'); $('btn-howto-back').focus(); });
$('btn-howto-back').addEventListener('click', () => { click(); show('title'); });
const click = () => Audio.play('ui-click');

function startGame() {
  S.started = true;
  show('workshop');
  Audio.playMusic('workshop');
  for (const t of Object.keys(tabSeen)) tabSeen[t] = tabNow(t);
  setTab(S.helpers[0] > 0 ? 'helpers' : 'toys', true);
  // Credit time away since the last save.
  if (S.leftAt) creditAway((Date.now() - S.leftAt) / 1000);
  S.leftAt = 0;
  if (S.phoneDone && !S.eveSeen && !cards.some((c) => c.type === 'eve')) cards.push({ type: 'eve' });
  if (loaded.broken) { loaded.broken = false; setTimeout(() => toast('Your old save couldn\'t be read, so a fresh workshop is ready.', 3500), 400); }
  lastTick = performance.now();
  doSave();
  nextCard();
}

// ---------- The shelf and the shop (built once; updated only when their state changes) ----------
const shelfCards = [], shopItems = [];
function buildUI() {
  const shelf = $('shelf');
  TOYS.forEach((t, i) => {
    const b = document.createElement('button');
    b.className = 'toy-card';
    b.innerHTML = `<span class="key">${(i + 1) % 10}</span><img class="toy" src="assets/items/${t.id}.webp" alt=""><img class="lock" src="assets/ui/lock.webp" alt=""><span class="tname"></span><span class="tprog"><i></i></span><span class="plate">0000</span>`;
    b.addEventListener('click', () => { pickToy(i, b); b.blur(); });
    shelf.appendChild(b);
    shelfCards.push({ el: b, name: b.querySelector('.tname'), prog: b.querySelector('.tprog i'), plate: b.querySelector('.plate'), key: '' });
  });
  const add = (kind, i, list, img, name) => {
    const b = document.createElement('button');
    b.className = 'item';
    b.innerHTML = `<img src="assets/${img}.webp" alt=""><span><span class="iname">${name}</span><span class="ieff"></span></span><span class="price"></span>`;
    b.addEventListener('click', () => { buyItem(kind, i, b); b.blur(); });
    $(list).appendChild(b);
    shopItems.push({ kind, i, el: b, eff: b.querySelector('.ieff'), price: b.querySelector('.price'), key: '' });
  };
  HELPERS.forEach((h, i) => add('helper', i, 'list-helpers', 'sprites/' + h.img, h.name));
  HAMMERS.forEach((h, i) => add('hammer', i, 'list-hammers', 'items/' + h.id, h.name));
  UPGRADES.forEach((u, i) => add('upgrade', i, 'list-upgrades', 'ui/' + u.img, u.name));
  document.querySelectorAll('#tabbar button').forEach((b) => b.addEventListener('click', () => { click(); setTab(b.dataset.tab); }));
  for (const id of ['btn-sound']) $(id).addEventListener('click', (e) => { Audio.unlock(); toggleMute(); e.currentTarget.blur(); });
  for (const id of ['btn-pause']) $(id).addEventListener('click', (e) => { Audio.unlock(); click(); openPause(); e.currentTarget.blur(); });
}

function pickToy(i, el) {
  Audio.unlock();
  if (!R.toyUnlocked(S, i)) {
    Audio.play('nope');
    shake(el || shelfCards[i].el);
    toast(`${TOYS[i].name} unlocks at ${RANKS[i].title}`);
    return;
  }
  if (S.toy !== i) { S.toy = i; click(); refreshAll(); }
}

function buyItem(kind, i, el) {
  Audio.unlock();
  if (cardBlocking()) return;
  const r = R.buy(S, kind, i);
  if (!r.ok) {
    if (r.reason === 'owned') return;
    Audio.play('nope'); shake(el);
    if (r.reason === 'cookies') toast(`Needs ${format(r.cost)} cookies`);
    else if (r.reason === 'full') { const m = R.moreElvesAt(S); toast(m ? `Workshop full: more elves at ${RANKS[m - 1].title}` : 'Workshop full'); }
    else if (r.reason === 'locked') toast(`Unlocks at ${RANKS[itemRank(kind, i) - 1].title}`);
    return;
  }
  Audio.play('purchase');
  if (kind === 'helper') { Audio.play('elf-hired'); if (i === 0 && !S.firstElf) S.firstElf = true; }
  el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
  refreshAll();
  doSave();
}
const itemRank = (kind, i) => (kind === 'hammer' ? HAMMERS[i] : kind === 'helper' ? HELPERS[i] : UPGRADES[i]).rank;
function shake(el) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }

// ---------- Tabs (phones) ----------
const tabSeen = { toys: new Set(), hammers: new Set(), helpers: new Set(), upgrades: new Set() };
function setTab(t, quiet) {
  S.tab = t;
  $('game').dataset.tab = t;
  document.querySelectorAll('#tabbar button').forEach((b) => b.classList.toggle('on', b.dataset.tab === t));
  tabSeen[t] = tabNow(t);
  document.querySelector(`#tabbar button[data-tab="${t}"]`)?.classList.remove('dot');
  if (!quiet) { $('shelf').scrollTop = 0; $('shop').scrollTop = 0; }
}
function tabNow(t) {
  const set = new Set();
  if (t === 'toys') { for (let i = 0; i < S.rank; i++) set.add('t' + i); return set; }
  const kind = { hammers: 'hammer', helpers: 'helper', upgrades: 'upgrade' }[t];
  for (const it of shopItems) if (it.kind === kind) {
    const x = R.shopItem(S, kind, it.i);
    if (x.unlocked) set.add(it.i + 'u');
    if (x.canBuy && S.cookies >= x.cost) set.add(it.i + 'a');
  }
  return set;
}
function updateDots() {
  for (const t of Object.keys(tabSeen)) {
    if (t === S.tab) { tabSeen[t] = tabNow(t); continue; }
    const now = tabNow(t);
    let fresh = false;
    for (const k of now) if (!tabSeen[t].has(k)) { fresh = true; break; }
    const b = document.querySelector(`#tabbar button[data-tab="${t}"]`);
    if (b && b.classList.contains('dot') !== fresh) b.classList.toggle('dot', fresh);
  }
}

// ---------- Refresh the HTML (only what changed) ----------
let lastTop = '';
function refreshAll() { lastTop = ''; shelfCards.forEach((c) => (c.key = '')); shopItems.forEach((c) => (c.key = '')); refresh(); }
function refresh() {
  const rush = rushLeft > 0;
  // Top bar
  const top = [S.rank, Math.floor(dispCookies), Math.floor(S.cheer), R.tapWork(S, rush), R.crewWps(S, rush)].join('|');
  if (top !== lastTop) {
    lastTop = top;
    const title = RANKS[S.rank - 1].title;
    const rt = $('rank-title');
    if (rt.textContent !== title) { rt.textContent = title; fitTitle(); }
    $('cookie-count').textContent = format(dispCookies);
    $('cheer-fill').style.width = (R.cheerFrac(S) * 100).toFixed(1) + '%';
    const nx = R.nextRankCheer(S);
    $('cheer-label').textContent = nx == null ? `Top rank · ${format(S.cheer)}` : `${format(S.cheer)} / ${format(nx)}`;
    $('cheer-bar').classList.toggle('top', nx == null);
    $('rates').textContent = `${format(R.tapWork(S, rush))}/tap · ${format(R.crewWps(S, rush))}/s`;
  }
  // Toy strip
  const toy = TOYS[S.toy];
  if ($('toy-name').textContent !== toy.name) $('toy-name').textContent = toy.name;
  $('work-fill').style.width = Math.min(100, (S.progress[S.toy] / toy.work) * 100).toFixed(2) + '%';
  const gold = R.isFirstPhone(S) && S.progress[9] >= R.PHONE_CAP * toy.work - 1e-6;
  $('work-bar').classList.toggle('gold', gold);
  // Shelf
  shelfCards.forEach((c, i) => {
    const unlocked = R.toyUnlocked(S, i);
    const key = [unlocked, S.toy === i, Math.floor(S.made[i]), Math.round((S.progress[i] / TOYS[i].work) * 50)].join('|');
    if (key === c.key) return;
    c.key = key;
    c.el.classList.toggle('locked', !unlocked);
    c.el.classList.toggle('sel', S.toy === i);
    c.name.textContent = unlocked ? TOYS[i].name : 'Locked';
    c.prog.style.width = Math.min(100, (S.progress[i] / TOYS[i].work) * 100) + '%';
    c.plate.textContent = tally(S.made[i]);
    c.plate.classList.toggle('gold', S.made[i] >= 100 && S.eveSeen);
    c.el.setAttribute('aria-label', unlocked ? `${TOYS[i].name}, ${Math.floor(S.made[i])} made` : `Locked: unlocks at ${RANKS[i].title}`);
  });
  // Shop
  const firstLocked = {};
  const best = bestBuy();
  for (const it of shopItems) {
    const x = R.shopItem(S, it.kind, it.i);
    let vis = x.unlocked;
    if (!x.unlocked && !firstLocked[it.kind]) { firstLocked[it.kind] = true; vis = true; }
    const afford = S.cookies >= x.cost;
    const glow = it.kind === 'helper' && it.i === 0 && S.helpers[0] === 0 && S.cookies >= 15;
    let eff = '';
    if (it.kind === 'helper') {
      const n = S.helpers[it.i], cap = it.i === 0 ? R.elfCap(S) : Infinity;
      if (x.full) {
        const r = R.moreElvesAt(S);
        eff = `${n}\u00a0hired · Workshop full` + (r ? `: more elves at ${RANKS[r - 1].title}` : '');
      } else {
        eff = `+${format(R.helperWps(S, it.i))}\u00a0work/s\u00a0each` + (cap < Infinity ? ` · ${n}\u00a0of\u00a0${cap}\u00a0hired` : n ? ` · ${n}\u00a0hired` : '');
      }
    }
    else if (it.kind === 'hammer') {
      const w = R.hammerWork(S, false, it.i);
      eff = it.i <= S.hammer ? `${format(w)} per tap` : `+${format(w - R.hammerWork(S))} per tap`;
    } else {
      eff = UPGRADES[it.i].effect;
      const id = UPGRADES[it.i].id;
      if (!x.owned && x.unlocked) {
        const add = id === 'cocoa' ? R.hammerWork(S) * 0.5 : id === 'conveyor' ? S.helpers[1] * R.helperWps(S, 1) : id === 'wrap' ? 0 : S.helpers[0] * R.helperWps(S, 0);
        const f = add < 10 ? String(Math.round(add * 10) / 10) : format(add);
        if (add > 0) eff += id === 'cocoa' ? ` (+${f} per tap)` : ` (+${f} work/s)`;
      }
    }
    if (!x.unlocked) eff = `Unlocks at ${RANKS[itemRank(it.kind, it.i) - 1].title}`;
    const state = !x.unlocked ? 'locked' : x.owned ? 'owned' : x.full ? 'full' : afford ? 'ok' : 'cant';
    const priceKey = state === 'full' ? 'full' : state === 'owned' ? (it.kind === 'hammer' && it.i === S.hammer ? 'eq' : 'own') : x.cost;
    const isBest = !glow && best === it.kind + it.i && x.unlocked && !x.owned;
    const key = [vis, state, priceKey, eff, glow, isBest, afford].join('|');
    if (key === it.key) continue;
    it.key = key;
    it.el.hidden = !vis;
    it.el.className = 'item ' + state + (glow ? ' glow' : '') + (isBest ? ' best' : '');
    it.eff.textContent = eff;
    if (state === 'locked') it.price.textContent = 'Locked';
    else if (state === 'full') it.price.textContent = 'Full';
    else if (state === 'owned') it.price.innerHTML = it.kind === 'hammer' && it.i === S.hammer ? '<span class="tag">In hand</span>' : '<svg><use href="#i-check"/></svg>';
    else it.price.innerHTML = `<img src="assets/ui/cookie.webp" alt="">${format(x.cost)}`;
    it.el.querySelector('.callout')?.remove();
    if (glow) it.el.insertAdjacentHTML('beforeend', '<span class="callout">Hire your first elf!</span>');
    else if (isBest) it.el.insertAdjacentHTML('beforeend', `<span class="callout">${afford ? 'Best buy!' : 'Best value'}</span>`);
    it.el.setAttribute('aria-label', `${it.el.querySelector('.iname').textContent}: ${eff}. ${state === 'locked' ? 'Locked' : state === 'full' ? 'Full' : state === 'owned' ? 'Owned' : format(x.cost) + ' cookies'}`);
  }
  const elfGlow = S.helpers[0] === 0 && S.cookies >= 15 && S.tab !== 'helpers';
  document.querySelector('#tabbar button[data-tab="helpers"]')?.classList.toggle('glow', elfGlow);
  updateDots();
  // Banner and hint
  let banner = '';
  if (R.isFirstPhone(S, 9) && !eve) banner = gold && S.toy === 9 ? 'You add the finishing touches: tap!' : 'Build a Smartphone before the sleigh leaves!';
  const bn = $('banner');
  if (bn.textContent !== banner) bn.textContent = banner;
  bn.hidden = !banner;
  bn.classList.toggle('gold', !!gold && S.toy === 9);
  $('tap-hint').hidden = S.stats.toys > 0 || !!eve;
  // Rush ring
  $('rush-ring').hidden = !rush;
  if (rush) $('rush-arc').style.strokeDashoffset = String(100.5 * (1 - rushLeft / R.RUSH_SECONDS));
}
/** The shop item that adds the most per cookie (for a player tapping 3 times a second), once it's half affordable. */
function bestBuy() {
  const rate = () => { const t = TOYS[S.toy]; return (t.cookies / t.work) * R.cookieMul(S); };
  const inc = (x) => (R.tapWork(x) * 3 + R.crewWps(x)) * rate();
  const base = inc(S);
  let pick = null, v = 0;
  const tryIt = (kind, i) => {
    const it = R.shopItem(S, kind, i);
    if (!it.canBuy || !it.cost) return;
    const c = { ...S, helpers: S.helpers.slice(), upgrades: { ...S.upgrades }, cookies: 1e18 };
    R.buy(c, kind, i);
    const gain = kind === 'upgrade' && UPGRADES[i].id === 'wrap' ? base * 0.25 : inc(c) - base;
    if (gain > 0 && gain / it.cost > v) { v = gain / it.cost; pick = { k: kind + i, cost: it.cost }; }
  };
  HELPERS.forEach((_, i) => tryIt('helper', i)); HAMMERS.forEach((_, i) => tryIt('hammer', i)); UPGRADES.forEach((_, i) => tryIt('upgrade', i));
  return pick && S.cookies >= pick.cost * 0.5 ? pick.k : null;
}
function fitTitle() {
  const el = $('rank-title');
  el.style.fontSize = '';
  const max = parseFloat(getComputedStyle(el).fontSize);
  let fs = max;
  const short = matchMedia(SIDE).matches;
  if (short) return; // wraps to two lines there
  while (el.scrollWidth > el.clientWidth + 1 && fs > 14) { fs -= 1; el.style.fontSize = fs + 'px'; }
}

// ---------- Toasts ----------
function toast(text, ms = 1800) {
  const box = $('toasts');
  while (box.children.length >= 2) box.firstChild.remove();
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = text;
  box.appendChild(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 450); }, ms);
}

// ---------- Tapping ----------
const held = new Set();
function tap() {
  if (screen !== 'workshop' || cardBlocking() || eve) return;
  Audio.unlock();
  const rush = rushLeft > 0;
  const w = R.tapWork(S, rush);
  S.stats.taps++;
  const res = R.addWork(S, w, 0);
  const heavy = S.hammer >= 2;
  if (heavy) Audio.play('tap-heavy', { rate: 0.95 + Math.random() * 0.1 });
  else Audio.play('tap-' + (1 + Math.floor(Math.random() * 3)), { rate: 0.92 + Math.random() * 0.16 });
  const gold = R.isFirstPhone(S, 9) && S.toy === 9 && S.progress[9] >= R.PHONE_CAP * TOYS[9].work - 1e-6;
  Bench.tapFx(format(w), { gold: gold || rush, heavy: S.hammer === 3 });
  handle(res);
}
function handle(res, away = false) {
  if (res.made) {
    Bench.toyDone(res.made, res.toy);
    if (res.made > 1) Audio.play('toy-done', { rate: 1.25 }) || 0;
    else Audio.play('toy-done');
    Audio.play('present-whoosh');
    Audio.play('cookie-clink');
    if (res.made > 1) Bench.floater('×' + res.made, { big: true });
  }
  for (const r of res.promotions) {
    cards.push({ type: 'promotion', rank: r, away });
    doSaveSoon();
  }
  if (res.phoneDone) cards.push({ type: 'eve' });
  if (res.promotions.length || res.phoneDone) nextCard();
}

// ---------- Cards ----------
const SANTA = [
  '',
  '',
  'Ho ho ho! Look at all those tractors. You\'re no assistant junior anything anymore!',
  'The whole North Pole is talking about you. Time to try something trickier!',
  'Pretty good! I\'d say "very good", but let\'s not get ahead of ourselves. Watch the window for shooting stars!',
  'Crafty indeed! The gingerbread engineers built you a Toy Machine.',
  'A master already! Here\'s a hammer worthy of your talents.',
  'The reindeer asked to work with you. They never ask to work with anyone!',
  'The Thunder Mallet has chosen you. Mind the sparks!',
  'Mrs. Claus says you\'re officer material, and so do I!',
  'Chief Toy Officer! The whole workshop is yours. Build the last toy before the sleigh leaves!',
];
const cardBlocking = () => !!card || !!eve;
function nextCard() {
  if (card || eve || screen !== 'workshop' || paused) return;
  // Order: Welcome back, then Promotion, then Christmas Eve.
  const order = { welcome: 0, promotion: 1, eve: 2 };
  cards.sort((a, b) => order[a.type] - order[b.type] || (a.rank || 0) - (b.rank || 0));
  const c = cards.shift();
  if (!c) return;
  if (c.type === 'eve') return startEve();
  card = c;
  cardOpenedAt = performance.now();
  const body = $('card-body');
  const btn = $('card-btn');
  if (c.type === 'promotion') {
    const r = c.rank, toy = TOYS[r - 1];
    const unl = [`<figure><img src="assets/items/${toy.id}.webp" alt="">${toy.name}</figure>`];
    HAMMERS.forEach((h) => h.rank === r && h.cost > 0 && unl.push(`<figure><img src="assets/items/${h.id}.webp" alt="">${h.name}</figure>`));
    HELPERS.forEach((h) => h.rank === r && unl.push(`<figure><img src="assets/sprites/${h.img}.webp" alt="">${h.name}</figure>`));
    UPGRADES.forEach((u) => u.rank === r && unl.push(`<figure><img src="assets/ui/${u.img}.webp" alt="">${u.name}</figure>`));
    const cap = R.ELF_CAP[r - 1], was = R.ELF_CAP[r - 2];
    if (r >= 2 && cap > was) unl.push(`<figure><img src="assets/sprites/elf-helper.webp" alt="">${cap === Infinity ? 'No limit on elves' : `Room for ${cap} elves`}</figure>`);
    if (r === 4) unl.push('<figure><img src="assets/items/shooting-star.webp" alt="" style="width:80px">Shooting stars</figure>');
    body.innerHTML = `<div class="say"><img src="assets/ui/santa-portrait.webp" alt="Santa"><p>${SANTA[r]}</p></div>
      <h2 id="card-title">You're now</h2><div class="newtitle">${RANKS[r - 1].title}</div>
      <div class="unlocks">${unl.join('')}</div>
      <p class="now">${c.away ? `New toy: ${toy.name}` : `Now building: ${toy.name}`}</p>`;
    btn.textContent = 'Back to work!';
    Audio.play('promotion');
    setTimeout(() => Audio.play('santa-hohoho'), 450);
    confetti();
  } else if (c.type === 'welcome') {
    const toy = TOYS[c.toy];
    body.innerHTML = `<h2 id="card-title">Welcome back!</h2><img class="away-toy" src="assets/items/${toy.id}.webp" alt="">
      <p>While you were away, your elves made <b>${format(c.made)}\u00a0${plural(toy.name, c.made)}</b> (+${format(c.cookies)} cookies).</p>`;
    btn.textContent = 'Back to work!';
    Audio.play('cookie-clink');
  }
  $('card-layer').hidden = false;
  $('card-layer').scrollTop = 0;
  btn.classList.add('guard');
  setTimeout(() => btn.classList.remove('guard'), 1000);
  btn.focus({ preventScroll: true });
  refreshAll();
}
function closeCard() {
  if (!card || performance.now() - cardOpenedAt < 1000) return;
  click();
  const was = card;
  card = null;
  $('card-layer').hidden = true;
  stopConfetti();
  if (was.type === 'promotion' && was.rank >= 2) refreshAll();
  if (was.type === 'promotion') { Bench.shakeGlobe(); Audio.play('globe-shake'); }
  if (was.type === 'eve') endEve();
  doSave();
  nextCard();
}
$('card-btn').addEventListener('click', closeCard);

// Confetti on the card layer
let confettiParts = [], confettiUntil = 0;
function confetti() {
  const cv = $('confetti'), g = cv.getContext('2d');
  cv.width = innerWidth; cv.height = innerHeight;
  const cols = ['#9e2a2b', '#2f5d3a', '#f2c766', '#f6ead2', '#d9a441', '#e0393a'];
  confettiParts = Array.from({ length: 90 }, () => ({ x: Math.random() * cv.width, y: -20 - Math.random() * cv.height * 0.5, vx: (Math.random() - 0.5) * 2, vy: 2 + Math.random() * 3, r: Math.random() * 6, c: cols[Math.floor(Math.random() * cols.length)], s: 5 + Math.random() * 6 }));
  confettiUntil = performance.now() + 3500;
  const step = () => {
    if (performance.now() > confettiUntil || !card) { g.clearRect(0, 0, cv.width, cv.height); return; }
    g.clearRect(0, 0, cv.width, cv.height);
    for (const p of confettiParts) {
      p.x += p.vx; p.y += p.vy; p.r += 0.1;
      g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.c; g.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); g.restore();
    }
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
function stopConfetti() { confettiUntil = 0; }

// ---------- Christmas Eve ----------
const EVE = { lights: 5.6, lift: 3.4, sky: 6.5 };
function startEve() {
  eveStarted = true;
  $('game').classList.add('eve-on');
  eve = { phase: 'lights', start: performance.now() };
  star = null; rushLeft = 0; Audio.rush(false);
  Audio.playEveMusic();
  $('tap-hint').hidden = true; $('banner').hidden = true;
  refreshAll();
}
function eveTick(now) {
  const t = (now - eve.start) / 1000;
  if (eve.phase === 'lights' && t > EVE.lights) { eve = { phase: 'lift', start: now }; Audio.play('present-whoosh'); }
  else if (eve.phase === 'lift' && t > EVE.lift) { eve = { phase: 'sky', start: now }; Audio.play('eve-sleigh'); }
  else if (eve.phase === 'sky' && t > EVE.sky) { eve = { phase: 'card', start: now }; showEveCard(); }
}
function showEveCard() {
  S.eveSeen = true;
  card = { type: 'eve' };
  cardOpenedAt = performance.now();
  const st = S.stats;
  $('card-body').innerHTML = `<h2 id="card-title">Merry Christmas, Chief Toy Officer!</h2>
    <p>The sleigh is loaded and on its way. Every toy you built is going to a home tonight.</p>
    <dl class="stats">${statsHTML()}</dl>
    <p class="credit-line">Made by Rich Conlan, from the 2017 Xmas Clicker and Sean Dailey's elf prototype. Made with gamegen.</p>`;
  $('card').classList.add('eve-card');
  $('card-btn').textContent = 'Keep building';
  $('card-layer').hidden = false;
  $('card-btn').classList.add('guard');
  setTimeout(() => $('card-btn').classList.remove('guard'), 1000);
  confetti();
  doSave();
}
function endEve() {
  eve = null;
  $('game').classList.remove('eve-on');
  $('card').classList.remove('eve-card');
  S.pile = 0;
  S.pileToys = [];
  S.eveSeen = true;
  refreshAll();
}
function statsHTML() {
  const st = S.stats, m = Math.floor(st.played / 60);
  return `<dt>Toys made</dt><dd>${format(st.toys)}</dd><dt>Hammer taps</dt><dd>${format(st.taps)}</dd>
    <dt>Cookies earned</dt><dd>${format(st.cookies)}</dd><dt>Shooting stars caught</dt><dd>${format(st.stars)}</dd>
    <dt>Time in the workshop</dt><dd>${m < 60 ? m + ' min' : Math.floor(m / 60) + ' h ' + (m % 60) + ' min'}</dd>`;
}

// ---------- Pause and settings ----------
function openPause() {
  // Cards and the finale already freeze the workshop; pause never stacks on them.
  if (screen !== 'workshop' || paused || card || eve) return;
  paused = true;
  window.gameReport?.snapshot();
  $('stats').innerHTML = statsHTML();
  $('btn-report').hidden = !window.gameReport?.shown?.();
  $('credits').hidden = true;
  resetArm = 0; $('btn-reset').textContent = 'Reset progress';
  syncToggles();
  $('pause').hidden = false;
  Audio.setDuck(true);
  $('btn-resume').focus({ preventScroll: true });
}
function closePause() {
  if (!paused) return;
  paused = false;
  $('pause').hidden = true;
  Audio.setDuck(false);
  window.gameReport?.resumed();
  nextCard();
}
$('btn-resume').addEventListener('click', () => { click(); closePause(); });
$('btn-credits').addEventListener('click', () => { click(); $('credits').hidden = false; $('btn-credits-close').focus(); });
$('btn-credits-close').addEventListener('click', () => { click(); $('credits').hidden = true; $('btn-credits').focus(); });
$('btn-report').addEventListener('click', () => { click(); window.gameReport?.open(); });
$('tg-music').addEventListener('click', () => { S.settings.music = !S.settings.music; syncToggles(); click(); doSave(); });
$('tg-sfx').addEventListener('click', () => { S.settings.sfx = !S.settings.sfx; syncToggles(); click(); doSave(); });
let resetArm = 0;
$('btn-reset').addEventListener('click', () => {
  click();
  resetArm++;
  if (resetArm === 1) $('btn-reset').textContent = 'Reset everything? Press again';
  else if (resetArm === 2) $('btn-reset').textContent = 'Really? All progress is lost';
  else {
    Save.wipe();
    S = R.newState(); S.started = true;
    cards = []; card = null; eve = null; $('game').classList.remove('eve-on'); $('card-layer').hidden = true; $('card').classList.remove('eve-card'); stopConfetti(); rushLeft = 0; star = null; nextStarIn = null; levelStart = 1; eveStarted = false; dispCookies = 0;
    Audio.rush(false);
    closePause(); setTab('toys', true); refreshAll(); doSave();
  }
});
function syncToggles() {
  const m = S.settings.music, f = S.settings.sfx;
  $('tg-music').textContent = 'Music: ' + (m ? 'on' : 'off'); $('tg-music').setAttribute('aria-pressed', m);
  $('tg-sfx').textContent = 'Sound: ' + (f ? 'on' : 'off'); $('tg-sfx').setAttribute('aria-pressed', f);
  Audio.setSettings(S.settings);
  const icon = S.settings.muted ? '#i-mute' : '#i-sound';
  for (const id of ['btn-sound']) {
    const b = $(id); if (!b) continue;
    b.querySelector('use').setAttribute('href', icon);
    b.setAttribute('aria-label', S.settings.muted ? 'Unmute' : 'Mute');
  }
}
function toggleMute() { S.settings.muted = !S.settings.muted; syncToggles(); doSave(); }

// ---------- Input ----------
const stage = $('stage');
stage.addEventListener('pointerdown', (e) => {
  if (window.gameReport?.isOpen()) return;
  e.preventDefault();
  Audio.unlock();
  if (cardBlocking() || paused) return;
  const r = stage.getBoundingClientRect();
  if (star && Bench.hitStar(e.clientX - r.left, e.clientY - r.top, star.t / R.STAR_DRIFT)) return catchStar();
  tap();
});
stage.addEventListener('contextmenu', (e) => e.preventDefault());

window.addEventListener('keydown', (e) => {
  if (window.gameReport?.isOpen()) return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key;
  if (k === 'm' || k === 'M') { Audio.unlock(); toggleMute(); return; }
  if (screen !== 'workshop') {
    if (k === 'Escape' && screen === 'howto') show('title');
    return;
  }
  if (k === ' ' || k === 'Enter' || k === 'Spacebar') {
    if (paused) return; // the pause menu's buttons work with the keyboard
    e.preventDefault(); e.stopPropagation();
    if (!e.repeat && !held.has(k)) { held.add(k); tap(); }
    return;
  }
  if (k === 'Escape' || k === 'p' || k === 'P') {
    e.preventDefault();
    if (card) return closeCard();
    if (eve) return;
    if (paused) { if (k === 'Escape' && !$('credits').hidden) { $('credits').hidden = true; return; } return closePause(); }
    return openPause();
  }
  if (k === 'm' || k === 'M') { Audio.unlock(); toggleMute(); return; }
  if (/^[0-9]$/.test(k) && !paused && !cardBlocking()) {
    const i = k === '0' ? 9 : +k - 1;
    pickToy(i, shelfCards[i].el);
  }
}, true);
window.addEventListener('keyup', (e) => held.delete(e.key));
window.addEventListener('blur', () => held.clear());

// ---------- Stars and the Star Rush ----------
function scheduleStar() { nextStarIn = R.STAR_MIN + starRand() * (R.STAR_MAX - R.STAR_MIN); }
function catchStar() {
  star = null;
  S.stats.stars++;
  rushLeft = R.RUSH_SECONDS;
  Audio.play('star-catch');
  Audio.rush(true);
  toast('Star Rush! Hammer ×5, helpers ×2');
  scheduleStar();
}

// ---------- Away ----------
function creditAway(seconds) {
  if (seconds < 1 || !S.started) return;
  const a = R.away(S, seconds);
  if (a.promotions.length) for (const r of a.promotions) cards.push({ type: 'promotion', rank: r, away: true });
  if (a.long && a.made > 0) cards.push({ type: 'welcome', toy: a.toy, made: a.made, cookies: a.cookies });
  else if (a.cookies >= 1) toast(`+${format(a.cookies)} cookies while you were away`);
  dispCookies = S.cookies;
  refreshAll();
  nextCard();
}
let hiddenAt = 0;
document.addEventListener('visibilitychange', () => {
  // Away time only counts once the workshop is open; on the title the save's own leftAt waits for "Keep building".
  if (document.hidden) {
    Audio.suspend();
    if (eve) eve.hiddenAt = performance.now();
    if (screen !== 'workshop') return;
    hiddenAt = Date.now();
    S.leftAt = hiddenAt; doSave();
    openPause();
  } else {
    Audio.resume();
    if (eve && eve.hiddenAt) { eve.start += performance.now() - eve.hiddenAt; eve.hiddenAt = 0; }
    if (screen !== 'workshop') return;
    if (hiddenAt) creditAway((Date.now() - hiddenAt) / 1000);
    hiddenAt = 0; S.leftAt = 0;
    lastTick = performance.now();
  }
});
window.addEventListener('pagehide', () => { if (screen === 'workshop') { S.leftAt = Date.now(); doSave(); } });

// ---------- Saving ----------
function doSave() { if (S.started) { Save.save(S); lastSave = performance.now(); } }
let saveSoon = 0;
function doSaveSoon() { clearTimeout(saveSoon); saveSoon = setTimeout(doSave, 50); }

// ---------- The loop ----------
const STEP = 0.1;
let lastTick = performance.now(), acc = 0;
function economy(dt) {
  // Cards and the finale freeze the workshop.
  if (card || eve) return;
  const rush = rushLeft > 0;
  const res = R.crewStep(S, dt, rush);
  handle(res);
  S.stats.played += dt;
  if (paused) return; // helpers keep working; stars and the Rush wait
  if (rushLeft > 0) { rushLeft -= dt; if (rushLeft <= 0) { rushLeft = 0; Audio.rush(false); Audio.play('rush-end'); } }
  if (S.rank >= R.STAR_RANK) {
    if (star) { star.t += dt; if (star.t >= R.STAR_DRIFT) star = null; }
    else {
      if (nextStarIn == null) scheduleStar();
      nextStarIn -= dt;
      if (nextStarIn <= 0) { star = { t: 0 }; nextStarIn = R.STAR_DRIFT + R.STAR_MIN + starRand() * (R.STAR_MAX - R.STAR_MIN); Audio.play('star-appear'); }
    }
  }
}
function frame(now) {
  requestAnimationFrame(frame);
  if (screen === 'workshop') {
    let dt = (now - lastTick) / 1000;
    lastTick = now;
    if (dt > 5 && !document.hidden) { creditAway(dt); dt = 0; }
    acc += Math.min(dt, 1);
    while (acc >= STEP) { acc -= STEP; economy(STEP); }
    if (eve) eveTick(now);
    // Numbers count up.
    const d = S.cookies - dispCookies;
    dispCookies = Math.abs(d) < 1 ? S.cookies : dispCookies + d * Math.min(1, dt * 10 || 0.16);
    refresh();
    Audio.rush(rushLeft > 0 && !paused && !card && !eve);
    const et = eve ? (now - eve.start) / 1000 : 0;
    const lit = eve?.phase === 'lights' ? Math.max(0, Math.floor((et - 0.6) / 0.5) + 1) : S.eveSeen || eve ? 99 : 0;
    Bench.draw({
      toy: S.toy, hammer: S.hammer, helpers: S.helpers, pile: S.pile, pileToys: S.pileToys,
      strands: S.eveSeen || eve ? 9 : S.rank - 1, lightsLit: lit,
      starLit: S.eveSeen || (eve && (eve.phase !== 'lights' || et > 5.1)),
      star: star ? star.t / R.STAR_DRIFT : null, rush: rushLeft > 0,
      eve: eve ? { phase: eve.phase, t: eve.phase === 'lift' ? et / EVE.lift : et } : null,
    });
    if (now - lastSave > 10000) doSave();
  }
  logFrame(screenName());
}
function screenName() {
  if (screen !== 'workshop') return screen;
  if (eve) return 'eve-' + eve.phase;
  let n = 'workshop';
  if (card) n += '>' + card.type;
  if (paused) n += '>pause';
  if (window.gameReport?.isOpen?.()) n += '>report';
  return n;
}
function logFrame(name) {
  const last = frameLog[frameLog.length - 1];
  if (last && last[0] === name) last[1]++;
  else { frameLog.push([name, 1]); if (frameLog.length > 200) frameLog.shift(); }
}

// ---------- Layout ----------
function layout() {
  const short = matchMedia(SIDE).matches;
  const desk = matchMedia('(min-width: 900px) and (min-height: 501px)').matches;
  const wrap = document.querySelector('.stage-wrap');
  const col = document.querySelector('.stage-col');
  if (short) {
    const cs = getComputedStyle(document.documentElement);
    const insets = (parseFloat(cs.getPropertyValue('--sal')) || 0) + (parseFloat(cs.getPropertyValue('--sar')) || 0);
    const colW = innerWidth < 700 ? 280 : 240;
    const w = Math.floor(Math.min((innerHeight - 28) * 4 / 3, innerWidth - colW - insets));
    document.documentElement.style.setProperty('--stage-w', w + 'px');
    wrap.style.width = w + 'px';
  } else if (desk) {
    const r = col.getBoundingClientRect();
    const w = Math.floor(Math.min(r.width - 32, ((r.height - 32 - 36) * 4) / 3));
    wrap.style.width = w + 'px';
  } else {
    wrap.style.width = '';
  }
  Bench.resize();
  fitTitle();
}
addEventListener('resize', () => screen === 'workshop' && layout());
addEventListener('orientationchange', () => setTimeout(() => screen === 'workshop' && layout(), 200));

// ---------- Bug reports ----------
window.gameReport?.setup({
  game: 'Xmas Clicker', key: 'chief-toy-officer', visibility: 'on',
  state: () => window.__game.state(),
  pause: () => openPause(),
  grab: () => Bench.grab(),
  releaseAll: () => held.clear(),
});

// ---------- The debug hook ----------
let snapshots = null;
const getSnaps = async () => snapshots || (snapshots = await fetch('debug/snapshots.json').then((r) => r.json()));
window.__game = {
  state: () => ({
    screen: screenName(), level: S.rank, rank: S.rank, title: RANKS[S.rank - 1].title,
    cookies: Math.floor(S.cookies), cheer: Math.floor(S.cheer), toy: S.toy, toyName: TOYS[S.toy].name,
    progress: Math.floor(S.progress[S.toy]), made: S.made.slice(), helpers: S.helpers.slice(), hammer: S.hammer,
    upgrades: Object.keys(S.upgrades), rush: Math.round(rushLeft * 10) / 10, star: star ? Math.round(star.t * 10) / 10 : null,
    taps: S.stats.taps, paused, card: card?.type || null, queued: cards.length, pile: S.pile, pileToys: S.pileToys.length, phoneDone: S.phoneDone,
    levelComplete: S.rank > levelStart || (levelStart >= 10 && eveStarted), gameWon: S.eveSeen,
  }),
  frames: () => frameLog,
  levels: () => RANKS.length,
  audioState: () => Audio.state(),
  starPos: () => {
    if (!star) return null;
    const p = Bench.starPos(star.t / R.STAR_DRIFT), r = stage.getBoundingClientRect();
    return { x: r.left + (p.x / 100) * r.width, y: r.top + (p.y / 100) * r.height };
  },
  toyPos: () => { const p = Bench.toyTopCss(), r = stage.getBoundingClientRect(); return p && { x: r.left + p.x, y: r.top + p.y }; },
};
if (DEBUG) Object.assign(window.__game, {
  async goToLevel(n) {
    const snaps = await getSnaps();
    const snap = snaps[n];
    if (!snap) throw new Error('no snapshot for rank ' + n);
    S = R.migrate(JSON.parse(JSON.stringify(snap)));
    S.started = true; S.settings = { ...S.settings, ...{ music: true, sfx: true, muted: false } };
    cards = []; card = null; $('card-layer').hidden = true; eve = null; $('game').classList.remove('eve-on'); $('card').classList.remove('eve-card'); rushLeft = 0; star = null; nextStarIn = null; Audio.rush(false);
    levelStart = n; eveStarted = false; dispCookies = S.cookies;
    if (paused) closePause();
    if (screen !== 'workshop') startGame(); else refreshAll();
    for (const t of Object.keys(tabSeen)) tabSeen[t] = tabNow(t);
    setTab(S.helpers[0] > 0 ? 'helpers' : 'toys', true);
    return this.state();
  },
  addCookies(n) { S.cookies += n; dispCookies = S.cookies; refreshAll(); },
  addCheer(n) { handle(R.addWork(S, 0, 0)); S.cheer += n; handle(R.addWork(S, 0, 0)); refreshAll(); },
  setRank(i) { S.rank = Math.max(1, Math.min(10, i)); S.cheer = Math.max(S.cheer, RANKS[S.rank - 1].cheer); S.toy = S.rank - 1; refreshAll(); },
  tap(n = 1) { for (let i = 0; i < n; i++) tap(); },
  advance(seconds) { const n = Math.round(seconds / STEP); for (let i = 0; i < n; i++) economy(STEP); refreshAll(); },
  globe: () => Bench.globeState(),
  spawnStar() { if (S.rank >= R.STAR_RANK) { star = { t: 0 }; Audio.play('star-appear'); } },
  seedStars(seed) { starRand = R.rng(seed); nextStarIn = null; },
  setAway(seconds) { creditAway(seconds); },
});

// ---------- Start ----------
buildUI();
syncToggles();
Bench.init($('stage-canvas'));
document.fonts?.ready.then(() => fitTitle());
requestAnimationFrame(frame);
show('title');
// The title appears once, with its fonts and art ready.
{
  const art = matchMedia('(orientation: portrait)').matches ? 'assets/bg/title-art-phone.webp' : 'assets/bg/title-art.webp';
  const img = new Image(); img.src = art;
  const ready = Promise.all([
    document.fonts.load("700 40px 'Mountains of Christmas'"), document.fonts.load('800 16px Nunito'), document.fonts.load('900 16px Nunito'),
    img.decode().catch(() => {}),
  ]);
  Promise.race([ready, new Promise((r) => setTimeout(r, 6000))]).then(() => $('title').classList.remove('loading'));
}

// Offline play (not when running locally, unless ?sw).
const local = ['localhost', '127.0.0.1'].includes(location.hostname);
if ('serviceWorker' in navigator && (!local || new URLSearchParams(location.search).has('sw'))) {
  navigator.serviceWorker.register('sw.js');
}
