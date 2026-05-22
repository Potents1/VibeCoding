import { GAME, TILE, WORLD } from "./constants.js";
import { createGameState, resetGameState } from "./state.js";
import { createInput, inputFromKeyEvent } from "./input.js";
import { stepGame } from "./update.js";
import { render } from "./render.js";

const canvas = document.getElementById("game");
const statusEl = document.getElementById("status");
const ctx = canvas.getContext("2d");

canvas.width = WORLD.cols * TILE;
canvas.height = WORLD.rows * TILE;

const state = createGameState();
const input = createInput();

function updateStatus() {
  if (!statusEl) return;
  if (state.outcome === "playing") statusEl.textContent = "";
  if (state.outcome === "won") statusEl.textContent = "You win! Press R to reset.";
  if (state.outcome === "lost") statusEl.textContent = "You lose! Press R to reset.";
}

window.addEventListener("keydown", (ev) => {
  inputFromKeyEvent(input, ev, true);
  if (input.reset) {
    resetGameState(state);
    input.reset = false;
  }
});

window.addEventListener("keyup", (ev) => {
  inputFromKeyEvent(input, ev, false);
});

let last = performance.now();
let acc = 0;

function frame(now) {
  const delta = now - last;
  last = now;
  acc += Math.min(250, delta);

  while (acc >= GAME.fixedDtMs) {
    stepGame(state, input, GAME.fixedDtMs);
    acc -= GAME.fixedDtMs;
  }

  render(ctx, state);
  updateStatus();
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);

