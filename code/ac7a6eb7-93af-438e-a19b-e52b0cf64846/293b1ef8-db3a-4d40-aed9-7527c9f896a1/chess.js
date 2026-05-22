import { isValidMove, getMovesForPiece, isCheck, isCheckmate, isStalemate } from './gameLogic.js';

export class ChessGame {
  constructor() {
    this.reset();
  }

  reset() {
    this.board = this.createInitialBoard();
    this.currentPlayer = 'white';
    this.gameOver = false;
    this.winner = null;
  }

  createInitialBoard() {
    // 8x8 board with pieces in starting positions
    // Represent each piece with {type:..., color:..., symbol:...}
    const emptyRow = new Array(8).fill(null);
    const board = Array(8).fill().map(() => emptyRow.slice());

    const backRank = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];

    const pieceSymbols = {
      white: { rook: '\u2656', knight: '\u2658', bishop: '\u2657', queen: '\u2655', king: '\u2654', pawn: '\u2659' },
      black: { rook: '\u265C', knight: '\u265E', bishop: '\u265D', queen: '\u265B', king: '\u265A', pawn: '\u265F' },
    };

    for (let i = 0; i < 8; i++) {
      board[0][i] = { type: backRank[i], color: 'black', symbol: pieceSymbols.black[backRank[i]] };
      board[1][i] = { type: 'pawn', color: 'black', symbol: pieceSymbols.black['pawn'] };
      board[6][i] = { type: 'pawn', color: 'white', symbol: pieceSymbols.white['pawn'] };
      board[7][i] = { type: backRank[i], color: 'white', symbol: pieceSymbols.white[backRank[i]] };
    }

    return board;
  }

  getBoard() {
    return this.board;
  }

  getPiece(pos) {
    const [col, row] = ChessGame.posToCoords(pos);
    return this.board[row][col];
  }

  move(from, to) {
    if (this.gameOver) {
      return { success: false, message: 'Game is over' };
    }

    const moveAllowed = isValidMove(this.board, from, to, this.currentPlayer);
    if (!moveAllowed) {
      return { success: false, message: 'Invalid move' };
    }

    // Apply move
    const [fromCol, fromRow] = ChessGame.posToCoords(from);
    const [toCol, toRow] = ChessGame.posToCoords(to);

    const movingPiece = this.board[fromRow][fromCol];

    // Handle move
    this.board[toRow][toCol] = movingPiece;
    this.board[fromRow][fromCol] = null;

    // Check for promotion
    if (movingPiece.type === 'pawn' && (toRow === 0 || toRow === 7)) {
      movingPiece.type = 'queen'; // Auto promote to queen for simplicity
      movingPiece.symbol = this.currentPlayer === 'white' ? '\u2655' : '\u265B';
    }

    // Check if move causes check
    if (isCheck(this.board, this.currentPlayer)) {
      // Illegal move, revert
      this.board[fromRow][fromCol] = movingPiece;
      this.board[toRow][toCol] = null;
      return { success: false, message: 'Move places player in check' };
    }

    // Next player
    this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';

    // Check for game over
    if (isCheckmate(this.board, this.currentPlayer)) {
      this.gameOver = true;
      this.winner = this.currentPlayer === 'white' ? 'black' : 'white';
      return { success: true, message: `${this.winner} wins by checkmate` };
    }

    if (isStalemate(this.board, this.currentPlayer)) {
      this.gameOver = true;
      this.winner = null;
      return { success: true, message: 'Draw by stalemate' };
    }

    return { success: true, message: 'Move accepted' };
  }

  getValidMoves(from) {
    return getMovesForPiece(this.board, from, this.currentPlayer);
  }

  getStatus() {
    if (this.gameOver) {
      if (this.winner) {
        return `${this.winner.charAt(0).toUpperCase() + this.winner.slice(1)} wins!`;
      } else {
        return 'Draw!';
      }
    }
    return `Current turn: ${this.currentPlayer.charAt(0).toUpperCase() + this.currentPlayer.slice(1)}`;
  }

  static posToCoords(pos) {
    const col = pos.charCodeAt(0) - 97;
    const row = parseInt(pos[1], 10) - 1;
    return [col, row];
  }

  static coordsToPos(col, row) {
    return String.fromCharCode(97 + col) + (row + 1);
  }
}
