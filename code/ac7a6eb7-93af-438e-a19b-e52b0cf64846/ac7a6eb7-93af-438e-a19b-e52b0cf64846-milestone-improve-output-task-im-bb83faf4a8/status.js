import { generateLegalMoves, getGameOutcome, isInCheck } from '../engine.js';

export function computeStatusText(pos, { mode = 'single', aiPending = false } = {}) {
  const o = getGameOutcome(pos);
  const inCheckNow = isInCheck(pos.board, pos.turn);
  const moves = generateLegalMoves(pos);

  if (!o.over) {
    const turnLabel = pos.turn === 'w' ? 'White' : 'Black';
    const checkPrefix = inCheckNow ? 'CHECK! ' : '';
    const moveCount = ` (${moves.length} legal move${moves.length === 1 ? '' : 's'})`;
    if (mode === 'single' && pos.turn === 'b') {
      return `${checkPrefix}${aiPending ? 'AI opponent thinking' : 'Black to move'}${moveCount}`;
    }
    return `${checkPrefix}${turnLabel} to move${moveCount}`;
  }

  if (o.result === 'white_wins') return 'Checkmate — White wins';
  if (o.result === 'black_wins') return 'Checkmate — Black wins';
  return 'Draw';
}
