// Web Audio: music with a crossfaded loop, effects with per-effect limits.
const SFX = {
  'tap-1': 0.55, 'tap-2': 0.55, 'tap-3': 0.55, 'tap-heavy': 0.6, 'toy-done': 0.45, 'present-whoosh': 0.35,
  'cookie-clink': 0.4, purchase: 0.9, nope: 0.6, 'elf-hired': 0.7, promotion: 0.7, 'star-appear': 0.9,
  'star-catch': 0.7, 'rush-loop': 0.35, 'rush-end': 0.6, 'ui-click': 0.9, 'eve-sleigh': 0.7, 'santa-hohoho': 1.0,
};
// Minimum gap between two plays of the same effect (ms).
const GAP = { 'toy-done': 250, 'present-whoosh': 300, 'cookie-clink': 300, 'star-appear': 1000, 'ui-click': 40 };
const MUSIC = { workshop: 0.42, eve: 0.5 };
const FADE = 2;

let ctx = null, master, musicGain, sfxGain, duck;
const buffers = {}, raw = {}, last = {};
let recent = [];
let music = null; // { name, sources, timer }
let rushNode = null;
let settings = { music: true, sfx: true, muted: false };
let wantMusic = null;

function fetchAll() {
  const names = [...Object.keys(SFX).map((n) => ['sfx/' + n, n]), ...Object.keys(MUSIC).map((n) => ['music/' + n, 'm:' + n])];
  return Promise.all(names.map(([p, k]) => fetch(`assets/audio/${p}.mp3`).then((r) => r.arrayBuffer()).then((b) => { raw[k] = b; }).catch(() => {})));
}
const fetched = fetchAll();

async function decodeAll() {
  await fetched;
  await Promise.all(Object.entries(raw).map(async ([k, b]) => {
    if (buffers[k] || !b) return;
    try { buffers[k] = await ctx.decodeAudioData(b.slice(0)); } catch {}
  }));
  if (wantMusic) playMusic(wantMusic);
}

/** Call on the first tap or key press. */
export function unlock() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.connect(ctx.destination);
    duck = ctx.createGain(); duck.connect(master);
    musicGain = ctx.createGain(); musicGain.connect(duck);
    sfxGain = ctx.createGain(); sfxGain.connect(master);
    apply();
    decodeAll();
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
}

function apply() {
  if (!ctx) return;
  const t = ctx.currentTime;
  master.gain.setTargetAtTime(settings.muted ? 0 : 1, t, 0.02);
  musicGain.gain.setTargetAtTime(settings.music ? 1 : 0, t, 0.05);
  sfxGain.gain.setTargetAtTime(settings.sfx ? 1 : 0, t, 0.02);
}
export function setSettings(s) { settings = { ...settings, ...s }; apply(); }
export function setDuck(on) { if (ctx) duck.gain.setTargetAtTime(on ? 0.35 : 1, ctx.currentTime, 0.2); }

/** Play an effect. opts: { rate, gain }. Returns false when limited. */
export function play(name, opts = {}) {
  if (!ctx || !buffers[name] || ctx.state !== 'running') return false;
  const now = performance.now();
  if (GAP[name] && last[name] && now - last[name] < GAP[name]) return false;
  recent = recent.filter((t) => now - t < 1000);
  if (recent.length >= 30) return false;
  recent.push(now); last[name] = now;
  const src = ctx.createBufferSource();
  src.buffer = buffers[name];
  src.playbackRate.value = opts.rate || 1;
  const g = ctx.createGain(); g.gain.value = (SFX[name] ?? 0.6) * (opts.gain ?? 1);
  src.connect(g); g.connect(sfxGain); src.start();
  return true;
}

/** Start a music track, looping with a crossfade. Never stacks two copies. */
export function playMusic(name) {
  wantMusic = name;
  if (!ctx) return;
  if (music && music.name === name) return;
  stopMusic(1.2);
  const buf = buffers['m:' + name];
  if (!buf) return;
  const m = { name, sources: [], timer: 0, onEnd: null };
  music = m;
  const vol = MUSIC[name];
  const startOne = (when, fadeIn) => {
    const src = ctx.createBufferSource(); src.buffer = buf;
    const g = ctx.createGain(); src.connect(g); g.connect(musicGain);
    g.gain.setValueAtTime(fadeIn ? 0 : vol, when);
    if (fadeIn) g.gain.linearRampToValueAtTime(vol, when + FADE);
    const end = when + buf.duration;
    g.gain.setValueAtTime(vol, end - FADE); g.gain.linearRampToValueAtTime(0, end);
    src.start(when); src.stop(end + 0.05);
    m.sources.push({ src, g });
    if (m.sources.length > 3) m.sources.shift();
    return end - FADE;
  };
  let next = startOne(ctx.currentTime + 0.05, true);
  const tick = () => {
    if (music !== m) return;
    if (ctx.currentTime > next - 1) {
      if (m.loop === false) { m.onEnd?.(); return; }
      next = startOne(next, true);
    }
    m.timer = setTimeout(tick, 400);
  };
  m.timer = setTimeout(tick, 400);
  return m;
}
/** Eve music: plays once, then fades into the workshop loop. */
export function playEveMusic() {
  wantMusic = 'workshop';
  if (!ctx || !buffers['m:eve']) return;
  const m = playMusic('eve');
  if (m) { m.loop = false; m.onEnd = () => { music = null; playMusic('workshop'); }; }
}
export function stopMusic(fade = 1) {
  if (!music || !ctx) { music = null; return; }
  const t = ctx.currentTime;
  for (const { src, g } of music.sources) {
    try { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(0, t + fade); src.stop(t + fade + 0.05); } catch {}
  }
  clearTimeout(music.timer);
  music = null;
}

export function rush(on) {
  if (!ctx) return;
  if (on && !rushNode && buffers['rush-loop']) {
    const src = ctx.createBufferSource(); src.buffer = buffers['rush-loop']; src.loop = true;
    const g = ctx.createGain(); g.gain.setValueAtTime(0, ctx.currentTime); g.gain.linearRampToValueAtTime(SFX['rush-loop'], ctx.currentTime + 0.4);
    src.connect(g); g.connect(sfxGain); src.start();
    rushNode = { src, g };
  } else if (!on && rushNode) {
    const { src, g } = rushNode, t = ctx.currentTime;
    g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(0, t + 0.8); src.stop(t + 0.9);
    rushNode = null;
  }
}

export function suspend() { if (ctx && ctx.state === 'running') ctx.suspend().catch(() => {}); }
export function resume() { if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {}); }

export function state() {
  return { context: ctx?.state ?? 'none', music: music?.name ?? null, musicOn: settings.music, sfxOn: settings.sfx, muted: settings.muted, musicMuted: settings.muted || !settings.music, sfxMuted: settings.muted || !settings.sfx, rush: !!rushNode, decoded: Object.keys(buffers).length };
}
