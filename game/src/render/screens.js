// Full-screen menus painted over the scene: title, boon choice, pause, game over and victory.

import { PALETTE, VIEW } from '../config.js';
import { WAVE_PLANS } from '../systems/waves.js';
import { ENEMY_TYPES } from '../entities/enemyTypes.js';
import { formatScore, paintGlow, paintPanel, paintText, paintWrappedText } from './paint.js';
import { paintEnemyIcon } from './sprites.js';

const CENTER_X = VIEW.width / 2;
const CARD = { width: 300, height: 330, gap: 40, top: 300 };

function dimScene(ctx, strength) {
  ctx.fillStyle = `rgba(4, 7, 18, ${strength})`;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
}

function paintPrompt(ctx, text, y, time) {
  const pulse = 0.93 + 0.07 * Math.sin(time * 4);
  paintPanel(ctx, CENTER_X - 400, y - 54, 800, 80, 40, 'rgba(46, 32, 12, 0.94)', PALETTE.amber, 3);
  paintText(ctx, text, CENTER_X, y, { size: 42, weight: 900, align: 'center', color: PALETTE.amber, alpha: pulse, spacing: 1 });
}

// The creatures of the gloom, in a row: shown on the title screen.
function paintBestiaryRow(ctx, y) {
  const kinds = Object.keys(ENEMY_TYPES);
  const cell = 164;
  const left = CENTER_X - (kinds.length * cell) / 2;
  paintText(ctx, 'THE GLOOM', left + 4, y - 34, { size: 14, weight: 800, color: PALETTE.lilac, spacing: 4 });
  kinds.forEach((kind, index) => {
    const x = left + index * cell;
    paintEnemyIcon(ctx, kind, x + 20, y, kind === 'eclipse' ? 15 : 12);
    paintText(ctx, ENEMY_TYPES[kind].title, x + 44, y - 2, { size: 15, weight: 800, color: PALETTE.text });
    paintText(ctx, ENEMY_TYPES[kind].trait, x + 44, y + 14, { size: 11, weight: 600, color: PALETTE.textDim });
  });
}

export function paintTitleScreen(ctx, bestScore, time) {
  dimScene(ctx, 0.62);
  paintGlow(ctx, CENTER_X, 210, 420, PALETTE.amber, 0.35);
  paintText(ctx, 'MOTHLIGHT', CENTER_X + 8, 250, { size: 136, weight: 900, align: 'center', color: PALETTE.cream, glow: PALETTE.amber, spacing: 16 });
  paintText(ctx, 'Whirl your lantern. Burn back the gloom. Wake the night garden.', CENTER_X, 308, {
    size: 26, weight: 600, align: 'center', color: PALETTE.amber,
  });

  const controls = [
    ['MOVE', 'Mouse or WASD'],
    ['SWING', 'Circle to whirl the lantern'],
    ['DASH', 'Click or Space'],
    ['FLARE', 'Right-click or E'],
  ];
  const columnWidth = 250;
  const left = CENTER_X - (controls.length * columnWidth) / 2;
  paintPanel(ctx, left - 20, 366, controls.length * columnWidth + 40, 150, 20, PALETTE.panel, PALETTE.bedEdge);
  controls.forEach(([name, keys], index) => {
    const x = left + index * columnWidth + columnWidth / 2;
    paintText(ctx, name, x, 416, { size: 26, weight: 900, align: 'center', color: PALETTE.mint, spacing: 4 });
    paintText(ctx, keys, x, 450, { size: 17, weight: 600, align: 'center', color: PALETTE.text });
  });
  paintText(ctx, 'The faster the lantern flies, the harder it hits.  10 waves.  Pick a boon after each.  P pauses, M mutes.', CENTER_X, 492, {
    size: 15, weight: 500, align: 'center', color: PALETTE.textDim,
  });

  paintPrompt(ctx, 'CLICK OR PRESS ENTER TO START', 604, time);
  const best = bestScore > 0 ? `BEST SCORE  ${formatScore(bestScore)}` : 'Survive ten waves to see the dawn';
  paintText(ctx, best, CENTER_X, 668, { size: 18, weight: 700, align: 'center', color: PALETTE.textDim, spacing: 3 });
  paintBestiaryRow(ctx, 752);
}

function boonCardLeft(index) {
  const total = 3 * CARD.width + 2 * CARD.gap;
  return CENTER_X - total / 2 + index * (CARD.width + CARD.gap);
}

// Which boon card (0 to 2) is under the pointer, or -1.
export function boonCardAt(x, y) {
  for (let index = 0; index < 3; index++) {
    const left = boonCardLeft(index);
    if (x >= left && x <= left + CARD.width && y >= CARD.top && y <= CARD.top + CARD.height) return index;
  }
  return -1;
}

export function paintBoonScreen(ctx, world, pointer, time) {
  dimScene(ctx, 0.7);
  paintText(ctx, `WAVE ${world.wave.number} CLEARED`, CENTER_X, 170, { size: 60, weight: 900, align: 'center', color: PALETTE.mint, glow: PALETTE.mint, spacing: 6 });
  paintText(ctx, `Garden bonus +${formatScore(world.lastGardenBonus)}   ·   Score ${formatScore(world.score)}`, CENTER_X, 214, {
    size: 22, weight: 600, align: 'center', color: PALETTE.cream,
  });
  paintText(ctx, 'CHOOSE A BOON', CENTER_X, 270, { size: 24, weight: 800, align: 'center', color: PALETTE.amber, spacing: 6 });

  const hovered = boonCardAt(pointer.x, pointer.y);
  world.boonChoices.forEach((boon, index) => {
    const left = boonCardLeft(index);
    const lift = hovered === index ? -8 : 0;
    const middle = left + CARD.width / 2;
    paintPanel(ctx, left, CARD.top + lift, CARD.width, CARD.height, 22, PALETTE.panel, hovered === index ? PALETTE.amber : PALETTE.bedEdge, hovered === index ? 4 : 2);
    paintGlow(ctx, middle, CARD.top + 84 + lift, 80, PALETTE.amber, 0.5);
    paintBoonIcon(ctx, boon.icon, middle, CARD.top + 84 + lift, time);
    paintText(ctx, boon.name, middle, CARD.top + 176 + lift, { size: 28, weight: 800, align: 'center', color: PALETTE.cream });
    paintWrappedText(ctx, boon.text, middle, CARD.top + 212 + lift, CARD.width - 50, 24, { size: 17, color: PALETTE.text });
    paintPanel(ctx, middle - 34, CARD.top + 276 + lift, 68, 34, 10, 'rgba(255,255,255,0.08)', PALETTE.textDim, 1.5);
    paintText(ctx, `${index + 1}`, middle, CARD.top + 301 + lift, { size: 22, weight: 800, align: 'center', color: PALETTE.amber });
  });
  paintText(ctx, 'Click a card or press 1, 2 or 3', CENTER_X, 690, { size: 20, weight: 600, align: 'center', color: PALETTE.textDim });
}

function paintBoonIcon(ctx, icon, x, y, time) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = PALETTE.cream;
  ctx.fillStyle = PALETTE.amber;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  const disc = (dx, dy, r) => { ctx.beginPath(); ctx.arc(dx, dy, r, 0, Math.PI * 2); ctx.fill(); };
  if (icon === 'thread') {
    ctx.beginPath(); ctx.moveTo(-34, 20); ctx.quadraticCurveTo(0, -40, 26, -14); ctx.stroke();
    disc(28, -12, 11);
  } else if (icon === 'lantern') {
    disc(0, 2, 26);
    ctx.strokeRect(-9, -36, 18, 8);
  } else if (icon === 'twin') {
    disc(-16, 6, 16); disc(18, -8, 12);
  } else if (icon === 'wing') {
    for (const side of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(0, -6); ctx.bezierCurveTo(side * 14, -36, side * 44, -22, side * 32, 6);
      ctx.bezierCurveTo(side * 24, 22, side * 8, 18, 0, 8); ctx.fill();
    }
  } else if (icon === 'heart') {
    ctx.fillStyle = PALETTE.coral;
    ctx.beginPath(); ctx.moveTo(0, 26); ctx.bezierCurveTo(-44, -6, -18, -38, 0, -14); ctx.bezierCurveTo(18, -38, 44, -6, 0, 26); ctx.fill();
  } else if (icon === 'magnet') {
    ctx.lineWidth = 12; ctx.strokeStyle = PALETTE.coral;
    ctx.beginPath(); ctx.arc(0, -4, 20, Math.PI, 0); ctx.lineTo(20, 22); ctx.moveTo(-20, -4); ctx.lineTo(-20, 22); ctx.stroke();
  } else if (icon === 'flare') {
    disc(0, 0, 14);
    for (let ray = 0; ray < 8; ray++) {
      const angle = (ray / 8) * Math.PI * 2 + time;
      ctx.beginPath(); ctx.moveTo(Math.cos(angle) * 22, Math.sin(angle) * 22); ctx.lineTo(Math.cos(angle) * 36, Math.sin(angle) * 36); ctx.stroke();
    }
  } else if (icon === 'ember') {
    ctx.fillStyle = PALETTE.ember;
    disc(-26, 14, 7); disc(-6, 4, 10); disc(18, -10, 14);
  } else if (icon === 'dew') {
    ctx.fillStyle = PALETTE.mint;
    ctx.beginPath(); ctx.moveTo(0, -30); ctx.bezierCurveTo(26, 4, 16, 26, 0, 26); ctx.bezierCurveTo(-16, 26, -26, 4, 0, -30); ctx.fill();
  } else if (icon === 'glow') {
    ctx.fillStyle = PALETTE.sky;
    for (let petal = 0; petal < 5; petal++) {
      const angle = (petal / 5) * Math.PI * 2 - Math.PI / 2;
      disc(Math.cos(angle) * 18, Math.sin(angle) * 18, 13);
    }
    ctx.fillStyle = PALETTE.cream;
    disc(0, 0, 10);
  } else if (icon === 'thorn') {
    ctx.fillStyle = PALETTE.mint;
    ctx.beginPath(); ctx.moveTo(36, 0); ctx.lineTo(-10, -16); ctx.lineTo(-2, 0); ctx.lineTo(-10, 16); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = PALETTE.mint;
    ctx.beginPath(); ctx.moveTo(-18, -10); ctx.lineTo(-36, -10); ctx.moveTo(-14, 0); ctx.lineTo(-40, 0); ctx.moveTo(-18, 10); ctx.lineTo(-36, 10); ctx.stroke();
  } else if (icon === 'phoenix') {
    ctx.fillStyle = PALETTE.ember;
    ctx.beginPath(); ctx.moveTo(0, 30); ctx.bezierCurveTo(-34, 10, -14, -18, -6, -34); ctx.bezierCurveTo(0, -14, 14, -18, 10, -36);
    ctx.bezierCurveTo(34, -10, 30, 16, 0, 30); ctx.fill();
    ctx.fillStyle = PALETTE.cream;
    disc(0, 12, 9);
  }
  ctx.restore();
}

export function paintPauseScreen(ctx) {
  dimScene(ctx, 0.66);
  paintText(ctx, 'PAUSED', CENTER_X, 380, { size: 96, weight: 900, align: 'center', color: PALETTE.cream, glow: PALETTE.amber, spacing: 14 });
  paintText(ctx, 'P or Esc to resume   ·   R to restart   ·   M to mute', CENTER_X, 440, { size: 22, weight: 600, align: 'center', color: PALETTE.textDim });
}

function paintRunSummary(ctx, summary, bestScore, isNewBest, top) {
  const rows = [
    ['SCORE', formatScore(summary.score)],
    ['WAVE REACHED', `${summary.wave} / ${WAVE_PLANS.length}`],
    ['GLOOM BURST', `${summary.kills}`],
    ['BEST CHAIN', `${summary.bestCombo} in a row`],
    ['GARDEN IN BLOOM', `${summary.gardenPercent}%`],
  ];
  paintPanel(ctx, CENTER_X - 400, top, 800, 268, 22, PALETTE.panel, PALETTE.bedEdge);
  rows.forEach(([label, value], index) => {
    const y = top + 56 + index * 46;
    const first = index === 0;
    paintText(ctx, label, CENTER_X - 360, y, { size: first ? 26 : 20, weight: 800, color: PALETTE.textDim, spacing: 3 });
    paintText(ctx, value, CENTER_X + 150, y, { size: first ? 48 : 28, weight: 900, align: 'right', color: first ? PALETTE.amber : PALETTE.cream });
  });

  // The run's letter grade, in a medal on the right of the panel.
  const medalX = CENTER_X + 280;
  const medalY = top + 120;
  paintGlow(ctx, medalX, medalY, 110, PALETTE.amber, 0.5);
  ctx.beginPath();
  ctx.arc(medalX, medalY, 64, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(46, 32, 12, 0.95)';
  ctx.fill();
  ctx.strokeStyle = PALETTE.amber;
  ctx.lineWidth = 5;
  ctx.stroke();
  paintText(ctx, summary.grade, medalX, medalY + 32, { size: 92, weight: 900, align: 'center', color: PALETTE.cream });
  paintText(ctx, 'GRADE', medalX, medalY + 100, { size: 18, weight: 800, align: 'center', color: PALETTE.amber, spacing: 5 });
  const note = isNewBest ? 'NEW BEST!' : `BEST ${formatScore(bestScore)}`;
  paintText(ctx, note, medalX, medalY + 128, { size: 16, weight: 800, align: 'center', color: isNewBest ? PALETTE.mint : PALETTE.textDim, spacing: 2 });
}

export function paintGameOverScreen(ctx, summary, bestScore, isNewBest, time) {
  dimScene(ctx, 0.74);
  paintText(ctx, 'THE NIGHT WINS', CENTER_X + 5, 196, { size: 92, weight: 900, align: 'center', color: PALETTE.coral, glow: PALETTE.coral, spacing: 10 });
  const waveName = WAVE_PLANS[summary.wave - 1].name;
  paintText(ctx, `Your lantern went dark on wave ${summary.wave}: ${waveName}`, CENTER_X, 244, { size: 24, weight: 600, align: 'center', color: PALETTE.cream });
  paintRunSummary(ctx, summary, bestScore, isNewBest, 276);
  paintPrompt(ctx, 'PRESS R OR CLICK TO RESTART', 640, time);
  paintText(ctx, 'Esc returns to the title screen', CENTER_X, 706, { size: 18, weight: 600, align: 'center', color: PALETTE.textDim });
}

export function paintVictoryScreen(ctx, summary, bestScore, isNewBest, time) {
  dimScene(ctx, 0.6);
  paintGlow(ctx, CENTER_X, 170, 520, PALETTE.amber, 0.55);
  paintText(ctx, 'DAWN BREAKS', CENTER_X + 5, 196, { size: 100, weight: 900, align: 'center', color: PALETTE.cream, glow: PALETTE.amber, spacing: 10 });
  paintText(ctx, 'The Eclipse is broken and the garden is awake. You win!', CENTER_X, 244, { size: 24, weight: 600, align: 'center', color: PALETTE.amber });
  paintRunSummary(ctx, summary, bestScore, isNewBest, 276);
  paintPrompt(ctx, 'PRESS R OR CLICK TO PLAY AGAIN', 640, time);
  paintText(ctx, 'Esc returns to the title screen', CENTER_X, 706, { size: 18, weight: 600, align: 'center', color: PALETTE.textDim });
}
