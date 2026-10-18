# Build the whole project in one go

## First, pick an option
**Option A: use the finished project (10 minutes, guaranteed).** The complete, tested project is already in `bhumi-lipi.zip`.
```bash
unzip bhumi-lipi.zip && cd bhumi-lipi
pip install -r requirements.txt
python -m unittest discover -s tests -t .      # 51 tests, all green
python server.py                               # http://127.0.0.1:8000
```
Then read `docs/ANTIGRAVITY_GUIDE.md`, learn the code with `/explain-back`, deploy, record the video.

**Option B: let an AI agent build everything in one run (this file).** Use the **start kit** (`bhumi-lipi-start-kit.zip`): rules, both specs, the acceptance tests, the logo, and nothing else. The agent builds the whole project and must make the tests pass. Expect a few hours of agent time and a few rounds of "continue" or "fix this". It is slower than Option A and less certain, but the code is then the team's own build with a real commit history.
Be honest with yourself: neither option replaces understanding the code. Both students must explain every module.

## Steps for Option B
1. Unzip the start kit to a new folder. `git init`, `git add .`, `git commit -m "Start kit: specs and acceptance tests"`.
2. Open the folder in Antigravity (or Claude Code, Codex). Let the agent install packages and run commands in this folder (it needs `pip install -r requirements.txt -r requirements-dev.txt` and `playwright install chromium`). Keep "ask before deleting" on.
3. Paste the **master prompt** below.
4. If the agent stops early, send: `Continue from where you stopped. First run the test suite and tell me what is red.`
5. Done means: the three gates below are green, and `FINAL_REPORT.md` exists.
6. Read the code with `/explain-back`, run `/pre-submit`, and rehearse `docs/QA.md`.

### The three gates (you check these yourself, not only the agent)
```bash
python -m unittest discover -s tests -t .                                  # 1. all tests green
python server.py &  BASE=http://127.0.0.1:8000 python tests/e2e_playwright.py   # 2. browser story passes
python tools/verify_anchor.py http://127.0.0.1:8000/api/export             # 3. prints OK
```

## The master prompt (copy everything in the box)
```
You are building "Bhumi Lipi", a tamper-evident land deed registry for a hackathon, in this empty project. Work autonomously from start to finish. Only stop to ask me something if a rule in AGENTS.md would be broken or you are truly blocked.

READ FIRST, in this order: AGENTS.md, GEMINI.md, docs/SPEC.md (exact backend behaviour), docs/UI_SPEC.md (exact front-end behaviour), then the tests in tests/. The tests are the acceptance tests: make them pass. Do NOT edit or delete any test to make it pass. If a test truly contradicts SPEC.md, stop and tell me which test and why.

NON-NEGOTIABLE RULES: synthetic data only (no real names, NID numbers, phone numbers, land records); no scraping and no requests to any real government or third-party system; no secrets or keys in git; no innerHTML with user or server text; Python standard library plus the single dependency "cryptography" for the app; no frontend framework and no build step; every user-facing message in Bangla and English; plain readable code with a docstring on every module, because two students must explain every line.

BUILD ORDER, each milestone ends with: run the relevant tests, fix until green, then `git commit` with a clear message (small commits, never rewrite history):
 1. bhumi/chain.py and bhumi/db.py            (SPEC 1, 2, 3)           tests: test_chain.py
 2. bhumi/rules.py                            (SPEC 4)                 tests: test_rules.py
 3. bhumi/mutation.py                         (SPEC 6)
 4. bhumi/service.py                          (SPEC 1, 2, 5 to 9)
 5. bhumi/seed.py                             (SPEC 11)
 6. bhumi/api.py, bhumi/__main__.py, server.py (SPEC 10)               tests: test_service.py, test_api.py
 7. tools/verify_anchor.py                    (SPEC 12)                tests: VerifierScriptTests
 8. web/ shell, router, i18n, dom helpers, QR encoder (UI_SPEC 1 to 6, 8). Prove the QR encoder: render several matrices and decode them with OpenCV QRCodeDetector (text lengths 2, 19, 70, 100, 200, and a Bangla string). Save that check as tools/qr_check.mjs and tools/qr_check.py.
 9. web/ pages: home, check, verify, registrar, mutation, bank, integrity, lab, about (UI_SPEC 7, 10, 11). Use the exact labels and ids in UI_SPEC section 11.
10. Quality: run tests/e2e_playwright.py against a running server. Fix the app (never the test) until it passes. Check pages at 360 px width, light and dark mode, and Bangla.
11. Docs: README.md (idea, features mapped to P2/P3/P4/P5, run in two commands, tests, deploy, architecture, honest limits, "AI tools used" naming every tool and model you are, "Changes since Round 1"), docs/THREAT_MODEL.md, docs/QA.md (module explanations and 20 judge questions), docs/DEMO_SCRIPT.md (3-minute video, timed table), Dockerfile, render.yaml (free Render service, generated BHUMI_MASTER_B64, BHUMI_DB=/tmp/bhumi.db, health check /api/health), .github/workflows/ci.yml running the unit tests.

WHEN SOMETHING FAILS: find the root cause first, fix the smallest thing, re-run the same command. Do not paper over errors. If you cannot install Playwright or Chromium, say so, and verify the UI by opening the running app in a browser tool instead.

DONE MEANS: (a) `python -m unittest discover -s tests -t .` is fully green, (b) `tests/e2e_playwright.py` passes against a running server, (c) `python tools/verify_anchor.py http://127.0.0.1:8000/api/export` prints OK, (d) git log shows the milestone commits. Then write FINAL_REPORT.md: what you built per milestone, exact test results, known gaps or shortcuts, anything you were unsure about, and the 10 things the students must understand before the judges ask. Be honest about gaps.
```

## After the run (do not skip)
1. `git log --oneline` should show about 10 to 15 commits. Keep them.
2. Run the three gates yourself.
3. Open the site in a browser. Click everything in Bangla and English, at phone width.
4. `/explain-back` on every file in `bhumi/`. Fix wording with `/bangla-review`.
5. Compare with the finished project if you like (`diff -r`). The final submission is whichever version you understand better.
6. List the AI tools and models used in README.

## If the one-go run goes badly
Switch to the step-by-step prompts in `docs/PROMPT_PLAYBOOK.md`, starting from the first milestone that is still red. Or fall back to Option A.
