// The night garden: flowers bloom in lantern light and wilt where the gloom walks.

import { ARENA, BLOOM_COLORS, GARDEN } from '../config.js';
import { lanternHeat } from '../entities/lantern.js';

export function plantGarden(rng) {
  const flowers = [];
  const columns = GARDEN.columns;
  const rows = Math.ceil(GARDEN.flowerCount / columns);
  const cellWidth = (ARENA.right - ARENA.left - 60) / columns;
  const cellHeight = (ARENA.bottom - ARENA.top - 60) / rows;
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      flowers.push({
        x: ARENA.left + 30 + (column + rng.range(0.15, 0.85)) * cellWidth,
        y: ARENA.top + 30 + (row + rng.range(0.15, 0.85)) * cellHeight,
        light: 0,
        bloomed: false,
        color: rng.pick(BLOOM_COLORS),
        size: rng.range(7, 12),
        sway: rng.angle(),
      });
    }
  }
  const tufts = [];
  for (let i = 0; i < 150; i++) {
    tufts.push({ x: rng.range(ARENA.left + 8, ARENA.right - 8), y: rng.range(ARENA.top + 8, ARENA.bottom - 8), lean: rng.range(-3, 3) });
  }
  return { flowers, tufts, litFraction: 0 };
}

export function updateGarden(world, dt) {
  const garden = world.garden;
  let bloomedCount = 0;
  for (const flower of garden.flowers) {
    for (const lantern of world.lanterns) {
      // Only a lantern in motion wakes flowers: a faster swing lights a wider path, sooner.
      const heat = lanternHeat(lantern);
      const reach = (40 + heat * 30) * world.boons.glowScale;
      if (heat > 0.3 && Math.abs(lantern.x - flower.x) < reach && Math.hypot(lantern.x - flower.x, lantern.y - flower.y) < reach) {
        flower.light = Math.min(1, flower.light + GARDEN.lightRate * heat * world.boons.glowScale * dt);
      }
    }
    for (const enemy of world.enemies) {
      const reach = enemy.radius + GARDEN.wiltReach;
      if (Math.abs(enemy.x - flower.x) < reach && Math.hypot(enemy.x - flower.x, enemy.y - flower.y) < reach) {
        flower.light = Math.max(0, flower.light - GARDEN.wiltRate * enemy.type.wilt * dt);
      }
    }
    if (!flower.bloomed && flower.light >= 1) {
      flower.bloomed = true;
      world.score += 2;
      world.stats.blooms += 1;
    } else if (flower.bloomed && flower.light <= 0) {
      flower.bloomed = false;
    }
    if (flower.bloomed) bloomedCount += 1;
  }
  garden.litFraction = bloomedCount / garden.flowers.length;
}

export function bloomFlowersNear(world, x, y, radius) {
  for (const flower of world.garden.flowers) {
    if (Math.hypot(flower.x - x, flower.y - y) < radius) flower.light = 1;
  }
}

export function gardenWaveBonus(world) {
  return Math.round(world.garden.litFraction * 100) * GARDEN.waveBonusPerPercent * world.wave.number;
}
