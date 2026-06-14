import assert from 'node:assert/strict';
import { beginInput, createGame, handlePad, resetGame, startRound } from '../src/gameState.js';

const game = createGame(123);
const first = startRound(game);
assert.equal(game.mode, 'showing');
assert.equal(game.round, 1);
assert.equal(game.sequence.length, 1);

beginInput(game);
assert.equal(game.mode, 'input');
assert.match(game.status, /Repeat 1 signal/);

const win = handlePad(game, first);
assert.equal(win.result, 'won');
assert.equal(game.score, 10);
assert.equal(game.best, 10);
assert.equal(game.mode, 'won');

startRound(game);
beginInput(game);
const wrongPad = (game.sequence[0] + 1) % 4;
const loss = handlePad(game, wrongPad);
assert.equal(loss.result, 'lost');
assert.equal(game.mode, 'lost');
assert.equal(game.best, 10);

resetGame(game, 123);
assert.equal(game.mode, 'idle');
assert.equal(game.score, 0);
assert.equal(game.round, 0);
assert.equal(game.best, 10);

console.log('UNIT_GAME_OK');
