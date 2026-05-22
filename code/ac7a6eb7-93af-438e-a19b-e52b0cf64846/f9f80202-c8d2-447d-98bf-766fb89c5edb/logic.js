export const Tile = Object.freeze({
  Empty: 0,
  Wall: 1,
  Goal: 2
});

export function createDefaultLevel() {
  // 18x10 grid (fits 16:9 nicely when rendered with square tiles + margins)
  const w = 18;
  const h = 10;
  const grid = new Array(w * h).fill(Tile.Empty);

  const set = (x, y, t) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    grid[y * w + x] = t;
  };

  for (let x = 0; x < w; x++) {
    set(x, 0, Tile.Wall);
    set(x, h - 1, Tile.Wall);
  }
  for (let y = 0; y < h; y++) {
    set(0, y, Tile.Wall);
    set(w - 1, y, Tile.Wall);
  }

  // Interior walls (deterministic layout)
  for (let x = 2; x <= 15; x++) set(x, 2, Tile.Wall);
  for (let x = 2; x <= 15; x++) if (x !== 8) set(x, 7, Tile.Wall);
  for (let y = 3; y <= 6; y++) set(6, y, Tile.Wall);
  for (let y = 3; y <= 6; y++) set(12, y, Tile.Wall);

  // A couple of gaps
  set(4, 2, Tile.Empty);
  set(14, 7, Tile.Empty);
  set(6, 5, Tile.Empty);
  set(12, 4, Tile.Empty);

  set(16, 8, Tile.Goal);

  return {
    w,
    h,
    grid,
    playerStart: { x: 1, y: 1 },
    enemyStart: { x: 16, y: 1 }
  };
}

export function newGame(level = createDefaultLevel()) {
  return {
    level,
    tick: 0,
    status: "playing", // playing | won | lost
    player: { x: level.playerStart.x, y: level.playerStart.y },
    enemy: { x: level.enemyStart.x, y: level.enemyStart.y },
    // Movement cadence keeps the loop deterministic and testable.
    playerMoveCooldown: 0,
    enemyMoveEvery: 2
  };
}

export function tileAt(level, x, y) {
  if (x < 0 || y < 0 || x >= level.w || y >= level.h) return Tile.Wall;
  return level.grid[y * level.w + x];
}

export function isBlocked(level, x, y) {
  return tileAt(level, x, y) === Tile.Wall;
}

export function normalizeDir(intent) {
  if (!intent) return null;
  const { x, y } = intent;
  if (!x && !y) return null;
  if (x && y) return null; // disallow diagonals for determinism
  const nx = x ? Math.sign(x) : 0;
  const ny = y ? Math.sign(y) : 0;
  return { x: nx, y: ny };
}

export function applyPlayerIntent(game, intent) {
  if (game.status !== "playing") return game;
  if (game.playerMoveCooldown > 0) return game;

  const dir = normalizeDir(intent);
  if (!dir) return game;

  const next = { x: game.player.x + dir.x, y: game.player.y + dir.y };
  if (isBlocked(game.level, next.x, next.y)) return game;

  game.player = next;
  game.playerMoveCooldown = 1;
  return game;
}

export function stepGame(game, intent) {
  // Mutates for performance/simplicity; tests treat it as stateful.
  if (game.status !== "playing") return game;

  game.tick++;
  if (game.playerMoveCooldown > 0) game.playerMoveCooldown--;

  applyPlayerIntent(game, intent);

  if (tileAt(game.level, game.player.x, game.player.y) === Tile.Goal) {
    game.status = "won";
    return game;
  }

  if (game.tick % game.enemyMoveEvery === 0) {
    moveEnemyOneStep(game);
  }

  if (game.enemy.x === game.player.x && game.enemy.y === game.player.y) {
    game.status = "lost";
  }

  return game;
}

export function computeNextEnemyStep(level, enemy, player) {
  // BFS from enemy to player on a grid; deterministic tie-breaking by direction order.
  const dirs = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 }
  ];

  const start = enemy.y * level.w + enemy.x;
  const goal = player.y * level.w + player.x;
  if (start === goal) return { x: enemy.x, y: enemy.y };

  const prev = new Int32Array(level.w * level.h).fill(-1);
  const queue = new Int32Array(level.w * level.h);
  let qh = 0;
  let qt = 0;
  queue[qt++] = start;
  prev[start] = start;

  while (qh < qt) {
    const cur = queue[qh++];
    if (cur === goal) break;
    const cx = cur % level.w;
    const cy = Math.floor(cur / level.w);
    for (const d of dirs) {
      const nx = cx + d.x;
      const ny = cy + d.y;
      if (isBlocked(level, nx, ny)) continue;
      const ni = ny * level.w + nx;
      if (prev[ni] !== -1) continue;
      prev[ni] = cur;
      queue[qt++] = ni;
    }
  }

  if (prev[goal] === -1) return { x: enemy.x, y: enemy.y };

  // Walk back one step from goal to get next move from start
  let step = goal;
  while (prev[step] !== start) {
    step = prev[step];
  }
  return { x: step % level.w, y: Math.floor(step / level.w) };
}

export function moveEnemyOneStep(game) {
  const next = computeNextEnemyStep(game.level, game.enemy, game.player);
  game.enemy = next;
  return game;
}

