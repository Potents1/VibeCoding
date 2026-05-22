import { applyRuntimeHardening } from './security/headers.js';
import {
  createInitialPosition,
  generateLegalMoves,
  applyMove,
  getGameOutcome,
  pieceToUnicode,
  algebraicToRC,
  rcToAlgebraic
} from './engine.js';

function el(tag, attrs = {}) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'text') n.textContent = String(v);
    else n.setAttribute(k, String(v));
  }
  return n;
}

function safeSetText(node, text) {
  node.textContent = text;
}

function computeBoardSize() {
  const max = Math.min(window.innerWidth, window.innerHeight) - 80;
  return Math.max(320, Math.min(640, max));
}

function render(app) {
  const { ctx, canvas, state } = app;
  const size = computeBoardSize();
  if (canvas.width !== size * devicePixelRatio || canvas.height !== size * devicePixelRatio) {
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    canvas.width = Math.floor(size * devicePixelRatio);
    canvas.height = Math.floor(size * devicePixelRatio);
  }

  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  ctx.clearRect(0, 0, size, size);

  const sq = size / 8;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const light = (r + c) % 2 === 0;
      ctx.fillStyle = light ? '#f0d9b5' : '#b58863';
      ctx.fillRect(c * sq, r * sq, sq, sq);
    }
  }

  if (state.selected) {
    const { r, c } = algebraicToRC(state.selected);
    ctx.fillStyle = 'rgba(30,144,255,0.35)';
    ctx.fillRect(c * sq, r * sq, sq, sq);

    for (const m of state.legalFromSelected) {
      const { r: tr, c: tc } = algebraicToRC(m.to);
      ctx.fillStyle = 'rgba(46,204,113,0.35)';
      ctx.fillRect(tc * sq, tr * sq, sq, sq);
    }
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${Math.floor(sq * 0.72)}px system-ui, -apple-system, Segoe UI, Roboto, sans-serif`;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = state.pos.board[r][c];
      if (!piece) continue;
      const glyph = pieceToUnicode(piece);
      ctx.fillStyle = '#111';
      ctx.fillText(glyph, c * sq + sq / 2, r * sq + sq / 2 + 1);
    }
  }
}

function squareFromEvent(app, ev) {
  const rect = app.canvas.getBoundingClientRect();
  const size = rect.width;
  const x = ev.clientX - rect.left;
  const y = ev.clientY - rect.top;
  if (x < 0 || y < 0 || x >= size || y >= size) return null;
  const c = Math.floor((x / size) * 8);
  const r = Math.floor((y / size) * 8);
  return rcToAlgebraic(r, c);
}

function updateStatus(app) {
  const o = getGameOutcome(app.state.pos);
  if (!o.over) {
    safeSetText(app.statusEl, app.state.pos.turn === 'w' ? 'White to move' : 'Black to move');
  } else if (o.result === 'white_wins') {
    safeSetText(app.statusEl, 'Checkmate — White wins');
  } else if (o.result === 'black_wins') {
    safeSetText(app.statusEl, 'Checkmate — Black wins');
  } else {
    safeSetText(app.statusEl, 'Draw');
  }
}

function reset(app) {
  app.state.pos = createInitialPosition();
  app.state.selected = null;
  app.state.legalFromSelected = [];
  updateStatus(app);
  render(app);
}

function onClick(app, ev) {
  const sq = squareFromEvent(app, ev);
  if (!sq) return;

  const outcome = getGameOutcome(app.state.pos);
  if (outcome.over) return;

  const { r, c } = algebraicToRC(sq);
  const piece = app.state.pos.board[r][c];

  if (!app.state.selected) {
    if (piece && piece.c === app.state.pos.turn) {
      app.state.selected = sq;
      app.state.legalFromSelected = generateLegalMoves(app.state.pos).filter((m) => m.from === sq);
    }
    render(app);
    return;
  }

  const candidate = app.state.legalFromSelected.find((m) => m.to === sq);
  if (candidate) {
    const next = applyMove(app.state.pos, candidate);
    if (next) app.state.pos = next;
  }

  if (piece && piece.c === app.state.pos.turn) {
    app.state.selected = sq;
    app.state.legalFromSelected = generateLegalMoves(app.state.pos).filter((m) => m.from === sq);
  } else {
    app.state.selected = null;
    app.state.legalFromSelected = [];
  }

  updateStatus(app);
  render(app);
}

function main() {
  applyRuntimeHardening();

  const root = document.getElementById('app');
  const title = el('h1', { text: 'Chess' });
  const sub = el('p', { text: 'Click a piece to see legal moves. Click a highlighted square to move.' });
  const row = el('div', { class: 'row' });
  const left = el('div', { class: 'left' });
  const right = el('div', { class: 'right' });
  const status = el('div', { id: 'status', role: 'status', 'aria-live': 'polite' });
  const btn = el('button', { id: 'reset', type: 'button', text: 'New Game' });
  const note = el('p', { class: 'note', text: 'Rules: no castling, no en passant. Pawn promotes to queen automatically.' });

  const canvas = el('canvas', { id: 'board', width: '640', height: '640', 'aria-label': 'Chessboard' });
  const ctx = canvas.getContext('2d', { alpha: false });

  left.appendChild(canvas);
  right.appendChild(status);
  right.appendChild(btn);
  right.appendChild(note);

  row.appendChild(left);
  row.appendChild(right);

  root.appendChild(title);
  root.appendChild(sub);
  root.appendChild(row);

  const app = {
    canvas,
    ctx,
    statusEl: status,
    state: { pos: createInitialPosition(), selected: null, legalFromSelected: [] }
  };

  btn.addEventListener('click', () => reset(app));
  canvas.addEventListener('click', (ev) => onClick(app, ev));
  window.addEventListener('resize', () => render(app), { passive: true });

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
