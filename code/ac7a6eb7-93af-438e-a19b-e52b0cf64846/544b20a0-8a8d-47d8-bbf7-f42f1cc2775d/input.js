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
