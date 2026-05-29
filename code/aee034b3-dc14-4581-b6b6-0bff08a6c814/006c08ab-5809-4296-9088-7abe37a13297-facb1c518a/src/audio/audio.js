function nowMs() {
  return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
}

export function createAudio() {
  const api = {
    enabled: false,
    unlocked: false,
    muted: false,
    unlock,
    setMuted,
    play,
    startAmbience,
    stopAmbience
  };

  let ctx = null;
  let master = null;
  let ambience = null;

  function ensure() {
    if (ctx) return true;
    const Ctor = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!Ctor) return false;
    ctx = new Ctor({ latencyHint: 'interactive' });
    master = ctx.createGain();
    master.gain.value = 0.55;
    master.connect(ctx.destination);
    api.enabled = true;
    return true;
  }

  async function unlock() {
    if (api.unlocked) return true;
    if (!ensure()) return false;
    try {
      if (ctx.state !== 'running') await ctx.resume();
      api.unlocked = ctx.state === 'running';
      if (api.unlocked) startAmbience();
      return api.unlocked;
    } catch {
      return false;
    }
  }

  function setMuted(m) {
    api.muted = !!m;
    if (master) master.gain.value = api.muted ? 0 : 0.55;
  }

  function env(g, t0, a, d) {
    g.gain.cancelScheduledValues(t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(a, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + Math.max(0.02, d));
  }

  function tone({ freq = 440, type = 'sine', dur = 0.08, gain = 0.35, detune = 0 } = {}) {
    if (!api.enabled || !api.unlocked || api.muted) return;
    const t0 = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    o.detune.value = detune;
    o.connect(g);
    g.connect(master);
    env(g, t0, gain, dur);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  }

  function noise({ dur = 0.08, gain = 0.18 } = {}) {
    if (!api.enabled || !api.unlocked || api.muted) return;
    const t0 = ctx.currentTime;
    const b = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i += 1) d[i] = (Math.random() * 2 - 1) * 0.7;
    const s = ctx.createBufferSource();
    const g = ctx.createGain();
    s.buffer = b;
    s.connect(g);
    g.connect(master);
    env(g, t0, gain, dur);
    s.start(t0);
    s.stop(t0 + dur + 0.02);
  }

  function play(name) {
    if (!api.enabled || !api.unlocked || api.muted) return;
    if (name === 'shoot') {
      tone({ freq: 120, type: 'square', dur: 0.06, gain: 0.22 });
      noise({ dur: 0.04, gain: 0.14 });
      return;
    }
    if (name === 'hit') {
      tone({ freq: 660, type: 'sawtooth', dur: 0.05, gain: 0.18, detune: -20 });
      return;
    }
    if (name === 'hurt') {
      tone({ freq: 180, type: 'triangle', dur: 0.12, gain: 0.25 });
      return;
    }
    if (name === 'win') {
      tone({ freq: 523.25, type: 'triangle', dur: 0.09, gain: 0.22 });
      tone({ freq: 659.25, type: 'triangle', dur: 0.11, gain: 0.20, detune: 10 });
      tone({ freq: 783.99, type: 'triangle', dur: 0.13, gain: 0.18, detune: 20 });
      return;
    }
    if (name === 'lose') {
      tone({ freq: 220, type: 'sawtooth', dur: 0.18, gain: 0.22 });
      tone({ freq: 110, type: 'sawtooth', dur: 0.22, gain: 0.18 });
      return;
    }
    if (name === 'ui') {
      tone({ freq: 880, type: 'sine', dur: 0.04, gain: 0.10 });
    }
  }

  function startAmbience() {
    if (!api.enabled || !api.unlocked || api.muted) return;
    if (ambience) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const lfo = ctx.createOscillator();
    const lfoG = ctx.createGain();

    o.type = 'sine';
    o.frequency.value = 55;
    g.gain.value = 0.04;

    lfo.type = 'sine';
    lfo.frequency.value = 0.08;
    lfoG.gain.value = 10;

    lfo.connect(lfoG);
    lfoG.connect(o.frequency);

    o.connect(g);
    g.connect(master);

    o.start();
    lfo.start();
    ambience = { o, g, lfo, lfoG, startedAt: nowMs() };
  }

  function stopAmbience() {
    if (!ambience) return;
    try {
      ambience.o.stop();
      ambience.lfo.stop();
    } catch {
      // ignore
    }
    ambience = null;
  }

  return api;
}
