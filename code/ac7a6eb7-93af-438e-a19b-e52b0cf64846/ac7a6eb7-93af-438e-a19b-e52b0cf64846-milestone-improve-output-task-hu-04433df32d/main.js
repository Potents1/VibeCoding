import { applyRuntimeHardening } from './security/headers.js';
import { createEngine } from './engine/chessEngine.js';
import { createBoardView } from './ui/boardView.js';
import { createInputController } from './ui/inputController.js';
import { sanitizeFen } from './utils/sanitize.js';

function el(tag, attrs = {}) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'text') n.textContent = String(v);
    else n.setAttribute(k, String(v));
  }
  return n;
}

function formatTurn(turn) {
  return turn === 'w' ? 'White' : 'Black';
}

function updateStatus(app) {
  const o = app.engine.getGameOutcome(app.state.pos);
  const inCheck = app.engine.isInCheck(app.state.pos.board, app.state.pos.turn);
  const dot = ' \u2022 ';

  if (!o.over) {
    const parts = [`${formatTurn(app.state.pos.turn)} to move`];
    if (inCheck) parts.push('In check');
    if (app.state.message) parts.push(app.state.message);
    app.statusEl.textContent = parts.join(dot);
    app.state.message = '';
    return;
  }

  if (o.result === 'white_wins') app.statusEl.textContent = `Checkmate${dot}White wins`;
  else if (o.result === 'black_wins') app.statusEl.textContent = `Checkmate${dot}Black wins`;
  else app.statusEl.textContent = 'Draw';
}

function pushMove(app, move) {
  const item = el('li');
  item.textContent = `${move.from}-${move.to}`;
  app.movesEl.appendChild(item);
}

function reset(app, { fen = null } = {}) {
  if (fen) {
    const parsed = app.engine.parseFEN(fen);
    if (parsed) app.state.pos = parsed;
    else app.state.pos = app.engine.createInitialPosition();
  } else {
    app.state.pos = app.engine.createInitialPosition();
  }

  app.state.selected = null;
  app.state.legalFromSelected = [];
  app.state.message = '';
  app.state.focusSq = 'e2';
  app.state.drag = { active: false, from: null, piece: null, client: null };

  while (app.movesEl.firstChild) app.movesEl.removeChild(app.movesEl.firstChild);

  updateStatus(app);
  app.render();
}

function main() {
  applyRuntimeHardening();

  const engine = createEngine();
  const root = document.getElementById('app');

  const title = el('h1', { text: 'Chess' });
  const sub = el('p', {
    text: 'Pointer: click squares or drag a piece to a destination. Keyboard: Arrow keys move focus, Enter/Space selects and moves, Esc cancels.'
  });

  const row = el('div', { class: 'row' });
  const left = el('div', { class: 'left' });
  const right = el('div', { class: 'right' });

  const status = el('div', { id: 'status', role: 'status', 'aria-live': 'polite' });

  const btn = el('button', { id: 'reset', type: 'button', text: 'New Game' });

  const fenLabel = el('label', { for: 'fen', class: 'label', text: 'Load position (FEN, optional)' });
  const fenInput = el('input', {
    id: 'fen',
    type: 'text',
    inputmode: 'latin',
    autocomplete: 'off',
    spellcheck: 'false',
    'aria-label': 'FEN input'
  });
  const fenBtn = el('button', { id: 'loadfen', type: 'button', text: 'Load FEN' });

  const movesTitle = el('div', { class: 'sectionTitle', text: 'Moves' });
  const moves = el('ol', { id: 'moves' });

  const note = el('p', { class: 'note', text: 'Rules: no castling, no en passant. Pawn promotes to queen automatically.' });

  const canvas = el('canvas', {
    id: 'board',
    width: '640',
    height: '640',
    tabindex: '0',
    role: 'application',
    'aria-label': 'Chessboard'
  });
  const ctx = canvas.getContext('2d', { alpha: false });

  left.appendChild(canvas);

  right.appendChild(status);
  right.appendChild(btn);
  right.appendChild(fenLabel);
  right.appendChild(fenInput);
  right.appendChild(fenBtn);
  right.appendChild(movesTitle);
  right.appendChild(moves);
  right.appendChild(note);

  row.appendChild(left);
  row.appendChild(right);

  root.appendChild(title);
  root.appendChild(sub);
  root.appendChild(row);

  const view = createBoardView({ engine, canvas, ctx });

  const app = {
    engine,
    canvas,
    ctx,
    view,
    statusEl: status,
    movesEl: moves,
    state: {
      pos: engine.createInitialPosition(),
      selected: null,
      legalFromSelected: [],
      message: '',
      focusSq: 'e2',
      drag: { active: false, from: null, piece: null, client: null }
    },
    render: () => view.render(app.state)
  };

  const ctrl = createInputController({
    engine,
    app,
    view,
    onStatus: () => updateStatus(app)
  });

  // Monkey-patch to record moves when a move is made.
  const origApply = engine.applyMove;
  engine.applyMove = (pos, move) => {
    const next = origApply(pos, move);
    if (next) pushMove(app, move);
    return next;
  };

  btn.addEventListener('click', () => reset(app));

  fenBtn.addEventListener('click', () => {
    const fen = sanitizeFen(fenInput.value);
    reset(app, { fen: fen || null });
  });

  canvas.addEventListener('pointerdown', (ev) => ctrl.onPointerDown(ev));
  canvas.addEventListener('pointermove', (ev) => ctrl.onPointerMove(ev));
  canvas.addEventListener('pointerup', (ev) => ctrl.onPointerUp(ev));
  canvas.addEventListener('pointercancel', (ev) => ctrl.onPointerUp(ev));
  canvas.addEventListener('keydown', (ev) => ctrl.onKeyDown(ev));
  window.addEventListener('resize', () => app.render(), { passive: true });

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
