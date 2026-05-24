import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  createInitialPosition,
  generateLegalMoves,
  applyMove,
  getGameOutcome,
  algebraicToRC,
  rcToAlgebraic,
  isInCheck
} from '../src/engine.js';

import { applyAiMove, chooseAiMove } from '../src/ai.js';

function listJsFiles(dir) {
  const out = [];
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name);
    if (ent.isDirectory()) out.push(...listJsFiles(p));
    else if (ent.isFile() && ent.name.endsWith('.js')) out.push(p);
  }
  return out;
}

function run() {
  for (const sq of ['a1', 'a8', 'h1', 'h8', 'e4']) {
    const { r, c } = algebraicToRC(sq);
    assert.equal(rcToAlgebraic(r, c), sq);
  }

  {
    const pos = createInitialPosition();
    const moves = generateLegalMoves(pos);
    assert.equal(moves.length, 20);
  }

  {
    let pos = createInitialPosition();
    pos = applyMove(pos, { from: 'e2', to: 'e4' });
    assert.ok(pos);
    assert.equal(pos.turn, 'b');
    pos = applyMove(pos, { from: 'e7', to: 'e5' });
    assert.ok(pos);
    assert.equal(pos.turn, 'w');
  }

  {
    const pos = createInitialPosition();
    const next = applyMove(pos, { from: 'a2', to: 'a5' });
    assert.equal(next, null);
  }

  {
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
  }

  {
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
  }

  // In-check behavior: ensure legal moves resolve check
  {
    const b = Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => null));
    b[7][4] = { t: 'k', c: 'w' }; // e1
    b[0][4] = { t: 'r', c: 'b' }; // e8
    b[0][0] = { t: 'k', c: 'b' }; // a8
    let pos = { board: b, turn: 'w' };
    assert.equal(isInCheck(pos.board, 'w'), true);
    const legal = generateLegalMoves(pos);
    assert.ok(legal.length > 0);
    for (const m of legal) {
      const next = applyMove(pos, m);
      assert.ok(next);
      assert.equal(isInCheck(next.board, 'w'), false);
    }
  }

  // AI stub must not move
  {
    const pos = createInitialPosition();
    assert.equal(chooseAiMove(pos), null);
    const result = applyAiMove(pos);
    assert.equal(result.move, null);
    assert.deepEqual(result.pos, pos);
  }

  {
    const root = fileURLToPath(new URL('..', import.meta.url));
    const src = join(root, 'src');
    const files = listJsFiles(src);
    assert.ok(files.length > 0);

    for (const f of files) {
      const t = readFileSync(f, 'utf8');
      assert.ok(!t.includes('innerHTML'), `innerHTML forbidden: ${f}`);
      assert.ok(!t.includes('outerHTML'), `outerHTML forbidden: ${f}`);
      assert.ok(!t.includes('insertAdjacentHTML'), `insertAdjacentHTML forbidden: ${f}`);
      assert.ok(!t.includes('document.write'), `document.write forbidden: ${f}`);
      assert.ok(!t.includes('eval('), `eval forbidden: ${f}`);
      assert.ok(!t.includes('new Function'), `new Function forbidden: ${f}`);
    }
  }
}

try {
  run();
  process.stdout.write('UNIT_SMOKE_OK\n');
  process.exit(0);
} catch (err) {
  process.stderr.write(`UNIT_SMOKE_FAIL: ${err?.stack || err}\n`);
  process.exit(1);
}
