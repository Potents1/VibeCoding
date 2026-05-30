export function createInput() {
  const keys = new Set();
  const justPressed = new Set();

  function onKeyDown(e) {
    if (!keys.has(e.code)) justPressed.add(e.code);
    keys.add(e.code);
  }

  function onKeyUp(e) {
    keys.delete(e.code);
  }

  function attach(target = window) {
    target.addEventListener('keydown', onKeyDown);
    target.addEventListener('keyup', onKeyUp);
  }

  function detach(target = window) {
    target.removeEventListener('keydown', onKeyDown);
    target.removeEventListener('keyup', onKeyUp);
  }

  function reset() {
    keys.clear();
    justPressed.clear();
  }

  function poll() {
    const input = {
      forward: keys.has('KeyW') || keys.has('ArrowUp'),
      back: keys.has('KeyS') || keys.has('ArrowDown'),
      strafeLeft: keys.has('KeyA'),
      strafeRight: keys.has('KeyD'),
      turnLeft: keys.has('ArrowLeft') || keys.has('KeyQ'),
      turnRight: keys.has('ArrowRight') || keys.has('KeyE'),
      startPressed: justPressed.has('Enter'),
      pausePressed: justPressed.has('Escape') || justPressed.has('KeyP'),
      resetPressed: justPressed.has('KeyR'),
      mutePressed: justPressed.has('KeyM'),
      shootPressed: justPressed.has('Space')
    };

    justPressed.clear();
    return input;
  }

  function pressVirtual(code) {
    // For UI buttons (Start/Resume) in a deterministic way.
    justPressed.add(code);
  }

  return { attach, detach, reset, poll, pressVirtual };
}
