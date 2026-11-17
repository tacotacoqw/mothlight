// The autopilot: a simple bot that plays by the same controls as the player. It flies the
// attract-mode demo behind the title screen and stages the game's screenshot scenes.

import { ARENA, LANTERN } from './config.js';
import { clamp } from './core/vec.js';

// How close the gloom may come before the pilot backs off: tight, so it keeps swinging.
const FLEE_RANGE = 84;

export function createAutopilot() {
  return { spin: 0, spinDirection: 1 };
}

// Returns the controls for this step: circle beside the nearest threat so the lantern whirls into it.
export function steerAutopilot(pilot, world, dt) {
  const moth = world.moth;
  const reach = LANTERN.threadLength * world.boons.threadScale;
  const controls = { useAim: true, aimX: moth.x, aimY: moth.y, moveX: 0, moveY: 0, dash: false, flare: false };

  let nearest = null;
  let nearestGap = Infinity;
  let crowd = 0;
  let fleeX = 0;
  let fleeY = 0;
  for (const enemy of world.enemies) {
    const gap = Math.hypot(enemy.x - moth.x, enemy.y - moth.y) - enemy.radius;
    if (gap < nearestGap) {
      nearest = enemy;
      nearestGap = gap;
    }
    if (gap < 270) crowd += enemy.isBoss ? 4 : 1;
    if (gap < FLEE_RANGE) {
      fleeX += ((moth.x - enemy.x) / (gap + enemy.radius)) * (FLEE_RANGE - gap);
      fleeY += ((moth.y - enemy.y) / (gap + enemy.radius)) * (FLEE_RANGE - gap);
    }
  }
  for (const blob of world.inkBlobs) {
    const gap = Math.hypot(blob.x - moth.x, blob.y - moth.y);
    if (gap < 110) {
      fleeX += ((moth.x - blob.x) / gap) * (110 - gap) * 1.5;
      fleeY += ((moth.y - blob.y) / gap) * (110 - gap) * 1.5;
    }
  }

  let centerX = (ARENA.left + ARENA.right) / 2;
  let centerY = (ARENA.top + ARENA.bottom) / 2;
  if (nearest) {
    const gap = Math.hypot(moth.x - nearest.x, moth.y - nearest.y) || 1;
    const stand = reach * 0.9 + nearest.radius;
    centerX = nearest.x + ((moth.x - nearest.x) / gap) * stand;
    centerY = nearest.y + ((moth.y - nearest.y) / gap) * stand;
  } else if (world.sparks.length > 0) {
    centerX = world.sparks[0].x;
    centerY = world.sparks[0].y;
  }
  centerX = clamp(centerX + fleeX * 0.7, ARENA.left + 96, ARENA.right - 96);
  centerY = clamp(centerY + fleeY * 0.7, ARENA.top + 96, ARENA.bottom - 96);

  // Wide, steady circles keep the lantern locked into a full-speed whirl.
  pilot.spin += dt * 7 * pilot.spinDirection;
  controls.aimX = centerX + Math.cos(pilot.spin) * 80;
  controls.aimY = centerY + Math.sin(pilot.spin) * 80;

  if (nearestGap < 30 && moth.dashCooldown <= 0) {
    controls.dash = true;
    controls.aimX = moth.x + fleeX * 10;
    controls.aimY = moth.y + fleeY * 10;
  }
  if (world.flareCharge >= 1 && crowd >= 4) controls.flare = true;
  return controls;
}
