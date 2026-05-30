function key(x, y) {
  return `${x},${y}`;
}

function findChar(lines, ch) {
  for (let y = 0; y < lines.length; y += 1) {
    const row = lines[y];
    const x = row.indexOf(ch);
    if (x !== -1) return { x, y };
  }
  return null;
}

export function parseMap(lines) {
  if (!Array.isArray(lines) || lines.length === 0) throw new Error('parseMap: lines must be a non-empty array');

  const height = lines.length;
  const width = lines[0].length;
  for (const row of lines) {
    if (typeof row !== 'string') throw new Error('parseMap: each line must be a string');
    if (row.length !== width) throw new Error('parseMap: all lines must have equal length');
  }

  const walls = new Set();
  const enemies = [];

  for (let y = 0; y < height; y += 1) {
    const row = lines[y];
    for (let x = 0; x < width; x += 1) {
      const c = row[x];
      if (c === '#') walls.add(key(x, y));
      else if (c === 'E') enemies.push({ x: x + 0.5, y: y + 0.5 });
    }
  }

  const pCell = findChar(lines, 'P') ?? { x: 1, y: 1 };
  const xCell = findChar(lines, 'X') ?? { x: width - 2, y: height - 2 };

  // Coords in tile space, centered in the cell.
  const player = { x: pCell.x + 0.5, y: pCell.y + 0.5 };
  const exit = { x: xCell.x + 0.5, y: xCell.y + 0.5 };

  return { width, height, walls, player, enemies, exit };
}

