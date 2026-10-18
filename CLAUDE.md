# AGENTS.md (also copied to CLAUDE.md)
Guidance for AI coding agents (Claude Code, Codex, Antigravity, ...). Check each tool's docs for the exact rules filename it reads.

## What this is
Bhumi Lipi: tamper-evident land deed registry. Python standard library + `cryptography`; no-build vanilla JS front end. Read `README.md` and `docs/SPEC.md` (exact behaviour) first. Workflow help for Antigravity: `docs/ANTIGRAVITY_GUIDE.md`.

## Hard rules (breaking these can disqualify the team)
1. **Synthetic data only.** Never add real names, NID numbers, phone numbers, addresses or land records.
2. **No scraping**, no bulk download, no requests to any real government or third-party system, no security testing outside this app.
3. **Never commit secrets or keys.** `keys/`, `data/*.db`, `.env` stay ignored.
4. **Keep real, small commits.** No force push, no history rewrite.
5. **Keep it explainable.** Two students must explain every line. Prefer simple code. Docstring on every module.
6. **No new dependencies** without a written reason in the commit message and README.
7. **Do not widen scope.** Build only what the ticket asks.

## Invariants (tests must keep covering them)
* `blocks`, `anchors`, `mutation_events`, `audit_log` are append-only (DB triggers).
* A block's hash commits to all canonical fields and the previous hash; each block is signed by its office key.
* A sale locks the plot; only an approved mutation unlocks it; a rejected mutation appends a REVERSAL block.
* Seller must be the registered owner; government land and liened plots cannot be sold.
* Every user-facing message has both Bangla (`bn`) and English (`en`).
* User text is only ever inserted with `textContent` (see `web/js/dom.js`). Never use innerHTML with user data.
* CSP stays strict: `script-src 'self'`.

## Work loop
1. Restate the ticket and acceptance criteria in two lines.
2. Write or update tests first when logic changes.
3. Smallest change that passes.
4. Run `python -m unittest discover -s tests -t .`; for UI changes also run the browser test (`tests/e2e_playwright.py`).
5. Commit with a clear message. Report: files changed, how to run, what to check by hand, anything unsure. Stop.

## Layout
`bhumi/` backend (chain, db, rules, mutation, service, seed, api) · `web/` front end · `tools/` verifier + demo-file maker · `tests/` · `docs/`
