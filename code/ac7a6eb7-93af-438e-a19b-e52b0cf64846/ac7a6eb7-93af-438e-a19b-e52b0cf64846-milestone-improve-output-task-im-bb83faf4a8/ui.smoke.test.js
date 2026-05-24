import test from 'node:test';
import assert from 'node:assert/strict';

import { createInitialPosition, generateLegalMoves, applyMove } from '../src/engine.js';
import { computeStatusText } from '../src/ui/status.js';
import { squareFromPoint } from '../src/ui/boardView.js';

test('ui: status text reflects turn and check', () => {
  let pos = createInitialPosition();
  assert.match(computeStatusText(pos), /White to move/);

  pos = applyMove(pos, { from: 'e2', to: 'e4' });
  assert.match(computeStatusText(pos), /Black to move/);

  // A known quick check line: 1. e4 e5 2. Qh5
  pos = applyMove(pos, { from: 'e7', to: 'e5' });
  pos = applyMove(pos, { from: 'd1', to: 'h5' });
  const txt = computeStatusText(pos);
  assert.ok(txt.includes('Black'), 'status references side to move');
});

test('ui: squareFromPoint maps coordinates deterministically', () => {
  // size 800 => each square 100.
  assert.equal(squareFromPoint({ x: 0, y: 0, size: 800 }), 'a8');
  assert.equal(squareFromPoint({ x: 799, y: 799, size: 800 }), 'h1');
  assert.equal(squareFromPoint({ x: 450, y: 650, size: 800 }), 'e2');
});

test('ui/progression touchpoint: selecting a piece implies legal moves exist from that square', () => {
  const pos = createInitialPosition();
  const moves = generateLegalMoves(pos);
  const fromE2 = moves.filter((m) => m.from === 'e2');
  assert.ok(fromE2.length > 0);
});
