# ScopeLock release verification — 18 October 2026

This report is updated as checks complete. Machine-readable evidence in this folder is authoritative for the exact observed states; expected classifications are not observed results.

## Completed local checks

- Official legacy GenVM linter: passed, ScopeLock contract, five view methods, three writes, parameterless constructor.
- Official direct-runtime fixtures: **15 passed**, including creator/contributor permissions, exact acceptance hash, frozen publication, duplicate requests, all four result shapes, captured validator replay, invalid clause references, model errors, disagreement, mixed requests and injection-bearing input.
- Core JavaScript tests: **4 passed**, covering input limits, lifecycle safety, repayment locks and provenance matching.
- Next.js production build and TypeScript check passed. Further edits require final validation before release.
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

## Verification still in progress

Protocol finality, full live classification results, finalized API read-back, responsive/browser checks, demo capture and final source publication will be recorded here as completed. Real browser-extension wallet signing is a separate check from encrypted local test-signers; do not treat one as proof of the other.

