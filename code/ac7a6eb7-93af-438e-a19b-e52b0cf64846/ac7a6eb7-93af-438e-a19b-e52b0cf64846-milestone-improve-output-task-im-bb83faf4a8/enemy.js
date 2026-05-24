import { isBlocked } from "./logic.js";

/**
 * Compute next enemy position for legacy update loop code.
 * This keeps the bundle runnable even if non-chess modules are imported by tests.
 * Deterministic greedy chase with basic wall avoidance.
 */
export function computeEnemyMove(level, enemy, player, speedTilesPerSec, dtSec) {
  // If enemy/player are grid-based, just step at most 1 tile per call.
  const ex = enemy.pos?.x ?? enemy.x ?? 0;
  const ey = enemy.pos?.y ?? enemy.y ?? 0;
  const px = player.pos?.x ?? player.x ?? 0;
  const py = player.pos?.y ?? player.y ?? 0;

  const maxStep = Math.max(0, speedTilesPerSec * dtSec);
  const step = maxStep >= 1 ? 1 : 0;

  const dx = px - ex;
  const dy = py - ey;

  let nx = ex;
  let ny = ey;

  if (step > 0) {
    if (Math.abs(dx) >= Math.abs(dy)) {
      nx = ex + Math.sign(dx);
    } else {
      ny = ey + Math.sign(dy);
    }

    // If blocked, try orthogonal.
    if (isBlocked(level, nx, ny)) {
      nx = ex;
      ny = ey;
      if (Math.abs(dx) < Math.abs(dy)) {
        nx = ex + Math.sign(dx);
      } else {
        ny = ey + Math.sign(dy);
      }
      if (isBlocked(level, nx, ny)) {
        nx = ex;
        ny = ey;
      }
    }
  }

  if (enemy.pos) return { x: nx, y: ny };
  return { x: nx, y: ny };
}
