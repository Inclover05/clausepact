import test from 'node:test';
import assert from 'node:assert/strict';
import {matchesFinalizedWrite,successfulFinality} from '../lib/finality.mjs';

test('finalized proof binds exact payload, participant, destination and consensus',()=>{
 const row={status:7,result:1,recipient:'0xAB',sender:'0xCD',txCalldata:'0x1234'};
 assert.equal(matchesFinalizedWrite(row,'0xab','0xcd','0x1234'),true);
 assert.equal(matchesFinalizedWrite({...row,result:6},'0xab','0xcd','0x1234'),true);
 for(const delta of [{status:6},{result:0},{result:2},{sender:'0xef'},{recipient:'0xef'},{txCalldata:'0x1235'}])
  assert.equal(matchesFinalizedWrite({...row,...delta},'0xab','0xcd','0x1234'),false);
});

test('finalized consensus also requires successful execution',()=>{
 const tx={statusName:'FINALIZED',resultName:'AGREE',txExecutionResultName:'FINISHED_WITH_RETURN'};
 assert.equal(successfulFinality(tx),true);
 assert.equal(successfulFinality({...tx,resultName:'MAJORITY_AGREE'}),true);
 for(const delta of [{statusName:'ACCEPTED'},{resultName:'IDLE'},{txExecutionResultName:'CONTRACT_ERROR'}])
  assert.equal(successfulFinality({...tx,...delta}),false);
});
