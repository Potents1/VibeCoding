import { run } from 'node:test';
import { tap } from 'node:test/reporters';

const files = [
  'tests/engine.test.js',
  'tests/chess_engine.test.js',
  'tests/chess.test.js',
  'tests/check_behavior_fixed.test.js',
  'tests/smoke.test.js',
  'tests/ui.smoke.test.js',
  'tests/dom_safety.test.js'
];

const events = run({
  files,
  concurrency: 1,
  isolation: 'none',
  watch: false
});

let tapOutput = '';
for await (const chunk of tap(events)) {
  const s = String(chunk);
  tapOutput += s;
  process.stdout.write(s);
}

process.exitCode = /\nnot ok\b/.test(tapOutput) ? 1 : 0;
