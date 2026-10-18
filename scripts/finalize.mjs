// Finalize only this release's recorded test operations, after the protocol permits it.
import {readFile,writeFile} from 'node:fs/promises';
import {createClient} from 'genlayer-js';
import {testnetBradbury} from 'genlayer-js/chains';
import {createPublicClient,http,encodeFunctionData,keccak256,formatEther,parseEther} from 'viem';
const {loadBradburyTestAccount}=await import(process.env.SCOPELOCK_SIGNER_MODULE||'./test-wallet.mjs');
const account=await loadBradburyTestAccount();
const chain={...testnetBradbury,rpcUrls:{default:{http:['https://rpc.testnet-chain.genlayer.com']}}};
const evm=createPublicClient({chain,transport:http(chain.rpcUrls.default.http[0],{timeout:12000,retryCount:0})});
const gen=createClient({chain:{...testnetBradbury,rpcUrls:{default:{http:['https://rpc-bradbury.genlayer.com']}}}});
const deployment=JSON.parse(await readFile('.wallet/deployment-rubric-v2.json','utf8'));
let live;try{live=JSON.parse(await readFile('reports/live-verification.json','utf8'));}catch{}
const operations=[{name:'deployment',genHash:deployment.genHash},...Object.values(live?.operations||{}).filter(x=>x.genHash)];
const json=value=>JSON.stringify(value,(_,v)=>typeof v==='bigint'?v.toString():v,2)+'\n';
let report;try{report=JSON.parse(await readFile('reports/finalization.json','utf8'));}catch{report={attempts:{}};}
try{
 if(await evm.getChainId()!==4221)throw Error('Wrong chain.');
 for(const op of operations){
  if(!op.genHash)continue;
  const tx=await gen.getTransaction({hash:op.genHash});const block=await evm.getBlock();
  const ready=tx.statusName==='FINALIZED'?[false]:await evm.readContract({address:chain.consensusDataContract.address,abi:chain.consensusDataContract.abi,functionName:'canFinalize',args:[op.genHash,block.timestamp]});
  const state={name:op.name,genHash:op.genHash,status:tx.statusName,execution:tx.txExecutionResultName,result:tx.resultName,canFinalize:ready[0],readiness:ready,checkedAt:new Date().toISOString()};
  if(ready[0]&&!report.attempts[op.genHash]){
   const data=encodeFunctionData({abi:chain.consensusMainContract.abi,functionName:'finalizeTransaction',args:[op.genHash]});
   const gas=(await evm.estimateGas({account:account.address,to:chain.consensusMainContract.address,data,value:0n}))*120n/100n;const gasPrice=await evm.getGasPrice();
   if(gas*gasPrice>parseEther('0.015')||await evm.getBalance({address:account.address})<gas*gasPrice)throw Error('Finalization test budget exceeded.');
   const nonce=await evm.getTransactionCount({address:account.address,blockTag:'pending'});
   const journal={genHash:op.genHash,name:op.name,nonce,maximumNetworkFeeGEN:formatEther(gas*gasPrice),state:'preparing_signature'};
   report.attempts[op.genHash]=journal;await writeFile('reports/finalization.json',json(report));
   const signed=await account.signTransaction({to:chain.consensusMainContract.address,data,gas,gasPrice,nonce,chainId:4221,value:0n,type:'legacy'});
   journal.evmHash=keccak256(signed);journal.state='uncertain';await writeFile('reports/finalization.json',json(report));
   const returned=await evm.sendRawTransaction({serializedTransaction:signed});if(returned!==journal.evmHash)throw Error('Hash mismatch.');journal.state='broadcast';await evm.waitForTransactionReceipt({hash:returned,timeout:20000});
  }
  report[op.name]=state;
 }
 await writeFile('reports/finalization.json',json(report));console.log(json(Object.values(report).filter(x=>x?.name)));
}catch(error){console.error(error.name+': finalization check failed; inspect journals, no automatic resend.');process.exitCode=1;}
