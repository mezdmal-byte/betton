// Build-only experiment. Virtual transformation; no application file is changed.
// Run from this isolated worktree: node diagnostic-splitting.mjs
import fs from 'node:fs';
import path from 'node:path';
import {gzipSync,brotliCompressSync} from 'node:zlib';
import {build} from './frontend/node_modules/vite/dist/node/index.js';
const root=path.resolve('frontend');
const selected=['ConnectedCreateMarketScreen','ConnectedModerationScreen','ConnectedChatScreen','ConnectedPortfolioScreen','ConnectedPublicProfileScreen','HelpScreen','WalletScreen','CreateMarketResult'];
const plugin={name:'audit-virtual-lazy',enforce:'pre',transform(code,id){
 if(!id.endsWith('/src/app/ConnectedApp.tsx'))return;
 code=code.replace("import { useEffect,", "import { lazy, Suspense, useEffect,");
 for(const name of selected){
   const pattern=new RegExp(`import \\{ ${name} \\} from '([^']+)'`);
   if(!pattern.test(code))throw new Error('Missing static import '+name);
   code=code.replace(pattern,(_,source)=>`const ${name} = lazy(() => import('${source}').then(m => ({default:m.${name}})))`);
 }
 // The provider is the stable outer root in this pinned version.
 code=code.replace('<NotificationBadgeContext.Provider', '<Suspense fallback={<div role="status">Загружаем экран…</div>}><NotificationBadgeContext.Provider');
 code=code.replace('</NotificationBadgeContext.Provider>', '</NotificationBadgeContext.Provider></Suspense>');
 return {code,map:null};
}};
const output=await build({root,configFile:path.join(root,'vite.config.ts'),plugins:[plugin],logLevel:'warn',build:{write:false}});
const chunks=output.output.filter(x=>x.type==='chunk');
const initial=new Set();
function add(file){if(initial.has(file))return;initial.add(file); for(const name of chunks.find(c=>c.fileName===file)?.imports??[])add(name);}
for(const c of chunks.filter(c=>c.isEntry))add(c.fileName);
const artifacts=output.output.map(x=>{const data=Buffer.from(x.type==='chunk'?x.code:x.source);return {file:x.fileName,initialJS:x.type==='chunk'&&initial.has(x.fileName),bytes:data.length,gzip:gzipSync(data).length,brotli:brotliCompressSync(data).length,imports:x.imports,dynamicImports:x.dynamicImports};});
const totals={bytes:0,gzip:0,brotli:0};for(const a of artifacts.filter(a=>a.initialJS))for(const k of Object.keys(totals))totals[k]+=a[k];
fs.writeFileSync('splitting-result.json',JSON.stringify({source:'1c0f7cb0fa802e3d6a2a77f7873489208a775327',selected,initialJS:totals,artifacts,limits:'Build experiment only: no runtime/navigation or error-boundary validation. Initial sums include statically imported shared chunks; gzip/Brotli are independent per-file streams.'},null,2));
console.log(JSON.stringify({initialJS:totals,chunks:chunks.length},null,2));
