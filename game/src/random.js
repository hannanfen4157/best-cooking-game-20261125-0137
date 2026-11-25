// A small seeded random generator (mulberry32) so a screenshot scene and a replayed
// shift always play out the same way from the same seed, while a real game can seed
// from the clock. The generator is a function returning a number in [0, 1).

export function makeRandom(seed) {
  let state = seed >>> 0;
  return function random() {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

// A seed from the clock, for a fresh shift.
export function clockSeed() {
  return (Date.now() % 2147483647) >>> 0;
}
