# Bhumi Lipi: Final Blueprint (important Bangladesh problems, international tech, build plan, Antigravity prompts)
Written Wed 14 Oct 2026 · Round 1 is due **Fri 16 Oct** · Based on the LandTech 2026 Rule Book and the current working project (`bhumi-lipi.zip`).
International facts below come from public descriptions of these systems. **Verify each before you quote it in the concept note.** Numbers about cost savings are not given because nobody has measured them for this project.

---

## 0. Reality check first (read this, it protects your score)
1. **Two days are left.** The working project is the thing you submit. Do not rebuild or re-architect it before Friday. Rebuilding two days before a deadline is the fastest way to ship something broken.
2. **The rule book says "pick one problem and solve it well"** (the track page says it too, and Round 1 only needs "a focused, working prototype"). Judges score depth, a working demo, and whether both students can explain the code. Five half-built modules score lower than one deep one.
3. **"So good that it never needs to change"** is achievable in one specific way: design the *extension points* now (Section 4) so every later feature is **added**, never rewritten. That is what this blueprint does. It does not mean building everything in 48 hours.
4. **The Judging Rubric is still unknown.** Get it from the platform. If it rewards something this plan ignores, the rubric wins.
5. **Two jobs, two phases.** *Phase A (now to Fri 16 Oct):* polish and submit what works. *Phase B (only if you are selected; the Final Round date is "to be announced"):* add the extra Bangladesh problems below, one at a time, test first.

---

## 1. The other plan you pasted: what to keep and what to drop
**Keep (good ideas):**
* *Survey lineage with share arithmetic* (CS → SA → RS → BS, and "more than 100% of a plot sold" detection). Very Bangladesh-specific. Put in Phase B (F1, F3).
* *Plot lock until mutation* (we already built it).
* *Merkle root anchored periodically instead of paying per transaction* (we already built it, and it is the cost-efficient core).
* *Signed QR that still shows a mismatch when one character of a deed is changed* (we built the online version; the offline-signed version is F5).
* *Synthetic Bangla data generator* (rule-safe and useful for demos; F10).
* *Two-tier OCR: free open-source first, human or heavier model only for unclear parts* (right idea for P1; Phase B, F6).
**Drop or fix before you say it to judges:**
* **It picks P2/P3 and also builds P1 OCR, P4 sync, P5 map and PostGIS.** That breaks "pick one and go deep" and cannot be built well in two days.
* **"Two-Phase Commit (2PC) lock" is the wrong term.** 2PC is a distributed-transaction protocol. What we do is a *status lock until mutation is approved*. Using the wrong term invites a hard question you cannot answer.
* **"Cloud cost reduced 80 to 90%"** is an unmeasured claim. Do not write numbers you cannot prove. Say "open-source tools, no per-document fee" instead.
* **Next.js + FastAPI + PostgreSQL/PostGIS + Leaflet/OpenStreetMap + Tesseract + LLM API** is five new systems to deploy, secure and explain. Free hosting for PostGIS is limited, map tiles need internet, and Bangla handwriting OCR with Tesseract is weak. Keep the current stack; add these only in Phase B, one at a time.
* **Sending documents to an LLM API** must never include real records. With synthetic data it is allowed, but it adds keys, secrets and cost. Prefer local open-source first.

---

## 2. More Bangladesh problems we can solve inside the rule book
Ranked by (importance in Bangladesh) × (how well it fits our existing lifecycle). "Built" means it works in the zip today.
| # | Problem (Bangladesh context) | Rule book problem | Our solution | Status | Effort | When |
|---|---|---|---|---|---|---|
| 1 | **Forged or altered deeds** | P2 | Digital seal, signed hash chain, QR, file fingerprint check | Built | n/a | Now |
| 2 | **Same land sold twice** (before mutation finishes) | P3 | Plot lock until mutation is approved; chain guard in the database | Built | n/a | Now |
| 3 | **Registration and mutation are separate offices and papers; mutation delays and harassment** | P4 | Mutation starts automatically after registration, 8 automatic checks, tracking ID, public tracker, full timeline | Built | n/a | Now |
| 4 | **Mutation waiting with no accountability** | P4 | *Mutation aging:* show "waiting N days" on the tracker and queue, escalate old items | Small add-on | 3 h | A (if time) or B |
| 5 | **Buyers cannot check** (they depend on brokers, dalals) | P5 | "Check before you buy" in plain Bangla, QR, print report | Built | n/a | Now |
| 6 | **Low literacy and low digital skill; elders** | P5 | *Simple mode:* big text, voice read-aloud, picture verdicts, "stop / careful / go" words, print and share | New (front end only) | 6 h | **A** |
| 7 | **Double mortgage and fake collateral** | P3 | Liens; one active lien per plot; lien blocks sale | Built | n/a | Now |
| 8 | **Government land sold illegally** (khas, acquisition, vested/অর্পিত, waqf/debottor) | P3, P5 | Block sale; show reason. Khas and acquisition built; *vested and waqf flags* are a tiny add-on | Partly built | 2 h | B (or A) |
| 9 | **Court cases and stay orders hidden from buyers** | P5 | Court-case flag built; add *case number and stay order (নিষেধাজ্ঞা)* fields | Partly built | 2 h | B |
| 10 | **Area mismatch across CS/SA/RS/BS surveys** | P3 | Area-difference warning built; *survey lineage graph with shares* is the full version | Partly built | 8 h | B (F3) |
| 11 | **Several co-owners on one plot; someone sells more than their share** (শতাংশ, আনা-গন্ডা) | P3 | *Share ledger:* each holder has a share; selling more than your share is blocked; sale by one co-owner needs consent flags | Design only | 12 h | **B (F1)** |
| 12 | **Inheritance (ওয়ারিশ) and succession mutation** | P4 | Succession workflow: heirs list, shares by rule, officer approval, new share records | Design only | 12 h | B (F2) |
| 13 | **Fake identity or fake power of attorney at registration** | P3 | *Identity attestation step* (demo digital ID token) and *power-of-attorney flag* forcing officer review | Design only | 8 h | B (F7) |
| 14 | **Land development tax (ভূমি উন্নয়ন কর) arrears** blocking mutation | P4 | New automatic check "tax paid up to date" | Small add-on | 3 h | B (F8) |
| 15 | **Boundary overlap and encroachment (দখল)** | P3 | Plot polygons, overlap rule, simple SVG mouza map (no paid map service). PostGIS later | Design only | 14 h | B (F4) |
| 16 | **Old paper khatian and deeds** | P1 | Hybrid Bangla OCR: image clean-up, Tesseract, confidence routing to an officer | Design only | 16 h | B (F6) |
| 17 | **No internet in villages** | P2, P5 | Offline-verifiable signed QR (authenticity offline, freshness online), PWA shell, assisted use at union digital centers, SMS/USSD simulator | Design only | 10 h | B (F5, F9) |
| 18 | **Insider tampering and trust in the system** | P2 | Public anchor, independent verifier, attack lab (built). Phase B adds *witness co-signing* by several offices | Built + design | 8 h | B (F11) |
| 19 | **Courts and lawyers need evidence** | P2 | Printable title report with QR and proof path | Built (print) | n/a | Now |
**Where the rule book backs each choice:** P2 verification (#1, #17, #18, #19), P3 fraud and double-selling (#2, #7, #8, #10 to #13, #15), P4 registration-to-mutation (#3, #4, #12, #14), P5 citizen check (#5, #6, #9), P1 digitization (#16). Your concept note stays **P2 as the main problem**; the rest are shown as "what the same sealed lifecycle also solves".

---

## 3. International land-technology ideas, adapted for Bangladesh and low cost
| Country / system | Idea | Problem for Bangladesh | What we do (cost-efficient) |
|---|---|---|---|
| **Georgia** (national registry, blockchain timestamping) | Fix a fingerprint of titles on a public chain | Public chain fees, complexity | Hash chain + office signatures; only a periodic **Merkle root** needs to be published (website, newspaper, several offices). No per-transaction fee |
| **Estonia** (X-Road data exchange, hash-tree data-integrity anchoring) | Offices exchange data through one secure layer; integrity proofs without trusting an admin | Needs national digital ID and big integration | Registry and AC Land in **one lifecycle** and one API layer; role-based; demo ID tokens now, national ID later |
| **India** (ULPIN plot ID, drone surveys under SVAMITVA) | One unique ID per parcel; map-based titles | Parcels here have many co-owners and old khatians | **One plot ID** that deeds, survey records and shares attach to; mouza SVG map now, GIS later |
| **Rwanda** (systematic land registration with aerial imagery) | Register every parcel once, nationwide | Overlaps found late | Overlap and area-mismatch rules at registration time |
| **Sweden / UK** (blockchain and "digital street" pilots) | Smart, faster transfers | Registration and mutation are separate offices | Auto-start mutation and lock the plot between the two steps |
| **Zambia and others** (mobile-first, community mapping) | Mobile access in low-trust, low-connectivity places | Smartphones and data are uneven | **Simple mode**, voice, print, assisted use at union digital centers, SMS/USSD check |
| **Global document AI** (cloud OCR) | Digitize old records | Per-page fees at national scale | **Open-source first** (OpenCV + Tesseract Bangla), human review only for unclear fields |
**Cost drivers (be honest in the concept note):** hosting, database, key management (hardware keys per office), training, and the effort to digitize old records. **What costs almost nothing:** per-transaction fees (none), licences (open-source), publishing the anchor.

---

## 4. Build it once: the architecture that does not need rewriting
Everything in Section 2 plugs into these extension points. This is why later work is additive.
1. **Block format is frozen** (SPEC section 1). New facts go in the deed *document text* (its fingerprint `doc_hash` is already inside the signed block) or in side tables. Never change the canonical fields. Add a `format` number in the export so future changes are versioned.
2. **Database changes are additive only.** New columns with defaults, new tables. No renames, no drops. A tiny `schema_version` row in `meta` and numbered migration functions (`migrate_2`, `migrate_3`).
3. **Rules are a registry.** Each rule is `(code, level, weight, bn, en, check(ctx))` in a list. Adding a rule = adding one entry plus one test. The risk score, alerts, mutation checks and UI reasons all read the same registry.
4. **Mutation checks come from the same registry** (a rule can also be a check). New checks appear in the officer checklist automatically.
5. **API is additive.** New endpoints and new optional fields only. Keep `/api` as is; new work lives under the same prefix with new paths. Errors always `{error:{code,bn,en}}`.
6. **Front end:** design tokens, an i18n catalog (`i18n/bn.json`, `en.json`), a component folder, lazy-loaded pages. A new page is a new file plus one route line.
7. **Anchors and verifier stay independent** (`tools/verify_anchor.py` never imports the app). New data in the export is *ignored* by old verifiers and *checked* by new ones.
8. **Feature flags** (env `BHUMI_FEATURES=shares,heirs,map`) so unfinished Phase B features can ship disabled and never break the demo.
9. **Tests are the contract.** Every feature adds unit tests, API tests and one line in the browser story. A feature is "done" only when all earlier tests still pass.
**Data model v2 (additive; used by Phase B):**
* `plots`: add `vested`, `waqf`, `tax_paid_until`, `polygon` (JSON list of [x,y]), `case_no`, `stay_order`.
* `holders(plot_id, holder, share_num, share_den, since_seq)` for co-ownership; `heirs(mutation_id, holder, share_num, share_den)`.
* `survey_links(plot_id, from_survey, to_survey, holder_from, holder_to, share_num, share_den)` for the lineage graph.
* `identity_attestations(deed_hash, token_hash, method, ts)` (demo tokens only); `docs_ocr(id, plot_id, fields_json, confidence_json, status)`.
* `witness_signatures(anchor_id, office_id, sig)` for multi-office anchor co-signing.

---

## 5. Experience for every age and skill level
**Three modes, one app:**
* **Simple mode (default for citizens).** One question per screen: "Which plot?" → "Here is the answer." Giant buttons, icons plus Bangla words, no technical terms. The verdict uses three words and shapes: **থামুন** (stop, red octagon), **সাবধান** (careful, amber triangle), **এগোন** (go ahead, green shield). A **"শুনুন" (listen) button** reads the result aloud in Bangla.
* **Standard mode.** The full report with proof and history (current UI).
* **Officer mode.** Registrar, AC Land and bank tools (current UI).
**Simple mode specification**
1. Text size control **A− A A+** (100%, 125%, 150%), saved locally. Contrast toggle (high-contrast theme).
2. **Read aloud:** use the browser `speechSynthesis` with a Bangla voice (`bn-BD` or `bn-IN`) when available. If no Bangla voice exists on the device, hide the button and show nothing misleading. Never auto-play sound.
3. **Plain-sentence results,** at most three lines: "এই জমির কাগজ আসল। মালিক: <নাম>। এখন কেনা যায়।" with the matching shape and color.
4. **Print and share:** a one-page print, a Web Share button (WhatsApp, SMS) on phones, and a copy-link button.
5. **Assisted use:** a "দেখাচ্ছি সাহায্যকারী" (helper) view with extra-large type for union digital center operators who help someone else.
6. **Language and numbers:** Bangla digits in Bangla mode; dates written out ("১২ অক্টোবর ২০২৬").
7. **Pictures over paragraphs:** every step has an icon; the "how it works" story is animated and can be replayed.
**Animation rules (purposeful, never decorative):** stamp (the seal is applied), chain (a new deed links to the last), lock (land locks after a sale), scan (QR is read), reveal (verdict appears). Total reveal under 1.4 s, skippable, reduced-motion safe. Low-end phones: only `transform` and `opacity`, no heavy filters.
**Channels (design now, build in Phase B):** web, print, QR, **SMS/USSD simulator** page ("*123# → plot number → answer"), assisted use at union digital centers. A real SMS or USSD gateway is a later integration, not a Round 1 feature.

---

## 6. Plan
### Phase A: now to Friday (submit what works)
| When | Work (one ticket at a time, tests after each) | Hours |
|---|---|---|
| Wed 14 Oct, today | Tag the freeze: `git tag round1-freeze`. Tickets from `docs/WEBSITE_PLAN.md` section 17: (1) Seal + verdict reveal, (2) chain crack + count-up + "All records intact" pill, (3) diff viewer + hash avalanche | 9 |
| Wed night | **Simple mode** (A1 below): text size, high contrast, read aloud, three-word verdicts. Feature freeze at midnight | 5 |
| Thu 15 Oct | No new features. Deploy (Render), phone test on mobile data, fill concept note names, README, 3-minute video (`docs/DEMO_SCRIPT.md`), `/rubric-check`, `/pre-submit`, rehearse `docs/QA.md` | 8 |
| Fri 16 Oct | Submit before noon. Screenshot the confirmation | 1 |
**If you are behind on Wednesday night, drop tickets (2) and (3) and keep Simple mode.** For Bangladesh judges and for "easy for every age", Simple mode and the Seal reveal give the most.
**Not in Phase A:** shares, heirs, maps, OCR, offline QR, identity, SMS, Postgres. Mention them as the roadmap with the design in this document.

### Phase B: after selection (Final Round date to be announced)
Order by importance to Bangladesh and by effort. Each is one ticket with tests, behind a feature flag. Stop adding features at least two days before the Final Round and spend that time rehearsing.
| Week slot | Features |
|---|---|
| B1 | **B0 extension points**, F1 Share ledger, F8 land-tax check, F9a mutation aging, F2a vested/waqf flags |
| B2 | F3 Survey lineage graph, F2 Succession mutation |
| B3 | F4 Mouza SVG map + overlap rule, F5 Offline-signed QR + PWA |
| B4 | F6 Hybrid Bangla OCR (P1), F7 Identity + power-of-attorney, F11 Witness co-sign, F9 SMS/USSD simulator, F10 Data generator, Postgres adapter |
Final Round deliverables (from the rule book): updated repository with README "Changes since Round 1", a **10-slide pitch deck PDF**, and a **5-minute pitch + live demo, 3 minutes of questions, both students only**.

---

## 7. Antigravity prompts
**How to use:** open the project folder in Antigravity (it reads `AGENTS.md`, `GEMINI.md`, `.agent/rules`). Use **Planning mode**, approve the plan, run **one prompt per conversation**, then check, then commit. After each: `/test-all`. Never edit tests to make them pass. Before anything, run in a terminal: `git tag round1-freeze` (so you can always go back with `git checkout round1-freeze`).

### Phase A prompts
**A0: Safety net**
```
Read AGENTS.md and docs/SPEC.md. Do not change any code. Run the unit tests and the browser test and tell me the exact results. Then create a git tag named round1-freeze on the current commit. Report the tag and the test summary.
```
**A1: Simple mode for all ages (front end only)**
```
Read AGENTS.md, docs/UI_SPEC.md and docs/WEBSITE_PLAN.md (sections 3, 4 and 5.3). Add "Simple mode" to the web app, front end only (no changes under bhumi/). Requirements:
1) A header control with three text sizes (100%, 125%, 150%) and a high-contrast toggle, saved in localStorage (inside try/catch), applied to the whole app with CSS variables.
2) On the Check report and the Verify result add a "শুনুন / Listen" button that reads a short Bangla summary aloud using window.speechSynthesis with a Bangla voice (bn-BD or bn-IN). If no Bangla voice exists, do not show the button. Never autoplay. Stop speaking when the user leaves the page.
3) A three-word verdict next to the existing banner: green "এগোন / Go ahead" with the shield icon, amber "সাবধান / Careful" with the triangle, red "থামুন / Stop" with the octagon. Color is always paired with the shape and the word.
4) On the Check page, a "Simple view" toggle that shows only: the three-word verdict, the owner name, up to three short reasons, and two big buttons (Listen, Print). Default to Simple view for the Citizen role.
5) A Web Share button (navigator.share) on phones, hidden when unsupported.
Rules: all text in Bangla and English; text inserted only with textContent; respect prefers-reduced-motion; keep the existing tests passing; do NOT rename existing ids, classes or button labels used by tests/e2e_playwright.py. Add browser-test steps for the new controls without removing any existing step. Show me a plan first and wait for approval. After coding, run all tests and report.
```
**A2 (optional): Mutation aging badge**
```
Read docs/SPEC.md section 6. Add a read-only "waiting N days" value to GET /api/mutations/{tracking} and to the queue items (computed from created_ts and now; no schema change). Show it as a chip on the tracker detail page and in the officer queue (amber after 14 days, red after 30 days; make the thresholds constants). Add unit tests and one browser-test line. Update docs/SPEC.md. Do not change any existing field.
```

### Phase B prompts (each: one conversation, tests first, behind a feature flag)
Common header for every Phase B prompt:
```
Read AGENTS.md, docs/SPEC.md, docs/UI_SPEC.md and docs/V2_FINAL_BLUEPRINT.md section 4 (extension points). Rules: additive only (new columns with defaults, new tables, new optional API fields); never change the block canonical fields; every new rule goes in the rules registry with bn and en messages; all earlier tests must keep passing; new behaviour is behind the feature flag named below (env BHUMI_FEATURES). Write the tests first and show them failing, then implement. Update docs/SPEC.md. Show a plan first and wait for approval.
```
**B0 Extension points first (do this before F1; no behaviour change)**
```
<common header>
Do a refactor with ZERO behaviour change. (1) In bhumi/rules.py turn the if-chain in evaluate() into a registry: a list of rule objects (code, level, weight, bn, en, check(ctx) -> bool or extra dict), evaluated in the same order, producing exactly the same flags, so every existing test passes unchanged. (2) Add bhumi/features.py with is_enabled(name) reading env BHUMI_FEATURES (comma separated, default empty) and use it so a rule or UI section can be registered only when its flag is on. (3) Add a schema_version row in the meta table and a migrate() function that runs numbered, additive migrations at startup (migrate_1 is the current schema). (4) Add "format": 1 handling in the export (already present) and make tools/verify_anchor.py ignore unknown extra fields. Do not touch the block canonical fields. Run all tests; they must pass without any edit.
```
**F1 Share ledger (co-ownership; flag `shares`)**
```
<common header>
Problem: many plots have several co-owners (shares in শতাংশ or fractions). Someone may sell more than their share. Build: a `holders` table (plot_id, holder, share_num, share_den, since_seq). The sale request gets an optional `area_decimal` (default: the whole plot). Include the area sold in the deed document text (so it is covered by doc_hash). New rules: SHARE_EXCEEDED (block) when area sold is more than the seller's share of the plot area; CO_OWNERS_CONSENT (warn, weight 50) when a plot has other holders and the sale is not by all of them. After a partial sale the seller's share shrinks and the buyer becomes a holder; mutation approves both. Update seed with one co-owned plot and one oversell attempt. UI: on the report show a share bar per holder; on the registrar page an "area to sell" field with a live check. Tests: sums of shares never exceed 1, oversell is blocked, partial sale updates shares, chains still verify.
```
**F2 Succession mutation (flag `heirs`)**
```
<common header>
Problem: inheritance (ওয়ারিশ). Build a mutation type SUCCESSION: an officer enters the deceased holder and a list of heirs with shares (fractions that sum to 1). New block kind SUCCESSION (frm = deceased, to = a label such as "Heirs of <name>", price 0) sealed in the plot chain; the `holders` table gets one row per heir. Rules: HEIRS_SUM_INVALID (block) when shares do not sum to 1. UI: a succession form for the AC Land role, a family-tree style list on the report. Add tests including that sale by an heir is checked against their share.
```
**F3 Survey lineage graph with shares (flag `lineage`)**
```
<common header>
Problem: CS, SA, RS and BS records disagree. Build `survey_links` and a function that walks CS to SA to RS to BS for a plot and checks: (1) areas match within 5%, (2) for each survey, the sum of holder shares is 1 and no holder has more than they inherited from the previous survey, (3) a holder in a later survey has a documented link to a holder in the earlier one. New rule SURVEY_SHARE_BREAK (warn, weight 45). UI: a four-column lineage view with lines between holders; broken links drawn red. Seed one plot with a broken link. Tests for each check.
```
**F4 Mouza map and overlap rule (flag `map`)**
```
<common header>
Problem: boundary overlap and encroachment. Add a `polygon` column (JSON list of [x,y], synthetic coordinates, no real geography). Implement pure-Python polygon overlap detection (segment intersection plus point-in-polygon; no external geometry library). New rule BOUNDARY_OVERLAP (warn, weight 45) when a plot's polygon overlaps a neighbour. UI: an offline SVG "mouza map" page that draws all plots in a mouza, colored by verdict, with the selected plot highlighted and overlapping areas hatched. No paid map service and no external tiles. Seed six plots in one mouza with one overlapping pair. Tests: no overlap for touching edges, overlap detected for crossing and for contained polygons, concave polygon case.
```
**F5 Offline-signed QR + PWA (flag `offline`)**
```
<common header>
Problem: no internet in many places. Extend the QR payload to `<origin>/#/v/<hash>?s=<base64url signature>&o=<office id>`. Add a Verify mode "Offline check": using Web Crypto Ed25519 and public keys fetched once and cached (from /api/keys), verify that the signature on the hash is valid for that office. Make clear in the UI: offline proves the seal is authentic, only online proves it is the latest record. Add a manifest and a service worker that caches the app shell and the public keys, network-first for /api, and never shows a cached verdict as current. Update CSP (worker-src 'self'). Test that a tampered signature fails and that the shell loads offline.
```
**F6 Hybrid Bangla OCR (P1; flag `ocr`)**
```
<common header>
Problem: old paper khatian and deeds. Add an optional module tools/ocr (separate requirements file) that: cleans a scanned image with OpenCV (grayscale, denoise, deskew, threshold), runs Tesseract with the Bangla language pack, extracts fields (mouza, khatian number, dag number, area, holder name) with regular expressions, and gives each field a confidence. Fields below a threshold are marked "needs human review" and sent to an officer review screen. Only synthetic, generated test images (tools/make_test_scans.py renders dummy Bangla text with PIL). Store results in `docs_ocr`. Show honest accuracy numbers measured on those synthetic images in the README. If Tesseract is not installed, the module must fail with a clear message and the rest of the app must keep working.
```
**F7 Identity attestation and power of attorney (flag `identity`)**
```
<common header>
Problem: fake identity and fake power of attorney. Add a step in registration: seller and buyer present a demo identity token (a random string issued by a local "demo identity service"; never real NID data). Store only a hash of the token in `identity_attestations`. If the sale is made by an attorney (checkbox), add the rule POA_SALE (warn, weight 40) which forces officer review and shows the attorney's token hash. Write clearly in the UI and README that this is a demo of where a national digital ID check would plug in. Tests: missing token blocks with IDENTITY_REQUIRED when the flag is on; POA forces FLAGGED.
```
**F8 Land tax check and vested/waqf flags (flag `tax`)**
```
<common header>
Add columns `tax_paid_until` (year), `vested`, `waqf` to plots with defaults. Rules: VESTED_OR_WAQF (block, weight 100), TAX_DUE (warn, weight 35) when tax_paid_until is before the current year. Add TAX as a ninth automatic mutation check. Update every place that says "8 checks" (UI strings, docs, tests). Seed one plot of each kind. UI: chips on the report, and a line in the mutation checklist.
```
**F9 SMS/USSD simulator (flag `sms`)**
```
<common header>
Build a simulator page /sms that looks like a basic phone: the user types a plot number and gets a reply of at most 160 characters in Bangla (verdict word, owner, one reason). Backend: GET /api/sms?plot=<id> returns the text. Keep it clearly labeled as a simulation of a future SMS/USSD gateway. Tests for message length and for unknown plots.
```
**F10 Synthetic Bangla data generator**
```
<common header>
Write tools/gen_synthetic_data.py: with a seed number, it generates N dummy plots with obviously fake owner names (for example "ডামি মালিক ১২"), fake plot codes in the AAA-AAA-0000 format, survey records, a few liens, flags, and sale histories, and loads them through the Service so all chains are properly signed. Same seed gives the same data. Add a test that generated data has no value that looks like a real NID (10, 13 or 17 digits) or a Bangladeshi phone number.
```
**F11 Witness co-signing of the anchor (flag `witness`)**
```
<common header>
Add `witness_signatures`. Define three witness offices (SR-DHK, SR-CTG, AC-DHK) whose keys co-sign each new anchor snapshot. The Integrity page shows "Anchor signed by 3 of 3 offices". The independent verifier checks all witness signatures. Test: removing one witness signature or altering one makes the verifier fail; a history rewrite by one key-holder is caught even if they also re-sign the anchor with their own key.
```
**F12 PostgreSQL adapter (optional)**
```
<common header>
Keep SQLite as the default. Add an optional PostgreSQL backend chosen by DATABASE_URL behind the same Service methods, with the same append-only and chain-guard rules implemented as triggers. No change to any API or test expectation. Provide docker-compose.yml for local use and explain it in the README.
```

### Review prompts (use after every ticket)
```
Review the last commit like a strict teacher. List: things I cannot explain easily, rule risks (real data, innerHTML, secrets, scraping), missing tests, edge cases, and anything that changes the sealed block format. Do not edit files.
```
```
Quiz me on <file or feature>. Ask 5 questions one at a time like a hackathon judge. Wait for my answers and correct me.
```

---

## 8. How to describe this honestly in the concept note and pitch
* **Main problem:** P2 Deed and Ownership Verification. State it first.
* **Say:** "The same sealed, locked lifecycle also stops double-selling (P3), starts mutation automatically (P4) and lets citizens check before buying (P5)." Show only what works.
* **Phase B items go on one roadmap slide** with the design, not as claims. Label each "designed, not yet built".
* **Never say:** "tamper-proof", "blockchain-level security guaranteed", "80 to 90% cheaper", "national scale tested". Say: "tamper-evident", "detected by anchor and independent verifier", "no per-transaction fee", "prototype on synthetic data".
* **International lines you can use after verifying:** "Georgia timestamps titles on a public chain; we anchor a Merkle root instead." "Estonia connects offices through one secure layer; we connect registration and mutation in one lifecycle." "India uses one parcel ID; we attach deeds, surveys and shares to one plot ID."
* **Q&A line for "why not everything?":** "The rule book asks for one problem done well. We chose verification and made it deep, and designed the extension points so shares, heirs and maps can be added without rewriting."

## 9. Acceptance checklist
Phase A
- [ ] `git tag round1-freeze` exists; all 51 tests and the browser story pass after every ticket
- [ ] Simple mode works with Bangla, large text, high contrast, read aloud (or hidden if no voice)
- [ ] Verdict reveal and Seal look good on a real phone; reduced-motion shows no movement
- [ ] Live link works on mobile data; concept note names filled; README lists every AI tool with its use
- [ ] Video under 3 minutes; submitted before Friday noon
Phase B (per feature)
- [ ] Tests written first; flag off = nothing changes; flag on = feature works
- [ ] No change to canonical block fields; migrations additive
- [ ] SPEC updated; the Q&A answer for the feature written; both students can explain it
