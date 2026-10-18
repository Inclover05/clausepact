export const POLICY = 'scopelock-scope-v1';
export const LABELS = ['Already required', 'Clarification', 'Additional scope', 'Ambiguous'];
export const ADDRESS = /^0x[0-9a-fA-F]{40}$/;
export const ID = /^[a-f0-9-]{36}$/;
export const HASH = /^0x[0-9a-fA-F]{64}$/;
export function validateBrief(data, sender) {
  if (!data || data.policy !== POLICY || data.creator !== sender.toLowerCase() || !ID.test(data.id)) throw Error('Invalid agreement provenance.');
  if (!ADDRESS.test(data.contributor) || /^0x0{40}$/i.test(data.contributor) || data.contributor !== data.contributor.toLowerCase() || data.contributor === data.creator) throw Error('Choose a different contributor wallet.');
  if (typeof data.title !== 'string' || data.title.trim().length < 3 || data.title.length > 120) throw Error('Title must be 3–120 characters.');
  if (!Array.isArray(data.requirements) || data.requirements.length < 1 || data.requirements.length > 12 || data.requirements.some(x => typeof x !== 'string' || !x.trim() || x.length > 500)) throw Error('Use 1–12 requirements, each 1–500 characters.');
}
export function lifecycle(status, execution, result) {
  if (execution === 'FINISHED_WITH_ERROR') return 'execution_failed';
  if (['UNDETERMINED', 'CANCELED'].includes(status)) return 'no_consensus';
  if (['ACCEPTED', 'FINALIZED'].includes(status)) {
    if (['AGREE','MAJORITY_AGREE'].includes(result) && execution === 'FINISHED_WITH_RETURN') return status === 'FINALIZED' ? 'finalized' : 'provisional';
    return status === 'FINALIZED' ? 'no_consensus' : 'pending';
  }
  return 'pending';
}
export function actionKey(action) { return `${action.contract.toLowerCase()}:${action.method}:${JSON.stringify(action.args)}`; }
export function canSend(pending) { return !pending || pending.state === 'rejected'; }
export function rulingMatches(record, data, requestHash) {
  return record?.id === data.id && record.agreement_id === data.agreement_id && record.agreement_hash === data.agreement_hash && record.request_hash === requestHash && record.sender === data.sender && record.request === data.request && record.policy === POLICY && LABELS.includes(record.classification);
}
