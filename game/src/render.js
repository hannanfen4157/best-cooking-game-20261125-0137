// The Golden Ladle — everything the player sees. The kitchen is drawn on one canvas
// with plain shapes and warm colours: a tiled wall, a wooden counter, the order board
// along the top, the chopping board, the stove and the serving plate in the middle, and
// the ingredients along the bottom. No image files are loaded, so the game never needs
// the network. This module also owns the hit geometry the input handler uses.

import { COUNTER_ORDER, INGREDIENTS, LAYOUT, SHIFT_SECONDS, VIEW } from './config.js';
import { plateMatches } from './state.js';

const FONT = '"Trebuchet MS", Verdana, sans-serif';
const CHOPS_NEEDED = 3;

export function pointInRect(x, y, rect) {
  return x >= rect.x && x < rect.x + rect.width && y >= rect.y && y < rect.y + rect.height;
}

export function counterSlotRect(index) {
  const slotWidth = 128;
  const gap = 8;
  return {
    x: LAYOUT.counter.x + 8 + index * (slotWidth + gap),
    y: LAYOUT.counter.y + 30,
    width: slotWidth,
    height: 108,
  };
}

export function burnerRect(index) {
  return {
    x: LAYOUT.stove.x + 20 + index * 160,
    y: LAYOUT.stove.y + 70,
    width: 130,
    height: 110,
  };
}

export function plateItemRect(index, count) {
  const centre = LAYOUT.plate.x + LAYOUT.plate.width / 2;
  const startX = centre - (count * 56) / 2;
  return {
    x: startX + index * 56 + 3,
    y: LAYOUT.plate.y + 78,
    width: 50,
    height: 50,
  };
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function text(ctx, value, x, y, size, color, weight = 'bold', align = 'left') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x, y);
}

// --- Ingredient icons: one small vector drawing per ingredient. ---

function drawIngredientIcon(ctx, id, cx, cy, size, mode = 'raw') {
  const r = size / 2;
  ctx.save();
  ctx.translate(cx, cy);
  if (mode === 'chopped') {
    // Chopped: three little chunks of the ingredient's colour.
    ctx.fillStyle = INGREDIENTS[id].color;
    const chunks = [[-r * 0.5, -r * 0.2], [r * 0.4, -r * 0.45], [0, r * 0.4]];
    for (const [dx, dy] of chunks) {
      ctx.beginPath();
      ctx.arc(dx, dy, r * 0.32, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    return;
  }
  if (id === 'tomato') {
    ctx.fillStyle = '#e2483d';
    ctx.beginPath(); ctx.arc(0, r * 0.1, r * 0.85, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3f8f3a';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.7); ctx.lineTo(-r * 0.4, -r * 0.25); ctx.lineTo(0, -r * 0.45);
    ctx.lineTo(r * 0.4, -r * 0.25); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath(); ctx.arc(-r * 0.35, -r * 0.25, r * 0.22, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'lettuce') {
    ctx.fillStyle = '#57b25e';
    for (const [dx, dy, radius] of [[-r * 0.4, r * 0.1, r * 0.55], [r * 0.35, -r * 0.1, r * 0.6], [0, r * 0.35, r * 0.5]]) {
      ctx.beginPath(); ctx.arc(dx, dy, radius, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = '#2f7a33';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-r * 0.7, r * 0.2); ctx.quadraticCurveTo(0, -r * 0.5, r * 0.7, r * 0.1); ctx.stroke();
  } else if (id === 'cheese') {
    ctx.fillStyle = '#f2c230';
    ctx.beginPath();
    ctx.moveTo(-r * 0.8, r * 0.5); ctx.lineTo(r * 0.8, r * 0.5); ctx.lineTo(r * 0.8, -r * 0.2);
    ctx.lineTo(-r * 0.2, -r * 0.6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#d99e1f';
    for (const [dx, dy] of [[r * 0.3, r * 0.15], [-r * 0.2, r * 0.2], [r * 0.45, -r * 0.05]]) {
      ctx.beginPath(); ctx.arc(dx, dy, r * 0.14, 0, Math.PI * 2); ctx.fill();
    }
  } else if (id === 'bread') {
    ctx.fillStyle = '#d99a4e';
    roundRect(ctx, -r * 0.85, -r * 0.3, r * 1.7, r * 0.8, r * 0.4); ctx.fill();
    ctx.fillStyle = '#b97a33';
    ctx.beginPath(); ctx.ellipse(0, -r * 0.25, r * 0.85, r * 0.35, 0, Math.PI, 0); ctx.fill();
    ctx.strokeStyle = '#8a5a24';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-r * 0.4, -r * 0.1); ctx.lineTo(-r * 0.4, r * 0.3); ctx.moveTo(r * 0.3, -r * 0.1); ctx.lineTo(r * 0.3, r * 0.3); ctx.stroke();
  } else if (id === 'mushroom') {
    ctx.fillStyle = '#c9a186';
    ctx.beginPath(); ctx.arc(0, -r * 0.1, r * 0.8, Math.PI, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f5e9dc';
    roundRect(ctx, -r * 0.25, -r * 0.1, r * 0.5, r * 0.8, r * 0.2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath(); ctx.arc(-r * 0.35, -r * 0.45, r * 0.14, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'pasta') {
    ctx.strokeStyle = '#f0d089';
    ctx.lineWidth = 5;
    for (let ring = 0; ring < 3; ring += 1) {
      ctx.beginPath();
      ctx.arc(0, 0, r * (0.3 + ring * 0.25), ring * 0.8, ring * 0.8 + Math.PI * 1.4);
      ctx.stroke();
    }
    ctx.fillStyle = '#c96a2e';
    ctx.beginPath(); ctx.arc(0, 0, r * 0.16, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'patty') {
    ctx.fillStyle = '#8a5a3b';
    roundRect(ctx, -r * 0.85, -r * 0.35, r * 1.7, r * 0.7, r * 0.3); ctx.fill();
    ctx.fillStyle = '#6e452a';
    ctx.beginPath(); ctx.arc(-r * 0.4, 0, r * 0.1, 0, Math.PI * 2); ctx.arc(r * 0.3, r * 0.05, r * 0.1, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'onion') {
    ctx.fillStyle = '#e8d5f2';
    ctx.beginPath(); ctx.arc(0, 0, r * 0.8, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#b98ac9';
    ctx.lineWidth = 2;
    for (let ring = 1; ring <= 2; ring += 1) {
      ctx.beginPath(); ctx.arc(0, 0, r * 0.25 * ring, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.strokeStyle = '#7fb069';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, -r * 0.8); ctx.quadraticCurveTo(r * 0.3, -r * 1.1, r * 0.45, -r * 0.9); ctx.stroke();
  } else if (id === 'soup') {
    ctx.fillStyle = '#c96a2e';
    ctx.beginPath(); ctx.arc(0, r * 0.1, r * 0.8, 0, Math.PI); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e8873d';
    ctx.beginPath(); ctx.ellipse(0, r * 0.1, r * 0.8, r * 0.25, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-r * 0.3, -r * 0.3); ctx.quadraticCurveTo(-r * 0.45, -r * 0.6, -r * 0.25, -r * 0.8); ctx.stroke();
  }
  if (mode === 'cooked') {
    ctx.strokeStyle = 'rgba(120, 70, 20, 0.55)';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, r * 0.95, 0.4, Math.PI * 1.1); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-r * 0.2, -r * 1.1); ctx.quadraticCurveTo(-r * 0.4, -r * 1.4, -r * 0.2, -r * 1.6);
    ctx.moveTo(r * 0.25, -r * 1.1); ctx.quadraticCurveTo(r * 0.05, -r * 1.4, r * 0.25, -r * 1.6);
    ctx.stroke();
  }
  ctx.restore();
}

function drawIngredientButton(ctx, id, rect, highlighted) {
  ctx.fillStyle = highlighted ? '#fff3d6' : '#fdf6e3';
  roundRect(ctx, rect.x, rect.y, rect.width, rect.height, 12);
  ctx.fill();
  ctx.strokeStyle = highlighted ? '#e8a13c' : '#d9c9a3';
  ctx.lineWidth = highlighted ? 3 : 2;
  ctx.stroke();
  drawIngredientIcon(ctx, id, rect.x + rect.width / 2, rect.y + 42, 56);
  const def = INGREDIENTS[id];
  text(ctx, def.name, rect.x + rect.width / 2, rect.y + 86, 15, '#5a4632', 'bold', 'center');
  const tags = [];
  if (def.chop) tags.push('chop');
  if (def.cook) tags.push('cook');
  if (tags.length > 0) text(ctx, tags.join(' + '), rect.x + rect.width / 2, rect.y + 102, 11, '#a08050', 'normal', 'center');
}

// --- The kitchen itself. ---

function drawKitchen(ctx) {
  ctx.fillStyle = '#f7e8c9';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  // Tiled wall.
  ctx.fillStyle = '#e8d3a8';
  ctx.fillRect(0, 0, VIEW.width, 150);
  ctx.strokeStyle = 'rgba(180, 140, 90, 0.35)';
  ctx.lineWidth = 2;
  for (let x = 0; x < VIEW.width; x += 64) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 150); ctx.stroke();
  }
  for (let y = 0; y <= 150; y += 50) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(VIEW.width, y); ctx.stroke();
  }
  // Wooden worktop band.
  ctx.fillStyle = '#b98a56';
  ctx.fillRect(0, 150, VIEW.width, 14);
  ctx.fillStyle = '#8a5a24';
  ctx.fillRect(0, 164, VIEW.width, 4);
  // Floor.
  ctx.fillStyle = '#d9c1a0';
  ctx.fillRect(0, 452, VIEW.width, VIEW.height - 452);
  ctx.fillStyle = '#cbb086';
  for (let x = 0; x < VIEW.width; x += 96) {
    ctx.fillRect(x, 452, 2, VIEW.height - 452);
  }
}

function drawOrderBoard(ctx, world) {
  const board = LAYOUT.board;
  ctx.fillStyle = '#4a3226';
  roundRect(ctx, board.x, board.y, board.width, board.height, 14);
  ctx.fill();
  text(ctx, 'ORDER BOARD', board.x + 18, board.y + 22, 16, '#f2c230', 'bold');
  text(ctx, 'click the plate, then SERVE when it matches', board.x + board.width - 18, board.y + 22, 13, '#cbb086', 'normal', 'right');
  for (let slot = 0; slot < 3; slot += 1) {
    const rect = {
      x: board.x + 12 + slot * (LAYOUT.boardSlot.width + LAYOUT.boardSlot.gap),
      y: board.y + 40,
      width: LAYOUT.boardSlot.width,
      height: LAYOUT.boardSlot.height - 16,
    };
    ctx.fillStyle = '#f7ead0';
    roundRect(ctx, rect.x, rect.y, rect.width, rect.height, 10);
    ctx.fill();
    const order = world.orders[slot];
    if (!order) {
      text(ctx, '— waiting for the next customer —', rect.x + rect.width / 2, rect.y + rect.height / 2, 14, '#a08050', 'normal', 'center');
      continue;
    }
    const fraction = Math.max(0, order.patience / order.maxPatience);
    text(ctx, `#${order.uid}  ${order.recipe.name}`, rect.x + 12, rect.y + 18, 17, '#4a3226', 'bold');
    text(ctx, `$${order.recipe.pay}`, rect.x + rect.width - 12, rect.y + 18, 17, '#2f7a33', 'bold', 'right');
    order.recipe.needs.forEach((id, index) => {
      drawIngredientIcon(ctx, id, rect.x + 30 + index * 44, rect.y + 52, 34);
    });
    ctx.fillStyle = '#e0d0b0';
    roundRect(ctx, rect.x + 12, rect.y + rect.height - 16, rect.width - 24, 8, 4);
    ctx.fill();
    ctx.fillStyle = fraction > 0.5 ? '#57b25e' : fraction > 0.25 ? '#f2a230' : '#e2483d';
    roundRect(ctx, rect.x + 12, rect.y + rect.height - 16, (rect.width - 24) * fraction, 8, 4);
    ctx.fill();
  }
}

function drawHud(ctx, world) {
  const y = 186;
  const minutes = Math.floor(world.timeLeft / 60);
  const seconds = Math.floor(world.timeLeft % 60);
  const timeText = `${minutes}:${String(seconds).padStart(2, '0')}`;
  const urgent = world.timeLeft <= 30;
  text(ctx, '⏱  ' + timeText, 40, y, urgent ? 34 : 30, urgent ? '#e2483d' : '#4a3226', 'bold');
  text(ctx, `Score  ${world.score}`, 250, y, 24, '#4a3226', 'bold');
  text(ctx, `Coins  $${world.coins}`, 470, y, 24, '#8a5a24', 'bold');
  let hearts = '';
  for (let index = 0; index < 3; index += 1) hearts += index < world.hearts ? '♥ ' : '♡ ';
  text(ctx, hearts, 660, y, 26, '#e2483d', 'bold');
  if (world.combo > 1) {
    text(ctx, `COMBO x${world.combo}`, 830, y, 22, '#c96a2e', 'bold');
  }
  text(ctx, `Served: ${world.served}  ·  Best: $${world.best}`, 1240, y, 16, '#7a5a34', 'bold', 'right');
}

function drawChoppingBoard(ctx, world) {
  const rect = LAYOUT.chopping;
  text(ctx, 'CHOPPING BOARD', rect.x + 8, rect.y + 8, 15, '#7a5a34', 'bold');
  ctx.fillStyle = '#d9b078';
  roundRect(ctx, rect.x + 10, rect.y + 34, rect.width - 20, rect.height - 60, 12);
  ctx.fill();
  ctx.strokeStyle = '#b98a56';
  ctx.lineWidth = 3;
  ctx.stroke();
  if (world.board !== null) {
    drawIngredientIcon(ctx, world.board.id, rect.x + rect.width / 2, rect.y + 118, 84, 'raw');
    const left = CHOPS_NEEDED - world.board.chops;
    text(ctx, left > 0 ? `Click to chop — ${left} more!` : 'Chopped!', rect.x + rect.width / 2, rect.y + rect.height - 12, 15, '#4a3226', 'bold', 'center');
  } else {
    text(ctx, 'Click an ingredient,', rect.x + rect.width / 2, rect.y + 110, 15, '#8a6a42', 'normal', 'center');
    text(ctx, 'then click here to chop it', rect.x + rect.width / 2, rect.y + 134, 15, '#8a6a42', 'normal', 'center');
  }
}

function drawStove(ctx, world) {
  const rect = LAYOUT.stove;
  text(ctx, 'STOVE', rect.x + 8, rect.y + 8, 15, '#7a5a34', 'bold');
  ctx.fillStyle = '#5a5a60';
  roundRect(ctx, rect.x + 10, rect.y + 34, rect.width - 20, rect.height - 60, 12);
  ctx.fill();
  world.burners.forEach((burner, index) => {
    const burnerRectValue = burnerRect(index);
    const cx = burnerRectValue.x + burnerRectValue.width / 2;
    const cy = burnerRectValue.y + burnerRectValue.height / 2;
    ctx.fillStyle = '#333338';
    ctx.beginPath(); ctx.ellipse(cx, cy + 34, 56, 14, 0, 0, Math.PI * 2); ctx.fill();
    if (burner === null) {
      text(ctx, 'empty burner', cx, cy - 8, 13, '#9a9aa2', 'normal', 'center');
      return;
    }
    if (burner.state === 'cooking') {
      ctx.fillStyle = '#e2483d';
      ctx.beginPath(); ctx.ellipse(cx, cy + 30, 44, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f2a230';
      ctx.beginPath(); ctx.ellipse(cx, cy + 28, 30, 5, 0, 0, Math.PI * 2); ctx.fill();
    }
    if (burner.state === 'burned') {
      ctx.fillStyle = '#2b2b2e';
      ctx.beginPath(); ctx.arc(cx, cy - 6, 34, 0, Math.PI * 2); ctx.fill();
      text(ctx, 'BURNED — click to bin it', cx, cy + 52, 12, '#e2483d', 'bold', 'center');
      return;
    }
    drawIngredientIcon(ctx, burner.id, cx, cy - 6, 72, burner.state === 'done' ? 'cooked' : 'raw');
    const fraction = Math.min(1, burner.progress);
    ctx.fillStyle = '#e0d0b0';
    roundRect(ctx, cx - 50, cy + 44, 100, 8, 4); ctx.fill();
    ctx.fillStyle = burner.state === 'done' ? '#57b25e' : '#f2a230';
    roundRect(ctx, cx - 50, cy + 44, 100 * fraction, 8, 4); ctx.fill();
    if (burner.state === 'done') text(ctx, 'READY — click to take it', cx, cy + 62, 12, '#2f7a33', 'bold', 'center');
  });
}

function drawPlateStation(ctx, world) {
  const rect = LAYOUT.plate;
  text(ctx, 'YOUR PLATE', rect.x + 8, rect.y + 8, 15, '#7a5a34', 'bold');
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + 118;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.ellipse(cx, cy, 120, 52, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#d9c9a3';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#fdf6e3';
  ctx.beginPath(); ctx.ellipse(cx, cy, 88, 36, 0, 0, Math.PI * 2); ctx.fill();
  world.plate.forEach((item, index) => {
    const itemRect = plateItemRect(index, world.plate.length);
    const mode = INGREDIENTS[item.id].chop && item.chopped ? 'chopped' : INGREDIENTS[item.id].cook && item.cooked ? 'cooked' : 'raw';
    drawIngredientIcon(ctx, item.id, itemRect.x + itemRect.width / 2, itemRect.y + itemRect.height / 2, 44, mode);
  });
  if (world.plate.length === 0) {
    text(ctx, 'Click the plate to add', cx, cy - 6, 14, '#a08050', 'normal', 'center');
    text(ctx, 'what you are carrying', cx, cy + 16, 14, '#a08050', 'normal', 'center');
  } else {
    text(ctx, 'Click an item to bin it', cx, rect.y + rect.height - 12, 13, '#a08050', 'normal', 'center');
  }
  const bin = LAYOUT.bin;
  ctx.fillStyle = '#e8d3a8';
  roundRect(ctx, bin.x, bin.y, bin.width, bin.height, 10);
  ctx.fill();
  ctx.strokeStyle = '#b98a56';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, '🗑 Clear', bin.x + bin.width / 2, bin.y + bin.height / 2, 14, '#7a5a34', 'bold', 'center');
}

function drawCounter(ctx, world) {
  const rect = LAYOUT.counter;
  ctx.fillStyle = '#8a5a24';
  roundRect(ctx, rect.x, rect.y, rect.width, rect.height, 14);
  ctx.fill();
  text(ctx, 'INGREDIENTS — click to pick up  (keys 1–9)   ·   Space chops   ·   Enter serves   ·   B bins it', rect.x + 16, rect.y + 18, 14, '#f7ead0', 'bold');
  COUNTER_ORDER.forEach((id, index) => {
    const highlighted = world.hand !== null && world.hand.id === id;
    drawIngredientButton(ctx, id, counterSlotRect(index), highlighted);
  });
}

function drawServeButton(ctx, world) {
  const rect = LAYOUT.serve;
  const ready = plateMatches(world);
  ctx.fillStyle = ready ? '#2f7a33' : '#b9ab8a';
  roundRect(ctx, rect.x, rect.y, rect.width, rect.height, 14);
  ctx.fill();
  ctx.strokeStyle = ready ? '#1f5a24' : '#8a7a5a';
  ctx.lineWidth = 3;
  ctx.stroke();
  text(ctx, ready ? 'SERVE!' : 'SERVE', rect.x + rect.width / 2, rect.y + rect.height / 2, 24, '#ffffff', 'bold', 'center');
}

function drawMessage(ctx, world) {
  if (world.messageTimer <= 0 || world.message === '') return;
  const rect = { x: 24, y: 640, width: 840, height: 56 };
  ctx.fillStyle = 'rgba(74, 50, 38, 0.92)';
  roundRect(ctx, rect.x, rect.y, rect.width, rect.height, 12);
  ctx.fill();
  text(ctx, world.message, rect.x + 18, rect.y + rect.height / 2, 17, '#f7ead0', 'bold');
}

function drawHand(ctx, world, mouse) {
  if (world.hand === null || mouse === null) return;
  const mode = world.hand.chopped ? 'chopped' : world.hand.cooked ? 'cooked' : 'raw';
  ctx.globalAlpha = 0.9;
  drawIngredientIcon(ctx, world.hand.id, mouse.x, mouse.y - 24, 44, mode);
  ctx.globalAlpha = 1;
  const def = INGREDIENTS[world.hand.id];
  const suffix = mode === 'chopped' ? ' (chopped)' : mode === 'cooked' ? ' (cooked)' : '';
  text(ctx, def.name + suffix, mouse.x, mouse.y + 12, 13, '#4a3226', 'bold', 'center');
}

function drawTitle(ctx, world) {
  ctx.fillStyle = 'rgba(40, 26, 16, 0.55)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = '#fdf6e3';
  roundRect(ctx, 240, 90, 800, 540, 20);
  ctx.fill();
  ctx.strokeStyle = '#e8a13c';
  ctx.lineWidth = 4;
  ctx.stroke();
  text(ctx, 'THE GOLDEN LADLE', 640, 150, 44, '#4a3226', 'bold', 'center');
  text(ctx, 'a cozy bistro rush', 640, 195, 20, '#a08050', 'normal', 'center');
  const lines = [
    'Orders land on the board — each one lists the dish and its ingredients.',
    'Pick ingredients from the counter. Chop what needs chopping, cook what',
    'needs cooking, build the dish on your plate, and SERVE before the',
    'customer loses patience. Tips for fast service, combos for streaks.',
    'Three walked-out customers end your shift. How much can you earn in 3 minutes?',
  ];
  lines.forEach((line, index) => {
    text(ctx, line, 640, 245 + index * 28, 17, '#5a4632', 'normal', 'center');
  });
  text(ctx, 'Mouse: click everything  ·  Keys: 1–9 ingredients, Space chop, Enter serve, B bin, M mute', 640, 420, 14, '#a08050', 'normal', 'center');
  if (world.best > 0) text(ctx, `Best shift so far: $${world.best}`, 640, 455, 17, '#2f7a33', 'bold', 'center');
  const start = LAYOUT.start;
  ctx.fillStyle = '#2f7a33';
  roundRect(ctx, start.x, start.y, start.width, start.height, 16);
  ctx.fill();
  text(ctx, '▶  START YOUR SHIFT', start.x + start.width / 2, start.y + start.height / 2, 22, '#ffffff', 'bold', 'center');
}

function drawGameOver(ctx, world) {
  ctx.fillStyle = 'rgba(40, 26, 16, 0.55)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = '#fdf6e3';
  roundRect(ctx, 340, 150, 600, 420, 20);
  ctx.fill();
  ctx.strokeStyle = '#e8a13c';
  ctx.lineWidth = 4;
  ctx.stroke();
  text(ctx, 'SHIFT OVER!', 640, 210, 40, '#4a3226', 'bold', 'center');
  text(ctx, `You earned  $${world.score}`, 640, 280, 30, '#2f7a33', 'bold', 'center');
  text(ctx, `Dishes served: ${world.served}    ·    Best: $${world.best}`, 640, 330, 18, '#5a4632', 'normal', 'center');
  text(ctx, world.score >= world.best && world.score > 0 ? 'A new best shift — the regulars will be back!' : 'The regulars are hungry. One more shift?', 640, 375, 17, '#a08050', 'normal', 'center');
  const start = LAYOUT.start;
  ctx.fillStyle = '#2f7a33';
  roundRect(ctx, start.x, start.y - 40, start.width, start.height, 16);
  ctx.fill();
  text(ctx, '↻  COOK AGAIN', start.x + start.width / 2, start.y - 40 + start.height / 2, 22, '#ffffff', 'bold', 'center');
}

export function drawGame(ctx, world, mouse) {
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  drawKitchen(ctx);
  drawOrderBoard(ctx, world);
  drawHud(ctx, world);
  drawChoppingBoard(ctx, world);
  drawStove(ctx, world);
  drawPlateStation(ctx, world);
  drawCounter(ctx, world);
  drawServeButton(ctx, world);
  drawMessage(ctx, world);
  drawHand(ctx, world, mouse);
  if (world.screen === 'title') drawTitle(ctx, world);
  if (world.screen === 'over') drawGameOver(ctx, world);
}
