export function applyStrictCspMeta() {
  // Optional hardening for pages served without CSP headers.
  // Safe no-op in environments that already set headers.
  if (typeof document === 'undefined') return;
  if (document.querySelector('meta[http-equiv="Content-Security-Policy"]')) return;

  const meta = document.createElement('meta');
  meta.httpEquiv = 'Content-Security-Policy';
  meta.content = [
    "default-src 'self'",
    "base-uri 'none'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "img-src 'self' data:",
    "style-src 'self'",
    "script-src 'self'",
  ].join('; ');
  document.head.appendChild(meta);
}

