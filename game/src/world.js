// The world of one run: its state, the fixed simulation step, and the rules for winning and losing.

import { createRng } from './core/rng.js';
import { createMoth, updateMoth, healMoth } from './entities/moth.js';
import { createLantern, updateLanternSwing } from './entities/lantern.js';
import { updateEnemies, removeBurstEnemies } from './entities/enemies.js';
import { updateInkBlobs } from './entities/inkBlobs.js';
import { updateSparks } from './entities/sparks.js';
import { updateParticles, spawnFloatingText } from './effects/particles.js';
import { plantGarden, updateGarden, gardenWaveBonus } from './systems/garden.js';
import { beginWave, createWaveState, isFinalWave, updateWaveDirector } from './systems/waves.js';
import { createBoonStats, grantBoon, rollBoonChoices } from './systems/boons.js';
import { createCombo, updateCombo } from './systems/scoring.js';
import { releaseFlare, resolveLanternHits, resolveMothContacts, updateEmbers } from './systems/collisions.js';
import { PALETTE } from './config.js';

// phase: 'playing' | 'choosingBoon' | 'gameOver' | 'victory'
export function createWorld(seed) {
  const rng = createRng(seed);
  const moth = createMoth();
  return {
    seed,
    rng,
    phase: 'playing',
    time: 0,
    score: 0,
    moth,
    lanterns: [createLantern(moth)],
    enemies: [],
    portals: [],
    inkBlobs: [],
    sparks: [],
    embers: [],
    particles: [],
    rings: [],
    floaters: [],
    garden: plantGarden(rng),
    wave: createWaveState(),
    boons: createBoonStats(),
    boonChoices: [],
    lastGardenBonus: 0,
    combo: createCombo(),
    stats: { kills: 0, sparks: 0, blooms: 0, flares: 0 },
    flareCharge: 0,
    shake: 0,
    hitStop: 0,
    hurtFlash: 0,
    fallClock: 0,
    secondWindFlare: false,
    sounds: [],
  };
}

export function startRun(world) {
  beginWave(world, 1);
  return world;
}

// One fixed step of play. `controls` comes from the player's input or from the autopilot.
export function stepWorld(world, controls, dt) {
  if (world.phase !== 'playing') return;
  if (world.hitStop > 0) {
    world.hitStop -= dt;
    return;
  }
  world.time += dt;
  world.shake = Math.max(0, world.shake - dt * 2.4);
  world.hurtFlash = Math.max(0, world.hurtFlash - dt);

  updateMoth(world, controls, dt);
  if (controls.flare || world.secondWindFlare) releaseFlare(world);
  world.secondWindFlare = false;
  for (const lantern of world.lanterns) updateLanternSwing(world, lantern, dt);

  updateWaveDirector(world, dt);
  updateEnemies(world, dt);
  updateInkBlobs(world, dt);
  resolveLanternHits(world);
  resolveMothContacts(world);
  updateEmbers(world, dt);
  removeBurstEnemies(world);
  updateSparks(world, dt);
  updateGarden(world, dt);
  updateParticles(world, dt);
  updateCombo(world, dt);

  if (!world.moth.alive) {
    world.fallClock += dt;
    if (world.fallClock > 1.3) world.phase = 'gameOver';
    return;
  }
  if (world.wave.cleared && world.wave.clearClock <= 0) finishWave(world);
}

function finishWave(world) {
  world.lastGardenBonus = gardenWaveBonus(world);
  world.score += world.lastGardenBonus;
  if (world.boons.dewOnClear) healMoth(world, 1);
  if (isFinalWave(world)) {
    world.score += world.moth.wings * 500;
    world.phase = 'victory';
    return;
  }
  world.boonChoices = rollBoonChoices(world);
  world.phase = 'choosingBoon';
}

// The player picked a boon card: grant it and open the next wave.
export function chooseBoon(world, index) {
  const boon = world.boonChoices[index];
  if (world.phase !== 'choosingBoon' || !boon) return false;
  grantBoon(world, boon);
  spawnFloatingText(world, world.moth.x, world.moth.y - 30, boon.name, PALETTE.mint, 24);
  world.boonChoices = [];
  world.phase = 'playing';
  beginWave(world, world.wave.number + 1);
  return true;
}
