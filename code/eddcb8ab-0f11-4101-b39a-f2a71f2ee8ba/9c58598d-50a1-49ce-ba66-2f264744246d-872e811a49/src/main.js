const TILE = 48;
const DIRS = {
  ArrowUp: { x: 0, y: -1 },
  KeyW: { x: 0, y: -1 },
  up: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  KeyS: { x: 0, y: 1 },
  down: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  KeyA: { x: -1, y: 0 },
  left: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  KeyD: { x: 1, y: 0 },
  right: { x: 1, y: 0 },
};

const LEVEL = [
  '##############',
  '#P...#.......#',
  '#.##.#.#####.#',
  '#..#...#...#.#',
  '##.#.###.#.#.#',
  '#..#..C..#...#',
  '#.####.#####.#',
  '#......#..C..#',
  '#.####.#.###.#',
  '#....C...#E..#',
  '#..H..#...D..#',
  '##############',
];

export function createGame(level = LEVEL) {
  const state = {
    width: level[0].length,
    height: level.length,
    player: { x: 0, y: 0 },
    exit: { x: 0, y: 0 },
    charges: new Set(),
    drones: [],
    walls: new Set(),
    hazards: new Set(),
    moves: 0,
    ticks: 0,
    status: 'playing',
    message: 'Collect every charge and reach the uplink.',
  };

  level.forEach((row, y) => {
    [...row].forEach((cell, x) => {
      const key = posKey(x, y);
      if (cell === '#') state.walls.add(key);
      if (cell === 'P') state.player = { x, y };
      if (cell === 'C') state.charges.add(key);
      if (cell === 'D') state.drones.push({ x, y });
      if (cell === 'H') state.hazards.add(key);
      if (cell === 'E') state.exit = { x, y };
    });
  });

  return state;
}

export function movePlayer(state, direction) {
  if (state.status !== 'playing') return state;
  const dir = typeof direction === 'string' ? DIRS[direction] : direction;
  if (!dir) return state;

  const next = { x: state.player.x + dir.x, y: state.player.y + dir.y };
  if (isBlocked(state, next.x, next.y)) return state;

  state.player = next;
  state.moves += 1;

  const key = posKey(next.x, next.y);
  if (state.charges.has(key)) {
    state.charges.delete(key);
    state.message = state.charges.size ? 'Charge secured. Keep moving.' : 'All charges secured. Reach the uplink.';
  }

  if (state.hazards.has(key)) {
    state.status = 'lost';
    state.message = 'Signal fried. Press Reset to try again.';
  } else if (state.drones.some((drone) => drone.x === next.x && drone.y === next.y)) {
    state.status = 'lost';
    state.message = 'Intercepted by a patrol drone. Press Reset to try again.';
  } else if (next.x === state.exit.x && next.y === state.exit.y) {
    if (state.charges.size === 0) {
      state.status = 'won';
      state.message = `Uplink complete in ${state.moves} moves.`;
    } else {
      state.message = 'The uplink needs every charge first.';
    }
  }

  return state;
}

export function tickGame(state) {
  if (state.status !== 'playing') return state;
  state.ticks += 1;

  state.drones = state.drones.map((drone) => {
    const next = chooseDroneStep(state, drone);
    return next ?? drone;
  });

  if (state.drones.some((drone) => drone.x === state.player.x && drone.y === state.player.y)) {
    state.status = 'lost';
    state.message = 'Intercepted by a patrol drone. Press Reset to try again.';
  }

  return state;
}

export function isBlocked(state, x, y) {
  return x < 0 || y < 0 || x >= state.width || y >= state.height || state.walls.has(posKey(x, y));
}

export function render(state, ctx) {
  ctx.clearRect(0, 0, state.width * TILE, state.height * TILE);
  ctx.fillStyle = '#121622';
  ctx.fillRect(0, 0, state.width * TILE, state.height * TILE);

  for (let y = 0; y < state.height; y += 1) {
    for (let x = 0; x < state.width; x += 1) {
      drawTile(ctx, x, y, '#1d2434');
    }
  }

  state.walls.forEach((key) => {
    const { x, y } = parseKey(key);
    drawTile(ctx, x, y, '#384055');
  });

  state.hazards.forEach((key) => {
    const { x, y } = parseKey(key);
    drawDisc(ctx, x, y, '#e25f5f', 14);
  });

  state.charges.forEach((key) => {
    const { x, y } = parseKey(key);
    drawDisc(ctx, x, y, '#ffd166', 12);
  });

  drawTile(ctx, state.exit.x, state.exit.y, state.charges.size ? '#23515c' : '#2b8a64');
  state.drones.forEach((drone) => drawDrone(ctx, drone.x, drone.y));
  drawDisc(ctx, state.player.x, state.player.y, '#7dd3fc', 16);
}

export function run() {
  const state = createGame();
  return {
    ok: true,
    width: state.width,
    height: state.height,
    charges: state.charges.size,
    drones: state.drones.length,
    status: state.status,
  };
}

function chooseDroneStep(state, drone) {
  const candidates = [
    { x: Math.sign(state.player.x - drone.x), y: 0 },
    { x: 0, y: Math.sign(state.player.y - drone.y) },
  ].filter((dir) => dir.x !== 0 || dir.y !== 0);

  for (const dir of candidates) {
    const next = { x: drone.x + dir.x, y: drone.y + dir.y };
    if (!isBlocked(state, next.x, next.y) && !state.hazards.has(posKey(next.x, next.y))) {
      return next;
    }
  }

  return null;
}

function drawTile(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * TILE + 3, y * TILE + 3, TILE - 6, TILE - 6);
}

function drawDisc(ctx, x, y, color, radius) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x * TILE + TILE / 2, y * TILE + TILE / 2, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawDrone(ctx, x, y) {
  ctx.fillStyle = '#f472b6';
  ctx.fillRect(x * TILE + 13, y * TILE + 13, TILE - 26, TILE - 26);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x * TILE + 22, y * TILE + 20, 4, 4);
  ctx.fillRect(x * TILE + 30, y * TILE + 20, 4, 4);
}

function posKey(x, y) {
  return `${x},${y}`;
}

function parseKey(key) {
  const [x, y] = key.split(',').map(Number);
  return { x, y };
}

function updateHud(state) {
  document.querySelector('#status').textContent = state.message;
  document.querySelector('#charge-count').textContent = `${LEVEL_CHARGES - state.charges.size} / ${LEVEL_CHARGES}`;
  document.querySelector('#move-count').textContent = `${state.moves} moves`;
}

const LEVEL_CHARGES = createGame().charges.size;

function boot() {
  const canvas = document.querySelector('#game-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let state = createGame();

  const redraw = () => {
    render(state, ctx);
    updateHud(state);
  };

  const step = () => {
    tickGame(state);
    redraw();
  };

  window.addEventListener('keydown', (event) => {
    if (!DIRS[event.code]) return;
    event.preventDefault();
    movePlayer(state, event.code);
    redraw();
  });

  document.querySelectorAll('[data-dir]').forEach((button) => {
    button.addEventListener('click', () => {
      movePlayer(state, button.dataset.dir);
      redraw();
    });
  });

  document.querySelector('#reset').addEventListener('click', () => {
    state = createGame();
    redraw();
  });

  window.setInterval(step, 900);
  redraw();
}

if (typeof document !== 'undefined') boot();

if (typeof process !== 'undefined' && import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(run()));
}
