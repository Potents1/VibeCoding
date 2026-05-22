import { WORLD } from "./constants.js";

function emptyGrid(cols, rows) {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0));
}

function boxedWalls(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  for (let x = 0; x < cols; x += 1) {
    grid[0][x] = 1;
    grid[rows - 1][x] = 1;
  }
  for (let y = 0; y < rows; y += 1) {
    grid[y][0] = 1;
    grid[y][cols - 1] = 1;
  }
}

export function createLevel() {
  const grid = emptyGrid(WORLD.cols, WORLD.rows);
  boxedWalls(grid);

  // Deterministic interior walls (tests rely on a wall at (6, 6)).
  for (let y = 3; y <= WORLD.rows - 4; y += 1) {
    grid[y][6] = 1;
  }
  for (let x = 10; x <= 20; x += 1) {
    grid[8][x] = 1;
  }
  for (let y = 10; y <= 14; y += 1) {
    grid[y][20] = 1;
  }

  const spawn = { x: 2, y: 2 };
  const enemySpawn = { x: WORLD.cols - 3, y: WORLD.rows - 3 };
  const goal = { x: WORLD.cols - 3, y: 2 };

  return { grid, spawn, enemySpawn, goal };
}

