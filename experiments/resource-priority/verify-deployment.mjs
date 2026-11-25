import { chromium, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const origin = (process.argv[2] || 'https://saengmotmi.netlify.app').replace(/\/$/,'');
const output = process.argv[3] || 'docs/pr/ssg-resource-priority/deployment.json';
const posts = JSON.parse(await fs.readFile('app/generated/posts.json','utf8')).filter(p=>!p.draft);
const report = { origin, at:new Date().toISOString(), pages:[], functional:{}, externalServices:'GTM/comments blocked for deterministic functional checks' };
// Bounded batches; inspect the real canonical CDN URLs, not cache-busting aliases.
const routes=['/',...posts.map(p=>p.path)];
for(let i=0;i<routes.length;i+=4){
  await Promise.all(routes.slice(i,i+4).map(async route=>{
    const response=await fetch(origin+route,{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(30000)});
    const html=await response.text();const head=html.split('</head>')[0];
    const styles=[...head.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*>/g)];
    const firstModule=head.indexOf('rel="modulepreload"');
    const cssFirst=styles.length>0&&firstModule>=0&&styles.every(m=>m.index<firstModule);
    const fontPreloads=[...head.matchAll(/<link\b[^>]*>/g)].filter(m=>m[0].includes('rel="preload"')&&m[0].includes('as="font"')).length;
    report.pages.push({route,status:response.status,cssFirst,fontPreloads,etag:response.headers.get('etag')});
    expect(response.status,route).toBe(200);expect(cssFirst,route).toBe(true);expect(fontPreloads,route).toBe(0);
  }));
}
const browser=await chromium.launch();
try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const errors=[],failures=[],documents=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)failures.push({url:r.url(),status:r.status()});});
  page.on('request',r=>{if(r.isNavigationRequest()&&r.frame()===page.mainFrame())documents.push(r.url());});
  await page.route('**/*',r=>r.request().url().startsWith(origin)?r.continue():r.abort());
  await page.goto(origin+'/');await page.evaluate(()=>document.fonts.ready);
  await page.locator('header [role=button]').click();await expect(page.locator('header [role=button]')).toHaveAttribute('aria-pressed','true');
  await page.locator('header [role=button]').click();
  await page.getByRole('button',{name:'Fleeting',exact:true}).click();await expect(page).toHaveURL(/type=fleeting/);
  await page.getByRole('button',{name:'Article',exact:true}).click();
  await page.locator('a[href="/react/what-is-rsc/"]').first().click();await expect(page.locator('article h1').first()).toContainText('RSC');
  await page.evaluate(()=>scrollTo(0,1400));await page.waitForTimeout(200);
  await page.goBack();await expect(page).toHaveURL(origin+'/');await page.goForward();
  await expect.poll(()=>page.evaluate(()=>scrollY)).toBeGreaterThan(1260);expect(documents).toHaveLength(1);
  const anchor=page.locator('article a[href^="#"]').first();const hash=await anchor.getAttribute('href');await anchor.click();
  await expect.poll(()=>page.evaluate(id=>{const t=document.getElementById(id)?.getBoundingClientRect().top;return t!==undefined&&t>=0&&t<innerHeight*0.6;},decodeURIComponent(hash.slice(1)))).toBe(true);
  await page.goto(origin+'/javascript-study/2021-09-01-클로저/');await expect(page.locator('article h1').first()).toContainText('클로저');
  expect(errors).toEqual([]);expect(failures).toEqual([]);
  report.functional={theme:true,filters:true,clientNavigation:true,historyScroll:true,hash:true,koreanPath:true,errors,failures};
}finally{await browser.close();await fs.mkdir(path.dirname(output),{recursive:true});await fs.writeFile(output,JSON.stringify(report,null,2));}
console.log(JSON.stringify({origin,pages:report.pages.length,cssFirst:report.pages.every(p=>p.cssFirst),...report.functional},null,2));
