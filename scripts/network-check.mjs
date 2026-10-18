import {createPublicClient,http} from 'viem';
import {testnetBradbury} from 'genlayer-js/chains';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const evm=createPublicClient({transport:http('https://rpc.testnet-chain.genlayer.com',{timeout:15000,retryCount:0})});
const source=await readFile('contracts/scopelock.py');
const report={checkedAt:new Date().toISOString(),sdkVersion:'1.1.8',runtime:'v0.2.17',network:'testnet-bradbury',expectedChainId:4221,consensus:testnetBradbury.consensusMainContract.address,sourceSha256:createHash('sha256').update(source).digest('hex'),chainWritesSent:false};
try{
 report.chainId=await evm.getChainId();report.consensusCode=Boolean(await evm.getCode({address:report.consensus}));
 const response=await fetch('https://rpc-bradbury.genlayer.com',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'eth_chainId',params:[]}),signal:AbortSignal.timeout(15000)});
 const data=await response.json();report.lifecycleChainId=Number(data.result);
 report.ok=report.chainId===4221&&report.lifecycleChainId===4221&&report.consensusCode;
}catch(error){report.ok=false;report.error=error.name;}
await writeFile('reports/network-preflight.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(!report.ok)process.exitCode=1;
