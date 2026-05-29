import { castRay } from './raycaster.js';

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

function colorLerp(a, b, t) {
  const ar = (a >> 16) & 255;
  const ag = (a >> 8) & 255;
  const ab = a & 255;
  const br = (b >> 16) & 255;
  const bg = (b >> 8) & 255;
  const bb = b & 255;
  const rr = Math.round(ar + (br - ar) * t);
  const rg = Math.round(ag + (bg - ag) * t);
  const rb = Math.round(ab + (bb - ab) * t);
  return (rr << 16) | (rg << 8) | rb;
}

function rgb(hex) {
  const r = (hex >> 16) & 255;
  const g = (hex >> 8) & 255;
  const b = hex & 255;
  return `rgb(${r},${g},${b})`;
}

export function renderFrame(ctx, canvas, state, { minimapScale = 8 } = {}) {
  const VIEW_W = canvas.width;
  const VIEW_H = canvas.height;

  // ceiling + floor
  const ceilA = 0x0b1638;
  const ceilB = 0x040510;
  const floorA = 0x07090f;
  const floorB = 0x0b0f1f;

  for (let y = 0; y < VIEW_H / 2; y += 2) {
    const t = y / (VIEW_H / 2);
    ctx.fillStyle = rgb(colorLerp(ceilA, ceilB, t));
    ctx.fillRect(0, y, VIEW_W, 2);
  }
  for (let y = VIEW_H / 2; y < VIEW_H; y += 2) {
    const t = (y - VIEW_H / 2) / (VIEW_H / 2);
    ctx.fillStyle = rgb(colorLerp(floorA, floorB, t));
    ctx.fillRect(0, y, VIEW_W, 2);
  }

  const p = state.player;
  const fov = state.view.fov;
  const maxDist = state.view.maxDist;
  const halfH = VIEW_H / 2;

  for (let x = 0; x < VIEW_W; x += 1) {
    const cameraX = (2 * x) / VIEW_W - 1;
    const rayAng = p.angle + Math.atan(cameraX * Math.tan(fov / 2));
    const ray = castRay(state, p.x, p.y, rayAng, maxDist);

    const corrected = Math.max(0.001, ray.dist * Math.cos(rayAng - p.angle));
    const wallH = Math.min(VIEW_H, (VIEW_H * 0.85) / corrected);
    const y0 = Math.floor(halfH - wallH / 2);

    const shade = clamp01(1 - corrected / maxDist);
    const base = ray.side === 0 ? 0x6d7cff : 0x4e59d4;
    const dark = 0x11162a;
    ctx.fillStyle = rgb(colorLerp(dark, base, shade));
    ctx.fillRect(x, y0, 1, wallH);
  }

  // enemies (billboards) with occlusion
  const sprites = [];
  for (const e of state.enemies) {
    if (e.dead) continue;
    const dx = e.x - p.x;
    const dy = e.y - p.y;
    const dist = Math.hypot(dx, dy);
    const angTo = Math.atan2(dy, dx);
    let rel = angTo - p.angle;
    while (rel < -Math.PI) rel += Math.PI * 2;
    while (rel > Math.PI) rel -= Math.PI * 2;
    if (Math.abs(rel) > fov * 0.55) continue;

    const wallRay = castRay(state, p.x, p.y, angTo, state.view.maxDist);
    if (wallRay.hit && wallRay.dist < dist - 0.1) continue;

    sprites.push({ e, dist, rel });
  }

  sprites.sort((a, b) => b.dist - a.dist);
  for (const s of sprites) {
    const corrected = Math.max(0.001, s.dist * Math.cos(s.rel));
    const size = Math.min(VIEW_H, (VIEW_H * 0.5) / corrected);
    const screenX = (VIEW_W / 2) * (1 + Math.tan(s.rel) / Math.tan(fov / 2));
    const x0 = Math.floor(screenX - size / 2);
    const y0 = Math.floor(halfH - size / 2);
    ctx.fillStyle = s.e.seesPlayer ? 'rgba(255,45,85,0.95)' : 'rgba(255,138,160,0.9)';
    ctx.fillRect(x0, y0, size, size);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.strokeRect(x0, y0, size, size);
  }

  // crosshair
  ctx.strokeStyle = state.lastShotHit ? '#a7f3d0' : '#e8ecff';
  ctx.beginPath();
  ctx.moveTo(VIEW_W / 2 - 10, VIEW_H / 2);
  ctx.lineTo(VIEW_W / 2 + 10, VIEW_H / 2);
  ctx.moveTo(VIEW_W / 2, VIEW_H / 2 - 10);
  ctx.lineTo(VIEW_W / 2, VIEW_H / 2 + 10);
  ctx.stroke();

  // minimap
  const pad = 10;
  const mapW = state.map.width * minimapScale;
  const mapH = state.map.height * minimapScale;
  const x0 = pad;
  const y0 = pad;

  ctx.save();
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(x0 - 6, y0 - 6, mapW + 12, mapH + 12);

  for (let y = 0; y < state.map.height; y += 1) {
    for (let x = 0; x < state.map.width; x += 1) {
      const wall = state.map.walls.has(`${x},${y}`);
      ctx.fillStyle = wall ? '#273056' : '#0c1020';
      ctx.fillRect(x0 + x * minimapScale, y0 + y * minimapScale, minimapScale, minimapScale);
    }
  }

  ctx.fillStyle = '#47e6ff';
  ctx.fillRect(
    x0 + (state.map.exit.x - 0.2) * minimapScale,
    y0 + (state.map.exit.y - 0.2) * minimapScale,
    0.4 * minimapScale,
    0.4 * minimapScale
  );

  for (const e of state.enemies) {
    if (e.dead) continue;
    ctx.fillStyle = e.seesPlayer ? '#ff3355' : '#ff8aa0';
    ctx.beginPath();
    ctx.arc(x0 + e.x * minimapScale, y0 + e.y * minimapScale, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#a7f3d0';
  ctx.beginPath();
  ctx.arc(x0 + state.player.x * minimapScale, y0 + state.player.y * minimapScale, 2.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#a7f3d0';
  ctx.beginPath();
  ctx.moveTo(x0 + state.player.x * minimapScale, y0 + state.player.y * minimapScale);
  ctx.lineTo(
    x0 + (state.player.x + Math.cos(state.player.angle) * 0.8) * minimapScale,
    y0 + (state.player.y + Math.sin(state.player.angle) * 0.8) * minimapScale
  );
  ctx.stroke();

  ctx.restore();
}
