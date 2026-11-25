// All of the game's sounds are synthesised with the Web Audio API, so the game ships
// no audio files and makes no network request. Each sound is a short envelope over one
// or two oscillators; the kitchen stays quiet until the player first interacts, which
// is when browsers allow audio to start.

let context = null;
let muted = false;

function audioContext() {
  if (context === null) {
    const AudioContext = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioContext) return null;
    context = new AudioContext();
  }
  if (context.state === 'suspended') void context.resume();
  return context;
}

function tone({ frequency = 440, endFrequency = null, type = 'sine', duration = 0.12, volume = 0.12, delay = 0 }) {
  if (muted) return;
  const ctx = audioContext();
  if (ctx === null) return;
  const start = ctx.currentTime + delay;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  if (endFrequency !== null) oscillator.frequency.exponentialRampToValueAtTime(endFrequency, start + duration);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

export const SOUNDS = {
  // A picked-up ingredient makes a soft pop.
  pickup() { tone({ frequency: 520, endFrequency: 760, type: 'triangle', duration: 0.09 }); },
  // A chop lands with a woody thock.
  chop() { tone({ frequency: 190, endFrequency: 120, type: 'square', duration: 0.07, volume: 0.08 }); },
  // Something goes on the stove with a low sizzle start.
  sizzle() { tone({ frequency: 320, endFrequency: 210, type: 'sawtooth', duration: 0.18, volume: 0.05 }); },
  // A dish is done cooking: a bright ding.
  ding() { tone({ frequency: 880, duration: 0.16 }); tone({ frequency: 1320, duration: 0.2, delay: 0.08 }); },
  // A wrong move: a dull buzz.
  wrong() { tone({ frequency: 140, endFrequency: 90, type: 'sawtooth', duration: 0.22, volume: 0.09 }); },
  // A served order: a happy little arpeggio.
  serve() {
    tone({ frequency: 523, duration: 0.1 });
    tone({ frequency: 659, duration: 0.1, delay: 0.09 });
    tone({ frequency: 784, duration: 0.18, delay: 0.18 });
  },
  // A new order arrives on the board.
  order() { tone({ frequency: 660, endFrequency: 990, type: 'triangle', duration: 0.12 }); },
  // A dish burned: a sad slide down.
  burn() { tone({ frequency: 300, endFrequency: 110, type: 'sawtooth', duration: 0.35, volume: 0.08 }); },
  // The shift ends.
  fanfare() {
    [523, 659, 784, 1047].forEach((frequency, index) => {
      tone({ frequency, duration: 0.22, delay: index * 0.12 });
    });
  },
};

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() {
  return muted;
}
