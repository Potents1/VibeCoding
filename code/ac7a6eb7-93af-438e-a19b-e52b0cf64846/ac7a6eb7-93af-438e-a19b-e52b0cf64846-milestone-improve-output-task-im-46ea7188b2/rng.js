export function createRng(seed = 1) {
  // Small LCG: deterministic across JS engines for 32-bit arithmetic.
  let state = (seed >>> 0) || 1;
  return {
    seed,
    nextU32() {
      state = (1664525 * state + 1013904223) >>> 0;
      return state;
    },
    float01() {
      return this.nextU32() / 0xffffffff;
    },
    int(lo, hi) {
      const a = Math.min(lo, hi) | 0;
      const b = Math.max(lo, hi) | 0;
      const span = (b - a + 1) >>> 0;
      return a + (this.nextU32() % span);
    }
  };
}

