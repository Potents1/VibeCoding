import { resolveActorVsWalls } from "./collision.js";

function normalize(x, y) {
  const len = Math.hypot(x, y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: x / len, y: y / len };
}

export function computeEnemyMove(level, enemy, player, speedTilesPerSec, dtSec) {
  const dir = normalize(player.pos.x - enemy.pos.x, player.pos.y - enemy.pos.y);
  const desired = {
    x: enemy.pos.x + dir.x * speedTilesPerSec * dtSec,
    y: enemy.pos.y + dir.y * speedTilesPerSec * dtSec
  };

  // Greedy chase with wall blocking.
  return resolveActorVsWalls(level, enemy, desired);
}

