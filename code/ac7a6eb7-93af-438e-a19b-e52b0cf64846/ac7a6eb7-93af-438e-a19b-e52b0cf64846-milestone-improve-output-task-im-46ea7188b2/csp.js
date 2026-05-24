export function applyStrictCspMeta() {
  // Optional hardening for pages served without CSP headers.
  if (typeof document === 'undefined') return;
  if (document.querySelector('meta[http-equiv="Content-Security-Policy"]')) return;

  const meta = document.createElement('meta');
  meta.httpEquiv = 'Content-Security-Policy';
  meta.content = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self'",
    "img-src 'self' data:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests'
  ].join('; ');
  document.head.appendChild(meta);
}
