// Lightweight performance instrumentation used for release polish.
// No dependencies; safe in Node tests and browsers.

export function createPerfMeter({ windowSize = 120 } = {}) {
  const frameMs = new Float64Array(windowSize);
  let idx = 0;
  let count = 0;
  let lastTs = null;

  function markFrame(ts) {
    if (lastTs == null) {
      lastTs = ts;
      return;
    }
    const dt = ts - lastTs;
    lastTs = ts;
    frameMs[idx] = dt;
    idx = (idx + 1) % windowSize;
    count = Math.min(windowSize, count + 1);
  }

  function stats() {
    if (count === 0) return { avgMs: 0, p95Ms: 0, fps: 0 };
    // Copy only the filled region for deterministic stats.
    const arr = Array.from(frameMs.slice(0, count));
    arr.sort((a, b) => a - b);
    const sum = arr.reduce((a, b) => a + b, 0);
    const avgMs = sum / count;
    const p95Ms = arr[Math.min(count - 1, Math.floor(count * 0.95))];
    const fps = avgMs > 0 ? 1000 / avgMs : 0;
    return { avgMs, p95Ms, fps };
  }

  return { markFrame, stats };
}

export function nowMs() {
  // performance.now is available in browsers; fall back to Date.now for Node.
  return (globalThis.performance && typeof globalThis.performance.now === 'function')
    ? globalThis.performance.now()
    : Date.now();
}
