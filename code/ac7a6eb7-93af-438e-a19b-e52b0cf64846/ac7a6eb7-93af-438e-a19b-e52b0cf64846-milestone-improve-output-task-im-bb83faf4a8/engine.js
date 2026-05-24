export * from './engine/index.js';

import { findKing } from './engine/board.js';
import { isInCheck } from './engine/validate.js';
import { generateLegalMoves as generateLegalMovesCore, applyMove as applyMoveCore } from './engine/perft.js';

export function generateLegalMoves(pos) {
  return generateLegalMovesCore(pos);
}

export function applyMove(pos, move) {
  // keep strict acceptance behavior: only allow moves present in legal list
  const legal = generateLegalMovesCore(pos);
  if (!legal.some((m) => m.from === move.from && m.to === move.to)) return null;
  return applyMoveCore(pos, move);
}

export function getGameOutcome(pos) {
  const whiteKing = findKing(pos.board, 'w');
  const blackKing = findKing(pos.board, 'b');
  if (!whiteKing && !blackKing) return { over: true, result: 'draw' };
  if (!whiteKing) return { over: true, result: 'black_wins' };
  if (!blackKing) return { over: true, result: 'white_wins' };

  const moves = generateLegalMovesCore(pos);
  if (moves.length > 0) return { over: false, result: 'ongoing' };

  if (isInCheck(pos.board, pos.turn)) {
    return { over: true, result: pos.turn === 'w' ? 'black_wins' : 'white_wins' };
  }
  return { over: true, result: 'draw' };
}
