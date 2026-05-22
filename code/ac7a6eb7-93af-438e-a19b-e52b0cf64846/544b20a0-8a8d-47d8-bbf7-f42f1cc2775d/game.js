import { ChessGame } from './chess.js';

const boardElement = document.getElementById('board');
const statusElement = document.getElementById('status');
const restartButton = document.getElementById('restart-btn');

let game;

function createBoard() {
  boardElement.innerHTML = '';
  for (let r = 7; r >= 0; r--) {
    for (let c = 0; c < 8; c++) {
      const square = document.createElement('div');
      square.className = 'square';
      if ((r + c) % 2 === 0) {
        square.classList.add('light');
      } else {
        square.classList.add('dark');
      }
      square.dataset.position = `${String.fromCharCode(97 + c)}${r + 1}`;
      boardElement.appendChild(square);
    }
  }
}

function render() {
  createBoard();

  game.getBoard().forEach((row, r) => {
    row.forEach((piece, c) => {
      if (piece) {
        const pos = `${String.fromCharCode(97 + c)}${r + 1}`;
        const square = boardElement.querySelector(`[data-position="${pos}"]`);
        if (square) {
          square.textContent = piece.symbol;
          square.title = `${piece.color} ${piece.type}`;
        }
      }
    });
  });

  statusElement.textContent = game.getStatus();
}

function setupHandlers() {
  let selectedSquare = null;

  boardElement.addEventListener('click', (e) => {
    const target = e.target;
    if (!target.classList.contains('square')) return;
    const pos = target.dataset.position;

    if (selectedSquare && selectedSquare === pos) {
      selectedSquare = null;
      render();
      return;
    }

    if (!selectedSquare) {
      const piece = game.getPiece(pos);
      if (piece && piece.color === game.currentPlayer) {
        selectedSquare = pos;
        highlightMoves(selectedSquare);
      }
    } else {
      const moveResult = game.move(selectedSquare, pos);
      if (moveResult.success) {
        selectedSquare = null;
      } else {
        // invalid move, keep selection for user
        selectedSquare = selectedSquare;
      }
      render();
    }
  });

  restartButton.addEventListener('click', () => {
    game.reset();
    selectedSquare = null;
    render();
  });
}

function highlightMoves(fromPos) {
  const squares = boardElement.querySelectorAll('.square');
  const validMoves = game.getValidMoves(fromPos);

  squares.forEach(square => {
    square.classList.remove('highlight');
  });

  validMoves.forEach(toPos => {
    const sq = boardElement.querySelector(`[data-position="${toPos}"]`);
    if (sq) {
      sq.classList.add('highlight');
    }
  });
}

function startGame() {
  game = new ChessGame();
  render();
  setupHandlers();
}

window.addEventListener('DOMContentLoaded', () => {
  startGame();
});
