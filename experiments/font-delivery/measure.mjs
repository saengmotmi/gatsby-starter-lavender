import { chromium, expect } from '@playwright/test';
import fs from 'node:fs/promises';
const out=process.env.OUT_DIR||'docs/benchmarks/font-delivery';await fs.mkdir(out,{recursive:true});
const variants=[{name:'before',origin:'https://6b062ea0074c202c5c9bbf55--saengmotmi.netlify.app'},{name:'after',origin:process.env.AFTER_ORIGIN||'https://saengmotmi.netlify.app'}];
const routes=['/','/react/what-is-rsc/','/react/rrv7-static-prerendering/'];const runs=Number(process.env.RUNS||5);
const browser=await chromium.launch({channel:'chrome'});
const config={at:new Date().toISOString(),browser:browser.version(),variants,routes,runs,viewport:{width:390,height:844},dpr:1,mobile:true,cpu:4,network:{latency:562.5,downloadThroughput:180000,uploadThroughput:84375},cache:'Fresh context per sample, browser cache disabled, CDN cache uncontrolled; per-route warmups excluded',external:'Google Fonts/GTM/Utterances preserved; Netlify RUM and GA collection blocked with CDP, not route interception',sampling:'load + fonts.ready + 1000ms',order:'Alternate variants within pairs, rotate page order'};
const samples=[];
async function measure(v,route,run,warmup=false){
 const context=await browser.newContext({viewport:config.viewport,deviceScaleFactor:1,isMobile:true,hasTouch:true,serviceWorkers:'block'});const page=await context.newPage();
 const errors=[],responses=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{const h=r.headers();responses.push({url:r.url(),status:r.status(),cache:h['cache-status'],age:h.age,encoding:h['content-encoding']});});
 await page.addInitScript(()=>{
  window.__perf={lcp:0,cls:0,lcpElement:'',longTasks:[]};
  new PerformanceObserver(list=>{for(const e of list.getEntries()){window.__perf.lcp=e.startTime;window.__perf.lcpElement=e.element?.tagName+':'+e.element?.textContent?.slice(0,100);}}).observe({type:'largest-contentful-paint',buffered:true});
  new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)window.__perf.cls+=e.value;}).observe({type:'layout-shift',buffered:true});
  new PerformanceObserver(list=>{for(const e of list.getEntries())window.__perf.longTasks.push({start:e.startTime,duration:e.duration});}).observe({type:'longtask',buffered:true});
 });
 const cdp=await context.newCDPSession(page);await cdp.send('Network.enable');
 await cdp.send('Network.setBlockedURLs',{urls:['*/.netlify/scripts/rum*','*google-analytics.com/*','*analytics.google.com/*']});
 await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
 if(!warmup){await cdp.send('Network.emulateNetworkConditions',{offline:false,...config.network,connectionType:'cellular3g'});await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});}
 try{
  const r=await page.goto(v.origin+route,{waitUntil:'load',timeout:60000});await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(1000);
  const data=await page.evaluate(()=>({ ...window.__perf,fcp:performance.getEntriesByName('first-contentful-paint')[0]?.startTime,ttfb:performance.getEntriesByType('navigation')[0].responseStart,resources:performance.getEntriesByType('resource').map(e=>({url:e.name,start:e.startTime,end:e.responseEnd,encoded:e.encodedBodySize,decoded:e.decodedBodySize,transfer:e.transferSize,type:e.initiatorType})),fonts:[...document.fonts].map(f=>({family:f.family,status:f.status})),fontStatus:document.fonts.status}));
  expect(r.status()).toBe(200);expect(data.lcp).toBeGreaterThan(0);expect(errors).toEqual([]);expect(responses.filter(r=>r.url.startsWith(v.origin)&&r.status>=400)).toEqual([]);
  if(v.name==='after')expect(data.resources.filter(r=>/fonts\.(googleapis|gstatic)\.com/.test(r.url))).toEqual([]);
  const sample={variant:v.name,route,run,...data,errors,responses};
  if(!warmup){samples.push(sample);await fs.writeFile(`${out}/measurements.json`,JSON.stringify({config,samples},null,2));}
  console.log(JSON.stringify({warmup,variant:v.name,route,run,lcp:data.lcp,ttfb:data.ttfb}));
 }finally{await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1}).catch(()=>{});await context.close();}
}
try{
 for(const route of routes)for(const v of variants)await measure(v,route,-1,true);
 for(let run=0;run<runs;run++)for(let i=0;i<routes.length;i++)for(const v of run%2?[...variants].reverse():variants)await measure(v,routes[(i+run)%routes.length],run);
}finally{await browser.close();}
const median=a=>{const b=[...a].sort((a,b)=>a-b);return b.length%2?b[(b.length-1)/2]:(b[b.length/2-1]+b[b.length/2])/2;};
const summary=routes.map(route=>{
 const sets=Object.fromEntries(variants.map(v=>[v.name,samples.filter(s=>s.route===route&&s.variant===v.name)]));
 const before=median(sets.before.map(s=>s.lcp)),after=median(sets.after.map(s=>s.lcp));
 const differences=sets.before.map(s=>sets.after.find(a=>a.run===s.run).lcp-s.lcp);
 return {route,before,after,changePct:(after/before-1)*100,pairedDifferences:differences,ttfbBefore:median(sets.before.map(s=>s.ttfb)),ttfbAfter:median(sets.after.map(s=>s.ttfb)),clsBefore:median(sets.before.map(s=>s.cls)),clsAfter:median(sets.after.map(s=>s.cls))};
});
await fs.writeFile(`${out}/summary.json`,JSON.stringify(summary,null,2));console.log(summary);
