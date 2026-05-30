import { test, assert } from './_harness.mjs';
import { createGame, castRay } from '../src/logic.js';

test('raycast perf budget: many casts complete (guards against infinite loops)', () => {
  const s = createGame();
  const cols = 320; // half-res budget for CI
  const frames = 30;
  const maxDist = 18;

  const start = Date.now();
  let sum = 0;
  for (let f = 0; f < frames; f += 1) {
    const base = s.player.angle + f * 0.01;
    for (let x = 0; x < cols; x += 1) {
      const ang = base + (x / cols - 0.5) * 0.8;
      const r = castRay(s, s.player.x, s.player.y, ang, maxDist);
      sum += r.dist;
    }
  }
  const elapsed = Date.now() - start;

  assert.ok(sum > 0);
  // Very forgiving upper bound to catch pathological regressions/infinite loops.
  assert.ok(elapsed < 1500, `raycast perf regression: ${elapsed}ms`);
});
