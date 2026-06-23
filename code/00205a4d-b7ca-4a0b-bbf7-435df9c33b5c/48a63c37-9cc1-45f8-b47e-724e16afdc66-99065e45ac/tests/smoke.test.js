import assert from 'node:assert';
import { run } from '../src/main.js';
assert.equal(run().ok, true);
