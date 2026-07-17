const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d", { alpha: false });
const statusEl = document.getElementById("status");
const healthEl = document.getElementById("health");
const scoreEl = document.getElementById("score");
const ammoEl = document.getElementById("ammo");
const restartBtn = document.getElementById("restart-btn");

const TILE = 64;
const FOV = Math.PI / 3;
const MOVE_SPEED = 2.7;
const TURN_SPEED = 2.2;
const ENEMY_ATTACK_RANGE = 0.85;
const ENEMY_HIT_CONE = 0.08;
const ENEMY_HIT_RANGE = 7;

const sourceAttribution = [
  "OpenGameArt CC0 reference: LAB textures",
  "OpenGameArt CC0 reference: ugly 64x64 texture+sprites pack",
  "OpenGameArt CC0 reference: Old school fps wall textures",
];

const externalTextureSources = {
  wall: "assets/external/lab-textures/extracted/LAB/wall/tile065.png",
  door: "assets/external/lab-textures/extracted/LAB/door/door_blue.png",
  floor: "assets/external/ugly-64x64-texture-sprites-pack/extracted/donjon/floor.bmp",
  ceiling: "assets/external/ugly-64x64-texture-sprites-pack/extracted/donjon/ceiling.bmp",
  enemy: "assets/external/ugly-64x64-texture-sprites-pack/extracted/object/skullgun.png",
};

const baseMap = [
  "###############",
  "#.............#",
  "#..##.........#",
  "#......#..G...#",
  "#......#......#",
  "#..G...#..##..#",
  "#......D......#",
  "#......#......#",
  "#..##.....G...#",
  "#.............#",
  "###############",
];

const initialEnemies = [
  { x: 11.45, y: 3.45 },
  { x: 4.55, y: 5.55 },
  { x: 10.55, y: 8.55 },
];

let worldMap = baseMap.map((row) => row.split(""));
let lastTime = performance.now();

const keys = new Set();
const player = {
  x: 2.45,
  y: 2.45,
  angle: 0,
  health: 100,
  score: 0,
  ammo: 18,
  won: false,
  lost: false,
};
const enemies = [];
const zBuffer = [];
const textures = createTextures();

function loadImageTexture(src) {
  return new Promise((resolve) => {
    if (typeof Image === "undefined") {
      resolve(null);
      return;
    }
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

async function loadExternalTextureOverrides() {
  const entries = await Promise.all(
    Object.entries(externalTextureSources).map(async ([key, src]) => [key, await loadImageTexture(src)])
  );
  for (const [key, image] of entries) {
    if (image) textures[key] = image;
  }
  sourceAttribution.push("Runtime loaded downloaded CC0 graphics from assets/external");
  render();
}

function createPixelCanvas(width, height, painter) {
  const texture = document.createElement("canvas");
  texture.width = width;
  texture.height = height;
  const textureCtx = texture.getContext("2d");
  textureCtx.imageSmoothingEnabled = false;
  painter(textureCtx, width, height);
  return texture;
}

function createTextures() {
  const wall = createPixelCanvas(TILE, TILE, (g) => {
    g.fillStyle = "#7f6c56";
    g.fillRect(0, 0, TILE, TILE);
    for (let y = 0; y < TILE; y += 16) {
      for (let x = (y / 16) % 2 ? -16 : 0; x < TILE; x += 32) {
        g.fillStyle = "#9b8467";
        g.fillRect(x + 1, y + 1, 30, 14);
        g.fillStyle = "#58493a";
        g.fillRect(x, y + 15, 32, 2);
        g.fillRect(x + 31, y, 2, 16);
      }
    }
    g.fillStyle = "rgba(30, 22, 16, 0.32)";
    for (let x = 6; x < TILE; x += 17) g.fillRect(x, 0, 3, TILE);
  });

  const door = createPixelCanvas(TILE, TILE, (g) => {
    g.fillStyle = "#4d3424";
    g.fillRect(0, 0, TILE, TILE);
    g.fillStyle = "#765038";
    for (let x = 6; x < TILE; x += 14) g.fillRect(x, 0, 7, TILE);
    g.fillStyle = "#2c1d14";
    g.fillRect(28, 0, 8, TILE);
    g.fillStyle = "#d1b16d";
    g.fillRect(43, 29, 7, 7);
  });

  const banner = createPixelCanvas(TILE, TILE, (g) => {
    g.fillStyle = "#6f5f4d";
    g.fillRect(0, 0, TILE, TILE);
    g.fillStyle = "#4b1618";
    g.fillRect(14, 5, 36, 54);
    g.fillStyle = "#d8c28c";
    g.fillRect(26, 15, 12, 34);
    g.fillRect(18, 26, 28, 10);
    g.fillStyle = "rgba(0,0,0,0.28)";
    g.fillRect(0, 56, TILE, 8);
  });

  const floor = createPixelCanvas(TILE, TILE, (g) => {
    g.fillStyle = "#46413a";
    g.fillRect(0, 0, TILE, TILE);
    for (let y = 0; y < TILE; y += 16) {
      for (let x = 0; x < TILE; x += 16) {
        g.fillStyle = (x + y) % 32 === 0 ? "#5d564b" : "#34302b";
        g.fillRect(x, y, 15, 15);
      }
    }
  });

  const ceiling = createPixelCanvas(TILE, TILE, (g) => {
    g.fillStyle = "#23272c";
    g.fillRect(0, 0, TILE, TILE);
    g.fillStyle = "#303942";
    for (let y = 0; y < TILE; y += 8) g.fillRect(0, y, TILE, 1);
    for (let x = 0; x < TILE; x += 16) g.fillRect(x, 0, 1, TILE);
  });

  const enemy = createPixelCanvas(64, 96, (g) => {
    g.clearRect(0, 0, 64, 96);
    g.fillStyle = "#1d201d";
    g.fillRect(23, 30, 18, 42);
    g.fillStyle = "#667450";
    g.fillRect(14, 18, 36, 30);
    g.fillStyle = "#c6a57a";
    g.fillRect(24, 8, 16, 15);
    g.fillStyle = "#2b211a";
    g.fillRect(22, 5, 20, 8);
    g.fillStyle = "#111111";
    g.fillRect(27, 14, 3, 3);
    g.fillRect(36, 14, 3, 3);
    g.fillStyle = "#363a34";
    g.fillRect(8, 38, 16, 8);
    g.fillRect(40, 38, 16, 8);
    g.fillStyle = "#2d2a26";
    g.fillRect(18, 72, 10, 18);
    g.fillRect(36, 72, 10, 18);
    g.fillStyle = "#111111";
    g.fillRect(16, 89, 13, 5);
    g.fillRect(35, 89, 13, 5);
  });

  return { wall, door, banner, floor, ceiling, enemy };
}

function resetGame() {
  worldMap = baseMap.map((row) => row.split(""));
  Object.assign(player, { x: 2.45, y: 2.45, angle: 0, health: 100, score: 0, ammo: 18, won: false, lost: false });
  enemies.splice(0, enemies.length, ...initialEnemies.map((enemy, index) => ({ ...enemy, id: index, alive: true, cooldown: 0 })));
  statusEl.textContent = "Find the guards";
  updateHud();
  canvas.focus();
}

function cellAt(x, y) {
  const row = worldMap[Math.floor(y)];
  return row ? row[Math.floor(x)] || "#" : "#";
}

function isBlocking(x, y) {
  const cell = cellAt(x, y);
  return cell === "#" || cell === "D";
}

function setCell(x, y, value) {
  if (worldMap[y] && worldMap[y][x]) worldMap[y][x] = value;
}

function normalizeAngle(angle) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

function castRay(angle) {
  const rayDirX = Math.cos(angle);
  const rayDirY = Math.sin(angle);
  let mapX = Math.floor(player.x);
  let mapY = Math.floor(player.y);
  const deltaDistX = Math.abs(1 / (rayDirX || 0.0001));
  const deltaDistY = Math.abs(1 / (rayDirY || 0.0001));
  const stepX = rayDirX < 0 ? -1 : 1;
  const stepY = rayDirY < 0 ? -1 : 1;
  let sideDistX = rayDirX < 0 ? (player.x - mapX) * deltaDistX : (mapX + 1 - player.x) * deltaDistX;
  let sideDistY = rayDirY < 0 ? (player.y - mapY) * deltaDistY : (mapY + 1 - player.y) * deltaDistY;
  let side = 0;

  for (let i = 0; i < 64; i += 1) {
    if (sideDistX < sideDistY) {
      sideDistX += deltaDistX;
      mapX += stepX;
      side = 0;
    } else {
      sideDistY += deltaDistY;
      mapY += stepY;
      side = 1;
    }
    const cell = cellAt(mapX, mapY);
    if (cell === "#" || cell === "D" || cell === "G") {
      const distance = side === 0 ? (mapX - player.x + (1 - stepX) / 2) / rayDirX : (mapY - player.y + (1 - stepY) / 2) / rayDirY;
      const hitX = player.x + rayDirX * distance;
      const hitY = player.y + rayDirY * distance;
      const wallX = side === 0 ? hitY - Math.floor(hitY) : hitX - Math.floor(hitX);
      return { distance: Math.max(0.0001, distance), cell, side, wallX, mapX, mapY };
    }
  }

  return { distance: 32, cell: "#", side: 0, wallX: 0, mapX, mapY };
}

function move(amount) {
  const nextX = player.x + Math.cos(player.angle) * amount;
  const nextY = player.y + Math.sin(player.angle) * amount;
  if (!isBlocking(nextX, player.y)) player.x = nextX;
  if (!isBlocking(player.x, nextY)) player.y = nextY;
}

function strafe(amount) {
  const nextX = player.x + Math.cos(player.angle + Math.PI / 2) * amount;
  const nextY = player.y + Math.sin(player.angle + Math.PI / 2) * amount;
  if (!isBlocking(nextX, player.y)) player.x = nextX;
  if (!isBlocking(player.x, nextY)) player.y = nextY;
}

function openDoor() {
  const x = Math.floor(player.x + Math.cos(player.angle) * 1.1);
  const y = Math.floor(player.y + Math.sin(player.angle) * 1.1);
  if (cellAt(x, y) === "D") {
    setCell(x, y, ".");
    statusEl.textContent = "Door opened";
    return true;
  }
  statusEl.textContent = "No door ahead";
  return false;
}

function hasLineOfSight(enemy) {
  const angle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
  const wall = castRay(angle);
  return wall.distance + 0.2 >= Math.hypot(enemy.x - player.x, enemy.y - player.y);
}

function shoot() {
  if (player.lost || player.won) return false;
  if (player.ammo <= 0) {
    statusEl.textContent = "Out of ammo";
    return false;
  }

  player.ammo -= 1;
  const target = enemies
    .filter((enemy) => enemy.alive)
    .map((enemy) => ({
      enemy,
      distance: Math.hypot(enemy.x - player.x, enemy.y - player.y),
      angle: Math.abs(normalizeAngle(Math.atan2(enemy.y - player.y, enemy.x - player.x) - player.angle)),
    }))
    .filter((candidate) => candidate.distance <= ENEMY_HIT_RANGE && candidate.angle < ENEMY_HIT_CONE && hasLineOfSight(candidate.enemy))
    .sort((a, b) => a.distance - b.distance)[0];

  if (target) {
    target.enemy.alive = false;
    player.score += 100;
    statusEl.textContent = "Guard down";
  } else {
    statusEl.textContent = "Shot missed";
  }
  updateHud();
  return Boolean(target);
}

function update(dt = 0) {
  if (player.lost || player.won) return;
  if (keys.has("ArrowLeft")) player.angle -= TURN_SPEED * dt;
  if (keys.has("ArrowRight")) player.angle += TURN_SPEED * dt;
  if (keys.has("KeyW") || keys.has("ArrowUp")) move(MOVE_SPEED * dt);
  if (keys.has("KeyS") || keys.has("ArrowDown")) move(-MOVE_SPEED * dt);
  if (keys.has("KeyA")) strafe(-MOVE_SPEED * 0.72 * dt);
  if (keys.has("KeyD")) strafe(MOVE_SPEED * 0.72 * dt);

  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    enemy.cooldown = Math.max(0, enemy.cooldown - dt);
    const distance = Math.hypot(enemy.x - player.x, enemy.y - player.y);
    if (distance < ENEMY_ATTACK_RANGE && enemy.cooldown <= 0) {
      player.health = Math.max(0, player.health - 8);
      enemy.cooldown = 0.75;
      statusEl.textContent = player.health <= 0 ? "Lost" : "Under attack";
    }
  }

  if (player.health <= 0) {
    player.lost = true;
    statusEl.textContent = "Lost";
  } else if (enemies.every((enemy) => !enemy.alive)) {
    player.won = true;
    player.score += 500;
    statusEl.textContent = "Won";
  }
  updateHud();
}

function textureFor(cell) {
  if (cell === "D") return textures.door;
  if (cell === "G") return textures.banner;
  return textures.wall;
}

function drawTextureColumn(texture, sx, dx, top, height, shade) {
  ctx.drawImage(texture, sx, 0, 1, TILE, dx, top, 1, height);
  if (shade > 0) {
    ctx.fillStyle = `rgba(0, 0, 0, ${shade})`;
    ctx.fillRect(dx, top, 1, height);
  }
}

function drawFloorAndCeiling(width, height, horizon) {
  ctx.fillStyle = "#20252b";
  ctx.fillRect(0, 0, width, horizon);
  ctx.fillStyle = "#3a342e";
  ctx.fillRect(0, horizon, width, height - horizon);

  const step = 4;
  for (let y = Math.floor(horizon); y < height; y += step) {
    const perspective = height / Math.max(1, 2 * y - height);
    const rowDistance = perspective * 0.9;
    const floorStepX = rowDistance * (Math.cos(player.angle + FOV / 2) - Math.cos(player.angle - FOV / 2)) / width;
    const floorStepY = rowDistance * (Math.sin(player.angle + FOV / 2) - Math.sin(player.angle - FOV / 2)) / width;
    let floorX = player.x + rowDistance * Math.cos(player.angle - FOV / 2);
    let floorY = player.y + rowDistance * Math.sin(player.angle - FOV / 2);

    for (let x = 0; x < width; x += step) {
      const tx = Math.abs(Math.floor((floorX * TILE) % TILE));
      const ty = Math.abs(Math.floor((floorY * TILE) % TILE));
      ctx.drawImage(textures.floor, tx, ty, 1, 1, x, y, step, step);
      ctx.drawImage(textures.ceiling, tx, ty, 1, 1, x, horizon - (y - horizon) - step, step, step);
      floorX += floorStepX * step;
      floorY += floorStepY * step;
    }
  }
}

function render() {
  const width = canvas.width;
  const height = canvas.height;
  const horizon = Math.floor(height * 0.5);
  ctx.imageSmoothingEnabled = false;
  drawFloorAndCeiling(width, height, horizon);

  for (let x = 0; x < width; x += 1) {
    const cameraX = (2 * x) / width - 1;
    const rayAngle = player.angle + Math.atan(cameraX * Math.tan(FOV / 2));
    const hit = castRay(rayAngle);
    const correctedDistance = hit.distance * Math.cos(rayAngle - player.angle);
    zBuffer[x] = correctedDistance;
    const wallHeight = Math.min(height * 1.6, height / correctedDistance);
    const top = Math.floor(horizon - wallHeight / 2);
    const sx = Math.max(0, Math.min(TILE - 1, Math.floor(hit.wallX * TILE)));
    const shade = Math.min(0.62, correctedDistance / 10 + (hit.side ? 0.14 : 0));
    drawTextureColumn(textureFor(hit.cell), sx, x, top, wallHeight, shade);
  }

  drawEnemies(width, height, horizon);
  drawWeapon(width, height);
  if (player.won || player.lost) drawEndState(width, height);
}

function drawEnemies(width, height, horizon) {
  const visible = enemies
    .filter((enemy) => enemy.alive)
    .map((enemy) => {
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      return { enemy, distance: Math.hypot(dx, dy), angle: normalizeAngle(Math.atan2(dy, dx) - player.angle) };
    })
    .filter((entry) => Math.abs(entry.angle) < FOV * 0.7 && hasLineOfSight(entry.enemy))
    .sort((a, b) => b.distance - a.distance);

  for (const entry of visible) {
    const screenX = width / 2 + Math.tan(entry.angle) * (width / 2 / Math.tan(FOV / 2));
    if (zBuffer[Math.floor(screenX)] && zBuffer[Math.floor(screenX)] < entry.distance - 0.3) continue;
    const spriteHeight = Math.min(height * 1.1, height / entry.distance);
    const spriteWidth = spriteHeight * 0.58;
    const shade = Math.min(0.55, entry.distance / 11);
    ctx.drawImage(textures.enemy, screenX - spriteWidth / 2, horizon - spriteHeight * 0.45, spriteWidth, spriteHeight);
    ctx.fillStyle = `rgba(0, 0, 0, ${shade})`;
    ctx.fillRect(screenX - spriteWidth / 2, horizon - spriteHeight * 0.45, spriteWidth, spriteHeight);
  }
}

function drawWeapon(width, height) {
  const gunX = width * 0.5;
  const gunY = height - 26;
  ctx.fillStyle = "#1c1b1a";
  ctx.fillRect(gunX - 34, gunY - 68, 68, 60);
  ctx.fillStyle = "#4b4b46";
  ctx.fillRect(gunX - 14, gunY - 106, 28, 74);
  ctx.fillStyle = "#8a8980";
  ctx.fillRect(gunX - 9, gunY - 102, 18, 58);
  ctx.fillStyle = "#111111";
  ctx.fillRect(gunX - 4, gunY - 108, 8, 18);
  ctx.fillStyle = "#6b4a2d";
  ctx.fillRect(gunX - 50, gunY - 32, 100, 28);
}

function drawEndState(width, height) {
  ctx.fillStyle = "rgba(0, 0, 0, 0.58)";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = player.won ? "#ffe09b" : "#d95545";
  ctx.font = "700 44px Trebuchet MS, Arial";
  ctx.textAlign = "center";
  ctx.fillText(player.won ? "AREA CLEARED" : "MISSION FAILED", width / 2, height / 2);
  ctx.font = "700 18px Trebuchet MS, Arial";
  ctx.fillText("Press Restart to run the corridor again", width / 2, height / 2 + 38);
}

function updateHud() {
  healthEl.textContent = String(Math.round(player.health));
  ammoEl.textContent = String(player.ammo);
  scoreEl.textContent = String(player.score);
}

function resizeCanvas() {
  const scale = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.max(320, Math.floor(rect.width * scale));
  canvas.height = Math.max(300, Math.floor(rect.height * scale));
}

function tick(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  update(dt);
  render();
  requestAnimationFrame(tick);
}

window.addEventListener("keydown", (event) => {
  keys.add(event.code);
  if (event.code === "Space") {
    event.preventDefault();
    shoot();
  }
  if (event.code === "KeyE") openDoor();
});
window.addEventListener("keyup", (event) => keys.delete(event.code));
window.addEventListener("resize", () => {
  resizeCanvas();
  render();
});
canvas.addEventListener("pointerdown", () => {
  canvas.focus();
  shoot();
});
restartBtn.addEventListener("click", resetGame);

resizeCanvas();
resetGame();
loadExternalTextureOverrides();
requestAnimationFrame(tick);

window.__wolf3dRuntime = { player, enemies, textures, zBuffer, sourceAttribution, externalTextureSources, castRay, shoot, openDoor, resetGame };

export { castRay, move, strafe, shoot, openDoor, update, render, player, enemies, textures, zBuffer, sourceAttribution, externalTextureSources };
