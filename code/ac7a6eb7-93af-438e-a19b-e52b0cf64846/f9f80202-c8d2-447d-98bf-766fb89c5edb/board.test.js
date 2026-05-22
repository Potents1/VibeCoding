import test from 'node:test';
import assert from 'node:assert/strict';

import {
  rcToAlgebraic,
  algebraicToRC,
  createInitialPosition,
  findKing,
  pieceToUnicode
} from '../../src/engine/index.js';

test('rcToAlgebraic/algebraicToRC round-trip', () => {
  for (const sq of ['a1', 'a8', 'h1', 'h8', 'e4']) {
    const { r, c } = algebraicToRC(sq);
    assert.equal(rcToAlgebraic(r, c), sq);
  }
});

test('initial position has both kings and unicode mapping works', () => {
  const pos = createInitialPosition();
  assert.ok(findKing(pos.board, 'w'));
  assert.ok(findKing(pos.board, 'b'));
  assert.equal(pieceToUnicode({ t: 'k', c: 'w' }), '\u2654');
});
