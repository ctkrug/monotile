// Synth SFX (docs/DESIGN.md §5) — WebAudio oscillators/noise only, no audio
// files. The AudioContext is created lazily on first playback (autoplay
// policy) and every play function no-ops safely when AudioContext isn't
// available (older browsers, or a test/node environment), per story 2.4's
// AC. Mute state is a module-level flag backed by localStorage when it
// exists, so it persists across reloads (story 2.5) but still works
// in-memory-only when storage is unavailable (private browsing, tests).

const MUTE_KEY = "monotile:muted";

function readStoredMute() {
  if (typeof localStorage === "undefined") return false;
  try {
    return localStorage.getItem(MUTE_KEY) === "true";
  } catch {
    return false;
  }
}

let muted = readStoredMute();
let audioCtx = null;

export function isMuted() {
  return muted;
}

export function setMuted(value) {
  muted = value;
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(MUTE_KEY, String(value));
  } catch {
    // Storage unavailable (e.g. private mode quota) — mute still applies
    // for this session, it just won't persist across reloads.
  }
}

function getAudioContext() {
  if (typeof AudioContext === "undefined" && typeof webkitAudioContext === "undefined") {
    return null;
  }
  if (!audioCtx) {
    const AudioContextClass = typeof AudioContext !== "undefined" ? AudioContext : webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  return audioCtx;
}

function playTone(frequency, startOffset, duration, gain) {
  const ctx = getAudioContext();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = frequency;
  osc.connect(gainNode).connect(ctx.destination);

  const start = ctx.currentTime + startOffset;
  gainNode.gain.setValueAtTime(0, start);
  gainNode.gain.linearRampToValueAtTime(gain, start + 0.01);
  gainNode.gain.linearRampToValueAtTime(0, start + duration);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

/** Soft two-note chime for a scheme recolor. */
export function playRecolorChime() {
  if (muted) return;
  playTone(440, 0, 0.08, 0.12);
  playTone(660, 0.08, 0.08, 0.12);
}

/** Short percussive "shutter" click for a poster export. */
export function playExportShutter() {
  if (muted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const duration = 0.04;
  const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 2000;
  const gainNode = ctx.createGain();
  gainNode.gain.value = 0.1;

  noise.connect(filter).connect(gainNode).connect(ctx.destination);
  noise.start();
}
