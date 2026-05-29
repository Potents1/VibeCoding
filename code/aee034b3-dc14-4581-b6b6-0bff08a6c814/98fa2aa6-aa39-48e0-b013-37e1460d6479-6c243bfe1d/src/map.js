export const DEFAULT_MAP_LINES = [
  '################',
  '#P....#.......X#',
  '#.##..#..####..#',
  '#......E.......#',
  '#.#######.######',
  '#..............#',
  '#..####..####..#',
  '#..#........#..#',
  '#..#..E.....#..#',
  '#..####..####..#',
  '#..............#',
  '################'
];

export function parseMap(lines) {
  const height = lines.length;
  const width = lines[0]?.length ?? 0;
  const walls = new Set();
  const enemies = [];
  let player = null;
  let exit = null;

  for (let y = 0; y < height; y += 1) {
    const row = lines[y];
    if (row.length !== width) throw new Error('map must be rectangular');
    for (let x = 0; x < width; x += 1) {
      const ch = row[x];
      if (ch === '#') walls.add(`${x},${y}`);
      if (ch === 'P') player = { x: x + 0.5, y: y + 0.5, angle: 0 };
      if (ch === 'E') enemies.push({ x: x + 0.5, y: y + 0.5 });
      if (ch === 'X') exit = { x: x + 0.5, y: y + 0.5 };
    }
  }

  if (!player) throw new Error('map missing P');
  if (!exit) throw new Error('map missing X');

  return { width, height, walls, player, exit, enemies };
}

export function isWallAt(map, x, y) {
  const tx = Math.floor(x);
  const ty = Math.floor(y);
  if (tx < 0 || ty < 0 || tx >= map.width || ty >= map.height) return true;
  return map.walls.has(`${tx},${ty}`);
}
