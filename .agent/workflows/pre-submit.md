---
description: Final check before submitting Round 1 (nothing to edit, only verify and report)
---
1. Run the /test-all workflow.
2. Search the whole repo (code, seed data, docs, screenshots names) for anything that looks like real personal data: real person names, 10 or 17 digit NID-like numbers, Bangladeshi phone numbers (01xxxxxxxxx, +8801...), real addresses. Report each hit with file and line. Dummy names like "Dummy Owner A" are fine.
3. Check that `.gitignore` covers keys/, data/*.db, .env and that `git ls-files` contains none of them.
4. Check README has: live link, run steps, AI tools used (name every tool and model I used), team names, "Changes since Round 1".
5. Check docs/Bhumi_Lipi_Concept_Note.pdf is 4 pages or fewer and the team table has no "[fill in]" left.
6. Print a checklist with PASS / FAIL / NEEDS HUMAN for each item. Do not fix anything.
