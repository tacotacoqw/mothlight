// Mothlight entry point: sets up the canvas, runs the fixed-step loop and paints each frame.

import { STEP_SECONDS, VIEW } from './config.js';
import { createInput } from './input.js';
import { createGame, handleMenuInput, stepGame } from './gameFlow.js';
import { paintScene } from './render/scene.js';
import { paintHud } from './render/hud.js';
import { paintBoonScreen, paintGameOverScreen, paintPauseScreen, paintTitleScreen, paintVictoryScreen } from './render/screens.js';
import { createSoundEffects } from './audio/soundEffects.js';
import { createNightMusic } from './audio/nightMusic.js';
import { readShotRequest, stageScreenshotScene } from './screenshotScenes.js';
import { TOTAL_WAVES } from './config.js';
import { createAutopilot, steerAutopilot } from './autopilot.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = createInput(canvas);
const soundEffects = createSoundEffects();
const nightMusic = createNightMusic(soundEffects);
const game = createGame(Math.floor(Date.now() % 100000));

// For the browser console and tools/playtest.mjs: inspect the game, or set
// `mothlight.autopilotEnabled = true` to watch the autopilot fly your run.
const playtestPilot = createAutopilot();
game.autopilotEnabled = false;
window.mothlight = game;

let pixelScale = 1;
let lastFrameAt = 0;
let unspentSeconds = 0;
let clock = 0;

function fitCanvasToWindow() {
  const fit = Math.min(window.innerWidth / VIEW.width, window.innerHeight / VIEW.height);
  const density = Math.min(window.devicePixelRatio || 1, 2);
  canvas.style.width = `${Math.round(VIEW.width * fit)}px`;
  canvas.style.height = `${Math.round(VIEW.height * fit)}px`;
  canvas.width = Math.round(VIEW.width * fit * density);
  canvas.height = Math.round(VIEW.height * fit * density);
  pixelScale = canvas.width / VIEW.width;
}

function runFrame(now) {
  const elapsed = Math.min(0.1, (now - lastFrameAt) / 1000 || 0);
  lastFrameAt = now;

  if (input.pointer.clicked || input.pointer.rightClicked || input.anyPressed('Enter', 'Space', 'KeyR')) soundEffects.unlock();
  if (input.wasPressed('KeyM')) soundEffects.toggleMute();
  const wasPlaying = isFlying();
  handleMenuInput(game, input);

  if (!game.frozen) {
    clock += elapsed;
    unspentSeconds += elapsed;
    let controls = input.readFlightControls();
    // A click that just closed a menu must not also dash.
    if (!wasPlaying) controls = { ...controls, dash: false, flare: false };
    while (unspentSeconds >= STEP_SECONDS) {
      const flownByPilot = game.autopilotEnabled && game.screen === 'run';
      stepGame(game, flownByPilot ? steerAutopilot(playtestPilot, game.world, STEP_SECONDS) : controls);
      controls = { ...controls, dash: false, flare: false };
      unspentSeconds -= STEP_SECONDS;
    }
  }
  if (game.world) soundEffects.playQueued(game.world.sounds);
  nightMusic.update(game.screen === 'run' ? game.world.wave.number / TOTAL_WAVES : 0);

  paintFrame();
  input.endFrame();
  requestAnimationFrame(runFrame);
}

function isFlying() {
  return game.screen === 'run' && game.world.phase === 'playing' && !game.paused;
}

function paintFrame() {
  ctx.setTransform(pixelScale, 0, 0, pixelScale, 0, 0);
  if (game.screen === 'title') {
    paintScene(ctx, game.demoWorld, clock);
    paintTitleScreen(ctx, game.bestScore, clock);
    return;
  }
  const world = game.world;
  paintScene(ctx, world, clock);
  paintHud(ctx, world, { bestScore: game.bestScore, muted: soundEffects.isMuted() }, clock);
  if (world.phase === 'choosingBoon') paintBoonScreen(ctx, world, input.pointer, clock);
  else if (world.phase === 'gameOver') paintGameOverScreen(ctx, game.summary, game.bestScore, game.isNewBest, clock);
  else if (world.phase === 'victory') paintVictoryScreen(ctx, game.summary, game.bestScore, game.isNewBest, clock);
  else if (game.paused) paintPauseScreen(ctx);
  else paintAimReticle();
  canvas.style.cursor = isFlying() ? 'none' : 'default';
}

// Shows where the moth is flying to while the system cursor is hidden.
function paintAimReticle() {
  if (!input.pointer.steering || game.frozen) return;
  ctx.beginPath();
  ctx.arc(input.pointer.x, input.pointer.y, 9, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 240, 207, 0.7)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

window.addEventListener('resize', fitCanvasToWindow);
fitCanvasToWindow();

const shotRequest = readShotRequest(window.location.search);
if (shotRequest) {
  stageScreenshotScene(game, shotRequest);
  clock = 2.6;
  document.documentElement.dataset.shot = 'ready';
}
requestAnimationFrame(runFrame);
