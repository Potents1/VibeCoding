import { applyRuntimeHardening } from './security/headers.js';
import {
  createInitialPosition,
  generateLegalMoves,
  applyMove,
  getGameOutcome,
  algebraicToRC,
  rcToAlgebraic,
  isInCheck
} from './engine.js';
import { applyAiMove } from './ai.js';
import { el } from './utils/dom.js';
import { computeStatusText } from './ui/status.js';
import { clamp, findKingSquare, renderBoard, squareFromPoint } from './ui/boardView.js';

function wrapSq(r, c) {
  return { r: ((r % 8) + 8) % 8, c: ((c % 8) + 8) % 8 };
}

function setFocusSquare(app, sq, { announce = false } = {}) {
  if (!sq) return;
  app.state.focus = sq;
  if (announce) app.announceEl.textContent = `Focus ${sq}`;
  render(app);
}

function moveFocus(app, dr, dc) {
  const { r, c } = algebraicToRC(app.state.focus);
  const next = wrapSq(r + dr, c + dc);
  setFocusSquare(app, rcToAlgebraic(next.r, next.c));
}

function updateStatus(app) {
  app.statusEl.textContent = computeStatusText(app.state.pos, {
    mode: app.state.mode,
    aiPending: app.state.aiPending
  });
}

function trySelectOrMove(app, sq) {
  if (app.state.aiPending || (app.state.mode === 'single' && app.state.pos.turn === 'b')) return;
  const outcome = getGameOutcome(app.state.pos);
  if (outcome.over) return;

  const { r, c } = algebraicToRC(sq);
  const piece = app.state.pos.board[r][c];

  if (!app.state.selected) {
    if (piece && piece.c === app.state.pos.turn) {
      const legal = generateLegalMoves(app.state.pos).filter((m) => m.from === sq);
      if (legal.length > 0) {
        app.state.selected = sq;
        app.state.legalFromSelected = legal;
        app.announceEl.textContent = `Selected ${sq}`;
      } else {
        app.state.selected = null;
        app.state.legalFromSelected = [];
        app.announceEl.textContent = `No legal moves from ${sq}`;
      }
    }
    updateStatus(app);
    render(app);
    return;
  }

  const candidate = app.state.legalFromSelected.find((m) => m.to === sq);
  if (candidate) {
    const next = applyMove(app.state.pos, candidate);
    if (next) {
      app.state.pos = next;
      app.announceEl.textContent = `Moved ${candidate.from} to ${candidate.to}`;
    }
  }

  if (piece && piece.c === app.state.pos.turn) {
    const legal = generateLegalMoves(app.state.pos).filter((m) => m.from === sq);
    if (legal.length > 0) {
      app.state.selected = sq;
      app.state.legalFromSelected = legal;
      app.announceEl.textContent = `Selected ${sq}`;
    } else {
      app.state.selected = null;
      app.state.legalFromSelected = [];
      app.announceEl.textContent = `No legal moves from ${sq}`;
    }
  } else {
    app.state.selected = null;
    app.state.legalFromSelected = [];
  }

  updateStatus(app);
  render(app);
  maybeRunAiTurn(app);
}

function render(app) {
  const inCheckNow = isInCheck(app.state.pos.board, app.state.pos.turn);
  const kingSq = inCheckNow ? findKingSquare(app.state.pos.board, app.state.pos.turn) : null;

  renderBoard(app.ctx, app.canvas, {
    ...app.state,
    inCheckKingSq: kingSq
  });
}

function squareFromEvent(app, ev) {
  const rect = app.canvas.getBoundingClientRect();
  const size = rect.width;
  const x = ev.clientX - rect.left;
  const y = ev.clientY - rect.top;
  return squareFromPoint({ x, y, size });
}

function reset(app) {
  app.state.pos = createInitialPosition();
  app.state.selected = null;
  app.state.legalFromSelected = [];
  app.state.aiPending = false;
  app.state.focus = 'e2';
  app.announceEl.textContent = 'New game';
  updateStatus(app);
  render(app);
}

function maybeRunAiTurn(app) {
  const outcome = getGameOutcome(app.state.pos);
  if (app.state.mode !== 'single' || app.state.pos.turn !== 'b' || outcome.over || app.state.aiPending) return;

  app.state.aiPending = true;
  app.state.selected = null;
  app.state.legalFromSelected = [];
  updateStatus(app);
  render(app);

  window.setTimeout(() => {
    const result = applyAiMove(app.state.pos);
    app.state.pos = result.pos;
    app.state.aiPending = false;
    if (result.move) app.announceEl.textContent = `AI moved ${result.move.from} to ${result.move.to}`;
    updateStatus(app);
    render(app);
  }, 250);
}

function onClick(app, ev) {
  const sq = squareFromEvent(app, ev);
  if (!sq) return;
  setFocusSquare(app, sq);
  trySelectOrMove(app, sq);
}

function onKeyDown(app, ev) {
  const key = ev.key;
  if (key === 'ArrowLeft') {
    moveFocus(app, 0, -1);
    ev.preventDefault();
    return;
  }
  if (key === 'ArrowRight') {
    moveFocus(app, 0, 1);
    ev.preventDefault();
    return;
  }
  if (key === 'ArrowUp') {
    moveFocus(app, -1, 0);
    ev.preventDefault();
    return;
  }
  if (key === 'ArrowDown') {
    moveFocus(app, 1, 0);
    ev.preventDefault();
    return;
  }
  if (key === 'Escape') {
    app.state.selected = null;
    app.state.legalFromSelected = [];
    app.announceEl.textContent = 'Selection cleared';
    updateStatus(app);
    render(app);
    ev.preventDefault();
    return;
  }
  if (key === 'Enter' || key === ' ') {
    trySelectOrMove(app, app.state.focus);
    ev.preventDefault();
  }
}

function main() {
  applyRuntimeHardening();

  const root = document.getElementById('app');
  const title = el('h1', { text: 'Chess' });
  const sub = el('p', {
    text: 'Mouse: click a piece, then a destination. Keyboard: arrows move focus, Enter selects/moves, Esc cancels.'
  });
  const row = el('div', { class: 'row' });
  const left = el('div', { class: 'left' });
  const right = el('div', { class: 'right' });
  const status = el('div', { id: 'status', role: 'status', 'aria-live': 'polite' });
  const announce = el('div', {
    id: 'announce',
    role: 'status',
    'aria-live': 'polite',
    'aria-atomic': 'true',
    class: 'sr-only'
  });
  const btn = el('button', { id: 'reset', type: 'button', text: 'New Game' });
  const modeBtn = el('button', { id: 'mode', type: 'button', text: 'Mode: Human vs AI' });
  const note = el('p', { class: 'note', text: 'Rules: no castling, no en passant. Pawn promotes to queen automatically.' });

  const canvas = el('canvas', {
    id: 'board',
    width: '640',
    height: '640',
    tabIndex: '0',
    role: 'application',
    'aria-label': 'Chessboard'
  });
  const ctx = canvas.getContext('2d', { alpha: false });

  left.appendChild(canvas);
  right.appendChild(status);
  right.appendChild(modeBtn);
  right.appendChild(btn);
  right.appendChild(note);

  row.appendChild(left);
  row.appendChild(right);

  root.appendChild(title);
  root.appendChild(sub);
  root.appendChild(row);
  root.appendChild(announce);

  const app = {
    canvas,
    ctx,
    statusEl: status,
    announceEl: announce,
    modeBtn,
    state: {
      pos: createInitialPosition(),
      selected: null,
      legalFromSelected: [],
      mode: 'single',
      aiPending: false,
      focus: 'e2'
    }
  };

  btn.addEventListener('click', () => reset(app));
  modeBtn.addEventListener('click', () => {
    app.state.mode = app.state.mode === 'single' ? 'local' : 'single';
    app.modeBtn.textContent = app.state.mode === 'single' ? 'Mode: Human vs AI' : 'Mode: Two Player';
    reset(app);
  });

  canvas.addEventListener('click', (ev) => onClick(app, ev));
  canvas.addEventListener('keydown', (ev) => onKeyDown(app, ev));
  window.addEventListener('resize', () => render(app), { passive: true });

  canvas.focus({ preventScroll: true });
  reset(app);
}

if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => {
    // eslint-disable-next-line no-console
    console.error('Unhandled error', e.error || e.message);
  });
  window.addEventListener('unhandledrejection', (e) => {
    // eslint-disable-next-line no-console
    console.error('Unhandled promise rejection', e.reason);
  });

  main();
}
