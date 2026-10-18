# ভূমি লিপি · Bhumi Lipi: Complete Website Plan (premium edition)
Version 1.0 · 11 Oct 2026 · LandTech Innovation Hackathon 2026 · Problem P2 (with P3, P4, P5)

How to read this plan
* **[BUILT]** = already works in `bhumi-lipi.zip`. **[UPGRADE]** = premium work to add on top. **[API+]** = needs a small backend addition.
* Everything is plain HTML, CSS and JavaScript (no framework, no build step). Every upgrade below is possible with SVG, CSS and the Web APIs.
* Rules never change: synthetic data only, text inserted with `textContent`, strict CSP, Bangla and English for every message.
* Section 17 tells you what to build first, because time to the Round 1 deadline (16 Oct) is short. It has a compressed version for the last two days.

---

## 0. Purpose, audience, brand

### 0.1 One sentence
A website where anyone can check a land plot or a deed in 10 seconds and see, in plain Bangla, whether it is genuine, who owns it, and whether it can be sold, while officers use the same sealed records to register, mutate and audit.

### 0.2 Who uses it (personas and what each must feel)
| Persona | Device | Goal | Must feel |
|---|---|---|---|
| **Rahim, buyer** (first-time land buyer, 35, Android phone, mobile data, Bangla only) | Low-end Android, Chrome | "Is this plot safe to buy?" | Safe, understood, not tricked |
| **Nasrin, sub-registrar** | Office desktop, Chrome | Register deeds fast, avoid mistakes | Fast, in control, protected from fraud |
| **Karim, AC Land officer** | Desktop | Decide mutations with confidence | Clear checklist, one-click decision with a trail |
| **Banker** | Desktop | Verify collateral, avoid double mortgage | Certainty, audit trail |
| **Lawyer / court clerk** | Laptop | Ownership history with independent proof | Evidence they can verify without trusting us |
| **Hackathon judge** | Laptop or projector | Understand the idea and see it work in 3 minutes | Impressed, convinced it is real and honest |

### 0.3 Brand
* Name: ভূমি লিপি (Bhumi Lipi), meaning "land script / land record". Logo: Bangladesh map + parcel + check mark, green and gold on cream.
* Tagline: **জমির কাগজ, প্রমাণসহ।** / **Land papers, with proof.**
* Personality: trustworthy like a notary, clear like a good teacher, modern like a fintech app. Never scary, never legalistic, never playful about fraud.
* Voice: short sentences (under 15 words), everyday Bangla, active voice, say what happened and what to do next. Technical words only inside "details" panels.
* Visual idea ("the Seal"): a circular guilloche seal that stamps a record as verified. It is the one signature motif repeated on verdicts, QR cards, print reports and the loading state.

### 0.4 Design principles
1. **Truth first.** Verdicts are never decorative. Color is always paired with an icon shape and words.
2. **One job per screen.** The main action is the biggest thing on the page.
3. **Show the proof, not just the answer.** Every verdict has a "How do we know?" expander (seal, chain, signature).
4. **Honest limits are a feature.** We state what the system cannot do, in the product, not only in docs.
5. **Calm motion.** Animation explains cause and effect (stamp, link, lock). It is never decoration and always skippable.
6. **Fast on slow phones.** Total first load under 150 KB (without fonts), no layout shift.

---

## 1. Sitemap and user journeys

### 1.1 Sitemap
```
/                      Home (landing + live proof)
/check                 Plot finder (search + all demo plots)
/check/:plot           Plot report (verdict, history, survey, status)   [print = "title report"]
/verify                Verify a deed (code/link, scan, file, try-to-cheat)
/v/:hash               Seal result page (target of every QR code)
/registrar             Sub-registrar desk (register a sale)             role: registrar
/mutation              Tracker search + officer queue
/mutation/:tracking    Application detail, timeline, checks, decision
/bank                  Bank desk (liens)                                role: bank
/integrity             Trust page (chains, anchor, proof, keys, verifier)
/lab                   Attack lab (5 attacks)
/about                 Idea, 5-country comparison, honest limits, tech, AI disclosure
/tour                  Guided demo (judge mode) [UPGRADE]
/404                   Not found [UPGRADE]
```
Server pages: `/api/*` (JSON), `/tools/verify_anchor.py` (independent verifier).

### 1.2 Journeys (each is a test and a demo scene)
**J1 Buyer checks a plot (60 s).** Home → types plot number (or taps a sample) → report loads → seal stamps → verdict (Green / Amber / Red) with reasons and advice → taps "Verify seal" on the last record → sees GENUINE → shares link or prints PDF.
**J2 Buyer scans a deed QR (20 s).** Verify → Scan QR → camera frame locks onto the code → result page `/v/:hash` → GENUINE / OUTDATED / FORGED → "See the plot".
**J3 Someone suspects a forged copy (30 s).** Verify → File → drops the deed file → fingerprint computed on the device → FORGED, with plain explanation and what to do.
**J4 Registrar registers a sale (90 s).** Role Sub-registrar → Registrar desk → picks plot → seller auto-filled → buyer, price → live risk preview → Register and seal → seal, QR, tracking ID → print seal.
**J5 Fraud attempt is stopped (30 s).** Same desk → seller edited to a stranger (or plot is locked) → red "Sale blocked" with reasons → alert appears in the alerts list.
**J6 AC Land decides (60 s).** Role AC Land → Mutation queue → opens application → reads 8 checks → writes a note if flagged → Approve (land unlocks) or Reject (sale reversed with a REVERSAL block).
**J7 Banker takes collateral (45 s).** Role Bank → picks plot → place lien → second lien on the same plot is blocked as double mortgage → release.
**J8 Auditor proves nothing was rewritten (60 s).** Integrity → sees "All records intact" → Prove a record is in the anchor (checked in the browser) → downloads export and runs `verify_anchor.py` offline.
**J9 Judge watches the story (3 min).** Tour (or video script) → every journey above in order → Attack lab → About.

---

## 2. Information architecture and navigation

### 2.1 Desktop (≥ 1024 px)
* Slim gold **demo bar** (always on): "Demo: all data is synthetic. No real names, NID numbers or land records." (bn + en).
* Sticky **glass header** (blur 14 px, 82% background, 1 px bottom line): logo + wordmark (left); 8 nav links (center); **Role** switch, **Language** (বাং / EN), **Theme** (light / dark / auto), **Command palette** button "Search ⌘K" (right).
* Active link: filled brand pill. Hover: surface-2 pill. Focus: 3 px focus ring.
* Footer: 4 columns (Product, Trust, Project, Language and role help), AI disclosure, verifier link, version and build time.

### 2.2 Mobile (< 768 px) [UPGRADE]
* Top bar: logo, language, theme (compact). The demo bar collapses to a one-line marquee-free sentence.
* **Bottom tab bar** (fixed, safe-area aware): `Check` · `Track` · **`Scan` (raised center button)** · `Trust` · `More`. "More" opens a bottom sheet with Registrar, Bank, Lab, About, Role, Tour.
* Tap targets at least 44 × 44 px. Bar hides on scroll down, returns on scroll up. Keyboard open hides it.

### 2.3 Command palette [UPGRADE] (`Ctrl/⌘ + K` or `/`)
Modal with one input and grouped results: **Plots** (typed plot numbers and the 11 demo plots, each with a verdict dot), **Pages**, **Actions** (switch role, change language, toggle theme, start tour, run attack lab). Arrow keys move, Enter runs, Esc closes. Results update at each key. Screen-reader announced as a combobox with `aria-activedescendant`.

### 2.4 Roles (demo)
Roles are a header switch: Citizen (default), Sub-registrar, AC Land, Bank. Officer pages show a **role gate**: lock icon, "This page is for officers", one button "Continue as <role>". A small banner on officer pages says "Demo role. Real login would use national digital ID." A role chip in the header always shows the current role.

### 2.5 Breadcrumbs and deep links
Report, seal and tracker pages have a back link and a "Copy link" button. All routes are hash routes and also work as pretty paths from the server (`/check/DHK-UTT-0142`). A QR always encodes `<origin>/#/v/<64-hex seal>`.

---

## 3. Design system

### 3.1 Color tokens (light / dark)
| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#f6f2e4` | `#09160f` | page |
| `--surface` | `#fffdf6` | `#102017` | cards |
| `--surface-2` | `#f0ebd8` | `#16291e` | inset areas |
| `--surface-3` [UPGRADE] | `#e8e1c7` | `#1d3426` | pressed, track |
| `--ink` | `#10241a` | `#efe9d2` | text |
| `--muted` | `#55675b` | `#a2b3a7` | secondary text (4.5:1 on bg) |
| `--line` | `#e0d9bf` | `#23392b` | borders |
| `--brand` | `#0f3a1f` | `#cfae52` | primary buttons |
| `--brand-ink` | `#f6f2e4` | `#0b1a10` | text on brand |
| `--gold` | `#b8963c` | `#cfae52` | accents, eyebrow, numbers |
| `--gold-soft` | `#f3e8c4` | `#2a2713` | notices |
| `--focus` | `#1d6b40` | `#7fd6a2` | focus ring |
| `--green / -bg` | `#1c7a44 / #e4f3ea` | `#6fd49a / #12301f` | verdict genuine |
| `--amber / -bg` | `#94630a / #fbf0d0` | `#f0c25e / #33290e` | verdict caution |
| `--red / -bg` | `#a6301d / #fbe3dd` | `#ff9a85 / #371914` | verdict forged / blocked |
Rules: text on colored backgrounds must reach 4.5:1; large text 3:1. Never use color alone: green = **shield-check**, amber = **triangle**, red = **octagon-x**. A **high-contrast theme** [UPGRADE] raises ink and line contrast to 7:1.

### 3.2 Texture and depth [UPGRADE]
* Page background: warm cream with a faint paper grain (SVG `feTurbulence`, 3% opacity) and two blurred radial glows (gold top-left, green top-right). Dark mode: deep green with a soft gold glow behind the hero card.
* **Glass** for header, command palette, bottom bar: `backdrop-filter: blur(14px) saturate(1.2)`, 1 px inner highlight.
* **Guilloche pattern** (SVG, repeating sine curves, 6% opacity) behind the seal and on the print report border, like a banknote or stamp paper.

### 3.3 Typography
* Bangla + Latin body: **Hind Siliguri** (400, 500, 600, 700). Display: **Fraunces** (600, 700) for Latin headings; Bangla headings use Hind Siliguri 700. Monospace for hashes and plot numbers: system `ui-monospace` stack. [UPGRADE] **Self-host** WOFF2 subsets (Latin + Bengali + digits) with `font-display: swap`, preload the two body weights, so no third-party request is needed (CSP `font-src 'self'`).
* Fallback stack: "Noto Sans Bengali", "Nirmala UI", "Segoe UI", system-ui, sans-serif.
* Scale (fluid with `clamp`): display 56/60 → 36/42 on phones; H1 40/44; H2 30/36; H3 22/28; H4 18/26; body 16/26 (Bangla 17/29); small 14/22; micro 12/18.
* Bangla rules: no letter-spacing, no uppercase transforms, no italics, no faux bold; line-height at least 1.7; Bangla body +1 px; keep conjuncts unbroken (`word-break: normal`, `overflow-wrap: anywhere` only for hashes).
* Numbers: use Bangla digits in Bangla UI through `Intl` (`bn-BD`), Latin tabular numerals in tables and money. Money: `৳ 1,200,000`; dates: `১২ অক্টোবর ২০২৬` / `12 Oct 2026`.
* Hashes: monospace 12–13 px, shown as `first10…last6`, full value in a tooltip and on copy; group in 4s in expanded view.

### 3.4 Layout
* 12-column grid, content max 1200 px (reading text max 68ch), gutters 24 px (16 px on phones), page padding 20 px.
* Breakpoints: 360, 480, 768, 1024, 1280, 1536.
* Spacing scale (px): 4, 8, 12, 16, 20, 24, 32, 40, 56, 72, 96. Section vertical rhythm 56 px (mobile) and 96 px (desktop).
* Radius: 8 (inputs inside cards), 12 (chips, small buttons), 16 (buttons), 24 (cards, verdict), 999 (pills).
* Elevation: e1 `0 1px 2px rgba(16,36,26,.06)`; e2 card `+ 0 8px 24px rgba(16,36,26,.07)`; e3 popover `0 16px 48px rgba(16,36,26,.14)`; e4 modal `0 24px 80px rgba(16,36,26,.25)`.

### 3.5 Iconography
Custom line icons on a 24 px grid, stroke 1.75 px, round caps and joins, `currentColor`. Set: check, x, triangle-warn, shield-check, octagon-x, search, scan, file, lock, unlock, link, broken-link, copy, print, arrow, user, moon, sun, globe, download, qr, clock, stamp, bank, flask, tree, key, eye, info, chevron, menu, command. Illustrations: simple geometric (parcels, chain links, seals), same palette, never photos of people.

### 3.6 Motion system
| Token | Value | Use |
|---|---|---|
| `--t-fast` | 120 ms | hover, press |
| `--t-base` | 200 ms | color, small moves |
| `--t-slow` | 360 ms | panels, reveals |
| `--t-seal` | 520 ms | stamp |
| `--t-story` | 900 ms | hero and story steps |
| `--ease-std` | `cubic-bezier(.2,0,0,1)` | most |
| `--ease-out` | `cubic-bezier(0,0,0,1)` | enter |
| `--ease-in` | `cubic-bezier(.3,0,1,1)` | exit |
| `--ease-pop` | `cubic-bezier(.2,1.4,.4,1)` | stamp, success |
Rules: stagger 60 ms; at most 3 elements animating at once; only animate `transform` and `opacity` (plus `clip-path`/`stroke-dashoffset` for line draws); scroll reveals use `IntersectionObserver` at 15% and run once; **`prefers-reduced-motion`** removes all movement (instant state change, no parallax, no loops, no auto-advancing). Every long animation can be skipped with a click or Esc.

---

## 4. Component library (with all states)
Every component has: default, hover, focus-visible, active, disabled, loading, error (where relevant), dark mode, Bangla and English text, RTL not needed.

1. **Button** (primary, ghost, success, danger; sizes sm 36 / md 46 / lg 54 px). Loading state shows a spinner and keeps width. Press: translateY(1px), shadow shrinks.
2. **Input / Select / Textarea.** 48 px high, label above, hint below, error below in red with icon and `aria-describedby`. Plot input: monospace, uppercase on blur, mask hint `AAA-AAA-0000`, paste cleaning (trims spaces, converts Bangla digits).
3. **Search with suggestions** [UPGRADE]: combobox listing matching plots with verdict dot, mouza, owner; recent searches (kept only in this browser); "No match" shows the format example.
4. **Chip** (neutral, green, amber, red, gold) with optional icon. **Dot** status marker.
5. **Verdict banner** (green / amber / red / forged): left icon tile 64 px, title, sentence, optional extra. Announced with `role="status"`. Animation: see 5.3.
6. **The Seal** [UPGRADE] (signature component): SVG 160 px (also 48 px mini). Rings: outer guilloche, text path "ভূমি লিপি · BHUMI LIPI · VERIFIED" rotating very slowly (60 s, off for reduced motion), inner shield-check or triangle or octagon. Variants: genuine (green), outdated (amber, half-faded), forged (red with a diagonal crack that "breaks" the ring), pending (gold, dashed ring). Stamp animation: scale 1.6 → 1 with rotation −8°, ink-bleed filter fades in (`feGaussianBlur` + `feColorMatrix`), 520 ms `--ease-pop`.
7. **Chain view** [UPGRADE of timeline]: a row (desktop) or column (mobile) of **block cards** connected by animated link lines. Each card: sequence badge, kind icon (first registration, sale, reversal), "from → to", date, price, office, seal `first10…last6` with copy, "Signed by SR-DHK ✓" chip, buttons Verify seal, Deed copy. A link line draws in (stroke-dashoffset) when the card enters view. **Tamper state:** the broken link shows a red crack icon, cards after the break turn red-tinted, tooltip explains "Seal mismatch at record #2".
8. **Risk meter:** horizontal 12 px track, fill with LOW green / MEDIUM amber / HIGH red, number `62/100`, label, and the reasons list below. Animated fill 360 ms.
9. **Reason list:** each item has a colored dot (shape-coded), the sentence, and an optional "Why this matters" expander.
10. **Stepper / timeline** for mutation: vertical, nodes (done, current, warning, failed), time and actor under each step, line draws as steps complete.
11. **Checklist** (8 automatic checks): check or cross icon, sentence, grouped "Passed 7 · Needs review 1".
12. **QR card** [UPGRADE]: white tile with the QR (error correction M, 4-module quiet zone), the Seal mini badge overlaid in a safe corner area outside the code, caption "Scan to verify", full seal below in monospace with copy, buttons Print and Link.
13. **Tabs** (4 on Verify): segmented control, arrow-key navigation, `role=tablist`, content swaps with a 200 ms fade.
14. **Dropzone:** dashed border, hover and drag-over glow, shows file name, size and the computed fingerprint with a progress bar for big files; privacy line "Your file never leaves your device".
15. **Table → cards:** tables scroll horizontally on tablets; on phones each row becomes a labeled card.
16. **Diff viewer** [UPGRADE]: monospace two-pane (original vs your text) with character-level highlights (red removed, green added), summary "1 character changed in the price line". Used in "Try to cheat" and the Lab.
17. **Merkle proof path** [UPGRADE]: SVG showing leaf → sibling hashes → root, levels stacked bottom to top; the proof path highlights step by step as the browser recomputes it (tick per level).
18. **Stat counter:** big number with count-up (800 ms, once), label, optional sparkline.
19. **Sparkline / small chart** [UPGRADE]: inline SVG, anchor snapshots over time (record count), 1.5 px line, gold area at 12% opacity, accessible table fallback.
20. **Toast:** bottom center (above the tab bar on phones), 2.6 s, `role="status"`, one at a time.
21. **Bottom sheet / modal:** focus trap, Esc to close, scroll lock, return focus to the trigger.
22. **Skeleton:** shimmer 1.2 s, shapes match the final layout (verdict banner, cards, timeline). Never show a spinner alone for more than 300 ms.
23. **Empty state:** icon + one sentence + one action. **Error state:** icon, what happened (bn + en), what to do, Retry. **Offline state** [UPGRADE]: "You are offline. Showing the app only. Records need internet."
24. **Tooltip:** on hover and focus, 8 px offset, max 260 px, never the only place for key information.
25. **Copy button:** copies and swaps its icon to a check for 1.5 s, announces "Copied".
26. **Demo bar, role chip, language switch, theme switch:** see 2.1.
27. **Notice:** gold-soft background, info icon, used for guidance not errors.

---

## 5. Pages in detail

### 5.0 Global behavior (all pages)
* **Route change:** 160 ms fade-out, skeleton while loading (matching the final layout), 240 ms fade/slide-in (8 px). Scroll to top, focus moves to the page `h1` (no outline on `main`). Browser back restores scroll position.
* **Prefetch:** hovering or focusing a nav link, or a plot card, imports the page module early.
* **Stale responses** never overwrite a newer page (token check) [BUILT].
* **State saved in this browser only:** language, role, theme, recent searches (max 5), tour finished. Wrapped in try/catch; works with storage blocked.
* **Errors:** every API error shows the server's `bn` or `en` message plus a next step and a Retry button. Network failure shows the offline state.
* **Language switch:** re-renders the current page in place, keeps scroll and form values.
* **Document title** changes per page ("DHK-GUL-0309 · Caution · Bhumi Lipi"), `lang` attribute follows the language.
* **Print:** header, footer, tabs, buttons hidden; pages print cleanly in black on white with the seal and QR kept.

### 5.1 Home `/` [BUILT, UPGRADE]
Purpose: in 5 seconds a visitor knows what this is, what to do, and why to trust it.
**Section A: Hero (about 88 vh).**
* Eyebrow: "LandTech 2026 · P2 + P3 + P5" with shield icon.
* H1 (display): "জমির কাগজ। *এখন প্রমাণসহ।*" / "Land papers. *Now with proof.*" (second line in gold).
* Lead (max 54 ch): "১০ সেকেন্ডে জানুন: দলিল আসল কি না, মালিক কে, আর জমি আগেই বিক্রি হয়ে গেছে কি না।" / "In 10 seconds, find out if a deed is real, who owns the land, and whether it was already sold."
* **Search combobox** (large, 64 px, monospace, placeholder `DHK-UTT-0142`, button "যাচাই / Check"); Enter submits; suggestions as in 4.3.
* **Sample chips** (5): ● Clean plot, ● Mutation pending, ● Rapid transfers, ● Khas land, ● Bank lien (colored dots). Tap opens that report.
* Secondary buttons: "Scan QR or verify a deed", "See the attack lab".
* **Right visual [UPGRADE]:** a tilted stack of three glass block cards showing the real history of `DHK-UTT-0143` (API `GET /plots/DHK-UTT-0143`), link lines drawing between them, then the Seal stamping "SEALED ✓" at 1.0 s. Pointer-move tilts the stack (max 6°, desktop only). On phones the stack sits below the search and does not tilt.
* Background: grain, two glows, a very faint Bangladesh outline in the corner (3% opacity).
**Section B: Live proof strip.** A pill "● All records intact · checked just now" (links to `/integrity`, pulses green when healthy, turns red if not) and 4 count-up stat cards from `GET /stats`: records sealed, plot chains verified x/y, fraud attempts stopped, mutations pending. Skeleton while loading. If `/stats` fails the strip hides, never shows zeros.
**Section C: "From paper to proof" scroll story [UPGRADE].** Desktop: a pinned 2-column section (left: step text and progress rail 1 to 5, right: one SVG scene that morphs). Mobile: five stacked cards, no pinning.
 1. *Paper deed:* a paper deed drawn in SVG with a red "can be copied" stamp. Text: "আজ দলিল কাগজে। কপি করা সহজ, যাচাই কঠিন।" / "Today a deed is paper. Easy to copy, hard to check."
 2. *Seal:* the deed gets a digital seal (the Seal stamps, a hash string types out). "রেজিস্ট্রি হলেই ডিজিটাল সিল।" / "The moment it is registered, it gets a digital seal."
 3. *Chain:* a second deed links to the first. "প্রতিটি দলিল আগেরটির সাথে যুক্ত। একটি বদলালে সব ভাঙে।" / "Each deed is linked to the last. Change one and all break." (click-to-tamper toggle shows the crack)
 4. *Lock:* a padlock closes on the parcel. "বিক্রির পর জমি লক। নামজারি শেষ না হলে আবার বিক্রি নয়।" / "After a sale the land locks. No second sale until mutation is done."
 5. *Verify:* a phone scans the QR and a green verdict appears. "ফোনে QR স্ক্যান করলেই সত্য জানা যায়।" / "Scan the QR on a phone and see the truth."
**Section D: "Three questions, answered".** Three equal cards: *Is it real?* (mini seal + "Genuine"), *Who owns it?* (owner name with chain mini), *Can it be sold?* (lock/unlock icon). Each card links to the matching demo. Hover lifts 4 px and a cursor spotlight follows the pointer (desktop only).
**Section E: Who uses it.** 4 tabs (Citizens, Officers, Banks, Courts and lawyers). Each shows 2 or 3 sentences and the matching brief groups: Sub-registry offices, AC Land offices, Banks, Acquisition offices, Survey and records offices, Courts and lawyers, Citizens and buyers, Real estate developers.
**Section F: Trust, honestly.** Three short points: "We say what we cannot do" (tamper-evident, not tamper-proof), "You can check us without trusting us" (public anchor and independent script), "Demo data only". Button: "Verify it yourself" to `/integrity`.
**Section G: Learned from five countries.** A horizontal row of 5 chips (Georgia, India, Rwanda, Estonia, Zambia); selecting one shows "What they did / Their gap / What we improved" in a card below. Link to About.
**Section H: Final call to action.** Large search again, plus "Try the guided demo" button (starts the tour).
States: loading skeleton for hero visual and stats; if the API is down the hero still renders with a static sample and a quiet "demo server is waking up" notice (free hosting wakes slowly).

### 5.2 Plot finder `/check` [BUILT, UPGRADE]
* Header "জমি যাচাই করুন / Check a plot", sub "প্লট নম্বর লিখুন অথবা নিচের নমুনা বেছে নিন।" / "Type a plot number or pick a sample below."
* Search combobox (4.3). Format help under it: "Format: three letters, three letters, four digits. Example DHK-UTT-0142."
* **Filter chips:** All · Looks safe · Caution · High risk (counts in brackets), sort: A–Z or by risk. Selected filter in URL (`?v=amber`).
* **Plot cards** (grid, 3 columns desktop, 2 tablet, 1 phone): plot number (mono), verdict dot + label, mouza, area, owner, "Locked" chip, a mini 3-dot chain preview of the history length. Cards stagger in (40 ms). Whole card is the link; arrow keys move focus in the grid.
* Empty (no match): illustration, "No plot with this number", suggestions "Did you mean DHK-UTT-0142?" (closest by prefix).

### 5.3 Plot report `/check/:plot` [BUILT, UPGRADE]
Data: `GET /plots/:id` → `plot, verdict, headline, reasons, advice, chain, history, mutation, lien, survey`.
**Layout (desktop):** top bar (back, copy link, share, print); title row; verdict; two columns (left 7/12: owner + why + advice; right 5/12: status cards); full-width chain view; survey lineage; "How do we know?".
**Title row:** plot number (mono, H1), chips: mouza, area ("৬ শতাংশ / 6 decimal"), Locked, Khas, Acquisition, Court case, Bank lien, **Seals verified ✓** or **Seal broken ✗**.
**Verdict reveal choreography (total ≤ 1.4 s, click or Esc skips, reduced motion = instant):**
 1. 0 ms: skeleton fades; a gold scan line sweeps the verdict card (360 ms).
 2. 120 ms: chain nodes below tick one by one (60 ms each), each turning green or red.
 3. 480 ms: the **Seal** stamps in the verdict tile (520 ms, `--ease-pop`), a soft haptic tick on Android.
 4. 700 ms: title and sentence slide up 8 px and fade in.
 5. 900 ms: reasons and advice stagger in (60 ms).
**Verdict banner:** green title "নিরাপদ মনে হচ্ছে / Looks safe"; amber "সাবধানে এগোন / Proceed with caution"; red "ঝুঁকি অনেক বেশি / High risk". Sentence = API `headline`. Red state also tints the page header line red and shows a persistent "Do not pay" ribbon.
**Left column:** *Current owner* (large name; "since <date of last block>"), *Why this result* (reasons list; each reason has a "Why this matters" expander with one extra sentence), *What to do next* (advice items with icons; footnote "This page is guidance, not a legal decision").
**Right column cards:** *Mutation status* (state chip, tracking link, mini stepper), *Lien* (bank, amount, date, only if active), *Survey history* (see below), *Seal summary* (records, signatures valid, anchor inclusion).
**Chain view (full width):** block cards (4.7). Tapping a card expands full details: deed number, office, full seal, signature (first 16 chars), previous seal link, document hash, "Download deed copy", "Verify this seal". Latest block has a "Current" badge.
**Survey lineage [UPGRADE]:** four columns CS · SA · RS · BS, each with khatian number, holder, and an **area bar** (width proportional to decimals). If areas differ by more than 5% the odd bar turns amber with the note "Area does not match across surveys. Confirm with the land office." Mobile: vertical list.
**How do we know? (expander, closed by default):** five lines with check icons: "All N seals match their records", "All N signatures are valid (offices: SR-DHK)", "Every deed document matches its fingerprint", "Ownership replays correctly from the first registration", "Latest record is inside the public anchor of M records (checked <time>)". Button "Open the proof on the Trust page".
**Print layout (A4 "title report") [UPGRADE]:** letterhead (logo, "Bhumi Lipi · Land record check"), guilloche border, big Seal, verdict sentence, plot data, owner, ownership history table, survey table, QR to this report's seal page, footer "Checked on <date time> · registry anchor <root first 10> · Demo data. Not a legal document."
**States:** loading skeleton; `NO_PLOT` friendly page; `chain.ok=false` special **red alert page** (cracked seal, "Do not trust this record", technical detail "Seal mismatch at record #N (reason)"); API offline state; very long owner names wrap, never truncate.

### 5.4 Verify `/verify` and `/v/:hash` [BUILT, UPGRADE]
Header: "দলিল যাচাই / Verify a deed". Sub: "আসল, পুরোনো, না জাল? ১০ সেকেন্ডে জানুন।"
**Tabs:** `Code / link` · `Scan QR` · `File` · `Try to cheat`. Result appears below the card with the same reveal choreography (shorter: 700 ms).
* **Code / link:** one input (mono). Accepts a 64-hex code or any text containing it (a pasted link works). Paste button. Inline validation: "৬৪ অক্ষরের কোড দিন" while typing. Enter submits.
* **Scan QR [UPGRADE]:** on phones opens a full-screen sheet: live camera, centered square with animated corner brackets, a sweeping scan line, hint "QR কোডটি ফ্রেমের ভেতরে ধরুন", **torch** toggle where supported, "Enter code instead" link, close button. Uses `BarcodeDetector` (checked every 350 ms). On detect: brackets lock (green flash 200 ms), short vibration, camera stops, result shows. Unsupported browser → clear message pointing to the Code tab and the File tab. Permission denied → steps to allow the camera. The camera always stops when the sheet or page closes.
* **File:** dropzone (4.14). SHA-256 computed in the browser (`crypto.subtle`), progress bar for large files, max 5 MB with a friendly message above that. Shows "Fingerprint a3f1…09bc" and the result. Copy: "ফাইল আপনার ডিভাইস থেকে বের হয় না।" / "Your file never leaves your device."
* **Try to cheat [UPGRADE]:** "Load sample deed" fills a textarea. The user edits one character. Live below: **diff viewer** (4.16) and the **hash avalanche** visual: original fingerprint and new fingerprint side by side, differing hex characters highlighted, "Changed 1 character → 62 of 64 fingerprint characters changed" (computed). Button "Verify this text" shows FORGED. "Reset" restores.
**Results (card + banner + Seal variant):** GENUINE (green): plot link, deed no, transfer, date, short seal, "This is the latest record." OUTDATED (amber): same plus "A newer record exists: #N on <date>, owner <name>" (client fetches the plot) and advice "Do not rely on this copy." FORGED (red): "No record has this seal. The paper or file is forged or altered." with steps: 1 do not pay, 2 compare with the official QR, 3 contact the sub-registry office. CHAIN_BROKEN (red): "The records of this plot do not match their seals."
`/v/:hash` runs the check on load, shows the result full width with the plot link, and a **domain check line**: "You are on <origin>. Only trust seals opened on this address." (anti-phishing).
**A11y:** results in `aria-live="polite"`; tabs follow the ARIA tab pattern; camera sheet traps focus.

### 5.5 Registrar desk `/registrar` [BUILT, UPGRADE]
Role: Sub-registrar (role gate otherwise). Data: `GET /plots`, `POST /risk` (debounced 300 ms), `POST /deeds`, `GET /alerts`.
**Layout (desktop):** left sticky form card (5/12), right live panel (7/12), alerts below.
**Form:** scenario presets row "Try: Normal sale · Fake seller · Second sale · Very low price · Khas land"; Plot select with search; **Seller** (auto-filled with the registered owner, with a lock-open icon "edit to test a fake seller"); **Buyer**; **Price** (comma formatting while typing, accepts Bangla digits, shows "= ৳ 1,200,000 per decimal"); Submit "রেজিস্টার ও সিল করুন / Register and seal" (disabled while the preview says blocked, but the button explains why on focus and the user can still press "Try anyway" to record the blocked attempt in alerts for the demo).
**Live panel:** risk meter; flags list (bilingual, shape-coded); a verdict chip "Can be registered" or "Will be blocked"; a 4-step **"What will happen"** preview (Seal → Lock → Mutation → QR) where steps gray out if blocked.
**Success:** the card flips (300 ms) to a result: Seal stamps, QR card (4.12), deed number, tracking ID link, mutation chip (Auto checks passed or Needs officer review), risk, buttons Deed copy, Print seal, Copy link, "Register another". The plot select updates to the new locked state and the preview recomputes (a second sale now shows LOCKED).
**Blocked:** red card with a single 2 px horizontal shake (not in reduced motion), the reasons, and "No record was created. This attempt was logged." The alerts list gets the new item at the top with a highlight.
**Alerts card:** last 6 alerts: plot, message, level dot, time; link to the plot. "View all" opens a sheet with 50.
**Print seal:** a stamp-sized A6 print with QR, plot, deed number, date, office.

### 5.6 Mutation `/mutation`, `/mutation/:tracking` [BUILT, UPGRADE]
**Tracker (everyone):** header "নামজারি ট্র্যাকার"; input for the tracking ID (`MUT-XXXXXXXX`); recent IDs (this browser). For roles AC Land and Registrar: **queue table** with tracking, plot, from → to, state chip, age, Open button; sortable; flagged first; mobile becomes cards.
**Detail:** header with tracking ID (mono) and state chip; banner summarizing plot, parties and price.
* **Progress stepper:** Submitted → Automatic checks → (Checks passed | Officer review) → (Approved | Rejected) with times and actors; the current step pulses softly.
* **Checks panel:** 8 items (signature, owner, government land, lien, court case, survey, price, rapid resale) grouped "Passed" / "Needs review". Each failed item links to the reason text.
* **Decision panel (AC Land only, pending states):** note textarea (200 chars, counter), required for flagged applications (inline error `NOTE_REQUIRED`); buttons **Approve (unlock land)** and **Reject (reverse sale)**. Reject opens a confirm dialog: "This will undo the sale and add a REVERSAL record. History is never deleted." After approval the **padlock opens** (400 ms), the banner turns green, and the plot link says "Plot is now free to sell". After rejection the chain mini view shows the new REVERSAL block.
* **Citizen/other roles:** read-only with a plain "What happens next" box and a note "Choose the role AC Land to decide".
* States: `NO_MUTATION` friendly page; `BAD_STATE` toast "A decision was already made".

### 5.7 Bank desk `/bank` [BUILT, UPGRADE]
Role: Bank. **Plot picker** shows a summary card (owner, verdict dot, lien state, locked state). **Place lien** form: bank name, amount (comma formatting). Errors are explained in place: `DOUBLE_MORTGAGE` ("This land is already mortgaged. A second mortgage is blocked." with the existing lien shown), `LOCKED`, `GOV_LAND`. **Active liens list:** plot, bank, amount, date, **Release** (confirm dialog). Empty state: "No active liens." Footer note: "A plot with an active lien cannot be sold until released."

### 5.8 Trust page `/integrity` [BUILT, UPGRADE]
Data: `GET /integrity`, `GET /keys`, `GET /anchor/proof/:hash`, `GET /export`.
* **Status hero:** big Seal (green) with "সব রেকর্ড অক্ষত / All records intact" or the red cracked Seal with "সমস্যা পাওয়া গেছে / Problem detected" and the first failing plot. Sub: "N/N plot chains valid · M public anchors checked: all match". "Last checked <time>", auto-refresh every 30 s (`aria-live=polite`).
* **Anchor card:** Merkle root (mono, copy), record count, time, **sparkline** of record count over anchor snapshots, one-sentence explanation: "A summary fingerprint of every record. Publish it and nobody can quietly rewrite history."
* **Prove a record [UPGRADE]:** input prefilled with a real seal, button "Verify proof"; the **Merkle path visual** (4.17) animates level by level while the browser recomputes with Web Crypto; ends with "Proof is valid ✓ This record is inside the root of N records. Checked in your browser."
* **Verify it yourself:** 3 numbered steps with copyable commands: download `/api/export`; download `verify_anchor.py`; run `python verify_anchor.py bhumi-lipi-export.json`. Sentence: "The script does not use our server's code."
* **Chain table:** every plot, records, status chip; filter "Show problems only"; sortable.
* **Office keys:** office id, public key (short), fingerprint (first 12 hex of its SHA-256), copy.
* Link: "What would happen if someone cheated? Try the Attack lab."

### 5.9 Attack lab `/lab` [BUILT, UPGRADE]
Data: `POST /lab/run` (rate-limited to 6 per minute).
* Header and safety line: "প্রতিটি আক্রমণ আলাদা কপিতে চলে। আসল তথ্য অক্ষত থাকে।" / "Every attack runs on a separate copy. Real data stays untouched."
* **Pipeline [UPGRADE]:** five cards in a vertical pipeline. Each card animates 4 phases with a terminal-style log (monospace, real codes returned by the API): *Attacker does* → *System checks* → *Control triggers* → *Outcome*. Outcome chips: **STOPPED** (green) for fake seller, double sale, edited file, direct DB edit; **CAUGHT** (green, with a magnifier icon) for the insider rewrite.
* Per-card "Run this one" and a primary "Run all attacks". Cards reveal one by one (260 ms apart); a scoreboard at the end: "4 stopped · 1 caught".
* **Insider card special:** a mini diagram shows two checks: "Chain valid ✓ (the insider re-signed it)" and "Public anchor matches ✗". Text: "It does not prevent the rewrite. It guarantees the rewrite is caught."
* Errors: `RATE` shows "Please wait a minute".

### 5.10 About `/about` [BUILT, UPGRADE]
Sections: **The problem** (3 facts from the brief: forged deeds, survey mismatch CS/SA/RS/BS, split offices); **One lifecycle** (animated 5-step flow: Register → Seal → Lock → Mutation → Check); **Five countries** table (desktop) or accordion cards (mobile) with "their gap" and "our improvement"; **Honest limits** accordion (4 items); **Roadmap** timeline (OCR, GIS, witness nodes, hardware keys, SMS check); **Tech and security** chips (SHA-256, Ed25519, Merkle, SQLite triggers, CSP) with a link to the threat model; **Data and AI disclosure** (synthetic data only; AI tools list); **Team** (students and mentors, placeholders for names); **Links** (repository, verifier script).

### 5.11 Guided tour `/tour` [UPGRADE]
A spotlight overlay (dimmed page, rounded cut-out around the target, popover with title, text, Back / Next / Skip, progress "3 / 10", keyboard arrows and Esc). The tour switches role and route itself and only pre-fills fields; the user presses the real buttons so data is real.
| # | Route | Role | Spotlight | Text (en) |
|---|---|---|---|---|
| 1 | `/` | citizen | search box | "Type any plot number. Try a sample." |
| 2 | `/check/DHK-UTT-0142` | citizen | verdict | "Green: genuine, no problems." |
| 3 | `/check/DHK-GUL-0309` | citizen | reasons | "Amber: a sale is waiting for mutation." |
| 4 | `/verify` (cheat) | citizen | diff + hashes | "Change one letter. The fingerprint changes completely." |
| 5 | `/registrar` | registrar | Fake seller preset | "A fake seller is blocked, with the reason." |
| 6 | `/registrar` | registrar | Normal sale | "A real sale gets a seal and a QR. The land locks." |
| 7 | `/mutation/:new` | ac_land | decision panel | "The officer approves. The land unlocks." |
| 8 | `/bank` | bank | place lien | "A second mortgage on the same land is blocked." |
| 9 | `/integrity` | citizen | proof tool | "Check the proof yourself, in your browser." |
| 10 | `/lab` | citizen | run all | "Five attacks. Four stopped, one caught." |
Bangla text for each step in the copy deck (8.9). Finished flag saved locally; "Restart tour" in the footer and command palette.

### 5.12 Not found and error pages [UPGRADE]
Illustration of a broken link, "পাতাটি পাওয়া যায়নি / Page not found", a search box and links to Check, Verify, Home. Server error page: "সার্ভারে সমস্যা হয়েছে। একটু পরে আবার চেষ্টা করুন।" with Retry.

---

## 6. Signature interactions (specs)
1. **Hero tilt.** Pointer position maps to `rotateX/Y` max 6°, eased with `requestAnimationFrame`, 120 ms lag. Disabled on touch and reduced motion.
2. **Scroll story.** `IntersectionObserver` per step (threshold .5) sets `data-step` on the section; CSS swaps SVG layers with 360 ms cross-fade; progress rail fills; keyboard users can use the step buttons.
3. **Cursor spotlight.** `--mx`/`--my` CSS variables from `pointermove` feed a radial gradient on cards (gold at 12% opacity), desktop only.
4. **Count-up.** `requestAnimationFrame`, 800 ms, ease-out, runs once when visible; final text is set immediately for screen readers.
5. **Seal stamp.** SVG group with scale/rotate keyframes plus an ink-bleed filter; reduced motion shows the final state.
6. **Scan UI.** Corner brackets (4 SVG paths) with a pulse; scan line `translateY` loop 1.4 s; on success brackets turn green and scale 1.05.
7. **Hash avalanche.** Two 64-char strings with differing positions wrapped in `<mark>`; count shown; animation fades the changed characters in left to right (8 ms each).
8. **Merkle path.** SVG nodes; each level: sibling slides in, hash text types, connector turns green; total 1.2 s; Replay button.
9. **Lock/unlock.** Padlock SVG: shackle `translateY` and rotate 400 ms; sound-free.
10. **Attack log.** Lines appended every 140 ms with a blinking caret; codes colored (red attacker, gold system, green control).
11. **Tamper crack.** A jagged `clip-path` crack line across the Seal and the broken chain link; a red inner shadow on dependent cards.
12. **Haptics.** `navigator.vibrate(12)` on a successful seal or scan; `[20,40,20]` on a blocked sale. Optional, never required.
13. **No sound anywhere.**

---

## 7. Data and API used by each page
| Page | Calls | Used fields |
|---|---|---|
| Home | `GET /stats`, `GET /plots/DHK-UTT-0143` | records, plots, chains_ok, healthy, attacks_stopped, mutations_pending; history[] |
| Finder | `GET /plots` | plot_id, mouza, owner, locked, area_decimal, verdict |
| Report | `GET /plots/:id`; optional `GET /anchor/proof/:hash` | plot, verdict, headline, reasons, advice, chain{ok,first_bad_seq,reason,length}, history[], mutation, lien, survey{records,mismatch} |
| Verify / seal | `POST /verify {hash} or {doc_hash}`; `GET /plots/:id` (outdated detail); `GET /deeds/:hash/document` (cheat sample) | result, bn, en, plot_id, seq, kind, deed_no, frm, to, ts, hash |
| Registrar | `GET /plots`, `POST /risk`, `POST /deeds`, `GET /alerts` | allowed, flags[], risk{score,level}; hash, deed_no, tracking_id, mutation_state |
| Mutation | `GET /mutations/queue`, `GET /mutations/:id`, `POST /mutations/:id/decision` | state, label, checks[], events[], deed |
| Bank | `GET /plots`, `GET /liens`, `POST /liens`, `POST /liens/:id/release` | lien rows; errors DOUBLE_MORTGAGE, LOCKED, GOV_LAND |
| Trust | `GET /integrity`, `GET /keys`, `GET /anchor`, `GET /anchor/proof/:hash`, `GET /export` | plots[], chains_ok, anchors{ok,checked}, latest_anchor, keys |
| Lab | `POST /lab/run` | id, title, attack, stopped, outcome, control, detail |
| **[API+]** optional | `GET /anchors` (snapshot list for the sparkline), `GET /areas/:mouza/median` (price hint), `GET /plots/:id/anchor-status` (inclusion line in "How do we know?") | small read-only endpoints; none change security |
All requests send `X-Demo-Role`. All errors are `{error:{code,bn,en,...}}`.

---

## 8. Copy deck (Bangla / English)
Tone: short, kind, clear. Bangla must be reviewed by a native speaker before submission (run `/bangla-review`).

### 8.1 Global
* Demo bar: "ডেমো: সব তথ্য বানানো। কোনো আসল নাম, এনআইডি বা জমির রেকর্ড নেই।" / "Demo: all data is synthetic. No real names, NID numbers or land records."
* Nav: জমি দেখুন / Check · দলিল যাচাই / Verify · রেজিস্ট্রার / Registrar · নামজারি / Mutation · ব্যাংক / Bank · সুরক্ষা / Integrity · অ্যাটাক ল্যাব / Lab · পরিচিতি / About.
* Roles: নাগরিক / Citizen · সাব-রেজিস্ট্রার / Sub-registrar · এসি ল্যান্ড / AC Land · ব্যাংক / Bank.
* Common buttons: যাচাই / Check · কপি / Copy · প্রিন্ট / Print · আবার চেষ্টা করুন / Try again · বাতিল / Cancel · নিশ্চিত করুন / Confirm · বন্ধ করুন / Close.

### 8.2 Glossary (always use the same word)
দলিল = deed · খতিয়ান = khatian (record of rights) · নামজারি = mutation · জরিপ = survey (CS/SA/RS/BS) · মৌজা = mouza · শতাংশ = decimal · বন্ধক = mortgage / lien · মালিক = owner · সিল = seal · শিকল = chain · তালা / লক = lock · যাচাই = verify / check · জাল = forged · সাব-রেজিস্ট্রি অফিস = sub-registry office · এসি ল্যান্ড অফিস = AC Land office · খাস জমি = khas (government) land · অধিগ্রহণ = acquisition.

### 8.3 Verdicts
* Green: "নিরাপদ মনে হচ্ছে" / "Looks safe" · "এই জমির কাগজ আসল। কোনো সমস্যা পাওয়া যায়নি।" / "This land record is genuine. No problems found."
* Amber: "সাবধানে এগোন" / "Proceed with caution" · "সতর্ক থাকুন। কেনার আগে নিচের বিষয়গুলো দেখুন।" / "Be careful. Check the points below before buying."
* Red: "ঝুঁকি অনেক বেশি" / "High risk" · "এখন কিনবেন না। গুরুতর সমস্যা পাওয়া গেছে।" / "Do not buy now. Serious problems found."
* Advice, green: "বিক্রেতার পরিচয়পত্র দলিলের নামের সাথে মিলিয়ে নিন।" / "Match the seller's ID with the name on the deed." · "কেনার পর নামজারির আবেদন করুন।" / "Apply for mutation right after buying."
* Advice, amber: "সমস্যাগুলো মেটার আগে টাকা দেবেন না।" / "Do not pay until these points are cleared." · "স্থানীয় ভূমি অফিস বা আইনজীবীর সাথে কথা বলুন।" / "Talk to the local land office or a lawyer."
* Advice, red: "কোনো টাকা দেবেন না।" / "Do not pay any money." · "সংশ্লিষ্ট ভূমি অফিসে খোঁজ নিন।" / "Ask the relevant land office."

### 8.4 Verify
* GENUINE: "খাঁটি দলিল" / "Genuine deed" · "সিল মিলেছে এবং এটিই সর্বশেষ রেকর্ড।" / "The seal matches and this is the latest record."
* OUTDATED: "আসল, কিন্তু পুরোনো" / "Real, but outdated" · "এরপর জমি অন্য কারও নামে গেছে।" / "The land has changed hands since."
* FORGED: "জাল বা বদলানো" / "Forged or altered" · "এই সিল রেজিস্ট্রিতে নেই। কাগজটি জাল বা বদলানো।" / "No record has this seal. The paper is forged or altered."
* CHAIN_BROKEN: "রেকর্ড ভাঙা" / "Record chain broken" · "এই প্লটের রেকর্ডের সিল ভেঙে গেছে। বিশ্বাস করবেন না।" / "The record chain of this plot is broken. Do not trust it."
* Privacy line: "ফাইল আপনার ডিভাইস থেকে বের হয় না। শুধু ফিঙ্গারপ্রিন্ট পাঠানো হয়।" / "The file never leaves your device. Only its fingerprint is sent."
* Cheat hint: "একটি সংখ্যা বা অক্ষর বদলান, তারপর যাচাই করুন। সিল মিলবে না।" / "Change one number or letter, then verify. The seal will not match."
* Anti-phishing: "আপনি এই ঠিকানায় আছেন: {origin}। শুধু এই ঠিকানায় খোলা সিল বিশ্বাস করুন।" / "You are on {origin}. Only trust seals opened on this address."

### 8.5 Registrar
* Title: "দলিল রেজিস্ট্রি" / "Register a deed" · sub: "আগে নিয়ম চলে, তারপর সিল। জাল বিক্রেতা বা দ্বিতীয় বিক্রি এখানেই আটকে যায়।" / "Rules run first, then the seal. Fake sellers and second sales are stopped here."
* Labels: প্লট / Plot · বিক্রেতা / Seller · ক্রেতা / Buyer · দাম (টাকা) / Price (BDT).
* Hint: "রেকর্ডের মালিকের নাম আগে থেকে বসানো। বদলে দেখুন কী হয়।" / "Pre-filled with the registered owner. Change it and see what happens."
* Presets: স্বাভাবিক বিক্রি / Normal sale · জাল বিক্রেতা / Fake seller · দ্বিতীয় বিক্রি / Second sale · খুব কম দাম / Very low price · খাস জমি / Khas land.
* Success: "দলিল সিল হয়েছে" / "Deed sealed" · "জমি এখন লক। নামজারি শেষ না হলে আর বিক্রি করা যাবে না।" / "The plot is now locked. It cannot be sold again until mutation is finished."
* Blocked: "বিক্রি আটকানো হয়েছে।" / "Sale blocked." · "কোনো রেকর্ড তৈরি হয়নি। চেষ্টাটি নথিভুক্ত হয়েছে।" / "No record was created. This attempt was logged."

### 8.6 Mutation and bank
* "দলিল রেজিস্ট্রির পর নামজারি নিজে থেকেই শুরু হয়। অবস্থা এখানে দেখুন।" / "Mutation starts automatically after registration. Follow it here."
* States: আবেদন জমা হয়েছে / Application submitted · স্বয়ংক্রিয় যাচাই চলছে / Automatic checks running · স্বয়ংক্রিয় যাচাই সফল / Automatic checks passed · কর্মকর্তার নজর প্রয়োজন / Needs officer review · নামজারি অনুমোদিত / Mutation approved · নামজারি বাতিল / Mutation rejected.
* Decision: "অনুমোদন (জমি আনলক)" / "Approve (unlock land)" · "বাতিল (বিক্রি ফেরত)" / "Reject (reverse sale)".
* Confirm reject: "বিক্রিটি ফেরত যাবে এবং একটি ফেরত-রেকর্ড যোগ হবে। ইতিহাস মোছা হয় না।" / "This will undo the sale and add a reversal record. History is never deleted."
* Bank: "জমি বন্ধক রাখার আগে মালিকানা যাচাই। একই জমি দুই ব্যাংকে বন্ধক রাখা যায় না।" / "Check ownership before taking land as collateral. The same land cannot be mortgaged twice."

### 8.7 Trust and lab
* "সব রেকর্ড অক্ষত" / "All records intact" · "সমস্যা পাওয়া গেছে" / "Problem detected".
* Anchor: "সব রেকর্ডের একটি সারাংশ-হ্যাশ (Merkle root)। এটি প্রকাশ করলে কেউ চুপচাপ ইতিহাস বদলাতে পারে না।" / "One summary fingerprint of every record. Once published, nobody can quietly rewrite history."
* Proof OK: "প্রমাণ সঠিক ✓ রেকর্ডটি অ্যাংকরে আছে। যাচাই হয়েছে আপনার ব্রাউজারে।" / "Proof is valid ✓ This record is inside the anchor. Checked in your browser."
* Lab intro: "আমরা নিজেরাই জালিয়াতি চালিয়ে দেখাই কোন নিয়ম কোনটি ঠেকায়।" / "We attack our own system and show what stops each attack."
* Chips: ঠেকানো গেছে / STOPPED · ধরা পড়েছে / CAUGHT. Final: "৫টির ৫টি আক্রমণ ঠেকানো বা ধরা গেছে" / "All 5 attacks were stopped or caught".
* Honest note: "এটি প্রতিরোধ নয়, ধরা পড়া নিশ্চিত করে।" / "It does not prevent the rewrite. It guarantees it is caught."

### 8.8 Honest limits (About)
1. "একটি ডাটাবেসের হ্যাশ-শিকল ছোঁয়া গেলে ধরা পড়ে, কিন্তু অভেদ্য নয়।" / "A single-operator hash chain is tamper-evident, not tamper-proof."
2. "চাবি চুরি বা ভেতরের লোকের ঝুঁকি আছে। উত্তর: অফিসভিত্তিক চাবি, পাবলিক অ্যাংকর, স্বাধীন ভেরিফায়ার।" / "Key theft and insiders are real risks. Answer: per-office keys, a public anchor, an independent verifier."
3. "ডেমো ভূমিকা আসল লগইন নয়।" / "Demo roles are not real login."
4. "পুরোনো কাগুজে রেকর্ড ডিজিটাইজ (OCR) এখনও করা হয়নি।" / "Digitizing old paper records (OCR) is not built yet."

### 8.9 Tour steps (Bangla)
1 "যেকোনো প্লট নম্বর লিখুন। নমুনা বেছে নিতে পারেন।" · 2 "সবুজ মানে: দলিল আসল, কোনো সমস্যা নেই।" · 3 "হলুদ মানে: বিক্রি হয়েছে, নামজারি বাকি।" · 4 "একটি অক্ষর বদলান। ফিঙ্গারপ্রিন্ট পুরো বদলে যায়।" · 5 "জাল বিক্রেতা কারণসহ আটকে যায়।" · 6 "আসল বিক্রিতে সিল আর QR তৈরি হয়। জমি লক হয়।" · 7 "কর্মকর্তা অনুমোদন দিলে জমি আনলক হয়।" · 8 "একই জমি দ্বিতীয়বার বন্ধক রাখা যায় না।" · 9 "প্রমাণ নিজের ব্রাউজারেই যাচাই করুন।" · 10 "পাঁচটি আক্রমণ: চারটি ঠেকানো, একটি ধরা।"

---

## 9. Error catalogue (what the user sees)
Every error shows: icon, title, one sentence (bn + en), next step, Retry where useful. Server messages are used as they come.
| Code | When | Title (en) | Next step |
|---|---|---|---|
| OFFLINE (client) | no network | Cannot reach the server | Check your internet, then Retry |
| RATE | too many requests | Too many requests | Wait a minute |
| BAD_JSON, TOO_BIG | malformed or huge request | Request problem | Reload and try again |
| FORBIDDEN | wrong role | Wrong role for this action | One-click "Continue as <role>" |
| BAD_PLOT | plot format wrong | Plot number looks wrong | Show format `AAA-AAA-0000` and example |
| NO_PLOT | plot not in registry | Plot not found | Suggestions by prefix |
| BAD_INPUT, BAD_PRICE | field problem | Check this field | Focus the field |
| SALE_BLOCKED | rules block the sale | Sale blocked | Read the reasons; no record was created |
| BAD_CODE | seal code malformed | Seal code looks wrong | Use the 64-character code |
| NO_DEED | unknown seal | No deed with this seal | Treat as forged; steps shown |
| NO_MUTATION | tracking ID unknown | Tracking number not found | Check the ID |
| BAD_STATE | already decided | Already decided | Open the latest state |
| NOTE_REQUIRED | flagged approval | A reason is required | Focus the note box |
| DOUBLE_MORTGAGE, LOCKED, GOV_LAND | lien rules | Lien not possible | Explain in place |
| SERVER | unexpected | Something went wrong | Retry; contact the team |

---

## 10. Front-end architecture for the premium version
* **Stack:** vanilla ES modules, no build. Folders: `css/` (tokens, base, components, pages, print), `js/core/` (dom, router, i18n, api, store, a11y helpers), `js/components/` (seal, chain-view, qr-card, diff, merkle-path, command-palette, tour, tabs, sheet, toast), `js/views/` (pages), `js/lib/qr.js`.
* **CSS:** layers (`@layer reset, tokens, base, components, pages, utilities, print`), custom properties for all tokens, logical properties, container queries for cards, `color-mix` for tints, `:focus-visible`, `prefers-reduced-motion`, `prefers-color-scheme`, `prefers-contrast`.
* **i18n [UPGRADE]:** move strings to `i18n/bn.json` and `i18n/en.json` with stable keys; `t(key, vars)`; `Intl` for numbers, dates, plurals; a test fails the build if the key sets differ. Server messages remain `{bn,en}`.
* **State:** a tiny store (language, role, theme, contrast, recent searches, tour) with change events; views subscribe and re-render.
* **Components:** each exports `create(props)` returning a node and `destroy()`; no global side effects; animations read tokens from CSS.
* **Router:** hash routes; each route module lazy-loaded; prefetch on hover; `ctx.onLeave` cleans timers, camera streams, observers.
* **Security:** only `textContent`; innerHTML only for static icon strings and numeric QR SVG; CSP stays `script-src 'self'`, add `worker-src 'self'` for the service worker, `font-src 'self'` after self-hosting fonts.

## 11. Accessibility (WCAG 2.2 AA minimum)
* Contrast: text 4.5:1, large text and UI parts 3:1, in both themes; high-contrast theme 7:1.
* Keyboard: everything reachable and operable; logical tab order; visible 3 px focus ring with 2 px offset; skip link; shortcuts (`/` search, `Ctrl/⌘ K` palette, `Esc` closes) never block normal typing; no keyboard traps except modals (which trap and return focus).
* Target size at least 44 × 44 px on touch (WCAG minimum 24).
* Screen readers: landmarks (header, nav, main, footer), one `h1` per page, headings in order; verdicts use `role="status"`; live regions are polite; icons `aria-hidden` with text alternatives; the Seal has `role="img"` and a label like "Verified: genuine"; charts have a table fallback; QR has an alt "QR code that opens the seal check page".
* Forms: labels, hints and errors linked with `aria-describedby`; error summary on submit; never rely on placeholder.
* Motion: reduced-motion honored; no flashing above 3 per second; no auto-playing loops longer than 5 s.
* Language: `lang` on `html` and on mixed-language fragments; Bangla text never truncated with ellipsis in key sentences.
* Zoom: works at 200% and 400% reflow; text spacing overrides do not break layout.
* Cognitive: plain words, one task per screen, consistent patterns, confirmation for destructive actions (reject, release).
* Testing: axe-core in Playwright on every page and state; manual pass with TalkBack (Android) and NVDA (Windows) on Check, Verify and Registrar.

## 12. Performance budget (targets, measured with Lighthouse and WebPageTest on Slow 4G, mid Android)
* First load transfer ≤ 150 KB excluding fonts; CSS ≤ 20 KB gzip; first-route JS ≤ 35 KB gzip; each lazy route ≤ 15 KB gzip.
* Fonts self-hosted WOFF2 subsets (Hind Siliguri 400/600/700 Latin+Bengali, Fraunces 700 Latin), preload the two most-used files, `font-display: swap`, size-adjusted fallback to avoid layout shift. Target ≤ 140 KB total fonts.
* LCP ≤ 2.0 s, CLS ≤ 0.05, INP ≤ 200 ms, TBT ≤ 150 ms. Lighthouse mobile: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95.
* No images except an SVG logo (vectorize the logo) and the OG image; inline critical CSS for the shell; `content-visibility: auto` for long lists; `loading="lazy"` for anything below the fold; cache headers for static assets (versioned file names) while HTML stays `no-cache`.
* Animations only on `transform` and `opacity`; avoid layout thrash; one `requestAnimationFrame` loop shared.
* Free-host wake-up: show a friendly "waking the demo server" state if the first API call takes more than 2.5 s; keep the shell interactive meanwhile.

## 13. Security and privacy in the UI
* Demo data banner always visible; no real personal data fields anywhere; owner names are obviously dummy.
* QR and share links always use the current origin; the seal page prints the origin (anti-phishing). No third-party scripts, no analytics, no trackers, no cookies.
* Files hashed locally; nothing uploaded. Camera stream never recorded and stopped on leave.
* All text inserted with `textContent`; strict CSP; validated inputs; rate-limit messages friendly.
* Roles are labeled "Demo role" with a note that production uses national digital ID.

## 14. Offline and installable (PWA) [UPGRADE]
* `manifest.webmanifest`: name "ভূমি লিপি", short name "Bhumi Lipi", `display: standalone`, theme `#0f3a1f`, background `#f6f2e4`, icons 192 and 512 (plus maskable), start URL `/`.
* Service worker: cache-first for versioned static files, network-first for `/api/*`, offline fallback page. **Never** present a cached verdict as current: if offline, show "Offline. Records need internet." and hide verdicts.
* "Add to home screen" hint after the second visit, dismissible.

## 15. SEO and sharing
* Per-page `title` and `description`; Open Graph and Twitter card with a static 1200 × 630 image (the Seal, tagline in Bangla and English); `theme-color`; favicon set; `robots.txt` allows all; `sitemap.xml` lists the main routes.
* Hash routes are not indexed individually; the landing page carries the descriptive content. Server-render the landing meta only (static `index.html`).

## 16. Quality assurance plan
* **Automated:** unit tests (51 now), API tests, the browser story (`tests/e2e_playwright.py`), axe-core checks, Lighthouse CI budget, QR decode check (OpenCV), link checker, i18n key parity check.
* **Visual regression:** screenshots of every page and key state at 3 widths (360, 768, 1280 px) × 2 themes × 2 languages, compared on every change.
* **Devices:** Android Chrome (low-end, 2 GB RAM), iPhone Safari, desktop Chrome, Firefox, Edge. Throttle to Slow 4G. Test with Bangla fonts missing (fallback) and with OS font size 130%.
* **Manual checklist:** read all Bangla aloud; run each journey J1 to J9 on a phone; keyboard-only run; screen-reader run; print preview of a report; offline behavior; camera permission denied path.
* **Definition of done for any page:** passes axe, no console errors (except intentional 409s), no sideways scroll at 360 px, both languages reviewed, both themes checked, loading/empty/error states exist.

## 17. Build order and cut line (5 days to Round 1)
> **Check the date first.** If you are reading this on **Wed 14 Oct or later**, Round 1 is due Fri 16 Oct and the full Tier 1 below no longer fits. Use this **compressed 2-day version (about 11 hours)** and nothing else before submitting:
> 1. Seal component + verdict reveal on the Plot report and Verify result (4 h)
> 2. Chain view tamper crack + count-up stats + "All records intact" pill (3 h)
> 3. Diff viewer + hash avalanche in "Try to cheat" (2 h)
> 4. Mobile bottom tab bar (1.5 h)
> 5. Self-host fonts so Bangla never depends on Google Fonts (0.5 h)
> Feature freeze Wed night. Thursday is for the concept note, README, video and live-link test. Submit Friday morning. Everything else in this plan is for the Final Round.

Do the highest impact work first. **Feature freeze: Wednesday 14 Oct night.** If time runs short, stop at the line.
**Tier 1: Mon 12 to Tue 13 (about 20 hours, split between two people)**
1. Self-host fonts, extended tokens, grain and glow background (2 h)
2. **Seal component + verdict reveal choreography** (4 h)
3. Chain view upgrade + tamper crack (3 h)
4. Mobile bottom tab bar + full-screen scan sheet (3 h)
5. Diff viewer + hash avalanche in "Try to cheat" (2 h)
6. Count-up stats + live "All records intact" pill (1 h)
7. Print report (A4 title report) (1.5 h)
8. Search combobox + finder filters (2 h)
9. Copy, error messages and Bangla review (2 h)
**Tier 2: Wed 14 morning (only if Tier 1 is done and tested)**
10. Guided tour (3 h) · 11. Merkle path visual (2 h) · 12. Attack pipeline log (2 h) · 13. Scroll story (3 steps, no pinning) (2 h) · 14. Command palette (2 h) · 15. Sparkline + PWA (2 h)
**Tier 3: Final Round (after selection)**
High-contrast theme, presenter mode (+15% text, hides nav), i18n JSON catalogs and parity test, OG image set, visual regression suite, hero tilt and cursor spotlight, API+ endpoints, Postgres.
**Rule:** never ship a premium feature without its reduced-motion and mobile version, and re-run the 51 tests and the browser test after every tier.

## 18. "Premium" acceptance checklist
- [ ] Every page has designed loading, empty, error and offline states
- [ ] The Seal appears on verdicts, QR cards, the Trust page and print reports, with 4 variants
- [ ] Verdict reveal feels intentional, takes under 1.4 s, can be skipped
- [ ] Chain view shows signed blocks and a visible break when tampered
- [ ] Scan flow on a real phone works end to end (or falls back clearly)
- [ ] Diff viewer and hash avalanche make "one character changes everything" obvious
- [ ] Mobile bottom tab bar, safe areas and 44 px targets everywhere
- [ ] Bangla reads naturally; no tofu boxes with the self-hosted fonts; line-height ≥ 1.7
- [ ] Light, dark and auto themes pass contrast checks
- [ ] Lighthouse mobile: Performance ≥ 90, Accessibility ≥ 95
- [ ] Reduced-motion users see no movement; keyboard users can do every journey
- [ ] Print preview of a report looks like an official document
- [ ] No console errors and no third-party requests (fonts are self-hosted)
- [ ] All 51 tests and the browser story still pass; new components have tests
- [ ] The 3-minute demo video follows journeys J1 to J8 and looks smooth at 1080p

---

## Appendix A: reference snippets
```css
/* tokens (excerpt) */
:root{
  --bg:#f6f2e4; --surface:#fffdf6; --ink:#10241a; --muted:#55675b; --line:#e0d9bf;
  --brand:#0f3a1f; --brand-ink:#f6f2e4; --gold:#b8963c; --focus:#1d6b40;
  --green:#1c7a44; --green-bg:#e4f3ea; --amber:#94630a; --amber-bg:#fbf0d0; --red:#a6301d; --red-bg:#fbe3dd;
  --t-fast:120ms; --t-base:200ms; --t-slow:360ms; --t-seal:520ms;
  --ease-std:cubic-bezier(.2,0,0,1); --ease-pop:cubic-bezier(.2,1.4,.4,1);
}
/* glass header */
.top{background:color-mix(in srgb,var(--bg) 82%,transparent);backdrop-filter:blur(14px) saturate(1.2);border-bottom:1px solid var(--line)}
/* seal stamp */
@keyframes stamp{from{opacity:0;transform:rotate(-8deg) scale(1.6)}to{opacity:1;transform:rotate(-8deg) scale(1)}}
.seal.is-in{animation:stamp var(--t-seal) var(--ease-pop) both}
/* scan sweep over a card */
@keyframes sweep{from{transform:translateY(-100%)}to{transform:translateY(100%)}}
.scan::after{content:"";position:absolute;inset:0;background:linear-gradient(transparent,color-mix(in srgb,var(--gold) 35%,transparent),transparent);animation:sweep 360ms var(--ease-std) 1}
/* line draw (chain links) */
.link path{stroke-dasharray:var(--len);stroke-dashoffset:var(--len);animation:draw var(--t-slow) var(--ease-std) forwards}
@keyframes draw{to{stroke-dashoffset:0}}
/* reduced motion */
@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-delay:0s!important;transition-duration:.01ms!important;scroll-behavior:auto!important}}
/* paper grain */
body::before{content:"";position:fixed;inset:0;pointer-events:none;opacity:.03;background:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence baseFrequency='.8' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")}
```
```js
// hash avalanche: highlight differing positions between two hex strings
export function avalanche(a, b) {
  let n = 0, out = [];
  for (let i = 0; i < a.length; i++) { const diff = a[i] !== b[i]; if (diff) n++; out.push({ ch: b[i], diff }); }
  return { changed: n, total: a.length, chars: out };
}
```

## Appendix B: premium file layout
```
web/
  index.html  manifest.webmanifest  sw.js  robots.txt  sitemap.xml
  assets/ logo.svg  og.png  icons/ fonts/ (woff2)
  css/ tokens.css base.css components.css pages.css print.css
  i18n/ bn.json en.json
  js/core/ dom.js router.js i18n.js api.js store.js a11y.js
  js/lib/ qr.js
  js/components/ seal.js chain-view.js qr-card.js diff.js merkle-path.js
                 command-palette.js tour.js tabs.js sheet.js toast.js risk-meter.js stat.js
  js/views/ home.js check.js verify.js registrar.js mutation.js bank.js integrity.js lab.js about.js notfound.js
```
