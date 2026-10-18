# Bhumi Lipi (ভূমি লিপি)
### A Tamper-Evident Trust Layer Linking Deed Registration to Mutation in Bangladesh
**LandTech Innovation Hackathon 2026 · Round 1 Concept Note · Track: Digital Land Records, Verification & Digitization**

| Parameter | Details |
| :--- | :--- |
| **Chosen Problem Statement** | **P2 — Deed & Ownership Verification (Primary)**.<br>Tightly integrated with **P3** (Fraud & Double-Selling Detection), **P4** (Smart e-Mutation & Registry Workflow), and **P5** (Citizen Pre-Purchase Verification) into a unified, end-to-end land transaction lifecycle. |
| **Idea in One Line** | Every land deed registration generates a cryptographically signed, immutable block in a per-plot chain; the plot is atomically locked against secondary sales until the AC Land office approves mutation; citizens and institutions can verify any deed copy in seconds without blind trust in intermediaries. |
| **Prototype Status** | Working prototype on 100% synthetic data. 65 automated backend tests + Playwright E2E browser tests passing, independent CLI verifier script, interactive attack lab, and localized AI Assistant. Unbuilt features are explicitly labeled as *Planned*. |

---

## 1. The Problem in Bangladesh: How Big, and Where It Breaks

Land disputes represent the single largest burden on the civil judicial system in Bangladesh. They drain household resources, block economic development, and trigger societal violence.

### Empirical Dimension of the Crisis
| Measure | Empirical Figure & Official Source |
| :--- | :--- |
| **Judicial Backlog** | **4,516,603 pending cases** as of 31 December 2024 (Supreme Court data) [1]. Land-related disputes account for an estimated **60% to 80%** of all civil litigation; the Land Secretary has publicly cited figures approaching 80% [1][2]. |
| **Households Impacted** | **1 in 7 households** was directly embroiled in a land dispute in a multi-district empirical study (1,050 households across 14 districts); resolved litigations took an average of **3 years**, while pending cases averaged **8+ years** [3]. |
| **Informal Payments & Bribery** | Transparency International Bangladesh (TIB) National Household Survey 2023: **51% of households** interacting with land services encountered corruption; **77.4% of citizens** seeking land mutation paid bribes. Average bribe: **Tk 12,719 for mutation** and **Tk 19,037 for deed registration**; Upazila Land Offices ranked worst in bribery rates [4]. TIB 2025: Average land bribe per household stands at **Tk 11,311** [5]. |
| **Operational Scale** | **497 Sub-Registry Offices** registered **36.72 lakh deeds** in FY2017–18 [6]; over **22 lakh mutation applications** are processed annually via the Ministry of Land e-Namjari portal [7]. This is the national throughput a viable solution must support. |

### Systemic Root Cause: The Institutional Disconnect
Under Bangladesh's administrative structure, a single land transaction involves two separate ministries and three disconnected offices:
1. **Registration Directorate (Ministry of Law, Justice and Parliamentary Affairs):** Sub-registrars record deeds of transfer and maintain manual volume books (*Balam* books) under the *Registration Act 1908*. They verify execution formalities, not underlying title.
2. **AC Land Office / Upazila Land Office (Ministry of Land):** Assistant Commissioners (Land) update the Record of Rights (*Khatian/Porcha*) and revenue rolls (*Jamabandi*) via mutation (*Namjari*) under the *State Acquisition and Tenancy Act 1950*.
3. **Directorate General of Land Records and Surveys (DGLRS):** Conducts periodic cadastral surveys spanning four historic generations: Cadastral Survey (CS), State Acquisition (SA), Revisional Survey (RS), and Bangladesh Survey (BS/City Survey).

Fraud lives in the institutional and informational lag between deed execution at the sub-registry and mutation approval at the AC Land office.

### Structural Failure Taxonomy in Current Practice [8]
* **Forged / Fabricated Deeds (*Bia Dalil*):** Fraudsters counterfeit historical chain deeds that never existed in the Sub-registry *Balam* book. Because paper seals and stamps are trivially forged, neither the buyer nor commercial banks can detect the fraud without weeks of manual record searches.
* **Double-Selling in the Mutation Lag:** After selling a plot at the sub-registry, an unscrupulous seller exploits the 30–60 day administrative window before the buyer's mutation is recorded. The seller's name remains on the official revenue roll, enabling them to sell the identical plot to a second or third unsuspecting buyer.
* **Predatory Mutation Delays:** Despite official Citizen Charters specifying 28 working days for e-Mutation [9], files languish invisibly in officer queues, creating systemic extortion points for brokers (*dalals*) [4].
* **Citizen Information Asymmetry:** Deciphering archaic Bangla cursive scripts, 16-anna fractional shares (*ana-gonda-kara-kranti*), and conflicting survey generations excludes ordinary citizens, seniors, and expatriates, forcing total reliance on middlemen.

---

## 2. What Already Exists, and the Gap Bhumi Lipi Fills

Bangladesh has made notable modernization strides. The Ministry of Land launched **e-Mutation** (*e-Namjari*), **e-Porcha**, the **Digital Record Room**, the **Land Management Automation Project (LMAP/DLMS)**, and the **Bangladesh Digital Survey (BDS)** [9][10][11]. In early 2026, the Land Secretary announced pilot initiatives for online seller biometric/mobile verification at the time of deed registration [12].

### The Unsolved Governance Gap
While these platforms digitize internal workflows, they remain centralized departmental databases with critical vulnerabilities:
1. **No External Cryptographic Verifiability:** A printed digital deed or PDF certificate cannot be independently proven authentic offline. An outsider cannot verify whether a deed is byte-for-byte identical to the official seal without querying internal government servers.
2. **No Atomic Inter-Agency Locking:** There is no shared transactional lock between the Sub-registry and the AC Land Office. A second sale cannot be programmatically blocked during a pending mutation.
3. **No Immutable, Tamper-Evident History:** Centralized databases remain vulnerable to unauthorized SQL updates, insider manipulation, or retrospective record doctoring.
4. **Disruptive Fork-Lift Upgrades:** Legacy government agencies resist monolithic system overhauls that require replacing active workflows.

**Bhumi Lipi is purpose-built as the missing trust layer.** Operating as an event-driven sidecar, it ingests a read-only stream from existing registration and mutation systems, cryptographically binds the records, and exposes public verification without disrupting daily operations.

---

## 3. The Proposed Solution: A Linked Cryptographic Lifecycle

Bhumi Lipi unifies the fragmented steps of land administration into a continuous, cryptographically anchored lifecycle:

```
[Citizen / Buyer Check] ──▶ [Sub-Registry Sale] ──▶ [Ed25519 Seal & Hash] ──▶ [Plot Locked]
                                                                                   │
[Public Proof Check]    ◀── [AC Land Approval]  ◀── [8 Automated Checks] ◀────────┘
```

### The Six Operational Phases
1. **Pre-Check (P5):** Prior to entering an agreement, the buyer enters a Plot ID or scans a QR code to view a clear Green / Amber / Red status, ownership chain, active mortgages/liens, and survey mismatch alerts.
2. **Register & Validate (P2/P3):** The Sub-registrar enters the deed details into the system. Bhumi Lipi automatically executes **11 explainable heuristic rules** (checking for seller mismatch, khas/government land flags, existing court injunctions, rapid successive transfers, and area discrepancies).
3. **Cryptographic Seal (P2):** If cleared, the record is hashed using **SHA-256**, linked to the plot's previous block hash, and digitally signed with the sub-registry's **Ed25519 asymmetric private key**. A high-density QR code embedding the cryptographic fingerprint is printed directly onto the physical deed.
4. **Atomic Concurrency Lock & Auto-Mutation (P3/P4):** The moment the deed is sealed, the plot is placed in an atomic `LOCKED` state. Any attempt to register a secondary sale on that plot is rejected by database-level triggers. Simultaneously, an e-Mutation ticket is automatically spawned with a unique tracking ID, running **8 automated validation checks**.
5. **Adjudication & Ownership Transition (P4):** The AC Land officer reviews the mutation petition from a prioritized queue. A **Waiting-Days SLA Chip** visually tracks processing latency (turning amber at 14 days, red at 30 days). Upon approval, the plot unlocks, and the new owner is registered as the definitive head of the plot chain. If rejected, a signed `REVERSAL` block is committed, restoring the previous state without purging audit history.
6. **Public Audit & Anchor (P2):** All sealed blocks across all plots are aggregated into a daily binary **Merkle tree**. The Merkle root is anchored in an immutable public registry. Anyone can independently verify a deed using an in-browser proof validator or an offline Python script without trusting the hosting server.

---

## 4. Addressing Registry Realities: Hardening Against Real-World Failure Modes

Rigorous research into Bangladesh's legal and administrative land ecosystem revealed critical failure modes that pure software cannot solve without institutional design:

| Identified Vulnerability | Architectural & Operational Remedy | Implementation Status |
| :--- | :--- | :--- |
| **"A Deed is Not a Title"**<br>In Bangladesh, registration certifies the execution of a document, not ownership. A genuine deed signed by an imposter conveys zero legal title. | Every verification report strictly bifurcates **Deed Integrity** (Genuine / Outdated / Forged) from **Record Agreement** (Does the seller match the latest mutated owner and survey record?). Green indicates *"Records agree and no blocks found"*, never *"Government guarantees title"*. | Dual-signal wording and mismatch flags **Built**; full two-part report *Planned*. |
| **"Garbage In, Garbage Out"**<br>A digital seal cannot prevent an impersonator using a forged Power of Attorney (*Am-Moktarnama*) from executing a deed. | Compute cryptographic hashes of NID/biometric tokens verified at the sub-registry. Mandatory two-officer maker-checker review for Power of Attorney transfers. Automated SMS alerts dispatched to the recorded owner upon transaction initiation with an objection window. | POA detection rule **Built**; owner SMS webhook and dual-signature workflow *Planned*. |
| **Insider Key Compromise**<br>Corrupt administrative officials possessing valid signing keys could retroactively rewrite chain history. | Daily public Merkle anchors make retroactive chain rewrites mathematically evident. Production architecture enforces hardware security keys (FIPS 140-2 Level 3 HSMs / YubiKeys), key revocation protocols, and threshold co-signing across three independent institutions. | Daily Merkle anchor and Attack Lab **Built**; hardware HSM tokens *Planned*. |
| **Mutation Delay & Rent-Seeking**<br>Digitization alone does not eliminate discretionary delays or demands for *speed money*. | Public SLA accountability: real-time aging chips, automatic hierarchical escalation to UNO, ADC (Revenue), and Deputy Commissioner (DC), backed by a public Upazila performance leaderboard. | Aging latency chip **Built**; automated administrative escalation ladder *Planned*. |
| **Legacy Paper Records**<br>Centuries of British and Pakistani-era volume books cannot be retrospectively validated by code. | Establish a clean, authenticated baseline: digitize *Balam* volumes and *Khatians* through human-in-the-loop Bangla OCR, sealed by an authorized gazetted officer. Post-baseline modifications become instantly detectable. | Synthetic baseline demo **Built**; production archival ingestion pipeline *Planned (Phase B)*. |
| **Parallel System Resistance**<br>Field offices will reject duplicate data entry across competing platforms. | Zero duplicate data entry: Day-1 deployment functions as a passive read-only adapter ingesting standard JSON feeds from e-Namjari and deed registration software, upgrading to bi-directional APIs. | Adapter schema **Built**; live departmental webhooks *Planned*. |
| **Digital Divide & Privacy**<br>Rural citizens lack smartphones; publishing private NIDs compromises citizen data. | Public checks display only information already accessible on public *Khatians* (Plot, Mouza, Holder Name, Share); NIDs and phone numbers are salted and masked. Offline QR verification supported at Union Digital Centers (UDCs). | Field masking and offline QR **Built**; USSD/SMS fallback *Planned*. |

---

## 5. System Architecture and Technical Stack

Bhumi Lipi is engineered for resilience, auditable security, and minimal infrastructure overhead:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                              │
│  Vanilla JavaScript (No Build Step) · Strict CSP · Zero XSS Framework  │
│  Bilingual (EN / BN) · Responsive Desktop & Mobile Touch UI            │
│  Simple Mode for Elders · Voice Read-Aloud · Ana-Gonda Calculator      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS / REST JSON
┌───────────────────────────────────▼────────────────────────────────────┐
│                   APPLICATION & API GATEWAY LAYER                      │
│  Python Standard Library HTTP Server · Rate Limiter (Token Bucket)     │
│  Path-Traversal Safe Static Server · Role Verification Guard           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                        CORE SERVICE DOMAIN                             │
│  Deed Registry Engine · 11 Explainable Fraud Rules (Risk 0–100)        │
│  e-Mutation State Machine (8 Auto-Checks) · Bank Lien Manager          │
│  Localized Bhumi Lipi AI Assistant (Grounded Land Law Retrieval)       │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
┌───────────────────▼──────────────┐   ┌─────────────▼───────────────────┐
│       CRYPTOGRAPHIC ENGINE       │   │       PERSISTENCE LAYER         │
│  SHA-256 Hash Chain              │   │  SQLite3 (Production: Postgres) │
│  Ed25519 Asymmetric Signatures   │   │  Append-Only DB Triggers        │
│  Binary Merkle Tree & Proofs     │   │  Chain-Guard Integrity Checks   │
│  Independent Offline Verifier    │   │  Comprehensive Audit Trails     │
└──────────────────────────────────┘   └─────────────────────────────────┘
```

### Technical Design Choices
* **Zero-Framework Frontend:** Written in pure, modern ECMAScript with zero npm build dependencies. Renders UI dynamically via strict `textContent` bindings to eliminate Cross-Site Scripting (XSS).
* **Defensive Backend:** Built using Python's standard library (`http.server`, `hashlib`, `sqlite3`). Eliminating bloated external web frameworks reduces the attack surface and allows every line of code to be inspected and audited.
* **Asymmetric Office Cryptography:** Employs the Edwards-curve Digital Signature Algorithm (**Ed25519** via `cryptography`), providing high computational performance, 128-bit security, and collision resistance.
* **Database-Enforced Immutability:** Append-only behavior is not merely assumed in application code; SQLite database triggers actively abort `UPDATE` and `DELETE` queries on sealed records, mutation logs, and anchors.
* **Grounded AI Land Assistant:** An intelligent domain assistant grounded in statutory Bangladeshi land laws (*State Acquisition and Tenancy Act 1950*, *Transfer of Property Act 1882*, *Registration Act 1908*), helping ordinary citizens decipher complex legal jargons and land terms without hallucinations.

### National Scale Verification
Bangladesh registers **36.72 lakh deeds annually** (~10,000 deeds per calendar day). Assuming an 8-hour operational window, this represents **~1 deed every 2.9 seconds** across the entire nation. Computing an Ed25519 signature and SHA-256 hash takes **<0.5 milliseconds** on a commodity CPU. Bhumi Lipi easily handles national transaction throughput on modest cloud or on-premise government servers.

---

## 6. Key Features and Problem Statement Alignment

| Problem Statement | Module / Feature | Technical Implementation |
| :--- | :--- | :--- |
| **P2 — Deed & Ownership Verification** | **Cryptographic Deed Sealing & QR Verification** | SHA-256 per-plot hash chaining; Ed25519 office signing; public QR verification returning tripartite verdicts: **Genuine**, **Outdated**, or **Forged**; character-level diff viewer. |
| **P2 — Deed & Ownership Verification** | **Independent Trust Verification** | Public daily Merkle root; cryptographic inclusion proof validator running client-side in the browser; standalone Python verifier script (`tools/verify_anchor.py`) executing without server connection. |
| **P3 — Fraud & Double-Selling Detection** | **Atomic Plot Locking** | Dynamic plot locking prevents any concurrent deed registration while a mutation is pending. Database triggers enforce a hard stop against double-selling. |
| **P3 — Fraud & Double-Selling Detection** | **11 Explainable Fraud Detection Rules** | Pure function rules generating an explainable Risk Score (0–100) with bilingual warnings: seller mismatch, khas/government land, single active mortgage/lien lock, rapid transfer alerts, and survey area discrepancies. |
| **P4 — Smart e-Mutation & Registry Workflow** | **Automated Registration-to-Mutation Link** | Auto-generation of e-Mutation petitions upon deed sealing; 8 automated eligibility checks; centralized AC Land decision queue; atomic ownership transfer upon approval; signed `REVERSAL` blocks upon rejection. |
| **P4 — Smart e-Mutation & Registry Workflow** | **SLA Latency Tracking** | Real-time waiting-days chip on mutation petitions (turning amber at 14 days, red at 30 days) to enforce transparency and expose administrative bottlenecks. |
| **P5 — Citizen Pre-Purchase Verification** | **Citizen Title Check & Simple Mode** | Comprehensive Green / Amber / Red pre-transaction reports; ownership lineage graph; downloadable PDF title certificates. High-contrast **Simple Mode for Seniors**: 3-word verdict badges, oversized text, Bangla text-to-speech audio read-aloud, and fractional *ana-gonda-kara-kranti* converter. |
| **P1 / P6 — Open Innovation** | **Bhumi Lipi AI Assistant & Attack Lab** | Grounded AI guidance for land terminology and document navigation; interactive Attack Lab simulating 5 live security attacks (including malicious key holders attempting history rewrites). |

---

## 7. Plan for Countrywide Implementation

Rolling out Bhumi Lipi nationwide requires a structured, multi-phase roadmap designed to minimize institutional friction:

| Stage | Geographic Scope | Technical & Administrative Deliverables | Formal Exit Criteria |
| :--- | :--- | :--- | :--- |
| **Phase 1: Pilot** *(Months 1–6)* | 1–2 Sub-Registries and AC Land Offices (e.g., Gazipur Sadar / Savar) | Deploy read-only event listener on existing registration software; issue hardware security tokens (FIPS YubiKeys) to sub-registrars; conduct officer training; establish baseline seal of one archival *Balam* room. | Zero cryptographic chain breaks; 100% of double-sale edge cases flagged; positive legal review by Law and Land Ministries. |
| **Phase 2: District Rollout** *(Months 7–15)* | All Sub-Registries and AC Land Offices across 1 District | Migration to high-availability PostgreSQL cluster; citizen SMS transaction alert gateway; public Upazila delay leaderboard; offline-verifiable QR integration at Union Digital Centers (UDCs). | Statistically measurable reduction in mutation turnaround latency; zero undetected forged deeds. |
| **Phase 3: Divisional Scale** *(Months 16–27)* | Multi-District Federation across 1 Administrative Division | Formal API integration with national identity databases (Election Commission NID server) and Ministry of Land e-Namjari; multi-party threshold anchor co-signing between DC Office, District Judge Court, and Public University. | Inter-agency data-sharing agreements enacted; cross-district land fraud attempts neutralized. |
| **Phase 4: Nationwide Integration** *(Months 28–42)* | All 497 Sub-Registries and 500+ AC Land Offices across Bangladesh | Nationwide public Merkle anchor published daily; open-source public verification portal; structured legacy archival digitization via Bangla OCR coupled with gazetted officer verification. | Countrywide elimination of deed double-selling; instant public verifiability for all newly registered land deeds. |

### Operational Budget and Institutional Requirements
* **Open-Source Software Core:** The core Bhumi Lipi engine is open-source (MIT License) with zero vendor lock-in or recurring per-transaction royalties.
* **Direct Cost Drivers:** Cloud hosting, PostgreSQL replication, hardware security keys (Ed25519 HSM tokens per office), high-resolution volume book scanners, and frontline administrative training.
* **Inter-Ministerial Governance:** Requires a formal Data-Sharing Agreement between the Ministry of Law and the Ministry of Land, along with legal gazette recognition of digital deed hashes under the *Information and Communication Technology (ICT) Act 2006*.

---

## 8. Data Privacy, Security Guardrails, and AI Tool Disclosure

### Compliance with Hackathon Data & Privacy Rules (Section 8)
* **100% Synthetic Data:** All demonstration records, plot numbers, khatians, and deed documents are synthetically generated. No real personal names, national identity numbers (NID), phone numbers, physical addresses, or live government land records are collected, utilized, or stored.
* **No Live Government Scraping:** No automated scrapers, web spiders, or bulk download scripts were executed against any government portal (e.g., `land.gov.bd` or `eporcha.gov.bd`).
* **Zero Penetration Testing on Public Infrastructure:** Security verification and attack resilience are strictly evaluated within the isolated local prototype environment via the self-contained Attack Lab.

### Disclosure of AI Tools Used (Section 9 Compliance)
In accordance with Section 9 of the LandTech 2026 Rule Book, the team fully discloses the use of advanced AI coding assistants during system design and development:

1. **Google Gemini (Gemini Antigravity / Gemini 2.5 & 3.8):**
   * **Role:** Autonomous agentic pair-programming, cryptographic state modeling (SHA-256 per-plot hash chains, Ed25519 keyring generation, binary Merkle tree proofs), responsive frontend engineering (vanilla JavaScript view routers, dynamic bottom sheets, touch targets, and accessibility high-contrast palettes), domain prompt engineering for the localized Bhumi Lipi AI Assistant, and automated regression test design.
2. **Anthropic Claude (Claude 3.7 Sonnet / Claude Code):**
   * **Role:** System architectural specification design (`docs/SPEC.md`), statutory legal analysis of Bangladesh land governance frameworks (comparing *State Acquisition and Tenancy Act 1950* with *Registration Act 1908*), comprehensive threat modeling against MITRE ATT&CK style tamper scenarios (`docs/THREAT_MODEL.md`), and unit test edge-case generation.
3. **Student Mastery & Explainability Guarantee:**
   * Both student team members actively directed, verified, debugged, and tested every component of the codebase. The students possess complete, end-to-end technical comprehension of all algorithms, cryptographic protocols, database triggers, and business logic, and are fully prepared to independently explain and defend any technical detail before the judging panel.

---

## 9. Team and Mentor Details

| Role | Name | DIU ID / Organization | Contact |
| :--- | :--- | :--- | :--- |
| **Student 1 (Team Leader)** | Mohammad Abrar Hasnat | DIU ID: 253-15-689 · Dept of CSE | abrarhasnat@diu.edu.bd |
| **Student 2** | Md.Yeasin Alam | DIU ID: 253-15-735 · Dept of CSE | yeasinalam@diu.edu.bd |
| **Faculty Mentor** | Md. Ashraful Islam Talukder | Lecturer · CSE, Daffodil International University | ashrafulislam.cse@diu.edu.bd · 01680161225 |
| **Industry Support Mentor** | Fayaz Rayat | CSE-TECH | fyazrayat@gmail.com |

* **Team Name:** Bhumi Lipi
* **Project Repository:** [GitHub / GitLab Link]
* **Live Demonstration URL:** [Live Deployment Link]

---

## References & Scholarly Sources
1. Supreme Court of Bangladesh, Judicial Statistics (Case backlog as of 31 Dec 2024); Dhaka Tribune, *"Whose land is it anyway?"* (Analysis of land dispute shares in civil courts).
2. Daily Star, Reports on Ministry of Land administrative reviews and scholarly estimates of land dispute shares (60%–80%).
3. Policy Research Institute of Bangladesh (PRI) & BRAC, *"One in 7 households facing land disputes"*, Empirical multi-district survey of 1,050 households (2014).
4. Transparency International Bangladesh (TIB), *National Household Survey: Corruption in Service Sectors 2023*, via The Financial Express.
5. Transparency International Bangladesh (TIB), *National Household Survey 2025 Executive Summary* (Average bribe per household in land services: Tk 11,311).
6. Daily Star, Investigation on Directorate of Registration and TIB Sub-Registrar report (36.72 lakh deeds registered in FY2017–18 across 497 sub-registries).
7. Ministry of Land, Government of Bangladesh, *e-Mutation (e-Namjari) Annual Application Statistics*, Land Service Gateway (over 22 lakh applications per year).
8. Supreme Court Law Reports & Practitioner Manuals on Bangladesh Land Laws (Transfer of Property Act 1882, Registration Act 1908, State Acquisition & Tenancy Act 1950).
9. United Nations Department of Economic and Social Affairs (UN DESA), *Public Service Innovation Case Study: Bangladesh e-Mutation System* (2020).
10. Ministry of Land, Government of Bangladesh, *Land Management Automation Project (LMAP/DLMS) Strategic Framework*.
11. The Business Standard, *Bangladesh Digital Survey (BDS) Cadastral Modernization Review* (2023).
12. Gonobarta, Official announcement by Land Secretary regarding 2026 digital registration reforms, mandatory buyer mobile authentication, and online seller verification.
