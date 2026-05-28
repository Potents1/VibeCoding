function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function distSq(ax, ay, bx, by) {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

function parseMap(lines) {
  const height = lines.length;
  const width = lines[0]?.length || 0;
  const walls = new Set();
  const enemies = [];
  let player = null;
  let goal = null;

  for (let y = 0; y < height; y += 1) {
    const row = lines[y];
    if (row.length !== width) throw new Error('map must be rectangular');
    for (let x = 0; x < width; x += 1) {
      const ch = row[x];
      if (ch === '#') walls.add(`${x},${y}`);
      else if (ch === 'P') player = { x: x + 0.5, y: y + 0.5 };
      else if (ch === 'G') goal = { x: x + 0.5, y: y + 0.5 };
      else if (ch === 'E') enemies.push({ x: x + 0.5, y: y + 0.5 });
    }
  }

  if (!player) throw new Error('map missing P');
  if (!goal) throw new Error('map missing G');
  return { width, height, walls, player, goal, enemies };
}

const DEFAULT_MAP = [
  '####################',
  '#P.....#...........#',
  '#.###..#..######...#',
  '#...#..#..#....#...#',
  '###.#..#..#.##.#.###',
  '#...#.....#..#.#...#',
  '#.#######.##.#.###.#',
  '#.....#...#..#.....#',
  '#####.#.###..#####.#',
  '#.....#.....E#.....#',
  '#.##########.#.###.#',
  '#.#........#.#...#.#',
  '#.#.######.#.###.#.#',
  '#.#.#....#.#...#.#.#',
  '#...#.##.#.###.#...#',
  '###.#.##.#...#.#.###',
  '#...#....###.#.....#',
  '#.#########..#####.#',
  '#.............#...G#',
  '####################'
];

function buildEnemyPatrol(enemyIndex, mapWidth, mapHeight) {
  const routes = [
    [
      { x: 13.5, y: 9.5 },
      { x: 13.5, y: 15.5 },
      { x: 5.5, y: 15.5 },
      { x: 5.5, y: 9.5 }
    ]
  ];
  const route = routes[enemyIndex % routes.length];
  return route.map((p) => ({ x: clamp(p.x, 0.5, mapWidth - 0.5), y: clamp(p.y, 0.5, mapHeight - 0.5) }));
}

export function createGame({ mapLines = DEFAULT_MAP } = {}) {
  const parsed = parseMap(mapLines);
  const enemies = parsed.enemies.map((e, i) => ({
    x: e.x,
    y: e.y,
    speed: 2.4,
    patrol: buildEnemyPatrol(i, parsed.width, parsed.height),
    patrolIndex: 0
  }));

  return {
    map: { width: parsed.width, height: parsed.height, walls: parsed.walls, goal: parsed.goal },
    player: { x: parsed.player.x, y: parsed.player.y, r: 0.32, speed: 4.0 },
    enemies,
    time: 0,
    status: 'playing',
    statusText: 'Reach the portal. Avoid the sentinel.',
    lastMoveDir: { x: 1, y: 0 }
  };
}

function isWall(state, tileX, tileY) {
  if (tileX < 0 || tileY < 0 || tileX >= state.map.width || tileY >= state.map.height) return true;
  return state.map.walls.has(`${tileX},${tileY}`);
}

function circleHitsWall(state, cx, cy, r) {
  const minX = Math.floor(cx - r);
  const maxX = Math.floor(cx + r);
  const minY = Math.floor(cy - r);
  const maxY = Math.floor(cy + r);
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      if (!isWall(state, x, y)) continue;
      const nearestX = clamp(cx, x, x + 1);
      const nearestY = clamp(cy, y, y + 1);
      if (distSq(cx, cy, nearestX, nearestY) < r * r) return true;
    }
  }
  return false;
}

function moveCircleWithCollisions(state, circle, dx, dy) {
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 0.2));
  const stepX = dx / steps;
  const stepY = dy / steps;
  for (let i = 0; i < steps; i += 1) {
    const nextX = circle.x + stepX;
    if (!circleHitsWall(state, nextX, circle.y, circle.r)) circle.x = nextX;
    const nextY = circle.y + stepY;
    if (!circleHitsWall(state, circle.x, nextY, circle.r)) circle.y = nextY;
  }
}

function updateEnemy(state, enemy, dt) {
  const target = enemy.patrol[enemy.patrolIndex];
  const dx = target.x - enemy.x;
  const dy = target.y - enemy.y;
  const d = Math.hypot(dx, dy);
  if (d < 0.05) {
    enemy.patrolIndex = (enemy.patrolIndex + 1) % enemy.patrol.length;
    return;
  }
  const vx = (dx / d) * enemy.speed;
  const vy = (dy / d) * enemy.speed;
  const mover = { x: enemy.x, y: enemy.y, r: 0.3 };
  moveCircleWithCollisions(state, mover, vx * dt, vy * dt);
  enemy.x = clamp(mover.x, 0.5, state.map.width - 0.5);
  enemy.y = clamp(mover.y, 0.5, state.map.height - 0.5);
}

export function stepGame(state, input, dt) {
  const step = clamp(dt, 0, 0.05);
  state.time += step;

  if (input?.resetPressed) {
    const fresh = createGame();
    Object.keys(state).forEach((k) => delete state[k]);
    Object.assign(state, fresh);
    return state;
  }

  if (state.status !== 'playing') return state;

  const dir = { x: 0, y: 0 };
  if (input?.left) dir.x -= 1;
  if (input?.right) dir.x += 1;
  if (input?.up) dir.y -= 1;
  if (input?.down) dir.y += 1;
  if (dir.x !== 0 || dir.y !== 0) state.lastMoveDir = dir;

  const len = Math.hypot(dir.x, dir.y) || 1;
  const vx = (dir.x / len) * state.player.speed;
  const vy = (dir.y / len) * state.player.speed;

  moveCircleWithCollisions(state, state.player, vx * step, vy * step);

  for (const enemy of state.enemies) updateEnemy(state, enemy, step);

  const goal = state.map.goal;
  if (distSq(state.player.x, state.player.y, goal.x, goal.y) < 0.28 * 0.28) {
    state.status = 'won';
    state.statusText = 'You won! Press R to play again.';
    return state;
  }

  for (const enemy of state.enemies) {
    if (distSq(state.player.x, state.player.y, enemy.x, enemy.y) < 0.55 * 0.55) {
      state.status = 'lost';
      state.statusText = 'Caught! Press R to try again.';
      return state;
    }
  }

  return state;
}

export function simulateMoveIntoWall() {
  const s = createGame();
  for (let i = 0; i < 60; i += 1) stepGame(s, { left: true }, 1 / 60);
  return { minX: 1 + s.player.r, endX: s.player.x };
}

export function simulateWin() {
  const s = createGame();
  s.player.x = s.map.goal.x;
  s.player.y = s.map.goal.y;
  stepGame(s, {}, 1 / 60);
  return s.status;
}

export function simulateLoss() {
  const s = createGame();
  const e = s.enemies[0];
  s.player.x = e.x;
  s.player.y = e.y;
  stepGame(s, {}, 1 / 60);
  return s.status;
}
