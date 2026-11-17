// Every sound is synthesised with Web Audio: no audio files. The world queues sound names,
// and this plays them once the player's first click or key press has unlocked audio.

const RECIPES = {
  hit: { wave: 'triangle', from: 520, to: 180, seconds: 0.09, volume: 0.22, noise: 0.12 },
  clink: { wave: 'square', from: 1400, to: 900, seconds: 0.05, volume: 0.08 },
  burst: { wave: 'sawtooth', from: 300, to: 60, seconds: 0.22, volume: 0.2, noise: 0.25 },
  spark: { wave: 'sine', from: 1100, to: 1700, seconds: 0.07, volume: 0.07 },
  pop: { wave: 'sine', from: 700, to: 1200, seconds: 0.06, volume: 0.1 },
  dash: { wave: 'sine', from: 300, to: 900, seconds: 0.14, volume: 0.12, noise: 0.1 },
  hurt: { wave: 'sawtooth', from: 220, to: 70, seconds: 0.4, volume: 0.3, noise: 0.3 },
  fall: { wave: 'sine', from: 500, to: 50, seconds: 1.1, volume: 0.3 },
  heal: { wave: 'sine', from: 600, to: 1200, seconds: 0.3, volume: 0.16 },
  spit: { wave: 'square', from: 260, to: 140, seconds: 0.1, volume: 0.06 },
  lunge: { wave: 'sawtooth', from: 160, to: 520, seconds: 0.18, volume: 0.1 },
  summon: { wave: 'triangle', from: 120, to: 260, seconds: 0.5, volume: 0.16 },
  flare: { wave: 'sawtooth', from: 180, to: 1400, seconds: 0.5, volume: 0.28, noise: 0.4 },
  boon: { wave: 'triangle', from: 520, to: 1040, seconds: 0.35, volume: 0.2 },
  waveStart: { wave: 'triangle', from: 220, to: 330, seconds: 0.5, volume: 0.18 },
  waveClear: { wave: 'triangle', from: 440, to: 880, seconds: 0.6, volume: 0.22 },
  bossDown: { wave: 'sawtooth', from: 400, to: 40, seconds: 1.6, volume: 0.35, noise: 0.5 },
};

export function createSoundEffects() {
  let context = null;
  let master = null;
  let noiseBuffer = null;
  let muted = false;
  const lastPlayed = {};

  function unlock() {
    if (context) {
      if (context.state === 'suspended') context.resume();
      return context;
    }
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    context = new AudioContextClass();
    master = context.createGain();
    master.gain.value = muted ? 0 : 0.8;
    master.connect(context.destination);
    noiseBuffer = context.createBuffer(1, context.sampleRate * 0.5, context.sampleRate);
    const samples = noiseBuffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
    return context;
  }

  function play(name) {
    const recipe = RECIPES[name];
    if (!context || !recipe || muted) return;
    const now = context.currentTime;
    if (now - (lastPlayed[name] ?? -1) < 0.03) return;
    lastPlayed[name] = now;

    const gain = context.createGain();
    gain.gain.setValueAtTime(recipe.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + recipe.seconds);
    gain.connect(master);

    const tone = context.createOscillator();
    tone.type = recipe.wave;
    tone.frequency.setValueAtTime(recipe.from, now);
    tone.frequency.exponentialRampToValueAtTime(recipe.to, now + recipe.seconds);
    tone.connect(gain);
    tone.start(now);
    tone.stop(now + recipe.seconds + 0.02);

    if (recipe.noise) {
      const hiss = context.createBufferSource();
      const hissGain = context.createGain();
      hiss.buffer = noiseBuffer;
      hissGain.gain.setValueAtTime(recipe.noise, now);
      hissGain.gain.exponentialRampToValueAtTime(0.001, now + recipe.seconds);
      hiss.connect(hissGain);
      hissGain.connect(master);
      hiss.start(now);
      hiss.stop(now + recipe.seconds);
    }
  }

  return {
    unlock,
    play,
    playQueued(names) {
      for (const name of names) play(name);
      names.length = 0;
    },
    toggleMute() {
      muted = !muted;
      if (master) master.gain.value = muted ? 0 : 0.8;
      return muted;
    },
    isMuted: () => muted,
    audioContext: () => context,
    output: () => master,
  };
}
