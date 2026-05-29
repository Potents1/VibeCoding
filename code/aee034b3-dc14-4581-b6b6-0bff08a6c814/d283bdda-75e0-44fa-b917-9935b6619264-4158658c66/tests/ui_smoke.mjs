import assert from 'node:assert/strict';
import { createAppState, stepApp, startGame, togglePause } from '../src/state/gameState.js';

{
  const app = createAppState();
  assert.equal(app.mode, 'menu');
  stepApp(app, { startPressed: true }, 1 / 60);
  assert.equal(app.mode, 'playing');
}

{
  const app = createAppState();
  startGame(app);
  togglePause(app);
  assert.equal(app.mode, 'paused');
  // pause should prevent sim stepping; player shouldn't move
  const x0 = app.game.player.x;
  stepApp(app, { forward: true }, 1 / 60);
  assert.equal(app.game.player.x, x0);
}

console.log('UI_SMOKE_OK');
