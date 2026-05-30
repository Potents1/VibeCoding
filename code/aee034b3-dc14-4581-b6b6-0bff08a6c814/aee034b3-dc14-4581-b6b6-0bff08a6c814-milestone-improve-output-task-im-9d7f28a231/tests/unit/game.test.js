import { describe, expect, test } from 'vitest';
import { createGame, stepGame } from '../../src/game.js';

function runFor(state, seconds, input = { x: 0, y: 0 }, step = 1 / 60) {
  const steps = Math.ceil(seconds / step);
  for (let i = 0; i < steps; i++) {
    stepGame(state, input, step);
    if (state.status !== 'playing') break;
  }
  return state;
}

describe('game loop touchpoints', () => {
  test('starts in playing state', () => {
    const g = createGame({ seed: 1 });
    expect(g.status).toBe('playing');
    expect(g.player).toBeTruthy();
    expect(g.enemy).toBeTruthy();
    expect(g.exit).toBeTruthy();
    expect(Array.isArray(g.walls)).toBe(true);
    expect(g.walls.length).toBeGreaterThan(0);
  });

  test('player movement responds to input', () => {
    const g = createGame({ seed: 2 });
    const x0 = g.player.x;
    runFor(g, 0.5, { x: 1, y: 0 });
    expect(g.player.x).toBeGreaterThan(x0);
  });

  test('walls block player', () => {
    const g = createGame({ seed: 3 });
    // Push into the left border wall
    runFor(g, 0.3, { x: -1, y: 0 });
    expect(g.player.x).toBeGreaterThanOrEqual(0);
  });

  test('enemy moves toward player over time', () => {
    const g = createGame({ seed: 4 });
    const dx0 = (g.enemy.x + g.enemy.w / 2) - (g.player.x + g.player.w / 2);
    runFor(g, 1.2, { x: 0, y: 0 });
    const dx1 = (g.enemy.x + g.enemy.w / 2) - (g.player.x + g.player.w / 2);
    expect(Math.abs(dx1)).toBeLessThan(Math.abs(dx0));
  });

  test('lose condition triggers when enemy touches player', () => {
    const g = createGame({ seed: 5 });
    // Teleport enemy onto player to deterministically trigger loss
    g.enemy.x = g.player.x;
    g.enemy.y = g.player.y;
    stepGame(g, { x: 0, y: 0 }, 1 / 60);
    expect(g.status).toBe('lost');
    expect(g.reason).toBe('caught');
  });

  test('win condition triggers when player reaches exit', () => {
    const g = createGame({ seed: 6 });
    g.player.x = g.exit.x;
    g.player.y = g.exit.y;
    stepGame(g, { x: 0, y: 0 }, 1 / 60);
    expect(g.status).toBe('won');
    expect(g.reason).toBe('escaped');
  });
});
