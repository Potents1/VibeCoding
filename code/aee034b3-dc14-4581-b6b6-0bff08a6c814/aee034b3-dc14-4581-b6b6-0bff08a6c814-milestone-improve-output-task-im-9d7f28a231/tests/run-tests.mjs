import { readdir } from 'node:fs/promises';
const here = new URL('.', import.meta.url);

const entries = await readdir(here, { withFileTypes: true });
const files = entries
  .filter((e) => e.isFile())
  .map((e) => e.name)
  .filter((name) => name.endsWith('.test.js'))
  .sort((a, b) => a.localeCompare(b));

for (const name of files) {
  // Importing (not spawning) keeps tests compatible with restricted sandboxes.
  // node:test prints TAP output automatically as tests finish.
  // eslint-disable-next-line no-await-in-loop
  await import(new URL(name, here));
}
