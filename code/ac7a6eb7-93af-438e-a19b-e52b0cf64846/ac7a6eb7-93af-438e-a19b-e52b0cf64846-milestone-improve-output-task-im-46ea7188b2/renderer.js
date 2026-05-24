import { TILE } from "./levels.js";
import { GAME_STATUS } from "./game_state.js";

const COLORS = {
  bg: "#111629",
  wall: "#2a2f45",
  floor: "#141b33",
  goal: "#3ddc97",
  player: "#7aa2ff",
  ghost: "#ff4d7d",
  text: "#f5f7ff",
};

export function draw(ctx, state, tilePx) {
  const { grid } = state;
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  for (let y = 0; y < grid.length; y += 1) {
    for (let x = 0; x < grid[0].length; x += 1) {
      const t = grid[y][x];
      ctx.fillStyle = t === TILE.WALL ? COLORS.wall : COLORS.floor;
      ctx.fillRect(x * tilePx, y * tilePx, tilePx, tilePx);
      if (t === TILE.GOAL) {
        ctx.fillStyle = COLORS.goal;
        ctx.fillRect(x * tilePx + tilePx * 0.25, y * tilePx + tilePx * 0.25, tilePx * 0.5, tilePx * 0.5);
      }
    }
  }

  // Player
  ctx.fillStyle = COLORS.player;
  ctx.beginPath();
  ctx.arc((state.player.x + 0.5) * tilePx, (state.player.y + 0.5) * tilePx, tilePx * 0.33, 0, Math.PI * 2);
  ctx.fill();

  // Ghosts
  ctx.fillStyle = COLORS.ghost;
  for (const g of state.ghosts) {
    ctx.fillRect(g.x * tilePx + tilePx * 0.2, g.y * tilePx + tilePx * 0.2, tilePx * 0.6, tilePx * 0.6);
  }

  if (state.status !== GAME_STATUS.RUNNING) {
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = COLORS.text;
    ctx.font = "bold 28px system-ui, Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const msg = state.status === GAME_STATUS.WON ? "YOU WIN" : "YOU LOSE";
    ctx.fillText(msg, ctx.canvas.width / 2, ctx.canvas.height / 2 - 10);
    ctx.font = "14px system-ui, Segoe UI, sans-serif";
    ctx.fillText("Press R to restart", ctx.canvas.width / 2, ctx.canvas.height / 2 + 20);
  }
}

export function statusText(state) {
  if (state.status === GAME_STATUS.WON) return "Won — press R to restart";
  if (state.status === GAME_STATUS.LOST) return "Lost — press R to restart";
  return "Reach the green goal. Avoid the ghost.";
}

