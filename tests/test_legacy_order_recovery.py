import json
from pathlib import Path
import pytest
from tests.node_harness import run_node_script


def test_legacy_lost_response_reload_and_explicit_retry_same_key(tmp_path):
    source = Path('app/static/p2p.js').read_text()
    script = r'''
const vm=require('node:vm'), assert=require('node:assert/strict'), crypto=require('node:crypto');
const records=new Map(); let server=null, posts=0, lost=true, reached=true, firstKey;
const storage={getItem:k=>records.get(k)||null,setItem:(k,v)=>records.set(k,v),removeItem:k=>records.delete(k)};
function session() {
 const ctx={console,Map,Date,JSON,Number,Math,crypto,localStorage:storage,me:{id:7,balance:1000},requireLogin(){},toast(){},document:{getElementById:()=>null},localeTag:()=> 'en-US'};
 ctx.api=async (path,options)=>{
   if(path.includes('/by-request/')) {if(server)return server; throw Object.assign(new Error('not found'),{status:404});}
   posts++; const body=JSON.parse(options.body); firstKey ||= body.request_id;
   assert.equal(body.request_id,firstKey); assert.equal(body.expected_user_id,7);
   assert.equal(body.money,100); if (!path.endsWith('/buy')) assert.equal(body.odds,2);
   if(reached) server={market_id:5,request_id:body.request_id,filled:40,remaining:60,refunded:0,status:'open',paid:100,kind:path.endsWith('/buy')?'legacy_buy':'limit'};
   if(lost) {lost=false; throw new Error('lost response');} return server;
 };
 vm.createContext(ctx); vm.runInContext(SOURCE,ctx);
 ctx.p2pShowRecovery=()=>{};ctx.p2pTerms=()=>({outcome:0,money:100,odds:2});return ctx;
}
(async()=>{
 let ctx=session(); const card={dataset:{id:'5'}};
 const results=await Promise.allSettled([ctx.p2pPlace(card,'limit'),ctx.p2pPlace(card,'limit')]);
 assert(results.every(r=>r.status==='rejected'));assert.equal(posts,1);assert.equal(records.size,1);
 ctx=session();await ctx.p2pRecoverPending(false); assert.equal(posts,1);assert.equal(records.size,0);
 server=null;firstKey=null;lost=true;reached=false;
 ctx=session();await assert.rejects(ctx.p2pPlace(card,'limit'));
 ctx=session();await assert.rejects(ctx.p2pRecoverPending(false));assert.equal(posts,2);
 reached=true;await ctx.p2pRecoverPending(true);assert.equal(posts,3);assert.equal(records.size,0);
 server=null;firstKey=null;lost=true;reached=true;
 ctx=session();await assert.rejects(ctx.p2pLegacyBuy(card,0,100));assert.equal(posts,4);
 ctx=session();await ctx.p2pRecoverPending(false);assert.equal(posts,4);assert.equal(records.size,0);
})().catch(e=>{console.error(e);process.exit(1)});
'''.replace('SOURCE', json.dumps(source))
    result=run_node_script(script,tmp_path,name='legacy_recovery.js')
    if result is None: pytest.skip('Node required')
    assert result.returncode==0, result.stderr+result.stdout
