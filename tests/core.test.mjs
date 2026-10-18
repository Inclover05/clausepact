import test from 'node:test';
import assert from 'node:assert/strict';
import {POLICY,validateBrief,lifecycle,canSend,rulingMatches} from '../lib/core.mjs';
const creator='0x'+'a'.repeat(40),contributor='0x'+'b'.repeat(40);
const brief={id:'11111111-1111-1111-1111-111111111111',policy:POLICY,creator,contributor,title:'Portfolio',requirements:['One home page']};
test('brief validation enforces distinct wallets and bounded requirements',()=>{
 assert.doesNotThrow(()=>validateBrief(brief,creator));
 for(const invalid of [{...brief,contributor:creator},{...brief,requirements:[]},{...brief,requirements:['x'.repeat(501)]},{...brief,requirements:Array(13).fill('x')},{...brief,creator:contributor}])assert.throws(()=>validateBrief(invalid,creator));
});
test('only successful majority execution exposes a provisional or finalized result',()=>{
 assert.equal(lifecycle('ACCEPTED','FINISHED_WITH_RETURN','MAJORITY_AGREE'),'provisional');
 assert.equal(lifecycle('FINALIZED','FINISHED_WITH_RETURN','MAJORITY_AGREE'),'finalized');
 assert.equal(lifecycle('FINALIZED','FINISHED_WITH_ERROR','MAJORITY_AGREE'),'execution_failed');
 assert.equal(lifecycle('FINALIZED','FINISHED_WITH_RETURN','NO_MAJORITY'),'no_consensus');
 assert.equal(lifecycle('UNDETERMINED','UNKNOWN','UNKNOWN'),'no_consensus');
 assert.equal(lifecycle('FINALIZED','UNKNOWN','MAJORITY_AGREE'),'no_consensus');
});
test('uncertain and already-broadcast transactions block repayment',()=>{
 assert.equal(canSend(null),true);assert.equal(canSend({state:'rejected'}),true);
 for(const state of ['uncertain','pending','provisional','finalized','execution_failed','no_consensus'])assert.equal(canSend({state}),false);
});
test('result provenance requires the exact submitted request, sender and agreement',()=>{
 const data={id:'r',agreement_id:'a',agreement_hash:'h',sender:creator,request:'Add another page'};
 const record={...data,policy:POLICY,request_hash:'x',classification:'Additional scope'};
 assert.equal(rulingMatches(record,data,'x'),true);
 for(const field of ['id','agreement_id','agreement_hash','sender','request'])assert.equal(rulingMatches({...record,[field]:'other'},data,'x'),false);
 assert.equal(rulingMatches(record,data,'different-hash'),false);
});
