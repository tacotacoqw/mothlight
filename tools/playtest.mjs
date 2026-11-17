// Play-test in a real browser: drives the game in headless Chrome with real mouse and key events
// and checks the whole loop: title -> play -> pause -> boon choice -> game over -> restart -> title.
//   node tools/playtest.mjs

import { connectToPage, launchChrome, serveGame, sleep } from './headlessChrome.mjs';

const checks = [];
function check(name, passed, detail = '') {
  checks.push(passed);
  console.log(`${passed ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

async function main() {
  const server = await serveGame();
  const { chrome, port } = await launchChrome();
  try {
    const page = await connectToPage(port);
    const state = () => page.evaluate(`(() => { const g = window.mothlight; const w = g.world; return {
      screen: g.screen, paused: g.paused, phase: w && w.phase, wave: w && w.wave.number, score: w && w.score,
      wings: w && w.moth.wings, mothX: w && w.moth.x, mothY: w && w.moth.y, kills: w && w.stats.kills,
      lanternSpeed: w && w.lanterns[0].speed, dashCooldown: w && w.moth.dashCooldown, flare: w && w.flareCharge,
      choices: w && w.boonChoices.length, taken: w && Object.values(w.boons.taken).reduce((sum, level) => sum + level, 0),
      summary: g.summary }; })()`);
    const mouse = (type, x, y, button = 'none') =>
      page.send('Input.dispatchMouseEvent', { type, x, y, button, clickCount: type === 'mouseMoved' ? 0 : 1 });
    const click = async (x, y, button = 'left') => {
      await mouse('mousePressed', x, y, button);
      await mouse('mouseReleased', x, y, button);
    };
    const key = async (code, text) => {
      const keyName = text ?? code;
      await page.send('Input.dispatchKeyEvent', { type: 'keyDown', code, key: keyName, text });
      await sleep(40);
      await page.send('Input.dispatchKeyEvent', { type: 'keyUp', code, key: keyName });
    };

    await page.send('Page.navigate', { url: `http://127.0.0.1:${server.address().port}/index.html` });
    await sleep(1200);
    let now = await state();
    check('opens on the title screen', now.screen === 'title');

    await click(640, 600);
    await sleep(300);
    now = await state();
    check('a click starts a run on wave 1', now.screen === 'run' && now.phase === 'playing' && now.wave === 1);

    await mouse('mouseMoved', 300, 300);
    await sleep(1700);
    now = await state();
    check('the moth flies to the cursor', Math.hypot(now.mothX - 300, now.mothY - 300) < 40, `${Math.round(now.mothX)},${Math.round(now.mothY)}`);

    let fastest = 0;
    // About one circle a second, as a hand does it: 7 radians a second on an 80 pixel radius.
    const circlingFrom = Date.now();
    for (let i = 0; Date.now() - circlingFrom < 4000; i++) {
      const angle = ((Date.now() - circlingFrom) / 1000) * 7;
      await mouse('mouseMoved', 640 + Math.cos(angle) * 80, 420 + Math.sin(angle) * 80);
      await sleep(12);
      if (i % 10 === 0) fastest = Math.max(fastest, (await state()).lanternSpeed);
    }
    check('circling the mouse whirls the lantern', fastest > 500, `${Math.round(fastest)} px/s`);

    await key('Space', ' ');
    await sleep(60);
    now = await state();
    check('Space dashes', now.dashCooldown > 0);

    await key('KeyP', 'p');
    await sleep(100);
    const pausedAt = await state();
    await sleep(300);
    now = await state();
    check('P pauses the run', now.paused && now.mothX === pausedAt.mothX);
    await key('KeyP', 'p');
    await sleep(100);
    check('P resumes the run', !(await state()).paused);

    await key('KeyD', 'd');
    await page.send('Input.dispatchKeyEvent', { type: 'keyDown', code: 'KeyD', key: 'd' });
    const before = await state();
    await sleep(500);
    now = await state();
    await page.send('Input.dispatchKeyEvent', { type: 'keyUp', code: 'KeyD', key: 'd' });
    check('WASD flies the moth', now.mothX > before.mothX + 60, `${Math.round(before.mothX)} -> ${Math.round(now.mothX)}`);

    // Let the game's own autopilot finish wave 1, then pick a boon with the keyboard. The
    // autopilot is reckless, so the test lends it spare wings: this checks the flow, not the bot.
    const lendWings = 'window.mothlight.world.moth.maxWings = 6; window.mothlight.world.moth.wings = 6;';
    await page.evaluate(`${lendWings} window.mothlight.autopilotEnabled = true`);
    for (let i = 0; i < 600 && (await state()).phase === 'playing'; i++) await sleep(200);
    now = await state();
    check('clearing a wave offers three boons', now.phase === 'choosingBoon' && now.choices === 3, `score ${now.score}, kills ${now.kills}`);
    await key('Digit2', '2');
    await sleep(200);
    now = await state();
    check('pressing 2 takes a boon and opens wave 2', now.phase === 'playing' && now.wave === 2 && now.taken === 1);
    await page.evaluate(lendWings);

    for (let i = 0; i < 600 && (await state()).phase === 'playing'; i++) await sleep(200);
    now = await state();
    if (now.phase === 'choosingBoon') {
      await click(640, 460);
      await sleep(200);
      now = await state();
      check('clicking a boon card takes it', now.phase === 'playing' && now.taken === 2 && now.wave === 3);
    }

    // Stop flying and let the gloom win.
    await page.evaluate('window.mothlight.autopilotEnabled = false; window.mothlight.world.moth.wings = 1;');
    await mouse('mouseMoved', 640, 420);
    for (let i = 0; i < 900 && (await state()).phase !== 'gameOver'; i++) {
      if ((await state()).phase === 'choosingBoon') await key('Digit1', '1');
      await sleep(200);
    }
    now = await state();
    check('losing every wing ends the run with a summary', now.phase === 'gameOver' && now.summary && now.summary.score === now.score, `score ${now.score}`);

    await key('KeyR', 'r');
    await sleep(300);
    now = await state();
    check('R restarts from wave 1 with a clean score', now.phase === 'playing' && now.wave === 1 && now.score < 50 && now.wings === 3);

    await key('KeyP', 'p');
    await key('KeyR', 'r');
    await sleep(200);
    check('R restarts from the pause screen', !(await state()).paused);

    check('no page errors', page.problems.length === 0, page.problems.join(' | '));
    page.close();
  } finally {
    chrome.kill();
    server.close();
  }
  process.exit(checks.every(Boolean) ? 0 : 1);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
