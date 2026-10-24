// Read-only; structural parity is not linguistic/visual acceptance.
// Run from repository root after npm ci --prefix frontend.
const fs=require('node:fs'), vm=require('node:vm'), path=require('node:path');
const ts=require(path.resolve('frontend/node_modules/typescript'));
function load(file,extra='') {
 const ctx={exports:{}};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8')+extra,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,ctx);
 return ctx.exports;
}
const legacy=vm.runInNewContext(fs.readFileSync('app/static/i18n.js','utf8')+'\nI18N');
const react=load('frontend/src/i18n/messages.ts').MESSAGES;
const copy=load('frontend/src/api/eventsV3Copy.ts','\nexport const auditCopy=COPY;').auditCopy;
const slots=s=>[...String(s).matchAll(/\{([a-zA-Z_][\w]*)\}/g)].map(m=>m[1]).sort().join(',');
function check(d){return Object.fromEntries(['ru','en','zh'].map(l=>[l,{keys:Object.keys(d[l]).length,missing:Object.keys(d.ru).filter(k=>!(k in d[l])),extra:Object.keys(d[l]).filter(k=>!(k in d.ru)),placeholderMismatch:Object.keys(d.ru).filter(k=>slots(d.ru[k])!==slots(d[l][k]))}]))}
console.log(JSON.stringify({scope:'Static catalogue keys and named placeholders only; excludes dynamic rendering, raw backend text and language quality',legacy:check(legacy),react:check(react),eventCopyEntries:Object.keys(copy).length,eventCopyIncomplete:Object.entries(copy).filter(([k,v])=>v.length!==2||v.some(x=>!x))},null,2));
