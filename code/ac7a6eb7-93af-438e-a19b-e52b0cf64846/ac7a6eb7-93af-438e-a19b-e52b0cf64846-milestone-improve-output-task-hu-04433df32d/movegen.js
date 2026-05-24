import { algebraicToRC, rcToAlgebraic, inBounds } from './board.js';

function pushIf(board, color, from, toR, toC, moves) {
  if (!inBounds(toR, toC)) return;
  const target = board[toR][toC];
  if (!target || target.c !== color) moves.push({ from, to: rcToAlgebraic(toR, toC) });
}

export function generatePseudoMoves(board, color) {
  const moves = [];
  for (let r = 0; r < 8; r += 1) {
    for (let c = 0; c < 8; c += 1) {
      const p = board[r][c];
      if (!p || p.c !== color) continue;
      const from = rcToAlgebraic(r, c);

      if (p.t === 'p') {
        const dir = color === 'w' ? -1 : 1;
        const startRank = color === 'w' ? 6 : 1;
        const oneR = r + dir;
        if (inBounds(oneR, c) && !board[oneR][c]) {
          moves.push({ from, to: rcToAlgebraic(oneR, c) });
          const twoR = r + 2 * dir;
          if (r === startRank && inBounds(twoR, c) && !board[twoR][c]) {
            moves.push({ from, to: rcToAlgebraic(twoR, c) });
          }
        }
        for (const dc of [-1, 1]) {
          const tr = r + dir;
          const tc = c + dc;
          if (!inBounds(tr, tc)) continue;
          const target = board[tr][tc];
          if (target && target.c !== color) moves.push({ from, to: rcToAlgebraic(tr, tc) });
        }
        continue;
      }

      if (p.t === 'n') {
        const deltas = [
          [-2, -1],
          [-2, 1],
          [-1, -2],
          [-1, 2],
          [1, -2],
          [1, 2],
          [2, -1],
          [2, 1]
        ];
        for (const [dr, dc] of deltas) pushIf(board, color, from, r + dr, c + dc, moves);
        continue;
      }

      if (p.t === 'k') {
        for (let dr = -1; dr <= 1; dr += 1) {
          for (let dc = -1; dc <= 1; dc += 1) {
            if (dr === 0 && dc === 0) continue;
            pushIf(board, color, from, r + dr, c + dc, moves);
          }
        }
        continue;
      }

      const dirs = [];
      if (p.t === 'b' || p.t === 'q') dirs.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
      if (p.t === 'r' || p.t === 'q') dirs.push([-1, 0], [1, 0], [0, -1], [0, 1]);

      for (const [dr, dc] of dirs) {
        let tr = r + dr;
        let tc = c + dc;
        while (inBounds(tr, tc)) {
          const target = board[tr][tc];
          if (!target) {
            moves.push({ from, to: rcToAlgebraic(tr, tc) });
          } else {
            if (target.c !== color) moves.push({ from, to: rcToAlgebraic(tr, tc) });
            break;
          }
          tr += dr;
          tc += dc;
        }
      }
    }
  }

  return moves;
}

export function applyMoveToBoard(board, move) {
  const { r: fr, c: fc } = algebraicToRC(move.from);
  const { r: tr, c: tc } = algebraicToRC(move.to);
  const p = board[fr][fc];
  if (!p) return null;
  const nextBoard = board.map((row) => row.map((pp) => (pp ? { ...pp } : null)));
  nextBoard[tr][tc] = { ...p };
  nextBoard[fr][fc] = null;
  const moved = nextBoard[tr][tc];
  if (moved.t === 'p' && (tr === 0 || tr === 7)) moved.t = 'q';
  return nextBoard;
}
