---
description: Do one small ticket safely (plan, tests first, smallest change, report)
---
1. Read AGENTS.md and docs/SPEC.md. Restate the ticket and its acceptance criteria in two lines.
2. Write a short plan: files to change, tests to add. Wait for my approval.
3. Write or update tests first when logic changes.
4. Make the smallest change that passes.
5. Run `python -m unittest discover -s tests -t .`. If the UI changed, start the server and run `python tests/e2e_playwright.py`.
6. Commit with a clear message such as `T07: lock plot after sale`.
7. Report: files changed, how to run it, what I should check by hand, anything uncertain. Then stop. Do not start another ticket.
