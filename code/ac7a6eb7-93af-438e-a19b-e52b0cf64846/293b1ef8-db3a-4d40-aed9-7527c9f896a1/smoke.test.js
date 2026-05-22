import test from 'node:test';
import assert from 'node:assert/strict';

import { createInitialPosition, applyMove, getGameOutcome } from '../src/engine.js';

test('progression touchpoint: a simple opening sequence progresses turns', () => {
  let pos = createInitialPosition();
  pos = applyMove(pos, { from: 'e2', to: 'e4' });
  assert.ok(pos);
  assert.equal(pos.turn, 'b');

  pos = applyMove(pos, { from: 'c7', to: 'c5' });
  assert.ok(pos);
  assert.equal(pos.turn, 'w');
});

test('completion state touchpoint: checkmate ends game', () => {
  // Fool's mate again, from engine test, to ensure smoke touches win/loss.
  let pos = createInitialPosition();
  pos = applyMove(pos, { from: 'f2', to: 'f3' });
  pos = applyMove(pos, { from: 'e7', to: 'e5' });
  pos = applyMove(pos, { from: 'g2', to: 'g4' });
  pos = applyMove(pos, { from: 'd8', to: 'h4' });
  const out = getGameOutcome(pos);
  assert.equal(out.over, true);
  assert.equal(out.result, 'black_wins');
});
