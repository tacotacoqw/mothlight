// The player's moth: steering towards the cursor or keys, the dash, and losing wings.

import { MOTH } from '../config.js';
import { arenaCenter, clampToArena } from '../core/vec.js';
import { spawnBurst } from '../effects/particles.js';
import { PALETTE } from '../config.js';

export function createMoth() {
  const center = arenaCenter();
  return {
    x: center.x,
    y: center.y + 60,
    vx: 0,
    vy: 0,
    facing: -Math.PI / 2,
    flap: 0,
    wings: MOTH.startWings,
    maxWings: MOTH.startWings,
    invulnerable: 0,
    dashSeconds: 0,
    dashCooldown: 0,
    dashX: 0,
    dashY: -1,
    alive: true,
  };
}

export function updateMoth(world, controls, dt) {
  const moth = world.moth;
  if (!moth.alive) return;
  const topSpeed = MOTH.speed * world.boons.moveScale;
  let wantX = 0;
  let wantY = 0;

  if (controls.useAim) {
    const dx = controls.aimX - moth.x;
    const dy = controls.aimY - moth.y;
    const gap = Math.hypot(dx, dy);
    if (gap > 2) {
      const speed = Math.min(topSpeed, gap * 9);
      wantX = (dx / gap) * speed;
      wantY = (dy / gap) * speed;
    }
  } else {
    const push = Math.hypot(controls.moveX, controls.moveY);
    if (push > 0) {
      wantX = (controls.moveX / push) * topSpeed;
      wantY = (controls.moveY / push) * topSpeed;
    }
  }

  if (controls.dash) startDash(world, wantX, wantY);

  if (moth.dashSeconds > 0) {
    moth.dashSeconds -= dt;
    moth.vx = moth.dashX * MOTH.dashSpeed;
    moth.vy = moth.dashY * MOTH.dashSpeed;
  } else {
    const blend = Math.min(1, MOTH.steering * dt);
    moth.vx += (wantX - moth.vx) * blend;
    moth.vy += (wantY - moth.vy) * blend;
  }

  moth.x += moth.vx * dt;
  moth.y += moth.vy * dt;
  clampToArena(moth, MOTH.radius);

  const speed = Math.hypot(moth.vx, moth.vy);
  if (speed > 40) moth.facing = Math.atan2(moth.vy, moth.vx);
  moth.flap += dt * (14 + speed * 0.03);
  moth.invulnerable = Math.max(0, moth.invulnerable - dt);
  moth.dashCooldown = Math.max(0, moth.dashCooldown - dt);
}

function startDash(world, wantX, wantY) {
  const moth = world.moth;
  if (moth.dashCooldown > 0 || moth.dashSeconds > 0) return;
  const push = Math.hypot(wantX, wantY);
  moth.dashX = push > 1 ? wantX / push : Math.cos(moth.facing);
  moth.dashY = push > 1 ? wantY / push : Math.sin(moth.facing);
  moth.dashSeconds = MOTH.dashSeconds;
  moth.dashCooldown = MOTH.dashCooldown * world.boons.dashCooldownScale;
  moth.invulnerable = Math.max(moth.invulnerable, MOTH.dashSeconds + 0.12);
  world.sounds.push('dash');
  spawnBurst(world, moth.x, moth.y, PALETTE.cream, 8, 160);
}

// Takes one wing off the moth; returns true when that was the last one.
export function hurtMoth(world) {
  const moth = world.moth;
  if (moth.invulnerable > 0 || !moth.alive) return false;
  moth.wings -= 1;
  moth.invulnerable = MOTH.hurtInvulnerable;
  world.combo.count = 0;
  world.combo.timer = 0;
  world.shake = Math.max(world.shake, 0.6);
  world.hurtFlash = 0.35;
  world.sounds.push('hurt');
  spawnBurst(world, moth.x, moth.y, PALETTE.coral, 22, 320);

  for (const enemy of world.enemies) {
    const dx = enemy.x - moth.x;
    const dy = enemy.y - moth.y;
    const gap = Math.hypot(dx, dy) || 1;
    if (gap < 220 && !enemy.isBoss) {
      enemy.knockX += (dx / gap) * 520;
      enemy.knockY += (dy / gap) * 520;
    }
  }

  if (moth.wings <= 0 && world.boons.secondWind > 0) {
    // The Second Wind boon: spend it to stay up on one wing.
    world.boons.secondWind -= 1;
    moth.wings = 1;
    world.flareCharge = 1;
    world.secondWindFlare = true;
    return false;
  }
  if (moth.wings <= 0) {
    moth.alive = false;
    world.shake = 1;
    world.sounds.push('fall');
    spawnBurst(world, moth.x, moth.y, PALETTE.cream, 40, 420);
    return true;
  }
  return false;
}

export function healMoth(world, wings = 1) {
  const moth = world.moth;
  moth.wings = Math.min(moth.maxWings, moth.wings + wings);
}
