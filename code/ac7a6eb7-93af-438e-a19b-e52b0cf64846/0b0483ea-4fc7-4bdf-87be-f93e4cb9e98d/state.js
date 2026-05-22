import { createLevel } from "./level.js";

export function createActor(pos) {
  return {
    pos: { x: pos.x, y: pos.y },
    size: { w: 0.8, h: 0.8 }
  };
}

export function createGameState() {
  const level = createLevel();
  const player = createActor(level.spawn);
  const enemy = createActor(level.enemySpawn);
  return {
    level,
    player,
    enemy,
    outcome: "playing", // playing | won | lost
    timeMs: 0
  };
}

export function resetGameState(state) {
  const next = createGameState();
  state.level = next.level;
  state.player = next.player;
  state.enemy = next.enemy;
  state.outcome = next.outcome;
  state.timeMs = next.timeMs;
}

