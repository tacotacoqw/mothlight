// A small seeded random source, so a run (and every screenshot of one) can be replayed exactly.

export function createRng(seed) {
  let state = (seed >>> 0) || 1;

  function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  return {
    next,
    range: (low, high) => low + (high - low) * next(),
    int: (low, high) => Math.floor(low + (high - low + 1) * next()),
    pick: (list) => list[Math.floor(next() * list.length)],
    chance: (probability) => next() < probability,
    angle: () => next() * Math.PI * 2,
  };
}

export function shuffleInPlace(list, rng) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    const kept = list[i];
    list[i] = list[j];
    list[j] = kept;
  }
  return list;
}
