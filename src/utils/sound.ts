// Web Audio API sound synthesizer & Web Speech API for Kiosk, Kitchen & TV Panel

let audioCtx: AudioContext | null = null;
let isAudioUnlocked = false;

export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function unlockAudioContext(): boolean {
  try {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().then(() => {
        isAudioUnlocked = true;
      }).catch(() => {});
    } else {
      isAudioUnlocked = true;
    }

    // Also trigger silent speech utterance to unlock speechSynthesis if needed
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const silentUtterance = new SpeechSynthesisUtterance('');
      silentUtterance.volume = 0;
      window.speechSynthesis.speak(silentUtterance);
    }
    return isAudioUnlocked;
  } catch {
    return false;
  }
}

export function playTouchSound(pitch: number = 600, duration: number = 0.04) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(pitch * 0.7, ctx.currentTime + duration);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Ignore audio errors
  }
}

export function playAddToCartSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    [520, 780].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + idx * 0.06;
      const dur = 0.1;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.12, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + dur);
    });
  } catch {
    // Ignore
  }
}

export function playSuccessChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const freqs = [523.25, 659.25, 783.99, 1046.5];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + idx * 0.08;
      const dur = 0.45;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.15, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + dur);
    });
  } catch {
    // Ignore
  }
}

export function playKitchenBell() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Master volume booster (set to high level 0.90)
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.9, now);
    master.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
    master.connect(ctx.destination);

    // Multi-harmonic bell tone (880Hz + 1760Hz + 2640Hz)
    [880, 1760, 2640].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(1 / (idx + 1.2), now);
      osc.connect(gain);
      gain.connect(master);
      osc.start(now);
      osc.stop(now + 0.85);
    });
  } catch {
    // Ignore
  }
}

// Classic loud, crystal-clear Ding-Dong chime for TV Panel & Kitchen
export function playDingDong() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Master volume set to 0.98 for maximum loudness without clipping
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.98, now);
    master.connect(ctx.destination);

    // Helper to synthesize a punchy, warm chime tone with rich harmonics
    const playTone = (freq: number, start: number, duration: number, peakVol: number) => {
      // 1. Warm Triangle Body (cuts through background noise and phone speakers)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(freq, start);
      gain1.gain.setValueAtTime(peakVol * 0.75, start);
      gain1.gain.exponentialRampToValueAtTime(0.001, start + duration);
      osc1.connect(gain1);
      gain1.connect(master);
      osc1.start(start);
      osc1.stop(start + duration);

      // 2. Pure Sine fundamental for deep resonance
      const oscSine = ctx.createOscillator();
      const gainSine = ctx.createGain();
      oscSine.type = 'sine';
      oscSine.frequency.setValueAtTime(freq, start);
      gainSine.gain.setValueAtTime(peakVol * 0.6, start);
      gainSine.gain.exponentialRampToValueAtTime(0.001, start + duration);
      oscSine.connect(gainSine);
      gainSine.connect(master);
      oscSine.start(start);
      oscSine.stop(start + duration);

      // 3. Bright Bell Octave overtone (adds sparkling presence and clarity)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2, start);
      gain2.gain.setValueAtTime(peakVol * 0.45, start);
      gain2.gain.exponentialRampToValueAtTime(0.001, start + duration * 0.7);
      osc2.connect(gain2);
      gain2.connect(master);
      osc2.start(start);
      osc2.stop(start + duration * 0.7);
    };

    // First tone (Sol / G5: 783.99 Hz)
    playTone(783.99, now, 0.8, 0.92);

    // Second tone (Mi / E5: 659.25 Hz) - louder and longer resonance
    playTone(659.25, now + 0.36, 1.5, 1.0);
  } catch {
    // Ignore
  }
}

// Convert "#012" to "doze" or "doze" in spoken Portuguese
function formatOrderNumberForSpeech(orderNumber: string): string {
  const digitsOnly = orderNumber.replace(/\D/g, '');
  const num = parseInt(digitsOnly, 10);
  if (isNaN(num)) return orderNumber.replace('#', 'número ');
  return `${num}`;
}

// Web Speech API Announcement: "Pedido doze, João, seu pedido está pronto"
export function speakOrderReady(orderNumber: string, customerName: string): Promise<void> {
  return new Promise((resolve) => {
    try {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        // Fallback: still play the loud Ding-Dong chime even if speech is not supported
        playDingDong();
        resolve();
        return;
      }

      // Play loud Ding-Dong chime first
      playDingDong();

      // Delay speech slightly to let the chime sound first
      setTimeout(() => {
        try {
          const numberText = formatOrderNumberForSpeech(orderNumber);
          const cleanName = customerName?.trim() || 'Cliente';
          const phrase = `Atenção! Pedido ${numberText}, ${cleanName}, seu pedido está pronto!`;

          const utterance = new SpeechSynthesisUtterance(phrase);
          utterance.lang = 'pt-BR';
          utterance.rate = 0.92; // slightly slower for maximum clarity in restaurant/cafeteria
          utterance.pitch = 1.05;
          utterance.volume = 1.0; // 100% maximum volume

          // Find Portuguese voice if available
          const voices = window.speechSynthesis.getVoices();
          const ptVoice =
            voices.find((v) => v.lang.startsWith('pt-BR')) ||
            voices.find((v) => v.lang.startsWith('pt'));
          if (ptVoice) {
            utterance.voice = ptVoice;
          }

          utterance.onend = () => resolve();
          utterance.onerror = () => resolve();

          window.speechSynthesis.cancel(); // cancel any active queue
          window.speechSynthesis.speak(utterance);
        } catch {
          resolve();
        }
      }, 550);
    } catch {
      resolve();
    }
  });
}
