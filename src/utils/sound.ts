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

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now); // A5

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.5);
  } catch {
    // Ignore
  }
}

// Classic pleasant Ding-Dong chime for TV Panel call
export function playDingDong() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // First tone (G5: 784 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(783.99, now);
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.6);

    // Second tone (E5: 659 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(659.25, now + 0.35);
    gain2.gain.setValueAtTime(0.28, now + 0.35);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.35);
    osc2.stop(now + 1.2);
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
        resolve();
        return;
      }

      // Play chime first
      playDingDong();

      // Delay speech slightly to let the chime sound first
      setTimeout(() => {
        try {
          const numberText = formatOrderNumberForSpeech(orderNumber);
          const cleanName = customerName?.trim() || 'Cliente';
          const phrase = `Pedido ${numberText}, ${cleanName}, seu pedido está pronto!`;

          const utterance = new SpeechSynthesisUtterance(phrase);
          utterance.lang = 'pt-BR';
          utterance.rate = 0.95; // slightly slower for maximum clarity in restaurant
          utterance.pitch = 1.05;
          utterance.volume = 1.0;

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
