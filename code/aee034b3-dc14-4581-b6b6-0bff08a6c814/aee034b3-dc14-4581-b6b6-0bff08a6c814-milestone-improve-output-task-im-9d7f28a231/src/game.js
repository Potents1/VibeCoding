import { mulberry32, randInt } from "./rng.js";

export const GAME_STATUS = {
  playing: "playing",
  won: "won",
  lost: "lost",
  paused: "paused"
};

export const INPUT = {
  up: "up",
  down: "down",
  left: "left",
  right: "right",
  none: "none"
};

function posKey(x, y) {
  return `${x},${y}`;
}

export function createDefaultLevel() {
  // Grid 20x15 (fits 640x480 with 32px tiles)
  const width = 20;
  const height = 15;

  const walls = new Set();

  // Border walls
  for (let x = 0; x < width; x++) {
    walls.add(posKey(x, 0));
    walls.add(posKey(x, height - 1));
  }
  for (let y = 0; y < height; y++) {
    walls.add(posKey(0, y));
    walls.add(posKey(width - 1, y));
  }

  // Interior maze-ish walls (deterministic layout)
  const segments = [
    // horizontal
    { x1: 2, y: 3, x2: 17 },
    { x1: 2, y: 11, x2: 17 },
    // vertical pillars
    { x: 5, y1: 2, y2: 6 },
    { x: 14, y1: 8, y2: 12 },
    { x: 10, y1: 4, y2: 10 }
  ];

  for (const s of segments) {
    if (typeof s.y === "number") {
      for (let x = s.x1; x <= s.x2; x++) walls.add(posKey(x, s.y));
    } else if (typeof s.x === "number") {
      for (let y = s.y1; y <= s.y2; y++) walls.add(posKey(s.x, y));
    }
  }

  const start = { x: 2, y: 2 };
  const goal = { x: 17, y: 12 };

  // Ensure start/goal are clear
  walls.delete(posKey(start.x, start.y));
  walls.delete(posKey(goal.x, goal.y));

  return { width, height, walls, start, goal };
}

export function createGame({ seed = 1234, level = createDefaultLevel() } = {}) {
  const rng = mulberry32(seed);

  const player = { x: level.start.x, y: level.start.y };

  // Two enemies placed away from the start
  const enemies = [];
  const forbidden = new Set([
    posKey(player.x, player.y),
    posKey(level.goal.x, level.goal.y)
  ]);

  const desiredEnemies = 2;
  while (enemies.length < desiredEnemies) {
    const x = randInt(rng, 1, level.width - 1);
    const y = randInt(rng, 1, level.height - 1);
    const key = posKey(x, y);
    if (level.walls.has(key) || forbidden.has(key)) continue;
    // Avoid too close to player
    const manhattan = Math.abs(x - player.x) + Math.abs(y - player.y);
    if (manhattan < 8) continue;
    forbidden.add(key);
    enemies.push({ x, y });
  }

  return {
    tick: 0,
    status: GAME_STATUS.playing,
    level,
    player,
    enemies,
    rngSeed: seed,
    inputQueue: []
  };
}

export function queueInput(state, input) {
  if (!state || !input) return;
  state.inputQueue.push(input);
}

export function togglePause(state) {
  if (state.status === GAME_STATUS.paused) state.status = GAME_STATUS.playing;
  else if (state.status === GAME_STATUS.playing) state.status = GAME_STATUS.paused;
}

export function tryMove(level, entity, dx, dy) {
  const nx = entity.x + dx;
  const ny = entity.y + dy;
  if (nx < 0 || ny < 0 || nx >= level.width || ny >= level.height) return false;
  if (level.walls.has(posKey(nx, ny))) return false;
  entity.x = nx;
  entity.y = ny;
  return true;
}

function applyPlayerInput(state) {
  const input = state.inputQueue.shift() ?? INPUT.none;
  switch (input) {
    case INPUT.up:
      tryMove(state.level, state.player, 0, -1);
      break;
    case INPUT.down:
      tryMove(state.level, state.player, 0, 1);
      break;
    case INPUT.left:
      tryMove(state.level, state.player, -1, 0);
      break;
    case INPUT.right:
      tryMove(state.level, state.player, 1, 0);
      break;
    default:
      break;
  }
}

function enemyStepToward(level, enemy, target) {
  const dx = target.x - enemy.x;
  const dy = target.y - enemy.y;

  const options = [];
  if (dx !== 0) options.push({ dx: Math.sign(dx), dy: 0 });
  if (dy !== 0) options.push({ dx: 0, dy: Math.sign(dy) });

  // Prefer reducing Manhattan distance, but fall back to the other axis if blocked.
  for (const opt of options) {
    const copy = { x: enemy.x, y: enemy.y };
    if (tryMove(level, copy, opt.dx, opt.dy)) {
      enemy.x = copy.x;
      enemy.y = copy.y;
      return;
    }
  }

  // If both primary moves blocked, try perpendicular detours (deterministic order).
  const detours = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 }
  ];
  for (const d of detours) {
    const copy = { x: enemy.x, y: enemy.y };
    if (tryMove(level, copy, d.dx, d.dy)) {
      enemy.x = copy.x;
      enemy.y = copy.y;
      return;
    }
  }
}

function checkEndConditions(state) {
  const { player, enemies, level } = state;

  for (const e of enemies) {
    if (e.x === player.x && e.y === player.y) {
      state.status = GAME_STATUS.lost;
      return;
    }
  }

  if (player.x === level.goal.x && player.y === level.goal.y) {
    state.status = GAME_STATUS.won;
  }
}

export function stepGame(state) {
  if (state.status !== GAME_STATUS.playing) return state;

  state.tick++;

  // Player moves every tick.
  applyPlayerInput(state);

  // Enemies move every other tick for fairness.
  if (state.tick % 2 === 0) {
    for (const e of state.enemies) enemyStepToward(state.level, e, state.player);
  }

  checkEndConditions(state);
  return state;
}

export function resetGame(state) {
  const fresh = createGame({ seed: state.rngSeed, level: state.level });
  state.tick = fresh.tick;
  state.status = fresh.status;
  state.player.x = fresh.player.x;
  state.player.y = fresh.player.y;
  state.enemies.length = 0;
  for (const e of fresh.enemies) state.enemies.push(e);
  state.inputQueue.length = 0;
}
