# ScopeLock release verification — 18 October 2026

This report is updated as checks complete. Machine-readable evidence in this folder is authoritative for the exact observed states; expected classifications are not observed results.

## Completed local checks

- Official legacy GenVM linter: passed, ScopeLock contract, five view methods, three writes, parameterless constructor.
- Official direct-runtime fixtures: **15 passed**, including creator/contributor permissions, exact acceptance hash, frozen publication, duplicate requests, all four result shapes, captured validator replay, invalid clause references, model errors, disagreement, mixed requests and injection-bearing input.
- Core JavaScript tests: **4 passed**, covering input limits, lifecycle safety, repayment locks and provenance matching.
- Next.js production build and TypeScript check passed. Further edits require final validation before release.
- Network preflight passed: both Bradbury endpoints returned chain ID 4221; the pinned SDK's consensus address has deployed code.

## Live evidence

- Dedicated contract: `0xD9518Ccbc2093490c148095676aD79931b61DcC3`.
- Source SHA-256: `a54af1f46dcaee3ce719276b01c68991b6ca3afd369df0f122a0a4dfeb5438f2`.
- Deployment EVM transaction: `0x9f214913864edd0266bc6b3049f4536cfde19c63cd3af259dc4e9116ada699f2`.
- Deployment GenLayer ID: `0xe628886649be2b026e9e568a44e40afec63cb46a702b70f41ff7df822113bfbe`.
- Exact source and policy read-back passed against the new contract. Initial observed state: Accepted, AGREE, FINISHED_WITH_RETURN; this is provisional until protocol finality.
- Initial measured deployment network fee: `0.001560425559333` test GEN.
- Public Vercel deployment reached READY with anonymous access. Browser inspection confirmed the overview, creation form, public-storage notice and numbered requirements.
- Real creator/contributor agreement and classification checks are recorded in `live-verification.json`. Their status is not implied by the deployed address.

## Verification still in progress

Protocol finality, full live classification results, finalized API read-back, responsive/browser checks, demo capture and final source publication will be recorded here as completed. Real browser-extension wallet signing is a separate check from encrypted local test-signers; do not treat one as proof of the other.
