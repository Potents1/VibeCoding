import { castRay } from './raycaster.js';
import {
  applyFog,
  colorLerp,
  colorToRgb,
  getEnemySprite,
  getPalette,
  getWeaponFrames,
  materialForCell,
  paletteIndexToColor,
  sampleWallTex,
  weaponIndexToColor
} from './assets.js';

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

function shadeFromDist(dist, maxDist) {
  return clamp01(1 - dist / maxDist);
}

function drawColumnSprite(ctx, x0, y0, w, h, sprite, colorFn) {
  // Column-based scaling to keep it fast and deterministic.
  const sxStep = sprite.w / w;
  const syStep = sprite.h / h;

  for (let sx = 0; sx < w; sx += 1) {
    const srcX = Math.max(0, Math.min(sprite.w - 1, Math.floor(sx * sxStep)));
    // find if column has any pixels; if none, skip (saves work)
    let has = false;
    for (let yy = 0; yy < sprite.h; yy += 2) {
      if (sprite.pixels[yy * sprite.w + srcX] !== 0) {
        has = true;
        break;
      }
    }
    if (!has) continue;

    for (let sy = 0; sy < h; sy += 1) {
      const srcY = Math.max(0, Math.min(sprite.h - 1, Math.floor(sy * syStep)));
      const idx = sprite.pixels[srcY * sprite.w + srcX];
      const c = colorFn(idx);
      if (c == null) continue;
      ctx.fillStyle = colorToRgb(c);
      ctx.fillRect(x0 + sx, y0 + sy, 1, 1);
    }
  }
}

export function renderFrame(ctx, canvas, state, { minimapScale = 8 } = {}) {
  const VIEW_W = canvas.width;
  const VIEW_H = canvas.height;

  const pal = getPalette();

  // ceiling + floor gradients (2px stripes)
  for (let y = 0; y < VIEW_H / 2; y += 2) {
    const t = y / (VIEW_H / 2);
    ctx.fillStyle = colorToRgb(colorLerp(pal.ceilingA, pal.ceilingB, t));
    ctx.fillRect(0, y, VIEW_W, 2);
  }
  for (let y = VIEW_H / 2; y < VIEW_H; y += 2) {
    const t = (y - VIEW_H / 2) / (VIEW_H / 2);
    ctx.fillStyle = colorToRgb(colorLerp(pal.floorA, pal.floorB, t));
    ctx.fillRect(0, y, VIEW_W, 2);
  }

  const p = state.player;
  const fov = state.view.fov;
  const maxDist = state.view.maxDist;
  const halfH = VIEW_H / 2;

  // depth buffer for occlusion (per column)
  const z = new Float32Array(VIEW_W);

  for (let x = 0; x < VIEW_W; x += 1) {
    const cameraX = (2 * x) / VIEW_W - 1;
    const rayAng = p.angle + Math.atan(cameraX * Math.tan(fov / 2));
    const ray = castRay(state, p.x, p.y, rayAng, maxDist);

    const corrected = Math.max(0.001, ray.dist * Math.cos(rayAng - p.angle));
    z[x] = corrected;

    const wallH = Math.min(VIEW_H, (VIEW_H * 0.85) / corrected);
    const y0 = Math.floor(halfH - wallH / 2);

    // texture coords
    // if we hit a vertical wall (side=0), use hit y frac; else hit x frac
    const u = ray.side === 0 ? (ray.y - Math.floor(ray.y)) : (ray.x - Math.floor(ray.x));
    const mat = ray.hit ? materialForCell(ray.cellX, ray.cellY) : 3;

    const shade = shadeFromDist(corrected, maxDist);

    // draw textured wall by sampling per y. Step 1px for better quality.
    for (let yy = 0; yy < wallH; yy += 1) {
      const v = yy / wallH;
      let c = sampleWallTex(pal, mat, u, v, ray.side);
      // side shading and distance fog
      const sideMul = ray.side === 1 ? 0.88 : 1;
      c = applyFog(pal, c, shade * sideMul);
      ctx.fillStyle = colorToRgb(c);
      ctx.fillRect(x, y0 + yy, 1, 1);
    }
  }

  // enemies (billboards) with z-buffer occlusion
  const enemySprite = getEnemySprite();
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
    if (Math.abs(rel) > fov * 0.6) continue;

    sprites.push({ e, dist, rel });
  }

  sprites.sort((a, b) => b.dist - a.dist);
  for (const s of sprites) {
    const corrected = Math.max(0.001, s.dist * Math.cos(s.rel));
    const size = Math.min(VIEW_H, (VIEW_H * 0.62) / corrected);
    const screenX = (VIEW_W / 2) * (1 + Math.tan(s.rel) / Math.tan(fov / 2));
    const x0 = Math.floor(screenX - size / 2);
    const y0 = Math.floor(halfH - size * 0.62);

    // per-column z check: skip columns behind wall
    const w = Math.max(1, Math.floor(size));
    const h = Math.max(1, Math.floor(size * (enemySprite.h / enemySprite.w)));

    // if mostly occluded, skip quickly
    let visible = false;
    for (let cx = 0; cx < w; cx += Math.max(1, Math.floor(w / 8))) {
      const sx = x0 + cx;
      if (sx < 0 || sx >= VIEW_W) continue;
      if (corrected < z[sx] - 0.02) {
        visible = true;
        break;
      }
    }
    if (!visible) continue;

    const shade = shadeFromDist(corrected, maxDist);
    const hitFlash = (s.e.hitFlash || 0) > 0;

    drawColumnSprite(
      ctx,
      x0,
      y0,
      w,
      h,
      enemySprite,
      (idx) => {
        const base = paletteIndexToColor(pal, idx, { hitFlash });
        if (base == null) return null;
        const lit = applyFog(pal, base, shade);
        return lit;
      }
    );

    // tiny outline box for clarity
    ctx.strokeStyle = 'rgba(0,0,0,0.28)';
    ctx.strokeRect(x0, y0, w, h);

    // awareness indicator (small dot above head)
    if (s.e.seesPlayer) {
      ctx.fillStyle = 'rgba(255,45,85,0.9)';
      ctx.fillRect(x0 + Math.floor(w / 2) - 2, y0 - 6, 4, 4);
    }
  }

  // crosshair
  ctx.strokeStyle = state.lastShotHit ? '#a7f3d0' : '#e8ecff';
  ctx.beginPath();
  ctx.moveTo(VIEW_W / 2 - 10, VIEW_H / 2);
  ctx.lineTo(VIEW_W / 2 + 10, VIEW_H / 2);
  ctx.moveTo(VIEW_W / 2, VIEW_H / 2 - 10);
  ctx.lineTo(VIEW_W / 2, VIEW_H / 2 + 10);
  ctx.stroke();

  // weapon HUD
  const weaponFrames = getWeaponFrames();
  const frame = weaponFrames[Math.max(0, Math.min(weaponFrames.length - 1, state.player.weaponFrame || 0))];
  const wW = Math.floor(VIEW_W * 0.62);
  const wH = Math.floor((wW * frame.h) / frame.w);
  const wX = Math.floor((VIEW_W - wW) / 2);
  const wY = VIEW_H - wH - 46;

  // backdrop strip
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(0, VIEW_H - 78, VIEW_W, 78);

  drawColumnSprite(ctx, wX, wY, wW, wH, frame, (idx) => weaponIndexToColor(pal, idx));

  // minimap
  const pad = 10;
  const mapW = state.map.width * minimapScale;
  const mapH = state.map.height * minimapScale;
  const mX0 = pad;
  const mY0 = pad;

  ctx.save();
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(mX0 - 6, mY0 - 6, mapW + 12, mapH + 12);

  for (let y = 0; y < state.map.height; y += 1) {
    for (let x = 0; x < state.map.width; x += 1) {
      const wall = state.map.walls.has(`${x},${y}`);
      ctx.fillStyle = wall ? '#1f294d' : '#0c1020';
      ctx.fillRect(mX0 + x * minimapScale, mY0 + y * minimapScale, minimapScale, minimapScale);
    }
  }

  ctx.fillStyle = '#47e6ff';
  ctx.fillRect(
    mX0 + (state.map.exit.x - 0.2) * minimapScale,
    mY0 + (state.map.exit.y - 0.2) * minimapScale,
    0.4 * minimapScale,
    0.4 * minimapScale
  );

  for (const e of state.enemies) {
    if (e.dead) continue;
    ctx.fillStyle = e.seesPlayer ? '#ff3355' : '#ff8aa0';
    ctx.beginPath();
    ctx.arc(mX0 + e.x * minimapScale, mY0 + e.y * minimapScale, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#a7f3d0';
  ctx.beginPath();
  ctx.arc(mX0 + state.player.x * minimapScale, mY0 + state.player.y * minimapScale, 2.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#a7f3d0';
  ctx.beginPath();
  ctx.moveTo(mX0 + state.player.x * minimapScale, mY0 + state.player.y * minimapScale);
  ctx.lineTo(
    mX0 + (state.player.x + Math.cos(state.player.angle) * 0.8) * minimapScale,
    mY0 + (state.player.y + Math.sin(state.player.angle) * 0.8) * minimapScale
  );
  ctx.stroke();

  ctx.restore();
}
