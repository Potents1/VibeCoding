const TAU = Math.PI * 2;

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

export function normAngle(a) {
  let x = a % TAU;
  if (x < -Math.PI) x += TAU;
  if (x > Math.PI) x -= TAU;
  return x;
}

// DDA raycast against grid. state.map must have width,height,walls:Set of "x,y".
export function castRay(state, ox, oy, angle, maxDist = 20) {
  const map = state.map;
  const dirX = Math.cos(angle);
  const dirY = Math.sin(angle);

  let mapX = Math.floor(ox);
  let mapY = Math.floor(oy);

  const deltaDistX = Math.abs(1 / (dirX === 0 ? 1e-9 : dirX));
  const deltaDistY = Math.abs(1 / (dirY === 0 ? 1e-9 : dirY));

  let stepX = 0;
  let stepY = 0;
  let sideDistX = 0;
  let sideDistY = 0;

  if (dirX < 0) {
    stepX = -1;
    sideDistX = (ox - mapX) * deltaDistX;
  } else {
    stepX = 1;
    sideDistX = (mapX + 1 - ox) * deltaDistX;
  }

  if (dirY < 0) {
    stepY = -1;
    sideDistY = (oy - mapY) * deltaDistY;
  } else {
    stepY = 1;
    sideDistY = (mapY + 1 - oy) * deltaDistY;
  }

  let side = 0;
  let hit = false;

  for (let i = 0; i < 1024; i += 1) {
    if (sideDistX < sideDistY) {
      sideDistX += deltaDistX;
      mapX += stepX;
      side = 0;
    } else {
      sideDistY += deltaDistY;
      mapY += stepY;
      side = 1;
    }

    if (mapX < 0 || mapY < 0 || mapX >= map.width || mapY >= map.height) break;
    if (map.walls.has(`${mapX},${mapY}`)) {
      hit = true;
      break;
    }

    const approxDist = Math.min(sideDistX, sideDistY);
    if (approxDist > maxDist) break;
  }

  let dist;
  if (!hit) {
    dist = maxDist;
    return { hit: false, dist, x: ox + dirX * dist, y: oy + dirY * dist, side: -1, cellX: mapX, cellY: mapY };
  }

  if (side === 0) dist = (mapX - ox + (1 - stepX) / 2) / (dirX === 0 ? 1e-9 : dirX);
  else dist = (mapY - oy + (1 - stepY) / 2) / (dirY === 0 ? 1e-9 : dirY);

  dist = Math.abs(dist);
  dist = clamp(dist, 0, maxDist);
  const hitX = ox + dirX * dist;
  const hitY = oy + dirY * dist;

  return { hit: true, dist, x: hitX, y: hitY, side, cellX: mapX, cellY: mapY };
}

export function hasLineOfSight(state, ax, ay, bx, by) {
  const ang = Math.atan2(by - ay, bx - ax);
  const maxDist = Math.hypot(bx - ax, by - ay);
  const ray = castRay(state, ax, ay, ang, maxDist);
  return !ray.hit || ray.dist >= maxDist - 0.05;
}
