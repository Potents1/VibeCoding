function key(x, y) {
  return `${x},${y}`;
}

function neighbors(world, pos) {
  const out = [];
  const dirs = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 }
  ];
  for (const d of dirs) {
    const nx = pos.x + d.x;
    const ny = pos.y + d.y;
    if (nx < 0 || ny < 0 || nx >= world.w || ny >= world.h) continue;
    if (world.tiles[ny][nx] === 1) continue;
    out.push({ x: nx, y: ny });
  }
  return out;
}

function reconstructStep(fromMap, start, target) {
  const tKey = key(target.x, target.y);
  if (!fromMap.has(tKey)) return start;
  let cur = target;
  let prev = fromMap.get(tKey);
  while (prev && (prev.x !== start.x || prev.y !== start.y)) {
    cur = prev;
    prev = fromMap.get(key(cur.x, cur.y));
  }
  return cur;
}

export function computeEnemyStep(world, enemy, player) {
  // BFS shortest path enemy -> player. If no path, stay still.
  if (enemy.x === player.x && enemy.y === player.y) return enemy;

  const queue = [enemy];
  const visited = new Set([key(enemy.x, enemy.y)]);
  const from = new Map();

  while (queue.length) {
    const cur = queue.shift();
    if (cur.x === player.x && cur.y === player.y) {
      const step = reconstructStep(from, enemy, player);
      return step;
    }
    for (const n of neighbors(world, cur)) {
      const k = key(n.x, n.y);
      if (visited.has(k)) continue;
      visited.add(k);
      from.set(k, cur);
      queue.push(n);
    }
  }

  return enemy;
}

