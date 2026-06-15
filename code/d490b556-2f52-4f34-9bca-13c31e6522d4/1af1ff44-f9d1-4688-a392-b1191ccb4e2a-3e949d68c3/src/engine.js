// Chess engine with deterministic state loop, legal move generation, check/checkmate, castling, en passant, promotion,
// and a competent AI using minimax with alpha-beta pruning.

// Board representation: 0..63 squares, 0=a8, 7=h8, 56=a1, 63=h1
// Pieces: { type: 'p','n','b','r','q','k', color: 'w'|'b' }
// State: { board[64], turn:'w'|'b', castling:{K,Q,k,q}, epSquare: index|null, halfmove, fullmove, history }

export const PIECE_VALUES = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
const DIRS_BISHOP = [-9,-7,7,9];
const DIRS_ROOK = [-8, -1, 1, 8];
const DIRS_QUEEN = [...DIRS_BISHOP, ...DIRS_ROOK];
const KNIGHT_OFFSETS = [-17,-15,-10,-6,6,10,15,17];
const KING_OFFSETS = [-9,-8,-7,-1,1,7,8,9];

export function cloneState(s) {
  return {
    board: s.board.slice(),
    turn: s.turn,
    castling: { K: s.castling.K, Q: s.castling.Q, k: s.castling.k, q: s.castling.q },
    epSquare: s.epSquare,
    halfmove: s.halfmove,
    fullmove: s.fullmove,
    history: s.history ? s.history.slice() : []
  };
}

export function toAlgebraic(idx) {
  const file = idx % 8;
  const rank = 8 - Math.floor(idx / 8);
  return String.fromCharCode(97 + file) + String(rank);
}

export function fromAlgebraic(sq) {
  const file = sq.charCodeAt(0) - 97;
  const rank = parseInt(sq[1], 10);
  return (8 - rank) * 8 + file;
}

export function initialState() {
  return fromFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
}

function piece(c, t) { return { color: c, type: t }; }

export function toFEN(state) {
  let s = '';
  for (let r = 0; r < 8; r++) {
    let empty = 0;
    for (let f = 0; f < 8; f++) {
      const idx = r * 8 + f;
      const p = state.board[idx];
      if (!p) empty++;
      else {
        if (empty) { s += empty; empty = 0; }
        const ch = p.type;
        s += p.color === 'w' ? ch.toUpperCase() : ch.toLowerCase();
      }
    }
    if (empty) s += empty;
    if (r !== 7) s += '/';
  }
  const turn = state.turn;
  let rights = '';
  rights += state.castling.K ? 'K' : '';
  rights += state.castling.Q ? 'Q' : '';
  rights += state.castling.k ? 'k' : '';
  rights += state.castling.q ? 'q' : '';
  if (!rights) rights = '-';
  const ep = state.epSquare != null ? toAlgebraic(state.epSquare) : '-';
  return `${s} ${turn} ${rights} ${ep} ${state.halfmove} ${state.fullmove}`;
}

function emptyBoardState() {
  return { board: new Array(64).fill(null), turn: 'w', castling: { K: false, Q: false, k: false, q: false }, epSquare: null, halfmove: 0, fullmove: 1, history: [] };
}

export function fromFEN(fen) {
  const [placement, turn, rights, ep, half, full] = fen.trim().split(/\s+/);
  const st = emptyBoardState();
  let idx = 0;
  for (const ch of placement) {
    if (ch === '/') continue;
    if (/[1-8]/.test(ch)) idx += parseInt(ch, 10);
    else {
      const color = ch === ch.toUpperCase() ? 'w' : 'b';
      const type = ch.toLowerCase();
      st.board[idx++] = piece(color, type);
    }
  }
  st.turn = turn === 'b' ? 'b' : 'w';
  st.castling = { K: false, Q: false, k: false, q: false };
  if (rights && rights !== '-') {
    for (const r of rights) if (st.castling.hasOwnProperty(r)) st.castling[r] = true;
  }
  st.epSquare = ep && ep !== '-' ? fromAlgebraic(ep) : null;
  st.halfmove = half ? parseInt(half, 10) : 0;
  st.fullmove = full ? parseInt(full, 10) : 1;
  return st;
}

function onBoard(i) { return i >= 0 && i < 64; }
function fileOf(i) { return i % 8; }
function rankOf(i) { return Math.floor(i / 8); }

function addMove(list, from, to, promotion, flags) {
  const m = { from, to };
  if (promotion) m.promotion = promotion;
  if (flags) Object.assign(m, flags);
  list.push(m);
}

function isEmpty(st, sq) { return onBoard(sq) && !st.board[sq]; }
function isEnemy(st, sq, color) { return onBoard(sq) && st.board[sq] && st.board[sq].color !== color; }

function genPawnMoves(st, i, color, moves, onlyAttacks = false) {
  const dir = color === 'w' ? -8 : 8;
  const startRank = color === 'w' ? 6 : 1;
  const promoRank = color === 'w' ? 0 : 7;

  const f = fileOf(i);
  const r = rankOf(i);

  // Captures
  for (const df of [-1, 1]) {
    const to = i + dir + df;
    if (onBoard(to) && Math.abs(fileOf(to) - f) === 1) {
      if (isEnemy(st, to, color)) {
        if (rankOf(to) === promoRank) {
          for (const pr of ['q', 'r', 'b', 'n']) addMove(moves, i, to, pr, { capture: true });
        } else addMove(moves, i, to, null, { capture: true });
      }
      // en passant
      if (st.epSquare === to && !onlyAttacks) {
        addMove(moves, i, to, null, { enPassant: true, capture: true });
      }
    }
  }

  if (onlyAttacks) return;

  // One forward
  const one = i + dir;
  if (isEmpty(st, one)) {
    if (rankOf(one) === promoRank) {
      for (const pr of ['q', 'r', 'b', 'n']) addMove(moves, i, one, pr, {});
    } else addMove(moves, i, one);

    // Two forward from start
    if (r === startRank) {
      const two = i + dir * 2;
      if (isEmpty(st, two)) addMove(moves, i, two, null, { epSet: i + dir });
    }
  }
}

function genKnightMoves(st, i, color, moves) {
  const f0 = fileOf(i);
  for (const off of KNIGHT_OFFSETS) {
    const to = i + off;
    if (!onBoard(to)) continue;
    const df = Math.abs(fileOf(to) - f0);
    const dr = Math.abs(rankOf(to) - rankOf(i));
    if (!((df === 1 && dr === 2) || (df === 2 && dr === 1))) continue;
    const p = st.board[to];
    if (!p) addMove(moves, i, to);
    else if (p.color !== color) addMove(moves, i, to, null, { capture: true });
  }
}

function slideGen(st, i, color, dirs, moves) {
  for (const d of dirs) {
    let to = i + d;
    while (onBoard(to)) {
      const df = Math.abs(fileOf(to) - fileOf(to - d));
      const dr = Math.abs(rankOf(to) - rankOf(to - d));
      // Prevent wrap around for horizontal or diagonal
      if ((d === 1 || d === -1) && dr !== 0) break;
      if ((d === 7 || d === -7 || d === 9 || d === -9) && df !== 1) break;
      const p = st.board[to];
      if (!p) {
        addMove(moves, i, to);
      } else {
        if (p.color !== color) addMove(moves, i, to, null, { capture: true });
        break;
      }
      to += d;
    }
  }
}

function genKingMoves(st, i, color, moves, includeCastling = true) {
  const f0 = fileOf(i);
  for (const off of KING_OFFSETS) {
    const to = i + off;
    if (!onBoard(to)) continue;
    const df = Math.abs(fileOf(to) - f0);
    const dr = Math.abs(rankOf(to) - rankOf(i));
    if (df > 1 || dr > 1) continue;
    const p = st.board[to];
    if (!p) addMove(moves, i, to);
    else if (p.color !== color) addMove(moves, i, to, null, { capture: true });
  }
  if (!includeCastling) return;
  // Castling
  if (color === 'w' && i === 60) {
    // short
    if (st.castling.K && !st.board[61] && !st.board[62] && !inCheck(st, 'w') && !isSquareAttacked(st, 61, 'b') && !isSquareAttacked(st, 62, 'b')) {
      addMove(moves, i, 62, null, { castle: 'K' });
    }
    // long
    if (st.castling.Q && !st.board[59] && !st.board[58] && !st.board[57] && !inCheck(st, 'w') && !isSquareAttacked(st, 59, 'b') && !isSquareAttacked(st, 58, 'b')) {
      addMove(moves, i, 58, null, { castle: 'Q' });
    }
  } else if (color === 'b' && i === 4) {
    // short
    if (st.castling.k && !st.board[5] && !st.board[6] && !inCheck(st, 'b') && !isSquareAttacked(st, 5, 'w') && !isSquareAttacked(st, 6, 'w')) {
      addMove(moves, i, 6, null, { castle: 'k' });
    }
    // long
    if (st.castling.q && !st.board[3] && !st.board[2] && !st.board[1] && !inCheck(st, 'b') && !isSquareAttacked(st, 3, 'w') && !isSquareAttacked(st, 2, 'w')) {
      addMove(moves, i, 2, null, { castle: 'q' });
    }
  }
}

function genPseudoMoves(st, color) {
  const moves = [];
  for (let i = 0; i < 64; i++) {
    const p = st.board[i];
    if (!p || p.color !== color) continue;
    switch (p.type) {
      case 'p': genPawnMoves(st, i, color, moves); break;
      case 'n': genKnightMoves(st, i, color, moves); break;
      case 'b': slideGen(st, i, color, DIRS_BISHOP, moves); break;
      case 'r': slideGen(st, i, color, DIRS_ROOK, moves); break;
      case 'q': slideGen(st, i, color, DIRS_QUEEN, moves); break;
      case 'k': genKingMoves(st, i, color, moves); break;
    }
  }
  return moves;
}

export function isSquareAttacked(st, sq, byColor) {
  // Pawns
  const dir = byColor === 'w' ? -8 : 8;
  for (const df of [-1, 1]) {
    const from = sq - dir - df; // reverse
    if (onBoard(from) && st.board[from] && st.board[from].color === byColor && st.board[from].type === 'p') {
      if (Math.abs(fileOf(from) - fileOf(sq)) === 1 && rankOf(from) === rankOf(sq) + (byColor === 'w' ? 1 : -1)) return true;
    }
  }
  // Knights
  for (const off of KNIGHT_OFFSETS) {
    const from = sq - off;
    if (onBoard(from) && st.board[from] && st.board[from].color === byColor && st.board[from].type === 'n') {
      const df = Math.abs(fileOf(from) - fileOf(sq));
      const dr = Math.abs(rankOf(from) - rankOf(sq));
      if ((df === 1 && dr === 2) || (df === 2 && dr === 1)) return true;
    }
  }
  // King
  for (const off of KING_OFFSETS) {
    const from = sq - off;
    if (onBoard(from) && st.board[from] && st.board[from].color === byColor && st.board[from].type === 'k') {
      const df = Math.abs(fileOf(from) - fileOf(sq));
      const dr = Math.abs(rankOf(from) - rankOf(sq));
      if (df <= 1 && dr <= 1) return true;
    }
  }
  // Bishop/Queen diagonals
  for (const d of DIRS_BISHOP) {
    let from = sq - d;
    while (onBoard(from)) {
      const df = Math.abs(fileOf(from) - fileOf(from + d));
      const dr = Math.abs(rankOf(from) - rankOf(from + d));
      if (df !== 1) break;
      const p = st.board[from];
      if (p) {
        if (p.color === byColor && (p.type === 'b' || p.type === 'q')) return true;
        break;
      }
      from -= d;
    }
  }
  // Rook/Queen lines
  for (const d of DIRS_ROOK) {
    let from = sq - d;
    while (onBoard(from)) {
      const prev = from + d;
      const dr = Math.abs(rankOf(from) - rankOf(prev));
      if ((d === 1 || d === -1) && dr !== 0) break;
      const p = st.board[from];
      if (p) {
        if (p.color === byColor && (p.type === 'r' || p.type === 'q')) return true;
        break;
      }
      from -= d;
    }
  }
  return false;
}

export function inCheck(st, color) {
  let ksq = -1;
  for (let i = 0; i < 64; i++) {
    const p = st.board[i];
    if (p && p.color === color && p.type === 'k') { ksq = i; break; }
  }
  if (ksq === -1) return false; // malformed, but avoid crash
  return isSquareAttacked(st, ksq, color === 'w' ? 'b' : 'w');
}

export function makeMove(state, move) {
  const st = cloneState(state);
  const from = move.from, to = move.to;
  const pieceFrom = st.board[from];
  const their = st.board[to];

  // Update halfmove clock
  if (!pieceFrom) throw new Error('No piece on from square');
  const isPawn = pieceFrom.type === 'p';
  const isCapture = !!their || move.enPassant;
  st.halfmove = (isPawn || isCapture) ? 0 : (st.halfmove + 1);

  // Move piece
  st.board[to] = pieceFrom;
  st.board[from] = null;

  // En passant capture
  if (move.enPassant) {
    const capSq = pieceFrom.color === 'w' ? to + 8 : to - 8;
    st.board[capSq] = null;
  }

  // Promotion
  if (pieceFrom.type === 'p') {
    const promoRank = pieceFrom.color === 'w' ? 0 : 7;
    if (rankOf(to) === promoRank) {
      const pr = move.promotion || 'q';
      st.board[to] = { color: pieceFrom.color, type: pr };
    }
  }

  // Castling move: move rook
  if (pieceFrom.type === 'k') {
    if (pieceFrom.color === 'w') {
      st.castling.K = false; st.castling.Q = false;
      if (move.castle === 'K') { // e1->g1 rook h1->f1
        st.board[63] = null; st.board[61] = piece('w', 'r');
      } else if (move.castle === 'Q') { // e1->c1 rook a1->d1
        st.board[56] = null; st.board[59] = piece('w', 'r');
      }
    } else {
      st.castling.k = false; st.castling.q = false;
      if (move.castle === 'k') { // e8->g8 rook h8->f8 (note: black king at e8 index 4)
        st.board[7] = null; st.board[5] = piece('b', 'r');
      } else if (move.castle === 'q') { // e8->c8 rook a8->d8
        st.board[0] = null; st.board[3] = piece('b', 'r');
      }
    }
  }

  // If rook or king moves/captured, update castling rights
  const updateCastlingBySquare = (sq) => {
    switch (sq) {
      case 60: st.castling.K = false; st.castling.Q = false; break; // white king
      case 4: st.castling.k = false; st.castling.q = false; break; // black king (e8)
      case 63: st.castling.K = false; break; // h1 rook
      case 56: st.castling.Q = false; break; // a1 rook
      case 7: st.castling.k = false; break; // h8 rook
      case 0: st.castling.q = false; break; // a8 rook
    }
  };
  updateCastlingBySquare(from);
  if (their) updateCastlingBySquare(to);

  // Set ep square
  st.epSquare = null;
  if (move.epSet != null) st.epSquare = move.epSet;

  // Turn and fullmove
  st.turn = st.turn === 'w' ? 'b' : 'w';
  if (st.turn === 'w') st.fullmove += 1;

  // Save history (for GUI/undo, not used in tests here)
  st.history.push(move);

  return st;
}

export function legalMoves(st) {
  const color = st.turn;
  const pseudo = genPseudoMoves(st, color);
  // Deterministic ordering to ensure AI determinism
  pseudo.sort((a, b) => {
    const ak = `${a.from.toString().padStart(2,'0')}-${a.to.toString().padStart(2,'0')}-${a.promotion || ''}-${a.capture?1:0}-${a.castle||''}-${a.enPassant?1:0}`;
    const bk = `${b.from.toString().padStart(2,'0')}-${b.to.toString().padStart(2,'0')}-${b.promotion || ''}-${b.capture?1:0}-${b.castle||''}-${b.enPassant?1:0}`;
    return ak < bk ? -1 : ak > bk ? 1 : 0;
  });
  const res = [];
  for (const m of pseudo) {
    const ns = makeMove(cloneState(st), m);
    if (!inCheck(ns, color)) res.push(m);
  }
  return res;
}

export function legalmove(st, from, to, promotion = null) {
  const f = typeof from === 'string' ? fromAlgebraic(from) : from;
  const t = typeof to === 'string' ? toAlgebraic(to) : to;
  const moves = legalMoves(st);
  for (const m of moves) {
    if (m.from === f && m.to === t) {
      if ((promotion && m.promotion && m.promotion === promotion) || (!promotion && (!m.promotion || m.promotion === 'q'))) return m;
    }
  }
  return null;
}

export function isCheckmate(st) {
  if (!inCheck(st, st.turn)) return false;
  return legalMoves(st).length === 0;
}

export function isStalemate(st) {
  if (inCheck(st, st.turn)) return false;
  return legalMoves(st).length === 0;
}

// Evaluation: material + small mobility and king safety bonuses (deterministic)
function evaluate(st) {
  let score = 0;
  let wk = -1, bk = -1;
  for (let i = 0; i < 64; i++) {
    const p = st.board[i];
    if (!p) continue;
    let val = PIECE_VALUES[p.type];
    // small positional: center control for pawns and knights/bishops
    const file = fileOf(i);
    const rank = rankOf(i);
    const center = (file >= 2 && file <= 5 && rank >= 2 && rank <= 5) ? 1 : 0;
    if (p.type === 'p') val += center * 3;
    if (p.type === 'n' || p.type === 'b') val += center * 5;
    if (p.type === 'k') { if (p.color === 'w') wk = i; else bk = i; }
    score += p.color === 'w' ? val : -val;
  }
  // mobility
  const side = st.turn;
  const lm = legalMoves(st).length; // note: calls makeMove recursively; OK for shallow eval
  score += (side === 'w' ? lm : -lm) * 1;
  // king safety: prefer castled positions (king on g or c files)
  if (wk !== -1) {
    const wf = fileOf(wk);
    if (wf === 6 || wf === 2) score += 10;
  }
  if (bk !== -1) {
    const bf = fileOf(bk);
    if (bf === 6 || bf === 2) score -= 10;
  }
  return score;
}

// Alpha-beta minimax search with deterministic move ordering
export function alphaBetaSearch(st, depth, alpha = -Infinity, beta = Infinity) {
  const res = alphaBetaMinimax(st, depth, alpha, beta, true);
  return res;
}

function alphaBetaMinimax(st, depth, alpha, beta, root = false) {
  if (depth === 0) return { score: evaluate(st), move: null };

  const moves = legalMoves(st);
  if (moves.length === 0) {
    if (inCheck(st, st.turn)) {
      const mateScore = -100000 + (3 - depth); // prefer faster mate for side to move being checkmated
      return { score: st.turn === 'w' ? mateScore : -mateScore, move: null };
    }
    return { score: 0, move: null }; // stalemate
  }

  // Heuristic deterministic ordering: captures first by MVV-LVA, then others by destination index
  moves.sort((a, b) => {
    const pa = st.board[a.from];
    const pb = st.board[b.from];
    const ca = a.capture ? PIECE_VALUES[(st.board[a.to] ? st.board[a.to].type : 'p')] - PIECE_VALUES[pa.type] : -1000;
    const cb = b.capture ? PIECE_VALUES[(st.board[b.to] ? st.board[b.to].type : 'p')] - PIECE_VALUES[pb.type] : -1000;
    if (ca !== cb) return cb - ca; // desc
    return (a.to - b.to);
  });

  let bestMove = null;
  const isMax = st.turn === 'w';
  let bestScore = isMax ? -Infinity : Infinity;

  for (const m of moves) {
    const ns = makeMove(st, m);
    const { score } = alphaBetaMinimax(ns, depth - 1, alpha, beta, false);
    if (isMax) {
      if (score > bestScore) { bestScore = score; bestMove = m; }
      alpha = Math.max(alpha, bestScore);
      if (alpha >= beta) break; // beta cutoff
    } else {
      if (score < bestScore) { bestScore = score; bestMove = m; }
      beta = Math.min(beta, bestScore);
      if (alpha >= beta) break; // alpha cutoff
    }
  }
  return { score: bestScore, move: bestMove };
}

export function aiBestMove(st, depth = 3) {
  const { move } = alphaBetaSearch(st, depth, -Infinity, Infinity);
  return move;
}

export function moveToUci(move) {
  const base = toAlgebraic(move.from) + toAlgebraic(move.to);
  return base + (move.promotion ? move.promotion : '');
}

export function applyUci(state, uci) {
  const from = fromAlgebraic(uci.slice(0, 2));
  const to = fromAlgebraic(uci.slice(2, 4));
  const promotion = uci.length > 4 ? uci[4] : null;
  const m = legalMoves(state).find(x => x.from === from && x.to === to && (x.promotion ? x.promotion === promotion : true));
  if (!m) throw new Error('Illegal move: ' + uci);
  return makeMove(state, m);
}

// Simple SAN generator for UI history (not exhaustive)
export function moveToSAN(stBefore, move) {
  const p = stBefore.board[move.from];
  const pieceChar = p.type === 'p' ? '' : p.type.toUpperCase();
  const capture = move.capture ? 'x' : '';
  const promo = move.promotion ? '=' + move.promotion.toUpperCase() : '';
  const checkOrMate = (() => {
    const after = makeMove(stBefore, move);
    if (isCheckmate(after)) return '#';
    if (inCheck(after, after.turn)) return '+';
    return '';
  })();
  if (move.castle === 'K' || (p.type === 'k' && move.from === 60 && move.to === 62)) return 'O-O' + checkOrMate;
  if (move.castle === 'Q' || (p.type === 'k' && move.from === 60 && move.to === 58)) return 'O-O-O' + checkOrMate;
  return pieceChar + (move.capture && p.type === 'p' ? toAlgebraic(move.from)[0] : '') + capture + toAlgebraic(move.to) + promo + checkOrMate;
}
