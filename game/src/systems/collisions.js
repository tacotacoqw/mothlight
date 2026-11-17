// Everything that touches: lantern on gloom, gloom on moth, ink, embers and the flare blast.

import { FLARE, LANTERN, MOTH, PALETTE } from '../config.js';
import { bounceLanternOff, lanternDamage, lanternHeat, slowLanternAfterHit } from '../entities/lantern.js';
import { damageEnemy } from '../entities/enemies.js';
import { popInkBlob } from '../entities/inkBlobs.js';
import { hurtMoth } from '../entities/moth.js';
import { spawnBurst, spawnRing } from '../effects/particles.js';
import { bloomFlowersNear } from './garden.js';

export function resolveLanternHits(world) {
  const lanternRadius = LANTERN.radius * world.boons.lanternScale;
  for (const lantern of world.lanterns) {
    for (const enemy of world.enemies) {
      if (enemy.hitCooldown > 0 || enemy.grow < 0.5 || enemy.hp <= 0) continue;
      if (Math.hypot(enemy.x - lantern.x, enemy.y - lantern.y) > enemy.radius + lanternRadius) continue;
      if (lantern.speed < LANTERN.minHitSpeed) continue;

      const heat = lanternHeat(lantern);
      enemy.hitCooldown = LANTERN.hitCooldown;
      if (heat < enemy.type.armor) {
        // Too slow for armour: the lantern glances off.
        bounceLanternOff(lantern, enemy.x, enemy.y);
        spawnBurst(world, lantern.x, lantern.y, PALETTE.textDim, 5, 140);
        world.sounds.push('clink');
        continue;
      }
      damageEnemy(world, enemy, lanternDamage(world, lantern), lantern.vx * 0.4, lantern.vy * 0.4);
      spawnBurst(world, lantern.x, lantern.y, PALETTE.amber, 6 + Math.round(heat * 5), 240);
      slowLanternAfterHit(lantern);
      world.sounds.push('hit');
      world.shake = Math.max(world.shake, 0.12 * heat);
      if (heat > 1.2) world.hitStop = 0.03;
    }

    for (const blob of world.inkBlobs) {
      if (lantern.speed < 160) continue;
      if (Math.hypot(blob.x - lantern.x, blob.y - lantern.y) < blob.radius + lanternRadius + 2) {
        popInkBlob(world, blob);
        world.score += 5;
      }
    }
  }
}

export function resolveMothContacts(world) {
  const moth = world.moth;
  if (moth.alive && moth.dashSeconds > 0 && world.boons.thornDash > 0) {
    // Thorn Dash: the dash itself cuts what it crosses.
    for (const enemy of world.enemies) {
      if (enemy.hitCooldown > 0 || enemy.hp <= 0 || enemy.grow < 1) continue;
      if (Math.hypot(enemy.x - moth.x, enemy.y - moth.y) < enemy.radius + MOTH.radius + 10) {
        enemy.hitCooldown = LANTERN.hitCooldown;
        damageEnemy(world, enemy, 1.5 * world.boons.thornDash, moth.dashX * 300, moth.dashY * 300);
        spawnBurst(world, enemy.x, enemy.y, PALETTE.mint, 10, 260);
        world.sounds.push('hit');
      }
    }
  }
  if (!moth.alive || moth.invulnerable > 0) return;
  for (const enemy of world.enemies) {
    if (enemy.grow < 1 || enemy.hp <= 0) continue;
    if (Math.hypot(enemy.x - moth.x, enemy.y - moth.y) < enemy.radius + MOTH.radius * 0.7) {
      hurtMoth(world);
      return;
    }
  }
  for (const blob of world.inkBlobs) {
    if (Math.hypot(blob.x - moth.x, blob.y - moth.y) < blob.radius + MOTH.radius * 0.7) {
      blob.age = Infinity;
      hurtMoth(world);
      return;
    }
  }
}

// A fast lantern with the Ember Trail boon leaves embers that scorch what walks through them.
export function updateEmbers(world, dt) {
  const level = world.boons.emberTrail;
  if (level > 0) {
    for (const lantern of world.lanterns) {
      lantern.emberClock -= dt;
      if (lantern.speed > 520 && lantern.emberClock <= 0) {
        lantern.emberClock = 0.07;
        world.embers.push({ x: lantern.x, y: lantern.y, age: 0, life: 1.1 + level * 0.4 });
      }
    }
  }
  for (const ember of world.embers) {
    ember.age += dt;
    for (const enemy of world.enemies) {
      if (enemy.emberCooldown > 0 || enemy.hp <= 0) continue;
      if (Math.hypot(enemy.x - ember.x, enemy.y - ember.y) < enemy.radius + 10) {
        enemy.emberCooldown = 0.35;
        damageEnemy(world, enemy, 0.45 * level);
      }
    }
  }
  world.embers = world.embers.filter((ember) => ember.age < ember.life);
}

// The flare: spend a full charge to burn everything near the moth and wake the flowers there.
export function releaseFlare(world) {
  const moth = world.moth;
  if (world.flareCharge < 1 || !moth.alive) return false;
  world.flareCharge = 0;
  const radius = FLARE.radius * world.boons.flareScale;
  for (const enemy of world.enemies) {
    const dx = enemy.x - moth.x;
    const dy = enemy.y - moth.y;
    const gap = Math.hypot(dx, dy) || 1;
    if (gap < radius + enemy.radius) damageEnemy(world, enemy, FLARE.damage, (dx / gap) * 420, (dy / gap) * 420);
  }
  for (const blob of world.inkBlobs) {
    if (Math.hypot(blob.x - moth.x, blob.y - moth.y) < radius) popInkBlob(world, blob);
  }
  bloomFlowersNear(world, moth.x, moth.y, radius);
  spawnRing(world, moth.x, moth.y, PALETTE.amber, radius, 0.5);
  spawnRing(world, moth.x, moth.y, PALETTE.cream, radius * 0.7, 0.35);
  spawnBurst(world, moth.x, moth.y, PALETTE.amber, 60, 560);
  world.shake = Math.max(world.shake, 0.7);
  world.stats.flares += 1;
  world.sounds.push('flare');
  return true;
}
