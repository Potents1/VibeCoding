export function createInput() {
  return {
    up: false,
    down: false,
    left: false,
    right: false,
    restart: false
  };
}

export function attachInput(input, target, { onRestart } = {}) {
  const onKeyDown = (e) => {
    switch (e.key) {
      case "ArrowLeft":
      case "a":
      case "A":
        input.left = true;
        e.preventDefault();
        break;
      case "ArrowRight":
      case "d":
      case "D":
        input.right = true;
        e.preventDefault();
        break;
      case "ArrowUp":
      case "w":
      case "W":
        input.up = true;
        e.preventDefault();
        break;
      case "ArrowDown":
      case "s":
      case "S":
        input.down = true;
        e.preventDefault();
        break;
      case "r":
      case "R":
        input.restart = true;
        onRestart?.();
        e.preventDefault();
        break;
      default:
        break;
    }
  };

  const onKeyUp = (e) => {
    switch (e.key) {
      case "ArrowLeft":
      case "a":
      case "A":
        input.left = false;
        e.preventDefault();
        break;
      case "ArrowRight":
      case "d":
      case "D":
        input.right = false;
        e.preventDefault();
        break;
      case "ArrowUp":
      case "w":
      case "W":
        input.up = false;
        e.preventDefault();
        break;
      case "ArrowDown":
      case "s":
      case "S":
        input.down = false;
        e.preventDefault();
        break;
      default:
        break;
    }
  };

  target.addEventListener("keydown", onKeyDown);
  target.addEventListener("keyup", onKeyUp);

  return () => {
    target.removeEventListener("keydown", onKeyDown);
    target.removeEventListener("keyup", onKeyUp);
  };
}

export function movementIntent(input) {
  let x = 0;
  let y = 0;
  if (input.left) x -= 1;
  if (input.right) x += 1;
  if (input.up) y -= 1;
  if (input.down) y += 1;

  // Avoid diagonals for deterministic, grid-based movement.
  if (x !== 0 && y !== 0) y = 0;
  return { x, y };
}
