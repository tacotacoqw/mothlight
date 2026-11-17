// Boons: the upgrade the player picks after each wave. Each one changes how the lantern plays.

import { createLantern } from '../entities/lantern.js';
import { healMoth } from '../entities/moth.js';
import { MOTH } from '../config.js';

export function createBoonStats() {
  return {
    threadScale: 1,
    power: 1,
    lanternScale: 1,
    moveScale: 1,
    dashCooldownScale: 1,
    magnetScale: 1,
    flareRate: 1,
    flareScale: 1,
    emberTrail: 0,
    dewOnClear: false,
    glowScale: 1,
    thornDash: 0,
    secondWind: 0,
    taken: {},
  };
}

export const BOONS = [
  {
    id: 'longThread', name: 'Long Thread', icon: 'thread', limit: 3,
    text: 'Thread +22% longer: a wider, faster swing.',
    grant: (world) => { world.boons.threadScale *= 1.22; },
  },
  {
    id: 'heavyLantern', name: 'Heavy Lantern', icon: 'lantern', limit: 3,
    text: 'Lantern hits 35% harder and grows.',
    grant: (world) => { world.boons.power *= 1.35; world.boons.lanternScale *= 1.14; },
  },
  {
    id: 'twinLantern', name: 'Twin Lantern', icon: 'twin', limit: 1,
    text: 'A second lantern on a shorter thread.',
    grant: (world) => { world.lanterns.push(createLantern(world.moth, 0.62)); },
  },
  {
    id: 'swiftWings', name: 'Swift Wings', icon: 'wing', limit: 2,
    text: 'Fly 14% faster. Dash recharges 25% sooner.',
    grant: (world) => { world.boons.moveScale *= 1.14; world.boons.dashCooldownScale *= 0.75; },
  },
  {
    id: 'spareWing', name: 'Spare Wing', icon: 'heart', limit: 3,
    text: '+1 wing, and mend every torn one.',
    grant: (world) => {
      world.moth.maxWings = Math.min(MOTH.maxWings, world.moth.maxWings + 1);
      healMoth(world, MOTH.maxWings);
    },
  },
  {
    id: 'sparkMagnet', name: 'Spark Magnet', icon: 'magnet', limit: 2,
    text: 'Sparks fly to you from twice as far.',
    grant: (world) => { world.boons.magnetScale *= 2; },
  },
  {
    id: 'brightFlare', name: 'Bright Flare', icon: 'flare', limit: 2,
    text: 'Flare charges 40% faster and reaches 25% further.',
    grant: (world) => { world.boons.flareRate *= 1.4; world.boons.flareScale *= 1.25; },
  },
  {
    id: 'emberTrail', name: 'Ember Trail', icon: 'ember', limit: 2,
    text: 'A fast lantern sheds embers that scorch the gloom.',
    grant: (world) => { world.boons.emberTrail += 1; },
  },
  {
    id: 'morningDew', name: 'Morning Dew', icon: 'dew', limit: 1,
    text: 'Mend one wing each time a wave is cleared.',
    grant: (world) => { world.boons.dewOnClear = true; },
  },
  {
    id: 'wideGlow', name: 'Wide Glow', icon: 'glow', limit: 2,
    text: 'The lantern wakes flowers 50% wider and faster.',
    grant: (world) => { world.boons.glowScale *= 1.5; },
  },
  {
    id: 'thornDash', name: 'Thorn Dash', icon: 'thorn', limit: 2,
    text: 'Your dash tears through the gloom it crosses.',
    grant: (world) => { world.boons.thornDash += 1; },
  },
  {
    id: 'secondWind', name: 'Second Wind', icon: 'phoenix', limit: 1,
    text: 'Once, a fatal blow leaves one wing and sets off a flare.',
    grant: (world) => { world.boons.secondWind += 1; },
  },
];

// The boons taken so far, with their level, for the HUD's list.
export function listTakenBoons(world) {
  return BOONS.filter((boon) => world.boons.taken[boon.id]).map((boon) => ({
    name: boon.name,
    level: world.boons.taken[boon.id],
    limit: boon.limit,
  }));
}

// Three different boons the player has not maxed out yet.
export function rollBoonChoices(world) {
  const open = BOONS.filter((boon) => (world.boons.taken[boon.id] || 0) < boon.limit);
  const choices = [];
  while (choices.length < 3 && open.length > 0) {
    const index = world.rng.int(0, open.length - 1);
    choices.push(open.splice(index, 1)[0]);
  }
  return choices;
}

export function grantBoon(world, boon) {
  boon.grant(world);
  world.boons.taken[boon.id] = (world.boons.taken[boon.id] || 0) + 1;
  world.sounds.push('boon');
}
