export function createWorld() {
  // 16x16 arena, 1=wall, 0=floor. Outer ring is walls.
  const w = 16;
  const h = 16;
  const tiles = Array.from({ length: h }, (_, y) =>
    Array.from({ length: w }, (_, x) => (x === 0 || y === 0 || x === w - 1 || y === h - 1 ? 1 : 0))
  );

  // A few fixed walls to create blocking/corridors (deterministic).
  for (let x = 2; x <= 13; x++) tiles[4][x] = 1;
  tiles[4][7] = 0;
  for (let y = 6; y <= 13; y++) tiles[y][10] = 1;
  tiles[9][10] = 0;

  for (let x = 2; x <= 9; x++) tiles[12][x] = 1;
  tiles[12][3] = 0;
  tiles[12][8] = 0;

  return { w, h, tiles };
}

