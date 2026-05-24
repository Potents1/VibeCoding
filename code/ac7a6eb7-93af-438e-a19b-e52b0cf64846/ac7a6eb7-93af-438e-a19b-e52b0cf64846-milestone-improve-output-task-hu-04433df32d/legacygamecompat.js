import { createEngine } from './engine/chessEngine.js';
import { createInputController } from './ui/inputController.js';

export function createAppForTest() {
  const engine = createEngine();
  const app = {
    engine,
    canvas: { focus() {}, setPointerCapture() {} },
    ctx: { setTransform() {}, clearRect() {}, fillRect() {}, strokeRect() {}, fillText() {} },
    statusEl: { textContent: '' },
    state: {
      pos: engine.createInitialPosition(),
      selected: null,
      legalFromSelected: [],
      message: '',
      focusSq: 'e2',
      drag: { active: false, from: null, piece: null, client: null }
    },
    render() {}
  };

  const view = { squareFromClientPoint: () => null };
  app._ctrl = createInputController({ engine, app, view, onStatus: () => {} });
  return app;
}

export function handleSquareAction(app, sq) {
  if (!app?._ctrl) app._ctrl = createInputController({ engine: app.engine, app, view: { squareFromClientPoint: () => null }, onStatus: () => {} });
  app._ctrl.handleSquareAction(sq);
}
