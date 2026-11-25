// The Golden Ladle — mouse and keyboard. A click is turned into a kitchen action by
// asking the renderer where things are: the counter slots, the chopping board, the two
// stove burners, the plate and its items, the serve and clear buttons, and the title
// and game-over buttons. Keys mirror the same actions so the game plays either way.

import { COUNTER_ORDER, LAYOUT } from './config.js';
import { toggleMute } from './audio.js';
import {
  SCREENS,
  clearPlate,
  clickChoppingBoard,
  clickPlate,
  clickPlateItem,
  clickStove,
  discardHand,
  pickFromCounter,
  servePlate,
  startShift,
} from './state.js';
import { burnerRect, counterSlotRect, plateItemRect, pointInRect } from './render.js';

function canvasPosition(event, canvas) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (canvas.width / rect.width),
    y: (event.clientY - rect.top) * (canvas.height / rect.height),
  };
}

export function handleClick(world, canvas, event) {
  const position = canvasPosition(event, canvas);
  if (world.screen === SCREENS.TITLE) {
    if (pointInRect(position.x, position.y, LAYOUT.start)) startShift(world);
    return position;
  }
  if (world.screen === SCREENS.OVER) {
    const again = { ...LAYOUT.start, y: LAYOUT.start.y - 40 };
    if (pointInRect(position.x, position.y, again)) startShift(world);
    return position;
  }
  if (pointInRect(position.x, position.y, LAYOUT.serve)) {
    servePlate(world);
    return position;
  }
  if (pointInRect(position.x, position.y, LAYOUT.bin)) {
    clearPlate(world);
    return position;
  }
  if (pointInRect(position.x, position.y, LAYOUT.chopping)) {
    clickChoppingBoard(world);
    return position;
  }
  for (let index = 0; index < 2; index += 1) {
    if (pointInRect(position.x, position.y, burnerRect(index))) {
      clickStove(world, index);
      return position;
    }
  }
  for (let index = 0; index < world.plate.length; index += 1) {
    if (pointInRect(position.x, position.y, plateItemRect(index, world.plate.length))) {
      clickPlateItem(world, index);
      return position;
    }
  }
  if (pointInRect(position.x, position.y, LAYOUT.plate)) {
    clickPlate(world);
    return position;
  }
  for (let index = 0; index < COUNTER_ORDER.length; index += 1) {
    if (pointInRect(position.x, position.y, counterSlotRect(index))) {
      pickFromCounter(world, COUNTER_ORDER[index]);
      return position;
    }
  }
  return position;
}

export function handleKey(world, event) {
  if (event.repeat) return;
  const key = event.key.toLowerCase();
  if (key === 'm') {
    toggleMute();
    return;
  }
  if (world.screen === SCREENS.TITLE || world.screen === SCREENS.OVER) {
    if (key === 'enter' || key === ' ') startShift(world);
    return;
  }
  if (key >= '1' && key <= '9') {
    const index = Number(key) - 1;
    if (index < COUNTER_ORDER.length) pickFromCounter(world, COUNTER_ORDER[index]);
    return;
  }
  if (key === ' ') {
    event.preventDefault();
    clickChoppingBoard(world);
    return;
  }
  if (key === 'enter') {
    servePlate(world);
    return;
  }
  if (key === 'b') {
    if (!discardHand(world)) clearPlate(world);
  }
}

export function handleMouseMove(canvas, event) {
  return canvasPosition(event, canvas);
}
