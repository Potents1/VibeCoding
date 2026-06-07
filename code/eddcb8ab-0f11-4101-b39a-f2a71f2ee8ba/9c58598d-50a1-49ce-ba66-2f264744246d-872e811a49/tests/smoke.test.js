import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createGame, isBlocked, movePlayer, render, run, tickGame } from '../src/main.js';

const level = [
  '#####',
  '#PC.#',
  '#.#E#',
  '#H..#',
  '#####',
];

const game = createGame(level);

assert.deepEqual(run(), {
  ok: true,
  width: 14,
  height: 12,
  charges: 3,
  drones: 1,
  status: 'playing',
});

assert.equal(game.charges.size, 1);
assert.equal(isBlocked(game, 0, 0), true);
assert.equal(isBlocked(game, 2, 1), false);

movePlayer(game, 'left');
assert.deepEqual(game.player, { x: 1, y: 1 }, 'walls block movement');
assert.equal(game.moves, 0, 'blocked movement does not count');

movePlayer(game, 'right');
assert.equal(game.charges.size, 0, 'charge is collected on contact');
assert.equal(game.moves, 1);

movePlayer(game, 'right');
movePlayer(game, 'down');
assert.equal(game.status, 'won', 'exit completes level after all charges');

const hazardGame = createGame(level);
movePlayer(hazardGame, 'down');
movePlayer(hazardGame, 'down');
assert.equal(hazardGame.status, 'lost', 'hazards end the run');

const patrolLevel = [
  '#######',
  '#P..D.#',
  '#.###.#',
  '#.....#',
  '#######',
];
const patrolGame = createGame(patrolLevel);
tickGame(patrolGame);
assert.deepEqual(patrolGame.drones[0], { x: 3, y: 1 }, 'drone advances toward the player on tick');
assert.equal(patrolGame.ticks, 1);

const blockedPatrolLevel = [
  '#######',
  '#P##D.#',
  '#...#.#',
  '#######',
];
const blockedPatrolGame = createGame(blockedPatrolLevel);
tickGame(blockedPatrolGame);
assert.deepEqual(blockedPatrolGame.drones[0], { x: 4, y: 1 }, 'drone stays put when direct routes are blocked');

const caughtGame = createGame([
  '#####',
  '#PD.#',
  '#...#',
  '#####',
]);
tickGame(caughtGame);
assert.equal(caughtGame.status, 'lost', 'drone collision ends the run');

const calls = [];
const ctx = {
  clearRect: (...args) => calls.push(['clearRect', ...args]),
  fillRect: (...args) => calls.push(['fillRect', ...args]),
  beginPath: () => calls.push(['beginPath']),
  arc: (...args) => calls.push(['arc', ...args]),
  fill: () => calls.push(['fill']),
  set fillStyle(value) {
    calls.push(['fillStyle', value]);
  },
};

render(createGame(level), ctx);
assert.ok(calls.some((call) => call[0] === 'clearRect'), 'render clears the canvas');
assert.ok(calls.some((call) => call[0] === 'arc'), 'render draws actors and items');

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
assert.match(html, /<canvas[^>]+id="game-canvas"/, 'entrypoint includes the game canvas');
assert.match(html, /type="module" src="\.\/src\/main\.js"/, 'entrypoint loads the game module');
