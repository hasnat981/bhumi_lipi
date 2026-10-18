# GEMINI.md (Antigravity-specific; the shared rules are in AGENTS.md, read it first)

* Work in **Planning mode** for any task that touches more than one file. Show the plan and wait for my approval before editing.
* Ask before running terminal commands that install packages, delete files, or touch anything outside this folder.
* Never `git push --force`, rewrite history, or delete commits. Commit small and often with clear messages.
* One ticket per conversation. When the ticket is done, stop and report: files changed, how I run it, what I should check by hand, what you were unsure about.
* After you write or change code, explain it in plain words I can repeat in front of judges. I must be able to explain every line.
* If a request would break a rule in AGENTS.md (real personal data, scraping, testing a live government system, widening scope), refuse and tell me why.
* Slash workflows are in `.agent/workflows/` (`/ticket`, `/test-all`, `/explain-back`, `/rubric-check`, `/pre-submit`, `/bangla-review`).
