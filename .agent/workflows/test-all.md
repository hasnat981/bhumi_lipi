---
description: Run every automatic check (unit tests, server start, browser walkthrough, independent verifier)
---
1. Run `python -m unittest discover -s tests -t . -v` and show the summary line.
2. Start the server on port 8765 with a temporary database: `BHUMI_DB=/tmp/bl.db PORT=8765 python server.py`.
3. Run `BASE=http://127.0.0.1:8765 python tests/e2e_playwright.py`. If Playwright is missing, say so and tell me the install commands (`pip install playwright`, `playwright install chromium`).
4. Run `python tools/verify_anchor.py http://127.0.0.1:8765/api/export`.
5. Stop the server. Report each step as PASS or FAIL with the first error line. Do not change code in this workflow.
