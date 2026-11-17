// Gloom creatures: spawning, the brain each kind runs, taking damage and bursting into sparks.

import { PALETTE } from '../config.js';
import { clampToArena } from '../core/vec.js';
import { ENEMY_TYPES } from './enemyTypes.js';
import { spawnBurst, spawnFloatingText, spawnRing } from '../effects/particles.js';
import { dropSparks } from './sparks.js';
import { spitInk } from './inkBlobs.js';
import { thinkEclipse, onEclipseDefeated } from './eclipseBoss.js';
import { comboMultiplier, registerKill } from '../systems/scoring.js';

export function spawnEnemy(world, kind, x, y) {
  const type = ENEMY_TYPES[kind];
  const hp = type.hp * (kind === 'eclipse' ? 1 : world.wave.hpScale);
  const enemy = {
    kind,
    type,
    x,
    y,
    vx: 0,
    vy: 0,
    knockX: 0,
    knockY: 0,
    hp,
    maxHp: hp,
    radius: type.radius,
    isBoss: kind === 'eclipse',
    hitCooldown: 0,
    emberCooldown: 0,
    flash: 0,
    grow: 0,
    wobble: world.rng.angle(),
    mode: 'stalk',
    timer: world.rng.range(0.6, 1.8),
    aimX: 0,
    aimY: 0,
    attackIndex: 0,
  };
  world.enemies.push(enemy);
  return enemy;
}

const BRAINS = { chase: thinkChase, lunge: thinkLunge, spit: thinkSpit, wilt: thinkWilt, eclipse: thinkEclipse };

export function updateEnemies(world, dt) {
  const moth = world.moth;
  for (const enemy of world.enemies) {
    enemy.grow = Math.min(1, enemy.grow + dt * 3);
    enemy.hitCooldown = Math.max(0, enemy.hitCooldown - dt);
    enemy.emberCooldown = Math.max(0, enemy.emberCooldown - dt);
    enemy.flash = Math.max(0, enemy.flash - dt);
    enemy.wobble += dt * 3;

    const dx = moth.x - enemy.x;
    const dy = moth.y - enemy.y;
    const gap = Math.hypot(dx, dy) || 1;
    BRAINS[enemy.type.brain](world, enemy, dx / gap, dy / gap, gap, dt);

    enemy.x += (enemy.vx + enemy.knockX) * dt;
    enemy.y += (enemy.vy + enemy.knockY) * dt;
    const drag = Math.max(0, 1 - 5 * dt);
    enemy.knockX *= drag;
    enemy.knockY *= drag;
    clampToArena(enemy, enemy.radius);
  }
  keepEnemiesApart(world.enemies);
}

function thinkChase(world, enemy, dirX, dirY) {
  const sway = Math.sin(enemy.wobble) * 0.45;
  const speed = enemy.type.speed * world.wave.speedScale;
  enemy.vx = (dirX - dirY * sway) * speed;
  enemy.vy = (dirY + dirX * sway) * speed;
}

function thinkLunge(world, enemy, dirX, dirY, gap, dt) {
  enemy.timer -= dt;
  const speed = enemy.type.speed * world.wave.speedScale;
  if (enemy.mode === 'stalk') {
    enemy.vx = dirX * speed;
    enemy.vy = dirY * speed;
    if (enemy.timer <= 0 && gap < 360) {
      enemy.mode = 'coil';
      enemy.timer = 0.5;
    }
  } else if (enemy.mode === 'coil') {
    enemy.vx = -dirX * 30;
    enemy.vy = -dirY * 30;
    enemy.aimX = dirX;
    enemy.aimY = dirY;
    if (enemy.timer <= 0) {
      enemy.mode = 'lunge';
      enemy.timer = 0.42;
      world.sounds.push('lunge');
    }
  } else if (enemy.mode === 'lunge') {
    enemy.vx = enemy.aimX * 640;
    enemy.vy = enemy.aimY * 640;
    if (enemy.timer <= 0) {
      enemy.mode = 'stalk';
      enemy.timer = world.rng.range(1, 1.9);
    }
  }
}

function thinkSpit(world, enemy, dirX, dirY, gap, dt) {
  enemy.timer -= dt;
  const speed = enemy.type.speed * world.wave.speedScale;
  const keepAway = gap < 250 ? -1 : gap > 400 ? 1 : 0;
  const strafe = Math.sin(enemy.wobble * 0.4) > 0 ? 1 : -1;
  enemy.vx = (dirX * keepAway - dirY * strafe * 0.6) * speed;
  enemy.vy = (dirY * keepAway + dirX * strafe * 0.6) * speed;
  if (enemy.timer <= 0 && enemy.grow >= 1) {
    enemy.timer = world.rng.range(2.1, 3);
    spitInk(world, enemy.x, enemy.y, dirX, dirY, 215);
    enemy.flash = 0.12;
  }
}

// The Wiltwing has no interest in the moth: it flits from bloom to bloom and withers them.
// Leave it alone and the garden bonus is gone; hunt it and the rest of the gloom closes in.
function thinkWilt(world, enemy, dirX, dirY, gap, dt) {
  enemy.timer -= dt;
  const speed = enemy.type.speed * world.wave.speedScale;
  if (enemy.timer <= 0 || !enemy.targetFlower || !enemy.targetFlower.bloomed) {
    enemy.timer = 1.2;
    enemy.targetFlower = nearestBloom(world, enemy);
  }
  const flower = enemy.targetFlower;
  if (!flower) {
    thinkChase(world, enemy, dirX, dirY);
    return;
  }
  const dx = flower.x - enemy.x;
  const dy = flower.y - enemy.y;
  const reach = Math.hypot(dx, dy) || 1;
  const pace = reach < 14 ? 0 : speed;
  enemy.vx = (dx / reach) * pace;
  enemy.vy = (dy / reach) * pace;
}

function nearestBloom(world, enemy) {
  let best = null;
  let bestGap = Infinity;
  for (const flower of world.garden.flowers) {
    if (!flower.bloomed) continue;
    const gap = Math.hypot(flower.x - enemy.x, flower.y - enemy.y);
    if (gap < bestGap) {
      best = flower;
      bestGap = gap;
    }
  }
  return best;
}

function keepEnemiesApart(enemies) {
  for (let i = 0; i < enemies.length; i++) {
    for (let j = i + 1; j < enemies.length; j++) {
      const a = enemies[i];
      const b = enemies[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const gap = Math.hypot(dx, dy) || 1;
      const overlap = a.radius + b.radius - gap;
      if (overlap <= 0) continue;
      const push = overlap / 2 / gap;
      if (!a.isBoss) { a.x -= dx * push; a.y -= dy * push; }
      if (!b.isBoss) { b.x += dx * push; b.y += dy * push; }
    }
  }
}

export function damageEnemy(world, enemy, amount, knockX = 0, knockY = 0) {
  if (enemy.hp <= 0) return;
  enemy.hp -= amount;
  enemy.flash = 0.14;
  if (!enemy.isBoss) {
    enemy.knockX += knockX;
    enemy.knockY += knockY;
  }
  if (enemy.hp <= 0) burstEnemy(world, enemy);
}

function burstEnemy(world, enemy) {
  const points = Math.round(enemy.type.score * comboMultiplier(world) * world.wave.scoreScale);
  registerKill(world, points);
  spawnFloatingText(world, enemy.x, enemy.y - enemy.radius, `+${points}`, PALETTE.amber, enemy.isBoss ? 40 : 20);
  spawnBurst(world, enemy.x, enemy.y, PALETTE.gloomRim, 14 + enemy.radius, 300);
  spawnBurst(world, enemy.x, enemy.y, PALETTE.amber, 8, 220);
  spawnRing(world, enemy.x, enemy.y, PALETTE.gloomRim, enemy.radius * 3);
  dropSparks(world, enemy.x, enemy.y, enemy.type.sparks + world.wave.bonusSparks);
  world.sounds.push(enemy.isBoss ? 'bossDown' : 'burst');
  world.shake = Math.max(world.shake, enemy.isBoss ? 1 : 0.22);

  if (enemy.type.splitsInto) {
    for (const side of [-1, 1]) {
      const child = spawnEnemy(world, enemy.type.splitsInto, enemy.x + side * 14, enemy.y);
      child.grow = 0.6;
      world.wave.total += 1;
      child.knockX = side * 260;
      child.knockY = world.rng.range(-160, 160);
    }
  }
  if (enemy.isBoss) onEclipseDefeated(world, enemy);
}

export function removeBurstEnemies(world) {
  world.enemies = world.enemies.filter((enemy) => enemy.hp > 0);
}
