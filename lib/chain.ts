import { createHash } from 'node:crypto';
import { abi, createClient } from 'genlayer-js';
import type { Hash as GenHash } from 'genlayer-js/types';
import { testnetBradbury } from 'genlayer-js/chains';
import { createPublicClient, http, encodeFunctionData, decodeFunctionData, parseEventLogs, toHex, fromHex, formatEther, type Hex } from 'viem';
import { POLICY, ADDRESS, ID, HASH, validateBrief, lifecycle, rulingMatches } from './core.mjs';
import type { Action, Agreement, Ruling } from './types';
import { matchesFinalizedWrite, successfulFinality } from './finality.mjs';
export const EVM_RPC='https://rpc.testnet-chain.genlayer.com';
export const GEN_RPC='https://rpc-bradbury.genlayer.com';
const chain={...testnetBradbury,rpcUrls:{default:{http:[EVM_RPC]}}};
const evm=createPublicClient({chain,transport:http(EVM_RPC,{timeout:12000,retryCount:0})});
const gen=createClient({chain:{...testnetBradbury,rpcUrls:{default:{http:[GEN_RPC]}}}});
export const consensus=chain.consensusMainContract!;
export const configured=()=>process.env.NEXT_PUBLIC_SCOPELOCK_CONTRACT || '';
const digest=(value:string)=>createHash('sha256').update(value).digest('hex');
export function calldata(method:string,args:string[]){return abi.transactions.serialize([abi.calldata.encode(abi.calldata.makeCalldataObject(method,args,undefined)),false]);}
type FinalizedRow={txId:Hex;status:number;result:number;recipient:string;sender:string;txCalldata:Hex};
type FinalityContext={rows?:Promise<readonly FinalizedRow[]>;checks:Map<string,Promise<boolean>>};
export function finalityContext():FinalityContext{return {checks:new Map()};}
async function finalizedWrite(method:string,args:string[],sender:string,context:FinalityContext){
 const contract=configured();const data=calldata(method,args);const key=`${sender}:${data}`;
 if(!context.rows)context.rows=(async()=>{
  const source=chain.consensusDataContract!;
  const count=await evm.readContract({address:source.address,abi:source.abi,functionName:'getLatestFinalizedTxCount',args:[contract as Hex]}) as bigint;
  // Bound anonymous reads. Older writes fail closed rather than inherit a final label.
  const start=count>1000n?count-1000n:0n;
  const pages=[];
  for(let offset=start;offset<count;offset+=50n)pages.push(evm.readContract({address:source.address,abi:source.abi,functionName:'getLatestFinalizedTransactions',args:[contract as Hex,offset,50n]}));
  return (await Promise.all(pages)).flat() as readonly FinalizedRow[];
 })();
 if(!context.checks.has(key))context.checks.set(key,(async()=>{
  const matches=(await context.rows!).filter(row=>matchesFinalizedWrite(row,contract,sender,data));
  for(const row of matches){if(successfulFinality(await gen.getTransaction({hash:row.txId as GenHash})))return true;}
  return false;
 })());
 return context.checks.get(key)!;
}
export async function rpc(method:string,params:unknown[]){
 const response=await fetch(GEN_RPC,{method:'POST',headers:{'Content-Type':'application/json','User-Agent':'ScopeLock/1.0'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),signal:AbortSignal.timeout(20000),cache:'no-store'});
 if(!response.ok)throw Error('GenLayer is unavailable. Saved transactions will not be resent.');
 const data=await response.json();if(data.error)throw Error('GenLayer read failed. Try refreshing later.');return data.result;
}
export async function read(method:string,args:string[],final=true):Promise<string>{
 const contract=configured();if(!ADDRESS.test(contract))throw Error('The ScopeLock contract is not configured.');
 const raw=await rpc('gen_call',[{type:'read',to:contract,from:'0x0000000000000000000000000000000000000001',data:calldata(method,args),status:final?'finalized':'accepted',transaction_hash_variant:final?'latest-final':'latest-nonfinal'}]);
 if(typeof raw!=='string'&&raw.status?.code!==undefined&&raw.status.code!==0)throw Error('Contract read failed.');
 const hex=typeof raw==='string'?raw:raw.data;if(typeof hex!=='string')throw Error('Invalid contract response.');
 return String(abi.calldata.decode(fromHex((hex.startsWith('0x')?hex:`0x${hex}`) as Hex,'bytes')));
}
export async function agreement(id:string,final=true,context=finalityContext()):Promise<Agreement|null>{
 if(!ID.test(id))throw Error('Invalid agreement ID.');const raw=await read('get_agreement',[id],final);if(!raw)return null;
 const value=JSON.parse(raw) as Agreement;
 if(value.id!==id||value.policy!==POLICY||digest(value.payload)!==value.agreement_hash)throw Error('Agreement provenance failed.');
 validateBrief(JSON.parse(value.payload),value.creator);
 const payload=JSON.parse(value.payload);
 if(payload.contributor!==value.contributor||payload.title!==value.title||JSON.stringify(payload.requirements)!==JSON.stringify(value.requirements))throw Error('Agreement fields do not match the frozen brief.');
 if(final){
  if(!await finalizedWrite('create_agreement',[value.payload],value.creator,context))return null;
  if(value.accepted&&!await finalizedWrite('accept_agreement',[id,value.agreement_hash],value.contributor,context))return {...value,accepted:false};
 }
 return value;
}
export async function ruling(id:string,final=true,context=finalityContext()):Promise<Ruling|null>{
 if(!ID.test(id))throw Error('Invalid request ID.');const raw=await read('get_ruling',[id],final);if(!raw)return null;
 const value=JSON.parse(raw) as Ruling;const data=JSON.parse(value.payload);
 if(value.id!==id||!rulingMatches(value,data,digest(value.payload)))throw Error('Ruling provenance failed.');
 if(final&&!await finalizedWrite('request_ruling',[value.payload],value.sender,context))return null;
 const brief=await agreement(value.agreement_id,final,context);
 if(!brief?.accepted||brief.agreement_hash!==value.agreement_hash||![brief.creator,brief.contributor].includes(value.sender)||!Array.isArray(value.clause_ids)||value.clause_ids.some(x=>!Number.isInteger(x)||x<1||x>brief.requirements.length))throw Error('Ruling does not match its accepted agreement.');
 return value;
}
export async function finalizedRequests(id:string,context=finalityContext()){
 const ids=JSON.parse(await read('get_requests',[id])) as string[];
 const selected=ids.slice(-100).filter(x=>ID.test(x));
 const records=await Promise.all(selected.map(x=>ruling(x,true,context)));
 return records.filter((x):x is Ruling=>Boolean(x)).map(x=>x.id);
}
export async function validateAction(action:Action){
 if(!action||action.contract?.toLowerCase()!==configured().toLowerCase()||!ADDRESS.test(action.contract)||!ADDRESS.test(action.from)||!Array.isArray(action.args)||action.args.some(x=>typeof x!=='string')||JSON.stringify(action).length>24000)throw Error('Invalid transaction request.');
 if(action.method==='create_agreement'){
  if(action.args.length!==1)throw Error('Invalid arguments.');validateBrief(JSON.parse(action.args[0]),action.from);
 }else if(action.method==='accept_agreement'){
  if(action.args.length!==2)throw Error('Invalid arguments.');const brief=await agreement(action.args[0]);
  if(!brief||brief.accepted||brief.contributor!==action.from.toLowerCase()||brief.agreement_hash!==action.args[1])throw Error('Only the named contributor can accept this exact, unaccepted brief.');
 }else if(action.method==='request_ruling'){
  if(action.args.length!==1)throw Error('Invalid arguments.');const data=JSON.parse(action.args[0]);const brief=await agreement(data.agreement_id);
  if(!brief?.accepted||![brief.creator,brief.contributor].includes(action.from.toLowerCase())||data.sender!==action.from.toLowerCase()||data.agreement_hash!==brief.agreement_hash||data.policy!==POLICY||!ID.test(data.id)||typeof data.request!=='string'||data.request.trim().length<3||data.request.length>2000)throw Error('A ruling needs an accepted agreement, a participant wallet and one request of 3–2,000 characters.');
 }else throw Error('Unsupported operation.');
}
export function writeData(action:Action,expires:number){return encodeFunctionData({abi:consensus.abi,functionName:'addTransaction',args:[action.from as Hex,action.contract as Hex,5n,3n,calldata(action.method,action.args),BigInt(expires)]});}
export async function quote(action:Action){
 await validateAction(action);
 if(await evm.getChainId()!==4221||!await evm.getCode({address:consensus.address}))throw Error('Bradbury preflight failed.');
 if(await read('get_policy',[])!==POLICY)throw Error('Wrong contract policy.');
 const expiresAt=Math.floor(Date.now()/1000)+300;const data=writeData(action,expiresAt);
 const [gas,price,balance]=await Promise.all([evm.estimateGas({account:action.from as Hex,to:consensus.address,data,value:0n}),evm.getGasPrice(),evm.getBalance({address:action.from as Hex})]);
 const limit=gas*120n/100n;if(balance<limit*price)throw Error('Your wallet needs Bradbury test GEN for the estimated fee.');
 return {transaction:{from:action.from,to:consensus.address,data,value:'0x0',gas:toHex(limit),gasPrice:toHex(price),chainId:'0x107d'},maximumFee:formatEther(limit*price),expiresAt};
}
export async function track(action:Action,hash:string){
 if(!HASH.test(hash)||action.contract.toLowerCase()!==configured().toLowerCase())throw Error('Invalid transaction reference.');
 const [tx,receipt]=await Promise.all([evm.getTransaction({hash:hash as Hex}),evm.getTransactionReceipt({hash:hash as Hex})]);
 const decoded=decodeFunctionData({abi:consensus.abi,data:tx.input});const args=decoded.args;
 if(tx.from.toLowerCase()!==action.from.toLowerCase()||tx.to?.toLowerCase()!==consensus.address.toLowerCase()||decoded.functionName!=='addTransaction'||!args||String(args[0]).toLowerCase()!==action.from.toLowerCase()||String(args[1]).toLowerCase()!==action.contract.toLowerCase()||String(args[2])!=='5'||String(args[3])!=='3'||String(args[4])!==calldata(action.method,action.args))throw Error('This hash does not match the saved wallet, contract and exact request.');
 if(receipt.status==='reverted')return {state:'execution_failed',error:'The EVM transaction reverted.'};
 const logs=receipt.logs.filter(x=>x.address.toLowerCase()===consensus.address.toLowerCase());
 const primary=parseEventLogs({abi:consensus.abi,eventName:'NewTransaction',logs}) as unknown as {args:{txId:Hex}}[];
 const fallback=parseEventLogs({abi:[{type:'event',name:'CreatedTransaction',anonymous:false,inputs:[{name:'txId',type:'bytes32',indexed:true},{name:'txSlot',type:'uint256',indexed:false}]}],logs});
 const genHash=primary[0]?.args.txId||(fallback[0]?.args as {txId?:Hex}|undefined)?.txId;if(!genHash)return {state:'pending',error:'Waiting for the GenLayer transaction ID.'};
 const transaction=await gen.getTransaction({hash:genHash as GenHash});
 const state=lifecycle(transaction.statusName,transaction.txExecutionResultName,transaction.resultName);
 let record:Agreement|Ruling|null=null;
 if(state==='provisional'||state==='finalized'){
  if(action.method==='request_ruling'){
   const input=JSON.parse(action.args[0]);record=await ruling(input.id,state==='finalized');
   if(!record||!rulingMatches(record,input,digest(action.args[0])))throw Error('Ruling read-back did not match the submitted request.');
  }else{
   const input=action.method==='create_agreement'?JSON.parse(action.args[0]):null;
   record=await agreement(input?.id||action.args[0],state==='finalized');
   if(!record||record.agreement_hash!==(input?digest(action.args[0]):action.args[1])||(action.method==='accept_agreement'&&!record.accepted))throw Error('Agreement read-back did not match the transaction.');
  }
 }
 return {state,genHash,record,protocolStatus:transaction.statusName,error:state==='execution_failed'?'GenLayer execution failed. No ruling was issued.':state==='no_consensus'?'No agreed successful outcome. No ruling was issued.':['LEADER_TIMEOUT','VALIDATORS_TIMEOUT'].includes(String(transaction.statusName))?'The protocol reports a consensus-stage timeout and is awaiting recovery. No agreed ruling is available. The existing transaction has not been resent.':undefined};
}
