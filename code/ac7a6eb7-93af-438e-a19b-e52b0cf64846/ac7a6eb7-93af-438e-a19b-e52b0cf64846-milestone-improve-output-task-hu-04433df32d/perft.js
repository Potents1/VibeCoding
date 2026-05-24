import { other } from './board.js';
import { generatePseudoMoves, applyMoveToBoard } from './movegen.js';
import { isInCheck } from './validate.js';

export function generateLegalMoves(pos) {
  const pseudo = generatePseudoMoves(pos.board, pos.turn);
  const legal = [];
  for (const m of pseudo) {
    const nextBoard = applyMoveToBoard(pos.board, m);
    if (!nextBoard) continue;
    if (!isInCheck(nextBoard, pos.turn)) legal.push(m);
  }
  return legal;
}

export function applyMove(pos, move) {
  const nextBoard = applyMoveToBoard(pos.board, move);
  if (!nextBoard) return null;
  if (isInCheck(nextBoard, pos.turn)) return null;
  return { board: nextBoard, turn: other(pos.turn) };
}

export function perft(pos, depth) {
  if (depth <= 0) return 1;
  const moves = generateLegalMoves(pos);
  if (depth === 1) return moves.length;
  let nodes = 0;
  for (const m of moves) {
    const next = applyMove(pos, m);
    if (!next) continue;
    nodes += perft(next, depth - 1);
  }
  return nodes;
}
