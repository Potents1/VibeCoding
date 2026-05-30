import assert from 'node:assert/strict';

const registry = [];

export function test(name, fn) {
  if (typeof name !== 'string' || !name.length) throw new TypeError('test name must be a non-empty string');
  if (typeof fn !== 'function') throw new TypeError('test fn must be a function');
  registry.push({ name, fn });
}

export { assert };

export async function run() {
  let passed = 0;
  let failed = 0;
  const failures = [];

  for (const t of registry) {
    try {
      // eslint-disable-next-line no-await-in-loop
      await t.fn();
      passed += 1;
    } catch (err) {
      failed += 1;
      failures.push({ name: t.name, err });
    }
  }

  if (failed === 0) {
    // Keep output stable and minimal for CI.
    // eslint-disable-next-line no-console
    console.log(`ok - ${passed} unit tests`);
    return;
  }

  // eslint-disable-next-line no-console
  console.error(`not ok - ${failed} unit test(s) failed (${passed} passed)`);
  for (const f of failures) {
    // eslint-disable-next-line no-console
    console.error(`- ${f.name}`);
    // eslint-disable-next-line no-console
    console.error(String(f.err?.stack || f.err));
  }
  process.exitCode = 1;
}

