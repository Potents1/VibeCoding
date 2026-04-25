import { checkCollision } from './collision.js';
import { pollInput } from './input.js';
import { updateGhostAI } from './ghost_ai.js';
export function updateGameState(state, dt){
  state.input = pollInput(state.input || {});
  state.ghosts = updateGhostAI(state.ghosts || [], state.player || {}, dt);
  state.collision = checkCollision(state.player || {}, state.ghosts || []);
  return state;
}
let last = performance.now();
const state = { player:{x:0,y:0}, ghosts:[] };
function loop(ts){ const dt = (ts-last)/1000; last = ts; updateGameState(state, dt); requestAnimationFrame(loop); }
requestAnimationFrame(loop);
