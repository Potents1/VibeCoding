import { createInput } from './engine/input.js';
import { renderFrame } from './engine/renderer.js';
import { createPerfMeter } from './engine/perf.js';
import { createGame, stepGame } from './logic.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d', { alpha: false });

const input = createInput();
const state = createGame();
const perf = createPerfMeter({ windowSize: 120 });

function drawHud(ctx2, canvas2, s) {
  const VIEW_W = canvas2.width;
  const VIEW_H = canvas2.height;

  const barW = 240;
  const barH = 14;
  const x = 14;
  const y = VIEW_H - 24;

  ctx2.fillStyle = 'rgba(0,0,0,0.55)';
  ctx2.fillRect(0, VIEW_H - 44, VIEW_W, 44);

  ctx2.fillStyle = '#e8ecff';
  ctx2.font = '14px system-ui, -apple-system, Segoe UI, sans-serif';
  ctx2.fillText('W/S move, A/D strafe, Q/E or ←/→ turn, Space shoot, R reset', x, VIEW_H - 24);

  const hpT = s.player.hp / s.player.maxHp;
  ctx2.fillStyle = '#1f2442';
  ctx2.fillRect(VIEW_W - barW - 18, y, barW, barH);
  const rr = Math.round(0xff + (0xa7 - 0xff) * hpT);
  const gg = Math.round(0x2d + (0xf3 - 0x2d) * hpT);
  const bb = Math.round(0x55 + (0xd0 - 0x55) * hpT);
  ctx2.fillStyle = `rgb(${rr},${gg},${bb})`;
  ctx2.fillRect(VIEW_W - barW - 18, y, Math.round(barW * hpT), barH);
  ctx2.strokeStyle = '#2c335c';
  ctx2.strokeRect(VIEW_W - barW - 18, y, barW, barH);

  const st = perf.stats();
  ctx2.fillStyle = 'rgba(232,236,255,0.75)';
  ctx2.font = '12px system-ui, -apple-system, Segoe UI, sans-serif';
  ctx2.fillText(`FPS ${st.fps.toFixed(0)}  p95 ${(st.p95Ms).toFixed(1)}ms`, VIEW_W - 18 - barW, VIEW_H - 46);

  ctx2.fillStyle = s.status === 'won' ? '#a7f3d0' : s.status === 'lost' ? '#ff8aa0' : '#c7d2fe';
  ctx2.font = '16px system-ui, -apple-system, Segoe UI, sans-serif';
  ctx2.fillText(s.statusText, x, VIEW_H - 6);
}

let last = performance.now();
let acc = 0;
const FIXED_DT = 1 / 60;

function loop(ts) {
  perf.markFrame(ts);

  const frameDt = Math.min(0.1, (ts - last) / 1000);
  last = ts;
  acc += frameDt;

  const snap = input.snapshot();
  for (let i = 0; i < 5 && acc >= FIXED_DT; i += 1) {
    stepGame(state, snap, FIXED_DT);
    acc -= FIXED_DT;
  }

  renderFrame(ctx, canvas, state);
  drawHud(ctx, canvas, state);
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
