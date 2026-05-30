import { test, assert } from './_harness.mjs';
import { createGame, stepGame } from '../src/logic.js';
import { renderFrame } from '../src/engine/renderer.js';

function createStubCanvas(w, h) {
  return { width: w, height: h };
}

function createStubCtx() {
  const calls = [];
  const ctx = {
    fillStyle: '#000',
    strokeStyle: '#000',
    font: '',
    globalAlpha: 1,
    beginPath() { calls.push(['beginPath']); },
    moveTo(x, y) { calls.push(['moveTo', x, y]); },
    lineTo(x, y) { calls.push(['lineTo', x, y]); },
    arc(x, y, r) { calls.push(['arc', x, y, r]); },
    fillRect(x, y, w, h) { calls.push(['fillRect', x, y, w, h]); },
    strokeRect(x, y, w, h) { calls.push(['strokeRect', x, y, w, h]); },
    fill() { calls.push(['fill']); },
    stroke() { calls.push(['stroke']); },
    save() { calls.push(['save']); },
    restore() { calls.push(['restore']); },
    fillText(t, x, y) { calls.push(['fillText', String(t), x, y]); }
  };
  return { ctx, calls };
}

test('renderFrame produces non-empty drawing calls and is stable for a few frames', () => {
  const s = createGame();
  const canvas = createStubCanvas(320, 240);
  const { ctx, calls } = createStubCtx();

  for (let i = 0; i < 5; i += 1) {
    stepGame(s, { forward: i % 2 === 0, turnRight: true }, 1 / 60);
    renderFrame(ctx, canvas, s);
  }

  const fillRects = calls.filter((c) => c[0] === 'fillRect').length;
  assert.ok(fillRects > 200, `expected lots of fillRect calls, got ${fillRects}`);
});
