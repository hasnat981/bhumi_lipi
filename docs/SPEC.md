# SPEC: the exact behaviour of Bhumi Lipi
This file is the single source of truth for AI agents and for the students. The tests in `tests/` check it.

## 1. Block (one deed record)
Fields: `plot_id, seq, kind, deed_no, frm, to, ts, doc_hash, price_bdt, office_id, prev` plus `hash, sig` (and the deed text `doc`, stored but not hashed directly: its SHA-256 is `doc_hash`).
* `kind` is `INIT` (first registration), `SALE`, or `REVERSAL` (a rejected sale undone).
* **Canonical bytes:** JSON of the 11 fields above, `sort_keys=True`, separators `(",", ":")`, `ensure_ascii=False`, UTF-8.
* `hash` = SHA-256 hex of the canonical bytes. `prev` = hash of the previous block of the same plot, or `"GENESIS"` for seq 1.
* `sig` = base64 Ed25519 signature over `bytes.fromhex(hash)`, by the key of `office_id`.
* `office_id` = `"SR-" + plot_id.split("-")[0]` (for example `DHK-UTT-0142` gives `SR-DHK`).
* Office key = Ed25519 private key from seed `SHA256(master + b"|" + office_id)`. The master comes from env `BHUMI_MASTER_B64`, else `keys/master.key`, else a new random file. (Demo only: production uses hardware keys.)
* Plot id format: `^[A-Z]{3}-[A-Z]{3}-\d{4}$`. Deed number: `DEED-<plot_id>-<seq:03d>`. A reversal uses `REV-<tracking_id>`.
* **Deed document:** plain text produced by `make_document()` (title lines, deed no, type, plot, mouza, area, seller, buyer, `BDT {price:,}`, UTC date, office). `doc_hash` = SHA-256 of its UTF-8 bytes.

## 2. Merkle anchor
* Leaf = `SHA256(0x00 || bytes(hash))`; node = `SHA256(0x01 || left || right)`; an odd level duplicates its last node; empty tree root = `SHA256(b"")`.
* Proof = list of `{h, side}` where `side` is where the sibling sits (`"L"` or `"R"`).
* A snapshot row `(ts, merkle_root, block_count)` is added whenever the block count changes. A snapshot must always equal the Merkle root of the first `block_count` block hashes (ordered by insertion id). If not, history was rewritten.

## 3. Database rules (enforced by SQLite triggers, not only by code)
* `blocks`, `mutation_events`, `anchors`, `audit_log` reject UPDATE and DELETE (`<table> is append-only`).
* `blocks_chain_guard`: a new block is rejected unless `seq = max(seq)+1` and `prev = last hash` (or `GENESIS`) for that plot.
* Other tables: `plots, mutations, survey_records, liens, alerts, meta`. See `bhumi/db.py`.

## 4. Fraud rules (`bhumi/rules.py`)
| Code | Level | Weight | Fires when |
|---|---|---|---|
| NO_PLOT | block | 100 | plot not found |
| GOV_LAND | block | 100 | plot is khas or under acquisition |
| LOCKED | block | 100 | plot is locked (mutation pending) |
| NOT_OWNER | block | 100 | seller is not the registered owner |
| LIEN | block | 100 | an active bank lien exists |
| COURT_CASE | warn | 60 | plot has a court case |
| SURVEY_MISMATCH | warn | 40 | CS/SA/RS/BS areas differ by more than 5% of the largest |
| RAPID_TRANSFER | warn | 30 | 2 or more earlier SALE blocks in the last 30 days |
| PRICE_ANOMALY | warn | 25 | price per decimal is below 0.4x or above 2.5x the mouza median (median needs at least 2 sales) |
| REPEAT_BUYER | warn | 20 | buyer bought 2 or more other plots in 30 days |
| SELF_TRANSFER | warn | 15 | seller equals buyer |
Risk score = sum of weights capped at 100. Level: LOW below 30, MEDIUM below 70, else HIGH. Every flag has `bn` and `en` text.
A sale with any `block` flag is rejected with HTTP 409 and an alert row. A sale with only `warn` flags is allowed but sent for officer review.

## 5. Sale lifecycle (`register_sale`)
1. Validate input (plot id, names 2 to 80 chars, price 0 to 10^12 as integer).
2. Run rules. If dry run, return flags and risk only.
3. If blocked: write alerts and audit, return 409 `SALE_BLOCKED` with the flags.
4. Else in one transaction: append SALE block, set plot owner to buyer and `locked=1`, create mutation, run checks, write events, write alerts for warn flags.
5. Mutation tracking id = `"MUT-" + hash[:8].upper()`. State after checks: `AUTO_PASSED` if all 8 checks pass, else `FLAGGED`.

## 6. e-Mutation (`bhumi/mutation.py`)
States: `SUBMITTED, AUTO_CHECKING, AUTO_PASSED, FLAGGED, APPROVED, REJECTED`. Allowed moves: SUBMITTED to AUTO_CHECKING; AUTO_CHECKING to AUTO_PASSED or FLAGGED; AUTO_PASSED or FLAGGED to APPROVED or REJECTED. APPROVED and REJECTED are final.
Eight checks: SIGNATURE, OWNER, GOV_LAND, LIEN, COURT, SURVEY, PRICE, RAPID (each fails when its flag code is present).
Decision by role `ac_land`: approving a FLAGGED application needs a note of at least 3 characters (`NOTE_REQUIRED`). Approve sets `locked=0`. Reject appends a REVERSAL block (frm = current owner, to = original seller, price 0), restores the seller as owner, unlocks.

**Aging (additive).** `mutation_status` and the queue return `waiting_days` (whole days since creation; for decided applications the days it took, frozen at the decision time) and `aging`: `green` under 14 days, `amber` from 14, `red` from 30 (constants `AGING_AMBER_DAYS`, `AGING_RED_DAYS`), or `null` once decided.

## 7. Citizen check (`check_plot`) and verify
* Verdict RED if: chain broken, active lien, or government land. AMBER if: plot locked, court case, survey mismatch, or 2+ sales in 30 days. Otherwise GREEN.
* `verify(hash | doc_hash)`: not found gives `FORGED`; plot chain broken gives `CHAIN_BROKEN`; block is the latest of its plot gives `GENUINE`; otherwise `OUTDATED`. Accepts a 64-hex code anywhere inside the input (so a pasted link works).
* Chain verification checks, in order: seq order, prev link, hash, signature, doc hash, ownership replay (each non-INIT block's `frm` equals the previous `to`), final owner equals plots.owner.

## 8. Liens
Role `bank`. Placing a lien is refused for government land (`GOV_LAND`), locked plots (`LOCKED`), and plots with an active lien (`DOUBLE_MORTGAGE`, also recorded as an alert). Releasing sets `released=1`.

## 9. Attack lab (`lab_run`)
Runs on an in-memory copy of the database. Five attacks: FAKE_SELLER, DOUBLE_SALE, FORGED_FILE, DB_EDIT (trigger stops it), INSIDER_REWRITE (drops the triggers, rewrites and re-signs history of one plot; chains still verify but the anchor check fails). The first four have outcome `STOPPED`; the last is `DETECTED`.

## 10. HTTP API (all JSON under `/api`; errors are `{"error": {code, bn, en, ...}}`)
Roles come from header `X-Demo-Role` (`citizen` default, `registrar`, `ac_land`, `bank`). Not real authentication.
| Method + path | Role |
|---|---|
| GET /plots, /plots/{id}, /stats, /integrity, /anchor, /anchor/proof/{hash}, /export, /keys, /liens, /mutations/{tracking}, /deeds/{hash}, /deeds/{hash}/document, /health | any |
| POST /verify, /lab/run | any |
| POST /risk, /deeds | registrar |
| GET /mutations/queue | ac_land, registrar |
| POST /mutations/{tracking}/decision | ac_land |
| POST /liens, /liens/{id}/release | bank |
| GET /alerts | registrar, ac_land, bank |
Rate limit: 90 writes per minute per client (6 for /lab/run). Body limit 64 KB. Security headers include a strict CSP.

## 11. Seed data (11 synthetic plots)
Clean: DHK-UTT-0142, DHK-UTT-0143, CTG-SAD-0877, DHK-MIR-0451. Amber: DHK-GUL-0309 (sold, mutation pending), CTG-PAT-0120 (3 sales in 30 days), RAJ-BOG-0066 (court case), RAJ-NAT-0418 (survey mismatch). Red: KHL-DUM-0033 (khas), DHK-SAV-0505 (acquisition), SYL-ZKJ-0210 (bank lien).

## 12. Export format and the independent verifier (`tools/verify_anchor.py`)
`GET /api/export` returns `{"format": 1, "blocks": [...], "anchors": [...], "keys": {...}}`: `blocks` in insertion order with fields `plot_id, seq, kind, deed_no, frm, to, ts, doc_hash, doc, price_bdt, office_id, prev, hash, sig`; `anchors` as `{id, ts, merkle_root, block_count}`; `keys` as `{office_id: public_key_base64}`.
The verifier takes a file path or an http(s) URL. It must **not import the `bhumi` package** (so it does not trust the app). It re-checks every block hash, Ed25519 signature, document hash, plot chain (sequence, prev link, ownership replay) and every anchor (Merkle root of the first `block_count` hashes). It prints a summary line `blocks: N   plots: N   anchors: N   offices: N`, then either a line starting with `OK` and exit code 0, or `PROBLEMS FOUND` with one line per problem and exit code 1. A history rewritten *and re-signed* must fail with a message containing the word `anchor` and no message containing `bad signature`. The class `VerifierScriptTests` in `tests/test_service.py` checks this.
