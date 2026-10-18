// Public website + read/estimate checks. Never signs or broadcasts a transaction.
import {readFile,writeFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
const base=process.env.SCOPELOCK_URL||'https://clausepact-inclover05s-projects.vercel.app';
const live=JSON.parse(await readFile('reports/live-verification.json','utf8'));
const report={checkedAt:new Date().toISOString(),base,contract:live.contract,chainWritesSent:false,checks:[]};
async function request(path,body){const response=await fetch(base+path,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(55000)});return {status:response.status,value:await response.json()};}
async function check(name,fn){try{const evidence=await fn();report.checks.push({name,ok:true,evidence});}catch(error){report.checks.push({name,ok:false,error:error.message.slice(0,240)});}await writeFile('reports/api-verification.json',JSON.stringify(report,null,2)+'\n');}
await check('public homepage',async()=>{const response=await fetch(base,{signal:AbortSignal.timeout(20000)});const html=await response.text();assert.equal(response.status,200);assert.match(html,/Your work\. Clearly defined\./);return {httpStatus:200};});
await check('dedicated deployment configuration',async()=>{const {status,value}=await request('/api/chain?kind=config');assert.equal(status,200);assert.equal(value.contract.toLowerCase(),live.contract.toLowerCase());assert.equal(value.policy,'scopelock-scope-v1');assert.equal(value.chainId,4221);return value;});
await check('quote rejects unsupported operations and same-wallet agreements',async()=>{
 const action={contract:live.contract,from:live.creator,method:'create_agreement',args:[JSON.stringify({id:randomUUID(),policy:'scopelock-scope-v1',creator:live.creator,contributor:live.creator,title:'Invalid shared brief',requirements:['One page']})]};
 const a=await request('/api/chain',{kind:'quote',action});assert.equal(a.status,400);assert.match(a.value.error,/different contributor/);
 const b=await request('/api/chain',{kind:'quote',action:{...action,method:'transfer'}});assert.equal(b.status,400);assert.match(b.value.error,/Unsupported/);return {sameWallet:a.status,unsupported:b.status};
});
await check('valid creation fee estimate without a write',async()=>{
 const action={contract:live.contract,from:live.creator,method:'create_agreement',args:[JSON.stringify({id:randomUUID(),policy:'scopelock-scope-v1',creator:live.creator,contributor:live.contributor,title:'Read-only fee review fixture',requirements:['Build one Home page.']})]};
 const {status,value}=await request('/api/chain',{kind:'quote',action});assert.equal(status,200,value.error);assert.equal(value.transaction.from,live.creator);assert.equal(value.transaction.chainId,'0x107d');assert.ok(Number(value.maximumFee)>0);return {maximumFeeGEN:value.maximumFee,expiresAt:value.expiresAt};
});
for(const op of Object.values(live.operations).filter(x=>x.method&&x.evmHash)){
 await check(`track ${op.name}`,async()=>{
  const action={contract:live.contract,from:op.from,method:op.method,args:op.args};const {status,value}=await request('/api/chain',{kind:'track',action,hash:op.evmHash});assert.equal(status,200,value.error);
  assert.ok(['provisional','finalized','pending','execution_failed','no_consensus'].includes(value.state));
  if(value.record)assert.equal(value.record.id,op.method==='accept_agreement'?op.args[0]:JSON.parse(op.args[0]).id);
  return {state:value.state,genHash:value.genHash,classification:value.record?.classification};
 });
}
const published=live.operations.publish;
if(published?.evmHash)await check('foreign transaction payload rejected',async()=>{
 const data=JSON.parse(published.args[0]);data.title+=' — tampered';const action={contract:live.contract,from:published.from,method:published.method,args:[JSON.stringify(data)]};const {status,value}=await request('/api/chain',{kind:'track',action,hash:published.evmHash});assert.equal(status,400);assert.match(value.error,/does not match/);return {httpStatus:status};
});
await check('finalized agreement read-back',async()=>{assert.equal(live.operations.accept.state,'finalized','Acceptance is still provisional; a read alone is not finality proof.');const {status,value}=await request(`/api/chain?kind=agreement&id=${live.agreementId}`);assert.equal(status,200,value.error);assert.equal(value.record?.agreement_hash,live.operations.publish.record.agreement_hash);assert.equal(value.record?.accepted,true);return {accepted:true,requestIds:value.requestIds};});
for(const op of Object.values(live.operations).filter(x=>x.method==='request_ruling'&&x.record))await check(`finalized ruling ${op.name}`,async()=>{assert.equal(op.state,'finalized','Ruling transaction is still provisional.');const {status,value}=await request(`/api/chain?kind=ruling&id=${op.record.id}`);assert.equal(status,200,value.error);assert.equal(value.record?.request_hash,op.record.request_hash);assert.equal(value.record?.classification,op.record.classification);return {id:value.record.id,classification:value.record.classification};});
report.ok=report.checks.every(x=>x.ok);report.completedAt=new Date().toISOString();await writeFile('reports/api-verification.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({ok:report.ok,checks:report.checks.map(x=>({name:x.name,ok:x.ok,evidence:x.evidence,error:x.error}))}));if(!report.ok)process.exitCode=1;

