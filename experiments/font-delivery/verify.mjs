import { chromium, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import sharp from 'sharp';
const before=process.env.BEFORE_ORIGIN||'https://6b062ea0074c202c5c9bbf55--saengmotmi.netlify.app';
const after=process.env.AFTER_ORIGIN||'http://127.0.0.1:4178';
const out=process.env.OUT_DIR||'docs/pr/font-delivery';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome'});const results=[];
try{
for(const width of [390,1280])for(const [name,route] of [['home','/'],['code','/react/rrv7-static-prerendering/']]){
 const snapshots=[];
 for(const [variant,origin] of [['before',before],['after',after]]){
  const context=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1,reducedMotion:'reduce'});
  await context.route('**/*',r=>{const u=new URL(r.request().url());return u.origin===origin&&!u.pathname.includes('/.netlify/')||['fonts.googleapis.com','fonts.gstatic.com'].includes(u.hostname)?r.continue():r.abort();});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+route);await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(500);
  const metrics=await page.evaluate(()=>({code:[...document.querySelectorAll('pre')].map(e=>({text:e.textContent,width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height,scrollWidth:e.scrollWidth,font:getComputedStyle(e).fontFamily})),fira:[...document.fonts].filter(f=>f.family.replaceAll('"','').replaceAll("'",'')==='Fira Code').map(f=>({weight:f.weight,status:f.status})),resources:performance.getEntriesByType('resource').map(e=>e.name)}));
  expect(errors).toEqual([]);
  if(variant==='after')expect(metrics.resources.filter(u=>/fonts\.(googleapis|gstatic)\.com/.test(u))).toEqual([]);
  const file=`${out}/${name}-${width}-${variant}.png`;await page.screenshot({path:file});
  if(name==='code'){
   expect(metrics.fira.some(f=>f.status==='loaded')).toBe(true);
   await page.locator('pre').first().scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/${name}-${width}-${variant}-block.png`});
  }
  snapshots.push({variant,metrics,file});await context.close();
 }
 expect(snapshots[0].metrics.code).toEqual(snapshots[1].metrics.code);
 for(const suffix of name==='code'?['','-block']:['']){
  const paths=snapshots.map(s=>s.file.replace('.png',suffix+'.png'));
  const a=await sharp(paths[0]).ensureAlpha().raw().toBuffer({resolveWithObject:true});const b=await sharp(paths[1]).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  expect(a.info).toEqual(b.info);let pixels=0;const diff=Buffer.alloc(a.data.length);
  for(let i=0;i<diff.length;i+=4){let changed=false;for(let j=0;j<3;j++){diff[i+j]=Math.abs(a.data[i+j]-b.data[i+j]);changed ||= diff[i+j]!==0;}diff[i+3]=255;if(changed)pixels++;}
  await sharp(diff,{raw:a.info}).png().toFile(`${out}/${name}-${width}${suffix}-diff.png`);
  results.push({name,width,suffix,diffPixels:pixels});
 }
 await fs.writeFile(`${out}/${name}-${width}-metrics.json`,JSON.stringify(snapshots,null,2));
}
await fs.writeFile(`${out}/visual-results.json`,JSON.stringify({before,after,results},null,2));console.log(results);
expect(results.every(r=>r.diffPixels===0)).toBe(true);
}finally{await browser.close();}
