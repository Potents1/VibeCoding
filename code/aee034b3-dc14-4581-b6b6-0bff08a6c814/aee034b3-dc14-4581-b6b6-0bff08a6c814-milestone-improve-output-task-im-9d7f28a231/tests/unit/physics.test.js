import { describe, it, expect } from 'vitest';
import { isIntersectingAABB, resolvePlayerMovement } from '../../src/physics.js';

describe('physics', () => {
  it('detects AABB intersection', () => {
    expect(isIntersectingAABB({ x: 0, y: 0, w: 10, h: 10 }, { x: 9, y: 9, w: 10, h: 10 })).toBe(true);
    expect(isIntersectingAABB({ x: 0, y: 0, w: 10, h: 10 }, { x: 10, y: 0, w: 10, h: 10 })).toBe(false);
  });

  it('blocks movement through solids (x axis)', () => {
    const solids = [{ x: 20, y: 0, w: 10, h: 50 }];
    const bounds = { x: 0, y: 0, w: 100, h: 50 };
    const from = { x: 0, y: 10, w: 10, h: 10 };
    const to = { x: 25, y: 10, w: 10, h: 10 };

    const out = resolvePlayerMovement({ from, to, solids, bounds });
    expect(out.x).toBe(10); // flush against solid at x=20
    expect(out.y).toBe(10);
  });

  it('clamps to bounds', () => {
    const solids = [];
    const bounds = { x: 0, y: 0, w: 30, h: 30 };
    const from = { x: 10, y: 10, w: 10, h: 10 };
    const to = { x: 50, y: -10, w: 10, h: 10 };

    const out = resolvePlayerMovement({ from, to, solids, bounds });
    expect(out.x).toBe(20);
    expect(out.y).toBe(0);
  });
});
