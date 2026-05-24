import assert from 'node:assert/strict';
import { isInCheck } from '../src/engine/validate.js';
import { generateLegalMoves, applyMove } from '../src/engine/perft.js';
import { createEmptyBoard, createInitialPosition } from '../src/engine/board.js';
import { applyMove as applyMoveStrict, getGameOutcome } from '../src/engine.js';

function pos(board, turn) {
  return { board, turn };
}

function run() {
  {
    const b = createEmptyBoard();
    b[7][4] = { t: 'k', c: 'w' }; // e1
    b[0][4] = { t: 'r', c: 'b' }; // e8
    b[0][0] = { t: 'k', c: 'b' }; // a8
    assert.equal(isInCheck(b, 'w'), true);

    const moves = generateLegalMoves(pos(b, 'w'));
    assert.ok(moves.length > 0);
    for (const m of moves) {
      const next = applyMove(pos(b, 'w'), m);
      assert.ok(next);
      assert.equal(isInCheck(next.board, 'w'), false);
    }
  }

  {
    let p = createInitialPosition();
    p = applyMoveStrict(p, { from: 'f2', to: 'f3' });
    assert.ok(p);
    p = applyMoveStrict(p, { from: 'e7', to: 'e5' });
    assert.ok(p);
    p = applyMoveStrict(p, { from: 'g2', to: 'g4' });
    assert.ok(p);
    p = applyMoveStrict(p, { from: 'd8', to: 'h4' });
    assert.ok(p);

    const out = getGameOutcome(p);
    assert.equal(out.over, true);
    assert.equal(out.result, 'black_wins');
    assert.equal(generateLegalMoves(p).length, 0);
  }
}

try {
  run();
  process.stdout.write('CHECK_RULES_OK\n');
  process.exit(0);
} catch (e) {
  process.stderr.write(`CHECK_RULES_FAIL: ${e?.stack || e}\n`);
  process.exit(1);
}
