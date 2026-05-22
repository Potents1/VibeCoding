export function createInput() {
  return {
    held: new Set(),
    intent: { x: 0, y: 0 }
  };
}

const KEY_TO_DIR = new Map([
  ["ArrowLeft", { x: -1, y: 0 }],
  ["ArrowRight", { x: 1, y: 0 }],
  ["ArrowUp", { x: 0, y: -1 }],
  ["ArrowDown", { x: 0, y: 1 }],
  ["a", { x: -1, y: 0 }],
  ["d", { x: 1, y: 0 }],
  ["w", { x: 0, y: -1 }],
  ["s", { x: 0, y: 1 }]
]);

export function attachInput(input, target, { onRestart } = {}) {
  const onKeyDown = (e) => {
    if (e.key === "r" || e.key === "R") {
      onRestart?.();
      e.preventDefault();
      return;
    }
    const dir = KEY_TO_DIR.get(e.key);
    if (!dir) return;
    input.held.add(e.key);
    input.intent = dir;
    e.preventDefault();
  };

  const onKeyUp = (e) => {
    const dir = KEY_TO_DIR.get(e.key);
    if (!dir) return;
    input.held.delete(e.key);
    if (input.held.size === 0) input.intent = { x: 0, y: 0 };
    e.preventDefault();
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
  if (input?.held?.has("ArrowLeft") || input?.held?.has("a")) x -= 1;
  if (input?.held?.has("ArrowRight") || input?.held?.has("d")) x += 1;
  if (input?.held?.has("ArrowUp") || input?.held?.has("w")) y -= 1;
  if (input?.held?.has("ArrowDown") || input?.held?.has("s")) y += 1;
  if (x !== 0 && y !== 0) {
    const inv = 1 / Math.SQRT2;
    x *= inv;
    y *= inv;
  }
  return { x, y };
}
