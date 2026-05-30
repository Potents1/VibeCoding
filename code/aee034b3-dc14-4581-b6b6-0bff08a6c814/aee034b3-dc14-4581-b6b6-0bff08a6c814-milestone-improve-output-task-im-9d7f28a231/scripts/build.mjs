import { mkdir, cp, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const dist = resolve(root, 'dist');

await mkdir(dist, { recursive: true });

await cp(resolve(root, 'index.html'), resolve(dist, 'index.html'), { force: true });
await cp(resolve(root, 'src'), resolve(dist, 'src'), { recursive: true, force: true });

const pkg = {
  name: 'mini-wolf3d-dist',
  private: true,
  type: 'module',
};
await writeFile(resolve(dist, 'package.json'), JSON.stringify(pkg, null, 2) + '\n');
