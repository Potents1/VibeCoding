import { createWorld } from './grid_world.js';
import { computeEnemyStep } from './grid_ai.js';
import { createRng } from './rng.js';

function samePos(a, b) {
  return a.x === b.x && a.y === b.y;
}

function clampInt(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n)) | 0;
}

function tryMove(world, pos, dx, dy) {
  const nx = clampInt(pos.x + dx, 0, world.w - 1);
  const ny = clampInt(pos.y + dy, 0, world.h - 1);
  if (world.tiles[ny][nx] === 1) return pos;
  return { x: nx, y: ny };
}

export function createGame({ seed = 1 } = {}) {
  const rng = createRng(seed);
  const world = createWorld();
  const game = {
    rng,
    world,
    status: 'playing',
    player: { x: 1, y: 1 },
    enemy: { x: world.w - 2, y: 1 },
    goal: { x: world.w - 2, y: world.h - 2 },
    _enemyAccumMs: 0
  };

  // Deterministic variety: with 50% probability, swap enemy/goal corners.
  if (rng.int(0, 1) === 1) {
    game.enemy = { x: world.w - 2, y: world.h - 2 };
    game.goal = { x: world.w - 2, y: 1 };
  }

  return game;
}

export function resetGame(game) {
  const seed = game.rng.seed;
  const fresh = createGame({ seed });
  game.world = fresh.world;
  game.status = fresh.status;
  game.player = fresh.player;
  game.enemy = fresh.enemy;
  game.goal = fresh.goal;
  game._enemyAccumMs = 0;
}

export function stepGame(game, dtMs, input) {
  if (game.status !== 'playing') return;

  const dx = (input?.right ? 1 : 0) - (input?.left ? 1 : 0);
  const dy = (input?.down ? 1 : 0) - (input?.up ? 1 : 0);

  if (dx !== 0 || dy !== 0) {
    const stepX = dx !== 0 ? Math.sign(dx) : 0;
    const stepY = dy !== 0 ? Math.sign(dy) : 0;
    game.player = tryMove(game.world, game.player, stepX, stepY);
  }

  if (samePos(game.player, game.goal)) {
    game.status = 'won';
    return;
  }

  game._enemyAccumMs += Math.max(0, dtMs);
  while (game._enemyAccumMs >= 200) {
    game._enemyAccumMs -= 200;
    game.enemy = computeEnemyStep(game.world, game.enemy, game.player);
    if (samePos(game.enemy, game.player)) {
      game.status = 'lost';
      return;
    }
  }
}

