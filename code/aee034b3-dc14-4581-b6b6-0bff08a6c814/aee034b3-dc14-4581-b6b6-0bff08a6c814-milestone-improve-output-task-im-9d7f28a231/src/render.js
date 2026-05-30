import { GAME_STATUS } from "./game.js";

export function render(ctx, state, { tileSize = 32 } = {}) {
  const { level, player, enemies } = state;

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Background grid
  ctx.fillStyle = "#0f1620";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Tiles
  for (let y = 0; y < level.height; y++) {
    for (let x = 0; x < level.width; x++) {
      const px = x * tileSize;
      const py = y * tileSize;

      // subtle grid lines
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.strokeRect(px + 0.5, py + 0.5, tileSize, tileSize);
    }
  }

  // Walls
  ctx.fillStyle = "#223044";
  for (const key of level.walls) {
    const [xStr, yStr] = key.split(",");
    const x = Number(xStr);
    const y = Number(yStr);
    ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
  }

  // Goal
  ctx.fillStyle = "#1f9d55";
  ctx.fillRect(level.goal.x * tileSize, level.goal.y * tileSize, tileSize, tileSize);

  // Enemies
  ctx.fillStyle = "#e23d3d";
  for (const e of enemies) {
    ctx.beginPath();
    ctx.arc(e.x * tileSize + tileSize / 2, e.y * tileSize + tileSize / 2, tileSize * 0.36, 0, Math.PI * 2);
    ctx.fill();
  }

  // Player
  ctx.fillStyle = "#4aa3ff";
  ctx.beginPath();
  ctx.arc(player.x * tileSize + tileSize / 2, player.y * tileSize + tileSize / 2, tileSize * 0.36, 0, Math.PI * 2);
  ctx.fill();

  // Overlay status
  if (state.status !== GAME_STATUS.playing) {
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.fillStyle = "#e6edf3";
    ctx.font = "700 28px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const msg =
      state.status === GAME_STATUS.won
        ? "You Win!"
        : state.status === GAME_STATUS.lost
          ? "You Lose"
          : "Paused";

    ctx.fillText(msg, ctx.canvas.width / 2, ctx.canvas.height / 2);

    ctx.font = "500 14px system-ui";
    ctx.fillStyle = "#a7b6c6";
    ctx.fillText("Press R to restart", ctx.canvas.width / 2, ctx.canvas.height / 2 + 34);
  }
}
