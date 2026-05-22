import test from 'node:test';
import assert from 'node:assert/strict';

import { createInitialPosition, generateLegalMoves, applyMove } from '../src/engine.js';

test('selecting and moving concept: legal move exists and can be applied', () => {
  const pos = createInitialPosition();
  const legalFromE2 = generateLegalMoves(pos).filter((m) => m.from === 'e2');
  assert.ok(legalFromE2.some((m) => m.to === 'e4'));

  const next = applyMove(pos, { from: 'e2', to: 'e4' });
  assert.ok(next);
});
