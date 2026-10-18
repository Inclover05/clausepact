# ClausePact release verification — 18 October 2026

This report is updated as checks complete. Machine-readable evidence in this folder is authoritative for the exact observed states; expected classifications are not observed results.

## Completed local checks

- Official legacy GenVM linter: passed, ClausePact contract, five view methods, three writes, parameterless constructor.
- Official direct-runtime fixtures: **15 passed**, including creator/contributor permissions, exact acceptance hash, frozen publication, duplicate requests, all four result shapes, captured validator replay, invalid clause references, model errors, disagreement, mixed requests and injection-bearing input.
- JavaScript and wallet tests: **13 passed**, covering input limits, lifecycle safety, repayment locks, damaged storage, fresh reconciliation of restored result labels, exact finalized-write proofs, execution success, provenance, three-provider selection, account changes, network switching and rejected/uncertain wallet responses.
- Next.js production build and TypeScript check passed after the finality filter, recovery and timeout-message changes.
- Network preflight passed: both Bradbury endpoints returned chain ID 4221; the pinned SDK's consensus address has deployed code.

## Live evidence

- Dedicated contract: `0x96F604f62Dcc0957e3ea8554779EB4B5BE4bfae3`.
- Source SHA-256: `cbde5e3606211624b082bbe0632cf7d9021354136068f0caff9c9f12ff5f6604`.
- Deployment EVM transaction: `0x981c04d7f2738150fc4f6bc6c462c4778fef277c509dc144fc70edce414cb2f3`.
- Deployment GenLayer ID: `0x46b2982585eacbdff8e1d43dbda3970fe0905fca1b000259d0d3d4240a02db76`.
- Deployment is **FINALIZED / FINISHED_WITH_RETURN**. Exact source and policy read-back passed after finalization; `bradbury-deployment.json` also confirms the deployed bytes match the current source.
- Initial measured deployment network fee: `0.0018246523125` test GEN.
- Public Vercel deployment reached READY with anonymous access. Browser inspection confirmed the overview, creation form, public-storage notice and numbered requirements.
- Real creator/contributor agreement and classification checks are recorded in `live-verification.json`. Their status is not implied by the deployed address.

The creator publication and named contributor acceptance both finalized successfully for agreement `e98d57ef-2fc5-4903-ab9f-7d36df8c5084`. Both hashes match the exact frozen payload.

| Live check | Observed release state | Stored classification |
| --- | --- | --- |
| Already required | Finalized, successful agreed execution | Already required |
| Additional scope | Finalized, successful agreed execution | Additional scope |
| Mixed request | Finalized, successful agreed execution | Ambiguous |
| Original clarification | Finalized without successful agreed consensus | No ruling |
| Injection-bearing request | Finalized without successful agreed consensus | No ruling |
| Fresh clarification follow-up | Accepted, successful agreed execution; provisional | Clarification |

The follow-up was separately initiated only after the original finalized without consensus and a finalized contract read confirmed no stored ruling. It has a new request ID and transaction; the original failure is retained. Provisional is not final. Public example cards include only the three finalized successful rulings.

The expanded public API gate includes anonymous page/configuration access, invalid-operation and same-wallet rejection, a real fee estimate without a write, exact tracking of all submitted operations, changed-payload rejection, finalized agreement/ruling read-back, and withholding provisional or failed-consensus rulings. See `api-verification.json` for the current observed pass count. Its added provisional-read regression initially failed and prompted the direct consensus proof below.

## Runtime and browser checks

- Actual GenVM leader execution and independent validator replay passed for **Already required, Clarification, Additional scope and Ambiguous** on source `cbde5e3606211624b082bbe0632cf7d9021354136068f0caff9c9f12ff5f6604`.
- The injection-bearing simulation produced Additional scope at the leader but the validator replay rejected it. It is a disagreement, not a successful shared ruling. Raw diagnostic output is kept locally; `runtime-simulation.json` records the result without calling it consensus proof.
- Public browser checks passed for the overview, agreement composer, native wallet dialog, two-clause draft restoration, the twelve-clause cap, 500-character textarea bounds, clause removal and mobile layout at 390px. No horizontal overflow or browser console errors were observed in that session.
- The user-approved purple/black glass design was built and deployed, then inspected on desktop (1440px) and mobile (390px). Public agreement and Additional scope ruling pages were inspected with actual finalized data. New screenshots are in `reports/screenshots/`.
- The in-app test browser has no wallet extension. Real browser-extension signing, rejection dialogs and a full two-wallet browser signing journey remain **unverified**. Local encrypted signers exercised actual contract writes; wallet-provider fixtures exercised selection/switch/rejection logic. Neither is mislabeled as a browser signing test.
- Initial RPC filters rejected reads before deployment finality, but a later regression demonstrated they could still expose a provisional ruling after deployment finality. Those filters alone are insufficient. Public reads now require matching finalized consensus transaction history, exact sender/recipient/calldata, agreed consensus and successful execution for each write. A direct live regression confirmed the accepted clarification was withheld while the finalized Additional scope ruling and accepted agreement remained available. Public API checks repeat this regression against the deployed code.

## Refinement history

The first contract at `0xD9518Ccbc2093490c148095676aD79931b61DcC3` produced a Clarification label whose explanation described an already required obligation. It is retained in `reports/history/` with its original source in `contracts/releases/first-pass.py`; its deployment and test results are not current-release evidence.

The new revision uses a concrete decision basis mapped deterministically to display labels. Validators derive that basis without seeing the leader's proposal, then separately audit only the basis, explanation and references. The audit avoids contradictory output formats and redundant display labels. No accepted agreement or recorded ruling was overwritten.

## Verification still in progress

The Clarification follow-up's finality remains unverified. Real browser-extension signing remains unverified because the test browser has no extension wallet. These limits do not become successful checks through the local fixtures, API checks or demo.

`public/demo.mp4` is a verified 60-second edited screen-capture walkthrough using the real purple UI and finalized agreement/Additional scope pages. It is labeled as edited captures and explicitly does not show browser signing. The full video decoded successfully and an exported frame was visually inspected. No synthetic signing or successful transaction footage was created.

Portal materials are prepared in `SUBMISSION.md`; no portal contribution has been submitted. The former draft name collided with a different GenLayer vulnerability-bounty project. The user explicitly approved the ClausePact public rename. The deployed class, policy, source filenames and immutable historical test text preserve the original internal codename.


