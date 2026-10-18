# Q&A prep: both students must be able to answer these (no mentors in Q&A)

## Explain every module in 60 seconds
* **chain.py** – A block is a deed record. `canonical()` turns its fields into stable bytes, `block_hash()` is SHA-256 of that. Each block includes the previous block's hash, so changing an old block changes every later hash. The `Keyring` gives each office its own Ed25519 key and signs the block hash. `merkle_root()` hashes all block hashes into one root; `merkle_proof()` lets anyone prove one record is inside that root.
* **db.py** – SQLite tables. Triggers make `blocks`, `anchors`, `mutation_events`, `audit_log` append-only. `blocks_chain_guard` rejects any new block whose `seq` or `prev` does not extend the plot's chain.
* **rules.py** – Pure functions. Each rule returns a flag with level (`block` or `warn`), weight and a Bangla/English message. Risk score = sum of weights capped at 100.
* **mutation.py** – State machine `SUBMITTED → AUTO_CHECKING → AUTO_PASSED|FLAGGED → APPROVED|REJECTED` and the 8 automatic checks.
* **service.py** – The use cases. `register_sale`: validate → rules → (block and alert) or (append block, lock plot, create mutation). `decide`: approve unlocks; reject appends a REVERSAL block. `verify_plot_chain` re-checks sequence, links, hashes, signatures, documents and ownership replay. `lab_run` runs five attacks on a copy.
* **api.py** – Router, demo roles, rate limit, security headers, static files.
* **web/** – No-framework single-page app. `dom.js` builds elements with `textContent` (no XSS). `qr.js` is our own QR encoder, tested by decoding with OpenCV.

## Likely questions
1. **Why not a public blockchain?** Cost, speed, privacy, and no need for a coin. We need tamper-evidence, signatures and a public anchor. Those give the proof without running a network. A consortium ledger between offices is on the roadmap as witness nodes.
2. **Is it really tamper-proof?** No. It is tamper-*evident*. Any change is detectable by the chain check, the signatures, and the public anchor. We say this on the About page.
3. **Who holds the keys?** One key per office. The demo derives them from a master secret. Production: hardware-held keys, rotation and revocation.
4. **What if a registrar is corrupt?** Their deeds are signed with their office key, logged, alerted if suspicious (price anomaly, rapid transfer), and the daily anchor makes silent rewrites detectable. Attack #5 in the lab shows this.
5. **What if the database admin edits a row?** Triggers block it. If they drop the triggers, the chain check fails (attack #5 before re-signing) or, if they also re-sign with a key, the anchor mismatch catches it.
6. **What does the Merkle root prove?** That a specific record was in the registry when the root was published, and that history before it has not been rewritten.
7. **How is a QR different from a printed fake?** The QR is just a link to the seal page, which reads from the registry. A fake QR for a *real* seal shows the real owner, so mismatches are visible. A fake QR for a made-up seal says FORGED.
8. **What about a valid old deed being replayed?** The page says OUTDATED because a newer block exists for that plot.
9. **How do you handle old paper records?** Out of scope (P1). Roadmap: Bangla OCR plus officer verification, then the record becomes block #1.
10. **Integration with existing systems?** An API gateway, role-based access, same plot ID. No rip-and-replace.
11. **Privacy?** Demo uses synthetic data. Production public pages would show only legally approved fields.
12. **People without smartphones?** Union digital centers, plot-number check, SMS/USSD later.
13. **Scalability?** Stateless service layer; move to PostgreSQL and run several instances. Blocks are per plot, so chains do not contend with each other. Merkle anchor cost grows slowly (log n proofs).
14. **Why Ed25519 and SHA-256?** Standard, fast, small signatures, widely audited. We use the `cryptography` library, not our own crypto. (The QR encoder is our own, but QR is encoding, not security.)
15. **Why standard-library HTTP instead of a framework?** One dependency, small attack surface, fully explainable. The service layer is framework-free, so a FastAPI move changes only `api.py`.
16. **What did AI write and what did you change?** Claude wrote first drafts. We reviewed every module, ran 51 tests and the browser test, and can walk through each file. (Be ready to show a diff you made yourselves.)
17. **What fails?** Single-operator trust, key theft, impersonation outside the system, offline paper sales. See `THREAT_MODEL.md`.
18. **What would you build next?** OCR for old khatians, GIS overlap detection, witness nodes, hardware keys.
19. **Cost to run?** Hosting a small server and a database, plus key management for offices. No per-transaction fees.
20. **Walk me through a sale.** Registrar enters plot, seller, buyer, price → rules preview → block created, signed, plot locked → mutation auto-checks → AC Land approves → plot unlocks → next sale is possible.

## Live pitch (5 min) – suggested split
Student A: problem (30s), live demo of sale + blocked fake seller + QR verify (2 min). Student B: citizen check on a phone (45s), attack lab and anchor (90s), rollout and close (45s). Both answer questions.
