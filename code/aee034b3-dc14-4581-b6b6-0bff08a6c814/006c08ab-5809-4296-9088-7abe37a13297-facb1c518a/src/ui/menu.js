function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

export function createMenu({ onStart, onToggleMute } = {}) {
  const root = el('div', 'overlay overlay-menu');
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-label', 'Main menu');

  const panel = el('div', 'panel');
  const title = el('div', 'title', 'MINI WOLF3D');
  const subtitle = el('div', 'subtitle', 'Raycast maze. Clear enemies, reach the exit.');

  const startBtn = el('button', 'btn', 'Start');
  startBtn.type = 'button';

  const muteBtn = el('button', 'btn btn-secondary', 'Toggle Mute (M)');
  muteBtn.type = 'button';

  const help = el('div', 'help');
  const helpLines = [
    'W/S move, A/D strafe, Q/E or  turn',
    'Space shoot, Esc/P pause, M mute',
    'Kill all enemies, then stand on the exit (X) to win.'
  ];
  for (const line of helpLines) help.appendChild(el('div', 'help-line', line));

  panel.appendChild(title);
  panel.appendChild(subtitle);
  panel.appendChild(startBtn);
  panel.appendChild(muteBtn);
  panel.appendChild(help);
  root.appendChild(panel);

  let visible = false;

  function show() {
    visible = true;
    root.classList.add('is-visible');
    startBtn.focus();
  }

  function hide() {
    visible = false;
    root.classList.remove('is-visible');
  }

  function isVisible() {
    return visible;
  }

  startBtn.addEventListener('click', () => {
    if (onStart) onStart();
  });

  muteBtn.addEventListener('click', () => {
    if (onToggleMute) onToggleMute();
  });

  return { root, show, hide, isVisible };
}
