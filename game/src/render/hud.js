// The heads-up display around the garden bed. Top: wings, wave, the win and lose rules, score.
// Left: what is still incoming, the omen, the combo chain and the run's grade. Right: boons taken,
// garden bloom and lantern heat. Bottom: every control with its key, and the dash and flare meters.

import { ARENA, COMBO, GRADES, MOTH, PALETTE, TOTAL_WAVES, VIEW } from '../config.js';
import { ENEMY_TYPES } from '../entities/enemyTypes.js';
import { lanternDamage, lanternHeat } from '../entities/lantern.js';
import { BOONS, listTakenBoons } from '../systems/boons.js';
import { gardenWaveBonus } from '../systems/garden.js';
import { comboMultiplier, gradeForScore } from '../systems/scoring.js';
import { enemiesLeftInWave, incomingByKind, nextWaveName } from '../systems/waves.js';
import { formatScore, paintBar, paintPanel, paintText, paintWrappedText } from './paint.js';
import { paintEnemyIcon } from './sprites.js';

const LEFT = { x: 16, width: 216 };
const RIGHT = { x: VIEW.width - 232, width: 216 };
const CENTER_X = VIEW.width / 2;

export function paintHud(ctx, world, status, time) {
  paintWings(ctx, world.moth);
  paintWaveHeader(ctx, world);
  paintWinAndLoseRules(ctx, world);
  paintScore(ctx, world, status.bestScore);
  paintIncomingPanel(ctx, world);
  paintChainAndGradePanel(ctx, world);
  paintBoonsPanel(ctx, world);
  paintGardenPanel(ctx, world);
  paintLanternHeatPanel(ctx, world);
  paintControlsLegend(ctx, world, status.muted, time);
  paintBossBar(ctx, world);
  paintWaveBanner(ctx, world);
}

function paintPanelTitle(ctx, column, top, title, note = '') {
  paintText(ctx, title, column.x + 14, top + 26, { size: 15, weight: 800, color: PALETTE.amber, spacing: 3 });
  if (note) paintText(ctx, note, column.x + column.width - 14, top + 26, { size: 14, weight: 800, color: PALETTE.cream, align: 'right' });
}

function paintWings(ctx, moth) {
  paintText(ctx, 'WINGS', LEFT.x + 6, 30, { size: 14, weight: 800, color: PALETTE.textDim, spacing: 3 });
  for (let i = 0; i < moth.maxWings; i++) {
    const whole = i < moth.wings;
    ctx.save();
    ctx.translate(LEFT.x + 22 + i * 35, 62);
    ctx.fillStyle = whole ? PALETTE.amber : 'rgba(255,255,255,0.14)';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(0, -4);
      ctx.bezierCurveTo(side * 6, -18, side * 19, -12, side * 14, 2);
      ctx.bezierCurveTo(side * 12, 12, side * 4, 12, 0, 6);
      ctx.fill();
    }
    ctx.restore();
  }
}

function paintWaveHeader(ctx, world) {
  const wave = world.wave;
  paintText(ctx, `WAVE ${wave.number} / ${TOTAL_WAVES}`, CENTER_X - 12, 36, { size: 30, weight: 900, align: 'right', spacing: 2 });
  paintText(ctx, wave.name.toUpperCase(), CENTER_X + 12, 36, { size: 24, weight: 800, color: PALETTE.lilac, spacing: 3 });
  paintBar(ctx, ARENA.left, 86, ARENA.right - ARENA.left, 7, wave.total > 0 ? wave.killed / wave.total : 0, PALETTE.lilac);
}

function paintWinAndLoseRules(ctx, world) {
  const wavesToGo = TOTAL_WAVES - world.wave.number;
  const win = wavesToGo > 0 ? `clear ${wavesToGo} more wave${wavesToGo === 1 ? '' : 's'}, then break The Eclipse` : 'break The Eclipse to bring the dawn';
  const lose = `lose every wing: ${world.moth.wings} of ${world.moth.maxWings} left`;
  const half = (ARENA.right - ARENA.left) / 2;
  paintRulePill(ctx, ARENA.left, half - 6, 'WIN', win, PALETTE.mint);
  paintRulePill(ctx, ARENA.left + half + 6, half - 6, 'LOSE', lose, PALETTE.coral);
}

function paintRulePill(ctx, x, width, label, text, color) {
  paintPanel(ctx, x, 50, width, 28, 14, PALETTE.panel, color, 1.5);
  paintText(ctx, label, x + 14, 69, { size: 14, weight: 900, color, spacing: 2 });
  paintText(ctx, text, x + (label === 'WIN' ? 54 : 62), 69, { size: 14, weight: 600, color: PALETTE.text });
}

function paintScore(ctx, world, bestScore) {
  const right = VIEW.width - 22;
  paintText(ctx, 'SCORE', right, 24, { size: 14, weight: 800, color: PALETTE.textDim, align: 'right', spacing: 3 });
  paintText(ctx, formatScore(world.score), right, 62, { size: 40, weight: 900, align: 'right', color: PALETTE.cream });
  paintText(ctx, `BEST ${formatScore(Math.max(bestScore, world.score))}`, right, 84, { size: 14, weight: 700, color: PALETTE.textDim, align: 'right', spacing: 1 });
}

function paintIncomingPanel(ctx, world) {
  const top = ARENA.top;
  const height = 372;
  paintPanel(ctx, LEFT.x, top, LEFT.width, height, 16, PALETTE.panel, PALETTE.bedEdge);
  paintPanelTitle(ctx, LEFT, top, 'INCOMING', world.wave.cleared ? 'CLEAR' : `${enemiesLeftInWave(world)} LEFT`);

  let y = top + 52;
  for (const [kind, count] of incomingByKind(world).slice(0, 6)) {
    const type = ENEMY_TYPES[kind];
    paintEnemyIcon(ctx, kind, LEFT.x + 28, y, kind === 'eclipse' ? 13 : 10);
    paintText(ctx, type.title, LEFT.x + 50, y - 1, { size: 15, weight: 800, color: PALETTE.text });
    paintText(ctx, type.trait, LEFT.x + 50, y + 14, { size: 12, weight: 600, color: PALETTE.textDim });
    paintText(ctx, `x${count}`, LEFT.x + LEFT.width - 14, y + 4, { size: 16, weight: 900, color: PALETTE.amber, align: 'right' });
    y += 38;
  }

  const omen = world.wave.omen;
  const footer = top + height - 84;
  ctx.fillStyle = PALETTE.bedEdge;
  ctx.fillRect(LEFT.x + 14, footer - 16, LEFT.width - 28, 1);
  paintText(ctx, 'OMEN', LEFT.x + 14, footer + 4, { size: 12, weight: 800, color: PALETTE.textDim, spacing: 2 });
  paintText(ctx, omen ? omen.name : 'A quiet night', LEFT.x + 62, footer + 4, { size: 14, weight: 800, color: PALETTE.lilac });
  paintText(ctx, omen ? omen.text : 'no omen this wave', LEFT.x + 14, footer + 22, { size: 12, weight: 600, color: PALETTE.text });
  const next = nextWaveName(world);
  paintText(ctx, 'NEXT', LEFT.x + 14, footer + 52, { size: 12, weight: 800, color: PALETTE.textDim, spacing: 2 });
  paintText(ctx, next ? `Wave ${world.wave.number + 1}: ${next}` : 'The dawn', LEFT.x + 62, footer + 52, { size: 14, weight: 800, color: PALETTE.cream });
}

function paintChainAndGradePanel(ctx, world) {
  let top = ARENA.top + 384;
  const height = ARENA.bottom - top;
  paintPanel(ctx, LEFT.x, top, LEFT.width, height, 16, PALETTE.panel, PALETTE.bedEdge);
  const multiplier = comboMultiplier(world);
  const hot = world.combo.count >= 2;
  paintPanelTitle(ctx, LEFT, top, 'CHAIN', `${world.combo.count} in a row`);
  paintText(ctx, `x${multiplier.toFixed(1)}`, LEFT.x + 14, top + 78, {
    size: 46, weight: 900, color: hot ? PALETTE.amber : PALETTE.textDim, glow: hot ? PALETTE.ember : null,
  });
  paintBar(ctx, LEFT.x + 14, top + 90, LEFT.width - 28, 7, world.combo.count > 0 ? world.combo.timer / COMBO.windowSeconds : 0, PALETTE.amber);
  const chainHint = multiplier >= COMBO.maxMultiplier ? 'MAX CHAIN: every burst scores x5' : 'burst gloom quickly to raise it';
  paintText(ctx, chainHint, LEFT.x + 14, top + 114, { size: 12, weight: 700, color: PALETTE.textDim });

  const letter = gradeForScore(world.score);
  const nextGrade = [...GRADES].reverse().find((grade) => grade.score > world.score);
  paintText(ctx, 'GRADE', LEFT.x + 14, top + 146, { size: 15, weight: 800, color: PALETTE.amber, spacing: 3 });
  top += 12;
  ctx.beginPath();
  ctx.arc(LEFT.x + 50, top + 182, 30, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 194, 75, 0.12)';
  ctx.fill();
  ctx.strokeStyle = PALETTE.amber;
  ctx.lineWidth = 3;
  ctx.stroke();
  paintText(ctx, letter, LEFT.x + 50, top + 197, { size: 42, weight: 900, color: PALETTE.cream, align: 'center' });
  const goal = nextGrade ? `${nextGrade.letter} at ${formatScore(nextGrade.score)}` : 'top grade!';
  paintText(ctx, 'next grade', LEFT.x + LEFT.width - 14, top + 174, { size: 12, weight: 700, color: PALETTE.textDim, align: 'right' });
  paintText(ctx, goal, LEFT.x + LEFT.width - 14, top + 194, { size: 16, weight: 800, color: PALETTE.cream, align: 'right' });
}

function paintBoonsPanel(ctx, world) {
  const top = ARENA.top;
  const height = 372;
  const taken = listTakenBoons(world);
  const picks = taken.reduce((sum, boon) => sum + boon.level, 0);
  paintPanel(ctx, RIGHT.x, top, RIGHT.width, height, 16, PALETTE.panel, PALETTE.bedEdge);
  paintPanelTitle(ctx, RIGHT, top, 'BOONS', `${taken.length} of ${BOONS.length}`);

  if (taken.length === 0) {
    paintWrappedText(ctx, 'Clear a wave to choose your first boon: 12 to find, one after every wave.', RIGHT.x + RIGHT.width / 2, top + 64, RIGHT.width - 36, 20, {
      size: 14, weight: 600, color: PALETTE.textDim,
    });
    return;
  }
  let y = top + 56;
  for (const boon of taken.slice(0, 10)) {
    paintText(ctx, boon.name, RIGHT.x + 14, y, { size: 15, weight: 700, color: PALETTE.text });
    for (let pip = 0; pip < boon.limit; pip++) {
      ctx.fillStyle = pip < boon.level ? PALETTE.mint : 'rgba(255,255,255,0.16)';
      ctx.fillRect(RIGHT.x + RIGHT.width - 14 - (boon.limit - pip) * 13, y - 10, 10, 10);
    }
    y += 29;
  }
  paintText(ctx, `${picks} picked this run`, RIGHT.x + RIGHT.width - 14, top + height - 14, { size: 12, weight: 700, color: PALETTE.textDim, align: 'right' });
}

function paintGardenPanel(ctx, world) {
  const top = ARENA.top + 384;
  paintPanel(ctx, RIGHT.x, top, RIGHT.width, 116, 16, PALETTE.panel, PALETTE.bedEdge);
  const percent = Math.round(world.garden.litFraction * 100);
  paintPanelTitle(ctx, RIGHT, top, 'GARDEN', 'in bloom');
  paintText(ctx, `${percent}%`, RIGHT.x + 14, top + 72, { size: 38, weight: 900, color: PALETTE.coral });
  paintText(ctx, 'wave-end bonus', RIGHT.x + RIGHT.width - 14, top + 54, { size: 12, weight: 700, color: PALETTE.textDim, align: 'right' });
  paintText(ctx, `+${formatScore(gardenWaveBonus(world))}`, RIGHT.x + RIGHT.width - 14, top + 74, { size: 18, weight: 800, color: PALETTE.cream, align: 'right' });
  paintBar(ctx, RIGHT.x + 14, top + 90, RIGHT.width - 28, 10, world.garden.litFraction, PALETTE.coral);
}

function paintLanternHeatPanel(ctx, world) {
  const top = ARENA.top + 384 + 128;
  const height = ARENA.bottom - top;
  const lantern = world.lanterns[0];
  const heat = lanternHeat(lantern);
  paintPanel(ctx, RIGHT.x, top, RIGHT.width, height, 16, PALETTE.panel, PALETTE.bedEdge);
  paintPanelTitle(ctx, RIGHT, top, 'LANTERN', heat >= 1.2 ? 'WHIRLING' : heat >= 0.4 ? 'swinging' : 'too slow');
  paintText(ctx, `x${lanternDamage(world, lantern).toFixed(1)}`, RIGHT.x + 14, top + 68, { size: 34, weight: 900, color: heat >= 1.2 ? PALETTE.amber : PALETTE.cream });
  paintText(ctx, 'damage a hit', RIGHT.x + RIGHT.width - 14, top + 52, { size: 12, weight: 700, color: PALETTE.textDim, align: 'right' });
  paintText(ctx, 'swing faster', RIGHT.x + RIGHT.width - 14, top + 68, { size: 12, weight: 700, color: PALETTE.textDim, align: 'right' });
  paintBar(ctx, RIGHT.x + 14, top + 82, RIGHT.width - 28, 10, heat / 2.2, heat >= 1.2 ? PALETTE.amber : PALETTE.ember);
}

function paintKeycap(ctx, x, y, keys, action, color = PALETTE.text) {
  ctx.save();
  ctx.font = '800 13px "Avenir Next", "Trebuchet MS", system-ui, sans-serif';
  const width = ctx.measureText(keys).width + 22;
  ctx.restore();
  paintPanel(ctx, x, y, width, 26, 7, 'rgba(255,255,255,0.07)', PALETTE.textDim, 1.5);
  paintText(ctx, keys, x + width / 2, y + 18, { size: 13, weight: 800, color: PALETTE.cream, align: 'center' });
  paintText(ctx, action, x + width + 9, y + 19, { size: 15, weight: 800, color, spacing: 1 });
  return x + width + 9;
}

function paintControlsLegend(ctx, world, muted, time) {
  const y = ARENA.bottom + 12;
  paintKeycap(ctx, 16, y, 'MOUSE / WASD', 'FLY');

  const dashReady = world.moth.dashCooldown <= 0;
  const dashX = paintKeycap(ctx, 190, y, 'CLICK / SPACE', 'DASH', dashReady ? PALETTE.mint : PALETTE.textDim);
  paintBar(ctx, dashX, y + 30, 110, 8, 1 - world.moth.dashCooldown / (MOTH.dashCooldown * world.boons.dashCooldownScale), PALETTE.mint);

  const flareReady = world.flareCharge >= 1;
  const pulse = flareReady && Math.sin(time * 8) > 0;
  const flareX = paintKeycap(ctx, 476, y, 'RIGHT-CLICK / E', flareReady ? 'FLARE READY!' : 'FLARE', flareReady ? PALETTE.amber : PALETTE.textDim);
  paintBar(ctx, flareX, y + 30, 150, 8, world.flareCharge, pulse ? PALETTE.cream : PALETTE.amber);

  paintKeycap(ctx, 838, y, 'P', 'PAUSE');
  paintKeycap(ctx, 948, y, 'R', 'RESTART');
  paintKeycap(ctx, 1078, y, 'M', muted ? 'SOUND OFF' : 'SOUND ON');
  paintText(ctx, 'paused or after a run', 948, y + 44, { size: 11, weight: 600, color: PALETTE.textDim });
}

function paintBossBar(ctx, world) {
  const boss = world.enemies.find((enemy) => enemy.isBoss);
  if (!boss) return;
  const width = 440;
  const x = CENTER_X - width / 2;
  const y = ARENA.top + 16;
  paintPanel(ctx, x - 10, y - 8, width + 20, 44, 12, PALETTE.panel, PALETTE.coral, 1.5);
  paintText(ctx, 'THE ECLIPSE', CENTER_X, y + 9, { size: 14, weight: 800, align: 'center', color: PALETTE.coral, spacing: 4 });
  paintBar(ctx, x, y + 16, width, 12, boss.hp / boss.maxHp, PALETTE.coral);
}

function paintWaveBanner(ctx, world) {
  const wave = world.wave;
  if (wave.bannerClock <= 0) return;
  const alpha = Math.min(1, wave.bannerClock / 0.6);
  const y = ARENA.top + 170;
  paintText(ctx, `WAVE ${wave.number}`, CENTER_X, y, { size: 68, weight: 900, align: 'center', color: PALETTE.cream, glow: PALETTE.amber, spacing: 8, alpha });
  paintText(ctx, wave.name, CENTER_X, y + 40, { size: 28, weight: 600, align: 'center', color: PALETTE.lilac, spacing: 3, alpha });
  if (wave.omen) {
    paintText(ctx, `Omen: ${wave.omen.name}, ${wave.omen.text}`, CENTER_X, y + 74, { size: 18, weight: 600, align: 'center', color: PALETTE.cream, alpha });
  }
}
