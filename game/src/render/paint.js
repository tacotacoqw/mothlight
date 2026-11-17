// Shared painting helpers: text, rounded panels, bars and cached additive glows.

import { PALETTE } from '../config.js';

const FONT_STACK = '"Avenir Next", "Trebuchet MS", "Segoe UI", system-ui, sans-serif';
const glowCache = new Map();

export function paintText(ctx, text, x, y, options = {}) {
  const { size = 20, weight = 700, color = PALETTE.text, align = 'left', glow = null, spacing = 0, alpha = 1 } = options;
  ctx.save();
  ctx.font = `${weight} ${size}px ${FONT_STACK}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.letterSpacing = `${spacing}px`;
  ctx.globalAlpha = alpha;
  if (glow) {
    ctx.shadowColor = glow;
    ctx.shadowBlur = size * 0.45;
  }
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

// Draws `text` wrapped to `maxWidth`, centred on x; returns the y below the last line.
export function paintWrappedText(ctx, text, x, y, maxWidth, lineHeight, options = {}) {
  const { size = 17, weight = 500 } = options;
  ctx.save();
  ctx.font = `${weight} ${size}px ${FONT_STACK}`;
  const lines = [];
  let line = '';
  for (const word of text.split(' ')) {
    const attempt = line ? `${line} ${word}` : word;
    if (ctx.measureText(attempt).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = attempt;
    }
  }
  if (line) lines.push(line);
  ctx.restore();
  for (const each of lines) {
    paintText(ctx, each, x, y, { ...options, size, weight, align: 'center' });
    y += lineHeight;
  }
  return y;
}

export function paintPanel(ctx, x, y, width, height, radius, fill, stroke = null, lineWidth = 2) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

export function paintBar(ctx, x, y, width, height, fraction, color, track = 'rgba(255,255,255,0.12)') {
  paintPanel(ctx, x, y, width, height, height / 2, track);
  const filled = Math.max(0, Math.min(1, fraction)) * width;
  if (filled > 1) paintPanel(ctx, x, y, Math.max(filled, height), height, height / 2, color);
}

function glowSprite(color) {
  let sprite = glowCache.get(color);
  if (!sprite) {
    sprite = document.createElement('canvas');
    sprite.width = 128;
    sprite.height = 128;
    const g = sprite.getContext('2d');
    const gradient = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, `${color}cc`);
    gradient.addColorStop(0.35, `${color}55`);
    gradient.addColorStop(1, `${color}00`);
    g.fillStyle = gradient;
    g.fillRect(0, 0, 128, 128);
    glowCache.set(color, sprite);
  }
  return sprite;
}

// A soft additive light of a #rrggbb colour.
export function paintGlow(ctx, x, y, radius, color, alpha = 1) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = alpha;
  ctx.drawImage(glowSprite(color), x - radius, y - radius, radius * 2, radius * 2);
  ctx.restore();
}

export function formatScore(value) {
  return Math.round(value).toLocaleString('en-US');
}
