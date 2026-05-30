import { test, assert } from './_harness.mjs';
import { createGame, castRay } from '../src/logic.js';

test('perf: raycasting 100k rays finishes under budget (non-pathological)', () => {
  const s = createGame();
  const rays = 100_000;
  const start = Date.now();
  let acc = 0;
  for (let i = 0; i < rays; i += 1) {
    const ang = (i % 360) * (Math.PI / 180);
    acc += castRay(s, s.player.x, s.player.y, ang, 18).dist;
  }
  const elapsed = Date.now() - start;
  assert.ok(acc > 0);
  assert.ok(elapsed < 1500, `raycast too slow or stuck: ${elapsed}ms`);
});
