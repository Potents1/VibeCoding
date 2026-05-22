// Game logic for chess moves, checks and game end conditions

function insideBoard(col, row) {
  return col >= 0 && col < 8 && row >= 0 && row < 8;
}

function isOpponentPiece(piece, currentPlayer) {
  return piece && piece.color !== currentPlayer;
}

export function getMovesForPiece(board, pos, currentPlayer) {
  const [col, row] = ChessGame.posToCoords(pos);
  const piece = board[row][col];
  if (!piece || piece.color !== currentPlayer) return [];

  const moves = [];

  function tryMove(c, r) {
    if (!insideBoard(c, r)) return false;
    const target = board[r][c];
    if (!target) {
      moves.push(ChessGame.coordsToPos(c, r));
      return true;
    } else if (isOpponentPiece(target, currentPlayer)) {
      moves.push(ChessGame.coordsToPos(c, r));
      return false;
    } else {
      return false;
    }
  }

  const type = piece.type;

  switch (type) {
    case 'pawn': {
      const dir = (piece.color === 'white') ? 1 : -1;
      const startRow = (piece.color === 'white') ? 1 : 6;
      // Forward move
      let nextRow = row + dir;
      if (insideBoard(col, nextRow) && !board[nextRow][col]) {
        moves.push(ChessGame.coordsToPos(col, nextRow));

        // Double move from start
        if (row === startRow) {
          const jumpRow = row + 2 * dir;
          if (insideBoard(col, jumpRow) && !board[jumpRow][col]) {
            moves.push(ChessGame.coordsToPos(col, jumpRow));
          }
        }
      }

      // Captures
      for (const dc of [-1, 1]) {
        const captureCol = col + dc;
        if (insideBoard(captureCol, nextRow)) {
          const target = board[nextRow][captureCol];
          if (isOpponentPiece(target, currentPlayer)) {
            moves.push(ChessGame.coordsToPos(captureCol, nextRow));
          }
        }
      }
      break;
    }

    case 'knight': {
      const knightMoves = [
        [1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]
      ];
      for (const [dc, dr] of knightMoves) {
        tryMove(col + dc, row + dr);
      }
      break;
    }

    case 'bishop':
    case 'rook':
    case 'queen': {
      const directions = [];
      if (type === 'bishop' || type === 'queen') {
        directions.push([1, 1], [1, -1], [-1, 1], [-1, -1]);
      }
      if (type === 'rook' || type === 'queen') {
        directions.push([1, 0], [-1, 0], [0, 1], [0, -1]);
      }

      for (const [dc, dr] of directions) {
        let cc = col + dc;
        let rr = row + dr;
        while (insideBoard(cc, rr)) {
          if (!tryMove(cc, rr)) break;
          cc += dc;
          rr += dr;
        }
      }
      break;
    }

    case 'king': {
      for (let dc = -1; dc <= 1; dc++) {
        for (let dr = -1; dr <= 1; dr++) {
          if (dc === 0 && dr === 0) continue;
          tryMove(col + dc, row + dr);
        }
      }
      break;
    }
  }

  return moves;
}

function isUnderThreat(board, col, row, byColor) {
  // Check if the cell (col,row) is under threat by the color pieces
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.color === byColor) {
        const fromPos = ChessGame.coordsToPos(c, r);
        const moves = getMovesForPiece(board, fromPos, byColor);
        if (moves.includes(ChessGame.coordsToPos(col, row))) {
          return true;
        }
      }
    }
  }
  return false;
}

export function isCheck(board, currentPlayer) {
  // Check if currentPlayer's king is under threat
  const opponent = currentPlayer === 'white' ? 'black' : 'white';
  let kingPos = null;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.color === currentPlayer && piece.type === 'king') {
        kingPos = [c, r];
        break;
      }
    }
    if (kingPos) break;
  }
  if (!kingPos) return false;
  return isUnderThreat(board, kingPos[0], kingPos[1], opponent);
}

export function isCheckmate(board, currentPlayer) {
  // Check for checkmate: currentPlayer is in check, and has no valid moves to escape
  if (!isCheck(board, currentPlayer)) return false;

  // For each piece, check if any valid move escapes check
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.color === currentPlayer) {
        const fromPos = ChessGame.coordsToPos(c, r);
        const moves = getMovesForPiece(board, fromPos, currentPlayer);
        for (const toPos of moves) {
          // Make hypothetical move and check
          const newBoard = board.map(row => row.map(p => p ? {...p} : null));
          const [fc, fr] = ChessGame.posToCoords(fromPos);
          const [tc, tr] = ChessGame.posToCoords(toPos);
          newBoard[tr][tc] = newBoard[fr][fc];
          newBoard[fr][fc] = null;
          if (!isCheck(newBoard, currentPlayer)) {
            return false;
          }
        }
      }
    }
  }
  return true;
}

export function isStalemate(board, currentPlayer) {
  // Check for stalemate: currentPlayer is NOT in check but has no valid moves
  if (isCheck(board, currentPlayer)) return false;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.color === currentPlayer) {
        const fromPos = ChessGame.coordsToPos(c, r);
        const moves = getMovesForPiece(board, fromPos, currentPlayer);
        if (moves.length > 0) return false;
      }
    }
  }
  return true;
}

export function isValidMove(board, from, to, currentPlayer) {
  const piece = board[ChessGame.posToCoords(from)[1]][ChessGame.posToCoords(from)[0]];
  if (!piece || piece.color !== currentPlayer) return false;

  const validMoves = getMovesForPiece(board, from, currentPlayer);
  if (!validMoves.includes(to)) return false;

  // Check if move leaves player in check
  const newBoard = board.map(row => row.map(p => p ? {...p} : null));
  const [fromCol, fromRow] = ChessGame.posToCoords(from);
  const [toCol, toRow] = ChessGame.posToCoords(to);
  newBoard[toRow][toCol] = newBoard[fromRow][fromCol];
  newBoard[fromRow][fromCol] = null;

  return !isCheck(newBoard, currentPlayer);
}

import { ChessGame } from './chess.js';

// exported functions from this module:
// getMovesForPiece
// isCheck
// isCheckmate
// isStalemate
// isValidMove
