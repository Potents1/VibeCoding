import { test, assert } from './_harness.mjs';
import { castRay, hasLineOfSight } from '../src/engine/raycaster.js';
import { createGame } from '../src/logic.js';

test('castRay hits a wall and returns stable fields', () => {
  const s = createGame();
  const r = castRay(s, s.player.x, s.player.y, 0, 30);
  assert.equal(typeof r.hit, 'boolean');
  assert.equal(typeof r.dist, 'number');
  assert.ok(r.dist > 0);
  assert.ok(r.dist <= 30);
});

test('hasLineOfSight is blocked by a wall in default map scenario', () => {
  const s = createGame();
  // Put points across a known wall at x=6,y=1 (#P....#)
  const a = { x: 5.5, y: 1.5 };
  const b = { x: 6.5, y: 1.5 };
  assert.equal(hasLineOfSight(s, a.x, a.y, b.x, b.y), false);
});
