# UI SPEC: what the web app must look like and do
Companion to `docs/SPEC.md` (backend). A no-build, no-framework single-page app in `web/`.

## 1. Principles
* Plain HTML + CSS + JavaScript ES modules. No npm, no bundler. Served by the Python server (`/` and every non-file path return `index.html`).
* Bangla first, English second (`T(bn, en)` picks the text; server messages arrive as `{bn, en}` and `LL(obj)` picks one). Language, role and theme are saved in `localStorage` inside try/catch.
* Simple words, sentences under 15 words, no jargon on public pages ("digital seal", not "SHA-256"; technical detail only in expanders or on the Integrity page).
* Mobile first (works at 360 px, no sideways page scroll), light and dark theme, keyboard friendly, `prefers-reduced-motion` respected.
* **Security:** never `innerHTML` with user or server text. Build elements with a helper `h(tag, attrs, ...children)` that uses `textContent`/text nodes. `innerHTML` only for trusted constants (icon paths, QR SVG made from numbers). CSP is `script-src 'self'`, so no inline scripts.

## 2. Files
`index.html`, `css/app.css`, `assets/logo.png` (+ `favicon.png`), `js/app.js` (shell + router), `js/dom.js` (h, icon, toast, sha256Hex, skeleton, copyText), `js/i18n.js` (state, T, LL, formatters), `js/api.js` (fetch wrapper, sends header `X-Demo-Role`), `js/qr.js`, `js/views/{ui,home,check,verify,registrar,mutation,bank,integrity,lab,about}.js`. Each view exports `default async function(params, ctx)` returning a DOM node. `ctx` has `onLeave(fn)`, `navigate(path)`, `rerender()`.

## 3. Design tokens (from the logo: deep green, gold, cream)
Light: bg `#f6f2e4`, surface `#fffdf6`, surface-2 `#f0ebd8`, ink `#10241a`, muted `#55675b`, line `#e0d9bf`, brand `#0f3a1f` (text on brand `#f6f2e4`), gold `#b8963c`, focus `#1d6b40`. Verdicts: green `#1c7a44` on `#e4f3ea`, amber `#94630a` on `#fbf0d0`, red `#a6301d` on `#fbe3dd`.
Dark (auto via `prefers-color-scheme`, or a toggle): bg `#09160f`, surface `#102017`, ink `#efe9d2`, brand becomes gold `#cfae52` with dark text `#0b1a10`; verdict colors lighten (`#6fd49a`, `#f0c25e`, `#ff9a85`) on dark tints.
Fonts: body "Hind Siliguri" (Bangla + Latin) with fallbacks "Noto Sans Bengali", "Nirmala UI", system-ui; headings "Fraunces" then Hind Siliguri then Georgia. Load from Google Fonts with `display=swap` and always keep fallbacks. Base 16 px, line height 1.65, tap targets at least 44 px, radius 14 to 24 px, soft shadows.
Verdicts always use **icon + text + color**, never color alone. Print stylesheet hides header, footer and buttons (so the Check page prints as a clean "title report").

## 4. Shell (on every page)
* Skip link; a thin gold "demo bar": "Demo: all data is synthetic. No real names, NID numbers or land records."
* Sticky blurred header: logo + "ভূমি লিপি / Bhumi Lipi"; nav of 8 links (Check, Verify, Registrar, Mutation, Bank, Integrity, Lab, About; current page highlighted with `aria-current`); a **Role** select (Citizen, Sub-registrar, AC Land, Bank); language button (EN / বাং); theme button.
* On phones the nav is a horizontally scrollable pill row under the header.
* Footer: project name, event, AI tool disclosure line, link to `/tools/verify_anchor.py`.
* Route change: scroll to top, focus `main` (no visible outline).

## 5. Router and states
Hash routes: `/` home, `/check` and `/check/:plot`, `/verify`, `/v/:hash64`, `/registrar`, `/mutation` and `/mutation/:tracking`, `/bank`, `/integrity`, `/lab`, `/about`. A pretty path like `/check/DHK-UTT-0142` is converted to the hash form on load.
Every page has: a skeleton while loading, an error card with a "Try again" button (message from the server's `bn/en`), and an empty state where lists can be empty. A stale async render must not overwrite a newer one (use a token).
Officer pages (Registrar, Bank, AC Land queue) show a **role gate** card when the role is wrong: "This page is for officers", a one-click button "Continue as <role>".

## 6. Microcopy
Verdict banner titles: green "Looks safe / নিরাপদ মনে হচ্ছে", amber "Proceed with caution / সাবধানে এগোন", red "High risk / ঝুঁকি অনেক বেশি". The sentence under it is `headline` from the API.
Verify results: GENUINE "Genuine deed / খাঁটি দলিল" (green), OUTDATED "Real, but outdated / আসল, কিন্তু পুরোনো" (amber), FORGED "Forged or altered / জাল বা বদলানো" (red), CHAIN_BROKEN "Record chain broken / রেকর্ড ভাঙা" (red).
Lab chips: "STOPPED / ঠেকানো গেছে" for the first four attacks, "CAUGHT / ধরা পড়েছে" for the insider attack (outcome `DETECTED`). Final banner "All 5 attacks were stopped or caught".
Dates and money use `Intl` with `bn-BD` or `en-GB` / `en-US`; money shows `৳ 1,200,000`.

## 7. Pages
**7.1 Home `/`.** Hero: eyebrow "LandTech 2026 · P2 + P3 + P5", H1 "Land papers. Now with proof." with its Bangla version, one-sentence lead, a big search box (plot number, monospace, "Check" button), five sample chips with a colored dot (DHK-UTT-0142 clean, DHK-GUL-0309 mutation pending, CTG-PAT-0120 rapid transfers, KHL-DUM-0033 khas, SYL-ZKJ-0210 bank lien), buttons "Scan QR or verify a deed" and "See the attack lab". Right side: a card showing the **real** 3-block history of `DHK-UTT-0143` as linked blocks with short seals, with a "SEALED ✓" stamp animation. Then 4 live stat cards from `GET /stats` (records sealed, chains verified x/y, fraud attempts stopped, mutations pending), "How it works" in 4 cards (Seal, Chain, Lock, Verify), "Who uses it" (8 groups from the hackathon brief), and two buttons.
**7.2 Check `/check`.** Search box plus a grid of all plots (`GET /plots`, each with a verdict dot, mouza, area, owner, "Locked" chip).
**7.3 Check `/check/:plot`.** Buttons: back, copy link, print/PDF. Plot id big in monospace + chips (mouza, area, Locked, Khas, Acquisition, Court case, Bank lien, "Seals verified" or "Seal broken"). Verdict banner. Two cards: owner + "Why this result" (reasons list with colored dots), and "What to do next" (advice list + "guidance, not a legal decision"). Cards: mutation status (chip + tracking link) and survey history table CS/SA/RS/BS (with a notice when areas differ). Ownership history timeline: each block shows kind (First registration / Sale / Reversed), from to, date, price, office, short seal, buttons "Verify seal" (to `/v/:hash`) and "Deed copy" (download `/api/deeds/:hash/document`).
**7.4 Verify `/verify` and `/v/:hash`.** Four tabs: Code / link (paste a 64-hex code or a link), Scan QR (camera via `BarcodeDetector`; if unsupported, say so and point to the paste tab; stop the camera when leaving the page), File (drop or choose; compute SHA-256 in the browser with `crypto.subtle`; the file never leaves the device; send only `doc_hash`), Try to cheat (button loads a sample deed text into a textarea; user edits one character; "Verify this text" hashes the text and verifies). Result card with the verdict banner and details (plot link, deed no, transfer, date, short seal). `/v/:hash` verifies automatically.
**7.5 Registrar `/registrar` (role registrar).** Form: plot select, seller (auto-filled with the plot's owner), buyer, price. Preset chips: Normal sale, Fake seller, Second sale, Very low price, Khas land. As the user types (300 ms debounce) call `POST /risk` and show a risk meter (0 to 100, LOW/MEDIUM/HIGH colors), the flag list and "Can be registered" / "Will be blocked". Submit calls `POST /deeds`. Success: green panel "Deed sealed" with a **QR code** (encodes `<origin>/#/v/<hash>`), the full seal under it, deed no, tracking link, mutation chip, risk, buttons Deed copy, Print seal, Link. Blocked (HTTP 409): red panel with the reasons in the current language. Right card: recent alerts (`GET /alerts`).
**7.6 Mutation `/mutation` and `/mutation/:tracking`.** Search by tracking id. For roles ac_land and registrar also a table of pending applications (`GET /mutations/queue`). Detail page: tracking id + state chip, banner with plot, from to, price; a 4-step timeline (Submitted, Automatic checks, Checks passed or Officer review, Approved or Rejected) with times and actors; the 8 automatic checks as a check/cross list. For role ac_land and a pending state: a note box and two buttons "Approve (unlock land)" and "Reject (reverse sale)"; show the server's error (for example note required). For other roles show "Choose the role AC Land to decide".
**7.7 Bank `/bank` (role bank).** Form to place a lien (plot, bank name, amount) with errors shown (DOUBLE_MORTGAGE, LOCKED, GOV_LAND) and a list of active liens with a Release button.
**7.8 Integrity `/integrity`.** Big banner "All records intact" or "Problem detected" with counts (chains valid x/y, anchors checked, match or mismatch). Cards: today's public anchor (Merkle root, record count, time, copy button); "Prove a record is in the anchor" (input prefilled with a real seal; calls `GET /anchor/proof/:hash`; **verifies the proof in the browser** with Web Crypto using leaf = SHA256(0x00 || hash), node = SHA256(0x01 || left || right); shows "Proof is valid ✓" or a mismatch); "Verify it yourself" steps with links to `/api/export` and `/tools/verify_anchor.py`; per-plot chain status table; office public keys.
**7.9 Lab `/lab`.** Button "Run all attacks" calls `POST /lab/run`. Shows five cards revealed one by one (title, what the attacker did, "Stopped by"/"Caught by" control line, small technical detail, chip) then a summary banner, then a card "Why the last attack matters" (re-signed history still looks valid but the published Merkle root no longer matches: detection, not prevention).
**7.10 About `/about`.** The five-step lifecycle chips; the five-country table (country, technology, their gap, our improvement); "Honest limits" list; data/tech/AI disclosure card.

## 8. QR encoder (`js/qr.js`, own implementation, no library)
Byte mode (UTF-8), error correction level M, versions 1 to 10 (pick the smallest that fits; throw if too long), Reed-Solomon over GF(256) with polynomial 0x11D, block interleaving, finder/timing/alignment patterns, format bits (BCH, mask 0x5412), version bits for version 7 and up, all 8 masks scored with the standard penalty rules. `qrSvg(text)` returns an SVG string with a 4-module quiet zone, white background, dark green modules. **Verify it by decoding** rendered matrices with OpenCV `QRCodeDetector` for texts of length 2, 19, 70, 100, 200 characters, including Bangla.

## 9. Browser test story (also the demo order)
Home loads, sample chips open verdicts (green, amber, red) · Verify: sample deed is Genuine, one changed character is Forged · Registrar: Fake seller is blocked with a reason, Normal sale seals and shows a QR that decodes to the seal link, the link verifies as Genuine, the plot is now Amber · AC Land approves, plot is Green · Bank: second mortgage is blocked · Integrity: all intact, proof is valid · Lab: 5 chips, "All 5" banner · Bangla switch, dark mode on a 390 px viewport with no sideways scroll, no console errors (except intentional 409 responses).

## 10. Quality bar
Lighthouse mobile: Performance 90+, Accessibility 95+. Landing page without images except the small logo. Every form control has a label. Focus ring visible. Text contrast at least 4.5:1.

## 11. Exact labels, ids and classes the browser test relies on (English UI)
`tests/e2e_playwright.py` finds things by these. Keep them exactly.
* Role select `id="role"` (values `citizen`, `registrar`, `ac_land`, `bank`); language button `aria-label="Switch language"`.
* Classes: `verdict` with a color class (`green`, `amber`, `red`, `forged`), `chip` with `green`, `qrbox` (wrapping the QR `svg`), `card` (a plot card on `/check` is an `<a class="card">`), `timeline`, `tabs`.
* Home: an `h1` containing "Land papers"; a sample chip button with the text "Clean plot". Clicking it opens `/check/DHK-UTT-0142` whose banner text contains "genuine".
* Verify: a tab whose name matches /cheat/i ("Try to cheat"), a button "Load sample deed", a textarea, a button "Verify this text"; results use `verdict green` containing "Genuine" and `verdict forged` containing "Forged".
* Registrar: select `id="plot"`, input `id="seller"`; buttons "Normal sale", "Fake seller", "Register and seal"; a blocked sale shows `verdict red` containing "blocked"; success shows `.qrbox svg` and a link whose href starts with `#/mutation/MUT-`.
* Mutation detail: a button "Approve (unlock land)"; after approval the banner contains "approved".
* Bank: select `id="bp"`; a button "Register lien"; a second mortgage shows `verdict red` containing "already mortgaged".
* Integrity: the first `verdict green` contains "intact"; a button "Verify proof"; afterwards the last `verdict green` contains "valid".
* Lab: a button "Run all attacks"; afterwards exactly five `chip green` and a `verdict green` containing "All 5".

## 12. Simple mode (for every age and skill level) [BUILT]
* **Controls in the header:** a text-size button (cycles 100%, 125%, 150%; id `sizebtn`, attribute `data-size`) and a high-contrast toggle (id `contrastbtn`, sets `data-contrast="high"` on `html`). Saved in localStorage. Text size scales the whole app through the CSS variable `--scale` applied to `body`.
* **Three-word verdict** shown inside the verdict banner (class `threeword`): green shield "এগোন / Go ahead", amber triangle "সাবধান / Careful", red octagon "থামুন / Stop". Color is never the only signal.
* **Simple view (default for the Citizen role)** on `/check/:plot`: shows the verdict banner, the big buttons, owner, reasons, advice and the share calculator. Everything marked `detail` (chips, mutation, survey, history) is hidden until "Full details" (button id `viewtoggle`). The choice is saved. The banner keeps class `verdict` so tests still find it.
* **Big buttons:** Listen, Print, Share (only when `navigator.share` exists), Full details / Simple view.
* **Listen ("শুনুন / Listen")**: reads a short Bangla summary with `speechSynthesis` using a `bn-*` voice. The button is **hidden when the device has no Bangla voice** and never plays by itself; speech stops when the user leaves the page. The same button appears on Verify results.
* **Ana-gonda calculator** (`details.agcalc`, inputs `ag-ana`, `ag-gonda`, `ag-kora`, `ag-kranti`): 16 ana = the whole; 1 ana = 20 gonda; 1 gonda = 4 kora; 1 kora = 3 kranti. Shows the share in percent and in decimal (shotok) of the plot's area. More than 16 ana is refused politely. Always labelled "an estimate, not a legal document". The maths lives in `web/js/a11y.js`, which must export `shareFraction({ana,gonda,kora,kranti})` (fraction of the whole, negative or non-numeric input counts as 0), `shareToDecimal(parts, areaDecimal)` and `KRANTI_IN_WHOLE` (= 3840); `tests/test_frontend_math.py` checks them with Node. The same module exports the read-aloud helpers `watchBanglaVoice`, `speakBangla` and `stopSpeaking`.
* **Mutation aging chip** on the tracker and in the officer queue: "Waiting N days / অপেক্ষমাণ N দিন" (amber from 14 days, red from 30; "Took N days" after a decision).
* **CSS rule:** `[hidden] { display: none !important; }` so a class that sets `display` can never un-hide an element.
