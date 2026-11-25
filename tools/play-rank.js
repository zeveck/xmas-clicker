// A player for the play-test, run in the browser with playwright-cli:
//   playwright-cli -s=desk run-code "$(sed -e 's/__FROM__/3/' -e 's/__TO__/4/' tools/play-rank.js)"
// From rank __FROM__ (0 = a fresh game from the title screen), it plays with real
// input until rank __TO__ is reached (11 = through Christmas Eve to its card):
// taps on the bench at about 10 a second, real clicks on the best thing to buy
// (the balance script's rule: most work per cookie), clicks on shooting stars, and
// the cards' buttons. It reads the game's state to decide, like a player looking
// at the screen. Progress goes to window.__runLog.
async (page) => {
  const FROM = __FROM__, TO = __TO__, LIMIT = (__LIMIT__) * 1000;
  const g = (f, a) => page.evaluate(f, a);
  const press = async (x, y, hold = 40) => { await page.mouse.move(x, y); await page.mouse.down(); await page.waitForTimeout(hold); await page.mouse.up(); };
  const clickEl = async (sel, hold = 110) => { await page.locator(sel).scrollIntoViewIfNeeded().catch(() => {}); const b = await page.locator(sel).boundingBox(); if (!b) return false; await press(b.x + b.width / 2, b.y + b.height / 2, hold); return true; };
  await g(() => { window.__runLog = window.__runLog || []; });
  const log = (m) => g((m) => (window.__runLog = window.__runLog || []).push(m), m);
  if (FROM === 0) {
    // The game saves as the page unloads, so clear the save as the next page starts, before the game loads.
    await page.addInitScript(() => {
      if (sessionStorage.getItem('__freshStart')) { sessionStorage.removeItem('__freshStart'); localStorage.clear(); }
    });
    await g(() => sessionStorage.setItem('__freshStart', '1'));
    await page.reload(); await page.waitForTimeout(800);
    await clickEl('#btn-start'); await page.waitForTimeout(600);
  } else {
    await g((n) => window.__game.goToLevel(n), FROM);
    await page.waitForTimeout(400);
  }
  const t0 = Date.now();
  let lastRank = (await g(() => window.__game.state())).rank, buys = 0, stars = 0, cardsClosed = 0;
  await log(`start rank ${lastRank} at ${new Date().toISOString()}`);
  const best = () => g(async () => {
    const R = await import('./src/rules.js');
    const st = window.__game.state();
    const s = R.newState();
    Object.assign(s, { rank: st.rank, hammer: st.hammer, helpers: st.helpers, cookies: st.cookies, toy: st.toy });
    st.upgrades.forEach((u) => (s.upgrades[u] = true));
    const rate = () => { const t = R.TOYS[s.toy]; return (t.cookies / t.work) * R.cookieMul(s); };
    const inc = (x) => (R.tapWork(x) * 10 + R.crewWps(x)) * rate();
    const base = inc(s); let pick = null;
    const tryIt = (kind, i, list, idx) => {
      const it = R.shopItem(s, kind, i); if (!it.canBuy) return;
      const c = JSON.parse(JSON.stringify(s)); c.cookies = 1e18; R.buy(c, kind, i);
      let gain = inc(c) - base; if (kind === 'upgrade' && R.UPGRADES[i].id === 'wrap') gain = base * 0.25;
      const v = gain / it.cost;
      if (gain > 0 && (!pick || v > pick.v)) pick = { v, cost: it.cost, sel: `#${list} .item:nth-child(${idx + 1})` };
    };
    R.HELPERS.forEach((_, i) => tryIt('helper', i, 'list-helpers', i));
    R.HAMMERS.forEach((_, i) => tryIt('hammer', i, 'list-hammers', i));
    R.UPGRADES.forEach((_, i) => tryIt('upgrade', i, 'list-upgrades', i));
    return pick && st.cookies >= pick.cost ? pick.sel : null;
  });
  let toy = await g(() => window.__game.toyPos());
  let n = 0;
  while (Date.now() - t0 < LIMIT) {
    const st = await g(() => window.__game.state());
    if (TO <= 10 && st.rank >= TO) break;
    if (TO === 11 && st.screen === 'eve-card') break;
    if (st.rank !== lastRank) { await log(`rank ${st.rank} (${st.title}) at ${Math.round((Date.now() - t0) / 1000)} s; buys ${buys}, stars ${stars}`); lastRank = st.rank; }
    if (st.screen.startsWith('eve-')) { await page.waitForTimeout(500); continue; }
    if (st.card) {
      await page.waitForTimeout(1100);
      await clickEl('#card-btn'); cardsClosed++;
      await page.waitForTimeout(300);
      toy = await g(() => window.__game.toyPos());
      continue;
    }
    if (st.star !== null && st.star > 0.5) {
      const p = await g(() => window.__game.starPos());
      if (p) { await press(p.x, p.y); stars++; continue; }
    }
    if (n % 10 === 0) {
      const sel = await best();
      if (sel) { await clickEl(sel); buys++; }
      toy = await g(() => window.__game.toyPos());
    }
    await press(toy.x, toy.y + 25);
    await page.waitForTimeout(55);
    n++;
  }
  const end = await g(() => window.__game.state());
  const res = { from: FROM, to: TO, rank: end.rank, screen: end.screen, levelComplete: end.levelComplete, seconds: Math.round((Date.now() - t0) / 1000), taps: n, buys, stars, cardsClosed, cookies: end.cookies };
  await log('done ' + JSON.stringify(res));
  return res;
}
