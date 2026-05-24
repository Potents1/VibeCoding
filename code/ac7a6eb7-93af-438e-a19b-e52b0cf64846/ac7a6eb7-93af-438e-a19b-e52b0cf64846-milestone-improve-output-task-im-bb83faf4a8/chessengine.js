import {
  createInitialPosition,
  generateLegalMoves,
  applyMove,
  getGameOutcome,
  toFEN,
  parseFEN,
  algebraicToRC,
  rcToAlgebraic,
  pieceToUnicode,
  isInCheck
} from '../engine.js';

export function createEngine() {
  return {
    createInitialPosition,
    generateLegalMoves,
    applyMove,
    getGameOutcome,
    toFEN,
    parseFEN,
    algebraicToRC,
    rcToAlgebraic,
    pieceToUnicode,
    isInCheck
  };
}
