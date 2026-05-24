import { Tile, tileAt } from "./logic.js";

export function render(ctx, game, ui) {
  const { width, height } = ctx.canvas;
  ctx.clearRect(0, 0, width, height);

  const pad = 28;
  const gridW = game.level.w;
  const gridH = game.level.h;
  const tileSize = Math.floor(
    Math.min((width - pad * 2) / gridW, (height - pad * 2) / gridH)
  );
  const ox = Math.floor((width - gridW * tileSize) / 2);
  const oy = Math.floor((height - gridH * tileSize) / 2);

  ctx.fillStyle = "#0b1020";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  ctx.fillRect(ox - 10, oy - 10, gridW * tileSize + 20, gridH * tileSize + 20);

  for (let y = 0; y < gridH; y++) {
    for (let x = 0; x < gridW; x++) {
      const t = tileAt(game.level, x, y);
      if (t === Tile.Wall) {
        drawTile(ctx, ox, oy, tileSize, x, y, "#223055");
      } else if (t === Tile.Goal) {
        drawTile(ctx, ox, oy, tileSize, x, y, "#1d8f5a");
      } else {
        drawTile(ctx, ox, oy, tileSize, x, y, "rgba(255,255,255,0.04)");
      }
    }
  }

  drawDisc(ctx, ox, oy, tileSize, game.enemy.x, game.enemy.y, "#e4546d");
  drawDisc(ctx, ox, oy, tileSize, game.player.x, game.player.y, "#7cc7ff");

  ui.status.textContent =
    game.status === "playing"
      ? "Playing"
      : game.status === "won"
        ? "Won — press R to restart"
        : "Lost — press R to restart";
}

function drawTile(ctx, ox, oy, s, x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(ox + x * s + 1, oy + y * s + 1, s - 2, s - 2);
}

function drawDisc(ctx, ox, oy, s, x, y, color) {
  const cx = ox + x * s + s / 2;
  const cy = oy + y * s + s / 2;
  ctx.beginPath();
  ctx.arc(cx, cy, s * 0.32, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.stroke();
}
