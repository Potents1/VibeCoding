const DEFAULT_BINDINGS = {
  ArrowUp: 'forward',
  KeyW: 'forward',
  ArrowDown: 'back',
  KeyS: 'back',
  ArrowLeft: 'turnLeft',
  KeyA: 'strafeLeft',
  ArrowRight: 'turnRight',
  KeyD: 'strafeRight',
  KeyQ: 'turnLeft',
  KeyE: 'turnRight',
  Space: 'shoot',
  Enter: 'shoot',
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
    const snap = {
      forward: held.has('forward'),
      back: held.has('back'),
      strafeLeft: held.has('strafeLeft'),
      strafeRight: held.has('strafeRight'),
      turnLeft: held.has('turnLeft'),
      turnRight: held.has('turnRight'),
      shoot: held.has('shoot'),
      reset: held.has('reset'),
      shootPressed: pressed.has('shoot'),
      resetPressed: pressed.has('reset')
    };
    pressed.clear();
    return snap;
  }

  return { snapshot };
}
