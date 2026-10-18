# Operating limits

- This is a Bradbury testnet app, not an escrow, payment service, legal ruling or proof of work completion.
- All agreement text, requests, addresses and results are public on-chain. Drafts stay in the current browser until publication. Do not submit confidential or personal material.
- Only English text is supported. V1 has no attachments, external evidence retrieval, code execution or private messaging.
- Classifications interpret agreed requirements. They cannot prove who made a request, whether work was delivered, or whether either party has legal rights.
- Both wallets must approve one frozen version. There is no amendment, revocation or automatic expiry; create and accept a new agreement instead.
- Mixed requests, contradictory clauses and missing context can appropriately receive Ambiguous. Model judgments are not infallible. Prompt isolation and independent review reduce risks but cannot guarantee immunity to prompt injection or collusion.
- A ruling uses one leader model call and two calls per validator. Provider failure, malformed responses, validator disagreement or protocol timeouts can prevent a result. The app distinguishes this from an agreed Ambiguous classification.
- Each ruling references the brief and request hashes. Duplicate successful requests with the same trimmed text in one agreement are rejected; differently worded or failed requests can be submitted only through a new, explicitly approved transaction.
- Accepted is provisional and may change through protocol appeals. Finality is asynchronous and has no application-level deadline. The site does not invent finality from a timer.
- Public agreement/ruling pages and the acceptance inbox use finalized state. Wait for publication finality before accepting in the UI, and acceptance finality before requesting a ruling. This is slower than the sequential nonfinal contract checks used in the test ledger.
- The estimate is the pinned Bradbury EVM transaction maximum at the quoted gas limit and price. It is not v0.6 execution profiling, a guaranteed total across protocol versions, or a guarantee of a ruling. An unsuccessful transaction can cost test GEN. ClausePact charges no application fee.
- An uncertain wallet response retains the submission lock. Attach the existing EVM hash after checking wallet activity. Clearing browser storage or changing origin loses local recovery data; preserve your hash externally. No automatic rebroadcast occurs.
- Wallet account selection is held in memory; reconnect after a full reload. The draft and transaction are restored separately. Modern browsers with Web Locks and an EVM wallet are required for submission.
- Wallet agreement indexes and per-agreement ruling lists grow on-chain; no throughput or large-index benchmarks have been performed. The API paginates inbox results; v1 is intended for modest testnet use.
- Public finality proofs inspect at most the latest 1,000 finalized transactions on this deployment. Older records are withheld when their publication, acceptance or ruling proof falls outside that window. Agreement pages inspect the latest 100 stored ruling IDs. These limits need an indexing/navigation improvement before larger deployments.
- This deployment shares one contract execution queue. A consensus-stage timeout can delay later requests, including unrelated agreements, until protocol recovery; creating a second payment for the same request does not repair that queue.
- Protocol appeals remain accessible through GenLayer tooling during the appeal window; the v1 website does not include an appeal transaction composer.
- Test fixtures are not live model or committee evidence. Refer to the release ledger for observed live states. Portal acceptance and uniqueness are not guaranteed.


