function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function circleIntersectsTile(cx, cy, r, tx, ty) {
  // Tile is axis-aligned unit square [tx,tx+1]x[ty,ty+1]
  const nx = clamp(cx, tx, tx + 1);
  const ny = clamp(cy, ty, ty + 1);
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < r * r;
}

function collides(map, cx, cy, r) {
  const minX = Math.floor(cx - r);
  const maxX = Math.floor(cx + r);
  const minY = Math.floor(cy - r);
  const maxY = Math.floor(cy + r);

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      if (x < 0 || y < 0 || x >= map.width || y >= map.height) return true;
      if (!map.walls.has(`${x},${y}`)) continue;
      if (circleIntersectsTile(cx, cy, r, x, y)) return true;
    }
  }

  // Prevent slipping through diagonal "corner gaps" where two solid tiles touch at a point.
  // If we are within radius of a tile corner that is formed by two diagonal walls, treat it as blocked.
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const a = map.walls.has(`${x},${y}`);
      if (!a) continue;

      const b = map.walls.has(`${x + 1},${y + 1}`);
      if (b) {
        const dx = cx - (x + 1);
        const dy = cy - (y + 1);
        if (dx * dx + dy * dy < r * r) return true;
      }

      const c = map.walls.has(`${x + 1},${y - 1}`);
      if (c) {
        const dx = cx - (x + 1);
        const dy = cy - y;
        if (dx * dx + dy * dy < r * r) return true;
      }
    }
  }
  return false;
}

function moveAxis(map, body, dx, dy) {
  if (dx === 0 && dy === 0) return;
  const nx = body.x + dx;
  const ny = body.y + dy;
  if (!collides(map, nx, ny, body.r)) {
    body.x = nx;
    body.y = ny;
    return;
  }

  // If blocked, binary search towards the target for the farthest non-colliding position.
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 12; i += 1) {
    const mid = (lo + hi) / 2;
    const tx = body.x + dx * mid;
    const ty = body.y + dy * mid;
    if (collides(map, tx, ty, body.r)) hi = mid;
    else lo = mid;
  }
  body.x = body.x + dx * lo;
  body.y = body.y + dy * lo;
}

export function moveWithCollisions(map, body, dx, dy) {
  // Sliding resolution: apply X then Y.
  moveAxis(map, body, dx, 0);
  moveAxis(map, body, 0, dy);
}
