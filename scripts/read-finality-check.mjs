import {abi} from 'genlayer-js';
import {readFile,writeFile} from 'node:fs/promises';
const deployment=JSON.parse(await readFile('.wallet/deployment-rubric-v2.json','utf8'));
const data=abi.transactions.serialize([abi.calldata.encode(abi.calldata.makeCalldataObject('get_policy',[],undefined)),false]);
const results=[];
for(const status of ['accepted','finalized']){
 const response=await fetch('https://rpc-bradbury.genlayer.com',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'gen_call',params:[{type:'read',to:deployment.contractAddress,from:deployment.address,data,status,transaction_hash_variant:status==='finalized'?'latest-final':'latest-nonfinal'}]}),signal:AbortSignal.timeout(20000)});
 const value=await response.json();results.push({requestedStatus:status,response:value});
}
await writeFile('reports/read-finality-check.json',JSON.stringify({checkedAt:new Date().toISOString(),contract:deployment.contractAddress,results},null,2)+'\n');console.log(JSON.stringify(results));
