import assert from 'node:assert/strict';
import {
  simulateLoss,
  simulateMoveIntoWall,
  simulateShootKillsEnemy,
  simulateWin
} from '../src/logic.js';

{
  const r = simulateMoveIntoWall();
  assert.ok(Math.abs(r.endX - r.startX) < 0.32, 'player should be blocked by wall');
  assert.ok(r.endX > 1.1, 'player should not pass into wall tile');
}

{
  const r = simulateShootKillsEnemy();
  assert.equal(r.lastShotHit, true);
  assert.equal(r.dead, true);
  assert.equal(r.hp, 0);
}

{
  assert.equal(simulateWin(), 'won');
  assert.equal(simulateLoss(), 'lost');
}

console.log('SMOKE_GAME_JS_OK');
