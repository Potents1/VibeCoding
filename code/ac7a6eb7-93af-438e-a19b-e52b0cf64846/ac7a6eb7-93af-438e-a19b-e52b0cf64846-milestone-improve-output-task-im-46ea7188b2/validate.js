import { inBounds, other, findKing } from './board.js';

export function isSquareAttacked(board, targetR, targetC, byColor) {
  const pawnDir = byColor === 'w' ? -1 : 1;
  for (const dc of [-1, 1]) {
    const r = targetR + pawnDir;
    const c = targetC + dc;
    if (!inBounds(r, c)) continue;
    const p = board[r][c];
    if (p && p.c === byColor && p.t === 'p') return true;
  }

  const knight = [
    [-2, -1],
    [-2, 1],
    [-1, -2],
    [-1, 2],
    [1, -2],
    [1, 2],
    [2, -1],
    [2, 1]
  ];
  for (const [dr, dc] of knight) {
    const r = targetR + dr;
    const c = targetC + dc;
    if (!inBounds(r, c)) continue;
    const p = board[r][c];
    if (p && p.c === byColor && p.t === 'n') return true;
  }

  const rookDirs = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1]
  ];
  for (const [dr, dc] of rookDirs) {
    let r = targetR + dr;
    let c = targetC + dc;
    while (inBounds(r, c)) {
      const p = board[r][c];
      if (p) {
        if (p.c === byColor && (p.t === 'r' || p.t === 'q')) return true;
        break;
      }
      r += dr;
      c += dc;
    }
  }

  const bishopDirs = [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1]
  ];
  for (const [dr, dc] of bishopDirs) {
    let r = targetR + dr;
    let c = targetC + dc;
    while (inBounds(r, c)) {
      const p = board[r][c];
      if (p) {
        if (p.c === byColor && (p.t === 'b' || p.t === 'q')) return true;
        break;
      }
      r += dr;
      c += dc;
    }
  }

  for (let dr = -1; dr <= 1; dr += 1) {
    for (let dc = -1; dc <= 1; dc += 1) {
      if (dr === 0 && dc === 0) continue;
      const r = targetR + dr;
      const c = targetC + dc;
      if (!inBounds(r, c)) continue;
      const p = board[r][c];
      if (p && p.c === byColor && p.t === 'k') return true;
    }
  }

  return false;
}

export function isInCheck(board, color) {
  const king = findKing(board, color);
  if (!king) return false;
  return isSquareAttacked(board, king.r, king.c, other(color));
}
