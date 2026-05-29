import assert from 'node:assert/strict';
import {
  castRay,
  createGame,
  simulateEnemyLineOfSightBlocked,
  simulateLoss,
  simulateRaycastHit,
  simulateShootKillsEnemy,
  simulateWin
} from '../src/logic.js';

{
  const r = simulateRaycastHit();
  assert.equal(typeof r.hit, 'boolean');
  assert.equal(typeof r.dist, 'number');
  assert.ok(r.dist > 0 && r.dist < 20, 'raycast should hit within bounds');
}

{
  const s = createGame();
  const ray = castRay(s, s.player.x, s.player.y, 0, 30);
  assert.ok(ray.hit, 'ray should hit a wall');
  assert.ok(ray.dist > 0.1, 'ray distance should be positive');
}

{
  const blocked = simulateEnemyLineOfSightBlocked();
  assert.equal(typeof blocked, 'boolean');
  assert.equal(blocked, false, 'enemy LOS should be blocked by wall in scenario');
}

{
  const shot = simulateShootKillsEnemy();
  assert.equal(shot.lastShotHit, true, 'shot should register hit');
  assert.equal(shot.dead, true, 'enemy should die after 2 shots');
  assert.equal(shot.hp, 0);
}

assert.equal(simulateWin(), 'won');
assert.equal(simulateLoss(), 'lost');

console.log('LOGIC_SMOKE_OK');
