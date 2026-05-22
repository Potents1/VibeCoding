function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function isWallAt(level, tileX, tileY) {
  if (tileX < 0 || tileY < 0) return true;
  if (tileY >= level.grid.length) return true;
  if (tileX >= level.grid[0].length) return true;
  return level.grid[tileY][tileX] === 1;
}

function wallsOverlappingAabb(level, aabb) {
  const minX = Math.floor(aabb.x);
  const maxX = Math.floor(aabb.x + aabb.w);
  const minY = Math.floor(aabb.y);
  const maxY = Math.floor(aabb.y + aabb.h);

  const hits = [];
  for (let ty = minY; ty <= maxY; ty += 1) {
    for (let tx = minX; tx <= maxX; tx += 1) {
      if (isWallAt(level, tx, ty)) hits.push({ x: tx, y: ty, w: 1, h: 1 });
    }
  }
  return hits;
}

export function actorAabb(actor) {
  return {
    x: actor.pos.x - actor.size.w / 2,
    y: actor.pos.y - actor.size.h / 2,
    w: actor.size.w,
    h: actor.size.h
  };
}

export function tileCenterToAabb(tileCenter, sizeTiles = 1) {
  return {
    x: tileCenter.x - sizeTiles / 2,
    y: tileCenter.y - sizeTiles / 2,
    w: sizeTiles,
    h: sizeTiles
  };
}

export function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function resolveAxis(level, actor, nextPos, axis) {
  const next = { x: nextPos.x, y: nextPos.y };
  const box = actorAabb({ ...actor, pos: next });
  const hits = wallsOverlappingAabb(level, box);
  if (hits.length === 0) return next;

  for (const wall of hits) {
    const wallBox = { x: wall.x, y: wall.y, w: wall.w, h: wall.h };
    if (!rectsOverlap(box, wallBox)) continue;

    if (axis === "x") {
      if (nextPos.x > actor.pos.x) {
        const maxCenterX = wallBox.x - actor.size.w / 2;
        next.x = Math.min(next.x, maxCenterX);
      } else if (nextPos.x < actor.pos.x) {
        const minCenterX = wallBox.x + wallBox.w + actor.size.w / 2;
        next.x = Math.max(next.x, minCenterX);
      }
    } else {
      if (nextPos.y > actor.pos.y) {
        const maxCenterY = wallBox.y - actor.size.h / 2;
        next.y = Math.min(next.y, maxCenterY);
      } else if (nextPos.y < actor.pos.y) {
        const minCenterY = wallBox.y + wallBox.h + actor.size.h / 2;
        next.y = Math.max(next.y, minCenterY);
      }
    }
  }

  // Keep actor within world bounds even if it starts out-of-bounds.
  next.x = clamp(next.x, actor.size.w / 2, level.grid[0].length - actor.size.w / 2);
  next.y = clamp(next.y, actor.size.h / 2, level.grid.length - actor.size.h / 2);
  return next;
}

export function resolveActorVsWalls(level, actor, nextPos) {
  const afterX = resolveAxis(level, actor, { x: nextPos.x, y: actor.pos.y }, "x");
  const actorAfterX = { ...actor, pos: afterX };
  const afterY = resolveAxis(level, actorAfterX, { x: afterX.x, y: nextPos.y }, "y");
  return afterY;
}
