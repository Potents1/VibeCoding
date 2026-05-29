import { createGame, stepGame } from '../logic.js';

export function createAppState() {
  return {
    mode: 'menu', // menu | playing | paused | won | lost
    game: createGame(),
    muted: false,
    lastStatus: null
  };
}

export function resetGame(app) {
  app.game = createGame();
  app.mode = 'playing';
  app.lastStatus = null;
}

export function startGame(app) {
  if (app.mode === 'menu') {
    app.mode = 'playing';
    app.lastStatus = null;
  }
}

export function togglePause(app) {
  if (app.mode === 'playing') app.mode = 'paused';
  else if (app.mode === 'paused') app.mode = 'playing';
}

export function stepApp(app, input, dt) {
  if (input?.resetPressed) {
    resetGame(app);
    return { transitioned: true };
  }

  if (input?.mutePressed) {
    app.muted = !app.muted;
    return { transitioned: true, muteToggled: true };
  }

  if (app.mode === 'menu') {
    if (input?.startPressed || input?.shootPressed) {
      startGame(app);
      return { transitioned: true, started: true };
    }
    return { transitioned: false };
  }

  if (input?.pausePressed) {
    togglePause(app);
    return { transitioned: true, pausedToggled: true };
  }

  if (app.mode === 'paused') {
    return { transitioned: false };
  }

  // playing/won/lost: keep underlying sim stepping only in playing
  if (app.mode === 'playing') {
    stepGame(app.game, input, dt);
    if (app.game.status === 'won') app.mode = 'won';
    if (app.game.status === 'lost') app.mode = 'lost';
  }

  return { transitioned: false };
}
