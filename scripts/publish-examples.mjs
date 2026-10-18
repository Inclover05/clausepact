// Only completed successful final-state records become public example links.
import {readFile,writeFile} from 'node:fs/promises';
const live=JSON.parse(await readFile('reports/live-verification.json','utf8'));
const deployment=JSON.parse(await readFile('reports/bradbury-deployment.json','utf8'));
if(!deployment.sourceAndPolicyVerified||deployment.state!=='finalized'||deployment.contractAddress!==live.contract||deployment.sourceSha256!==live.sourceSha256||live.operations.accept.state!=='finalized')throw Error('Finalized deployment and mutually accepted agreement are required.');
const titles={'already-required':'The email link already in the brief','clarification':'A font choice within the agreed pages','clarification-followup':'A font choice within the agreed pages','additional-scope':'An online store beyond the brief','ambiguous':'One request with mixed obligations'};
const rulings=Object.values(live.operations).filter(op=>titles[op.name]&&op.state==='finalized'&&op.consensusStatus==='FINALIZED'&&op.record?.agreement_hash===live.operations.publish.record.agreement_hash).map(op=>({id:op.record.id,classification:op.record.classification,title:titles[op.name]}));
const examples={agreementId:live.agreementId,contract:live.contract,sourceSha256:live.sourceSha256,checkedAt:live.checkedAt,rulings};
await writeFile('public/examples.json',JSON.stringify(examples,null,2)+'\n');console.log(JSON.stringify(examples));
