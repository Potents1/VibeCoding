export const PIECES = {
  K: "♔",
  Q: "♕",
  R: "♖",
  B: "♗",
  N: "♘",
  P: "♙",
  k: "♚",
  q: "♛",
  r: "♜",
  b: "♝",
  n: "♞",
  p: "♟"
};

const START = [
  "rnbqkbnr",
  "pppppppp",
  "........",
  "........",
  "........",
  "........",
  "PPPPPPPP",
  "RNBQKBNR"
];

const VALUES = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
const FILES = "abcdefgh";

function cloneBoard(board) {
  return board.map((row) => [...row]);
}

function inBounds(r, c) {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

function colorOf(piece) {
  if (!piece || piece === ".") return null;
  return piece === piece.toUpperCase() ? "white" : "black";
}

function opposite(color) {
  return color === "white" ? "black" : "white";
}

function squareName(r, c) {
  return `${FILES[c]}${8 - r}`;
}

function parseSquare(square) {
  return { r: 8 - Number(square[1]), c: FILES.indexOf(square[0]) };
}

function pathClear(board, from, to) {
  const dr = Math.sign(to.r - from.r);
  const dc = Math.sign(to.c - from.c);
  let r = from.r + dr;
  let c = from.c + dc;
  while (r !== to.r || c !== to.c) {
    if (board[r][c] !== ".") return false;
    r += dr;
    c += dc;
  }
  return true;
}

export class ChessGame {
  constructor() {
    this.reset();
  }

  reset() {
    this.board = START.map((row) => [...row]);
    this.turn = "white";
    this.castling = { K: true, Q: true, k: true, q: true };
    this.enPassant = null;
    this.halfmove = 0;
    this.fullmove = 1;
    this.history = [];
    this.result = null;
    return this;
  }

  pieceAt(square) {
    const { r, c } = parseSquare(square);
    return inBounds(r, c) ? this.board[r][c] : ".";
  }

  legalMovesFrom(square) {
    const from = parseSquare(square);
    if (!inBounds(from.r, from.c)) return [];
    const piece = this.board[from.r][from.c];
    if (colorOf(piece) !== this.turn || this.result) return [];
    return this.pseudoMovesFor(from)
      .filter((move) => !this.wouldLeaveKingInCheck(move, this.turn))
      .map((move) => ({ ...move, from: squareName(move.from.r, move.from.c), to: squareName(move.to.r, move.to.c) }));
  }

  allLegalMoves(color = this.turn) {
    const oldTurn = this.turn;
    this.turn = color;
    const moves = [];
    for (let r = 0; r < 8; r += 1) {
      for (let c = 0; c < 8; c += 1) {
        if (colorOf(this.board[r][c]) === color) {
          moves.push(...this.legalMovesFrom(squareName(r, c)));
        }
      }
    }
    this.turn = oldTurn;
    return moves;
  }

  move(fromSquare, toSquare, promotion = "q") {
    const legal = this.legalMovesFrom(fromSquare).find((move) => move.to === toSquare);
    if (!legal) return { ok: false, reason: "Illegal move" };
    const move = { ...legal, promotion };
    this.applyMove(move);
    this.updateResult();
    return { ok: true, move, result: this.result };
  }

  applyMove(move) {
    const from = typeof move.from === "string" ? parseSquare(move.from) : move.from;
    const to = typeof move.to === "string" ? parseSquare(move.to) : move.to;
    const piece = this.board[from.r][from.c];
    let captured = this.board[to.r][to.c];
    this.board[from.r][from.c] = ".";

    if (move.enPassant) {
      const capRow = colorOf(piece) === "white" ? to.r + 1 : to.r - 1;
      captured = this.board[capRow][to.c];
      this.board[capRow][to.c] = ".";
    }

    const promoteRank = colorOf(piece) === "white" ? 0 : 7;
    const nextPiece = piece.toLowerCase() === "p" && to.r === promoteRank
      ? (colorOf(piece) === "white" ? move.promotion.toUpperCase() : move.promotion.toLowerCase())
      : piece;
    this.board[to.r][to.c] = nextPiece;

    if (move.castle) {
      const row = from.r;
      if (to.c === 6) {
        this.board[row][5] = this.board[row][7];
        this.board[row][7] = ".";
      } else {
        this.board[row][3] = this.board[row][0];
        this.board[row][0] = ".";
      }
    }

    this.updateCastlingRights(piece, from, to, captured);
    this.enPassant = null;
    if (piece.toLowerCase() === "p" && Math.abs(to.r - from.r) === 2) {
      this.enPassant = squareName((to.r + from.r) / 2, from.c);
    }
    this.halfmove = piece.toLowerCase() === "p" || captured !== "." ? 0 : this.halfmove + 1;
    if (this.turn === "black") this.fullmove += 1;
    const notation = `${piece}${squareName(from.r, from.c)}-${squareName(to.r, to.c)}${captured !== "." ? "x" : ""}`;
    this.history.push({ piece, from: squareName(from.r, from.c), to: squareName(to.r, to.c), captured, notation });
    this.turn = opposite(this.turn);
  }

  updateCastlingRights(piece, from, to, captured) {
    if (piece === "K") this.castling.K = this.castling.Q = false;
    if (piece === "k") this.castling.k = this.castling.q = false;
    if (piece === "R" && from.r === 7 && from.c === 0) this.castling.Q = false;
    if (piece === "R" && from.r === 7 && from.c === 7) this.castling.K = false;
    if (piece === "r" && from.r === 0 && from.c === 0) this.castling.q = false;
    if (piece === "r" && from.r === 0 && from.c === 7) this.castling.k = false;
    if (captured === "R" && to.r === 7 && to.c === 0) this.castling.Q = false;
    if (captured === "R" && to.r === 7 && to.c === 7) this.castling.K = false;
    if (captured === "r" && to.r === 0 && to.c === 0) this.castling.q = false;
    if (captured === "r" && to.r === 0 && to.c === 7) this.castling.k = false;
  }

  updateResult() {
    const moves = this.allLegalMoves(this.turn);
    const checked = this.isInCheck(this.turn);
    if (moves.length === 0 && checked) {
      this.result = { type: "checkmate", winner: opposite(this.turn) };
    } else if (moves.length === 0) {
      this.result = { type: "stalemate", winner: null };
    } else if (this.halfmove >= 100) {
      this.result = { type: "draw", winner: null };
    } else {
      this.result = null;
    }
  }

  isInCheck(color) {
    const king = color === "white" ? "K" : "k";
    let kr = -1;
    let kc = -1;
    for (let r = 0; r < 8; r += 1) {
      for (let c = 0; c < 8; c += 1) {
        if (this.board[r][c] === king) {
          kr = r;
          kc = c;
        }
      }
    }
    return this.isSquareAttacked(kr, kc, opposite(color));
  }

  isSquareAttacked(r, c, byColor) {
    for (let sr = 0; sr < 8; sr += 1) {
      for (let sc = 0; sc < 8; sc += 1) {
        if (colorOf(this.board[sr][sc]) !== byColor) continue;
        if (this.attacksSquare({ r: sr, c: sc }, { r, c })) return true;
      }
    }
    return false;
  }

  attacksSquare(from, to) {
    const piece = this.board[from.r][from.c];
    const type = piece.toLowerCase();
    const color = colorOf(piece);
    const dr = to.r - from.r;
    const dc = to.c - from.c;
    if (type === "p") {
      const dir = color === "white" ? -1 : 1;
      return dr === dir && Math.abs(dc) === 1;
    }
    if (type === "n") return (Math.abs(dr) === 2 && Math.abs(dc) === 1) || (Math.abs(dr) === 1 && Math.abs(dc) === 2);
    if (type === "k") return Math.max(Math.abs(dr), Math.abs(dc)) === 1;
    if (type === "b") return Math.abs(dr) === Math.abs(dc) && pathClear(this.board, from, to);
    if (type === "r") return (dr === 0 || dc === 0) && pathClear(this.board, from, to);
    if (type === "q") return (Math.abs(dr) === Math.abs(dc) || dr === 0 || dc === 0) && pathClear(this.board, from, to);
    return false;
  }

  pseudoMovesFor(from) {
    const piece = this.board[from.r][from.c];
    const type = piece.toLowerCase();
    if (type === "p") return this.pawnMoves(from, piece);
    if (type === "n") return this.stepMoves(from, [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]]);
    if (type === "b") return this.slideMoves(from, [[-1, -1], [-1, 1], [1, -1], [1, 1]]);
    if (type === "r") return this.slideMoves(from, [[-1, 0], [1, 0], [0, -1], [0, 1]]);
    if (type === "q") return this.slideMoves(from, [[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]]);
    if (type === "k") return [...this.stepMoves(from, [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]), ...this.castleMoves(from, piece)];
    return [];
  }

  pawnMoves(from, piece) {
    const color = colorOf(piece);
    const dir = color === "white" ? -1 : 1;
    const start = color === "white" ? 6 : 1;
    const moves = [];
    const one = { r: from.r + dir, c: from.c };
    if (inBounds(one.r, one.c) && this.board[one.r][one.c] === ".") {
      moves.push({ from, to: one });
      const two = { r: from.r + dir * 2, c: from.c };
      if (from.r === start && this.board[two.r][two.c] === ".") moves.push({ from, to: two });
    }
    for (const dc of [-1, 1]) {
      const to = { r: from.r + dir, c: from.c + dc };
      if (!inBounds(to.r, to.c)) continue;
      const target = this.board[to.r][to.c];
      if (target !== "." && colorOf(target) !== color) moves.push({ from, to });
      if (this.enPassant === squareName(to.r, to.c)) moves.push({ from, to, enPassant: true });
    }
    return moves;
  }

  stepMoves(from, deltas) {
    const color = colorOf(this.board[from.r][from.c]);
    return deltas
      .map(([dr, dc]) => ({ r: from.r + dr, c: from.c + dc }))
      .filter((to) => inBounds(to.r, to.c) && colorOf(this.board[to.r][to.c]) !== color)
      .map((to) => ({ from, to }));
  }

  slideMoves(from, deltas) {
    const color = colorOf(this.board[from.r][from.c]);
    const moves = [];
    for (const [dr, dc] of deltas) {
      let r = from.r + dr;
      let c = from.c + dc;
      while (inBounds(r, c)) {
        const target = this.board[r][c];
        if (colorOf(target) === color) break;
        moves.push({ from, to: { r, c } });
        if (target !== ".") break;
        r += dr;
        c += dc;
      }
    }
    return moves;
  }

  castleMoves(from, piece) {
    const color = colorOf(piece);
    const row = color === "white" ? 7 : 0;
    if (from.r !== row || from.c !== 4 || this.isInCheck(color)) return [];
    const moves = [];
    const kingSide = color === "white" ? "K" : "k";
    const queenSide = color === "white" ? "Q" : "q";
    if (this.castling[kingSide] && this.board[row][5] === "." && this.board[row][6] === "." &&
      !this.isSquareAttacked(row, 5, opposite(color)) && !this.isSquareAttacked(row, 6, opposite(color))) {
      moves.push({ from, to: { r: row, c: 6 }, castle: true });
    }
    if (this.castling[queenSide] && this.board[row][3] === "." && this.board[row][2] === "." && this.board[row][1] === "." &&
      !this.isSquareAttacked(row, 3, opposite(color)) && !this.isSquareAttacked(row, 2, opposite(color))) {
      moves.push({ from, to: { r: row, c: 2 }, castle: true });
    }
    return moves;
  }

  wouldLeaveKingInCheck(move, color) {
    const snapshot = {
      board: cloneBoard(this.board),
      castling: { ...this.castling },
      enPassant: this.enPassant,
      turn: this.turn,
      halfmove: this.halfmove,
      fullmove: this.fullmove,
      historyLength: this.history.length
    };
    this.applyMove({ ...move, promotion: "q" });
    const checked = this.isInCheck(color);
    this.board = snapshot.board;
    this.castling = snapshot.castling;
    this.enPassant = snapshot.enPassant;
    this.turn = snapshot.turn;
    this.halfmove = snapshot.halfmove;
    this.fullmove = snapshot.fullmove;
    this.history.length = snapshot.historyLength;
    return checked;
  }

  loadPosition(rows, turn = "white", castling = { K: false, Q: false, k: false, q: false }, enPassant = null) {
    this.board = rows.map((row) => [...row]);
    this.turn = turn;
    this.castling = { ...castling };
    this.enPassant = enPassant;
    this.history = [];
    this.result = null;
    this.updateResult();
  }
}

export function chooseAiMove(game, color = game.turn) {
  const moves = game.allLegalMoves(color);
  if (moves.length === 0) return null;
  return moves
    .map((move) => {
      const target = game.board[parseSquare(move.to).r][parseSquare(move.to).c];
      const mover = game.board[parseSquare(move.from).r][parseSquare(move.from).c];
      const captureScore = target === "." ? 0 : VALUES[target.toLowerCase()] * 10 - VALUES[mover.toLowerCase()];
      const centerScore = 14 - Math.abs(3.5 - parseSquare(move.to).r) - Math.abs(3.5 - parseSquare(move.to).c);
      const promoteScore = mover.toLowerCase() === "p" && (move.to.endsWith("8") || move.to.endsWith("1")) ? 850 : 0;
      return { move, score: captureScore + centerScore + promoteScore };
    })
    .sort((a, b) => b.score - a.score || `${a.move.from}${a.move.to}`.localeCompare(`${b.move.from}${b.move.to}`))[0].move;
}

export function createChessApp(root = document) {
  const game = new ChessGame();
  const boardEl = root.getElementById("board");
  const statusEl = root.getElementById("status");
  const movesEl = root.getElementById("moves");
  const capturedEl = root.getElementById("captured");
  const aiToggle = root.getElementById("aiToggle");
  let selected = null;
  let legalTargets = [];

  function statusText() {
    if (game.result?.type === "checkmate") return `Checkmate. ${game.result.winner === "white" ? "White" : "Black"} wins.`;
    if (game.result?.type === "stalemate") return "Stalemate. Draw.";
    const side = game.turn === "white" ? "White" : "Black";
    return `${side} to move${game.isInCheck(game.turn) ? " - check" : ""}`;
  }

  function render() {
    boardEl.innerHTML = "";
    const legalSet = new Set(legalTargets.map((move) => move.to));
    for (let r = 0; r < 8; r += 1) {
      for (let c = 0; c < 8; c += 1) {
        const square = squareName(r, c);
        const piece = game.board[r][c];
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = `square ${(r + c) % 2 ? "dark" : "light"}`;
        cell.dataset.square = square;
        cell.setAttribute("role", "gridcell");
        cell.setAttribute("aria-label", `${square}${piece === "." ? "" : ` ${colorOf(piece)} ${piece}`}`);
        if (selected === square) cell.classList.add("selected");
        if (legalSet.has(square)) {
          cell.classList.add(piece === "." ? "legal" : "capture");
        }
        if (piece !== ".") {
          const span = document.createElement("span");
          span.className = `piece ${colorOf(piece)}`;
          span.textContent = PIECES[piece];
          cell.append(span);
        }
        const coord = document.createElement("span");
        coord.className = "coord";
        coord.textContent = square;
        cell.append(coord);
        boardEl.append(cell);
      }
    }
    statusEl.textContent = statusText();
    movesEl.innerHTML = game.history.map((entry) => `<li>${entry.notation}</li>`).join("");
    capturedEl.textContent = game.history.filter((entry) => entry.captured !== ".").map((entry) => PIECES[entry.captured]).join(" ");
  }

  function maybeAi() {
    if (!aiToggle.checked || game.turn !== "black" || game.result) return;
    const move = chooseAiMove(game, "black");
    if (move) {
      window.setTimeout(() => {
        game.move(move.from, move.to);
        selected = null;
        legalTargets = [];
        render();
      }, 180);
    }
  }

  boardEl.addEventListener("click", (event) => {
    const cell = event.target.closest(".square");
    if (!cell || game.result || (aiToggle.checked && game.turn === "black")) return;
    const square = cell.dataset.square;
    if (selected && legalTargets.some((move) => move.to === square)) {
      game.move(selected, square);
      selected = null;
      legalTargets = [];
      render();
      maybeAi();
      return;
    }
    if (colorOf(game.pieceAt(square)) === game.turn) {
      selected = square;
      legalTargets = game.legalMovesFrom(square);
    } else {
      selected = null;
      legalTargets = [];
    }
    render();
  });

  root.getElementById("newGame").addEventListener("click", () => {
    game.reset();
    selected = null;
    legalTargets = [];
    render();
  });

  render();
  return { game, render };
}

if (typeof document !== "undefined") {
  createChessApp(document);
}
