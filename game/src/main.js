// The Golden Ladle — entry point. It wires the canvas to the world: the animation
// loop steps time and draws every frame, the mouse and keyboard feed actions in, and
// a ?shot= name in the URL stages one of the screenshot scenes instead and draws it
// once, frozen, so a screenshot is always the same frame.

import { VIEW } from './config.js';
import { createWorld, stepWorld } from './state.js';
import { drawGame } from './render.js';
import { handleClick, handleKey, handleMouseMove } from './input.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const context = canvas.getContext('2d');
const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seedParam = Number(params.get('seed'));
const seed = Number.isFinite(seedParam) ? seedParam : 7;

let world = createWorld(seed);
let mouse = null;

if (shotName !== null) {
  // A screenshot scene: stage it, draw it once, and hold the frame.
  const staged = stageShot(shotName, seed);
  world = staged.world;
  document.title = `The Golden Ladle — ${shotName}`;
  drawGame(context, world, null);
} else {
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    stepWorld(world, dt);
    drawGame(context, world, mouse);
    requestAnimationFrame(frame);
  }

  canvas.addEventListener('click', (event) => {
    mouse = handleClick(world, canvas, event);
  });
  canvas.addEventListener('mousemove', (event) => {
    mouse = handleMouseMove(canvas, event);
  });
  canvas.addEventListener('mouseleave', () => {
    mouse = null;
  });
  window.addEventListener('keydown', (event) => {
    handleKey(world, event);
  });
  document.title = 'The Golden Ladle — a cozy bistro rush';
  requestAnimationFrame(frame);
}

// Handy for debugging and for the playtest driver; the game never reads it.
window.__world = world;

export { world };
