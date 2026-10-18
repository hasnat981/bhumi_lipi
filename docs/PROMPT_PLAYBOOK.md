# Prompt playbook: build Bhumi Lipi from an empty folder, one prompt at a time
Works with Antigravity, Claude Code, Codex, or any AI chat that can edit files. Every prompt is copy-paste ready. The two spec files (`docs/SPEC.md` backend, `docs/UI_SPEC.md` front end) carry the details so the prompts stay short.

**How to use it:** one prompt per conversation (or per task), then **Check**, then `git commit`. Do not skip the checks. If you cannot explain what the agent wrote, ask "explain this file in plain words" before you commit. That is what protects you in Q&A.

## Phase 0: Start (15 min)
**P0.1 Folder and rules**
```
Create a new empty project folder layout: bhumi/ (Python package), web/ (css/, js/, js/views/, assets/), tests/, tools/, docs/, data/.
Add .gitignore (pycache, *.pyc, data/*.db, keys/, .env, node_modules, .DS_Store), requirements.txt with exactly one line "cryptography>=42", and an empty tests/__init__.py and bhumi/__init__.py.
Do not write any other code yet.
```
**Then you:** copy `AGENTS.md`, `GEMINI.md`, `.agent/`, `docs/SPEC.md`, `docs/UI_SPEC.md` from the starter zip into the new folder. `git init`, commit "Project skeleton and specs".
**Check:** `git status` is clean, `pip install -r requirements.txt` works.

## Phase 1: Crypto, database, rules (backend core, about half a day)
**P1.1 Tests first for chain.py**
```
Read AGENTS.md and docs/SPEC.md sections 1 and 2. Write tests/test_chain.py (unittest) for a module bhumi/chain.py that does not exist yet. Cover: block hash changes when any canonical field changes; signature round trip with a per-office Ed25519 Keyring; a signature made for office SR-DHK fails for SR-CTG; merkle_root changes when one hash changes; merkle_proof/verify_proof works for every leaf for tree sizes 1, 2, 3, 5, 8, 13 and fails for a wrong leaf. Do not write bhumi/chain.py yet. Run the tests and show me they fail for the right reason.
```
**P1.2 chain.py**
```
Implement bhumi/chain.py exactly as docs/SPEC.md sections 1 and 2: canonical(), block_hash(), sha256_hex(), Keyring (per-office keys from a master secret, sign, verify, public_b64), verify_signature(), load_master(), merkle_root(), merkle_proof(), verify_proof(). Use only the `cryptography` package and the standard library. Add a docstring to every function. Make tests/test_chain.py pass.
```
**Check:** tests green. Ask the agent: "Explain canonical() and why each Merkle leaf and node uses a different prefix byte."
**Commit:** `chain: signed hash chain and Merkle proofs`

**P1.3 db.py**
```
Implement bhumi/db.py per docs/SPEC.md section 3: SQLite schema (plots, blocks, mutations, mutation_events, survey_records, liens, anchors, alerts, audit_log, meta), triggers that make blocks, mutation_events, anchors and audit_log append-only, the blocks_chain_guard trigger, TRIGGER_NAMES, and connect(path) that returns a connection with row_factory=sqlite3.Row. Then write tests/test_db.py proving: UPDATE and DELETE on each append-only table fail, and a block with a wrong seq or wrong prev is rejected.
```
**Check:** the 5 failure cases really raise errors. **Commit:** `db: append-only triggers and chain guard`

**P1.4 rules.py (tests first, then code)**
```
Read docs/SPEC.md section 4. First write tests/test_rules.py for bhumi/rules.py: a clean sale has no flags; each of the 11 rules fires in exactly the stated condition (including boundaries: 30-day window, 0.4x and 2.5x price band, median needs 2 sales, 5% survey tolerance); block flags make blocked() true; risk score is the sum capped at 100; levels LOW/MEDIUM/HIGH; every flag has Bangla and English text. Then implement bhumi/rules.py as pure functions (no database access) until the tests pass.
```
**Check:** read the Bangla messages aloud. Are they simple? **Commit:** `rules: 11 explainable fraud rules`

**P1.5 mutation.py**
```
Implement bhumi/mutation.py per docs/SPEC.md section 6: STATES, TRANSITIONS, LABELS (bn and en for each state), CHECKS (8 checks with bn and en), can_move(), run_checks(flags, signature_ok), all_passed(). Add tests/test_mutation.py for every allowed and forbidden transition and for run_checks.
```
**Commit:** `mutation: state machine and 8 checks`

## Phase 2: The service layer (use cases, about half a day)
**P2.1 Registering a sale**
```
Start bhumi/service.py per docs/SPEC.md sections 1, 5 and 7: ApiError(status, code, bn, en, **extra) with .body(); input validation (plot id regex, names 2-80 chars, integer price 0..10^12) with bilingual errors; make_document(); class Service(con, keyring, clock) with an RLock; _append_block(); verify_plot_chain() (checks seq, prev, hash, signature, doc hash, ownership replay, final owner); the rule context builder; register_sale(actor, plot_id, seller, buyer, price, dry_run). Blocked sales write alerts and audit rows and raise ApiError 409 SALE_BLOCKED with the flags. Successful sales run in ONE transaction: append SALE block, set owner and locked=1, create the mutation with its 8 checks and events. Write tests that create plots by direct SQL insert and cover: lifecycle, fake seller, double sale, lien, government land, price anomaly goes to FLAGGED, dry_run changes nothing, input validation.
```
**Check:** run the tests, then ask "show me the SQL transaction and what happens if the program crashes halfway." **Commit:** `service: register_sale with rules, lock and mutation`

**P2.2 Citizen views**
```
Add to bhumi/service.py per SPEC section 7: list_plots (with verdict), check_plot (green/amber/red with bilingual headline, reasons, advice, chain status, history, mutation, lien, survey records and mismatch), verify(hash_value or doc_hash) returning GENUINE, OUTDATED, FORGED or CHAIN_BROKEN (accept a 64-hex code inside any text), deed_by_hash, mutation_status, mutation_queue. Add tests for each verdict and each verify result.
```
**P2.3 Decisions and liens**
```
Add decide() (approve unlocks; flagged approval needs a note of 3+ characters; reject appends a REVERSAL block, restores the seller, unlocks; a decision cannot be repeated) and the lien methods list_liens, place_lien, release_lien per SPEC sections 6 and 8. Add tests including: after a reject the history is INIT, SALE, REVERSAL and the chain still verifies.
```
**P2.4 Integrity, anchor, lab**
```
Add to bhumi/service.py per SPEC sections 2 and 9: ensure_anchor (new snapshot row only when the block count changed), anchor_proof, _verify_anchors (each snapshot must equal the Merkle root of its first block_count blocks), integrity, stats, keys, export, alerts, lab_run (five attacks on an in-memory COPY of the database via sqlite backup) and _rewrite_history (lab only). Add tests: triggers block edits; if triggers are dropped and a row is edited, verify_plot_chain fails; if an insider with the key re-signs the whole plot history, chains still verify but the anchor check fails; lab_run leaves the real data untouched and returns outcomes STOPPED x4 and DETECTED x1.
```
**Check:** the "insider re-signs" test is the heart of your honesty story. Make sure you can explain it. **Commit** after each of P2.2 to P2.4.

## Phase 3: Seed and API (about 3 hours)
**P3.1 Seed**
```
Write bhumi/seed.py per docs/SPEC.md section 11: 11 synthetic plots with the stated stories, deterministic survey records (no Python hash()), sales with realistic prices (Uttara around 1.2M BDT per decimal so price anomaly works), one pending mutation, one lien, and one caught fake-seller attempt so the alerts list is not empty. Only obviously dummy names ("Dummy Owner A"). Add a test that every seeded plot gets the verdict listed in SPEC and all chains verify.
```
**P3.2 HTTP layer**
```
Write bhumi/api.py using ONLY the Python standard library (http.server, ThreadingHTTPServer). Routes and roles exactly as docs/SPEC.md section 10; JSON errors with bn and en; header X-Demo-Role; a sliding-window rate limiter (90 writes/min, 6/min for /lab/run); 64 KB body limit; security headers including Content-Security-Policy with script-src 'self' (style-src may allow 'unsafe-inline' and Google Fonts); static file serving for web/ with a safe path check (no traversal) and SPA fallback to index.html for paths without a file extension; also serve /tools/verify_anchor.py; wrap handler calls in the service lock; build_service(db_path, master, clock) that seeds an empty database and rebuilds the demo database if the signing keys changed; make_server(); main() reading PORT, HOST, BHUMI_DB. Add bhumi/__main__.py and server.py. Then write tests/test_api.py that starts the server on a random port and walks the whole demo story over real HTTP, checks the roles (403s), bad input (400), path traversal attempts, security headers and the lab.
```
**Check:** `python server.py`, open `/api/stats` and `/api/plots/DHK-GUL-0309` in the browser. **Commit:** `api: stdlib http server with roles, CSP, rate limit`

## Phase 4: The front end (about one day)
Give each prompt the line: "Read docs/UI_SPEC.md. Plain JavaScript ES modules, no frameworks, no build step. Never use innerHTML with user or server text."
**P4.1 Shell**
```
Read AGENTS.md and docs/UI_SPEC.md sections 1 to 6. Build web/index.html, web/css/app.css (design tokens for light and dark, buttons, inputs, cards, chips, verdict banners, timeline, tabs, skeleton, toast, print rules), web/js/dom.js, i18n.js, api.js and app.js (shell with header, role select, language and theme toggles, hash router with skeleton/error states, stale-render guard). Use a placeholder page for each route for now. Copy the logo to web/assets/logo.png and favicon.png.
```
**Check:** open the site, switch language, role, theme; resize to 360 px. **Commit.**
**P4.2 QR encoder (with proof it works)**
```
Implement web/js/qr.js per docs/UI_SPEC.md section 8 (own QR encoder, byte mode, ECC M, versions 1-10) exporting qrMatrix(text) and qrSvg(text). Then write a small Node script that dumps matrices for texts of length 2, 19, 70, 100, 200 and a Bangla string to JSON, and a Python script that renders each matrix as an image and decodes it with OpenCV QRCodeDetector. All must decode to the exact input. Keep both scripts in tools/.
```
**Check:** all cases decode. If any fails, paste the failing text and error back to the agent. **Commit.**
**P4.3 Home and Check pages** (UI_SPEC 7.1 to 7.3) · **P4.4 Verify** (7.4) · **P4.5 Registrar** (7.5) · **P4.6 Mutation and Bank** (7.6, 7.7) · **P4.7 Integrity, Lab, About** (7.8 to 7.10). Prompt pattern for each:
```
Read docs/UI_SPEC.md section <N> and the existing web/js/views/ui.js helpers (create ui.js with verdictBanner, flagList, riskMeter, errorBox, roleGate, stateChip, pageHead if it does not exist). Implement web/js/views/<page>.js exactly as specified, using the API in docs/SPEC.md section 10. Include loading, error and empty states, Bangla and English text, and keyboard access. After coding, start the server, open the page in the browser and tell me what you verified.
```
**Check after each page:** click every button yourself, in both languages, on a 390 px wide window. **Commit** per page.
**P4.8 Polish pass**
```
List, then (after I approve) fix: contrast under 4.5:1, missing labels, focus order, sideways scroll at 360 px, console errors, missing empty/error states, awkward Bangla. Do not change the color palette. Report each fix.
```

## Phase 5: Quality, tools, docs (about half a day)
**P5.1 Browser test**
```
Write tests/e2e_playwright.py following docs/UI_SPEC.md section 9: walk the whole demo story in a real browser against BASE (default http://127.0.0.1:8000), fail on any page error or unexpected console error (409 responses are expected), decode the on-screen QR with OpenCV and assert it contains "/#/v/", check no sideways scroll at 390 px, optionally save screenshots when SHOTS is set. Run it and fix the app (not the test) when something is wrong.
```
**P5.2 Independent verifier**
```
Write tools/verify_anchor.py: it must NOT import the bhumi package. It reads the JSON from /api/export (file or URL) and re-checks every block hash, Ed25519 signature (keys from the export), document hash, plot chain, and every published anchor (Merkle root of the first block_count hashes). Exit code 0 if all good, 1 with a list of problems otherwise. Add tests that run it on a clean export (passes), a tampered export (fails), and a re-signed history (fails only on the anchor).
```
**P5.3 Docs**
```
Write README.md (idea, features table mapped to P2/P3/P4/P5, run in 2 commands, tests, deploy, architecture, API summary, security notes, honest limits, AI tools used, "Changes since Round 1"), docs/THREAT_MODEL.md (threat, control, residual risk), docs/QA.md (explain each module in 60 seconds plus 20 judge questions with short answers) and docs/DEMO_SCRIPT.md (3-minute video, timed table). Use only facts that are true for this repository. Do not invent statistics.
```
**P5.4 Deploy files**
```
Add a Dockerfile, a render.yaml for a free Render web service (generate BHUMI_MASTER_B64, BHUMI_DB=/tmp/bhumi.db, health check /api/health) and a GitHub Actions workflow that runs the unit tests. Explain step by step how I deploy on Render.
```

## Phase 6: Submission kit (half a day)
**P6.1** `/rubric-check` with the official rubric pasted in. **P6.2** "Write the 4-page concept note (PDF) from docs and README: problem and importance in Bangladesh, solution, architecture and tech stack, features with 2 screenshots, nationwide plan, team and mentors (leave names as placeholders). Count the pages." **P6.3** Record the video with `docs/DEMO_SCRIPT.md`. **P6.4** `/pre-submit`.

## If time is short (minimum that still scores)
Do P0, P1.1 to P1.4, P2.1 to P2.2, P3.1, P3.2, P4.1, P4.3 (Home, Check), P4.4 (Verify), P4.5 (Registrar), P5.4, P6. You still get: sealed deeds, fraud blocks, citizen verdicts, verify, deploy. Add Mutation, Integrity and Lab next.

## Fast first draft (optional, then iterate)
You can ask for a rough draft in one go, but expect rework and read everything afterwards:
```
Read AGENTS.md, docs/SPEC.md and docs/UI_SPEC.md. Build the project in 10 milestones in this order: (1) chain and db with tests, (2) rules, (3) mutation, (4) service, (5) seed, (6) api, (7) web shell + QR, (8) citizen pages, (9) officer pages, (10) integrity, lab, about. After EACH milestone: run the tests, commit, summarize in 5 lines, and STOP and wait for me to say "next". Never start a milestone without my go-ahead.
```

## Reusable prompts
**When something fails**
```
This is the exact error and the command I ran: <paste both>. Find the root cause first. Explain it in two sentences. Propose the smallest fix, wait for my OK, then apply it and re-run the same command. Do not change unrelated files.
```
**Before every commit (review)**
```
Review the changes since the last commit like a strict teacher. List: anything I cannot explain easily, any rule in AGENTS.md that is at risk (real data, innerHTML, secrets), missing tests, and edge cases. Do not edit files.
```
**Learn it (use before Q&A)**
```
Quiz me on <file>. Ask 5 questions one at a time like a hackathon judge ("why this and not that?", "what happens if...?"). Wait for my answers and correct me.
```
**Make it simpler**
```
This function is hard for me to explain. Rewrite it in simpler code with the same behavior and the same tests passing, and add a comment that a first-year student would understand.
```

## Prompting tips that save hours
1. One goal per prompt. Name the file and the spec section. Say what "done" means (tests green, page works).
2. Tests first for logic. For UI: "start the server, open the page, tell me what you verified."
3. Paste real errors, not summaries. Say what you expected.
4. Ask for the plan before big changes. Say no to plans that touch unexpected files.
5. Commit after every green step so you can always go back.
6. Never paste real personal data or credentials into a prompt.
7. List every AI tool and model you used in README "AI tools used".
