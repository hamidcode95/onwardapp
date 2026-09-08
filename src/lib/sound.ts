// Lightweight Web Audio API sound generator.
// Avoids bundling external audio files by synthesizing a soft two-tone chime.

let sharedAudioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioContext) {
    sharedAudioContext = new AudioCtx();
  }
  return sharedAudioContext;
}

function playTone(ctx: AudioContext, frequency: number, startTime: number, duration: number, volume: number) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency, startTime);

  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
}

/**
 * Plays the soft but persistent "Oly Nudge" chime: a gentle two-note bell
 * that repeats a few times so it's noticeable without being harsh.
 */
export function playOlyNudge() {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const repeats = 3;
  const gap = 1.1;

  for (let i = 0; i < repeats; i++) {
    const start = ctx.currentTime + i * gap;
    playTone(ctx, 660, start, 0.35, 0.18);
    playTone(ctx, 880, start + 0.15, 0.4, 0.14);
  }
}
