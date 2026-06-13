import { initialState, legalMoves, makeMove, inCheck, isCheckmate, isStalemate, toAlgebraic, fromAlgebraic, aiBestMove, moveToSAN } from './engine.js';

// Expose a minimal API for tests to import from main if required
export { initialState, legalMoves, makeMove, inCheck, isCheckmate, isStalemate, toAlgebraic, fromAlgebraic, aiBestMove } from './engine.js';

if (typeof window !== 'undefined') {
  const boardEl = document.getElementById('board');
  const statusEl = document.getElementById('status');
  const notationEl = document.getElementById('notation');
  const newGameBtn = document.getElementById('newGameBtn');
  const playBlackAI = document.getElementById('playBlackAI');
  const playWhiteAI = document.getElementById('playWhiteAI');
  const aiDepthInput = document.getElementById('aiDepth');

  let state = initialState();
  let selected = null;
  let legal = [];
  let movesHistory = [];

  function render() {
    boardEl.innerHTML = '';
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const idx = r * 8 + f;
        const sq = document.createElement('div');
        sq.className = 'square ' + ((r + f) % 2 ? 'dark' : 'light');
        sq.dataset.index = String(idx);
        if (selected === idx) sq.classList.add('selected');

        const p = state.board[idx];
        if (p) {
          const span = document.createElement('span');
          span.className = 'piece';
          span.textContent = pieceChar(p);
          sq.appendChild(span);
        }

        // legal move dots
        const lm = legal.find(m => m.to === idx);
        if (lm) {
          if (lm.capture) {
            const c = document.createElement('div');
            c.className = 'capture';
            sq.appendChild(c);
          } else {
            const d = document.createElement('div');
            d.className = 'dot';
            sq.appendChild(d);
          }
        }

        sq.addEventListener('click', onSquareClick);
        boardEl.appendChild(sq);
      }
    }

    const turnName = state.turn === 'w' ? 'White' : 'Black';
    const check = inCheck(state, state.turn) ? ' (check)' : '';
    const mate = isCheckmate(state) ? ' - Checkmate' : isStalemate(state) ? ' - Stalemate' : '';
    statusEl.textContent = `Turn: ${turnName}${check}${mate}`;
    notationEl.textContent = movesHistory.join(' ');
  }

  function pieceChar(p) {
    const M = { p: '♙', r: '♖', n: '♘', b: '♗', q: '♕', k: '♔' };
    const m = { p: '♟', r: '♜', n: '♞', b: '♝', q: '♛', k: '♚' };
    return p.color === 'w' ? M[p.type] : m[p.type];
  }

  function onSquareClick(e) {
    const idx = parseInt(e.currentTarget.dataset.index, 10);
    const p = state.board[idx];

    const sideAI = { w: playWhiteAI.checked, b: playBlackAI.checked };
    if (sideAI[state.turn]) return; // do not allow moving while AI turn

    if (selected == null) {
      if (!p || p.color !== state.turn) return;
      selected = idx;
      legal = legalMoves(state).filter(m => m.from === idx);
    } else {
      const m = legal.find(mv => mv.to === idx);
      if (m) {
        const before = state;
        state = makeMove(state, m);
        movesHistory.push(moveToSAN(before, m));
        selected = null; legal = [];
        render();
        maybeAIMove();
        return;
      }
      // reselect if own piece
      if (p && p.color === state.turn) {
        selected = idx;
        legal = legalMoves(state).filter(m => m.from === idx);
      } else {
        selected = null; legal = [];
      }
    }
    render();
  }

  function maybeAIMove() {
    const sideAI = { w: playWhiteAI.checked, b: playBlackAI.checked };
    if (isCheckmate(state) || isStalemate(state)) return;
    if (sideAI[state.turn]) {
      const depth = Math.max(1, Math.min(5, parseInt(aiDepthInput.value || '3', 10)));
      // Delay a tick for UI feel
      setTimeout(() => {
        const m = aiBestMove(state, depth) || legalMoves(state)[0];
        if (!m) return;
        const before = state;
        state = makeMove(state, m);
        movesHistory.push(moveToSAN(before, m));
        render();
        maybeAIMove();
      }, 50);
    }
  }

  newGameBtn.addEventListener('click', () => {
    state = initialState();
    movesHistory = [];
    selected = null; legal = [];
    render();
    maybeAIMove();
  });

  render();
  maybeAIMove();
}
