// The lantern on its thread: a weight the moth whirls. The faster it flies, the harder it burns.

import { LANTERN } from '../config.js';
import { clamp } from '../core/vec.js';

export function createLantern(moth, lengthScale = 1) {
  return {
    x: moth.x,
    y: moth.y + 40,
    lastX: moth.x,
    lastY: moth.y + 40,
    vx: 0,
    vy: 0,
    speed: 0,
    lengthScale,
    trail: [],
    trailClock: 0,
    emberClock: 0,
  };
}

export function threadLength(world, lantern) {
  return LANTERN.threadLength * world.boons.threadScale * lantern.lengthScale;
}

// Verlet step: the lantern keeps its momentum, and the thread pulls it back when taut.
export function updateLanternSwing(world, lantern, dt) {
  const moth = world.moth;
  let nextX = lantern.x + (lantern.x - lantern.lastX) * LANTERN.damping;
  let nextY = lantern.y + (lantern.y - lantern.lastY) * LANTERN.damping;

  const reach = threadLength(world, lantern);
  const dx = nextX - moth.x;
  const dy = nextY - moth.y;
  const stretch = Math.hypot(dx, dy);
  // The thread is stiff near the moth, so the lantern never hangs slack: it is always out
  // on its arc, between `slackLimit` of the thread and its full length, ready to be swung.
  const nearest = reach * LANTERN.slackLimit;
  const held = stretch > reach ? reach : stretch < nearest ? nearest : stretch;
  if (held !== stretch && stretch > 0.001) {
    nextX = moth.x + (dx / stretch) * held;
    nextY = moth.y + (dy / stretch) * held;
  }

  lantern.lastX = lantern.x;
  lantern.lastY = lantern.y;
  lantern.x = nextX;
  lantern.y = nextY;
  lantern.vx = (lantern.x - lantern.lastX) / dt;
  lantern.vy = (lantern.y - lantern.lastY) / dt;
  lantern.speed = Math.hypot(lantern.vx, lantern.vy);

  lantern.trailClock += dt;
  if (lantern.trailClock > 0.016) {
    lantern.trailClock = 0;
    lantern.trail.push({ x: lantern.x, y: lantern.y, heat: lanternHeat(lantern) });
    if (lantern.trail.length > 14) lantern.trail.shift();
  }
}

// 0 when it hangs still, 1 at a strong swing, up to 2.2 at a whip-crack.
export function lanternHeat(lantern) {
  return clamp(lantern.speed / LANTERN.referenceSpeed, 0, 2.2);
}

export function lanternDamage(world, lantern) {
  return world.boons.power * clamp(lanternHeat(lantern), 0.5, 2.2);
}

// A hit spends part of the swing, so a heavy blow has to be wound up again.
export function slowLanternAfterHit(lantern, kept = LANTERN.speedKeptOnHit) {
  lantern.lastX = lantern.x - (lantern.x - lantern.lastX) * kept;
  lantern.lastY = lantern.y - (lantern.y - lantern.lastY) * kept;
}

export function bounceLanternOff(lantern, fromX, fromY) {
  const dx = lantern.x - fromX;
  const dy = lantern.y - fromY;
  const gap = Math.hypot(dx, dy) || 1;
  const step = Math.hypot(lantern.x - lantern.lastX, lantern.y - lantern.lastY) * 0.6;
  lantern.lastX = lantern.x - (dx / gap) * step;
  lantern.lastY = lantern.y - (dy / gap) * step;
}
