import { algebraicToRC, rcToAlgebraic, pieceToUnicode } from '../engine.js';

export function computeBoardSize(win = window) {
  const max = Math.min(win.innerWidth, win.innerHeight) - 80;
  return Math.max(320, Math.min(640, max));
}

export function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

export function squareFromPoint({ x, y, size }) {
  if (x < 0 || y < 0 || x >= size || y >= size) return null;
  const c = clamp(Math.floor((x / size) * 8), 0, 7);
  const r = clamp(Math.floor((y / size) * 8), 0, 7);
  return rcToAlgebraic(r, c);
}

export function findKingSquare(board, color) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.t === 'k' && p.c === color) return rcToAlgebraic(r, c);
    }
  }
  return null;
}

export function renderBoard(ctx, canvas, state, opts = {}) {
  const dpr = opts.devicePixelRatio ?? (typeof devicePixelRatio !== 'undefined' ? devicePixelRatio : 1);
  const size = computeBoardSize(opts.window ?? window);

  if (canvas.width !== size * dpr || canvas.height !== size * dpr) {
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    canvas.width = Math.floor(size * dpr);
    canvas.height = Math.floor(size * dpr);
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, size, size);

  const sq = size / 8;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const light = (r + c) % 2 === 0;
      ctx.fillStyle = light ? '#f0d9b5' : '#b58863';
      ctx.fillRect(c * sq, r * sq, sq, sq);
    }
  }

  if (state.focus) {
    const { r, c } = algebraicToRC(state.focus);
    ctx.strokeStyle = 'rgba(52,152,219,0.95)';
    ctx.lineWidth = Math.max(2, sq * 0.06);
    ctx.strokeRect(c * sq + 2, r * sq + 2, sq - 4, sq - 4);
  }

  if (state.inCheckKingSq) {
    const { r, c } = algebraicToRC(state.inCheckKingSq);
    ctx.fillStyle = 'rgba(231,76,60,0.22)';
    ctx.fillRect(c * sq, r * sq, sq, sq);
    ctx.strokeStyle = 'rgba(231,76,60,0.92)';
    ctx.lineWidth = Math.max(2, sq * 0.06);
    ctx.strokeRect(c * sq + 1, r * sq + 1, sq - 2, sq - 2);
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
