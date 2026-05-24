import { LEVEL_1 } from "./levels.js";
import { checkCollision, isGoalAt, tryMove } from "./collision.js";
import { updateGhostAI } from "./ghost_ai.js";

export const GAME_STATUS = {
  RUNNING: "running",
  WON: "won",
  LOST: "lost",
};

export function createGameState(options = {}) {
  const grid = options.grid ?? LEVEL_1;
  const player = options.player ?? { x: 1, y: 1 };
  const ghosts = options.ghosts ?? [{ x: 14, y: 13 }];
  return {
    grid,
    player: { x: player.x, y: player.y },
    ghosts: ghosts.map((g) => ({ x: g.x, y: g.y })),
    status: GAME_STATUS.RUNNING,
    ticks: 0,
  };
}

export function stepGame(state, input) {
  if (input?.restart) return createGameState({ grid: state.grid });
  if (state.status !== GAME_STATUS.RUNNING) return state;

  const dx = input?.dx ?? 0;
  const dy = input?.dy ?? 0;

  // Player first (input + collision blocking).
  if (dx !== 0 || dy !== 0) {
    const next = tryMove(state.grid, state.player, dx, dy);
    state.player.x = next.x;
    state.player.y = next.y;
  }

  // Win condition after player move.
  if (isGoalAt(state.grid, state.player.x, state.player.y)) {
    state.status = GAME_STATUS.WON;
    return state;
  }

  // Ghosts chase.
  state.ghosts = updateGhostAI(state.grid, state.ghosts, state.player);

  // Loss condition (after ghosts move).
  if (checkCollision(state.player, state.ghosts)) {
    state.status = GAME_STATUS.LOST;
    return state;
  }

  state.ticks += 1;
  return state;
}

