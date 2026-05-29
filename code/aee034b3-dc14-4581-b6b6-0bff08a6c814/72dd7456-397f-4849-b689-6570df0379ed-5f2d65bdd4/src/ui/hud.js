function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

export function createHud() {
  const root = el('div', 'hud');
  root.setAttribute('aria-live', 'polite');

  const left = el('div', 'hud-left');
  const right = el('div', 'hud-right');

  const status = el('div', 'hud-status', '');
  const hpWrap = el('div', 'hud-hp');
  const hpLabel = el('div', 'hud-hp-label', 'HP');
  const hpBar = el('div', 'hud-hp-bar');
  const hpFill = el('div', 'hud-hp-fill');
  hpBar.appendChild(hpFill);
  hpWrap.appendChild(hpLabel);
  hpWrap.appendChild(hpBar);

  const info = el('div', 'hud-info', '');

  left.appendChild(status);
  left.appendChild(info);
  right.appendChild(hpWrap);

  root.appendChild(left);
  root.appendChild(right);

  function update({ mode, statusText, player, muted } = {}) {
    status.textContent = statusText || '';
    const hpT = player ? clamp01(player.hp / player.maxHp) : 0;
    hpFill.style.width = `${Math.round(hpT * 100)}%`;
    hpFill.dataset.hp = String(player ? player.hp : 0);

    const modeText = mode ? mode.toUpperCase() : '';
    info.textContent = `${modeText}${muted ? ' ' : ''}`;
  }

  return { root, update };
}
