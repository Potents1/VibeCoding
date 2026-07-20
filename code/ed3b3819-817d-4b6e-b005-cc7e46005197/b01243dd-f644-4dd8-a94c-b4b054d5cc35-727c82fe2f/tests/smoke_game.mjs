import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = normalize(join(dirname(fileURLToPath(import.meta.url)), '..'));
const read = (rel) => readFileSync(join(root, rel), 'utf8');
const indexRaw = read('index.html');
const index = indexRaw.toLowerCase();
const scripts = [...indexRaw.matchAll(/<script\b([^>]*)>/gis)];
let moduleSrc = '';
for (const [, attrs] of scripts) {
  if (/\btype\s*=\s*['"]module['"]/i.test(attrs)) {
    const match = attrs.match(/\bsrc\s*=\s*['"]([^'"]+)['"]/i);
    if (match) {
      moduleSrc = match[1].split('?')[0].split('#')[0].trim().replace(/^\/+/, '');
      break;
    }
  }
}
if (!moduleSrc) throw new Error('index.html must load an esm module script with src');
if (!moduleSrc.startsWith('src/') || moduleSrc.split('/').includes('..')) throw new Error('browser entrypoint must be under src/');
if (!existsSync(join(root, moduleSrc))) throw new Error(`missing browser entrypoint ${moduleSrc}`);
const entry = read(moduleSrc);
const srcCorpusRaw = readFileSync(join(root, moduleSrc), 'utf8');
const srcCorpus = srcCorpusRaw.toLowerCase();
const corpus = `${index}\n${srcCorpus}`;
if (!/type\s*=\s*['"]module['"]/i.test(indexRaw)) throw new Error('index.html must load an esm module');
const htmlIds = new Set([...indexRaw.matchAll(/\bid\s*=\s*['"]([^'"]+)['"]/gi)].map((m) => m[1]));
const referencedIds = new Set([...srcCorpusRaw.matchAll(/getElementById\(\s*['"]([^'"]+)['"]\s*\)/g)].map((m) => m[1]));
for (const match of srcCorpusRaw.matchAll(/querySelector\(\s*['"]#([A-Za-z_][\w:-]*)['"]\s*\)/g)) referencedIds.add(match[1]);
const missingIds = [...referencedIds].filter((id) => id && !htmlIds.has(id)).sort();
if (missingIds.length) throw new Error(`entrypoint references missing DOM id(s): ${missingIds.join(',')}`);
const hasProgression = ['requestanimationframe', 'setinterval(', 'update(', 'tick(', 'step(', 'render(', 'renderboard', 'onsquareclick', 'movepiece', 'makemove', '.move('].some((token) => srcCorpus.includes(token));
if (!hasProgression) throw new Error('missing game progression loop or turn handler');
if (!['keydown', 'keyup', 'pointerdown', 'click', 'input'].some((token) => srcCorpus.includes(token))) throw new Error('missing input handling');
if (!corpus.includes('canvas') && !corpus.includes('board')) throw new Error('missing primary game surface');
if (!['won', 'lost', 'gameover', 'status', 'turn', 'score', 'health'].some((token) => srcCorpus.includes(token))) throw new Error('missing game state');
if (entry.includes('require(') || entry.includes('module.exports')) throw new Error('commonjs is not allowed in browser esm stack');
if (existsSync(join(root, 'task_impl.py'))) throw new Error('task_impl.py must not exist in browser stack');
if (existsSync(join(root, 'smoke_test.py'))) throw new Error('smoke_test.py must not exist in browser stack');
console.log('SMOKE_GAME_OK');
