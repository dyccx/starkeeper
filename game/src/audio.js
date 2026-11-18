// All sound is synthesised with WebAudio — no audio files, no network.
// A soft pad hums underneath; catches chime higher as the combo grows,
// glare hits thud, moon shards arpeggiate, and dawn plays a little fanfare.
export function createAudio() {
  let ctx = null;
  let master = null;
  let pad = null;
  let muted = false;

  function ensure() {
    if (ctx) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.5;
      master.connect(ctx.destination);
      startPad();
      return true;
    } catch {
      return false;
    }
  }

  function startPad() {
    pad = ctx.createGain();
    pad.gain.value = 0.05;
    pad.connect(master);
    for (const [freq, detune] of [
      [110, -4],
      [164.81, 3],
      [220, 0],
    ]) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.detune.value = detune;
      osc.connect(pad);
      osc.start();
    }
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.08;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.02;
    lfo.connect(lfoGain);
    lfoGain.connect(pad.gain);
    lfo.start();
  }

  function tone(freq, at, dur, type, vol, slideTo) {
    if (!ctx || !master) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, at);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, at + dur);
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(vol, at + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    osc.connect(gain);
    gain.connect(master);
    osc.start(at);
    osc.stop(at + dur + 0.05);
  }

  function noise(at, dur, vol, low) {
    if (!ctx || !master) return;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = low;
    const gain = ctx.createGain();
    gain.gain.value = vol;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    src.start(at);
  }

  return {
    /** Call from a user gesture (start / first key) so browsers allow sound. */
    unlock() {
      if (ensure() && ctx.state === 'suspended') ctx.resume().catch(() => {});
    },
    toggleMute() {
      muted = !muted;
      if (master) master.gain.value = muted ? 0 : 0.5;
      return muted;
    },
    get muted() {
      return muted;
    },
    catchStar(combo) {
      if (!ensure()) return;
      const t = ctx.currentTime;
      const base = 523.25 * Math.pow(1.059463, Math.min(combo, 12));
      tone(base, t, 0.22, 'sine', 0.22);
      tone(base * 1.5, t + 0.05, 0.26, 'sine', 0.16);
    },
    hit() {
      if (!ensure()) return;
      const t = ctx.currentTime;
      tone(140, t, 0.3, 'sawtooth', 0.2, 55);
      noise(t, 0.18, 0.25, 900);
    },
    shieldBreak() {
      if (!ensure()) return;
      const t = ctx.currentTime;
      tone(880, t, 0.12, 'triangle', 0.16, 220);
      noise(t, 0.12, 0.14, 2400);
    },
    shard() {
      if (!ensure()) return;
      const t = ctx.currentTime;
      [660, 830, 990, 1320].forEach((f, i) => tone(f, t + i * 0.06, 0.3, 'triangle', 0.14));
    },
    levelUp() {
      if (!ensure()) return;
      const t = ctx.currentTime;
      [392, 523.25, 659.25].forEach((f, i) => tone(f, t + i * 0.09, 0.35, 'triangle', 0.16));
    },
    dawn() {
      if (!ensure()) return;
      const t = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) =>
        tone(f, t + i * 0.12, 0.6, 'sine', 0.16),
      );
    },
    gameOver() {
      if (!ensure()) return;
      const t = ctx.currentTime;
      [392, 330, 262, 196].forEach((f, i) => tone(f, t + i * 0.16, 0.4, 'triangle', 0.14));
    },
  };
}
