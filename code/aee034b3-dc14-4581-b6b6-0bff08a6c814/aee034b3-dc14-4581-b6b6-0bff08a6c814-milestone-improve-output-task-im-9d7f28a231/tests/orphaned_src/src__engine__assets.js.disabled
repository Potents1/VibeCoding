function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

function clamp255(v) {
  return Math.max(0, Math.min(255, v | 0));
}

export function colorLerp(a, b, t) {
  const tt = clamp01(t);
  return {
    r: a.r + (b.r - a.r) * tt,
    g: a.g + (b.g - a.g) * tt,
    b: a.b + (b.b - a.b) * tt
  };
}

export function colorToRgb(c) {
  const r = clamp255(Math.round(c.r));
  const g = clamp255(Math.round(c.g));
  const b = clamp255(Math.round(c.b));
  return `rgb(${r},${g},${b})`;
}

export function getPalette() {
  // Single source of truth for deterministic colors.
  return {
    ceilingA: { r: 14, g: 20, b: 44 },
    ceilingB: { r: 5, g: 8, b: 20 },
    floorA: { r: 9, g: 12, b: 26 },
    floorB: { r: 2, g: 3, b: 8 },
    fog: { r: 3, g: 4, b: 10 },
    // Material base tints (procedural textures add detail on top).
    mats: [
      { r: 78, g: 102, b: 220 },
      { r: 120, g: 70, b: 220 },
      { r: 40, g: 190, b: 210 },
      { r: 90, g: 105, b: 145 }
    ],
    enemy: [
      null,
      { r: 255, g: 51, b: 85 },
      { r: 255, g: 138, b: 160 },
      { r: 232, g: 236, b: 255 },
      { r: 25, g: 28, b: 54 }
    ],
    weapon: [
      null,
      { r: 232, g: 236, b: 255 },
      { r: 167, g: 243, b: 208 },
      { r: 71, g: 230, b: 255 },
      { r: 20, g: 26, b: 54 }
    ]
  };
}

export function applyFog(pal, c, shade) {
  // shade is 0..1 where 1 is near/bright. We also mix toward fog with distance.
  const s = clamp01(shade);
  const fogT = clamp01(1 - s);
  const lit = {
    r: c.r * (0.30 + 0.70 * s),
    g: c.g * (0.30 + 0.70 * s),
    b: c.b * (0.30 + 0.70 * s)
  };
  return colorLerp(lit, pal.fog, fogT * 0.35);
}

export function materialForCell(x, y) {
  // Cheap deterministic variety.
  const v = (x * 31 + y * 17) % 4;
  return v < 0 ? v + 4 : v;
}

function texPattern(u, v, seed) {
  // Deterministic "hash" in [0,1).
  const x = Math.floor(u * 64);
  const y = Math.floor(v * 64);
  const n = (x * 374761393 + y * 668265263 + seed * 1442695041) | 0;
  // xorshift
  let t = n ^ (n >>> 13);
  t = (t * 1274126177) | 0;
  t ^= t >>> 16;
  return ((t >>> 0) % 1024) / 1024;
}

export function sampleWallTex(pal, mat, u, v, side) {
  const base = pal.mats[Math.max(0, Math.min(pal.mats.length - 1, mat | 0))] || pal.mats[0];

  // Add subtle "brick" banding and noise.
  const bands = Math.abs(Math.sin((v * 10 + (side ? 0.35 : 0)) * Math.PI));
  const grit = texPattern(u, v, mat + (side ? 11 : 3));
  const edge = Math.abs((u * 8) % 1 - 0.5) * 2; // 0 center, 1 edge

  const m = 0.70 + 0.18 * bands + 0.12 * grit;
  const e = 0.85 + 0.15 * (1 - edge);

  return { r: base.r * m * e, g: base.g * m * e, b: base.b * m * e };
}

function spriteFromAscii(rows, map) {
  const h = rows.length;
  const w = rows[0]?.length || 0;
  const pixels = new Uint8Array(w * h);
  for (let y = 0; y < h; y += 1) {
    const row = rows[y];
    for (let x = 0; x < w; x += 1) {
      const ch = row[x] || ' ';
      pixels[y * w + x] = map.get(ch) ?? 0;
    }
  }
  return { w, h, pixels };
}

let cachedEnemy = null;
export function getEnemySprite() {
  if (cachedEnemy) return cachedEnemy;
  const map = new Map([
    [' ', 0],
    ['#', 3],
    ['@', 1],
    ['+', 2],
    ['.', 4]
  ]);
  cachedEnemy = spriteFromAscii(
    [
      '   ..##..   ',
      '  .+@@@@+.  ',
      ' .+@@@@@@+. ',
      ' .@@+##+@@. ',
      ' .@@####@@. ',
      ' .@@+##+@@. ',
      ' .+@@@@@@+. ',
      '  .+@@@@+.  ',
      '   ..##..   '
    ],
    map
  );
  return cachedEnemy;
}

let cachedWeapon = null;
export function getWeaponFrames() {
  if (cachedWeapon) return cachedWeapon;

  const map = new Map([
    [' ', 0],
    ['#', 1],
    ['+', 2],
    ['@', 3],
    ['.', 4]
  ]);

  const base = [
    '                ',
    '      ..        ',
    '     .##..      ',
    '   ..####..     ',
    '  .########.    ',
    '  .###@@###.    ',
    '   .##@@##.     ',
    '    .####.      ',
    '     .##.       ',
    '      ..        '
  ];
  const kick1 = [
    '                ',
    '       ..       ',
    '     ..##..     ',
    '   ..####..     ',
    '  .########.    ',
    '  .###@@###.    ',
    '   .##@@##.     ',
    '    .####.      ',
    '     .##.       ',
    '      ..        '
  ];
  const kick2 = [
    '                ',
    '        ..      ',
    '     ..##..     ',
    '   ..####..     ',
    '  .########.    ',
    '  .###@@###.    ',
    '   .##@@##.     ',
    '    .####.      ',
    '     .##.       ',
    '      ..        '
  ];

  cachedWeapon = [spriteFromAscii(base, map), spriteFromAscii(kick1, map), spriteFromAscii(kick2, map)];
  return cachedWeapon;
}

export function paletteIndexToColor(pal, idx, { hitFlash = false } = {}) {
  const i = idx | 0;
  if (i === 0) return null;
  const c = pal.enemy[i] || pal.enemy[3];
  if (!c) return null;
  if (!hitFlash) return c;
  return colorLerp(c, { r: 255, g: 255, b: 255 }, 0.55);
}

export function weaponIndexToColor(pal, idx) {
  const i = idx | 0;
  if (i === 0) return null;
  return pal.weapon[i] || pal.weapon[1];
}

