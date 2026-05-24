import { applyMove, generateLegalMoves, getGameOutcome } from './engine.js';

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
      score += piece.c === 'b' ? value : -value;
    }
  }
  return score;
}

function moveTieBreaker(move) {
  return `${move.from}-${move.to}`;
}

export function chooseAiMove(pos) {
  if (!pos || pos.turn !== 'b') return null;

  const moves = generateLegalMoves(pos);
  let best = null;

  for (const move of moves) {
    const next = applyMove(pos, move);
    if (!next) continue;

    const outcome = getGameOutcome(next);
    let score = materialScore(next.board);
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
