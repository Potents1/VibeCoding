import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

function listJsFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name);
    if (name.isDirectory()) out.push(...listJsFiles(p));
    else if (name.isFile() && name.name.endsWith('.js')) out.push(p);
  }
  return out;
}

const root = new URL('..', import.meta.url);
const srcDir = join(root.pathname, 'src');

const files = listJsFiles(srcDir);
assert.ok(files.length > 0, 'expected src js files');

for (const f of files) {
  const t = readFileSync(f, 'utf8');
  assert.ok(!t.includes('innerHTML'), `innerHTML forbidden: ${f}`);
  assert.ok(!t.includes('outerHTML'), `outerHTML forbidden: ${f}`);
  assert.ok(!t.includes('insertAdjacentHTML'), `insertAdjacentHTML forbidden: ${f}`);
  assert.ok(!t.includes('document.write'), `document.write forbidden: ${f}`);
  assert.ok(!t.includes('eval('), `eval forbidden: ${f}`);
  assert.ok(!t.includes('new Function'), `new Function forbidden: ${f}`);
}

console.log('SECURITY_DOM_SAFETY_OK');
