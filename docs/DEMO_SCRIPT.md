# 3-minute demo video script
Setup: run `python server.py`, open http://127.0.0.1:8000 in a 1080p window, language **Bangla** for narration (switch to English for subtitles). Role: Citizen. Run `python tools/make_demo_files.py` first.

| Time | On screen | Say (Bangla, short) |
|---|---|---|
| 0:00–0:20 | Home page | "জাল দলিল আর একই জমি দুইবার বিক্রি, বাংলাদেশের ভূমি বিরোধের বড় কারণ। ভূমি লিপি প্রতিটি দলিলকে ডিজিটাল সিল দেয়।" |
| 0:20–0:50 | Role → Sub-registrar. Registrar page, **Normal sale** → Register and seal. QR appears | "রেজিস্ট্রার দলিল নিবন্ধন করলে সিল আর QR তৈরি হয়। জমি নিজে থেকেই লক হয়ে যায়।" |
| 0:50–1:20 | **Fake seller** → blocked with reason. Then **Second sale** → blocked | "জাল বিক্রেতা বা দ্বিতীয় বিক্রি সঙ্গে সঙ্গে আটকে যায়, কারণসহ।" |
| 1:20–1:50 | Role → Citizen. Check page for DHK-GUL-0309 (amber) and KHL-DUM-0033 (red). Use phone-width window if possible | "ক্রেতা ফোনে প্লট নম্বর দিলেই সবুজ, হলুদ বা লাল ফলাফল পান, সহজ বাংলায়।" |
| 1:50–2:15 | Verify → drop `genuine_deed.txt` (GENUINE) then `tampered_deed.txt` (FORGED) | "একটি সংখ্যা বদলালেই দলিল জাল ধরা পড়ে।" |
| 2:15–2:40 | Role → AC Land, open the new tracking ID, **Approve**. Plot turns green. Then Integrity page and **Verify proof** | "নামজারি অনুমোদন হলে জমি আনলক। পাবলিক অ্যাংকর দিয়ে যে কেউ নিজে যাচাই করতে পারেন।" |
| 2:40–3:00 | Attack lab → Run all attacks → "All 5 stopped or caught", then logo | "পাঁচটি আক্রমণ চালিয়ে দেখালাম। ভূমি লিপি: জমির কাগজ, প্রমাণসহ।" |

Tips: record at 1080p, one take per segment, show the URL once, add English subtitles, keep it under 3:00. Pre-warm the live link (open it 5 minutes before recording).
