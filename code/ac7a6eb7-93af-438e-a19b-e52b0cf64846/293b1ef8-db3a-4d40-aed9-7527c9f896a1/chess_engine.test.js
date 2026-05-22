import test from 'node:test';
import assert from 'node:assert/strict';

import { createInitialPosition, applyMove, generateLegalMoves, getGameOutcome, algebraicToRC } from '../src/engine.js';

test('illegal move is rejected (blocking/rules)', () => {
  const pos = createInitialPosition();
  // Pawn cannot jump 3 squares.
  const next = applyMove(pos, { from: 'a2', to: 'a5' });
  assert.equal(next, null);
});

test('turn progression: white then black', () => {
  let pos = createInitialPosition();
  pos = applyMove(pos, { from: 'e2', to: 'e4' });
  assert.ok(pos);
  assert.equal(pos.turn, 'b');
  pos = applyMove(pos, { from: 'e7', to: 'e5' });
  assert.ok(pos);
  assert.equal(pos.turn, 'w');
});

test('pawn promotion auto-queens', () => {
  // Build a minimal position: kings + a white pawn on a7 ready to promote.
  const empty = Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => null));
  empty[7][4] = { t: 'k', c: 'w' }; // e1
  empty[0][4] = { t: 'k', c: 'b' }; // e8
  empty[1][0] = { t: 'p', c: 'w' }; // a7
  let pos = { board: empty, turn: 'w' };

  const moves = generateLegalMoves(pos).filter((m) => m.from === 'a7');
  assert.deepEqual(moves.map((m) => m.to), ['a8']);

  pos = applyMove(pos, { from: 'a7', to: 'a8' });
  assert.ok(pos);
  const { r, c } = algebraicToRC('a8');
  assert.equal(pos.board[r][c].t, 'q');
  assert.equal(pos.board[r][c].c, 'w');
});

test('checkmate detection: Fool\'s mate', () => {
  // 1. f3 e5 2. g4 Qh4#
  let pos = createInitialPosition();
  pos = applyMove(pos, { from: 'f2', to: 'f3' });
  assert.ok(pos);
  pos = applyMove(pos, { from: 'e7', to: 'e5' });
  assert.ok(pos);
  pos = applyMove(pos, { from: 'g2', to: 'g4' });
  assert.ok(pos);
  pos = applyMove(pos, { from: 'd8', to: 'h4' });
  assert.ok(pos);

  const out = getGameOutcome(pos);
  assert.equal(out.over, true);
  assert.equal(out.result, 'black_wins');
});
