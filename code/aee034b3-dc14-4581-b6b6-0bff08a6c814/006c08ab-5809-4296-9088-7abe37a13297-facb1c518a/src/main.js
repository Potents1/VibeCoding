import { createControls } from './input/controls.js';
import { createAudio } from './audio/audio.js';
import { createAppState, resetGame, startGame, stepApp, togglePause } from './state/gameState.js';
import { renderFrame } from './render.js';
import { createHud } from './ui/hud.js';
import { createMenu } from './ui/menu.js';
import { createPause } from './ui/pause.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d', { alpha: false });

const controls = createControls();
const audio = createAudio();
const app = createAppState();

const hud = createHud();
const menu = createMenu({
  onStart: async () => {
    await audio.unlock();
    audio.play('ui');
    startGame(app);
    menu.hide();
  },
  onToggleMute: () => {
    app.muted = !app.muted;
    audio.setMuted(app.muted);
  }
});

const pause = createPause({
  onResume: () => {
    audio.play('ui');
    togglePause(app);
    pause.hide();
  },
  onRestart: () => {
    audio.play('ui');
    resetGame(app);
    pause.hide();
  },
  onToggleMute: () => {
    app.muted = !app.muted;
    audio.setMuted(app.muted);
  }
});

const uiRoot = document.getElementById('ui-root');
uiRoot.appendChild(hud.root);
uiRoot.appendChild(menu.root);
uiRoot.appendChild(pause.root);
menu.show();

function syncUi() {
  const g = app.game;
  const statusText = app.mode === 'menu' ? 'Press Start' : g.statusText;
  hud.update({ mode: app.mode, statusText, player: g.player, muted: app.muted });

  if (app.mode === 'menu') {
    if (!menu.isVisible()) menu.show();
    pause.hide();
  } else if (app.mode === 'paused') {
    menu.hide();
    if (!pause.isVisible()) pause.show();
  } else {
    menu.hide();
    pause.hide();
  }
}

let last = performance.now();
let acc = 0;
const FIXED_DT = 1 / 60;

async function tryUnlockAudioFromGesture() {
  await audio.unlock();
  audio.setMuted(app.muted);
}

// gesture unlock for iOS/Chrome autoplay policies
window.addEventListener('pointerdown', tryUnlockAudioFromGesture, { passive: true, once: true });
window.addEventListener('keydown', tryUnlockAudioFromGesture, { passive: true, once: true });

function loop(ts) {
  const frameDt = Math.min(0.1, (ts - last) / 1000);
  last = ts;
  acc += frameDt;

  const snap = controls.snapshot();
  if (snap.mutePressed) {
    app.muted = !app.muted;
    audio.setMuted(app.muted);
    audio.play('ui');
  }

  // fixed-step only when mode requires sim stepping
  for (let i = 0; i < 5 && acc >= FIXED_DT; i += 1) {
    const prevMode = app.mode;
    const prevStatus = app.game.status;

    const res = stepApp(app, snap, FIXED_DT);

    if (res.started) {
      menu.hide();
      audio.play('ui');
    }

    // audio cues when underlying status changes
    if (prevStatus !== app.game.status) {
      if (app.game.status === 'won') audio.play('win');
      if (app.game.status === 'lost') audio.play('lose');
    }

    if (prevMode !== app.mode) {
      if (app.mode === 'paused') audio.play('ui');
      if (app.mode === 'playing' && prevMode === 'paused') audio.play('ui');
    }

    // shoot cue
    if (snap.shootPressed && app.mode === 'playing') audio.play('shoot');

    acc -= FIXED_DT;
  }

  // render always
  renderFrame(ctx, canvas, app.game);
  syncUi();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
