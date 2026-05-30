import test from "node:test";
import assert from "node:assert/strict";
import {
  createGame,
  createDefaultLevel,
  stepGame,
  queueInput,
  tryMove,
  INPUT,
  GAME_STATUS
} from "../src/game.js";

test("player movement is blocked by walls", () => {
  const level = createDefaultLevel();
  const state = createGame({ seed: 1, level });

  // Move into the border wall (0,2) from start (2,2) requires two left moves.
  queueInput(state, INPUT.left);
  stepGame(state);
  assert.equal(state.player.x, 1);

  queueInput(state, INPUT.left);
  stepGame(state);
  // (0,2) is a border wall, so player should remain at x=1.
  assert.equal(state.player.x, 1);
  assert.equal(state.status, GAME_STATUS.playing);
});

test("enemy step happens every other tick", () => {
  const level = createDefaultLevel();
  const state = createGame({ seed: 1337, level });

  const before = state.enemies.map((e) => ({ x: e.x, y: e.y }));

  // Tick 1: enemies should not move.
  stepGame(state);
  const after1 = state.enemies.map((e) => ({ x: e.x, y: e.y }));
  assert.deepEqual(after1, before);

  // Tick 2: enemies should move (unless completely stuck, which this level prevents).
  stepGame(state);
  const after2 = state.enemies.map((e) => ({ x: e.x, y: e.y }));
  assert.notDeepEqual(after2, before);
});

test("collision with an enemy loses the game", () => {
  const level = createDefaultLevel();
  const state = createGame({ seed: 5, level });

  // Force an enemy onto the player.
  state.enemies[0].x = state.player.x;
  state.enemies[0].y = state.player.y;

  stepGame(state);
  assert.equal(state.status, GAME_STATUS.lost);
});

test("reaching the goal wins the game", () => {
  const level = createDefaultLevel();
  const state = createGame({ seed: 10, level });

  // Put player adjacent to goal and step into it.
  state.player.x = level.goal.x - 1;
  state.player.y = level.goal.y;

  queueInput(state, INPUT.right);
  stepGame(state);

  assert.equal(state.player.x, level.goal.x);
  assert.equal(state.player.y, level.goal.y);
  assert.equal(state.status, GAME_STATUS.won);
});

test("tryMove blocks walls deterministically", () => {
  const level = createDefaultLevel();
  const entity = { x: 2, y: 3 };

  // (2,3) is on a horizontal wall segment; moving onto it should be blocked.
  // From (2,2) moving down would attempt to enter (2,3).
  const mover = { x: 2, y: 2 };
  const moved = tryMove(level, mover, 0, 1);
  assert.equal(moved, false);
  assert.deepEqual(mover, { x: 2, y: 2 });

  // Sanity: original entity coords still match.
  assert.deepEqual(entity, { x: 2, y: 3 });
});
