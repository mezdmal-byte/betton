import fs from 'node:fs';
import path from 'node:path';
import { gzipSync, brotliCompressSync } from 'node:zlib';
import { build } from '../../../frontend/node_modules/vite/dist/node/index.js';
const root=path.resolve('frontend');
const output=await build({root,configFile:path.join(root,'vite.config.ts'),logLevel:'silent',build:{write:false}});
const rows=[]; const modules=[];
for(const item of output.output){
 const data=Buffer.from(item.type==='chunk'?item.code:item.source);
 rows.push({file:item.fileName,bytes:data.length,gzip:gzipSync(data).length,brotli:brotliCompressSync(data).length});
 if(item.type==='chunk') for(const [id,m] of Object.entries(item.modules)) modules.push({id:id.replace(root+'/',''),renderedLength:m.renderedLength,originalLength:m.originalLength});
}
const groups={};for(const m of modules){const group=m.id.includes('/node_modules/react-dom/')?'react-dom':m.id.includes('/node_modules/react/')?'react':m.id.includes('/node_modules/@tanstack/')?'tanstack':m.id.includes('/node_modules/lucide-react/')?'lucide':m.id.includes('/node_modules/')?'other-dependencies':m.id.startsWith('src/')?m.id.split('/').slice(0,2).join('/'):'other';groups[group]=(groups[group]||0)+m.renderedLength;}
fs.writeFileSync('docs/audit/evidence/bundle-analysis.json',JSON.stringify({note:'renderedLength is Rollup module contribution before final chunk minification; not additive compressed bytes',artifacts:rows,groups,topModules:modules.sort((a,b)=>b.renderedLength-a.renderedLength).slice(0,40)},null,2));
