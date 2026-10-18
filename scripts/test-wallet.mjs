// Local Bradbury test signer. Private material never leaves this Windows account.
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { createPublicClient, formatEther, http } from 'viem';

const directory = new URL('../.wallet/', import.meta.url);
const keyFile = new URL('bradbury-key.dpapi', directory);
const manifestFile = new URL('wallet.json', directory);
const powershell = 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe';
const rpc = 'https://rpc.testnet-chain.genlayer.com';
const entropy = 'ScopeLock/Bradbury/test-wallet/v1';

function runPowerShell(script, input = '') {
  if (process.platform !== 'win32') throw new Error('This wallet uses Windows account encryption.');
  const result = spawnSync(powershell, ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command', script], {
    input, encoding: 'utf8', windowsHide: true, timeout: 15000,
  });
  if (result.error || result.status !== 0) throw new Error('Windows wallet protection failed; no private material was logged.');
  return result.stdout.trim();
}

function protect(value, decrypt = false) {
  const operation = decrypt ? 'Unprotect' : 'Protect';
  const output = runPowerShell(`
    $ErrorActionPreference = 'Stop'
    Add-Type -AssemblyName System.Security
    $taskBytes = [Convert]::FromBase64String([Console]::In.ReadToEnd().Trim())
    $taskEntropy = [Text.Encoding]::UTF8.GetBytes('${entropy}')
    $taskResult = [Security.Cryptography.ProtectedData]::${operation}($taskBytes, $taskEntropy, [Security.Cryptography.DataProtectionScope]::CurrentUser)
    [Console]::Out.Write([Convert]::ToBase64String($taskResult))
    [Array]::Clear($taskBytes, 0, $taskBytes.Length)
    [Array]::Clear($taskResult, 0, $taskResult.Length)
  `, Buffer.from(value).toString('base64'));
  return Buffer.from(output, 'base64');
}

function restrictDirectory() {
  const sid = runPowerShell('[Security.Principal.WindowsIdentity]::GetCurrent().User.Value');
  if (!/^S-1-[0-9-]+$/.test(sid)) throw new Error('Unable to identify the Windows wallet owner.');
  const result = spawnSync('icacls.exe', [fileURLToPath(directory), '/inheritance:r', '/grant:r', `*${sid}:(OI)(CI)F`, 'SYSTEM:(OI)(CI)F'], {
    encoding: 'utf8', windowsHide: true, timeout: 15000,
  });
  if (result.error || result.status !== 0) throw new Error('Unable to restrict the local wallet directory.');
}

export async function loadBradburyTestAccount() {
  const manifest = JSON.parse(await readFile(manifestFile, 'utf8'));
  if (manifest.chainId !== 4221 || manifest.network !== 'testnet-bradbury') throw new Error('Wrong wallet network.');
  const bytes = protect(await readFile(keyFile), true);
  try {
    const account = privateKeyToAccount(bytes.toString('utf8'));
    if (account.address !== manifest.address) throw new Error('Wallet address does not match the saved manifest.');
    return account;
  } finally {
    bytes.fill(0);
  }
}

async function create() {
  const workspace = fileURLToPath(new URL('../', import.meta.url));
  const ignored = spawnSync('git', ['-c', `safe.directory=${workspace}`, 'check-ignore', '.wallet/bradbury-key.dpapi'], {
    cwd: workspace, encoding: 'utf8', windowsHide: true,
  });
  if (ignored.status !== 0) throw new Error('The wallet directory must be excluded from Git before creating a key.');
  await mkdir(directory, { recursive: true });
  restrictDirectory();
  let account;
  let created = false;
  try {
    await access(keyFile);
    const bytes = protect(await readFile(keyFile), true);
    try { account = privateKeyToAccount(bytes.toString('utf8')); } finally { bytes.fill(0); }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const key = generatePrivateKey();
    account = privateKeyToAccount(key);
    await writeFile(keyFile, protect(Buffer.from(key, 'utf8')), { flag: 'wx' });
    created = true;
  }
  try {
    const existing = JSON.parse(await readFile(manifestFile, 'utf8'));
    if (existing.address !== account.address || existing.chainId !== 4221) throw new Error('Saved wallet identity differs.');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    await writeFile(manifestFile, JSON.stringify({
      version: 1, createdAt: new Date().toISOString(), address: account.address,
      network: 'testnet-bradbury', chainId: 4221,
      protection: 'Windows DPAPI CurrentUser; restricted local directory',
      purpose: 'ScopeLock contract deployment and website testing with test GEN',
    }, null, 2) + '\n', { flag: 'wx' });
  }
  const restored = await loadBradburyTestAccount();
  const message = 'ScopeLock local encrypted Bradbury wallet verification';
  const { verifyMessage } = await import('viem');
  if (!await verifyMessage({ address: account.address, message, signature: await restored.signMessage({ message }) })) {
    throw new Error('Encrypted wallet signing verification failed.');
  }
  console.log(JSON.stringify({ created, address: account.address, network: 'testnet-bradbury', chainId: 4221, encryptedSigningVerified: true }));
}

export async function walletStatus() {
  const { address } = await loadBradburyTestAccount();
  const client = createPublicClient({ transport: http(rpc, { timeout: 15000, retryCount: 0 }) });
  if (await client.getChainId() !== 4221) throw new Error('Funding endpoint is not Bradbury.');
  const balance = await client.getBalance({ address });
  const status = { address, network: 'testnet-bradbury', chainId: 4221, balanceGEN: formatEther(balance), checkedAt: new Date().toISOString() };
  await writeFile(new URL('funding-status.json', directory), JSON.stringify(status, null, 2) + '\n');
  return status;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    const command = process.argv[2];
    if (command === 'create') await create();
    else if (command === 'status') console.log(JSON.stringify(await walletStatus()));
    else throw new Error('Use create or status.');
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Wallet operation failed.');
    process.exitCode = 1;
  }
}

