// Score, the kill combo and its multiplier, and the end-of-run summary.

import { COMBO, GRADES } from '../config.js';

export function createCombo() {
  return { count: 0, timer: 0, best: 0 };
}

export function comboMultiplier(world) {
  const steps = Math.floor(world.combo.count / COMBO.killsPerStep);
  return Math.min(COMBO.maxMultiplier, 1 + steps * COMBO.stepBonus);
}

export function registerKill(world, points) {
  world.score += points;
  world.stats.kills += 1;
  world.wave.killed += 1;
  world.combo.count += 1;
  world.combo.timer = COMBO.windowSeconds;
  world.combo.best = Math.max(world.combo.best, world.combo.count);
}

export function updateCombo(world, dt) {
  if (world.combo.count === 0) return;
  world.combo.timer -= dt;
  if (world.combo.timer <= 0) world.combo.count = 0;
}

export function gradeForScore(score) {
  return GRADES.find((grade) => score >= grade.score).letter;
}

// What the game-over and victory screens print.
export function summarizeRun(world) {
  return {
    score: world.score,
    grade: gradeForScore(world.score),
    wave: world.wave.number,
    kills: world.stats.kills,
    bestCombo: world.combo.best,
    gardenPercent: Math.round(world.garden.litFraction * 100),
    seconds: Math.round(world.time),
  };
}
