const DEFAULT_BINDINGS = {
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  Space: 'action',
  Enter: 'action',
  KeyR: 'reset'
};

export function createInput({ target = window, bindings = DEFAULT_BINDINGS } = {}) {
  const held = new Set();
  const pressed = new Set();
  let initialized = false;

  function onKeyDown(e) {
    const action = bindings[e.code];
    if (!action) return;
    if (!held.has(action)) pressed.add(action);
    held.add(action);
    e.preventDefault();
  }

  function onKeyUp(e) {
    const action = bindings[e.code];
    if (!action) return;
    held.delete(action);
    e.preventDefault();
  }

  function init() {
    if (initialized) return;
    initialized = true;
    target.addEventListener('keydown', onKeyDown, { passive: false });
    target.addEventListener('keyup', onKeyUp, { passive: false });
  }

  function snapshot() {
    init();
    const input = {
      up: held.has('up'),
      down: held.has('down'),
      left: held.has('left'),
      right: held.has('right'),
      action: held.has('action'),
      reset: held.has('reset'),
      actionPressed: pressed.has('action'),
      resetPressed: pressed.has('reset')
    };
    pressed.clear();
    return input;
  }

  return { snapshot };
}

export function pollInput(previous = {}) {
  return { ...previous };
}
