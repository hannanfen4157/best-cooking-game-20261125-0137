// The Golden Ladle — the state of one shift and the rules that move it. The module
// knows nothing about the canvas or the mouse: it takes actions (pick up, chop, cook,
// plate, serve) and steps time forward, and the renderer and the input handler read
// what it holds. That split is what lets the screenshot scenes play the real game.

import {
  COMBO_WINDOW,
  INGREDIENTS,
  MAX_ORDERS,
  ORDER_WAIT,
  SHIFT_SECONDS,
  START_HEARTS,
  pickRecipe,
} from './config.js';
import { SOUNDS } from './audio.js';
import { clockSeed, makeRandom } from './random.js';

const CHOPS_NEEDED = 3;
const BURN_AFTER = 1.45;
export const SCREENS = { TITLE: 'title', PLAY: 'play', OVER: 'over' };

function freshHand(id) {
  return { id, chopped: false, cooked: false };
}

function ingredientReady(hand) {
  if (hand === null) return false;
  const def = INGREDIENTS[hand.id];
  if (def.chop && !hand.chopped) return false;
  if (def.cook && !hand.cooked) return false;
  return true;
}

function sameDish(plate, recipe) {
  if (plate.length !== recipe.needs.length) return false;
  const counts = new Map();
  for (const item of plate) counts.set(item.id, (counts.get(item.id) ?? 0) + 1);
  for (const need of recipe.needs) {
    const left = counts.get(need) ?? 0;
    if (left === 0) return false;
    counts.set(need, left - 1);
  }
  return true;
}

function matchingOrder(world) {
  for (const order of world.orders) {
    if (sameDish(world.plate, order.recipe)) return order;
  }
  return null;
}

function say(world, text) {
  world.message = text;
  world.messageTimer = 2.2;
}

function spawnOrder(world) {
  const recipe = pickRecipe(world.random, world.servedCounts);
  const elapsed = SHIFT_SECONDS - world.timeLeft;
  const patience = Math.max(30, ORDER_WAIT - elapsed / 12);
  world.orders.push({
    uid: world.nextOrderUid,
    recipe,
    patience,
    maxPatience: patience,
  });
  world.nextOrderUid += 1;
  SOUNDS.order();
}

function spawnInterval(world) {
  const elapsed = SHIFT_SECONDS - world.timeLeft;
  return Math.max(7, 14 - elapsed / 25);
}

export function createWorld(seed = clockSeed()) {
  return {
    screen: SCREENS.TITLE,
    seed,
    random: makeRandom(seed),
    timeLeft: SHIFT_SECONDS,
    score: 0,
    coins: 0,
    served: 0,
    hearts: START_HEARTS,
    combo: 0,
    comboTimer: 0,
    orders: [],
    hand: null,
    board: null,
    burners: [null, null],
    plate: [],
    spawnTimer: 4,
    nextOrderUid: 1,
    servedCounts: {},
    message: 'Welcome to The Golden Ladle!',
    messageTimer: 3,
    best: 0,
    stats: { chopped: 0, cooked: 0, burned: 0, expired: 0 },
  };
}

export function startShift(world) {
  const fresh = createWorld(world.seed);
  fresh.best = world.best;
  Object.assign(world, fresh);
  world.screen = SCREENS.PLAY;
  spawnOrder(world);
  world.spawnTimer = spawnInterval(world);
  say(world, 'First order is in — get cooking!');
}

export function endShift(world) {
  world.screen = SCREENS.OVER;
  world.best = Math.max(world.best, world.score);
  SOUNDS.fanfare();
}

// --- Actions: what a click or a key does. Each returns true when it did something. ---

export function pickFromCounter(world, id) {
  if (world.screen !== SCREENS.PLAY) return false;
  if (world.hand !== null) {
    SOUNDS.wrong();
    say(world, 'Hands full — plate it or bin it first.');
    return false;
  }
  world.hand = freshHand(id);
  SOUNDS.pickup();
  return true;
}

export function clickChoppingBoard(world) {
  if (world.screen !== SCREENS.PLAY) return false;
  if (world.board !== null) {
    world.board.chops += 1;
    SOUNDS.chop();
    if (world.board.chops >= CHOPS_NEEDED) {
      world.hand = { id: world.board.id, chopped: true, cooked: false };
      world.board = null;
      world.stats.chopped += 1;
      say(world, `${INGREDIENTS[world.hand.id].name} chopped and ready!`);
    }
    return true;
  }
  const hand = world.hand;
  if (hand !== null && INGREDIENTS[hand.id].chop && !hand.chopped) {
    world.board = { id: hand.id, chops: 0 };
    world.hand = null;
    SOUNDS.chop();
    return true;
  }
  SOUNDS.wrong();
  say(world, 'Nothing to chop here.');
  return false;
}

export function clickStove(world, burnerIndex) {
  if (world.screen !== SCREENS.PLAY) return false;
  const burner = world.burners[burnerIndex];
  if (burner === null) {
    const hand = world.hand;
    if (hand !== null && INGREDIENTS[hand.id].cook && !hand.cooked) {
      world.burners[burnerIndex] = { id: hand.id, progress: 0, state: 'cooking' };
      world.hand = null;
      SOUNDS.sizzle();
      return true;
    }
    SOUNDS.wrong();
    say(world, 'That does not go on the stove.');
    return false;
  }
  if (burner.state === 'burned') {
    world.burners[burnerIndex] = null;
    world.stats.burned += 1;
    SOUNDS.burn();
    say(world, 'Burned! Tossed in the bin.');
    return true;
  }
  if (burner.state === 'done') {
    world.hand = { id: burner.id, chopped: false, cooked: true };
    world.burners[burnerIndex] = null;
    world.stats.cooked += 1;
    SOUNDS.pickup();
    return true;
  }
  SOUNDS.wrong();
  say(world, 'Still cooking — wait for the ding!');
  return false;
}

export function clickPlate(world) {
  if (world.screen !== SCREENS.PLAY) return false;
  const hand = world.hand;
  if (hand === null) {
    SOUNDS.wrong();
    say(world, 'Pick up an ingredient first.');
    return false;
  }
  if (!ingredientReady(hand)) {
    const def = INGREDIENTS[hand.id];
    SOUNDS.wrong();
    say(world, def.chop ? `${def.name} needs chopping first!` : `${def.name} needs cooking first!`);
    return false;
  }
  if (world.plate.length >= 5) {
    SOUNDS.wrong();
    say(world, 'The plate is full!');
    return false;
  }
  world.plate.push(hand);
  world.hand = null;
  SOUNDS.pickup();
  return true;
}

export function clickPlateItem(world, index) {
  if (world.screen !== SCREENS.PLAY) return false;
  if (index < 0 || index >= world.plate.length) return false;
  world.plate.splice(index, 1);
  SOUNDS.pickup();
  say(world, 'Binned that ingredient.');
  return true;
}

export function clearPlate(world) {
  if (world.screen !== SCREENS.PLAY || world.plate.length === 0) return false;
  world.plate = [];
  SOUNDS.wrong();
  say(world, 'Plate cleared.');
  return true;
}

export function servePlate(world) {
  if (world.screen !== SCREENS.PLAY) return false;
  if (world.plate.length === 0) {
    SOUNDS.wrong();
    say(world, 'The plate is empty!');
    return false;
  }
  const order = matchingOrder(world);
  if (order === null) {
    SOUNDS.wrong();
    say(world, 'No order matches this plate — check the board!');
    return false;
  }
  const tip = Math.round((order.patience / order.maxPatience) * 8);
  const comboBonus = world.combo * 2;
  const pay = order.recipe.pay + tip + comboBonus;
  world.score += pay;
  world.coins += pay;
  world.served += 1;
  world.servedCounts[order.recipe.id] = (world.servedCounts[order.recipe.id] ?? 0) + 1;
  world.combo += 1;
  world.comboTimer = COMBO_WINDOW;
  world.orders = world.orders.filter((candidate) => candidate.uid !== order.uid);
  world.plate = [];
  SOUNDS.serve();
  say(world, `Served ${order.recipe.name}! +$${pay}${tip > 0 ? ` (tip $${tip})` : ''}${comboBonus > 0 ? ` combo +$${comboBonus}` : ''}`);
  return true;
}

export function discardHand(world) {
  if (world.hand === null) return false;
  world.hand = null;
  SOUNDS.wrong();
  say(world, 'Binned it.');
  return true;
}

// The order the plate could complete, if any — the serve button lights up for it.
export function plateMatches(world) {
  return matchingOrder(world) !== null;
}

export function stepWorld(world, dt) {
  if (world.screen !== SCREENS.PLAY) return;
  world.timeLeft = Math.max(0, world.timeLeft - dt);
  if (world.messageTimer > 0) world.messageTimer -= dt;
  if (world.comboTimer > 0) {
    world.comboTimer -= dt;
    if (world.comboTimer <= 0) world.combo = 0;
  }
  world.spawnTimer -= dt;
  if (world.spawnTimer <= 0) {
    if (world.orders.length < MAX_ORDERS) spawnOrder(world);
    world.spawnTimer = spawnInterval(world);
  }
  for (let index = world.orders.length - 1; index >= 0; index -= 1) {
    const order = world.orders[index];
    order.patience -= dt;
    if (order.patience <= 0) {
      world.orders.splice(index, 1);
      world.hearts -= 1;
      world.combo = 0;
      world.comboTimer = 0;
      world.stats.expired += 1;
      SOUNDS.wrong();
      say(world, `A customer walked out — ${order.recipe.name} lost!`);
      if (world.hearts <= 0) {
        endShift(world);
        return;
      }
    }
  }
  for (const burner of world.burners) {
    if (burner === null) continue;
    burner.progress += dt / INGREDIENTS[burner.id].cookSeconds;
    if (burner.state === 'cooking' && burner.progress >= 1) {
      burner.state = 'done';
      SOUNDS.ding();
      say(world, `${INGREDIENTS[burner.id].name} is ready!`);
    } else if (burner.state === 'done' && burner.progress >= BURN_AFTER) {
      burner.state = 'burned';
      SOUNDS.burn();
      say(world, `The ${INGREDIENTS[burner.id].name} burned!`);
    }
  }
  if (world.timeLeft <= 0) endShift(world);
}
