// Wallet identity is the provider the person selected, plus its authorized account.
export type Provider={request:(args:{method:string;params?:unknown[]})=>Promise<unknown>;on?:(event:string,fn:(value:unknown)=>void)=>void;removeListener?:(event:string,fn:(value:unknown)=>void)=>void;};
export type WalletChoice={info:{uuid:string;name:string;rdns:string;icon:string};provider:Provider};
export const WALLET_STORAGE_KEY='scopelock-wallet';
export const CHAIN_ID='0x107d';
export async function restoreWallet(choices:WalletChoice[],rdns:string,address:string):Promise<WalletChoice|null>{
  const choice=choices.find(item=>item.info.rdns===rdns);
  if(!choice)return null;
  try{const accounts=await choice.provider.request({method:'eth_accounts'});return Array.isArray(accounts)&&typeof accounts[0]==='string'&&accounts[0].toLowerCase()===address.toLowerCase()?choice:null;}catch{return null;}
}
export async function switchToBradbury(provider:Provider,address:string){
  const accounts=await provider.request({method:'eth_accounts'});
  if(!Array.isArray(accounts)||typeof accounts[0]!=='string'||accounts[0].toLowerCase()!==address.toLowerCase())throw new Error('The wallet account changed. Sign in again.');
  if(await provider.request({method:'eth_chainId'})!==CHAIN_ID){
    try{await provider.request({method:'wallet_switchEthereumChain',params:[{chainId:CHAIN_ID}]});}
    catch(error){if(walletErrorCode(error)!==4902)throw error;await provider.request({method:'wallet_addEthereumChain',params:[{chainId:CHAIN_ID,chainName:'GenLayer Bradbury Testnet',rpcUrls:['https://rpc.testnet-chain.genlayer.com'],nativeCurrency:{name:'GEN',symbol:'GEN',decimals:18},blockExplorerUrls:['https://explorer-bradbury.genlayer.com']}]});await provider.request({method:'wallet_switchEthereumChain',params:[{chainId:CHAIN_ID}]});}
    if(await provider.request({method:'eth_chainId'})!==CHAIN_ID)throw new Error('Switch your selected wallet to GenLayer Bradbury before submitting.');
  }
}
export function walletErrorCode(error:unknown):number|undefined{
  if(!error||typeof error!=='object')return;
  const value=error as {code?:unknown;cause?:unknown;data?:{originalError?:unknown}};
  if(typeof value.code==='number')return value.code;
  return walletErrorCode(value.cause)||walletErrorCode(value.data?.originalError);
}
export function submissionMessage(error:unknown,attempted:boolean,hash?:string):string{
  if(hash)return 'Your wallet returned a transaction hash, but saving it failed. The hash has been kept in this browser. Link it below to resume tracking; do not submit again.';
  if(attempted&&walletErrorCode(error)===4001)return 'You declined the wallet request. No transaction was sent.';
  if(attempted)return 'The wallet outcome is uncertain. Check wallet activity and link the transaction hash below before trying again.';
  return error instanceof Error?error.message:'Could not submit this request.';
}

