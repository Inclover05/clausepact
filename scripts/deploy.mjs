// Bradbury deployment with the pinned SDK encoding and a durable local attempt journal.
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { abi, createClient } from 'genlayer-js';
import { testnetBradbury } from 'genlayer-js/chains';
import { createPublicClient, encodeFunctionData, formatEther, http, isAddress, keccak256, parseEventLogs, zeroAddress } from 'viem';
const { loadBradburyTestAccount } = await import(process.env.SCOPELOCK_SIGNER_MODULE || './test-wallet.mjs');

const EVM_RPC = 'https://rpc.testnet-chain.genlayer.com';
const GEN_RPC = 'https://rpc-bradbury.genlayer.com';
const chain = { ...testnetBradbury, rpcUrls: { default: { http: [EVM_RPC] } } };
const consensus = chain.consensusMainContract;
const publicClient = createPublicClient({ chain, transport: http(EVM_RPC, { retryCount: 0, timeout: 15000 }) });
const lifecycleClient = createClient({ chain: { ...testnetBradbury, rpcUrls: { default: { http: [GEN_RPC] } } } });
const directory = new URL('../.wallet/', import.meta.url);
const revision = process.argv[3] || '';
if (revision && !/^[a-z][a-z0-9-]{0,39}$/.test(revision)) throw new Error('Invalid explicit deployment revision.');
const journalFile = new URL(revision ? `deployment-${revision}.json` : 'deployment.json', directory);
const sourceFile = new URL('../contracts/scopelock.py', import.meta.url);
const expectedPolicy = 'scopelock-scope-v1';
const sourceHash = source => createHash('sha256').update(source).digest('hex');
const serialize = value => JSON.stringify(value, (_, item) => typeof item === 'bigint' ? item.toString() : item, 2) + '\n';
const saveJournal = async journal => writeFile(journalFile, serialize(journal));

async function readJournal() {
  try { return JSON.parse(await readFile(journalFile, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

export function deploymentData(address, source, validUntil) {
  const payload = abi.transactions.serialize([new Uint8Array(source), abi.calldata.encode(abi.calldata.makeCalldataObject(undefined, [], undefined)), false]);
  const inputs = consensus.abi.find(item => item.type === 'function' && item.name === 'addTransaction').inputs.length;
  const args = [address, zeroAddress, BigInt(chain.defaultNumberOfInitialValidators), BigInt(chain.defaultConsensusMaxRotations), payload];
  if (inputs === 6) args.push(BigInt(validUntil));
  else if (inputs !== 5) throw new Error('Unsupported consensus ABI; do not deploy with guessed fee fields.');
  return encodeFunctionData({ abi: consensus.abi, functionName: 'addTransaction', args });
}

async function prepare() {
  const account = await loadBradburyTestAccount();
  if (await publicClient.getChainId() !== 4221) throw new Error('Wrong deployment chain.');
  const consensusCode = await publicClient.getCode({ address: consensus.address });
  if (!consensusCode || consensusCode === '0x') throw new Error('Consensus contract has no deployed code.');
  const source = await readFile(sourceFile);
  const verified = JSON.parse(await readFile(new URL('../reports/network-preflight.json', import.meta.url), 'utf8'));
  if (sourceHash(source) !== verified.sourceSha256 || verified.sdkVersion !== '1.1.8' || !verified.ok) {
    throw new Error('Source or SDK differs from the saved contract preflight. Run its checks before deploying.');
  }
  // This is the same deployment payload and addTransaction call used by genlayer-js 1.1.8.
  const validUntil = Math.floor(Date.now() / 1000) + 3600;
  const data = deploymentData(account.address, source, validUntil);
  const balance = await publicClient.getBalance({ address: account.address });
  const report = {
    checkedAt: new Date().toISOString(), sdkVersion: '1.1.8', network: 'testnet-bradbury', chainId: 4221,
    address: account.address, consensusAddress: consensus.address, sourceSha256: sourceHash(source),
    policy: expectedPolicy, revision: revision || 'initial', constructorArgs: [], leaderOnly: false, balanceBeforeDeploymentGEN: formatEther(balance),
    fundingRequired: balance === 0n, validUntil, protocolValueWei: '0', chainWriteSent: false,
  };
  let gas, gasPrice;
  if (balance > 0n) {
    gas = (await publicClient.estimateGas({ account: account.address, to: consensus.address, data, value: 0n })) * 120n / 100n;
    gasPrice = await publicClient.getGasPrice();
    report.gasLimit = gas.toString();
    report.gasPriceWei = gasPrice.toString();
    report.maximumNetworkFeeGEN = formatEther(gas * gasPrice);
    if (balance < gas * gasPrice) throw new Error('Wallet balance is below the estimated deployment network fee.');
  }
  await writeFile(new URL('deployment-preflight.json', directory), serialize(report));
  return { account, data, gas, gasPrice, report };
}

async function status() {
  const journal = await readJournal();
  if (!journal) return { state: 'not_submitted', chainWriteSent: false };
  if (journal.balanceGEN !== undefined) {
    journal.balanceBeforeDeploymentGEN = journal.balanceGEN;
    delete journal.balanceGEN;
  }
  if (!journal.evmHash) return { ...journal, reviewRequired: 'An interrupted attempt is recorded. Inspect it before signing again.' };
  if (!journal.genHash) {
    let receipt;
    try { receipt = await publicClient.getTransactionReceipt({ hash: journal.evmHash }); }
    catch (error) { if (error.name === 'TransactionReceiptNotFoundError') return { ...journal, state: 'awaiting_evm_receipt' }; throw error; }
    journal.evmStatus = receipt.status;
    journal.gasUsed = receipt.gasUsed.toString();
    journal.networkFeeGEN = formatEther(receipt.gasUsed * receipt.effectiveGasPrice);
    if (receipt.status === 'reverted') {
      journal.state = 'evm_reverted';
      await saveJournal(journal);
      return journal;
    }
    const logs = receipt.logs.filter(log => log.address.toLowerCase() === consensus.address.toLowerCase());
    const events = parseEventLogs({ abi: consensus.abi, eventName: 'NewTransaction', logs });
    const fallback = parseEventLogs({ abi: [{ type: 'event', name: 'CreatedTransaction', anonymous: false, inputs: [{ name: 'txId', type: 'bytes32', indexed: true }, { name: 'txSlot', type: 'uint256', indexed: false }] }], logs });
    journal.genHash = events[0]?.args.txId || fallback[0]?.args.txId;
    if (!journal.genHash) throw new Error('EVM transaction succeeded without a recognized GenLayer ID. Inspect the existing transaction; do not resend.');
    journal.state = 'pending';
    await saveJournal(journal);
  }
  const transaction = await lifecycleClient.getTransaction({ hash: journal.genHash });
  journal.consensusStatus = transaction.statusName;
  journal.executionResult = transaction.txExecutionResultName;
  journal.state = transaction.statusName?.toLowerCase() || 'pending';
  const address = transaction.txDataDecoded?.contractAddress || transaction.recipient || transaction.to_address;
  if (address && isAddress(address) && address !== zeroAddress) journal.contractAddress = address;
  journal.checkedAt = new Date().toISOString();
  if (journal.state === 'finalized' && journal.executionResult === 'FINISHED_WITH_RETURN') {
    if (!journal.contractAddress) throw new Error('Finalized deployment does not contain a contract address.');
    const [policy, deployedSource] = await Promise.all([
      lifecycleClient.readContract({ address: journal.contractAddress, functionName: 'get_policy', args: [] }),
      lifecycleClient.getContractCode(journal.contractAddress),
    ]);
    if (policy !== expectedPolicy || sourceHash(deployedSource) !== journal.sourceSha256) throw new Error('Deployed source or policy verification failed.');
    journal.sourceAndPolicyVerified = true;
    // Inspecting a retired deployment must not replace the current source's release record.
    journal.sourceMatchesCurrent = sourceHash(await readFile(sourceFile)) === journal.sourceSha256;
    if (journal.sourceMatchesCurrent) await writeFile(new URL('../reports/bradbury-deployment.json', import.meta.url), serialize(journal));
  }
  await saveJournal(journal);
  return journal;
}

async function deploy() {
  if (await readJournal()) return status();
  const { account, data, gas, gasPrice, report } = await prepare();
  if (report.fundingRequired) return { ...report, state: 'awaiting_test_gen' };
  const nonce = await publicClient.getTransactionCount({ address: account.address, blockTag: 'pending' });
  const journal = { ...report, nonce, state: 'preparing_signature', startedAt: new Date().toISOString() };
  await writeFile(journalFile, serialize(journal), { flag: 'wx' });
  const signed = await account.signTransaction({ to: consensus.address, data, gas, gasPrice, nonce, chainId: 4221, value: 0n, type: 'legacy' });
  // Persist the deterministic EVM hash before making any broadcast request.
  journal.evmHash = keccak256(signed);
  journal.state = 'broadcast_outcome_uncertain';
  journal.chainWriteSent = null;
  await saveJournal(journal);
  const returnedHash = await publicClient.sendRawTransaction({ serializedTransaction: signed });
  if (returnedHash.toLowerCase() !== journal.evmHash.toLowerCase()) throw new Error('RPC returned an unexpected transaction hash.');
  journal.state = 'broadcast';
  journal.chainWriteSent = true;
  await saveJournal(journal);
  return journal;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) try {
  const command = process.argv[2];
  const result = command === 'prepare' ? (await prepare()).report : command === 'deploy' ? await deploy() : command === 'status' ? await status() : null;
  if (!result) throw new Error('Use prepare, deploy or status.');
  console.log(serialize(result));
} catch (error) {
  // RPC errors can contain signed request bytes. Keep errors out of command output.
  console.error(error instanceof Error ? `${error.name}: deployment operation failed. Inspect the saved public attempt metadata before another action.` : 'Deployment operation failed.');
  process.exitCode = 1;
}

