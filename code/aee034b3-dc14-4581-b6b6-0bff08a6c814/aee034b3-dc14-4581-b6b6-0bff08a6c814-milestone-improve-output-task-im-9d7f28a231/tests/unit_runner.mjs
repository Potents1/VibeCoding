import { run } from './_harness.mjs';

// Importing (not spawning) keeps unit tests compatible with restricted sandboxes.
await import('./perf.test.js');
await import('./perf_budget.test.js');
await import('./player_collision.test.js');
await import('./raycaster.test.js');
await import('./reliability.test.js');
await import('./render.test.js');

await run();

