import { createInput } from './input.js';
import { createGame, stepGame } from './logic.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const TILE = 32;
const HUD_H = 80;
const input = createInput();
const state = createGame();

function fitCanvas() {
  const w = TILE * state.map.width;
  const h = TILE * state.map.height + HUD_H;
  canvas.width = w;
  canvas.height = h;
}

fitCanvas();

function drawRoundedRect(x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawTile(x, y, fill) {
  ctx.fillStyle = fill;
  ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#0b0f1f';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < state.map.height; y += 1) {
    for (let x = 0; x < state.map.width; x += 1) {
      if (state.map.walls.has(`${x},${y}`)) drawTile(x, y, '#172046');
      else drawTile(x, y, (x + y) % 2 ? '#0f1633' : '#0e1530');
    }
  }

  const goal = state.map.goal;
  ctx.fillStyle = '#6ee7ff';
  drawRoundedRect(goal.x * TILE - 12, goal.y * TILE - 12, 24, 24, 6);
  ctx.fill();

  for (const e of state.enemies) {
    ctx.fillStyle = '#ff4d6d';
    ctx.beginPath();
    ctx.arc(e.x * TILE, e.y * TILE, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#a7f3d0';
  ctx.beginPath();
  ctx.arc(state.player.x * TILE, state.player.y * TILE, 10, 0, Math.PI * 2);
  ctx.fill();

  const hudY = TILE * state.map.height;
  ctx.fillStyle = '#070a14';
  ctx.fillRect(0, hudY, canvas.width, HUD_H);

  ctx.fillStyle = '#f5f7ff';
  ctx.font = '16px Segoe UI, system-ui, sans-serif';
  ctx.fillText('Move: Arrow keys / WASD • Reset: R', 16, hudY + 30);

  ctx.fillStyle = state.status === 'won' ? '#a7f3d0' : state.status === 'lost' ? '#ff8fa3' : '#c7d2fe';
  ctx.font = '18px Segoe UI, system-ui, sans-serif';
  ctx.fillText(state.statusText, 16, hudY + 60);
}

export function updateGameState(currentState, dt) {
  const snapshot = input.snapshot();
  stepGame(currentState, snapshot, dt);
  return currentState;
}

let last = performance.now();
function loop(ts) {
  const dt = (ts - last) / 1000;
  last = ts;
  updateGameState(state, dt);
  draw();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
