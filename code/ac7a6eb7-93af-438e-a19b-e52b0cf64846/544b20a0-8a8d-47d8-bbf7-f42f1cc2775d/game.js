import { ChessGame } from './chess.js';
import { applyStrictCspMeta } from './security/csp.js';

applyStrictCspMeta();

const boardElement = document.getElementById('board');
const statusElement = document.getElementById('status');
const restartButton = document.getElementById('restart-btn');

function assertEl(el, name) {
  if (!el) throw new Error(`Missing required element: ${name}`);
  return el;
}

assertEl(boardElement, '#board');
assertEl(statusElement, '#status');
assertEl(restartButton, '#restart-btn');

let game = new ChessGame();
let selected = null;

function safeSetText(el, text) {
  el.textContent = String(text);
}

function buildBoardSquares() {
  // Avoid innerHTML; build deterministically.
  while (boardElement.firstChild) boardElement.removeChild(boardElement.firstChild);

  for (let r = 7; r >= 0; r -= 1) {
    for (let c = 0; c < 8; c += 1) {
      const square = document.createElement('button');
      square.type = 'button';
      square.className = 'square';
      square.classList.add(((r + c) % 2 === 0) ? 'light' : 'dark');
      const pos = String.fromCharCode(97 + c) + String.fromCharCode(49 + r);
      square.dataset.position = pos;
      square.setAttribute('aria-label', pos);
      boardElement.appendChild(square);
    }
  }
}

function render(highlights = []) {
  buildBoardSquares();
  const hl = new Set(highlights);

  for (let r = 0; r < 8; r += 1) {
    for (let c = 0; c < 8; c += 1) {
      const pos = String.fromCharCode(97 + c) + String.fromCharCode(49 + r);
      const btn = boardElement.querySelector(`[data-position="${pos}"]`);
      if (!btn) continue;

      const piece = game.getBoard()[r][c];
      safeSetText(btn, piece ? piece.symbol : '');
      btn.title = piece ? `${piece.color} ${piece.type}` : pos;

      if (selected === pos) btn.classList.add('selected');
      if (hl.has(pos)) btn.classList.add('highlight');
    }
  }

  safeSetText(statusElement, game.lastMessage || game.getStatus());
}

function onSquareClick(pos) {
  if (game.gameOver) return;

  if (!selected) {
    const piece = game.getPiece(pos);
    if (!piece || piece.color !== game.currentPlayer) {
      selected = null;
      render([]);
      return;
    }
    selected = pos;
    render(game.getValidMoves(pos));
    return;
  }

  if (selected === pos) {
    selected = null;
    render([]);
    return;
  }

  const res = game.move(selected, pos);
  if (!res.success) {
    // Keep selected if still valid.
    render(game.getValidMoves(selected));
    return;
  }

  selected = null;
  render([]);
}

boardElement.addEventListener('click', (e) => {
  const t = e.target;
  if (!(t instanceof HTMLElement)) return;
  const square = t.closest('.square');
  if (!(square instanceof HTMLElement)) return;
  const pos = square.dataset.position;
  if (typeof pos !== 'string') return;
  onSquareClick(pos);
});

restartButton.addEventListener('click', () => {
  game.reset();
  selected = null;
  render([]);
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'r' || e.key === 'R') {
    game.reset();
    selected = null;
    render([]);
  }
});

render([]);
