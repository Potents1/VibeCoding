import test from 'node:test';
import assert from 'node:assert/strict';

import { createEmptyBoard } from '../../src/engine/board.js';
import { isInCheck } from '../../src/engine/validate.js';

test('check detection: rook gives check on open file', () => {
  const board = createEmptyBoard();
  board[7][4] = { t: 'k', c: 'w' }; // e1
  board[0][4] = { t: 'r', c: 'b' }; // e8
  board[0][0] = { t: 'k', c: 'b' }; // a8 (black king just to be legal-ish)
  assert.equal(isInCheck(board, 'w'), true);
  assert.equal(isInCheck(board, 'b'), false);
});
