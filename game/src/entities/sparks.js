// Sparks and dew drops left by burst gloom: fly to the moth, feed the score and the flare.

import { FLARE, SPARK, PALETTE } from '../config.js';
import { clampToArena } from '../core/vec.js';
import { comboMultiplier } from '../systems/scoring.js';
import { healMoth } from './moth.js';
import { spawnFloatingText } from '../effects/particles.js';

export function dropSparks(world, x, y, count) {
  for (let i = 0; i < count; i++) {
    const angle = world.rng.angle();
    const pace = world.rng.range(60, 220);
    world.sparks.push({ kind: 'spark', x, y, vx: Math.cos(angle) * pace, vy: Math.sin(angle) * pace, age: 0 });
  }
  const moth = world.moth;
  if (moth.wings < moth.maxWings && world.rng.chance(0.05)) {
    world.sparks.push({ kind: 'dew', x, y, vx: 0, vy: -40, age: 0 });
  }
}

export function updateSparks(world, dt) {
  const moth = world.moth;
  const pullAll = world.wave.cleared;
  const magnet = SPARK.magnetRadius * world.boons.magnetScale;

  for (const spark of world.sparks) {
    spark.age += dt;
    const dx = moth.x - spark.x;
    const dy = moth.y - spark.y;
    const gap = Math.hypot(dx, dy) || 1;
    if (moth.alive && (pullAll || gap < magnet)) {
      const pull = pullAll ? 2600 : 1500;
      spark.vx += (dx / gap) * pull * dt;
      spark.vy += (dy / gap) * pull * dt;
    }
    const drag = Math.max(0, 1 - 2.6 * dt);
    spark.vx *= drag;
    spark.vy *= drag;
    spark.x += spark.vx * dt;
    spark.y += spark.vy * dt;
    clampToArena(spark, 6);

    if (moth.alive && gap < SPARK.collectRadius) {
      spark.age = Infinity;
      collectSpark(world, spark);
    }
  }
  world.sparks = world.sparks.filter((spark) => spark.age < SPARK.lifeSeconds);
}

function collectSpark(world, spark) {
  if (spark.kind === 'dew') {
    healMoth(world, 1);
    world.sounds.push('heal');
    spawnFloatingText(world, spark.x, spark.y, '+1 wing', PALETTE.mint, 22);
    return;
  }
  world.score += Math.round(SPARK.score * comboMultiplier(world));
  world.flareCharge = Math.min(1, world.flareCharge + FLARE.chargePerSpark * world.boons.flareRate);
  world.stats.sparks += 1;
  world.sounds.push('spark');
}
