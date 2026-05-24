import { applyMove, generateLegalMoves, getGameOutcome, isInCheck } from './engine.js';

const PIECE_VALUES = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000
};

function materialScore(board) {
  let score = 0;
  for (const row of board) {
    for (const piece of row) {
      if (!piece) continue;
      const value = PIECE_VALUES[piece.t] || 0;
      // Positive is good for black
      score += piece.c === 'b' ? value : -value;
    }
  }
  return score;
}

function moveTieBreaker(move) {
  return `${move.from}-${move.to}`;
}

function tacticalBonus(beforePos, afterPos) {
  // Encourage delivering check and discourage staying in check (shouldn't happen for legal move).
  let bonus = 0;
  if (isInCheck(afterPos.board, 'w')) bonus += 25;
  if (isInCheck(beforePos.board, 'b')) bonus += 5; // prefer escaping check quickly
  return bonus;
}

export function chooseAiMove(pos) {
  if (!pos || pos.turn !== 'b') return null;

  const moves = generateLegalMoves(pos);
  let best = null;

  for (const move of moves) {
    const next = applyMove(pos, move);
    if (!next) continue;

    const outcome = getGameOutcome(next);

    // Deterministic greedy evaluation.
    let score = materialScore(next.board);
    score += tacticalBonus(pos, next);

    if (outcome.over && outcome.result === 'black_wins') score += 100000;
    if (outcome.over && outcome.result === 'white_wins') score -= 100000;

    const candidate = { move, score, tie: moveTieBreaker(move) };
    if (!best || candidate.score > best.score || (candidate.score === best.score && candidate.tie < best.tie)) {
      best = candidate;
    }
  }

  return best ? best.move : null;
}

export function applyAiMove(pos) {
  const move = chooseAiMove(pos);
  if (!move) return { pos, move: null };
  const next = applyMove(pos, move);
  return { pos: next || pos, move };
}
