// Balance check for Tip Tap Toys, using the game's own rules (game/src/rules.js).
// node tools/balance.mjs            runs the standard players, the checks, and writes tools/snapshots/rank-<n>.json
// node tools/balance.mjs <taps/s> <catch 0..1>
// Time is active time with no card open (cards freeze the workshop).
import fs from 'node:fs';
import * as R from '../game/src/rules.js';
if (process.env.ELF_CAP) R.setElfCap(JSON.parse(process.env.ELF_CAP).map((x) => (x === null ? Infinity : x)));

export const TARGET = [0, 40, 120, 240, 390, 570, 780, 1020, 1260, 1560];

export function run(TPS, CATCH, { snapshots = false, elvesFirst = false } = {}) {
  const s = R.newState();
  const dt = 0.1;
  let t = 0, rush = 0, nextStar = null, starsSeen = 0, done = null, ctoT = null;
  let lastBuy = 0, gap = 0, gapAt = 0, allBy = 0, phoneTapAt = null;
  const rankT = [0], tapW = Array(11).fill(0), crewW = Array(11).fill(0), snaps = {};
  if (snapshots) snaps[1] = JSON.parse(JSON.stringify(s));
  const rate = () => { const toy = R.TOYS[s.toy]; return (toy.cookies / toy.work) * R.cookieMul(s); };
  const inc = (st) => (R.tapWork(st) * TPS + R.crewWps(st)) * rate();
  while (t < 5400 && done === null) {
    // Buy the item with the best gain per cookie, if affordable.
    const base = inc(s), opts = [];
    const tryItem = (kind, i) => {
      const it = R.shopItem(s, kind, i);
      if (!it.canBuy) return;
      const c = JSON.parse(JSON.stringify(s));
      c.cookies = 1e18; R.buy(c, kind, i);
      let g = inc(c) - base;
      if (kind === 'upgrade' && R.UPGRADES[i].id === 'wrap') g = base * 0.25;
      opts.push([kind, i, it.cost, g]);
    };
    R.HAMMERS.forEach((_, i) => tryItem('hammer', i));
    R.HELPERS.forEach((_, i) => tryItem('helper', i));
    R.UPGRADES.forEach((_, i) => tryItem('upgrade', i));
    opts.sort((a, b) => b[3] / b[2] - a[3] / a[2]);
    // An elves-first player buys an elf whenever one is allowed and affordable.
    const elf = opts.find((o) => o[0] === 'helper' && o[1] === 0);
    const b = elvesFirst && elf && s.cookies >= elf[2] ? elf : opts[0];
    if (b && b[3] > 0 && s.cookies >= b[2]) {
      R.buy(s, b[0], b[1]);
      if (t - lastBuy > gap) { gap = t - lastBuy; gapAt = t; }
      lastBuy = t;
      if (b[0] !== 'helper') allBy = t;
      continue;
    }
    if (s.rank >= R.STAR_RANK) {
      if (nextStar === null) nextStar = t + 90;
      if (t >= nextStar) {
        starsSeen++;
        const caught = CATCH >= 1 || (CATCH > 0 && starsSeen % Math.round(1 / CATCH) === 0);
        if (caught) rush = R.RUSH_SECONDS;
        nextStar = t + R.STAR_DRIFT + 90;
      }
    }
    const inRush = rush > 0; if (inRush) rush -= dt;
    const tw = R.tapWork(s, inRush) * TPS * dt;
    let cw = R.crewWps(s, inRush) * dt;
    const rank = s.rank;
    if (R.isFirstPhone(s)) {
      cw = Math.max(0, Math.min(cw, R.PHONE_CAP * R.TOYS[9].work - s.progress[9]));
      if (s.progress[9] >= R.PHONE_CAP * R.TOYS[9].work && phoneTapAt === null) phoneTapAt = t;
    }
    tapW[rank] += tw; crewW[rank] += cw;
    s.stats.taps += TPS * dt; s.stats.played += dt;
    const res = R.addWork(s, tw, cw);
    t += dt;
    if (res.phoneDone) done = t;
    for (const r of res.promotions) {
      rankT.push(t);
      if (r === 10) ctoT = t;
      if (snapshots) { const c = JSON.parse(JSON.stringify(s)); c.stats.taps = Math.round(c.stats.taps); snaps[r] = c; }
    }
  }
  const share = tapW.map((x, i) => (i ? x / (x + crewW[i] || 1) : 0)).slice(1);
  const boughtAll = s.hammer === 3 && R.UPGRADES.every((u) => s.upgrades[u.id]);
  return { rankT, ctoT, done, gap, gapAt, share, phoneTapAt, boughtAll, allBy, helpers: s.helpers, snaps };
}

const mmss = (x) => (x == null ? '-' : Math.floor(x / 60) + ':' + String(Math.floor(x % 60)).padStart(2, '0'));
function report(name, TPS, CATCH, r) {
  const dev = r.rankT.map((x, i) => (i ? Math.round((x / TARGET[i] - 1) * 100) + '%' : '')).slice(1);
  console.log(`${name} (${TPS}/s, catch ${CATCH}): ranks ${r.rankT.map(mmss).join(' ')}\n  dev ${dev.join(' ')} | CTO ${mmss(r.ctoT)} | Eve ${mmss(r.done)} (helpers at 90%: ${mmss(r.phoneTapAt)}) | helpers ${r.helpers.join('/')}\n  tap share ${r.share.map((x) => Math.round(x * 100) + '%').join(' ')} | longest wait between buys ${Math.round(r.gap)} s at ${mmss(r.gapAt)} | hammers+upgrades by ${mmss(r.allBy)} (${r.boughtAll ? 'all' : 'NOT all'})`);
}

function awayChecks() {
  const out = [];
  // Full speed under 10 minutes.
  let s = R.newState(); s.helpers[0] = 10;
  let a = R.away(s, 300);
  out.push(['away: under 10 min at full speed', a.effective === 300 && !a.long]);
  // Half speed after, capped at 4 hours.
  s = R.newState(); s.helpers[0] = 10;
  a = R.away(s, 10 * 3600);
  out.push(['away: half speed after 10 min, at most 4 h', a.long && a.effective === 2 * 3600]);
  // Cheer capped just below the rank after next: at most one promotion, toy unchanged.
  s = R.newState(); s.helpers[0] = 1000; s.toy = 0;
  a = R.away(s, 4 * 3600);
  out.push(['away: at most one promotion, cheer below the rank after next', s.rank === 2 && s.cheer === R.RANKS[2].cheer - 1 && a.promotions.length === 1]);
  out.push(['away: a promotion while away keeps the toy', s.toy === 0]);
  out.push(['away: all cookies kept', a.cookies > 0 && s.cookies === a.cookies]);
  // Never finishes the first Smartphone.
  s = R.newState(); s.rank = 10; s.cheer = 1100000; s.toy = 9; s.helpers = [100, 100, 100];
  R.away(s, 4 * 3600);
  out.push(['away: never finishes the first Smartphone (stops at 90%)', !s.phoneDone && s.progress[9] === R.PHONE_CAP * R.TOYS[9].work]);
  // Taps finish it.
  const r = R.addWork(s, 20000, 0);
  out.push(['taps finish the first Smartphone', r.phoneDone && s.phoneDone]);
  // Carry-over and many at once.
  s = R.newState(); const m = R.addWork(s, 0, 105);
  out.push(['carry-over: 105 work on the tractor makes 10 and keeps 5', m.made === 10 && s.progress[0] === 5]);
  return out;
}

if (process.argv[1] && process.argv[1].endsWith('balance.mjs')) {
  if (process.argv[2]) {
    report('custom', +process.argv[2], +process.argv[3] || 0, run(+process.argv[2], +process.argv[3] || 0));
  } else {
    const ref = run(3, 0.5, { snapshots: true }), slow = run(2, 0);
    report('Reference', 3, 0.5, ref); report('3/s no stars', 3, 0, run(3, 0)); report('Slow', 2, 0, slow); report('Fast', 5, 1, run(5, 1));
    report('Play-test pace', 10, 1, run(10, 1));
    const greedy = run(3, 0.5, { elvesFirst: true });
    report('Elves-first (3/s, half the stars)', 3, 0.5, greedy);
    const checks = [
      ['reference: every rank within ±25% of target', ref.rankT.length === 10 && ref.rankT.every((x, i) => !i || Math.abs(x / TARGET[i] - 1) <= 0.25)],
      ['reference: never more than 90 s between purchases', ref.gap <= 90],
      ['reference: every hammer and upgrade bought before Chief Toy Officer', ref.boughtAll && ref.allBy < ref.ctoT],
      ['reference: taps at least 30% of the work at every rank, 30-42% from rank 5', ref.share.every((x, i) => x >= 0.3 && (i < 4 || x <= 0.42))],
      ['slow (2/s, no stars): Christmas Eve under 45 min', slow.done !== null && slow.done < 2700],
      ['elves-first player: reaches Christmas Eve under 45 min', greedy.done !== null && greedy.done < 2700],
      ['reference: every rank-arrival save is within the elf limits', Object.entries(ref.snaps).every(([r, sn]) => sn.helpers[0] <= R.ELF_CAP[Math.min(+r, 10) - 1])],
      ...awayChecks(),
    ];
    let ok = true;
    for (const [n, p] of checks) { console.log((p ? 'PASS ' : 'FAIL ') + n); ok = ok && p; }
    if (process.env.ELF_CAP) { process.exitCode = ok ? 0 : 1; process.exit(); } // a what-if run: leave the play-test saves alone
    const dir = new URL('./snapshots/', import.meta.url);
    fs.mkdirSync(dir, { recursive: true });
    for (const [r, snap] of Object.entries(ref.snaps)) fs.writeFileSync(new URL(`rank-${r}.json`, dir), JSON.stringify(snap));
    // The game loads them from here (debug only).
    const gdir = new URL('../game/debug/', import.meta.url);
    fs.mkdirSync(gdir, { recursive: true });
    fs.writeFileSync(new URL('snapshots.json', gdir), JSON.stringify(ref.snaps));
    process.exitCode = ok ? 0 : 1;
  }
}
