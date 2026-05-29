import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const root = process.cwd();
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const server = createServer(async (req, res) => {
  const urlPath = normalize(decodeURIComponent(new URL(req.url || '/', 'http://localhost').pathname)).replace(/^[/\\]+/, '') || 'index.html';
  const filePath = join(root, urlPath);
  try {
    const body = await readFile(filePath);
    res.writeHead(200, { 'content-type': types[extname(filePath)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end('not found');
  }
});
server.listen(Number(process.env.PORT || 4173), () => console.log('SERVER_READY'));
