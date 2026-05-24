function emptyState() {
  return { up: false, down: false, left: false, right: false, restart: false };
}

export function createKeyboardInput(target) {
  const state = emptyState();
  let restartLatched = false;

  const onKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        state.left = true;
        e.preventDefault();
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        state.right = true;
        e.preventDefault();
        break;
      case 'ArrowUp':
      case 'w':
      case 'W':
        state.up = true;
        e.preventDefault();
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        state.down = true;
        e.preventDefault();
        break;
      case 'r':
      case 'R':
        restartLatched = true;
        e.preventDefault();
        break;
      default:
        break;
    }
  };

  const onKeyUp = (e) => {
    switch (e.key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        state.left = false;
        e.preventDefault();
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        state.right = false;
        e.preventDefault();
        break;
      case 'ArrowUp':
      case 'w':
      case 'W':
        state.up = false;
        e.preventDefault();
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        state.down = false;
        e.preventDefault();
        break;
      default:
        break;
    }
  };

  target.addEventListener('keydown', onKeyDown);
  target.addEventListener('keyup', onKeyUp);

  return {
    snapshot() {
      return { up: state.up, down: state.down, left: state.left, right: state.right };
    },
    consumeRestart() {
      const v = restartLatched;
      restartLatched = false;
      return v;
    },
    dispose() {
      target.removeEventListener('keydown', onKeyDown);
      target.removeEventListener('keyup', onKeyUp);
    }
  };
}

// Test helper for deterministic input injection.
export function createVirtualInput() {
  let state = emptyState();
  let restartLatched = false;

  return {
    set(next) {
      state = { ...emptyState(), ...next };
      if (next.restart) restartLatched = true;
    },
    snapshot() {
      return { up: !!state.up, down: !!state.down, left: !!state.left, right: !!state.right };
    },
    consumeRestart() {
      const v = restartLatched;
      restartLatched = false;
      return v;
    }
  };
}
