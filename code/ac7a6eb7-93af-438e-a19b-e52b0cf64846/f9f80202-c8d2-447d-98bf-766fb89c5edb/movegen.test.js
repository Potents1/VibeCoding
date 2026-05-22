import test from 'node:test';
import assert from 'node:assert/strict';

import { createInitialPosition } from '../../src/engine/board.js';
import { generatePseudoMoves } from '../../src/engine/movegen.js';

test('pseudo-move generation from initial position includes pawn double steps', () => {
  const pos = createInitialPosition();
  const moves = generatePseudoMoves(pos.board, 'w');
  assert.ok(moves.some((m) => m.from === 'a2' && m.to === 'a4'));
  assert.ok(moves.some((m) => m.from === 'e2' && m.to === 'e3'));
});
