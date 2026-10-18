# Architecture

The browser composes immutable requests, asks for an estimate, and sends through the explicitly selected EIP-6963 provider. A legacy injected-provider fallback is available. The server never signs and does not compute a scope classification.

The Next.js API relays bounded reads, validates operation arguments, estimates the pinned Bradbury EVM call, and reconciles the wallet transaction with the GenLayer lifecycle. On-chain contract state is authoritative. No application database exists. Browser storage contains unfinished drafts and one unresolved transaction; it is not an agreement registry.

## Contract interface

| Operation | Input | Behavior |
| --- | --- | --- |
| `create_agreement` | JSON payload string | Stores creator-signed frozen brief and hash; indexes both wallets. |
| `accept_agreement` | Agreement ID, exact SHA-256 | Named contributor accepts once. |
| `request_ruling` | JSON payload string | Accepted-agreement participants only; bounded independent adjudication. |
| `get_policy` | None | Policy identifier. |
| `get_agreement` | Agreement ID | JSON record or empty string. |
| `get_ruling` | Request ID | JSON record or empty string. |
| `get_inbox` | Wallet address | IDs of agreements involving the wallet. |
| `get_requests` | Agreement ID | IDs of successful recorded rulings. |

Creation payload: `id`, `policy`, lowercase `creator`, lowercase `contributor`, `title`, and `requirements` string array. IDs are browser-generated UUIDs. The creator's authenticated transaction is the first approval; the contributor's explicit hash acceptance is the second.

Ruling payload: `id`, `policy`, lowercase `sender`, `agreement_id`, `agreement_hash`, and `request`. The contract calculates SHA-256 over exact UTF-8 payload bytes, rather than reconstructing JSON on the server. Agreements and results retain those bytes for read-back verification.

Rulings add `classification`, `explanation`, `clause_ids`, `limitations`, and `request_hash`. Clause IDs are unique integers from the actual frozen requirements. Non-ambiguous results require at least one reference. Additional scope cites the nearest relevant clause and explains the uncovered obligation; this reference does not imply the clause requires that extra work.

## Adjudication and boundaries

The leader sees numbered requirements and the submitted request, separated from the policy rubric as untrusted data. It makes one model call. Deterministic validation rejects invalid classifications, malformed fields and invented clause numbers. Validators independently derive a label and audit the proposed reasoning with one model call; classification must agree and reasoning must be substantively valid. Explanation strings do not need to match exactly.

An invalid model response crosses the replay boundary as immutable error data. Validators must independently reproduce the failure to accept it. Deterministic execution then raises an error and stores no ruling. No consensus likewise stores no successful shared result. Submitted calldata still exists publicly in the transaction.

## Application API

- `GET /api/chain?kind=config`: public address, chain ID and policy.
- `GET ...?kind=agreement&id=<uuid>`: finalized agreement and finalized successful request IDs.
- `GET ...?kind=ruling&id=<uuid>`: finalized ruling, after provenance and accepted-agreement checks.
- `GET ...?kind=inbox&id=<wallet>&offset=<n>`: newest-first page of up to 20 finalized agreements.
- `POST /api/chain` with `{kind:"quote",action}`: validate, preflight, estimate; does not send.
- `POST /api/chain` with `{kind:"track",action,hash}`: verify sender, destination, exact method/payload and consensus settings, then reconcile the existing transaction.

An action contains `contract`, `from`, allowed `method`, and string-array `args`. Writes are restricted to the configured contract and three public operations. All enforcement is repeated in the contract. No cookie authentication is needed for public reads or estimates; write authority comes from the chain sender.

The two RPCs are `https://rpc.testnet-chain.genlayer.com` for EVM estimates/receipts and `https://rpc-bradbury.genlayer.com` for Intelligent Contract reads/lifecycle. The release pins `genlayer-js 1.1.8` and the legacy `v0.2.17` runtime. This is not a Consensus v0.6 deployment.

## Transaction safety

Fee estimates expire after five minutes. Accounts and network are rechecked immediately before signing. A Web Lock serializes wallet submissions across same-origin tabs, and the saved pending record is rechecked inside that lock. Persist the uncertain attempt before calling the wallet; persist the returned hash immediately. Declined requests unlock; other unknown outcomes retain the lock and allow attaching an existing hash.

Tracking verifies the EVM input before trusting its GenLayer event. Accepted plus successful execution and agreement is provisional; only successful finalized consensus with matching read-back is finalized. `AGREE` and `MAJORITY_AGREE` are both recognized. A finalized error or disagreement is not a ruling. The browser polls every 15 seconds while visible and never sends an automatic retry. Public record pages use finalized state.
