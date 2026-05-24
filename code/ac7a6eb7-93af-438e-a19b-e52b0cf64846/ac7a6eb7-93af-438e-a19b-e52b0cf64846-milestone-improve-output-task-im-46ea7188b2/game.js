import { createGame, stepGame, resetGame } from './grid_engine.js';
import { createKeyboardInput } from './input.js';

function el(tag, attrs = {}) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'text') node.textContent = String(v);
    else node.setAttribute(k, String(v));
  }
  return node;
}

function fitCanvas(canvas, cssSize) {
  const px = Math.floor(cssSize * devicePixelRatio);
  if (canvas.width !== px || canvas.height !== px) {
    canvas.style.width = `${cssSize}px`;
    canvas.style.height = `${cssSize}px`;
    canvas.width = px;
    canvas.height = px;
  }
}

function render(game, ctx, cssSize) {
  fitCanvas(ctx.canvas, cssSize);
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  ctx.clearRect(0, 0, cssSize, cssSize);

  const { world, player, enemy, goal, status } = game;
  const tile = Math.floor(cssSize / world.w);
  const offsetX = Math.floor((cssSize - tile * world.w) / 2);
  const offsetY = Math.floor((cssSize - tile * world.h) / 2);

  ctx.fillStyle = '#0b1220';
  ctx.fillRect(0, 0, cssSize, cssSize);

  for (let y = 0; y < world.h; y++) {
    for (let x = 0; x < world.w; x++) {
      const isWall = world.tiles[y][x] === 1;
      ctx.fillStyle = isWall ? '#111a2e' : '#0f1a33';
      ctx.fillRect(offsetX + x * tile, offsetY + y * tile, tile - 1, tile - 1);
    }
  }

  ctx.fillStyle = '#16a34a';
  ctx.fillRect(offsetX + goal.x * tile + 2, offsetY + goal.y * tile + 2, tile - 4, tile - 4);

  ctx.fillStyle = '#eab308';
  ctx.fillRect(offsetX + player.x * tile + 2, offsetY + player.y * tile + 2, tile - 4, tile - 4);

  ctx.fillStyle = '#ef4444';
  ctx.fillRect(offsetX + enemy.x * tile + 2, offsetY + enemy.y * tile + 2, tile - 4, tile - 4);

  if (status !== 'playing') {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, cssSize, cssSize);
    ctx.fillStyle = '#e5e7eb';
    ctx.font = 'bold 22px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(status === 'won' ? 'You win' : 'You lose', cssSize / 2, cssSize / 2 - 12);
    ctx.font = '14px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial';
    ctx.fillText('Press R to restart', cssSize / 2, cssSize / 2 + 16);
  }
}

function main() {
  const root = document.getElementById('app');
  const title = el('h1', { text: 'Grid Runner' });
  const help = el('p', { class: 'help', text: 'Move with arrow keys / WASD. Reach green tile. Avoid red tile.' });
  const row = el('div', { class: 'row' });
  const left = el('div', { class: 'left' });
  const right = el('div', { class: 'right' });
  const statusEl = el('div', { id: 'status', role: 'status', 'aria-live': 'polite' });
  const resetBtn = el('button', { type: 'button', id: 'reset', text: 'Restart (R)' });
  const canvas = el('canvas', { id: 'board', tabIndex: '0', role: 'application', 'aria-label': 'Grid Runner board' });
  const ctx = canvas.getContext('2d', { alpha: false });

  left.appendChild(canvas);
  right.appendChild(statusEl);
  right.appendChild(resetBtn);
  row.appendChild(left);
  row.appendChild(right);
  root.appendChild(title);
  root.appendChild(help);
  root.appendChild(row);

  const input = createKeyboardInput(window);
  const game = createGame({ seed: 123 });

  const updateStatus = () => {
    statusEl.textContent = game.status === 'playing' ? 'Playing' : game.status === 'won' ? 'Won' : 'Lost';
  };

  resetBtn.addEventListener('click', () => {
    resetGame(game);
    updateStatus();
  });

  let last = performance.now();
  const tick = (now) => {
    const dtMs = Math.min(80, Math.max(0, now - last));
    last = now;

    if (input.consumeRestart()) resetGame(game);
    stepGame(game, dtMs, input.snapshot());
    updateStatus();

    const size = Math.max(320, Math.min(720, Math.min(window.innerWidth, window.innerHeight) - 96));
    render(game, ctx, size);
    requestAnimationFrame(tick);
  };

  updateStatus();
  requestAnimationFrame(tick);
  canvas.focus({ preventScroll: true });
}

main();
