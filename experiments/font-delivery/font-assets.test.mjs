import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const root=new URL('../../app/fonts/FiraCode/',import.meta.url);
test('vendored WOFF2 subsets match original Google Fonts v27 bytes',async()=>{
 const sources=JSON.parse(await readFile(new URL('sources.json',root),'utf8'));
 assert.equal(sources.length,7);
 for(const source of sources){
  const bytes=await readFile(new URL(source.file,root));
  assert.equal(bytes.subarray(0,4).toString(),'wOF2');
  assert.equal(createHash('sha256').update(bytes).digest('hex'),source.sha256);
 }
 assert.match(await readFile(new URL('OFL.txt',root),'utf8'),/SIL OPEN FONT LICENSE Version 1.1/);
});
test('font faces retain weight, swap and unicode ranges without external CSS imports',async()=>{
 const css=await readFile(new URL('fira-code.css',root),'utf8');
 for(const token of ['@font-face','font-weight: 400','font-display: swap','unicode-range:'])assert.equal(css.split(token).length-1,7);
 assert.doesNotMatch(css,/@import|https?:/);
 assert.doesNotMatch(await readFile(new URL('../../app/prism/prism-vsc-dark-plus.css',import.meta.url),'utf8'),/@import/);
});
