import { applyStrictCspMeta } from './csp.js';

export function applyRuntimeHardening() {
  applyStrictCspMeta();

  if (typeof document === 'undefined') return;

  const ensureMeta = (name, content) => {
    const sel = `meta[name="${CSS.escape(name)}"]`;
    if (document.querySelector(sel)) return;
    const m = document.createElement('meta');
    m.setAttribute('name', name);
    m.setAttribute('content', content);
    document.head.appendChild(m);
  };

  ensureMeta('referrer', 'no-referrer');
  ensureMeta('color-scheme', 'light dark');
}
