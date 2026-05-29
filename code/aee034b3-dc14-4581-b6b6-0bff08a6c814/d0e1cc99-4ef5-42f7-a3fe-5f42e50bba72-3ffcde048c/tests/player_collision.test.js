import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, stepGame } from '../src/logic.js';

test('player movement is blocked by walls (collision against map)', () => {
  const s = createGame();
  // Face left into a wall near spawn (spawn is near x=1.5 within corridor)
  s.player.angle = Math.PI;
  const startX = s.player.x;
  for (let i = 0; i < 120; i += 1) stepGame(s, { forward: true }, 1 / 60);
  assert.ok(s.player.x > 1.1, 'player should not move into wall');
  assert.ok(s.player.x <= startX + 0.05, 'player should not advance when pushing into wall');
});

test('player can strafe along wall (sliding resolution)', () => {
  const s = createGame();
  // Put player close to a vertical wall at x=6 (from map row 1: #P....#)
  s.player.x = 5.75;
  s.player.y = 1.6;
  s.player.angle = 0;
  const startY = s.player.y;
  // try to move diagonally into wall while strafing down; sliding should allow y to change
  for (let i = 0; i < 60; i += 1) stepGame(s, { forward: true, strafeRight: true }, 1 / 60);
  assert.ok(s.player.y !== startY, 'player should slide along wall in Y');
  // Allow small tolerance changes due to true circle-vs-tile collision.
  assert.ok(s.player.x <= 5.81, 'player x should remain constrained near wall');
});
