// The Eclipse, boss of the last wave: it cycles ink rings, summoned gloomlings and a charge.

import { PALETTE } from '../config.js';
import { spawnEnemy } from './enemies.js';
import { spitInk } from './inkBlobs.js';
import { spawnBurst, spawnRing } from '../effects/particles.js';

const ATTACK_CYCLE = ['inkRing', 'summon', 'charge', 'inkSpiral'];

export function thinkEclipse(world, boss, dirX, dirY, gap, dt) {
  boss.timer -= dt;
  const enraged = boss.hp < boss.maxHp * 0.45;

  if (boss.mode === 'windup') {
    boss.vx = -boss.aimX * 40;
    boss.vy = -boss.aimY * 40;
    if (boss.timer <= 0) {
      boss.mode = 'charge';
      boss.timer = 0.75;
      world.sounds.push('lunge');
    }
    return;
  }
  if (boss.mode === 'charge') {
    boss.vx = boss.aimX * 560;
    boss.vy = boss.aimY * 560;
    if (boss.timer <= 0) {
      boss.mode = 'stalk';
      boss.timer = enraged ? 1.3 : 2;
    }
    return;
  }

  boss.vx = dirX * boss.type.speed;
  boss.vy = dirY * boss.type.speed;
  if (boss.timer > 0 || boss.grow < 1) return;

  const attack = ATTACK_CYCLE[boss.attackIndex % ATTACK_CYCLE.length];
  boss.attackIndex += 1;
  boss.timer = enraged ? 1.9 : 2.8;
  boss.flash = 0.2;

  if (attack === 'inkRing') castInkRing(world, boss, enraged ? 18 : 13, 0);
  if (attack === 'inkSpiral') {
    castInkRing(world, boss, 9, 0.35);
    castInkRing(world, boss, 9, 0.7);
  }
  if (attack === 'summon') summonGloomlings(world, boss, enraged ? 4 : 3);
  if (attack === 'charge') {
    boss.mode = 'windup';
    boss.timer = 0.85;
    boss.aimX = dirX;
    boss.aimY = dirY;
    spawnRing(world, boss.x, boss.y, PALETTE.coral, boss.radius * 2.2, 0.8);
  }
}

function castInkRing(world, boss, count, twist) {
  for (let i = 0; i < count; i++) {
    const angle = twist + (i / count) * Math.PI * 2;
    const dirX = Math.cos(angle);
    const dirY = Math.sin(angle);
    spitInk(world, boss.x + dirX * boss.radius, boss.y + dirY * boss.radius, dirX, dirY, 170 + twist * 80);
  }
}

function summonGloomlings(world, boss, count) {
  if (world.enemies.length > 12) return;
  for (let i = 0; i < count; i++) {
    const angle = world.rng.angle();
    const kind = i === 0 ? 'darter' : 'wisp';
    const child = spawnEnemy(world, kind, boss.x + Math.cos(angle) * 80, boss.y + Math.sin(angle) * 80);
    world.wave.total += 1;
    child.knockX = Math.cos(angle) * 300;
    child.knockY = Math.sin(angle) * 300;
  }
  world.sounds.push('summon');
}

// The night breaks with the boss: everything else bursts and the ink clears.
export function onEclipseDefeated(world, boss) {
  for (const enemy of world.enemies) {
    if (enemy === boss || enemy.hp <= 0) continue;
    enemy.hp = 0;
    spawnBurst(world, enemy.x, enemy.y, PALETTE.gloomRim, 16, 260);
  }
  world.inkBlobs = [];
  world.wave.queue = [];
  world.portals = [];
  spawnRing(world, boss.x, boss.y, PALETTE.amber, 700, 1.4);
  spawnBurst(world, boss.x, boss.y, PALETTE.amber, 80, 620);
}
