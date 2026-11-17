// Sparks, bursts, shockwave rings and floating score text: feedback for every action.

const MAX_PARTICLES = 420;

export function spawnBurst(world, x, y, color, count, speed) {
  for (let i = 0; i < count && world.particles.length < MAX_PARTICLES; i++) {
    const angle = world.rng.angle();
    const pace = speed * world.rng.range(0.25, 1);
    world.particles.push({
      x,
      y,
      vx: Math.cos(angle) * pace,
      vy: Math.sin(angle) * pace,
      life: world.rng.range(0.25, 0.7),
      age: 0,
      size: world.rng.range(1.5, 4),
      color,
    });
  }
}

export function spawnRing(world, x, y, color, maxRadius, seconds = 0.45) {
  world.rings.push({ x, y, color, maxRadius, seconds, age: 0 });
}

export function spawnFloatingText(world, x, y, text, color, size = 20) {
  world.floaters.push({ x, y, text, color, size, age: 0, life: 0.9 });
  if (world.floaters.length > 40) world.floaters.shift();
}

export function updateParticles(world, dt) {
  for (const p of world.particles) {
    p.age += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 1 - 3.2 * dt;
    p.vy *= 1 - 3.2 * dt;
  }
  world.particles = world.particles.filter((p) => p.age < p.life);

  for (const ring of world.rings) ring.age += dt;
  world.rings = world.rings.filter((ring) => ring.age < ring.seconds);

  for (const floater of world.floaters) {
    floater.age += dt;
    floater.y -= 42 * dt;
  }
  world.floaters = world.floaters.filter((floater) => floater.age < floater.life);
}
