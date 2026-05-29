function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

export function createPause({ onResume, onRestart, onToggleMute } = {}) {
  const root = el('div', 'overlay overlay-pause');
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-label', 'Paused');

  const panel = el('div', 'panel');
  const title = el('div', 'title', 'PAUSED');
  const resumeBtn = el('button', 'btn', 'Resume (Esc/P)');
  resumeBtn.type = 'button';
  const restartBtn = el('button', 'btn btn-secondary', 'Restart (R)');
  restartBtn.type = 'button';
  const muteBtn = el('button', 'btn btn-secondary', 'Toggle Mute (M)');
  muteBtn.type = 'button';

  panel.appendChild(title);
  panel.appendChild(resumeBtn);
  panel.appendChild(restartBtn);
  panel.appendChild(muteBtn);
  root.appendChild(panel);

  let visible = false;

  function show() {
    visible = true;
    root.classList.add('is-visible');
    resumeBtn.focus();
  }

  function hide() {
    visible = false;
    root.classList.remove('is-visible');
  }

  function isVisible() {
    return visible;
  }

  resumeBtn.addEventListener('click', () => onResume && onResume());
  restartBtn.addEventListener('click', () => onRestart && onRestart());
  muteBtn.addEventListener('click', () => onToggleMute && onToggleMute());

  return { root, show, hide, isVisible };
}
