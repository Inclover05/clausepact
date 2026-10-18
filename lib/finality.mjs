// Storage reads alone do not prove that the write which produced them finalized.
export function matchesFinalizedWrite(row, contract, sender, data) {
 return Number(row.status) === 7 && [1, 6].includes(Number(row.result)) &&
  row.recipient?.toLowerCase() === contract.toLowerCase() &&
  row.sender?.toLowerCase() === sender.toLowerCase() &&
  row.txCalldata?.toLowerCase() === data.toLowerCase();
}

export function successfulFinality(transaction) {
 return transaction.statusName === 'FINALIZED' &&
  ['AGREE', 'MAJORITY_AGREE'].includes(transaction.resultName) &&
  transaction.txExecutionResultName === 'FINISHED_WITH_RETURN';
}
