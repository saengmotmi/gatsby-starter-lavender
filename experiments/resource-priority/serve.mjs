import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { transformHead } from './html-variants.mjs';

const root = path.resolve(process.argv[2] || 'build/client');
const baselineHead = fs.readFileSync(path.join(root, 'index.html'), 'utf8').split('</head>')[0];
if (baselineHead.indexOf('rel="stylesheet"') < baselineHead.indexOf('rel="modulepreload"')) {
  throw new Error('Baseline is already optimized. First run: yarn generate:content && yarn react-router build');
}
const assets = fs.readdirSync(path.join(root, 'assets'));
const fonts = Object.fromEntries(['Regular', 'Bold', 'Black'].map(weight => {
  const matches = assets.filter(f => f.startsWith(`Pretendard-${weight}.subset-`) && f.endsWith('.woff2'));
  if (matches.length !== 1) throw new Error(`Ambiguous font ${weight}`);
  return [weight, '/assets/' + matches[0]];
}));
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.data': 'text/x-script', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.jpeg': 'image/jpeg', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.ico': 'image/x-icon', '.json': 'application/json' };
const servers = [];
for (const [index, variant] of ['baseline','css-first','font-bold','font-all'].entries()) {
  const server = http.createServer((req,res) => {
    let filename;
    try {
      const url = new URL(req.url, 'http://localhost');
      filename = path.resolve(root, '.' + decodeURIComponent(url.pathname));
      if (filename !== root && !filename.startsWith(root + '/')) throw new Error('Invalid path');
      if (fs.statSync(filename).isDirectory()) filename = path.join(filename, 'index.html');
      let bytes = fs.readFileSync(filename);
      const ext = path.extname(filename);
      if (ext === '.html') bytes = Buffer.from(transformHead(bytes.toString(), variant, fonts));
      const headers = { 'Content-Type': mime[ext] || 'application/octet-stream', 'Cache-Control': 'no-store', Vary: 'Accept-Encoding' };
      if (/gzip/.test(req.headers['accept-encoding'] || '') && ['.html','.js','.css','.data','.svg','.json'].includes(ext)) { bytes = gzipSync(bytes, {level:6}); headers['Content-Encoding'] = 'gzip'; }
      headers['Content-Length'] = bytes.length;
      res.writeHead(200,headers); res.end(bytes);
    } catch (e) { res.writeHead(e.code === 'ENOENT' ? 404 : 500); res.end(String(e)); }
  }).listen(4321 + index, '127.0.0.1', () => console.log(`${variant}: http://127.0.0.1:${4321+index}`));
  servers.push(server);
}
process.on('SIGTERM', () => { for (const server of servers) server.close(); });
