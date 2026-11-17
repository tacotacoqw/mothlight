// The game's flow between screens: title (with its attract-mode demo), a run, pause,
// the boon choice, and the game-over and victory screens with their restart.

import { STEP_SECONDS } from './config.js';
import { createWorld, startRun, stepWorld, chooseBoon } from './world.js';
import { createAutopilot, steerAutopilot } from './autopilot.js';
import { summarizeRun } from './systems/scoring.js';
import { boonCardAt } from './render/screens.js';
import { loadBestScore, saveBestScore } from './storage.js';

const IDLE_CONTROLS = { useAim: false, aimX: 0, aimY: 0, moveX: 0, moveY: 0, dash: false, flare: false };

export function createGame(seed) {
  const game = {
    screen: 'title', // 'title' | 'run'
    paused: false,
    frozen: false,
    seed,
    world: null,
    demoWorld: null,
    demoPilot: createAutopilot(),
    bestScore: loadBestScore(),
    isNewBest: false,
    summary: null,
  };
  restartDemo(game);
  return game;
}

function restartDemo(game) {
  game.seed += 1;
  game.demoWorld = startRun(createWorld(game.seed));
  game.demoPilot = createAutopilot();
}

export function startNewRun(game) {
  game.seed += 1;
  game.world = startRun(createWorld(game.seed));
  game.screen = 'run';
  game.paused = false;
  game.summary = null;
  game.isNewBest = false;
}

export function returnToTitle(game) {
  game.screen = 'title';
  game.paused = false;
  restartDemo(game);
}

// Menu keys and clicks, read once per frame before the simulation steps.
export function handleMenuInput(game, input) {
  const confirm = input.pointer.clicked || input.anyPressed('Enter', 'NumpadEnter', 'Space');

  if (game.screen === 'title') {
    if (confirm) startNewRun(game);
    return;
  }

  const world = game.world;
  if (world.phase === 'gameOver' || world.phase === 'victory') {
    if (input.wasPressed('Escape')) returnToTitle(game);
    else if (confirm || input.wasPressed('KeyR')) startNewRun(game);
    return;
  }
  if (world.phase === 'choosingBoon') {
    let pick = -1;
    if (input.wasPressed('Digit1') || input.wasPressed('Numpad1')) pick = 0;
    if (input.wasPressed('Digit2') || input.wasPressed('Numpad2')) pick = 1;
    if (input.wasPressed('Digit3') || input.wasPressed('Numpad3')) pick = 2;
    if (input.pointer.clicked) pick = boonCardAt(input.pointer.x, input.pointer.y);
    if (pick >= 0) chooseBoon(world, pick);
    return;
  }
  if (input.anyPressed('KeyP', 'Escape')) game.paused = !game.paused;
  if (game.paused && input.wasPressed('KeyR')) startNewRun(game);
}

// Advances whichever world is on screen by one fixed step.
export function stepGame(game, flightControls) {
  if (game.frozen) return;
  if (game.screen === 'title') {
    stepDemo(game);
    return;
  }
  if (game.paused) return;
  stepWorld(game.world, flightControls, STEP_SECONDS);
  if (!game.summary && (game.world.phase === 'gameOver' || game.world.phase === 'victory')) recordRunResult(game);
}

function stepDemo(game) {
  const demo = game.demoWorld;
  if (demo.phase === 'choosingBoon') chooseBoon(demo, 0);
  if (demo.phase !== 'playing' || demo.wave.number > 5) {
    restartDemo(game);
    return;
  }
  stepWorld(demo, steerAutopilot(game.demoPilot, demo, STEP_SECONDS), STEP_SECONDS);
  demo.sounds.length = 0;
}

export function recordRunResult(game) {
  game.summary = summarizeRun(game.world);
  game.isNewBest = game.summary.score > game.bestScore;
  if (game.isNewBest) {
    game.bestScore = game.summary.score;
    saveBestScore(game.bestScore);
  }
}

export function idleControls() {
  return IDLE_CONTROLS;
}
