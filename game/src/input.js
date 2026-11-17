// Keyboard and mouse: turns raw browser events into the controls the moth flies by and menu presses.

import { VIEW } from './config.js';

const MOVE_KEYS = {
  KeyW: [0, -1], ArrowUp: [0, -1],
  KeyS: [0, 1], ArrowDown: [0, 1],
  KeyA: [-1, 0], ArrowLeft: [-1, 0],
  KeyD: [1, 0], ArrowRight: [1, 0],
};

export function createInput(canvas) {
  const held = new Set();
  const pressed = new Set();
  const pointer = { x: VIEW.width / 2, y: VIEW.height / 2, clicked: false, rightClicked: false, steering: true };

  function toViewPoint(event) {
    const box = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - box.left) / box.width) * VIEW.width;
    pointer.y = ((event.clientY - box.top) / box.height) * VIEW.height;
  }

  window.addEventListener('keydown', (event) => {
    if (event.code in MOVE_KEYS || event.code === 'Space') event.preventDefault();
    if (!event.repeat) pressed.add(event.code);
    held.add(event.code);
    if (event.code in MOVE_KEYS) pointer.steering = false;
  });
  window.addEventListener('keyup', (event) => held.delete(event.code));
  window.addEventListener('blur', () => held.clear());
  window.addEventListener('mousemove', (event) => {
    toViewPoint(event);
    pointer.steering = true;
  });
  window.addEventListener('mousedown', (event) => {
    toViewPoint(event);
    if (event.button === 0) pointer.clicked = true;
    if (event.button === 2) pointer.rightClicked = true;
  });
  window.addEventListener('contextmenu', (event) => event.preventDefault());

  return {
    pointer,
    wasPressed: (code) => pressed.has(code),
    anyPressed: (...codes) => codes.some((code) => pressed.has(code)),

    // The controls for one simulation step, in the shape the autopilot also returns.
    readFlightControls() {
      let moveX = 0;
      let moveY = 0;
      for (const code of held) {
        const push = MOVE_KEYS[code];
        if (push) {
          moveX += push[0];
          moveY += push[1];
        }
      }
      return {
        useAim: pointer.steering,
        aimX: pointer.x,
        aimY: pointer.y,
        moveX,
        moveY,
        dash: pointer.clicked || pressed.has('Space'),
        flare: pointer.rightClicked || pressed.has('KeyE') || pressed.has('ShiftLeft'),
      };
    },

    // Forget this frame's presses and clicks once they have been acted on.
    endFrame() {
      pressed.clear();
      pointer.clicked = false;
      pointer.rightClicked = false;
    },
  };
}
