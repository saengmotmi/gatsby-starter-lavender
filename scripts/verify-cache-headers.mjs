import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const origin=process.env.ORIGIN||'https://saengmotmi.netlify.app';
const out=process.env.OUT_FILE||'/tmp/cache-headers.json';
const html=await fetch(origin).then(r=>r.text());
const paths=[...new Set([...html.matchAll(/(?:href|src)="(\/assets\/[^"?#]+)"/g)].map(m=>m[1]))];
const cssPath=paths.find(p=>p.endsWith('.css'));
assert.ok(cssPath);
const css=await fetch(origin+cssPath).then(r=>r.text());
const fontPath=css.match(/url\(["']?(\/assets\/[^)'" ]+\.woff2)/)?.[1];assert.ok(fontPath);
const checks=[['/',/max-age=0.*must-revalidate/],['/react/what-is-rsc/',/max-age=0.*must-revalidate/],[cssPath,/max-age=31536000.*immutable/],[paths.find(p=>p.endsWith('.js')),/max-age=31536000.*immutable/],[fontPath,/max-age=31536000.*immutable/],['/sw.js',/no-cache.*no-store.*must-revalidate/]];
const rows=[];
for(const [path,expected] of checks){
 const response=await fetch(origin+path);await response.arrayBuffer();
 rows.push({path,status:response.status,cacheControl:response.headers.get('cache-control'),cacheStatus:response.headers.get('cache-status')});
 assert.equal(response.status,200,path);assert.match(response.headers.get('cache-control')||'',expected,path);
}
await fs.writeFile(out,JSON.stringify({origin,at:new Date().toISOString(),rows},null,2)+'\n');console.log(rows);
