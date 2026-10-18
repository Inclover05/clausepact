# Deployment and recovery

Independent Vercel project: `clausepact`, ID `prj_Hr6FgRI1Yuc3CDRVd6yS46ybUqmH`, team `inclover05s-projects`. Its public production URL is https://clausepact-inclover05s-projects.vercel.app. No ClaimLens hosting configuration or secrets are copied.

The only application environment variable is `NEXT_PUBLIC_SCOPELOCK_CONTRACT`, set to the dedicated verified Bradbury address. It is public configuration. After changing it, build a new deployment. Never add signer keys to hosting settings.

## Reproduce contract deployment

1. Install the pinned JS and Python dependencies. Run the type check, production build, core tests and official GenVM linter/direct tests.
2. Run `node scripts/network-check.mjs`. It verifies both RPC chain IDs and code at the SDK's consensus address, and records the exact source hash.
3. Run `node scripts/test-wallet.mjs create` to create an encrypted Windows DPAPI test signer in Git-ignored `.wallet/`, restricted to its owner and SYSTEM. Fund it with test GEN only.
4. Run `node scripts/deploy.mjs prepare <revision>` to inspect the exact source, network, policy, available balance and maximum fee. Then run `deploy <revision>` once.
5. Run `status <revision>` to resume the saved attempt. The script saves a deterministic EVM hash before broadcasting. A timeout never justifies another deployment attempt.
6. Successful protocol finalization triggers exact deployed-source and policy read-back, then writes `reports/bradbury-deployment.json`. Configure the website only against a source/policy-verified address; report provisional acceptance separately from finality.

An optional `SCOPELOCK_SIGNER_MODULE` points to a local module exporting `loadBradburyTestAccount`; it allows using an existing encrypted test signer without copying private material. Never commit the external signer or use a funded mainnet account. The live verification uses a second independently encrypted signer for contributor acceptance.

Deployment journals and encrypted keys stay in `.wallet/`. Public source hashes, addresses, fees and transaction IDs may be copied to `reports/`. Neither keys nor raw signed transactions belong in reports.

## Live checks

`scripts/live-check.mjs` advances one real test operation per invocation, with public attempt metadata in `reports/live-verification.json`: fund the contributor with 0.03 test GEN, publish, accept, then check all four classifications and an injection-bearing request. Every network fee is bounded to 0.015 test GEN before signing. The script never signs an existing operation twice and validates deployed bytes and policy before advancing.

These direct contract checks can follow provisional predecessor state. The ordinary UI deliberately waits for finalized predecessor records. This difference must stay explicit in verification reports. An expected label in the fixture is never substituted for an actual committee result.

The network may require an explicit `finalizeTransaction` after its appeal window. The finalization helper checks `canFinalize` against the current chain timestamp and journals each attempt; it must not force or simulate finality.

## Source publication

`scripts/publish-github.mjs` uses Git Credential Manager in memory to create or update only the authenticated user's `clausepact` repository, refuses an unexpected origin, and never logs credentials. The initial publication and later updates must exclude `.wallet`, `.env*`, build outputs and caches. Deploy the intended `main` commit through Vercel after checks pass.


