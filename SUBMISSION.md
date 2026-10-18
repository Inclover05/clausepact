# ClausePact — Builder Portal submission draft

**Website:** https://clausepact-inclover05s-projects.vercel.app  
**Source:** https://github.com/Inclover05/clausepact  
**Network:** GenLayer Bradbury testnet, chain ID 4221  
**Intelligent Contract:** `0x96F604f62Dcc0957e3ea8554779EB4B5BE4bfae3`  
**Policy:** `scopelock-scope-v1`

**Demo:** [60-second edited screen-capture walkthrough](https://clausepact-inclover05s-projects.vercel.app/demo.mp4). It shows the actual interface and real finalized agreement/ruling pages; it does not record browser-extension signing.

**Finalized examples:** [Already required](https://clausepact-inclover05s-projects.vercel.app/rulings/ceeec110-5590-462b-906d-585b9ec688fa), [Additional scope](https://clausepact-inclover05s-projects.vercel.app/rulings/b5cd47b0-0df0-4053-b589-450a38ede361), [Ambiguous](https://clausepact-inclover05s-projects.vercel.app/rulings/f341a798-f371-4a23-b905-2dbdd2cfe5a2).

The original Clarification and injection-bearing live checks finalized without consensus and have no verdict. A separately initiated Clarification follow-up reached Accepted with a Clarification result; its finality remains unverified at this release check. See the exact transaction states and identifiers in `reports/live-verification.json`.

## Description

ClausePact resolves a common disagreement in bounty work: does “one more thing” belong to the original brief? A creator publishes numbered requirements, a named contributor accepts their exact hash, and either participant can submit a later work request. GenLayer classifies it as Already required, Clarification, Additional scope or Ambiguous, with original-clause references and a grounded explanation.

## Why GenLayer is necessary

Whether a request materially expands an obligation requires interpreting natural-language requirements. Both parties benefit from an independently validated shared decision rather than one party's private AI answer. The Intelligent Contract enforces mutual approval and participant permissions, runs the judgment, independently validates the proposed classification/reasoning, and records the outcome with immutable input provenance. The website cannot author the verdict.

This is a scope-change workflow, rather than factual verification, code review or bounty winner selection. It does not escrow money or score completed work. See [differentiation and reuse](docs/differentiation.md).

## Reviewer walkthrough

1. Open the website and the links in the [live verification report](reports/verification.md). Inspect actual finality and clause references before evaluating an example.
2. Connect a funded Bradbury test wallet. Publish a short brief naming another wallet. Review the public-storage notice and fee before approving.
3. Wait for publication finality. Connect the named contributor, open its acceptance inbox, read the full brief and approve its exact hash. An unrelated wallet cannot accept it.
4. Wait for acceptance finality. Either participant submits one extra-work request and reviews a separate fee.
5. Observe pending/provisional/finalized states. Read the classification, explanation, cited requirement numbers, limitations and hashes. No consensus or an execution error must not appear as a ruling.
6. Share the finalized ruling URL. The original brief remains unchanged; a revised brief requires a new agreement and fresh acceptance.

## Validation and boundaries

The release report distinguishes controlled fixtures, actual contract transactions, browser checks, API read-back, and unresolved checks. All on-chain text is public. Results interpret submitted wording and do not authenticate who originally made the request, establish legal obligations or verify delivery. Fees and completion time are not guarantees of a result.

The repository includes source, tests, deployment/recovery tooling, architecture, operating limits and dated verification evidence. Portal review and duplicate treatment remain the stewards' decision. **This is prepared submission material, not confirmation of a submitted or accepted contribution.**


