const FILES = 'abcdefgh';

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

export function other(color) {
  return color === 'w' ? 'b' : 'w';
}

export function inBounds(r, c) {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

export function cloneBoard(board) {
  return board.map((row) => row.map((p) => (p ? { ...p } : null)));
}

export function createEmptyBoard() {
  return Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => null));
}

export function createInitialPosition() {
  const board = createEmptyBoard();
  const placeBackRank = (r, c) => {
    const order = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
    for (let file = 0; file < 8; file += 1) board[r][file] = { t: order[file], c };
  };
  placeBackRank(0, 'b');
  placeBackRank(7, 'w');
  for (let file = 0; file < 8; file += 1) {
    board[1][file] = { t: 'p', c: 'b' };
    board[6][file] = { t: 'p', c: 'w' };
  }
  return { board, turn: 'w' };
}

export function findKing(board, color) {
  for (let r = 0; r < 8; r += 1) {
    for (let c = 0; c < 8; c += 1) {
      const p = board[r][c];
      if (p && p.t === 'k' && p.c === color) return { r, c };
    }
  }
  return null;
}

export function pieceToUnicode(piece) {
  const map = {
    w: { k: '\u2654', q: '\u2655', r: '\u2656', b: '\u2657', n: '\u2658', p: '\u2659' },
    b: { k: '\u265a', q: '\u265b', r: '\u265c', b: '\u265d', n: '\u265e', p: '\u265f' }
  };
  return map[piece.c]?.[piece.t] || '?';
}
