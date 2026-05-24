export function sanitizeSingleLine(input, { maxLen = 120 } = {}) {
  if (input == null) return '';
  const s = String(input)
    .replace(/[\r\n\t]/g, ' ')
    .replace(/[^\x20-\x7E]/g, '')
    .trim();
  if (s.length > maxLen) return s.slice(0, maxLen);
  return s;
}

export function sanitizeFen(input) {
  const s = sanitizeSingleLine(input, { maxLen: 120 });
  // Very strict allowlist for FEN characters + spaces.
  if (!/^[prnbqkPRNBQK1-8\/\swb-]+$/.test(s)) return '';
  // Collapse multiple spaces
  return s.replace(/\s+/g, ' ').trim();
}
