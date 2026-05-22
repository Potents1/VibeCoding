const FILES = 'abcdefgh';

function other(color) {
  return color === 'w' ? 'b' : 'w';
}

export function rcToAlgebraic(r, c) {
  return `${FILES[c]}${8 - r}`;
}

export function algebraicToRC(sq) {
  const file = sq[0];
  const rank = sq[1];
  const c = FILES.indexOf(file);
  const r = 8 - Number(rank);
  if (c < 0 || r < 0 || r > 7) throw new Error(`Invalid square: ${sq}`);
  return { r, c };
}

function inBounds(r, c) {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

function cloneBoard(board) {
  return board.map((row) => row.map((p) => (p ? { ...p } : null)));
}

function findKing(board, color) {
  for (let r = 0; r < 8; r += 1) {
    for (let c = 0; c < 8; c += 1) {
      const p = board[r][c];
      if (p && p.t === 'k' && p.c === color) return { r, c };
    }
  }
  return null;
}

function isSquareAttacked(board, targetR, targetC, byColor) {
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

function isInCheck(board, color) {
  const king = findKing(board, color);
  if (!king) return false;
  return isSquareAttacked(board, king.r, king.c, other(color));
}

function pushIf(board, color, from, toR, toC, moves) {
  if (!inBounds(toR, toC)) return;
  const target = board[toR][toC];
  if (!target || target.c !== color) moves.push({ from, to: rcToAlgebraic(toR, toC) });
}

function genPseudoMoves(board, color) {
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

function applyMoveToBoard(board, move) {
  const { r: fr, c: fc } = algebraicToRC(move.from);
  const { r: tr, c: tc } = algebraicToRC(move.to);
  const p = board[fr][fc];
  if (!p) return null;
  const nextBoard = cloneBoard(board);
  nextBoard[tr][tc] = { ...p };
  nextBoard[fr][fc] = null;

  const moved = nextBoard[tr][tc];
  if (moved.t === 'p' && (tr === 0 || tr === 7)) moved.t = 'q';
  return nextBoard;
}

export function createInitialPosition() {
  const empty = Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => null));
  const placeBackRank = (r, c) => {
    const order = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
    for (let file = 0; file < 8; file += 1) empty[r][file] = { t: order[file], c };
  };
  placeBackRank(0, 'b');
  placeBackRank(7, 'w');
  for (let file = 0; file < 8; file += 1) {
    empty[1][file] = { t: 'p', c: 'b' };
    empty[6][file] = { t: 'p', c: 'w' };
  }
  return { board: empty, turn: 'w' };
}

export function generateLegalMoves(pos) {
  const { board, turn } = pos;
  const pseudo = genPseudoMoves(board, turn);
  const legal = [];
  for (const m of pseudo) {
    const nextBoard = applyMoveToBoard(board, m);
    if (!nextBoard) continue;
    if (!isInCheck(nextBoard, turn)) legal.push(m);
  }
  return legal;
}

export function applyMove(pos, move) {
  const legal = generateLegalMoves(pos);
  if (!legal.some((m) => m.from === move.from && m.to === move.to)) return null;
  const nextBoard = applyMoveToBoard(pos.board, move);
  if (!nextBoard) return null;
  return { board: nextBoard, turn: other(pos.turn) };
}

export function getGameOutcome(pos) {
  const whiteKing = findKing(pos.board, 'w');
  const blackKing = findKing(pos.board, 'b');
  if (!whiteKing && !blackKing) return { over: true, result: 'draw' };
  if (!whiteKing) return { over: true, result: 'black_wins' };
  if (!blackKing) return { over: true, result: 'white_wins' };

  const moves = generateLegalMoves(pos);
  if (moves.length > 0) return { over: false, result: 'ongoing' };

  if (isInCheck(pos.board, pos.turn)) {
    return { over: true, result: pos.turn === 'w' ? 'black_wins' : 'white_wins' };
  }
  return { over: true, result: 'draw' };
}

export function pieceToUnicode(piece) {
  const map = {
    w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
    b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' }
  };
  return map[piece.c]?.[piece.t] || '?';
}
