import test from 'node:test';
import assert from 'node:assert/strict';
import {restoreWallet,switchToBradbury,submissionMessage,walletErrorCode} from '../lib/wallet.ts';
const owner='0x'+'a'.repeat(40);
test('restoration keeps the explicitly selected provider among three wallets',async()=>{
 const choices=['one','two','three'].map(rdns=>({info:{rdns},provider:{request:async()=>[owner]}}));
 assert.equal(await restoreWallet(choices,'two',owner),choices[1]);
 assert.equal(await restoreWallet(choices,'missing',owner),null);
 choices[1].provider.request=async()=>['0x'+'b'.repeat(40)];
 assert.equal(await restoreWallet(choices,'two',owner),null);
});
test('account change prevents network switching or submission',async()=>{
 const calls=[];const provider={request:async request=>{calls.push(request.method);return ['0x'+'b'.repeat(40)];}};
 await assert.rejects(switchToBradbury(provider,owner),/account changed/);
 assert.deepEqual(calls,['eth_accounts']);
});
test('wrong network is switched and checked before a transaction can proceed',async()=>{
 let chain='0x1';const calls=[];
 const provider={request:async request=>{calls.push(request.method);if(request.method==='eth_accounts')return [owner];if(request.method==='eth_chainId')return chain;if(request.method==='wallet_switchEthereumChain')chain='0x107d';}};
 await switchToBradbury(provider,owner);
 assert.deepEqual(calls,['eth_accounts','eth_chainId','wallet_switchEthereumChain','eth_chainId']);
});
test('declined switch propagates without adding or sending transactions',async()=>{
 const calls=[];const provider={request:async request=>{calls.push(request.method);if(request.method==='eth_accounts')return [owner];if(request.method==='eth_chainId')return '0x1';throw {code:4001};}};
 await assert.rejects(switchToBradbury(provider,owner));
 assert.equal(calls.includes('eth_sendTransaction'),false);assert.equal(calls.includes('wallet_addEthereumChain'),false);
});
test('rejection differs from unknown broadcast and retained hash',()=>{
 assert.match(submissionMessage({code:4001},true),/declined/);
 assert.match(submissionMessage({code:-32000},true),/uncertain/);
 assert.match(submissionMessage(Error('timeout'),true,'0xhash'),/hash has been kept/);
 assert.equal(walletErrorCode({data:{originalError:{code:4001}}}),4001);
});
