import { GAME } from "./constants.js";
import { movementIntent } from "./input.js";
import { resolveActorVsWalls, actorAabb, tileCenterToAabb, rectsOverlap } from "./collision.js";
import { computeEnemyMove } from "./enemy.js";

export function stepGame(state, input, dtMs) {
  state.timeMs += dtMs;

  if (state.outcome !== "playing") return;

  const dtSec = dtMs / 1000;
  const move = movementIntent(input);
  const nextPlayer = {
    x: state.player.pos.x + move.x * GAME.playerSpeedTilesPerSec * dtSec,
    y: state.player.pos.y + move.y * GAME.playerSpeedTilesPerSec * dtSec
  };
  state.player.pos = resolveActorVsWalls(state.level, state.player, nextPlayer);

  const nextEnemy = computeEnemyMove(
    state.level,
    state.enemy,
    state.player,
    GAME.enemySpeedTilesPerSec,
    dtSec
  );
  state.enemy.pos = nextEnemy;

  const playerBox = actorAabb(state.player);
  const enemyBox = actorAabb(state.enemy);
  if (rectsOverlap(playerBox, enemyBox)) {
    state.outcome = "lost";
    return;
  }

  const goalBox = tileCenterToAabb(state.level.goal, 1);
  if (rectsOverlap(playerBox, goalBox)) {
    state.outcome = "won";
  }
}

