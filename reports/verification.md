# ClausePact release verification — 18 October 2026

This report is updated as checks complete. Machine-readable evidence in this folder is authoritative for the exact observed states; expected classifications are not observed results.

## Completed local checks

- Official legacy GenVM linter: passed, ClausePact contract, five view methods, three writes, parameterless constructor.
- Official direct-runtime fixtures: **15 passed**, including creator/contributor permissions, exact acceptance hash, frozen publication, duplicate requests, all four result shapes, captured validator replay, invalid clause references, model errors, disagreement, mixed requests and injection-bearing input.
- JavaScript and wallet tests: **10 passed**, covering input limits, lifecycle safety, repayment locks, damaged storage, provenance, three-provider selection, account changes, network switching and rejected/uncertain wallet responses.
- Next.js production build and TypeScript check passed after the finality filter, recovery and timeout-message changes.
- Network preflight passed: both Bradbury endpoints returned chain ID 4221; the pinned SDK's consensus address has deployed code.

## Live evidence

- Dedicated contract: `0x96F604f62Dcc0957e3ea8554779EB4B5BE4bfae3`.
- Source SHA-256: `cbde5e3606211624b082bbe0632cf7d9021354136068f0caff9c9f12ff5f6604`.
- Deployment EVM transaction: `0x981c04d7f2738150fc4f6bc6c462c4778fef277c509dc144fc70edce414cb2f3`.
- Deployment GenLayer ID: `0x46b2982585eacbdff8e1d43dbda3970fe0905fca1b000259d0d3d4240a02db76`.
- Exact source and policy read-back passed against the new contract. Initial observed state: Accepted, AGREE, FINISHED_WITH_RETURN; this is provisional until protocol finality.
- Initial measured deployment network fee: `0.0018246523125` test GEN.
- Public Vercel deployment reached READY with anonymous access. Browser inspection confirmed the overview, creation form, public-storage notice and numbered requirements.
- Real creator/contributor agreement and classification checks are recorded in `live-verification.json`. Their status is not implied by the deployed address.

## Runtime and browser checks

- Actual GenVM leader execution and independent validator replay passed for **Already required, Clarification, Additional scope and Ambiguous** on source `cbde5e3606211624b082bbe0632cf7d9021354136068f0caff9c9f12ff5f6604`.
- The injection-bearing simulation produced Additional scope at the leader but the validator replay rejected it. It is a disagreement, not a successful shared ruling. Raw diagnostic output is kept locally; `runtime-simulation.json` records the result without calling it consensus proof.
- Public browser checks passed for the overview, agreement composer, native wallet dialog, two-clause draft restoration, the twelve-clause cap, 500-character textarea bounds, clause removal and mobile layout at 390px. No horizontal overflow or browser console errors were observed in that session.
- The in-app test browser has no wallet extension. Real browser-extension signing, rejection dialogs and a full two-wallet browser signing journey remain **unverified**. Local encrypted signers exercised actual contract writes; wallet-provider fixtures exercised selection/switch/rejection logic. Neither is mislabeled as a browser signing test.
- Initial API checks showed that the legacy `transaction_hash_variant` field alone returned accepted state. That initial check's finalized-read interpretation is superseded. The app now also sends the explicit `status: finalized` filter. `read-finality-check.json` demonstrates accepted policy read success and finalized read rejection before the deployment's actual finality.

## Refinement history

The first contract at `0xD9518Ccbc2093490c148095676aD79931b61DcC3` produced a Clarification label whose explanation described an already required obligation. It is retained in `reports/history/` with its original source in `contracts/releases/first-pass.py`; its deployment and test results are not current-release evidence.

The new revision uses a concrete decision basis mapped deterministically to display labels. Validators derive that basis without seeing the leader's proposal, then separately audit only the basis, explanation and references. The audit avoids contradictory output formats and redundant display labels. No accepted agreement or recorded ruling was overwritten.

## Verification still in progress

Protocol finality, the remaining live classification results, finalized API read-back, demo capture and final source publication will be recorded here as completed. At the last live check, publication, contributor acceptance and Already required were provisionally accepted; Clarification reported LEADER_TIMEOUT and the later requests were queued. These are not fabricated successful outcomes.


