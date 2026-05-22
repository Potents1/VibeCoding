import { newGame, stepGame } from "./logic.js";
import { attachInput, createInput } from "./input.js";
import { render } from "./render.js";

const canvas = document.getElementById("game");
const statusEl = document.getElementById("status");
const restartBtn = document.getElementById("restart");
/** @type {CanvasRenderingContext2D} */
const ctx = canvas.getContext("2d");

const ui = { status: statusEl };
const input = createInput();
let game = newGame();

function restart() {
  game = newGame();
}

restartBtn.addEventListener("click", restart);
attachInput(input, window, { onRestart: restart });

let lastTime = performance.now();
let accMs = 0;
const fixedStepMs = 100; // 10 ticks/s deterministic update

function frame(now) {
  const dt = Math.min(50, now - lastTime);
  lastTime = now;
  accMs += dt;

  while (accMs >= fixedStepMs) {
    stepGame(game, input.intent);
    accMs -= fixedStepMs;
  }

  render(ctx, game, ui);
  requestAnimationFrame(frame);
}

render(ctx, game, ui);
requestAnimationFrame(frame);
