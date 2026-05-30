import { describe, it, expect } from 'vitest';
import { createWorld } from '../../src/world.js';
import { isIntersectingAABB } from '../../src/physics.js';

describe('game rules', () => {
  it('win triggers when touching goal', () => {
    const world = createWorld();
    const player = { x: world.goal.x + 2, y: world.goal.y + 2, w: 10, h: 10 };
    expect(isIntersectingAABB(player, world.goal)).toBe(true);
  });

  it('lose triggers when touching drone', () => {
    const player = { x: 100, y: 100, w: 20, h: 20 };
    const drone = { x: 110, y: 110, w: 20, h: 20 };
    expect(isIntersectingAABB(player, drone)).toBe(true);
  });
});
