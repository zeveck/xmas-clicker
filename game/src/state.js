// Saving and loading. A broken save is backed up and a fresh one started.
import { newState, migrate } from './rules.js';

export const KEY = 'chief-toy-officer';

export function load() {
  let raw = null;
  try { raw = localStorage.getItem(KEY); } catch { return { state: newState(), fresh: true }; }
  if (!raw) return { state: newState(), fresh: true };
  try {
    return { state: migrate(JSON.parse(raw)), fresh: false };
  } catch {
    try { localStorage.setItem(KEY + '-broken', raw); } catch {}
    return { state: newState(), fresh: true, broken: true };
  }
}

export function save(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); return true; } catch { return false; }
}

export function wipe() {
  try { localStorage.removeItem(KEY); } catch {}
}
