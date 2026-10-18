# ScopeLock

Two wallets agree on a frozen bounty brief. When a later request arrives, GenLayer evaluates whether it is **Already required**, a **Clarification**, **Additional scope**, or **Ambiguous**, with references to the original requirements.

- Website: https://scopelock-inclover05s-projects.vercel.app
- Source: https://github.com/Inclover05/scopelock
- Network: GenLayer Bradbury, chain ID 4221 (test GEN only)
- Policy: `scopelock-scope-v1`
- Contract: `0x96F604f62Dcc0957e3ea8554779EB4B5BE4bfae3`

Read [release evidence](reports/verification.md) for actual deployment, execution, consensus and finality states. A deployed address or an Accepted transaction is not proof of a finalized successful ruling.

## Run

Node 24 and npm are required. In this separate checkout:

```powershell
npm ci
Copy-Item .env.example .env.local
# Set NEXT_PUBLIC_SCOPELOCK_CONTRACT to the verified deployed contract.
npm run dev
```

Open http://localhost:5180. No database, search API, private LLM backend or hosted signer is required. The server relays reads and estimates; the selected browser wallet signs transactions.

```powershell
npm run typecheck
npm test
npm run build
python -m pip install -r requirements.txt
python scripts/contract-tools.py
python scripts/contract-tools.py test
npm run verify:network
```

The Python adapter uses official cached GenVM SDK bytes from the manager artifact and remaps only archive paths for the legacy runner. If not cached, run `genvm-lint download` first. Direct tests mock model responses and capture validator replay; they do not prove live consensus or model accuracy.

## Product

1. A creator publishes a title, another wallet, and 1–12 numbered requirements (500 characters each).
2. Publication freezes the exact payload and SHA-256 hash. Only the named contributor can accept that hash.
3. Either participant requests a ruling on one text request (2,000 characters maximum).
4. GenLayer proposes a classification and clause-grounded explanation; validators independently classify and audit it.
5. A shareable ruling remains bound to the agreement hash, request hash, submitting wallet and policy.

English text only. All on-chain text and addresses are public. The app assesses supplied wording, not who originally said it. It does not judge completed work, handle funds, make legal determinations or amend agreements.

## Further reading

- [Architecture and public interfaces](docs/architecture.md)
- [Reviewer walkthrough and submission draft](SUBMISSION.md)
- [Operating limits](LIMITS.md)
- [Deployment and recovery](DEPLOYMENT.md)
- [Ecosystem comparison](docs/differentiation.md)

ClaimLens supplied selected integration patterns for wallet identity, EVM/GenLayer endpoint separation, fee review, immutable provenance and uncertain-broadcast recovery. ScopeLock has a new contract, policy, workflow, repository and deployment. No prior project's historical verdicts, deployment or acceptance are used as ScopeLock evidence.

