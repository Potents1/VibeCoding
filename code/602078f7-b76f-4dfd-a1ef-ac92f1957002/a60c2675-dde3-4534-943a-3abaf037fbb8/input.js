const KEY_TO_DIRECTION = {
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
    w: 'up',
    s: 'down',
    a: 'left',
    d: 'right',
};

const inputState = {
    direction: null,
    changed: false,
    lastEventTime: 0,
};

let listenersAttached = false;

function setDirection(direction) {
    if (inputState.direction === direction) {
        return;
    }
    inputState.direction = direction;
    inputState.changed = true;
    inputState.lastEventTime = (globalThis.performance?.now?.() ?? Date.now());
}

function onKeyDown(event) {
    const direction = KEY_TO_DIRECTION[event.key];
    if (!direction) {
        return;
    }
    event.preventDefault();
    setDirection(direction);
}

function onKeyUp(event) {
    const direction = KEY_TO_DIRECTION[event.key];
    if (!direction) {
        return;
    }
    if (inputState.direction === direction) {
        setDirection(null);
    }
}

function attachInputListeners() {
    if (listenersAttached || typeof window === 'undefined') {
        return;
    }
    listenersAttached = true;
    window.addEventListener('keydown', onKeyDown, { passive: false });
    window.addEventListener('keyup', onKeyUp, { passive: false });
}

export function pollInput() {
    attachInputListeners();
    const snapshot = { ...inputState };
    inputState.changed = false;
    return snapshot;
}
