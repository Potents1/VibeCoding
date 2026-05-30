import { createInput } from './input.js';
import { renderFrame } from './engine/renderer.js';
import { createAppState, stepApp, resetGame, startGame } from './state/gameState.js';

const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById('game-canvas'));
const overlayMenu = document.getElementById('overlay-menu');
const overlayPaused = document.getElementById('overlay-paused');
const btnStart = document.getElementById('btn-start');
const btnMute = document.getElementById('btn-mute');
const btnResume = document.getElementById('btn-resume');
const btnRestart = document.getElementById('btn-restart');
const hudStatus = document.getElementById('hud-status');
const hudInfo = document.getElementById('hud-info');
const hudHpFill = document.getElementById('hud-hp-fill');

/** @type {CanvasRenderingContext2D} */
const ctx = canvas.getContext('2d', { alpha: false });

const input = createInput();
input.attach(window);

const app = createAppState();

function setOverlay(el, visible) {
  if (!el) return;
  el.classList.toggle('is-visible', visible);
}

function updateUi() {
  setOverlay(overlayMenu, app.mode === 'menu');
  setOverlay(overlayPaused, app.mode === 'paused');

  const g = app.game;
  const hpPct = Math.max(0, Math.min(1, g.player.hp / g.player.maxHp)) * 100;
  if (hudHpFill) hudHpFill.style.width = `${hpPct.toFixed(1)}%`;

  const status =
    app.mode === 'menu'
      ? 'Menu • Press Enter or Start'
      : app.mode === 'paused'
        ? 'Paused • Esc to resume'
        : app.mode === 'won'
          ? 'Escaped!'
          : app.mode === 'lost'
            ? 'You died.'
            : 'Playing';

  if (hudStatus) hudStatus.textContent = status;

  const info =
    app.mode === 'playing'
      ? g.statusText
      : app.mode === 'won' || app.mode === 'lost'
        ? `${g.statusText}`
        : '';
  if (hudInfo) hudInfo.textContent = info;
}

btnStart?.addEventListener('click', () => input.pressVirtual('Enter'));
btnMute?.addEventListener('click', () => input.pressVirtual('KeyM'));
btnResume?.addEventListener('click', () => input.pressVirtual('Escape'));
btnRestart?.addEventListener('click', () => input.pressVirtual('KeyR'));

let last = performance.now();

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  const inp = input.poll();
  stepApp(app, inp, dt);

  renderFrame(ctx, canvas, app.game);
  updateUi();

  requestAnimationFrame(frame);
}

// Test hook for Playwright / harnesses
window.__game = {
  getApp: () => structuredClone(app),
  reset: () => resetGame(app),
  start: () => startGame(app)
};

updateUi();
requestAnimationFrame(frame);
