// Screenshot scenes: `index.html?shot=<scene>&seed=<n>` lets the autopilot play a seeded run
// up to a chosen moment and holds that frame, so each screenshot is a real, repeatable render.
//   title    the title screen over the attract-mode demo
//   play     the thick of a mid-game wave
//   boon     the boon choice after a wave
//   gameover the game-over screen with its run summary
//   victory  the victory screen after the boss

import { STEP_SECONDS } from './config.js';
import { chooseBoon, stepWorld } from './world.js';
import { createAutopilot, steerAutopilot } from './autopilot.js';
import { idleControls, recordRunResult, returnToTitle, startNewRun } from './gameFlow.js';

const STEP_LIMIT = 120 * 60 * 12;

export function readShotRequest(search) {
  const params = new URLSearchParams(search);
  const scene = params.get('shot');
  if (!scene) return null;
  return { scene, seed: Number(params.get('seed')) || 1, wave: Number(params.get('wave')) || 0 };
}

export function stageScreenshotScene(game, request) {
  game.seed = request.seed - 1;
  if (request.scene === 'title') {
    returnToTitle(game);
    for (let i = 0; i < 120 * 14; i++) stepTitleDemo(game);
  } else {
    // The autopilot does not survive every run: try the next seed until one reaches the scene.
    for (let attempt = 0; attempt < 60; attempt++) {
      if (playRunToScene(game, request)) break;
    }
    if (game.world.phase === 'gameOver' || game.world.phase === 'victory') recordRunResult(game);
    document.documentElement.dataset.shotSeed = String(game.seed);
  }
  game.frozen = true;
}

// Starts a run on the next seed and plays it until the scene's moment; false if the run ended first.
function playRunToScene(game, request) {
  startNewRun(game);
  const world = game.world;
  const pilot = createAutopilot();
  const reached = SCENE_REACHED[request.scene] ?? SCENE_REACHED.play;
  const targetWave = request.wave || SCENE_WAVE[request.scene] || 5;
  for (let steps = 0; steps < STEP_LIMIT; steps++) {
    if (reached(world, targetWave)) return true;
    if (world.phase === 'gameOver' || world.phase === 'victory') return false;
    if (world.phase === 'choosingBoon') chooseBoon(world, world.rng.int(0, world.boonChoices.length - 1));
    const tired = request.scene === 'gameover' && world.wave.number >= targetWave && world.wave.killed >= 6;
    stepWorld(world, tired ? idleControls() : steerAutopilot(pilot, world, STEP_SECONDS), STEP_SECONDS);
    world.sounds.length = 0;
  }
  return false;
}

const SCENE_WAVE = { play: 7, boon: 4, gameover: 8 };

const SCENE_REACHED = {
  play: (world, wave) =>
    world.phase === 'playing' &&
    world.wave.number >= wave &&
    world.wave.bannerClock <= 0 &&
    world.combo.count >= 8 &&
    world.inkBlobs.length >= 2 &&
    world.enemies.filter((enemy) => enemy.grow >= 1).length >= 10,
  boon: (world, wave) => world.phase === 'choosingBoon' && world.wave.number >= wave,
  gameover: (world, wave) => world.phase === 'gameOver' && world.wave.number >= wave,
  victory: (world) => world.phase === 'victory',
};

function stepTitleDemo(game) {
  const demo = game.demoWorld;
  if (demo.phase === 'choosingBoon') chooseBoon(demo, 0);
  stepWorld(demo, steerAutopilot(game.demoPilot, demo, STEP_SECONDS), STEP_SECONDS);
  demo.sounds.length = 0;
}
