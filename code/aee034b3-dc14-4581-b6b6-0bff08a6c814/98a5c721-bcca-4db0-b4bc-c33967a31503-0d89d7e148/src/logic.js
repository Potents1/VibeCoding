import { parseMap, DEFAULT_MAP_LINES } from './map.js';
import { moveWithCollisions } from './physics/collision.js';

const TAU = Math.PI * 2;

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function normAngle(a) {
  let x = a % TAU;
  if (x < -Math.PI) x += TAU;
  if (x > Math.PI) x -= TAU;
  return x;
}

function distSq(ax, ay, bx, by) {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

// DDA raycast against grid. Returns distance, hit position, and hit side.
export function castRay(state, ox, oy, angle, maxDist = 20) {
  const map = state.map;
  const dirX = Math.cos(angle);
  const dirY = Math.sin(angle);

  let mapX = Math.floor(ox);
  let mapY = Math.floor(oy);

  const deltaDistX = Math.abs(1 / (dirX === 0 ? 1e-9 : dirX));
  const deltaDistY = Math.abs(1 / (dirY === 0 ? 1e-9 : dirY));

  let stepX = 0;
  let stepY = 0;
  let sideDistX = 0;
  let sideDistY = 0;

  if (dirX < 0) {
    stepX = -1;
    sideDistX = (ox - mapX) * deltaDistX;
  } else {
    stepX = 1;
    sideDistX = (mapX + 1 - ox) * deltaDistX;
  }

  if (dirY < 0) {
    stepY = -1;
    sideDistY = (oy - mapY) * deltaDistY;
  } else {
    stepY = 1;
    sideDistY = (mapY + 1 - oy) * deltaDistY;
  }

  let side = 0;
  let hit = false;

  // hard cap steps for determinism
  for (let i = 0; i < 1024; i += 1) {
    if (sideDistX < sideDistY) {
      sideDistX += deltaDistX;
      mapX += stepX;
      side = 0;
    } else {
      sideDistY += deltaDistY;
      mapY += stepY;
      side = 1;
    }

    if (mapX < 0 || mapY < 0 || mapX >= map.width || mapY >= map.height) break;
    if (map.walls.has(`${mapX},${mapY}`)) {
      hit = true;
      break;
    }

    // early break if we've exceeded maxDist
    const approxDist = Math.min(sideDistX, sideDistY);
    if (approxDist > maxDist) break;
  }

  let dist;
  if (!hit) {
    dist = maxDist;
    return { hit: false, dist, x: ox + dirX * dist, y: oy + dirY * dist, side: -1, cellX: mapX, cellY: mapY };
  }

  // perpendicular distance
  if (side === 0) dist = (mapX - ox + (1 - stepX) / 2) / (dirX === 0 ? 1e-9 : dirX);
  else dist = (mapY - oy + (1 - stepY) / 2) / (dirY === 0 ? 1e-9 : dirY);

  dist = Math.abs(dist);
  dist = clamp(dist, 0, maxDist);
  const hitX = ox + dirX * dist;
  const hitY = oy + dirY * dist;

  return { hit: true, dist, x: hitX, y: hitY, side, cellX: mapX, cellY: mapY };
}

function hasLineOfSight(state, ax, ay, bx, by) {
  const ang = Math.atan2(by - ay, bx - ax);
  const maxDist = Math.hypot(bx - ax, by - ay);
  const ray = castRay(state, ax, ay, ang, maxDist);
  // if ray hits a wall before reaching target, no LOS
  return !ray.hit || ray.dist >= maxDist - 0.05;
}

function updateEnemy(state, enemy, dt) {
  if (enemy.dead) return;
  const p = state.player;

  const toP = { x: p.x - enemy.x, y: p.y - enemy.y };
  const d = Math.hypot(toP.x, toP.y) || 1;

  const sees = d < enemy.visionRange && hasLineOfSight(state, enemy.x, enemy.y, p.x, p.y);
  enemy.seesPlayer = sees;

  // chase if sees, otherwise idle sway
  const speed = sees ? enemy.speed : enemy.speed * 0.15;
  const vx = (toP.x / d) * speed;
  const vy = (toP.y / d) * speed;

  const body = { x: enemy.x, y: enemy.y, r: enemy.r };
  moveWithCollisions(state.map, body, vx * dt, vy * dt);
  enemy.x = body.x;
  enemy.y = body.y;

  // melee damage when close and sees
  if (sees && d < 0.75) {
    enemy.attackCooldown = Math.max(0, enemy.attackCooldown - dt);
    if (enemy.attackCooldown <= 0) {
      enemy.attackCooldown = 0.65;
      state.player.hp = clamp(state.player.hp - enemy.damage, 0, state.player.maxHp);
      if (state.player.hp <= 0) {
        state.status = 'lost';
        state.statusText = 'You died. Press R to restart.';
      }
    }
  }
}

function tryShoot(state) {
  const p = state.player;
  if (state.status !== 'playing') return;
  if (p.shootCooldown > 0) return;
  p.shootCooldown = 0.25;

  // find closest enemy within a narrow FOV and LOS
  let best = null;
  for (const e of state.enemies) {
    if (e.dead) continue;
    const dx = e.x - p.x;
    const dy = e.y - p.y;
    const d = Math.hypot(dx, dy);
    if (d > p.weaponRange) continue;
    const ang = Math.atan2(dy, dx);
    const diff = Math.abs(normAngle(ang - p.angle));
    if (diff > p.weaponFov / 2) continue;
    if (!hasLineOfSight(state, p.x, p.y, e.x, e.y)) continue;
    if (!best || d < best.d) best = { e, d };
  }

  state.lastShotHit = false;
  if (best) {
    best.e.hp -= p.weaponDamage;
    state.lastShotHit = true;
    if (best.e.hp <= 0) {
      best.e.dead = true;
      best.e.hp = 0;
    }
  }

  const allDead = state.enemies.every((e) => e.dead);
  if (allDead) state.statusText = 'All enemies down. Find the exit (X).';
}

export function createGame({ mapLines = DEFAULT_MAP_LINES } = {}) {
  const parsed = parseMap(mapLines);
  const enemies = parsed.enemies.map((e, idx) => ({
    id: idx,
    x: e.x,
    y: e.y,
    r: 0.28,
    hp: 40,
    dead: false,
    speed: 1.9,
    visionRange: 7.5,
    damage: 10,
    attackCooldown: 0,
    seesPlayer: false
  }));

  return {
    map: { width: parsed.width, height: parsed.height, walls: parsed.walls, exit: parsed.exit },
    player: {
      x: parsed.player.x,
      y: parsed.player.y,
      r: 0.22,
      angle: 0,
      moveSpeed: 3.2,
      turnSpeed: 2.4,
      hp: 100,
      maxHp: 100,
      shootCooldown: 0,
      weaponDamage: 25,
      weaponRange: 6.5,
      weaponFov: (12 * Math.PI) / 180
    },
    enemies,
    time: 0,
    status: 'playing',
    statusText: 'W/S move, A/D strafe, \u2190/\u2192 or Q/E turn, Space shoot. Kill enemies then reach X.',
    lastShotHit: false,
    // rendering config
    view: { fov: (66 * Math.PI) / 180, maxDist: 18 }
  };
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

  // tick cooldowns even if ended (for deterministic tests)
  state.player.shootCooldown = Math.max(0, state.player.shootCooldown - step);

  if (state.status !== 'playing') return state;

  const p = state.player;
  const forward = (input?.forward ? 1 : 0) + (input?.back ? -1 : 0);
  const strafe = (input?.strafeRight ? 1 : 0) + (input?.strafeLeft ? -1 : 0);
  const turn = (input?.turnRight ? 1 : 0) + (input?.turnLeft ? -1 : 0);

  p.angle = normAngle(p.angle + turn * p.turnSpeed * step);

  const fx = Math.cos(p.angle);
  const fy = Math.sin(p.angle);
  const rx = Math.cos(p.angle + Math.PI / 2);
  const ry = Math.sin(p.angle + Math.PI / 2);

  const dx = (fx * forward + rx * strafe) * p.moveSpeed * step;
  const dy = (fy * forward + ry * strafe) * p.moveSpeed * step;

  moveWithCollisions(state.map, p, dx, dy);

  if (input?.shootPressed) tryShoot(state);

  for (const e of state.enemies) updateEnemy(state, e, step);

  // win: all enemies dead AND close to exit
  const exit = state.map.exit;
  const allDead = state.enemies.every((e) => e.dead);
  if (allDead && distSq(p.x, p.y, exit.x, exit.y) < 0.32 * 0.32) {
    state.status = 'won';
    state.statusText = 'Escaped! Press R to play again.';
  }

  return state;
}

// --- deterministic simulation helpers for tests ---
export function simulateRaycastHit() {
  const s = createGame();
  const r = castRay(s, s.player.x, s.player.y, 0, 20);
  return { hit: r.hit, dist: r.dist };
}

export function simulateMoveIntoWall() {
  const s = createGame();
  const startX = s.player.x;
  // face left (pi)
  s.player.angle = Math.PI;
  for (let i = 0; i < 120; i += 1) stepGame(s, { forward: true }, 1 / 60);
  return { startX, endX: s.player.x };
}

export function simulateShootKillsEnemy() {
  const s = createGame();
  const e = s.enemies.find((x) => !x.dead);
  // place enemy in front with clear LOS
  s.player.x = 2.5;
  s.player.y = 1.5;
  s.player.angle = 0;
  e.x = 4.2;
  e.y = 1.5;
  e.hp = 40;
  // shoot twice
  stepGame(s, { shootPressed: true }, 1 / 60);
  stepGame(s, {}, 0.3);
  stepGame(s, { shootPressed: true }, 1 / 60);
  return { dead: e.dead, hp: e.hp, lastShotHit: s.lastShotHit };
}

export function simulateLoss() {
  const s = createGame();
  const e = s.enemies[0];
  // put enemy next to player with LOS
  e.x = s.player.x + 0.2;
  e.y = s.player.y;
  for (let i = 0; i < 120; i += 1) {
    stepGame(s, {}, 1 / 60);
    if (s.status === 'lost') break;
  }
  return s.status;
}

export function simulateWin() {
  const s = createGame();
  // kill all enemies instantly
  for (const e of s.enemies) {
    e.dead = true;
    e.hp = 0;
  }
  // move player to exit
  s.player.x = s.map.exit.x;
  s.player.y = s.map.exit.y;
  stepGame(s, {}, 1 / 60);
  return s.status;
}

export function simulateEnemyLineOfSightBlocked() {
  const s = createGame();
  const e = s.enemies[0];
  // place player behind a wall relative to enemy
  e.x = 7.5;
  e.y = 3.5;
  s.player.x = 6.5;
  s.player.y = 1.5;
  // there is a wall column at x=6? map has # at (6,1) due to '#P....#'
  stepGame(s, {}, 1 / 60);
  return e.seesPlayer;
}
