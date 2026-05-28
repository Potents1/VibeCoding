import { isWallAt } from '../map.js';

export function canMoveTo(map, x, y, r) {
  if (isWallAt(map, x - r, y - r)) return false;
  if (isWallAt(map, x + r, y - r)) return false;
  if (isWallAt(map, x - r, y + r)) return false;
  if (isWallAt(map, x + r, y + r)) return false;
  return true;
}

export function moveWithCollisions(map, body, dx, dy) {
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 0.15));
  const sx = dx / steps;
  const sy = dy / steps;
  for (let i = 0; i < steps; i += 1) {
    const nx = body.x + sx;
    if (canMoveTo(map, nx, body.y, body.r)) body.x = nx;
    const ny = body.y + sy;
    if (canMoveTo(map, body.x, ny, body.r)) body.y = ny;
  }
}
