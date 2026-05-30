import {
  createGame,
  queueInput,
  stepGame,
  resetGame,
  togglePause,
  INPUT,
  GAME_STATUS
} from "./game.js";
import { render } from "./render.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const statusEl = document.getElementById("status");
const restartBtn = document.getElementById("restart");
const pauseBtn = document.getElementById("pause");

let state = createGame({ seed: 1337 });
let rafId = null;
let lastTime = performance.now();
let accumulatorMs = 0;
const stepMs = 1000 / 12; // 12 ticks/sec deterministic-ish

function updateStatus() {
  const base = `Tick ${state.tick}`;
  let suffix = "";
  if (state.status === GAME_STATUS.won) suffix = " — Won";
  else if (state.status === GAME_STATUS.lost) suffix = " — Lost";
  else if (state.status === GAME_STATUS.paused) suffix = " — Paused";
  statusEl.textContent = base + suffix;
}

function loop(now) {
  const dt = Math.min(50, now - lastTime);
  lastTime = now;
  accumulatorMs += dt;

  while (accumulatorMs >= stepMs) {
    stepGame(state);
    accumulatorMs -= stepMs;
  }

  render(ctx, state, { tileSize: 32 });
  updateStatus();

  rafId = requestAnimationFrame(loop);
}

function normalizeKey(e) {
  const k = e.key;
  if (k === "ArrowUp" || k === "w" || k === "W") return INPUT.up;
  if (k === "ArrowDown" || k === "s" || k === "S") return INPUT.down;
  if (k === "ArrowLeft" || k === "a" || k === "A") return INPUT.left;
  if (k === "ArrowRight" || k === "d" || k === "D") return INPUT.right;
  return null;
}

window.addEventListener("keydown", (e) => {
  if (e.key === "r" || e.key === "R") {
    resetGame(state);
    return;
  }
  if (e.key === "p" || e.key === "P") {
    togglePause(state);
    return;
  }

  const input = normalizeKey(e);
  if (!input) return;
  if (state.status !== GAME_STATUS.playing) return;

  e.preventDefault();
  queueInput(state, input);
});

restartBtn.addEventListener("click", () => resetGame(state));

pauseBtn.addEventListener("click", () => {
  togglePause(state);
  pauseBtn.textContent = state.status === GAME_STATUS.paused ? "Resume" : "Pause";
});

function start() {
  if (rafId) cancelAnimationFrame(rafId);
  lastTime = performance.now();
  accumulatorMs = 0;
  updateStatus();
  render(ctx, state, { tileSize: 32 });
  rafId = requestAnimationFrame(loop);
}

start();
