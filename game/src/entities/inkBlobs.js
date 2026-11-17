// Ink the gloom spits at the moth. A moving lantern pops it for a few points.

import { ARENA, PALETTE } from '../config.js';
import { spawnBurst } from '../effects/particles.js';

export function spitInk(world, x, y, dirX, dirY, speed) {
  world.inkBlobs.push({ x, y, vx: dirX * speed, vy: dirY * speed, radius: 9, age: 0 });
  world.sounds.push('spit');
}

export function updateInkBlobs(world, dt) {
  for (const blob of world.inkBlobs) {
    blob.age += dt;
    blob.x += blob.vx * dt;
    blob.y += blob.vy * dt;
    const outside = blob.x < ARENA.left || blob.x > ARENA.right || blob.y < ARENA.top || blob.y > ARENA.bottom;
    if (outside) blob.age = Infinity;
  }
  world.inkBlobs = world.inkBlobs.filter((blob) => blob.age < 8);
}

export function popInkBlob(world, blob) {
  blob.age = Infinity;
  spawnBurst(world, blob.x, blob.y, PALETTE.ink, 8, 180);
  world.sounds.push('pop');
}
