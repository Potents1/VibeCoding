import test from 'node:test';
import assert from 'node:assert/strict';
import {
  simulateLoss,
  simulateMoveIntoWall,
  simulateShootKillsEnemy,
  simulateWin
} from '../src/logic.js';

test('progression: move into wall is blocked', () => {
  const r = simulateMoveIntoWall();
  assert.ok(r.endX >= r.startX - 0.01, 'moving into wall should not decrease X past wall');
  assert.ok(Math.abs(r.endX - r.startX) < 0.2, 'player should be blocked by wall');
});

test('combat: shooting kills an enemy deterministically', () => {
  const r = simulateShootKillsEnemy();
  assert.equal(r.lastShotHit, true);
  assert.equal(r.dead, true);
  assert.equal(r.hp, 0);
});

test('rules: win and loss states reachable', () => {
  assert.equal(simulateWin(), 'won');
  assert.equal(simulateLoss(), 'lost');
});
