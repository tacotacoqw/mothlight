// Tiny geometry helpers shared by the simulation.

import { ARENA } from '../config.js';

export function clamp(value, low, high) {
  return value < low ? low : value > high ? high : value;
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function distance(ax, ay, bx, by) {
  return Math.hypot(bx - ax, by - ay);
}

export function clampToArena(body, inset = 0) {
  body.x = clamp(body.x, ARENA.left + inset, ARENA.right - inset);
  body.y = clamp(body.y, ARENA.top + inset, ARENA.bottom - inset);
}

export function arenaCenter() {
  return { x: (ARENA.left + ARENA.right) / 2, y: (ARENA.top + ARENA.bottom) / 2 };
}

// Turns `from` towards `to` by at most `maxStep` radians, the short way round.
export function turnTowards(from, to, maxStep) {
  let delta = (to - from) % (Math.PI * 2);
  if (delta > Math.PI) delta -= Math.PI * 2;
  if (delta < -Math.PI) delta += Math.PI * 2;
  return from + clamp(delta, -maxStep, maxStep);
}
