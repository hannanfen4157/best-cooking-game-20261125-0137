// The screenshot scenes behind ?shot=cover|rush|serve|title. Each one plays the real
// rules forward from a fresh world with a fixed seed — picking ingredients up, chopping
// them, cooking them, plating and serving — so the frame is what a real game looks
// like, and the same seed always gives the same frame. The cover shows a dish
// mid-assembly; the rush shows the last minute with a full plate; the serve shot
// catches the moment just after a dish goes out.

import { INGREDIENTS, RECIPES } from './config.js';
import {
  SCREENS,
  clickChoppingBoard,
  clickPlate,
  clickStove,
  createWorld,
  pickFromCounter,
  servePlate,
  startShift,
  stepWorld,
} from './state.js';

const STEP = 1 / 60;

function recipeById(id) {
  return RECIPES.find((recipe) => recipe.id === id);
}

function stepFor(world, seconds) {
  const steps = Math.round(seconds / STEP);
  for (let index = 0; index < steps; index += 1) stepWorld(world, STEP);
}

// Pick an ingredient up, prepare it (chop or cook) and put it on the plate, using the
// same actions a player's clicks call.
function prepareAndPlate(world, id) {
  const def = INGREDIENTS[id];
  pickFromCounter(world, id);
  if (def.chop) {
    clickChoppingBoard(world);
    clickChoppingBoard(world);
    clickChoppingBoard(world);
    clickChoppingBoard(world);
  } else if (def.cook) {
    clickStove(world, 0);
    for (let guard = 0; guard < 400; guard += 1) {
      stepWorld(world, 0.25);
      const burner = world.burners[0];
      if (burner === null || burner.state === 'done') break;
    }
    clickStove(world, 0);
  }
  clickPlate(world);
}

function serveDish(world, recipeId) {
  const recipe = recipeById(recipeId);
  for (const need of recipe.needs) prepareAndPlate(world, need);
  servePlate(world);
}

// The board for a staged scene: the named dishes, each with its patience set so the
// bars read at a glance.
function setOrders(world, entries) {
  world.orders = entries.map(([recipeId, patience], index) => {
    const recipe = recipeById(recipeId);
    return { uid: index + 1, recipe, patience, maxPatience: 45 };
  });
  world.nextOrderUid = entries.length + 1;
}

function stageCover(world) {
  startShift(world);
  setOrders(world, [['pasta', 38], ['salad', 30], ['burger', 22]]);
  // One dish already out the door, so the score is real.
  serveDish(world, 'salad');
  // A fresh order takes its place on the board.
  setOrders(world, [['pasta', 38], ['soup', 30], ['burger', 22]]);
  // A second dish mid-assembly: tomato and cheese on the plate, pasta on the stove.
  prepareAndPlate(world, 'tomato');
  prepareAndPlate(world, 'cheese');
  pickFromCounter(world, 'pasta');
  clickStove(world, 0);
  stepFor(world, 3);
  // And a mushroom half-chopped on the board for the next dish.
  pickFromCounter(world, 'mushroom');
  clickChoppingBoard(world);
  clickChoppingBoard(world);
  world.timeLeft = 125;
  world.message = 'Pasta is on — tomato and cheese are plated!';
  world.messageTimer = 30;
  return { screen: SCREENS.PLAY };
}

function stageRush(world) {
  startShift(world);
  // A burger finished on the plate, ready to serve, and soup coming off the stove.
  prepareAndPlate(world, 'bread');
  prepareAndPlate(world, 'lettuce');
  prepareAndPlate(world, 'tomato');
  pickFromCounter(world, 'patty');
  clickStove(world, 0);
  for (let guard = 0; guard < 400; guard += 1) {
    stepWorld(world, 0.25);
    const burner = world.burners[0];
    if (burner === null || burner.state === 'done') break;
  }
  clickStove(world, 0);
  clickPlate(world);
  // The board is set once the cooking is done, so no order can expire mid-scene.
  setOrders(world, [['burger', 7], ['soup', 18], ['stirfry', 26]]);
  world.timeLeft = 42;
  world.hearts = 1;
  world.combo = 3;
  world.comboTimer = 5;
  world.score = 86;
  world.coins = 86;
  world.served = 5;
  pickFromCounter(world, 'soup');
  clickStove(world, 1);
  stepFor(world, 4);
  world.timeLeft = 42;
  world.message = 'Rush hour! That burger is ready — SERVE it!';
  world.messageTimer = 30;
  return { screen: SCREENS.PLAY };
}

function stageServe(world) {
  startShift(world);
  setOrders(world, [['burger', 34], ['pasta', 28], ['soup', 40]]);
  serveDish(world, 'burger');
  world.timeLeft = 152;
  world.messageTimer = 30;
  return { screen: SCREENS.PLAY };
}

function stageTitle(world) {
  return { screen: SCREENS.TITLE };
}

export function stageShot(name, seed = 7) {
  const world = createWorld(seed);
  world.best = 64;
  if (name === 'rush') return { world, ...stageRush(world) };
  if (name === 'serve') return { world, ...stageServe(world) };
  if (name === 'title') return { world, ...stageTitle(world) };
  return { world, ...stageCover(world) };
}
