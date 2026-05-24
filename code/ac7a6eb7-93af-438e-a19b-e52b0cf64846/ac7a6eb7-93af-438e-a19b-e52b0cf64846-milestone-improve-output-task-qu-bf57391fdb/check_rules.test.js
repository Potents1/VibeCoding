import assert from 'node:assert/strict';
import { isInCheck } from '../src/engine/validate.js';
import { generateLegalMoves, applyMove } from '../src/engine/perft.js';
import { createEmptyBoard } from '../src/engine/board.js';

function pos(board, turn) {
  return { board, turn };
}

function run() {
  // King in check by rook
  {
    const b = createEmptyBoard();
    b[7][4] = { t: 'k', c: 'w' }; // e1
    b[0][4] = { t: 'r', c: 'b' }; // e8
    b[0][0] = { t: 'k', c: 'b' }; // a8
    assert.equal(isInCheck(b, 'w'), true);

    const moves = generateLegalMoves(pos(b, 'w'));
    // In check: must move king or block/capture. With empty board, king has some escapes.
    assert.ok(moves.length > 0);
    // No move may leave king still in check
    for (const m of moves) {
      const next = applyMove(pos(b, 'w'), m);
      assert.ok(next);
      assert.equal(isInCheck(next.board, 'w'), false);
    }
  }

  // Simple checkmate: Fool's mate (from existing unit smoke, but validate legal moves are 0)
  {
    // Use engine wrapper for legality
    const { createInitialPosition, applyMove: applyMoveStrict, getGameOutcome } = await import('../src/engine.js');
    let p = createInitialPosition();
    p = applyMoveStrict(p, { from: 'f2', to: 'f3' });
    p = applyMoveStrict(p, { from: 'e7', to: 'e5' });
    p = applyMoveStrict(p, { from: 'g2', to: 'g4' });
    p = applyMoveStrict(p, { from: 'd8', to: 'h4' });
    const out = getGameOutcome(p);
    assert.equal(out.over, true);
    assert.equal(out.result, 'black_wins');
    assert.equal(generateLegalMoves(p).length, 0);
  }
}

try {
  await run();
  process.stdout.write('CHECK_RULES_OK\n');
  process.exit(0);
} catch (e) {
  process.stderr.write(`CHECK_RULES_FAIL: ${e?.stack || e}\n`);
  process.exit(1);
}
