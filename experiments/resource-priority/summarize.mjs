import fs from 'node:fs/promises';
const root='docs/benchmarks/resource-priority';
const {config,samples}=JSON.parse(await fs.readFile(`${root}/measurements.json`,'utf8'));
const median=a=>{const s=[...a].sort((a,b)=>a-b);return s[Math.floor(s.length/2)];};
const summary=[];
for(const route of config.pages)for(const variant of config.variants){
  const rows=samples.filter(s=>s.route===route&&s.variant===variant);
  if(rows.length!==config.runs)throw new Error(`Incomplete ${route}/${variant}`);
  const metrics=Object.fromEntries(['lcp','fcp','cssStart','cssEnd','fontStart','fontEnd','boldStart','boldEnd','cls','scriptMs','taskMs','jsEncoded','totalEncoded'].map(key=>[key,{median:median(rows.map(r=>r[key])),min:Math.min(...rows.map(r=>r[key])),max:Math.max(...rows.map(r=>r[key]))}]));
  summary.push({route,variant,runs:rows.length,...metrics,errors:rows.flatMap(r=>r.errors),failures:rows.flatMap(r=>r.failures),fontRequests:rows.map(r=>r.fontResponses.length)});
}
await fs.writeFile(`${root}/summary.json`,JSON.stringify({config,summary},null,2));
for(const row of summary)console.log(row.route,row.variant,JSON.stringify(Object.fromEntries(['lcp','cssEnd','fontStart','fontEnd','boldEnd','cls','jsEncoded'].map(k=>[k,row[k].median]))));
