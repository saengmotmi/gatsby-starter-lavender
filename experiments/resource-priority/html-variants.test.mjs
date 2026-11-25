import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { transformHead } from './html-variants.mjs';
import { prioritizeStylesheets } from '../../scripts/prioritize-stylesheets.mjs';

const fonts = { Regular:'/regular.woff2', Bold:'/bold.woff2', Black:'/black.woff2' };
const fixture = '<html><head><meta charset="utf-8"/><link rel="modulepreload" href="/a.js"/><link rel="stylesheet" href="/one.css"/><link rel="stylesheet" href="/two.css"/><script>const x=1;</script></head><body>한글 본문</body></html>';
test('baseline is byte-identical',()=>assert.equal(transformHead(fixture,'baseline',fonts),fixture));
test('CSS order and every tag are preserved; only link placement changes',()=>{
  const html=transformHead(fixture,'css-first',fonts);
  assert.ok(html.indexOf('/one.css')<html.indexOf('/two.css'));
  assert.ok(html.indexOf('/two.css')<html.indexOf('/a.js'));
  assert.equal(html.length,fixture.length);
  assert.equal(transformHead(html,'css-first',fonts),html);
  assert.equal(html.split('</head>')[1],fixture.split('</head>')[1]);
});
test('single-font preload is anonymous and not all fonts',()=>{
  const html=transformHead(fixture,'font-bold',fonts);
  assert.equal((html.match(/as="font"/g)||[]).length,1);
  assert.ok(html.includes('href="/bold.woff2" as="font" type="font/woff2" crossorigin="anonymous"'));
  assert.ok(!html.includes('/regular.woff2'));
});
test('all-font treatment adds exactly three hints',()=>assert.equal((transformHead(fixture,'font-all',fonts).match(/as="font"/g)||[]).length,3));
test('production transform is idempotent and leaves no-resource heads alone',()=>{
  assert.equal(prioritizeStylesheets('<head><title>Only text</title></head>'),'<head><title>Only text</title></head>');
  const once=prioritizeStylesheets(fixture);
  assert.equal(prioritizeStylesheets(once),once);
});
test('fail loudly when the known generated head contract changes',()=>assert.throws(()=>transformHead('<head></head>','css-first',fonts)));
test('all prerendered HTML preserves body and stylesheet order in every treatment',async()=>{
  const root=path.resolve('build/client');
  const files=(await fs.readdir(root,{recursive:true})).filter(f=>f.endsWith('.html'));
  assert.ok(files.length>=47);
  for(const f of files){
    const html=await fs.readFile(path.join(root,f),'utf8');
    assert.equal(prioritizeStylesheets(html),transformHead(html,'css-first',fonts),f);
    for(const variant of ['css-first','font-bold','font-all']){
      const result=transformHead(html,variant,fonts);
      assert.equal(result.slice(result.indexOf('</head>')),html.slice(html.indexOf('</head>')),f);
      assert.deepEqual([...result.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*>/g)].map(m=>m[0]),[...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*>/g)].map(m=>m[0]));
    }
  }
});
