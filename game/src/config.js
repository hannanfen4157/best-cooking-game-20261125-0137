// The Golden Ladle — configuration: the kitchen's size, the ingredients, the recipes
// and the rules of a shift. Everything the other modules need to know lives here so a
// new dish or a new ingredient is one small edit, never a hunt through the code.

export const VIEW = { width: 1280, height: 720 };
export const SHIFT_SECONDS = 180;
export const MAX_ORDERS = 3;
export const ORDER_WAIT = 45;
export const START_HEARTS = 3;
export const COMBO_WINDOW = 6;
export const STEP = 1 / 60;

// An ingredient knows its name, the colour it is drawn with, whether it must be chopped
// before it can be plated, whether it must be cooked, and how long it takes to cook.
export const INGREDIENTS = {
  tomato:   { name: 'Tomato',   color: '#e2483d', chop: true,  cook: false, cookSeconds: 0 },
  lettuce:  { name: 'Lettuce',  color: '#57b25e', chop: true,  cook: false, cookSeconds: 0 },
  cheese:   { name: 'Cheese',   color: '#f2c230', chop: false, cook: false, cookSeconds: 0 },
  bread:    { name: 'Bread',    color: '#d99a4e', chop: false, cook: false, cookSeconds: 0 },
  mushroom: { name: 'Mushroom', color: '#c9a186', chop: true,  cook: false, cookSeconds: 0 },
  pasta:    { name: 'Pasta',    color: '#f0d089', chop: false, cook: true,  cookSeconds: 8 },
  patty:    { name: 'Patty',    color: '#8a5a3b', chop: false, cook: true,  cookSeconds: 10 },
  onion:    { name: 'Onion',    color: '#e8d5f2', chop: true,  cook: false, cookSeconds: 0 },
  soup:     { name: 'Soup Pot', color: '#c96a2e', chop: false, cook: true,  cookSeconds: 12 },
};

// A recipe is a dish: the ingredients it needs (each listed once, in serving order), its
// base pay, and the short name the order board shows.
export const RECIPES = [
  { id: 'salad',   name: 'Garden Salad',  pay: 12, needs: ['lettuce', 'tomato', 'cheese'] },
  { id: 'pasta',   name: 'Tomato Pasta',  pay: 18, needs: ['pasta', 'tomato', 'cheese'] },
  { id: 'burger',  name: 'Golden Burger', pay: 22, needs: ['bread', 'patty', 'lettuce', 'tomato'] },
  { id: 'soup',    name: 'Mushroom Soup', pay: 16, needs: ['soup', 'mushroom', 'onion'] },
  { id: 'bruschetta', name: 'Bruschetta', pay: 14, needs: ['bread', 'tomato', 'cheese'] },
  { id: 'stirfry', name: 'Mushroom Pasta', pay: 20, needs: ['pasta', 'mushroom', 'onion', 'cheese'] },
];

// The order in which ingredients sit on the counter, left to right.
export const COUNTER_ORDER = ['tomato', 'lettuce', 'cheese', 'bread', 'mushroom', 'pasta', 'patty', 'onion', 'soup'];

// Layout of the kitchen, in canvas pixels. The top strip is the order board, the middle
// is the work area (chopping board, stove, plate), the bottom is the ingredient counter.
export const LAYOUT = {
  board:    { x: 24,  y: 16,  width: 1232, height: 118 },
  boardSlot:{ width: 392, height: 102, gap: 16 },
  chopping: { x: 60,  y: 210, width: 330, height: 210 },
  stove:    { x: 470, y: 210, width: 330, height: 210 },
  plate:    { x: 880, y: 210, width: 330, height: 210 },
  counter:  { x: 24,  y: 470, width: 1232, height: 150 },
  serve:    { x: 1010, y: 640, width: 200, height: 56 },
  bin:      { x: 880,  y: 430, width: 120, height: 40 },
  start:    { x: 490, y: 560, width: 300, height: 64 },
};

// How a new order is picked: dishes the player has already served come back a little
// less often, so the board keeps surprising them.
export function pickRecipe(random, servedCounts) {
  let total = 0;
  const weights = RECIPES.map((recipe) => {
    const weight = 1 / (1 + 0.6 * (servedCounts[recipe.id] ?? 0));
    total += weight;
    return weight;
  });
  let roll = random() * total;
  for (let index = 0; index < RECIPES.length; index += 1) {
    roll -= weights[index];
    if (roll <= 0) return RECIPES[index];
  }
  return RECIPES[RECIPES.length - 1];
}
