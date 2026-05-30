import { aabbIntersect, clamp } from './geom.js';
import { mulberry32 } from './rng.js';

export const GAME = {
  worldW: 1280,
  worldH: 720,
  playerSize: 34,
  enemySize: 34,
  exitSize: 56,
  wallThickness: 22,
  playerSpeed: 420,
  enemySpeed: 300,
  enemyTurnRate: 2.8
};

function rect(x, y, w, h) {
  return { x, y, w, h };
}

function buildWalls() {
  const t = GAME.wallThickness;
  const W = GAME.worldW;
  const H = GAME.worldH;

  const walls = [];
  // Border
  walls.push(rect(0, 0, W, t));
  walls.push(rect(0, H - t, W, t));
  walls.push(rect(0, 0, t, H));
  walls.push(rect(W - t, 0, t, H));

  // Interior maze-ish blocks (hand-authored, deterministic)
  walls.push(rect(180, 120, 520, 22));
  walls.push(rect(180, 120, 22, 360));
  walls.push(rect(420, 240, 22, 360));
  walls.push(rect(580, 120, 22, 240));

  walls.push(rect(760, 120, 22, 420));
  walls.push(rect(760, 520, 360, 22));
  walls.push(rect(980, 240, 22, 240));

  walls.push(rect(220, 520, 420, 22));
  walls.push(rect(580, 360, 260, 22));

  return walls;
}

function resolveWallCollisions(body, walls) {
  // Axis-separating resolution (x then y), using previous position
  for (const wall of walls) {
    if (!aabbIntersect(body, wall)) continue;

    const overlapL = body.x + body.w - wall.x;
    const overlapR = wall.x + wall.w - body.x;
    const overlapT = body.y + body.h - wall.y;
    const overlapB = wall.y + wall.h - body.y;

    const minX = Math.min(overlapL, overlapR);
    const minY = Math.min(overlapT, overlapB);

    if (minX < minY) {
      if (overlapL < overlapR) body.x -= overlapL;
      else body.x += overlapR;
    } else {
      if (overlapT < overlapB) body.y -= overlapT;
      else body.y += overlapB;
    }
  }
}

function normalize(x, y) {
  const len = Math.hypot(x, y);
  if (len < 1e-9) return { x: 0, y: 0 };
  return { x: x / len, y: y / len };
}

export function createGame({ seed = 1337 } = {}) {
  const rng = mulberry32(seed);
  const walls = buildWalls();

  const player = {
    x: 80,
    y: 80,
    w: GAME.playerSize,
    h: GAME.playerSize,
    vx: 0,
    vy: 0
  };

  const enemy = {
    x: 1120,
    y: 600,
    w: GAME.enemySize,
    h: GAME.enemySize,
    vx: 0,
    vy: 0,
    dirX: -1,
    dirY: 0
  };

  // Exit placed in a consistent reachable pocket
  const exit = {
    x: 1160,
    y: 70,
    w: GAME.exitSize,
    h: GAME.exitSize
  };

  const state = {
    seed,
    t: 0,
    status: 'playing',
    reason: '',
    walls,
    player,
    enemy,
    exit,
    scoreTime: 0,
    rngTick: 0,
    rng,
    lastInput: { x: 0, y: 0 }
  };

  // Small deterministic jitter so the enemy isn't perfectly linear
  state.enemy.dirX = rng() < 0.5 ? -1 : 1;
  state.enemy.dirY = rng() < 0.5 ? -1 : 1;

  return state;
}

export function stepGame(state, input, dt) {
  const s = state;
  s.t += dt;
  s.scoreTime += dt;
  s.lastInput = { x: input.x, y: input.y };

  if (s.status !== 'playing') {
    return s;
  }

  // Player move
  const mv = normalize(input.x, input.y);
  s.player.vx = mv.x * GAME.playerSpeed;
  s.player.vy = mv.y * GAME.playerSpeed;

  const px0 = s.player.x;
  const py0 = s.player.y;
  s.player.x += s.player.vx * dt;
  s.player.y += s.player.vy * dt;

  // Clamp to world then resolve walls
  s.player.x = clamp(s.player.x, 0, GAME.worldW - s.player.w);
  s.player.y = clamp(s.player.y, 0, GAME.worldH - s.player.h);
  resolveWallCollisions(s.player, s.walls);

  // If stuck inside wall due to dt spikes, revert
  for (const w of s.walls) {
    if (aabbIntersect(s.player, w)) {
      s.player.x = px0;
      s.player.y = py0;
      break;
    }
  }

  // Enemy: steer toward player with limited turn rate + deterministic jitter
  s.rngTick++;
  const jitter = (s.rng() - 0.5) * 0.35;
  const toPx = (s.player.x + s.player.w / 2) - (s.enemy.x + s.enemy.w / 2);
  const toPy = (s.player.y + s.player.h / 2) - (s.enemy.y + s.enemy.h / 2);
  const desired = normalize(toPx, toPy);

  // Smooth direction change
  const lerp = 1 - Math.exp(-GAME.enemyTurnRate * dt);
  let dx = s.enemy.dirX + (desired.x - s.enemy.dirX) * lerp;
  let dy = s.enemy.dirY + (desired.y - s.enemy.dirY) * lerp;
  const n = normalize(dx, dy);
  dx = n.x;
  dy = n.y;

  // Add a tiny lateral component for variety (still deterministic)
  const latX = -dy;
  const latY = dx;
  dx = normalize(dx + latX * jitter, dy + latY * jitter).x;
  dy = normalize(dx, dy).y;

  s.enemy.dirX = dx;
  s.enemy.dirY = dy;
  s.enemy.vx = dx * GAME.enemySpeed;
  s.enemy.vy = dy * GAME.enemySpeed;

  const ex0 = s.enemy.x;
  const ey0 = s.enemy.y;
  s.enemy.x += s.enemy.vx * dt;
  s.enemy.y += s.enemy.vy * dt;
  s.enemy.x = clamp(s.enemy.x, 0, GAME.worldW - s.enemy.w);
  s.enemy.y = clamp(s.enemy.y, 0, GAME.worldH - s.enemy.h);
  resolveWallCollisions(s.enemy, s.walls);

  // If enemy gets wedged, bounce direction deterministically
  let enemyInside = false;
  for (const w of s.walls) {
    if (aabbIntersect(s.enemy, w)) {
      enemyInside = true;
      break;
    }
  }
  if (enemyInside) {
    s.enemy.x = ex0;
    s.enemy.y = ey0;
    const flip = s.rng() < 0.5 ? -1 : 1;
    s.enemy.dirX = clamp(-s.enemy.dirX * flip, -1, 1);
    s.enemy.dirY = clamp(-s.enemy.dirY * -flip, -1, 1);
  }

  // Lose: enemy touches player
  if (aabbIntersect(s.player, s.enemy)) {
    s.status = 'lost';
    s.reason = 'caught';
  }

  // Win: player reaches exit
  if (s.status === 'playing' && aabbIntersect(s.player, s.exit)) {
    s.status = 'won';
    s.reason = 'escaped';
  }

  return s;
}
