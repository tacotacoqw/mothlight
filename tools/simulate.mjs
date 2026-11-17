// Balance check: lets the autopilot play whole runs headless and prints how far each one got.
//   node tools/simulate.mjs [runs] [firstSeed]

import { createWorld, startRun, stepWorld, chooseBoon } from '../game/src/world.js';
import { createAutopilot, steerAutopilot } from '../game/src/autopilot.js';
import { STEP_SECONDS } from '../game/src/config.js';

const runs = Number(process.argv[2] ?? 5);
const firstSeed = Number(process.argv[3] ?? 1);

for (let seed = firstSeed; seed < firstSeed + runs; seed++) {
  const world = startRun(createWorld(seed));
  const pilot = createAutopilot();
  const waveTimes = [];
  let steps = 0;
  while (world.phase !== 'gameOver' && world.phase !== 'victory' && steps < 120 * 60 * 30) {
    if (world.phase === 'choosingBoon') {
      waveTimes.push(Math.round(world.time));
      chooseBoon(world, world.rng.int(0, world.boonChoices.length - 1));
    }
    stepWorld(world, steerAutopilot(pilot, world, STEP_SECONDS), STEP_SECONDS);
    world.sounds.length = 0;
    steps += 1;
  }
  console.log(
    `seed ${seed}: ${world.phase} on wave ${world.wave.number}, score ${world.score}, ` +
      `${Math.round(world.time)}s, wings ${world.moth.wings}/${world.moth.maxWings}, ` +
      `garden ${Math.round(world.garden.litFraction * 100)}%, best combo ${world.combo.best}, wave ends at ${waveTimes.join(',')}`,
  );
}
