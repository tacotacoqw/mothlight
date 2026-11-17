// Hand-drawn canvas sprites: the moth, its lantern and thread, and every creature of the gloom.

import { LANTERN, PALETTE } from '../config.js';
import { lanternHeat, threadLength } from '../entities/lantern.js';
import { ENEMY_TYPES } from '../entities/enemyTypes.js';
import { paintGlow } from './paint.js';

export function paintMoth(ctx, moth, scale = 1.55) {
  if (!moth.alive) return;
  const beat = 0.8 + 0.2 * Math.sin(moth.flap);
  paintGlow(ctx, moth.x, moth.y, 58, PALETTE.cream, 0.45);
  ctx.save();
  ctx.translate(moth.x, moth.y);
  ctx.rotate(moth.facing + Math.PI / 2);
  ctx.scale(scale, scale);
  if (moth.invulnerable > 0 && Math.floor(moth.invulnerable * 14) % 2 === 0) ctx.globalAlpha = 0.45;

  for (const side of [-1, 1]) {
    ctx.save();
    ctx.scale(side * beat, 1);
    ctx.beginPath();
    ctx.moveTo(1, -5);
    ctx.bezierCurveTo(10, -26, 34, -20, 27, -2);
    ctx.bezierCurveTo(22, 6, 8, 5, 1, 1);
    ctx.fillStyle = PALETTE.cream;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(1, 1);
    ctx.bezierCurveTo(10, 4, 22, 12, 15, 20);
    ctx.bezierCurveTo(8, 24, 3, 14, 1, 7);
    ctx.fillStyle = '#f3cf9a';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(19, -9, 4, 0, Math.PI * 2);
    ctx.fillStyle = PALETTE.ember;
    ctx.fill();
    ctx.restore();
  }

  ctx.beginPath();
  ctx.ellipse(0, 3, 4.6, 11, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#7b5a48';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, -9, 4.4, 0, Math.PI * 2);
  ctx.fillStyle = '#5d4336';
  ctx.fill();
  ctx.strokeStyle = PALETTE.cream;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-2, -12);
  ctx.quadraticCurveTo(-7, -20, -10, -19);
  ctx.moveTo(2, -12);
  ctx.quadraticCurveTo(7, -20, 10, -19);
  ctx.stroke();
  ctx.restore();
}

export function paintThread(ctx, world, lantern) {
  const moth = world.moth;
  if (!moth.alive) return;
  const dx = lantern.x - moth.x;
  const dy = lantern.y - moth.y;
  const gap = Math.hypot(dx, dy) || 1;
  const slack = Math.max(0, threadLength(world, lantern) - gap) * 0.4;
  ctx.beginPath();
  ctx.moveTo(moth.x, moth.y);
  ctx.quadraticCurveTo(moth.x + dx / 2 - (dy / gap) * slack, moth.y + dy / 2 + (dx / gap) * slack, lantern.x, lantern.y);
  ctx.strokeStyle = 'rgba(255, 240, 207, 0.75)';
  ctx.lineWidth = 1.6;
  ctx.stroke();
}

export function paintLantern(ctx, world, lantern) {
  if (!world.moth.alive) return;
  const heat = lanternHeat(lantern);
  const radius = LANTERN.radius * world.boons.lanternScale;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  lantern.trail.forEach((point, index) => {
    const fade = (index + 1) / lantern.trail.length;
    ctx.globalAlpha = fade * 0.28 * Math.min(1, point.heat);
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius * (0.4 + fade * 0.6), 0, Math.PI * 2);
    ctx.fillStyle = PALETTE.ember;
    ctx.fill();
  });
  ctx.restore();

  paintGlow(ctx, lantern.x, lantern.y, 70 + heat * 55, PALETTE.amber, 0.5 + Math.min(0.4, heat * 0.25));

  const body = ctx.createRadialGradient(lantern.x - 3, lantern.y - 4, 2, lantern.x, lantern.y, radius);
  body.addColorStop(0, '#fffbe6');
  body.addColorStop(0.45, PALETTE.amber);
  body.addColorStop(1, PALETTE.ember);
  ctx.beginPath();
  ctx.arc(lantern.x, lantern.y, radius, 0, Math.PI * 2);
  ctx.fillStyle = body;
  ctx.fill();
  ctx.strokeStyle = '#7a4a18';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(lantern.x - radius, lantern.y);
  ctx.lineTo(lantern.x + radius, lantern.y);
  ctx.moveTo(lantern.x, lantern.y - radius);
  ctx.lineTo(lantern.x, lantern.y + radius);
  ctx.globalAlpha = 0.45;
  ctx.stroke();
  ctx.globalAlpha = 1;
}

const ENEMY_PAINTERS = {
  wisp: paintWisp, darter: paintDarter, spitter: paintSpitter, husk: paintHusk, twin: paintTwin, wilter: paintWilter, eclipse: paintEclipse,
};

// A small portrait of a creature for the HUD's lists and the title screen's bestiary.
export function paintEnemyIcon(ctx, kind, x, y, size) {
  const type = ENEMY_TYPES[kind];
  const scale = size / type.radius;
  const model = { kind, type, radius: type.radius, wobble: 0, mode: 'stalk', aimX: 1, aimY: 0, vx: 1, vy: 0, flash: 0 };
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = PALETTE.gloomBody;
  ctx.strokeStyle = PALETTE.gloomRim;
  ctx.lineWidth = Math.min(3, 2 / scale);
  ENEMY_PAINTERS[kind](ctx, model, 0, 0);
  ctx.restore();
}

export function paintEnemy(ctx, enemy, moth, time) {
  const look = Math.atan2(moth.y - enemy.y, moth.x - enemy.x);
  paintGloomAura(ctx, enemy);
  ctx.save();
  ctx.translate(enemy.x, enemy.y);
  ctx.scale(enemy.grow, enemy.grow);
  ctx.fillStyle = enemy.flash > 0 ? '#ffffff' : PALETTE.gloomBody;
  ctx.strokeStyle = enemy.flash > 0 ? '#ffffff' : PALETTE.gloomRim;
  ctx.lineWidth = 3;
  ENEMY_PAINTERS[enemy.kind](ctx, enemy, look, time);
  ctx.restore();

  if (!enemy.isBoss && enemy.hp < enemy.maxHp && enemy.maxHp > 2.5) {
    const width = enemy.radius * 1.6;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(enemy.x - width / 2, enemy.y - enemy.radius - 12, width, 4);
    ctx.fillStyle = PALETTE.coral;
    ctx.fillRect(enemy.x - width / 2, enemy.y - enemy.radius - 12, width * Math.max(0, enemy.hp / enemy.maxHp), 4);
  }
}

// The pool of darkness each creature carries: it dims the garden around it and makes it stand out.
function paintGloomAura(ctx, enemy) {
  const reach = (enemy.radius + 48) * enemy.grow;
  if (reach < 2) return;
  const aura = ctx.createRadialGradient(enemy.x, enemy.y, enemy.radius * 0.5, enemy.x, enemy.y, reach);
  aura.addColorStop(0, 'rgba(6, 3, 18, 0.85)');
  aura.addColorStop(0.6, 'rgba(10, 5, 28, 0.55)');
  aura.addColorStop(1, 'rgba(10, 5, 28, 0)');
  ctx.beginPath();
  ctx.arc(enemy.x, enemy.y, reach, 0, Math.PI * 2);
  ctx.fillStyle = aura;
  ctx.fill();
}

function paintEyes(ctx, look, spread, forward, size) {
  ctx.fillStyle = PALETTE.gloomEye;
  for (const side of [-1, 1]) {
    const x = Math.cos(look) * forward - Math.sin(look) * spread * side;
    const y = Math.sin(look) * forward + Math.cos(look) * spread * side;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function paintWisp(ctx, enemy, look, time) {
  const r = enemy.radius;
  ctx.beginPath();
  for (let i = 0; i <= 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    const ripple = 1 + 0.12 * Math.sin(angle * 4 + time * 5 + enemy.wobble);
    const x = Math.cos(angle) * r * ripple;
    const y = Math.sin(angle) * r * ripple;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  paintEyes(ctx, look, 5, r * 0.35, 3);
}

function paintDarter(ctx, enemy, look) {
  const r = enemy.radius;
  const heading = enemy.mode === 'stalk' ? look : Math.atan2(enemy.aimY, enemy.aimX);
  ctx.rotate(heading);
  if (enemy.mode === 'coil') ctx.strokeStyle = PALETTE.coral;
  ctx.beginPath();
  ctx.moveTo(r * 1.5, 0);
  ctx.lineTo(-r * 0.9, r * 0.95);
  ctx.lineTo(-r * 0.35, 0);
  ctx.lineTo(-r * 0.9, -r * 0.95);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = PALETTE.gloomEye;
  ctx.beginPath();
  ctx.arc(r * 0.45, 0, 3.4, 0, Math.PI * 2);
  ctx.fill();
}

function paintSpitter(ctx, enemy, look) {
  const r = enemy.radius;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  for (let i = 0; i < 3; i++) {
    const angle = look + Math.PI + (i - 1) * 0.8;
    ctx.beginPath();
    ctx.arc(Math.cos(angle) * r, Math.sin(angle) * r, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(Math.cos(look) * r * 0.5, Math.sin(look) * r * 0.5, 6, 0, Math.PI * 2);
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 3.5;
  ctx.stroke();
  paintEyes(ctx, look, 8, -1, 2.6);
}

function paintHusk(ctx, enemy, look) {
  const r = enemy.radius;
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2 + Math.PI / 6;
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
  }
  ctx.stroke();
  paintEyes(ctx, look, 6, r * 0.42, 3);
}

function paintTwin(ctx, enemy, look) {
  const r = enemy.radius;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(side * r * 0.5, 0, r * 0.72, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(side * r * 0.5, 0);
    paintEyes(ctx, look, 3.5, r * 0.25, 2.4);
    ctx.restore();
  }
}

function paintWilter(ctx, enemy, look, time) {
  const r = enemy.radius;
  const beat = Math.sin(time * 20 + enemy.wobble) * 0.3;
  ctx.rotate(Math.atan2(enemy.vy, enemy.vx));
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(r * 0.3, 0);
    ctx.quadraticCurveTo(-r * 0.2, side * r * (1.9 + beat), -r * 1.7, side * r * (1.3 + beat));
    ctx.quadraticCurveTo(-r * 0.7, side * r * 0.5, -r * 0.6, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.95, r * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = PALETTE.mint;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(r * 0.5, side * r * 0.2, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function paintEclipse(ctx, enemy, look, time) {
  const r = enemy.radius;
  const angry = enemy.mode === 'windup' || enemy.mode === 'charge';
  ctx.save();
  ctx.rotate(time * 0.5);
  ctx.strokeStyle = angry ? PALETTE.coral : PALETTE.gloomRim;
  ctx.lineWidth = 3;
  for (let i = 0; i < 18; i++) {
    const angle = (i / 18) * Math.PI * 2;
    const reach = r + 10 + 9 * Math.sin(time * 4 + i * 1.7);
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * (r + 2), Math.sin(angle) * (r + 2));
    ctx.lineTo(Math.cos(angle) * reach, Math.sin(angle) * reach);
    ctx.stroke();
  }
  ctx.restore();
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = enemy.flash > 0 ? '#ffffff' : angry ? PALETTE.coral : PALETTE.amber;
  ctx.stroke();
  const eyeX = Math.cos(look) * r * 0.35;
  const eyeY = Math.sin(look) * r * 0.35;
  ctx.beginPath();
  ctx.ellipse(eyeX, eyeY, 20, 12, look + Math.PI / 2, 0, Math.PI * 2);
  ctx.fillStyle = PALETTE.gloomEye;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(eyeX, eyeY, 5, 0, Math.PI * 2);
  ctx.fillStyle = PALETTE.gloomBody;
  ctx.fill();
}

export function paintPortal(ctx, portal, time) {
  const left = portal.clock / portal.seconds;
  const big = portal.kind === 'eclipse' ? 2.6 : 1;
  ctx.save();
  ctx.globalAlpha = 0.35 + 0.5 * (1 - left);
  ctx.beginPath();
  ctx.arc(portal.x, portal.y, (10 + 26 * left) * big, 0, Math.PI * 2);
  ctx.strokeStyle = PALETTE.gloomRim;
  ctx.lineWidth = 2.5;
  ctx.setLineDash([6, 6]);
  ctx.lineDashOffset = time * 40;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(portal.x, portal.y, 9 * big * (1 - left) + 2, 0, Math.PI * 2);
  ctx.fillStyle = PALETTE.gloomBody;
  ctx.fill();
  ctx.restore();
}

export function paintInkBlob(ctx, blob) {
  paintGlow(ctx, blob.x, blob.y, 22, PALETTE.ink, 0.6);
  ctx.beginPath();
  ctx.arc(blob.x, blob.y, blob.radius, 0, Math.PI * 2);
  ctx.fillStyle = PALETTE.ink;
  ctx.fill();
  ctx.strokeStyle = '#d6c6ff';
  ctx.lineWidth = 2;
  ctx.stroke();
}

export function paintSpark(ctx, spark, time) {
  if (spark.kind === 'dew') {
    paintGlow(ctx, spark.x, spark.y, 22, PALETTE.mint, 0.7);
    ctx.beginPath();
    ctx.moveTo(spark.x, spark.y - 10);
    ctx.bezierCurveTo(spark.x + 9, spark.y + 2, spark.x + 5, spark.y + 9, spark.x, spark.y + 9);
    ctx.bezierCurveTo(spark.x - 5, spark.y + 9, spark.x - 9, spark.y + 2, spark.x, spark.y - 10);
    ctx.fillStyle = PALETTE.mint;
    ctx.fill();
    return;
  }
  const twinkle = 4 + 1.5 * Math.sin(time * 9 + spark.x);
  paintGlow(ctx, spark.x, spark.y, 12, PALETTE.amber, 0.55);
  ctx.beginPath();
  ctx.moveTo(spark.x, spark.y - twinkle);
  ctx.lineTo(spark.x + 2, spark.y);
  ctx.lineTo(spark.x, spark.y + twinkle);
  ctx.lineTo(spark.x - 2, spark.y);
  ctx.closePath();
  ctx.moveTo(spark.x - twinkle, spark.y);
  ctx.lineTo(spark.x, spark.y + 2);
  ctx.lineTo(spark.x + twinkle, spark.y);
  ctx.lineTo(spark.x, spark.y - 2);
  ctx.closePath();
  ctx.fillStyle = '#fff3c4';
  ctx.fill();
}
