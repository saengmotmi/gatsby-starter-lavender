import { chromium, expect } from '@playwright/test';
import fs from 'node:fs/promises';

const out = 'docs/benchmarks/resource-priority';
await fs.mkdir(out, { recursive: true });
const variants = ['baseline','css-first','font-bold','font-all'];
const pages = ['/', '/react/what-is-rsc/', '/react/rrv7-static-prerendering/'];
const runs = Number(process.env.RUNS || 5);
const samples = [];
const browser = await chromium.launch();
const config = { browser: browser.version(), viewport: {width:390,height:844}, runs, pages, variants, cpu:4, latencyMs:40, downloadBytesPerSecond:200000, uploadBytesPerSecond:100000, gzipLevel:6, cache:'new context; no-store; interception disables browser cache', external:'blocked', sampling:'load + fonts.ready + 500ms; original viewport prefetch enabled' };
try {
  for (let run=0;run<runs;run++) for (const route of pages) for (let offset=0;offset<variants.length;offset++) {
    const index = (offset+run)%variants.length;
    const variant=variants[index], origin=`http://127.0.0.1:${4321+index}`;
    const context=await browser.newContext({viewport:config.viewport,deviceScaleFactor:1,serviceWorkers:'block'});
    const page=await context.newPage();
    const errors=[], failures=[], fontResponses=[];
    page.on('pageerror', e=>errors.push(e.message));
    page.on('response', r=>{if(r.url().startsWith(origin)){if(r.status()>=400)failures.push({url:r.url(),status:r.status()});if(r.url().endsWith('.woff2'))fontResponses.push(r.url());}});
    await context.route('**/*', r=>r.request().url().startsWith(origin)?r.continue():r.abort());
    await page.addInitScript(()=>{
      window.__perf={lcp:0,lcpElement:'',cls:0,longTaskMs:0};
      new PerformanceObserver(l=>{for(const e of l.getEntries()){window.__perf.lcp=e.startTime;window.__perf.lcpElement=e.element?.outerHTML.slice(0,200)||'';}}).observe({type:'largest-contentful-paint',buffered:true});
      new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput)window.__perf.cls+=e.value;}).observe({type:'layout-shift',buffered:true});
      new PerformanceObserver(l=>{for(const e of l.getEntries())window.__perf.longTaskMs+=e.duration;}).observe({type:'longtask',buffered:true});
    });
    const cdp=await context.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:40,downloadThroughput:200000,uploadThroughput:100000,connectionType:'cellular4g'});
    await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
    await cdp.send('Performance.enable');
    const response=await page.goto(origin+route,{waitUntil:'load'});
    await page.evaluate(()=>document.fonts.ready);
    await page.waitForTimeout(500);
    const stats=await page.evaluate(()=>{
      const all=performance.getEntriesByType('resource').filter(e=>e.name.startsWith(location.origin));
      const css=all.filter(e=>new URL(e.name).pathname.endsWith('.css'));
      const fonts=all.filter(e=>new URL(e.name).pathname.endsWith('.woff2'));
      const js=all.filter(e=>new URL(e.name).pathname.endsWith('.js'));
      const nav=performance.getEntriesByType('navigation')[0];
      return {...window.__perf,fcp:performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
        cssStart:Math.min(...css.map(e=>e.startTime)),cssEnd:Math.max(...css.map(e=>e.responseEnd)),
        fontStart:Math.min(...fonts.map(e=>e.startTime)),fontEnd:Math.max(...fonts.map(e=>e.responseEnd)),
        boldStart:fonts.find(e=>e.name.includes('-Bold.'))?.startTime,boldEnd:fonts.find(e=>e.name.includes('-Bold.'))?.responseEnd,
        jsEncoded:js.reduce((s,e)=>s+e.encodedBodySize,0),totalEncoded:nav.encodedBodySize+all.reduce((s,e)=>s+e.encodedBodySize,0),
        resources:all.map(e=>({path:new URL(e.name).pathname,type:e.initiatorType,start:e.startTime,end:e.responseEnd,encoded:e.encodedBodySize,decoded:e.decodedBodySize})),
        fontStatus:document.fonts.status,
      };
    });
    const metrics=Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value]));
    expect(response.status()).toBe(200);expect(errors).toEqual([]);expect(failures).toEqual([]);expect(stats.fontStatus).toBe('loaded');
    const sample={variant,route,run,...stats,scriptMs:metrics.ScriptDuration*1000,taskMs:metrics.TaskDuration*1000,errors,failures,fontResponses};
    samples.push(sample);
    await fs.writeFile(`${out}/measurements.json`,JSON.stringify({config,samples},null,2));
    console.log(JSON.stringify({variant,route,run,lcp:stats.lcp,cssStart:stats.cssStart,fontStart:stats.fontStart,fontEnd:stats.fontEnd}));
    await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});
    await context.close();
  }
} finally {await browser.close();}
