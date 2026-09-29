// Modern Web Audio Chime Generator: Loud, Crisp & Pleasant Restaurant Service Chime
let sharedAudioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  try {
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        sharedAudioCtx = new AudioContextClass();
      }
    }
    if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch (e) {
    console.warn('AudioContext init error:', e);
    return null;
  }
};

// Global unlock listener on first user interaction
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  };
  window.addEventListener('click', unlockAudio, { once: false, passive: true });
  window.addEventListener('touchstart', unlockAudio, { once: false, passive: true });
}

/**
 * Play a pleasant, rich 3-tone service bell chime (E5 -> G#5 -> B5)
 * Loud, crisp, and cuts through kitchen/restaurant ambience while sounding premium.
 */
export const playRestaurantChime = async (volume: number = 0.75) => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      await ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Master Compressor to prevent harsh clipping while keeping volume high and punchy
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-12, now);
    compressor.knee.setValueAtTime(8, now);
    compressor.ratio.setValueAtTime(4, now);
    compressor.attack.setValueAtTime(0.003, now);
    compressor.release.setValueAtTime(0.15, now);

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(Math.min(1.0, Math.max(0.1, volume)), now);

    compressor.connect(masterGain);
    masterGain.connect(ctx.destination);

    // E-Major Chord Arpeggio (Luxury Service Bell: E5 659Hz, G#5 831Hz, B5 988Hz)
    const notes = [
      { freq: 659.25, time: 0.0, duration: 0.45, gainVal: 0.6 },
      { freq: 830.61, time: 0.12, duration: 0.45, gainVal: 0.7 },
      { freq: 987.77, time: 0.24, duration: 0.65, gainVal: 0.85 },
    ];

    notes.forEach(({ freq, time, duration, gainVal }) => {
      const noteStart = now + time;

      // Primary Body (Sine - smooth bell resonance)
      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, noteStart);

      // Warmth & Overtone Harmonics (Triangle - chime chime acoustic presence)
      const osc2 = ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 2, noteStart);

      const noteGain = ctx.createGain();
      noteGain.gain.setValueAtTime(0.0001, noteStart);
      noteGain.gain.linearRampToValueAtTime(gainVal, noteStart + 0.015);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, noteStart + duration);

      osc1.connect(noteGain);
      osc2.connect(noteGain);
      noteGain.connect(compressor);

      osc1.start(noteStart);
      osc2.start(noteStart);
      osc1.stop(noteStart + duration);
      osc2.stop(noteStart + duration);
    });
  } catch (err) {
    console.warn('Audio alert playback error:', err);
  }
};

/**
 * Play a double-chime ding-dong for waiter service calls
 */
export const playWaiterCallChime = async () => {
  return playRestaurantChime(0.85);
};
