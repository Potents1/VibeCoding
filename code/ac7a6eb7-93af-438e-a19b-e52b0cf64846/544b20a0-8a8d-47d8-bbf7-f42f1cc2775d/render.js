import { COLORS, TILE, WORLD } from "./constants.js";

function clear(ctx, w, h) {
  ctx.clearRect(0, 0, w, h);
}

function drawGrid(ctx, level) {
  for (let y = 0; y < WORLD.rows; y += 1) {
    for (let x = 0; x < WORLD.cols; x += 1) {
      if (level.grid[y][x] === 1) {
        ctx.fillStyle = COLORS.wall;
        ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
      }
    }
  }
}

function drawGoal(ctx, level) {
  ctx.fillStyle = COLORS.goal;
  ctx.fillRect(level.goal.x * TILE + 4, level.goal.y * TILE + 4, TILE - 8, TILE - 8);
}

function drawActor(ctx, actor, color) {
  ctx.fillStyle = color;
  ctx.fillRect(
    (actor.pos.x - actor.size.w / 2) * TILE,
    (actor.pos.y - actor.size.h / 2) * TILE,
    actor.size.w * TILE,
    actor.size.h * TILE
  );
}

export function render(ctx, state) {
  const w = WORLD.cols * TILE;
  const h = WORLD.rows * TILE;

  clear(ctx, w, h);
  drawGrid(ctx, state.level);
  drawGoal(ctx, state.level);
  drawActor(ctx, state.player, COLORS.player);
  drawActor(ctx, state.enemy, COLORS.enemy);
}

