export function createInput() {
  return {
    left: false,
    right: false,
    up: false,
    down: false,
    reset: false
  };
}

export function inputFromKeyEvent(input, ev, isDown) {
  const key = ev.key;
  if (key === "ArrowLeft" || key === "a" || key === "A") input.left = isDown;
  if (key === "ArrowRight" || key === "d" || key === "D") input.right = isDown;
  if (key === "ArrowUp" || key === "w" || key === "W") input.up = isDown;
  if (key === "ArrowDown" || key === "s" || key === "S") input.down = isDown;
  if (key === "r" || key === "R") input.reset = isDown;
}

export function movementIntent(input) {
  let dx = 0;
  let dy = 0;
  if (input.left) dx -= 1;
  if (input.right) dx += 1;
  if (input.up) dy -= 1;
  if (input.down) dy += 1;
  if (dx !== 0 && dy !== 0) {
    // Keep diagonals from being faster: normalize to 0.7071...
    const inv = 1 / Math.sqrt(2);
    dx *= inv;
    dy *= inv;
  }
  return { x: dx, y: dy };
}

