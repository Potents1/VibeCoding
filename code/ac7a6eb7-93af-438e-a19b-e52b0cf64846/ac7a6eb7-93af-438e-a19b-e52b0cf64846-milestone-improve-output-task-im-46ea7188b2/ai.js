import { applyMove, generateLegalMoves, gameOutcome } from './engine.js';

const V = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 1000 };

function material(board) {
  let s = 0;
  for (const row of board) {
    for (const p of row) {
      if (!p) continue;
      const v = V[p.t] || 0;
      s += p.c === 'b' ? v : -v; // positive = good for black
    }
  }
  return s;
}

export function chooseAiMove(pos) {
  const moves = generateLegalMoves(pos);
  if (moves.length === 0) return null;

  // deterministic-ish: score then tiebreak by from/to.
  let best = null;
  let bestScore = -Infinity;

  for (const m of moves) {
    const next = applyMove(pos, m);
    if (!next) continue;
    const out = gameOutcome(next);
    let score = material(next.board);
    if (out.over) {
      if (out.result === 'black') score += 9999;
      else if (out.result === 'white') score -= 9999;
    }
    const key = `${m.from}-${m.to}`;
    if (score > bestScore || (score === bestScore && key < `${best?.from}-${best?.to}`)) {
      bestScore = score;
      best = m;
    }
  }

  return best || moves[0];
}