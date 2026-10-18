# ভূমি লিপি · Bhumi Lipi
**Land papers. Now with proof.** A tamper-evident land deed registry for Bangladesh: every deed gets a digital seal, the same land cannot be sold twice, and anyone can check a plot or a deed in 10 seconds.

LandTech Innovation Hackathon 2026 · Round 1 Concept Note · Track: Digital Land Records, Verification & Digitization
**Chosen problem statement:** **P2 - Deed & Ownership Verification (main)**. Supporting features from P3 (fraud and double-selling detection), P4 (smart e-mutation workflow), and P5 (citizen pre-purchase verification), built as one unified lifecycle.
**Prototype status:** Working prototype on 100% synthetic data. 65 automated backend tests + Playwright E2E browser tests, independent CLI verifier script, interactive attack lab, and localized AI Assistant.

> **Data & Privacy Statement:** All data is synthetic and created by the team. No real names, NID numbers, phone numbers, addresses or land records are used. Nothing is scraped from any government portal and no live government system is tested.

## The idea in one minute
Today registration (sub-registry) and mutation (AC Land) are separate paper steps in separate offices, and nobody can cheaply check a deed. Bhumi Lipi makes them **one sealed lifecycle**:

1. **Seal** – registering a deed creates a block: SHA-256 hash of all its fields, linked to the previous block of the plot, signed with the **office's own Ed25519 key**.
2. **Lock** – the plot locks automatically. A second sale is rejected until mutation is finished.
3. **Mutation** – e-mutation starts by itself, runs eight automatic checks, and an AC Land officer decides with one click. A rejected sale appends a `REVERSAL` block (history is never deleted).
4. **Check** – citizens, banks and courts see a Green / Amber / Red verdict in plain Bangla or English, scan the deed's QR, or drop the deed file to see if it was altered.
5. **Anchor** – a public Merkle root over all records means even an insider with a key cannot silently rewrite history. An independent script (`tools/verify_anchor.py`) re-checks everything without trusting our server.

## International practice at low cost
Public descriptions of land systems in Georgia (title fingerprints on a public ledger), Estonia (hash-tree integrity between registries), India (one ID per parcel) and Rwanda (systematic parcel registration) informed the design. Bhumi Lipi adapts the ideas without per-transaction chain fees: office signatures and a hash chain give the proof, and only a periodic Merkle root is published.


## Features (all working, all tested)
| Feature | Problem | Where |
|---|---|---|
| Signed hash-chain registry, append-only DB triggers, fork guard | P2 | `bhumi/chain.py`, `bhumi/db.py` |
| Verify by QR / seal code / deed file / "try to cheat" editor | P2 | `/#/verify` |
| 11 fraud rules with bilingual reasons and an explainable 0–100 risk score | P3 | `bhumi/rules.py` |
| Plot lock until mutation; fake-seller, double-sale, lien and government-land blocks | P3 | `bhumi/service.py` |
| e-Mutation state machine, 8 auto-checks, tracking ID, officer queue, reversal blocks | P4 | `bhumi/mutation.py`, `/#/mutation` |
| Citizen verdict (Green/Amber/Red), history, survey lineage, print to PDF | P5 | `/#/check` |
| Bank liens and double-mortgage block | P3 | `/#/bank` |
| Public Merkle anchor, inclusion proof checked **in your browser**, independent verifier script | P2 | `/#/integrity`, `tools/verify_anchor.py` |
| Attack lab: 5 attacks on a private copy of the DB | all | `/#/lab` |
| **Simple mode for every age**: three-word shape verdicts, big text, high contrast, read-aloud (when a Bangla voice exists), ana-gonda calculator | P5 | `web/js/views/check.js`, `web/js/a11y.js` |
| Mutation aging chip (waiting N days) | P4 | `bhumi/mutation.py` |
| Bangla / English, dark mode, mobile first, keyboard friendly | UX | `web/` |

## Run it (2 commands)
```bash
pip install -r requirements.txt     # only dependency: cryptography
python server.py                    # http://127.0.0.1:8000  (seeds demo data on first run)
```
Try the demo story: open **Check**, click the sample plots; switch role (top right) to **Sub-registrar**, press **Fake seller** then **Register and seal**; switch to **AC Land** and approve; open **Attack lab**.

For the file-drop demo: `python tools/make_demo_files.py` writes `demo_files/genuine_deed.txt` (GENUINE) and `tampered_deed.txt` (FORGED).

## Tests
```bash
python -m unittest discover -s tests -t . -v             # 69 backend unit tests: crypto, rules, lifecycle, aging, tamper detection, HTTP, verifier script, share maths, AI assistant
python -m unittest tests/test_mobile_responsive.py      # 4 mobile responsive tests: 360px, 390px, 412px viewports (overflow, tap targets, navigation)
pip install -r requirements-dev.txt && playwright install chromium
python server.py &  BASE=http://127.0.0.1:8000 python tests/e2e_playwright.py   # real-browser walkthrough across all 9 judge beats
```
The browser test also decodes the QR code shown on screen with OpenCV and checks that it opens the seal page.

## Deploy & Setup
* **Environment Configuration:** Copy `.env.example` to `.env` (`cp .env.example .env`) to customize ports or add `GEMINI_API_KEY`.
* **Render (free):** push to GitHub → New Blueprint → select the repo (`render.yaml` is included). The demo database rebuilds from seed data on every start.
* **Docker:** `docker build -t bhumi-lipi . && docker run -p 8000:8000 bhumi-lipi`
* **Environment Variables:** `BHUMI_MASTER_B64` (signing master secret), `BHUMI_DB` (database path), `PORT` (server port, default 8000), `HOST` (bind address, default 0.0.0.0), `GEMINI_API_KEY` (optional, enables AI Assistant), `BHUMI_STRICT=1` (production key-locking).

## Architecture
```
Browser (vanilla JS, no build step)  ──HTTPS JSON──▶  Python standard-library HTTP server
  Check · Verify · Registrar · Mutation · Bank              api.py   router, roles, rate limit, CSP
  Integrity · Lab · About                                   service.py  use cases
                                                            ├ chain.py     SHA-256, Ed25519 keyring, Merkle proofs
                                                            ├ rules.py     fraud rules, risk score
                                                            ├ mutation.py  state machine, auto-checks
                                                            └ db.py        SQLite + append-only triggers
```
Why the standard library and one dependency? A small, auditable attack surface that two students can fully explain. The service layer is framework-free, so moving to FastAPI + PostgreSQL later does not change the logic.

## API (all under `/api`)
`GET /plots`, `GET /plots/{id}`, `POST /risk`, `POST /deeds`, `GET /deeds/{hash}` and `/document`, `POST /verify`, `GET /mutations/queue`, `GET /mutations/{tracking}`, `POST /mutations/{tracking}/decision`, `GET|POST /liens`, `POST /liens/{id}/release`, `GET /integrity`, `GET /anchor`, `GET /anchor/proof/{hash}`, `GET /export`, `GET /keys`, `GET /alerts`, `POST /lab/run`, `GET /stats`, `GET /health`.
Demo roles via header `X-Demo-Role: citizen | registrar | ac_land | bank` (**not real authentication**: production would use national digital ID and hardware-held office keys).
Errors always carry `bn` and `en` messages.

## Security notes (see `docs/SPEC.md` and `docs/CONCEPT_NOTE.md`)
Strict Content-Security-Policy, input validation, 64 KB body limit, per-client rate limiting, path-traversal-safe static server, DB-level append-only rules, per-office signing keys, hashed IPs in the audit log, no secrets in the repo. **Honest limit:** a single-operator chain is tamper-*evident*, not tamper-proof. We detect rewrites with the public anchor and an independent verifier; production adds hardware keys and multi-office witness nodes.

## AI tools used (Section 9 of the LandTech 2026 Rule Book)
- **Google Gemini API:** powers the in-product Bangla AI Assistant that explains how to use the site. Verification results and plot status always come from the system, not from the model. Set `GEMINI_API_KEY` on the server to enable it.
- **Antigravity (Gemini):** AI coding assistant during development: hash chain and Ed25519 signing code, Merkle proofs, UI work (mobile navigation, CSS), and test design.
- **Claude:** AI assistant for the specification (`docs/SPEC.md`), threat model analysis, Bangladesh land-law background notes, and test edge cases.

Both student members reviewed the code and can explain the design and each component.

## Plan for countrywide implementation
| Stage | Scope | Main work |
| :--- | :--- | :--- |
| **1. Pilot** | One sub-registry office with its AC Land office | Hardware keys per office, officer training, parallel run beside the existing process, review by land-office staff and law experts. |
| **2. District** | All offices in one district | PostgreSQL, role-based real login, monitoring, offline-verifiable QR and a low-bandwidth/PWA mode for villages, SMS/USSD checks. |
| **3. Division** | Several districts | Integration with national ID and existing e-mutation and land portals through official agreements; witness co-signing of anchors by three offices. |
| **4. National** | All offices | Shared public anchor, independent verifier open to the public, scheduled digitization of old khatians and deeds with Bangla OCR plus human review. |

**Roadmap items designed but not yet built:** co-owner share ledger, inheritance (warish) mutation, survey lineage graph, offline map and boundary-overlap rule, offline-signed QR, Bangla OCR with human review, identity and power-of-attorney checks, land-tax check. Legal rules for shares, heirs and tax are demo rules and must be confirmed by a land-law expert before real use.

## Official Submission Documents
* **Concept Note (PDF):** [`docs/Bhumi_Lipi_Concept_Note.pdf`](docs/Bhumi_Lipi_Concept_Note.pdf) (LandTech 2026 Round 1 Official Concept Note, 4-page rulebook-compliant)
* **Concept Note (Markdown):** [`docs/CONCEPT_NOTE.md`](docs/CONCEPT_NOTE.md)
* **System Specification:** [`docs/SPEC.md`](docs/SPEC.md)
* **UI/UX Specification:** [`docs/UI_SPEC.md`](docs/UI_SPEC.md)
* **Submission Checklist:** [`docs/SUBMISSION_CHECKLIST.md`](docs/SUBMISSION_CHECKLIST.md)
* **QA & Verification Guide:** [`docs/QA.md`](docs/QA.md)

## Team and mentor details
* **Student 1 (Team Leader):** Mohammad Abrar Hasnat (DIU ID: 253-15-689, Department of Computer Science and Engineering)
* **Student 2:** Md. Yeasin Alam (DIU ID: 253-15-735, Department of Computer Science and Engineering)
* **Faculty Mentor:** Md. Ashraful Islam Talukder (Lecturer, Department of CSE, Daffodil International University)
* **Industry Support Mentor:** Fayaz Rayat (CSE-TECH)
* **Team name:** Bhumi Lipi
* **License:** MIT

