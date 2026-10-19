// Small game sounds made with the Web Audio API (no audio files).
let ctx: AudioContext | null = null;
let muted = false;
try { muted = window.localStorage.getItem('speedmath:muted') === '1'; } catch { /* ignore */ }

export const isMuted = () => muted;
export function setMuted(v: boolean) {
  muted = v;
  try { window.localStorage.setItem('speedmath:muted', v ? '1' : '0'); } catch { /* ignore */ }
}

function audio() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', vol = 0.18) {
  const a = audio();
  if (!a || muted) return;
  const t0 = a.currentTime + start;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(a.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

export const sounds = {
  // Call once from a click so browsers allow sound later.
  unlock: () => { audio(); },
  correct: (streak = 1) => {
    const lift = Math.min(streak, 8) * 30;
    tone(660 + lift, 0, 0.12, 'triangle');
    tone(990 + lift, 0.07, 0.16, 'triangle');
  },
  wrong: () => {
    tone(220, 0, 0.18, 'sawtooth', 0.12);
    tone(160, 0.12, 0.25, 'sawtooth', 0.12);
  },
  tick: () => tone(1200, 0, 0.05, 'square', 0.06),
  start: () => { [523, 659, 784].forEach((f, i) => tone(f, i * 0.09, 0.14, 'triangle')); },
  end: (record: boolean) => {
    const notes = record ? [523, 659, 784, 1047, 1319] : [784, 659, 523];
    notes.forEach((f, i) => tone(f, i * 0.12, 0.22, 'triangle', 0.2));
  },
};
