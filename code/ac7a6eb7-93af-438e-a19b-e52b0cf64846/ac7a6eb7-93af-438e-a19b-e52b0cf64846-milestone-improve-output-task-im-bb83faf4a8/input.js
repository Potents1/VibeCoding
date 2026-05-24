import { algebraicToRC, rcToAlgebraic } from './engine.js';

export function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

export function moveFocusSquare(current, key) {
  const { r, c } = algebraicToRC(current);
  let nr = r;
  let nc = c;
  if (key === 'ArrowUp') nr -= 1;
  else if (key === 'ArrowDown') nr += 1;
  else if (key === 'ArrowLeft') nc -= 1;
  else if (key === 'ArrowRight') nc += 1;
  else return current;

  nr = clamp(nr, 0, 7);
  nc = clamp(nc, 0, 7);
  return rcToAlgebraic(nr, nc);
}

export function isSelectKey(key) {
  return key === 'Enter' || key === ' ' || key === 'Spacebar';
}
