# Building and extending Bhumi Lipi with Google Antigravity

Antigravity changes quickly. What follows matches what its public docs and guides say today: it reads **`AGENTS.md`** and **`GEMINI.md`** in the project root (GEMINI.md wins if they conflict), extra rules in **`.agent/rules/`**, and slash-command **workflows** (each rule or workflow file is limited to about 12,000 characters). If a menu name or a folder name differs in your version (some guides write `.agents/` instead of `.agent/`), rename the folder or follow the in-app help. Everything below also works with Claude Code or Codex because the rules live in `AGENTS.md`.

> Want to build everything from an empty folder with prompts only? Use `docs/PROMPT_PLAYBOOK.md` (about 28 prompts with checks and commit points). This guide covers setup, workflows and the adopt-and-extend path.

## 0. Why this kit exists
The rules say both students must be able to explain every line, keep a real commit history, and list every AI tool used. So the goal is not "let the agent do it". The goal is: **the agent writes and you review, run, understand and commit**, one small step at a time.

## 1. Set up (15 minutes)
1. Install Python 3.12 and Git. Install Antigravity and sign in.
2. Unzip `bhumi-lipi.zip`. In Antigravity: **File → Open Folder → bhumi-lipi**.
3. In the Customizations / Rules panel, check that `AGENTS.md`, `GEMINI.md` and `.agent/rules/compliance.md` are listed. Type `/` in the agent chat and check that `ticket`, `test-all`, `explain-back`, `rubric-check`, `pre-submit` and `bangla-review` appear.
4. Safer settings: use **Planning mode** (the agent shows a plan first) and keep terminal commands on **ask before running**. Pick the strongest model your plan allows.
5. In a terminal:
   ```bash
   python -m venv .venv
   .venv\Scripts\activate          # Windows PowerShell. On Mac/Linux: source .venv/bin/activate
   pip install -r requirements.txt
   python -m unittest discover -s tests -t .
   python server.py                # open http://127.0.0.1:8000
   ```
   Windows PowerShell env vars: `$env:PORT="8000"; python server.py`.
6. Start your own history: `git init`, `git add .`, `git commit -m "Import starter: Bhumi Lipi prototype"`, create a GitHub repo, push. From now on commit after every ticket.

## 2. Two ways to use it
**Path A: Adopt, understand, extend, deploy (recommended; fits the 5 days).** The prototype already works. You study it with `/explain-back`, improve it with small tickets, deploy it, and record the video.
**Path B: Rebuild the backend test-first (optional, strongest for ownership, about one day).** Delete the backend, keep the tests as the specification, and let the agent re-implement it step by step while you review each diff. Do this on a separate branch and only merge if all tests pass and you can explain it.

## 3. Schedule (today is Sun 11 Oct, submit by Fri 16 Oct)
| Day | Goal | What to do in Antigravity |
|---|---|---|
| Sun 11 | Run and own it | Setup above. Run `/test-all`. Read README. Use `/explain-back` on `bhumi/chain.py` and `bhumi/rules.py` |
| Mon 12 | Understand the core | `/explain-back` on `db.py`, `mutation.py`, `service.py`. Optionally start Path B |
| Tue 13 | Make it yours | `/bangla-review`, then edit wording you disagree with. Pick 2 tickets from Section 5 |
| Wed 14 | Deploy and polish | Deploy to Render (Section 6). Re-run `/test-all` against the live link. **Feature freeze tonight** |
| Thu 15 | Submission kit | Fill the concept note, record the video (`docs/DEMO_SCRIPT.md`), `/rubric-check` with the official rubric, `/pre-submit` |
| Fri 16 | Submit | Submit before noon. Keep the confirmation screenshot |

## 4. Prompts for Path A (copy and paste)
**A1. Learn a file (use the workflow):** type `/explain-back` and answer `bhumi/chain.py`. Repeat for each file in the order: `chain.py`, `rules.py`, `db.py`, `mutation.py`, `service.py`, `api.py`, `web/js/dom.js`, `web/js/views/registrar.js`.

**A2. Trace one request end to end:**
> Read AGENTS.md and docs/SPEC.md. Trace what happens, function by function with file names and line numbers, when a registrar presses "Register and seal" on the Registrar page: browser code, HTTP route, service method, rules, database writes, response. Then draw the same flow as a numbered list I can say aloud in 60 seconds. Do not edit any file.

**A3. Find weak spots (read-only security review):**
> Act as a skeptical security reviewer. Read bhumi/api.py, bhumi/service.py and web/js/dom.js. List up to 8 real weaknesses with severity, file and line, and a one-line fix idea each. Separate "real bug" from "known demo limitation" (demo roles are not real auth). Do not edit files and do not test any system other than this local app.

**A4. Add my own test (learning):**
> /ticket Add 3 new tests in tests/test_service.py that I choose: (1) selling a plot right after a REVERSAL block works, (2) the Merkle proof fails if the leaf is changed by one character, (3) a buyer with 2 recent purchases triggers REPEAT_BUYER. Explain each test in plain words after writing it.

## 5. Extension tickets (pick 2 or 3; each is one `/ticket`)
* **X1 CI browser test:** "Extend .github/workflows/ci.yml so a second job installs Playwright Chromium, starts the server on a temp database and runs tests/e2e_playwright.py. Keep the first job unchanged."
* **X2 Survey inheritance chain (Final Round):** "On the Check page, show how the holder changed across CS, SA, RS and BS as a small timeline. Add a rule SURVEY_HOLDER_GAP (warn, weight 25) when a later survey holder is not the earlier holder or a later registered owner. Update docs/SPEC.md, rules.py, tests and the seed (one new plot that triggers it)."
* **X3 PostgreSQL adapter (Final Round):** "Keep SQLite as default. Add an optional PostgreSQL backend selected by DATABASE_URL behind the same Service API, with the same append-only and chain-guard rules as triggers. Do not change any public API or test expectation. Explain how to run it with Docker."
* **X4 Accessibility pass:** "Using the browser, check every page at 360px width and with keyboard only. List issues first (contrast, focus order, missing labels), wait for my approval, then fix them. Do not change colors from the logo palette."
* **X5 Pitch deck (Final Round):** "Write a 10-slide pitch deck as Markdown for Marp following the outline in docs/SUBMISSION_CHECKLIST.md. Use real numbers from this repo only (51 tests, 11 rules, 8 checks, 5 attacks). No invented statistics."
* **X6 README screenshots:** "Run the app, take screenshots of Check (green, amber, red), Verify, Registrar (sealed with QR), Attack lab and Integrity, save them in docs/img/ and embed them in README. Use the English language setting. Do not include anything but synthetic data."

## 6. Deploy (you click, the agent explains)
> I want to deploy this project on Render's free plan. Read render.yaml and README. Give me numbered steps with exactly what to click and which values to paste. Tell me what will reset on every restart (the demo database) and why that is fine for the demo. Then tell me how to check the live site with /test-all by pointing BASE at the live URL.
After deploying, open the live link on a phone using mobile data and run the whole demo story.

## 7. Path B: rebuild the backend test-first (optional)
```bash
git checkout -b rebuild-by-hand
git rm -r bhumi
git commit -m "Start rebuild: tests and docs/SPEC.md are the specification"
```
(Keep `web/`, `tests/`, `tools/`, `docs/`, `server.py`.) Then give the agent one prompt at a time. After each one: read the diff, run the tests, `git commit`, `/explain-back` the new file.

* **B0:** "Read AGENTS.md and docs/SPEC.md. Do not write code yet. Summarise the 8 modules you will write (chain, db, rules, mutation, service, seed, api, __main__) in the order you will write them, and which tests prove each one."
* **B1 chain.py:** "Implement bhumi/chain.py exactly as docs/SPEC.md sections 1 and 2 (canonical bytes, block hash, Keyring with per-office Ed25519 keys, merkle_root, merkle_proof, verify_proof, load_master). Use the `cryptography` package only. Make tests/test_chain.py pass. Plain readable code and a docstring on every function."
* **B2 db.py:** "Implement bhumi/db.py: the SQLite schema from SPEC section 3 with append-only triggers on blocks, mutation_events, anchors and audit_log, plus the blocks_chain_guard trigger, and `connect()`. Export TRIGGER_NAMES. Add or fix tests only if SPEC demands it."
* **B3 rules.py:** "Implement bhumi/rules.py exactly as SPEC section 4: RULES table with Bangla and English messages, evaluate(), blocked(), risk_score(), risk_level(), median(). Make tests/test_rules.py pass."
* **B4 mutation.py:** "Implement bhumi/mutation.py as SPEC section 6: STATES, TRANSITIONS, LABELS (bn and en), CHECKS, can_move, run_checks, all_passed."
* **B5a service register_sale:** "Start bhumi/service.py: ApiError, input validation, make_document, Service.__init__, _append_block, verify_plot_chain, _context, register_sale per SPEC sections 1, 5 and 7. The full tests in tests/test_service.py also need seed.py and api.py (step B6), so check this step with a small throwaway script and tests/test_chain.py and tests/test_rules.py."
* **B5b service citizen views:** "Add check_plot, list_plots, verify, deed_by_hash, mutation_status, mutation_queue per SPEC section 7."
* **B5c service decisions and liens:** "Add decide (approve, reject with a REVERSAL block, NOTE_REQUIRED) and the lien methods per SPEC sections 6 and 8."
* **B5d service integrity, anchor, lab:** "Add ensure_anchor, anchor_proof, integrity, stats, keys, export, alerts, lab_run and _rewrite_history per SPEC sections 2 and 9. Do not expect tests/test_service.py to run until B6."
* **B6 seed.py and api.py:** "Implement bhumi/seed.py (SPEC section 11) and bhumi/api.py with the routes in SPEC section 10, role checks, rate limit, security headers, static file serving without path traversal, and build_service/make_server/main. Now make all of tests/test_service.py and tests/test_api.py pass, then run the browser test."
When everything is green: compare with the starter (`git diff main --stat`), keep whichever version you understand better, and mention in README exactly what you rebuilt.

## 8. Using several agents at once (Manager view)
Only for independent work on **separate branches** (for example X1 and X4). Never let two agents edit the same file. You merge, run `/test-all`, and read every diff yourself.

## 9. How to review an agent's work (2 minutes per ticket)
1. Read the plan before approving. If it touches files you did not expect, say no.
2. Read the diff. For every function you cannot explain, run `/explain-back` on it.
3. Run the tests yourself, not only the agent.
4. Ask: "What could break because of this change?" and "Show me the test that would fail if this were wrong."
5. Commit with your own message.

## 10. Rules and disclosure
* In README "AI tools used", write exactly what you used, for example: "Claude (code and docs drafting), Google Antigravity with <model name> (reviews, extensions)". Add what each was used for.
* Never paste real personal data, real records or credentials into any prompt.
* Do not use an agent to scrape, probe or test any government or third-party system.
* Both of you must be able to answer questions about the code in Round 1 and in the Final Round. Rehearse with `/explain-back` and `docs/QA.md`.
