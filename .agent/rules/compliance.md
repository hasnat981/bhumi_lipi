---
trigger: always_on
---
# Always-on compliance rules (LandTech 2026)
* Synthetic data only. No real names, NID numbers, phone numbers, addresses or land records, in code, seed data, tests, screenshots or docs.
* No scraping, bulk download, or requests to any government or third-party system. No security testing outside this app.
* Do not commit secrets, keys, or `.env`. Keep `keys/` and `data/*.db` ignored.
* Keep real commit history. Never rewrite or delete it.
* Both students must be able to explain all code. Prefer simple, readable code. Add a docstring to every new module.
* Every user-facing message needs a Bangla (`bn`) and an English (`en`) version.
* User text is inserted into pages only with `textContent` (see `web/js/dom.js`). Never `innerHTML` with user data. Keep the CSP `script-src 'self'`.
* List every AI tool used in README under "AI tools used".
