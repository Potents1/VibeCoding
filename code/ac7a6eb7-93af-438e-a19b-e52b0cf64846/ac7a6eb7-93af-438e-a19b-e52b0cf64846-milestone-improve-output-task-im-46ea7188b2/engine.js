export function a2rc(a) {
  const file = a[0];
  const rank = Number(a[1]);
  const c = file.charCodeAt(0) - 97;
  const r = 8 - rank;
  return { r, c };
}

export function rc2a(r, c) {
  return String.fromCharCode(97 + c) + String(8 - r);
}

export function pieceUnicode(p) {
  const map = {
    wp: '♙', wn: '♘', wb: '♗', wr: '♖', wq: '♕', wk: '♔',
    bp: '♟', bn: '♞', bb: '♝', br: '♜', bq: '♛', bk: '♚'
  };
  return map[p.c + p.t] || '?';
}

export function createInitialPosition() {
  const empty = Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => null));
  const back = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
  for (let c = 0; c < 8; c++) {
    empty[7][c] = { t: back[c], c: 'w' };
    empty[6][c] = { t: 'p', c: 'w' };
    empty[0][c] = { t: back[c], c: 'b' };
    empty[1][c] = { t: 'p', c: 'b' };
  }
  return { board: empty, turn: 'w' };
}

function inBounds(r, c) {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

function cloneBoard(board) {
  return board.map((row) => row.map((p) => (p ? { t: p.t, c: p.c } : null)));
}

function findKing(board, color) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.c === color && p.t === 'k') return { r, c };
    }
  }
  return null;
}

function attackedBy(board, attackerColor, tr, tc) {
  const dir = attackerColor === 'w' ? -1 : 1;

  // Pawns
  for (const dc of [-1, 1]) {
    const r = tr - dir;
    const c = tc - dc;
    if (inBounds(r, c)) {
      const p = board[r][c];
      if (p && p.c === attackerColor && p.t === 'p') return true;
    }
  }

  // Knights
  const kD = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
  for (const [dr, dc] of kD) {
    const r = tr + dr;
    const c = tc + dc;
    if (!inBounds(r, c)) continue;
    const p = board[r][c];
    if (p && p.c === attackerColor && p.t === 'n') return true;
  }

  // King
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = tr + dr;
      const c = tc + dc;
      if (!inBounds(r, c)) continue;
      const p = board[r][c];
      if (p && p.c === attackerColor && p.t === 'k') return true;
    }
  }

  // Sliding pieces
  const rays = [
    { dr: -1, dc: 0, types: ['r', 'q'] },
    { dr: 1, dc: 0, types: ['r', 'q'] },
    { dr: 0, dc: -1, types: ['r', 'q'] },
    { dr: 0, dc: 1, types: ['r', 'q'] },
    { dr: -1, dc: -1, types: ['b', 'q'] },
    { dr: -1, dc: 1, types: ['b', 'q'] },
    { dr: 1, dc: -1, types: ['b', 'q'] },
    { dr: 1, dc: 1, types: ['b', 'q'] }
  ];

  for (const ray of rays) {
    let r = tr + ray.dr;
    let c = tc + ray.dc;
    while (inBounds(r, c)) {
      const p = board[r][c];
      if (p) {
        if (p.c === attackerColor && ray.types.includes(p.t)) return true;
        break;
      }
      r += ray.dr;
      c += ray.dc;
    }
  }

  return false;
}

export function inCheck(board, color) {
  const k = findKing(board, color);
  if (!k) return false;
  const opp = color === 'w' ? 'b' : 'w';
  return attackedBy(board, opp, k.r, k.c);
}

function pushMove(out, fromR, fromC, toR, toC) {
  out.push({ from: rc2a(fromR, fromC), to: rc2a(toR, toC) });
}

function pseudoMoves(board, color) {
  const out = [];
  const dir = color === 'w' ? -1 : 1;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p || p.c !== color) continue;

      if (p.t === 'p') {
        const f1 = r + dir;
        if (inBounds(f1, c) && !board[f1][c]) {
          pushMove(out, r, c, f1, c);
          const startRow = color === 'w' ? 6 : 1;
          const f2 = r + dir * 2;
          if (r === startRow && inBounds(f2, c) && !board[f2][c]) pushMove(out, r, c, f2, c);
        }
        for (const dc of [-1, 1]) {
          const tr = r + dir;
          const tc = c + dc;
          if (!inBounds(tr, tc)) continue;
          const cap = board[tr][tc];
          if (cap && cap.c !== color) pushMove(out, r, c, tr, tc);
        }
      } else if (p.t === 'n') {
        for (const [dr, dc] of [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]]) {
          const tr = r + dr;
          const tc = c + dc;
          if (!inBounds(tr, tc)) continue;
          const q = board[tr][tc];
          if (!q || q.c !== color) pushMove(out, r, c, tr, tc);
        }
      } else if (p.t === 'b' || p.t === 'r' || p.t === 'q') {
        const dirs = [];
        if (p.t === 'b' || p.t === 'q') dirs.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
        if (p.t === 'r' || p.t === 'q') dirs.push([-1, 0], [1, 0], [0, -1], [0, 1]);
        for (const [dr, dc] of dirs) {
          let tr = r + dr;
          let tc = c + dc;
          while (inBounds(tr, tc)) {
            const q = board[tr][tc];
            if (!q) {
              pushMove(out, r, c, tr, tc);
            } else {
              if (q.c !== color) pushMove(out, r, c, tr, tc);
              break;
            }
            tr += dr;
            tc += dc;
          }
        }
      } else if (p.t === 'k') {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const tr = r + dr;
            const tc = c + dc;
            if (!inBounds(tr, tc)) continue;
            const q = board[tr][tc];
            if (!q || q.c !== color) pushMove(out, r, c, tr, tc);
          }
        }
      }
    }
  }

  return out;
}

export function generateLegalMoves(pos) {
  const moves = pseudoMoves(pos.board, pos.turn);
  const legal = [];
  for (const m of moves) {
    const next = applyMove(pos, m, { skipLegalityCheck: true });
    if (next && !inCheck(next.board, pos.turn)) legal.push(m);
  }
  return legal;
}

export function applyMove(pos, move, { skipLegalityCheck = false } = {}) {
  if (!skipLegalityCheck) {
    const legal = generateLegalMoves(pos);
    if (!legal.some((m) => m.from === move.from && m.to === move.to)) return null;
  }
  const b = cloneBoard(pos.board);
  const f = a2rc(move.from);
  const t = a2rc(move.to);
  const p = b[f.r][f.c];
  if (!p) return null;

  b[f.r][f.c] = null;
  b[t.r][t.c] = p;

  // Promotion: auto-queen
  if (p.t === 'p' && (t.r === 0 || t.r === 7)) b[t.r][t.c] = { t: 'q', c: p.c };

  return { board: b, turn: pos.turn === 'w' ? 'b' : 'w' };
}

export function gameOutcome(pos) {
  const wK = findKing(pos.board, 'w');
  const bK = findKing(pos.board, 'b');
  if (!wK && !bK) return { over: true, result: 'draw' };
  if (!wK) return { over: true, result: 'black' };
  if (!bK) return { over: true, result: 'white' };

  const moves = generateLegalMoves(pos);
  if (moves.length > 0) return { over: false, result: 'ongoing' };
  if (inCheck(pos.board, pos.turn)) return { over: true, result: pos.turn === 'w' ? 'black' : 'white' };
  return { over: true, result: 'draw' };
}