import { test, assert } from './_harness.mjs';
import { createGame, stepGame, simulateEnemyLineOfSightBlocked } from '../src/logic.js';

test('determinism: stepping with same inputs yields same outcome', () => {
  const a = createGame();
  const b = createGame();
  a.player.angle = 0.2;
  b.player.angle = 0.2;

  const input = { forward: true, strafeRight: true };
  for (let i = 0; i < 90; i += 1) {
    stepGame(a, input, 1 / 60);
    stepGame(b, input, 1 / 60);
  }

  assert.ok(Math.abs(a.player.x - b.player.x) < 1e-9);
  assert.ok(Math.abs(a.player.y - b.player.y) < 1e-9);
  assert.ok(Math.abs(a.player.angle - b.player.angle) < 1e-12);
});

test('enemy line-of-sight is occluded by walls (no x-ray vision)', () => {
  const sees = simulateEnemyLineOfSightBlocked();
  assert.equal(sees, false);
});
