// Optional sound effects, off by default. Synthesized with the Web Audio API (no audio files).
// The preference lives in localStorage and on <html data-sound> (set before paint in BaseLayout),
// which the header toggle's icons key off via the `sound-on:` variant.

export type Sfx = 'key' | 'tick' | 'pop' | 'select' | 'switch' | 'ok' | 'fallback' | 'fail' | 'error' | 'chime';

const STORAGE_KEY = 'sound';
let enabled: boolean | null = null;
let ctx: AudioContext | null = null;

export function isSoundOn() {
  if (enabled === null) {
    try {
      enabled = localStorage.getItem(STORAGE_KEY) === 'on';
    } catch {
      enabled = false;
    }
  }
  return enabled;
}

export function setSound(on: boolean) {
  enabled = on;
  try {
    localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off');
  } catch {
    // storage blocked: the choice still holds for this visit
  }
  document.documentElement.dataset.sound = on ? 'on' : 'off';
  window.dispatchEvent(new Event('sound:change'));
  if (on) play('chime');
}

export const toggleSound = () => setSound(!isSoundOn());

// Pentatonic, so any run of steps (diagram traces, the fallback toy) sounds pleasant
const SCALE = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51];

interface Tone {
  freq: number;
  to?: number;
  at?: number;
  dur?: number;
  type?: OscillatorType;
  gain?: number;
}

function tone(audio: AudioContext, { freq, to, at = 0, dur = 0.08, type = 'sine', gain = 0.05 }: Tone) {
  const t = audio.currentTime + at;
  const osc = audio.createOscillator();
  const env = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t + dur);
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(gain, t + 0.008);
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(env).connect(audio.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

// `step` picks a note from the scale for 'ok'; `at` delays the sound in seconds.
export function play(name: Sfx, { step = 0, at = 0 } = {}) {
  if (!isSoundOn() || document.hidden) return;
  try {
    ctx ??= new AudioContext();
  } catch {
    return;
  }
  if (ctx.state === 'suspended') void ctx.resume();
  const a = ctx;

  switch (name) {
    case 'key':
      tone(a, { freq: 1700 + Math.random() * 500, dur: 0.018, type: 'square', gain: 0.006, at });
      break;
    case 'tick':
      tone(a, { freq: 1200, dur: 0.03, type: 'triangle', gain: 0.03, at });
      break;
    case 'pop':
      tone(a, { freq: 420, to: 880, dur: 0.09, gain: 0.05, at });
      break;
    case 'select':
      tone(a, { freq: 880, to: 1320, dur: 0.07, type: 'triangle', gain: 0.04, at });
      break;
    case 'switch':
      tone(a, { freq: 660, dur: 0.04, type: 'square', gain: 0.012, at });
      tone(a, { freq: 990, dur: 0.05, type: 'square', gain: 0.012, at: at + 0.05 });
      break;
    case 'ok':
      tone(a, { freq: SCALE[step % SCALE.length], dur: 0.12, type: 'triangle', gain: 0.045, at });
      break;
    case 'fallback':
      tone(a, { freq: 784, dur: 0.08, type: 'triangle', gain: 0.04, at });
      tone(a, { freq: 587, dur: 0.12, type: 'triangle', gain: 0.04, at: at + 0.08 });
      break;
    case 'fail':
      tone(a, { freq: 220, to: 110, dur: 0.22, type: 'sawtooth', gain: 0.025, at });
      break;
    case 'error':
      tone(a, { freq: 180, dur: 0.1, type: 'square', gain: 0.015, at });
      break;
    case 'chime':
      [2, 4, 6].forEach((s, i) => tone(a, { freq: SCALE[s], dur: 0.25, gain: 0.045, at: at + i * 0.07 }));
      break;
  }
}
