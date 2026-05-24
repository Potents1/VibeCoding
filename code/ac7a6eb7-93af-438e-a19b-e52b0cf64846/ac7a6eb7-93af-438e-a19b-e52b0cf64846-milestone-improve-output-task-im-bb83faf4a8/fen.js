import { createEmptyBoard } from './board.js';

const PIECE_FROM_FEN = {
  p: { t: 'p', c: 'b' },
  r: { t: 'r', c: 'b' },
  n: { t: 'n', c: 'b' },
  b: { t: 'b', c: 'b' },
  q: { t: 'q', c: 'b' },
  k: { t: 'k', c: 'b' },
  P: { t: 'p', c: 'w' },
  R: { t: 'r', c: 'w' },
  N: { t: 'n', c: 'w' },
  B: { t: 'b', c: 'w' },
  Q: { t: 'q', c: 'w' },
  K: { t: 'k', c: 'w' }
};

export function parseFEN(fen) {
  const parts = fen.trim().split(/\s+/);
  if (parts.length < 2) throw new Error('Invalid FEN');
  const [placement, active] = parts;
  const ranks = placement.split('/');
  if (ranks.length !== 8) throw new Error('Invalid FEN placement');

  const board = createEmptyBoard();
  for (let r = 0; r < 8; r += 1) {
    let c = 0;
    for (const ch of ranks[r]) {
      if (/[1-8]/.test(ch)) {
        c += Number(ch);
      } else {
        const p = PIECE_FROM_FEN[ch];
        if (!p) throw new Error(`Invalid FEN piece: ${ch}`);
        board[r][c] = { ...p };
        c += 1;
      }
    }
    if (c !== 8) throw new Error('Invalid FEN rank width');
  }

  const turn = active === 'w' ? 'w' : 'b';
  return { board, turn };
}

export function toFEN(pos) {
  const ranks = [];
  for (let r = 0; r < 8; r += 1) {
    let run = 0;
    let s = '';
    for (let c = 0; c < 8; c += 1) {
      const p = pos.board[r][c];
      if (!p) {
        run += 1;
        continue;
      }
      if (run) {
        s += String(run);
        run = 0;
      }
      const isWhite = p.c === 'w';
      const letter = p.t;
      s += isWhite ? letter.toUpperCase() : letter;
    }
    if (run) s += String(run);
    ranks.push(s);
  }
  return `${ranks.join('/')} ${pos.turn} - - 0 1`;
}
