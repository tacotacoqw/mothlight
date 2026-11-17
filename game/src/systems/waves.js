// The wave director: ten nights of gloom, each a named mix that opens through warning portals.
// From wave 3 on, every wave also draws an omen that bends its rules.

import { ARENA, TOTAL_WAVES } from '../config.js';
import { shuffleInPlace } from '../core/rng.js';
import { arenaCenter } from '../core/vec.js';
import { spawnEnemy } from '../entities/enemies.js';

export const WAVE_PLANS = [
  { name: 'First Dusk', mix: { wisp: 7 } },
  { name: 'Quick Shadows', mix: { wisp: 8, darter: 3 } },
  { name: 'Ink Rain', mix: { wisp: 7, spitter: 3, darter: 3, wilter: 1 } },
  { name: 'Hard Shells', mix: { wisp: 8, husk: 2, darter: 4, wilter: 2 } },
  { name: 'Twinshades', mix: { wisp: 7, twin: 4, spitter: 3, wilter: 2 } },
  { name: 'The Swarm', mix: { wisp: 20, darter: 6, wilter: 2 } },
  { name: 'Crossfire', mix: { spitter: 6, husk: 3, twin: 4, wisp: 5, wilter: 2 } },
  { name: 'Stampede', mix: { darter: 12, husk: 4, wisp: 8, wilter: 3 } },
  { name: 'Last Dark', mix: { wisp: 10, darter: 6, spitter: 5, husk: 4, twin: 5, wilter: 3 } },
  { name: 'The Eclipse', boss: 'eclipse', mix: {} },
];

export const OMENS = [
  { name: 'Swift Gloom', text: 'the gloom flies 20% faster', bend: (wave) => { wave.speedScale *= 1.2; } },
  { name: 'Thick Hides', text: 'the gloom is 30% tougher', bend: (wave) => { wave.hpScale *= 1.3; } },
  { name: 'Spark Shower', text: 'every burst drops 2 more sparks', bend: (wave) => { wave.bonusSparks = 2; } },
  { name: 'Restless Dark', text: 'portals open twice as fast', bend: (wave) => { wave.spawnPace = 0.5; } },
  { name: 'Rich Night', text: 'every burst scores x1.5', bend: (wave) => { wave.scoreScale = 1.5; } },
];

export function createWaveState() {
  return {
    number: 0, name: '', queue: [], total: 0, killed: 0, spawnClock: 0, cleared: false, clearClock: 0, bannerClock: 0, isBoss: false,
    hpScale: 1, speedScale: 1, scoreScale: 1, bonusSparks: 0, spawnPace: 1, omen: null,
  };
}

export function beginWave(world, number) {
  const plan = WAVE_PLANS[number - 1];
  const queue = [];
  for (const [kind, count] of Object.entries(plan.mix)) {
    for (let i = 0; i < count; i++) queue.push(kind);
  }
  shuffleInPlace(queue, world.rng);

  world.wave = {
    ...createWaveState(),
    number,
    name: plan.name,
    queue,
    total: queue.length + (plan.boss ? 1 : 0),
    spawnClock: 1.2,
    hpScale: 1 + (number - 1) * 0.07,
    speedScale: 1 + (number - 1) * 0.035,
    bannerClock: 2.4,
    isBoss: Boolean(plan.boss),
  };
  if (number >= 3 && !plan.boss) {
    world.wave.omen = world.rng.pick(OMENS);
    world.wave.omen.bend(world.wave);
  }
  if (plan.boss) {
    const center = arenaCenter();
    openPortal(world, plan.boss, center.x, ARENA.top + 130, 1.6);
  }
  world.sounds.push('waveStart');
}

export function updateWaveDirector(world, dt) {
  const wave = world.wave;
  wave.bannerClock = Math.max(0, wave.bannerClock - dt);

  for (const portal of world.portals) {
    portal.clock -= dt;
    if (portal.clock <= 0) spawnEnemy(world, portal.kind, portal.x, portal.y);
  }
  world.portals = world.portals.filter((portal) => portal.clock > 0);

  wave.spawnClock -= dt;
  const crowdLimit = 7 + wave.number * 2;
  const crowd = world.enemies.length + world.portals.length;
  if (wave.queue.length > 0 && wave.spawnClock <= 0 && crowd < crowdLimit) {
    const batch = Math.min(wave.queue.length, 2 + Math.floor(wave.number / 3));
    for (let i = 0; i < batch; i++) {
      const spot = pickSpawnSpot(world);
      openPortal(world, wave.queue.pop(), spot.x, spot.y, 0.9);
    }
    wave.spawnClock = Math.max(0.9, 2.3 - wave.number * 0.13) * wave.spawnPace;
  }

  if (!wave.cleared && wave.queue.length === 0 && world.portals.length === 0 && world.enemies.length === 0) {
    wave.cleared = true;
    wave.clearClock = 1.5;
    world.sounds.push('waveClear');
  }
  if (wave.cleared) wave.clearClock -= dt;
}

function openPortal(world, kind, x, y, seconds) {
  world.portals.push({ kind, x, y, clock: seconds, seconds });
}

// A spot inside the bed, well away from the moth, so nothing appears on top of the player.
function pickSpawnSpot(world) {
  let best = null;
  for (let attempt = 0; attempt < 8; attempt++) {
    const spot = {
      x: world.rng.range(ARENA.left + 50, ARENA.right - 50),
      y: world.rng.range(ARENA.top + 50, ARENA.bottom - 50),
    };
    const gap = Math.hypot(spot.x - world.moth.x, spot.y - world.moth.y);
    if (gap > 280) return spot;
    if (!best || gap > best.gap) best = { ...spot, gap };
  }
  return best;
}

export function isFinalWave(world) {
  return world.wave.number >= TOTAL_WAVES;
}

export function enemiesLeftInWave(world) {
  return Math.max(0, world.wave.total - world.wave.killed);
}

// What is still to come this wave, per kind of creature: queued, in a portal or alive.
export function incomingByKind(world) {
  const counts = new Map();
  const add = (kind) => counts.set(kind, (counts.get(kind) || 0) + 1);
  for (const kind of world.wave.queue) add(kind);
  for (const portal of world.portals) add(portal.kind);
  for (const enemy of world.enemies) add(enemy.kind);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

export function nextWaveName(world) {
  const plan = WAVE_PLANS[world.wave.number];
  return plan ? plan.name : null;
}
