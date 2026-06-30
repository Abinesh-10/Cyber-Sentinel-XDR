// Centralized Cyberpunk UI Sound Engine using Web Audio API

let audioCtx: AudioContext | null = null;
let enabled = true;
let volume = 0.75;

// Load settings from localStorage
if (typeof window !== "undefined") {
  const storedEnabled = localStorage.getItem("cybersentinel_sound_enabled");
  if (storedEnabled !== null) {
    enabled = storedEnabled === "true";
  }
  const storedVolume = localStorage.getItem("cybersentinel_sound_volume");
  if (storedVolume !== null) {
    const parsed = parseFloat(storedVolume);
    // Upgrade old default volume (0.25) to the new louder default (0.75)
    if (parsed === 0.25) {
      volume = 0.75;
      localStorage.setItem("cybersentinel_sound_volume", "0.75");
    } else {
      volume = parsed;
    }
  }
}

function initAudio() {
  if (audioCtx) return audioCtx;
  const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtor) return null;
  audioCtx = new AudioCtor();
  return audioCtx;
}

export const soundEngine = {
  isEnabled() {
    return enabled;
  },
  setEnabled(val: boolean) {
    enabled = val;
    if (typeof window !== "undefined") {
      localStorage.setItem("cybersentinel_sound_enabled", String(val));
    }
  },
  getVolume() {
    return volume;
  },
  setVolume(val: number) {
    volume = Math.max(0, Math.min(1, val));
    if (typeof window !== "undefined") {
      localStorage.setItem("cybersentinel_sound_volume", String(volume));
    }
  },
  play(type: "click" | "tick" | "whoosh" | "reverse-whoosh" | "execute" | "success" | "error" | "alert" | "toggle" | "select") {
    if (!enabled) return;
    const ctx = initAudio();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const destination = ctx.destination;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(volume, ctx.currentTime);
    masterGain.connect(destination);

    const t = ctx.currentTime;

    switch (type) {
      case "click": {
        // Normal button click -> soft cyber "dok"
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = "sine";
        osc.frequency.setValueAtTime(450, t);
        osc.frequency.exponentialRampToValueAtTime(120, t + 0.06);

        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(600, t);

        osc.connect(gain);
        gain.connect(filter);
        filter.connect(masterGain);

        osc.start(t);
        osc.stop(t + 0.07);
        break;
      }
      case "tick": {
        // Navigation tab click -> futuristic tick
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(1300, t);
        osc.frequency.exponentialRampToValueAtTime(600, t + 0.035);

        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

        filter.type = "highpass";
        filter.frequency.setValueAtTime(800, t);

        osc.connect(gain);
        gain.connect(filter);
        filter.connect(masterGain);

        osc.start(t);
        osc.stop(t + 0.04);
        break;
      }
      case "whoosh": {
        // Open panel/modal -> holographic whoosh
        const bufferSize = ctx.sampleRate * 0.25;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const noiseNode = ctx.createBufferSource();
        noiseNode.buffer = buffer;

        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        filter.type = "bandpass";
        filter.Q.setValueAtTime(4, t);
        filter.frequency.setValueAtTime(200, t);
        filter.frequency.exponentialRampToValueAtTime(1300, t + 0.22);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.25, t + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

        noiseNode.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);

        noiseNode.start(t);
        noiseNode.stop(t + 0.26);
        break;
      }
      case "reverse-whoosh": {
        // Close panel/modal -> soft reverse whoosh
        const bufferSize = ctx.sampleRate * 0.25;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const noiseNode = ctx.createBufferSource();
        noiseNode.buffer = buffer;

        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        filter.type = "bandpass";
        filter.Q.setValueAtTime(4, t);
        filter.frequency.setValueAtTime(1300, t);
        filter.frequency.exponentialRampToValueAtTime(200, t + 0.22);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.22, t + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

        noiseNode.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);

        noiseNode.start(t);
        noiseNode.stop(t + 0.26);
        break;
      }
      case "execute": {
        // Execute / Launch / Start Simulation -> powerful activation sound
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc1.type = "sawtooth";
        osc1.frequency.setValueAtTime(110, t);
        osc1.frequency.exponentialRampToValueAtTime(380, t + 0.35);

        osc2.type = "square";
        osc2.frequency.setValueAtTime(165, t);
        osc2.frequency.exponentialRampToValueAtTime(570, t + 0.35);

        gain.gain.setValueAtTime(0.15, t);
        gain.gain.linearRampToValueAtTime(0.22, t + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

        filter.type = "lowpass";
        filter.Q.setValueAtTime(8, t);
        filter.frequency.setValueAtTime(150, t);
        filter.frequency.exponentialRampToValueAtTime(1600, t + 0.3);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(filter);
        filter.connect(masterGain);

        osc1.start(t);
        osc2.start(t);
        osc1.stop(t + 0.42);
        osc2.stop(t + 0.42);
        break;
      }
      case "success": {
        // Success action -> positive confirmation tone (C5 to G5 chimes)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(523.25, t); // C5
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.05, t + 0.12);

        osc.frequency.setValueAtTime(783.99, t + 0.12); // G5
        gain.gain.setValueAtTime(0.2, t + 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(t);
        osc.stop(t + 0.42);
        break;
      }
      case "error": {
        // Error action -> warning tone (double buzz)
        const playBuzz = (startTime: number) => {
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const subGain = ctx.createGain();

          osc1.type = "sawtooth";
          osc1.frequency.setValueAtTime(180, startTime);

          osc2.type = "sawtooth";
          osc2.frequency.setValueAtTime(184, startTime); // detuned discord

          subGain.gain.setValueAtTime(0.15, startTime);
          subGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.12);

          osc1.connect(subGain);
          osc2.connect(subGain);
          subGain.connect(masterGain);

          osc1.start(startTime);
          osc2.start(startTime);
          osc1.stop(startTime + 0.13);
          osc2.stop(startTime + 0.13);
        };

        playBuzz(t);
        playBuzz(t + 0.16);
        break;
      }
      case "alert": {
        // Alert action -> security alert tone
        const playChirp = (startTime: number) => {
          const osc = ctx.createOscillator();
          const subGain = ctx.createGain();

          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(320, startTime);
          osc.frequency.exponentialRampToValueAtTime(800, startTime + 0.14);

          subGain.gain.setValueAtTime(0.12, startTime);
          subGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.14);

          osc.connect(subGain);
          subGain.connect(masterGain);

          osc.start(startTime);
          osc.stop(startTime + 0.15);
        };

        playChirp(t);
        playChirp(t + 0.18);
        playChirp(t + 0.36);
        break;
      }
      case "toggle": {
        // Toggle switch -> mechanical cyber tick
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = "sine";
        osc.frequency.setValueAtTime(2400, t);
        osc.frequency.exponentialRampToValueAtTime(1500, t + 0.015);

        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.015);

        filter.type = "highpass";
        filter.frequency.setValueAtTime(1400, t);

        osc.connect(gain);
        gain.connect(filter);
        filter.connect(masterGain);

        osc.start(t);
        osc.stop(t + 0.02);
        break;
      }
      case "select": {
        // Dropdown selection -> digital select sound (double beep)
        const playBeep = (startTime: number, freq: number) => {
          const osc = ctx.createOscillator();
          const subGain = ctx.createGain();

          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, startTime);

          subGain.gain.setValueAtTime(0.18, startTime);
          subGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.025);

          osc.connect(subGain);
          subGain.connect(masterGain);

          osc.start(startTime);
          osc.stop(startTime + 0.03);
        };

        playBeep(t, 950);
        playBeep(t + 0.025, 1200);
        break;
      }
    }
  }
};

// Global click event hook
if (typeof window !== "undefined") {
  window.addEventListener(
    "click",
    (e) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      // Locate the closest interactive container
      const clickable = target.closest(
        "button, a, select, input, [role='button'], .cursor-pointer, .btn-cyber"
      );
      if (!clickable) return;

      // 1. Toggle switch or checkbox
      if (
        (clickable.tagName === "INPUT" && (clickable as HTMLInputElement).type === "checkbox") ||
        clickable.classList.contains("toggle") ||
        clickable.getAttribute("role") === "switch"
      ) {
        soundEngine.play("toggle");
        return;
      }

      // 2. Select option or dropdown
      if (
        clickable.tagName === "SELECT" ||
        clickable.classList.contains("dropdown") ||
        clickable.getAttribute("role") === "listbox"
      ) {
        soundEngine.play("select");
        return;
      }

      // 3. Navigation link or navbar button
      if (
        clickable.classList.contains("nav-link") ||
        clickable.closest("nav") ||
        clickable.getAttribute("role") === "tab" ||
        clickable.closest(".glass-panel nav")
      ) {
        soundEngine.play("tick");
        return;
      }

      // 4. Close elements
      const text = clickable.textContent?.toLowerCase() || "";
      const label = clickable.getAttribute("aria-label")?.toLowerCase() || "";
      if (
        text.includes("close") ||
        text === "x" ||
        clickable.classList.contains("close-button") ||
        label.includes("close")
      ) {
        soundEngine.play("reverse-whoosh");
        return;
      }

      // 5. Activation or trigger controls
      if (
        text.includes("mitigate") ||
        text.includes("start simulation") ||
        text.includes("launch") ||
        text.includes("replay") ||
        clickable.classList.contains("btn-cyber-primary")
      ) {
        soundEngine.play("execute");
        return;
      }

      // Default: soft cyberpunk dok
      soundEngine.play("click");
    },
    { capture: true }
  );
}
