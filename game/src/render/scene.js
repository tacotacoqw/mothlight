// Paints the playfield: night sky, the garden bed and its flowers, then everything that moves.

import { ARENA, PALETTE, VIEW } from '../config.js';
import { paintGlow, paintPanel, paintText } from './paint.js';
import { paintEnemy, paintInkBlob, paintLantern, paintMoth, paintPortal, paintSpark, paintThread } from './sprites.js';

export function paintScene(ctx, world, time) {
  paintNightSky(ctx);

  ctx.save();
  if (world.shake > 0) {
    const jolt = world.shake * world.shake * 14;
    ctx.translate(Math.sin(time * 97) * jolt, Math.cos(time * 83) * jolt);
  }
  paintGardenBed(ctx, world.garden, time);
  paintEmbers(ctx, world);
  for (const portal of world.portals) paintPortal(ctx, portal, time);
  for (const spark of world.sparks) paintSpark(ctx, spark, time);
  for (const enemy of world.enemies) paintEnemy(ctx, enemy, world.moth, time);
  for (const blob of world.inkBlobs) paintInkBlob(ctx, blob);
  for (const lantern of world.lanterns) paintThread(ctx, world, lantern);
  for (const lantern of world.lanterns) paintLantern(ctx, world, lantern);
  paintMoth(ctx, world.moth);
  paintEffects(ctx, world);
  ctx.restore();

  if (world.hurtFlash > 0) {
    ctx.fillStyle = `rgba(255, 80, 90, ${world.hurtFlash * 0.5})`;
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  }
}

function paintNightSky(ctx) {
  const sky = ctx.createLinearGradient(0, 0, 0, VIEW.height);
  sky.addColorStop(0, PALETTE.skyTop);
  sky.addColorStop(1, PALETTE.skyBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
}

function paintGardenBed(ctx, garden, time) {
  paintPanel(ctx, ARENA.left, ARENA.top, ARENA.right - ARENA.left, ARENA.bottom - ARENA.top, 22, PALETTE.bed, PALETTE.bedEdge, 2);

  ctx.strokeStyle = PALETTE.grass;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (const tuft of garden.tufts) {
    ctx.moveTo(tuft.x, tuft.y);
    ctx.lineTo(tuft.x + tuft.lean, tuft.y - 7);
    ctx.moveTo(tuft.x + 3, tuft.y);
    ctx.lineTo(tuft.x + 3 - tuft.lean, tuft.y - 5);
  }
  ctx.stroke();

  for (const flower of garden.flowers) paintFlower(ctx, flower, time);
}

function paintFlower(ctx, flower, time) {
  const open = flower.bloomed ? Math.max(0.55, flower.light) : flower.light * 0.5;
  if (open < 0.12) {
    ctx.beginPath();
    ctx.arc(flower.x, flower.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = PALETTE.bud;
    ctx.fill();
    return;
  }
  const size = flower.size * open;
  const turn = Math.sin(time * 1.3 + flower.sway) * 0.25;
  if (flower.bloomed) paintGlow(ctx, flower.x, flower.y, size * 3.2, flower.color, 0.42);
  ctx.fillStyle = flower.color;
  ctx.globalAlpha = flower.bloomed ? 1 : 0.55;
  ctx.beginPath();
  for (let petal = 0; petal < 5; petal++) {
    const angle = turn + (petal / 5) * Math.PI * 2;
    const x = flower.x + Math.cos(angle) * size * 0.62;
    const y = flower.y + Math.sin(angle) * size * 0.62;
    ctx.moveTo(x + size * 0.5, y);
    ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(flower.x, flower.y, size * 0.34, 0, Math.PI * 2);
  ctx.fillStyle = '#fff6d8';
  ctx.fill();
}

function paintEmbers(ctx, world) {
  for (const ember of world.embers) {
    const left = 1 - ember.age / ember.life;
    paintGlow(ctx, ember.x, ember.y, 16, PALETTE.ember, left * 0.8);
  }
}

function paintEffects(ctx, world) {
  for (const ring of world.rings) {
    const grown = ring.age / ring.seconds;
    ctx.beginPath();
    ctx.arc(ring.x, ring.y, ring.maxRadius * (0.15 + 0.85 * grown), 0, Math.PI * 2);
    ctx.strokeStyle = ring.color;
    ctx.globalAlpha = 1 - grown;
    ctx.lineWidth = 6 * (1 - grown) + 1;
    ctx.stroke();
  }
  for (const particle of world.particles) {
    ctx.globalAlpha = 1 - particle.age / particle.life;
    ctx.fillStyle = particle.color;
    ctx.fillRect(particle.x - particle.size / 2, particle.y - particle.size / 2, particle.size, particle.size);
  }
  ctx.globalAlpha = 1;
  for (const floater of world.floaters) {
    paintText(ctx, floater.text, floater.x, floater.y, {
      size: floater.size, weight: 800, color: floater.color, align: 'center', alpha: 1 - floater.age / floater.life,
    });
  }
}
