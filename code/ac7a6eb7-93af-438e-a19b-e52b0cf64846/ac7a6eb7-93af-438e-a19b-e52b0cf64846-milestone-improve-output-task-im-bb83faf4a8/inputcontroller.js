import { isSelectKey, moveFocusSquare } from '../input.js';

export function createInputController({ engine, app, view, onStatus }) {
  const ctrl = {
    engine,
    app,
    view,
    onStatus: onStatus || (() => {})
  };

  const legalFrom = (fromSq) => {
    const legal = engine.generateLegalMoves(app.state.pos);
    return legal.filter((m) => m.from === fromSq);
  };

  const clearSelection = () => {
    app.state.selected = null;
    app.state.legalFromSelected = [];
  };

  const setMessage = (msg) => {
    app.state.message = msg;
  };

  const outcomeOver = () => engine.getGameOutcome(app.state.pos).over;

  ctrl.handleSquareAction = (sq) => {
    if (!sq) return;
    if (outcomeOver()) return;

    app.state.focusSq = sq;
    const { r, c } = engine.algebraicToRC(sq);
    const piece = app.state.pos.board[r][c];

    if (!app.state.selected) {
      if (piece && piece.c === app.state.pos.turn) {
        const moves = legalFrom(sq);
        if (moves.length === 0) {
          setMessage(engine.isInCheck(app.state.pos.board, app.state.pos.turn) ? 'Must respond to check' : 'No legal moves');
          ctrl.onStatus();
          app.render();
          return;
        }
        app.state.selected = sq;
        app.state.legalFromSelected = moves;
        ctrl.onStatus();
        app.render();
      }
      return;
    }

    const candidate = app.state.legalFromSelected.find((m) => m.to === sq);
    if (candidate) {
      const next = engine.applyMove(app.state.pos, candidate);
      if (next) app.state.pos = next;
      clearSelection();
      ctrl.onStatus();
      app.render();
      return;
    }

    if (piece && piece.c === app.state.pos.turn) {
      const moves = legalFrom(sq);
      if (moves.length === 0) {
        setMessage(engine.isInCheck(app.state.pos.board, app.state.pos.turn) ? 'Must respond to check' : 'No legal moves');
        clearSelection();
      } else {
        app.state.selected = sq;
        app.state.legalFromSelected = moves;
      }
    } else {
      clearSelection();
    }

    ctrl.onStatus();
    app.render();
  };

  ctrl.onPointerDown = (ev) => {
    if (ev.pointerType === 'mouse' && ev.button !== 0) return;
    const sq = view.squareFromClientPoint(ev.clientX, ev.clientY);
    if (!sq) return;

    // Start drag only if a friendly piece is on square.
    const { r, c } = engine.algebraicToRC(sq);
    const piece = app.state.pos.board[r][c];
    if (piece && piece.c === app.state.pos.turn) {
      app.state.drag = { active: true, from: sq, piece, client: { x: ev.offsetX, y: ev.offsetY } };
      app.state.selected = sq;
      app.state.legalFromSelected = legalFrom(sq);
      app.render();
    } else {
      ctrl.handleSquareAction(sq);
    }

    app.canvas.focus();
    app.canvas.setPointerCapture?.(ev.pointerId);
  };

  ctrl.onPointerMove = (ev) => {
    if (!app.state.drag?.active) return;
    // Use offsetX/offsetY for local coords.
    app.state.drag.client = { x: ev.offsetX, y: ev.offsetY };
    app.render();
  };

  ctrl.onPointerUp = (ev) => {
    if (!app.state.drag?.active) return;
    const from = app.state.drag.from;
    app.state.drag.active = false;
    app.state.drag.client = null;

    const to = view.squareFromClientPoint(ev.clientX, ev.clientY);
    if (!to) {
      app.render();
      return;
    }

    // If dragging but dropping same square, keep selection.
    if (to === from) {
      app.render();
      return;
    }

    ctrl.handleSquareAction(to);
  };

  ctrl.onKeyDown = (ev) => {
    const k = ev.key;
    if (k.startsWith('Arrow')) {
      ev.preventDefault();
      app.state.focusSq = moveFocusSquare(app.state.focusSq || 'e2', k);
      app.render();
      return;
    }

    if (isSelectKey(k)) {
      ev.preventDefault();
      ctrl.handleSquareAction(app.state.focusSq);
      return;
    }

    if (k === 'Escape') {
      ev.preventDefault();
      clearSelection();
      ctrl.onStatus();
      app.render();
    }
  };

  return ctrl;
}
