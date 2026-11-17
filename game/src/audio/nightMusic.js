// A generative night tune: a soft drone and plucked pentatonic notes that quicken with the waves.

const SCALE = [220, 261.63, 293.66, 329.63, 392, 440, 523.25, 587.33];

export function createNightMusic(soundEffects) {
  let nextNoteAt = 0;
  let step = 0;
  let drone = null;

  function startDrone(context, output) {
    drone = context.createGain();
    drone.gain.value = 0.035;
    drone.connect(output);
    for (const pitch of [55, 82.5, 110]) {
      const voice = context.createOscillator();
      voice.type = 'sine';
      voice.frequency.value = pitch;
      voice.connect(drone);
      voice.start();
    }
  }

  function pluck(context, output, pitch, when, volume) {
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(volume, when + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.9);
    gain.connect(output);
    const voice = context.createOscillator();
    voice.type = 'triangle';
    voice.frequency.value = pitch;
    voice.connect(gain);
    voice.start(when);
    voice.stop(when + 1);
  }

  // Call every frame: schedules the next notes a little ahead. `intensity` runs 0 to 1.
  function update(intensity) {
    const context = soundEffects.audioContext();
    const output = soundEffects.output();
    if (!context || !output || context.state !== 'running') return;
    if (!drone) startDrone(context, output);
    const beat = 0.42 - intensity * 0.17;
    if (nextNoteAt < context.currentTime) nextNoteAt = context.currentTime + 0.05;
    while (nextNoteAt < context.currentTime + 0.25) {
      const pattern = [0, 2, 4, 2, 5, 4, 2, 1, 0, 3, 4, 6, 5, 3, 2, 4];
      const note = pattern[step % pattern.length];
      if (step % 2 === 0 || intensity > 0.4) pluck(context, output, SCALE[note], nextNoteAt, 0.05);
      if (step % 8 === 0) pluck(context, output, SCALE[note] / 2, nextNoteAt, 0.07);
      step += 1;
      nextNoteAt += beat;
    }
  }

  return { update };
}
