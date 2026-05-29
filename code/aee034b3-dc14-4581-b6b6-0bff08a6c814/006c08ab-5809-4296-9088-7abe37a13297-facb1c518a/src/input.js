export const DEFAULT_CONTROLS = {
  ArrowUp: 'forward',
  KeyW: 'forward',
  ArrowDown: 'back',
  KeyS: 'back',
  KeyA: 'strafeLeft',
  KeyD: 'strafeRight',
  ArrowLeft: 'turnLeft',
  ArrowRight: 'turnRight',
  KeyQ: 'turnLeft',
  KeyE: 'turnRight',
  Space: 'shoot',
  Enter: 'start',
  Escape: 'pause',
  KeyP: 'pause',
  KeyM: 'mute',
  KeyR: 'reset'
};

export function createControls({ target = window, bindings = DEFAULT_CONTROLS } = {}) {
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
      shootPressed: pressed.has('shoot') || held.has('shoot'),
      startPressed: pressed.has('start'),
      pausePressed: pressed.has('pause'),
      mutePressed: pressed.has('mute'),
      resetPressed: pressed.has('reset')
    };
    pressed.clear();
    return snap;
  }

  return { snapshot };
}
