export function computeBoardSize() {
  const max = Math.min(window.innerWidth, window.innerHeight) - 80;
  return Math.max(320, Math.min(720, max));
}

export function createBoardView({ engine, canvas, ctx }) {
  const view = {
    engine,
    canvas,
    ctx,
    lastSize: 0
  };

  view.resizeToFit = () => {
    const size = computeBoardSize();
    const px = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    if (view.lastSize !== size || canvas.width !== size * px || canvas.height !== size * px) {
      view.lastSize = size;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
      canvas.width = Math.floor(size * px);
      canvas.height = Math.floor(size * px);
    }
    ctx.setTransform(px, 0, 0, px, 0, 0);
    return size;
  };

  view.render = (state) => {
    const size = view.resizeToFit();
    const sq = size / 8;

    ctx.clearRect(0, 0, size, size);

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const light = (r + c) % 2 === 0;
        ctx.fillStyle = light ? '#f0d9b5' : '#b58863';
        ctx.fillRect(c * sq, r * sq, sq, sq);
      }
    }

    // Check highlight (king square)
    const inCheck = engine.isInCheck(state.pos.board, state.pos.turn);
    if (inCheck) {
      // Find king square
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = state.pos.board[r][c];
          if (p && p.c === state.pos.turn && p.t === 'k') {
            ctx.fillStyle = 'rgba(231,76,60,0.35)';
            ctx.fillRect(c * sq, r * sq, sq, sq);
          }
        }
      }
    }

    // Focus highlight
    if (state.focusSq) {
      const { r, c } = engine.algebraicToRC(state.focusSq);
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 3;
      ctx.strokeRect(c * sq + 1.5, r * sq + 1.5, sq - 3, sq - 3);
    }

    // Selected and legal moves
    if (state.selected) {
      const { r, c } = engine.algebraicToRC(state.selected);
      ctx.fillStyle = 'rgba(30,144,255,0.35)';
      ctx.fillRect(c * sq, r * sq, sq, sq);

      for (const m of state.legalFromSelected) {
        const { r: tr, c: tc } = engine.algebraicToRC(m.to);
        ctx.fillStyle = 'rgba(46,204,113,0.28)';
        ctx.fillRect(tc * sq, tr * sq, sq, sq);
      }
    }

    // Pieces
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${Math.floor(sq * 0.72)}px system-ui, -apple-system, Segoe UI, Roboto, sans-serif`;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = state.pos.board[r][c];
        if (!piece) continue;
        const glyph = engine.pieceToUnicode(piece);
        ctx.fillStyle = '#111';
        ctx.fillText(glyph, c * sq + sq / 2, r * sq + sq / 2 + 1);
      }
    }

    // Drag preview
    if (state.drag && state.drag.active && state.drag.from && state.drag.piece && state.drag.client) {
      const { x, y } = state.drag.client;
      ctx.globalAlpha = 0.9;
      ctx.font = `${Math.floor(sq * 0.78)}px system-ui, -apple-system, Segoe UI, Roboto, sans-serif`;
      ctx.fillStyle = '#111';
      ctx.fillText(engine.pieceToUnicode(state.drag.piece), x, y);
      ctx.globalAlpha = 1;
    }
  };

  view.squareFromClientPoint = (clientX, clientY) => {
    const rect = canvas.getBoundingClientRect();
    const size = rect.width;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    if (x < 0 || y < 0 || x >= size || y >= size) return null;
    const c = Math.floor((x / size) * 8);
    const r = Math.floor((y / size) * 8);
    return engine.rcToAlgebraic(r, c);
  };

  return view;
}
